
import { auth, db, COMPANY_ID } from './services/firebase';
import { generateUUID } from './lib/utils';
import firebase from 'firebase/compat/app';
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Inflow, Outflow, Overdraft, UserProfile } from './types';
import Dashboard from './components/Dashboard';
import CalendarView from './components/CalendarView';
import InflowManager from './components/InflowManager';
import OutflowManager from './components/OutflowManager';
import OverdraftManager from './components/OverdraftManager';
import FlowTracker from './components/FlowTracker';
import BankAccounts from './components/BankAccounts';
import UnifiedLedger from './components/UnifiedLedger';
import Sidebar from './components/Sidebar';
import Auth from './components/AnimatedLogin';
import AnimatedSignUp from './components/AnimatedSignUp';
import Profile from './components/Profile';

import { Menu, LogOut } from 'lucide-react';

const ADMIN_EMAILS = ['mshamiyanice@gmail.com', 'gakundohope5@gmail.com'];

const App: React.FC = () => {
  const [user, setUser] = useState<firebase.User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [inflows, setInflows] = useState<Inflow[]>([]);
  const [outflows, setOutflows] = useState<Outflow[]>([]);
  const [overdrafts, setOverdrafts] = useState<Overdraft[]>([]);

  const isAdmin = user ? ADMIN_EMAILS.includes(user.email || '') : false;

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser && currentUser.emailVerified) {
        setUser(currentUser);
        await syncUserProfile(currentUser);
      } else {
        setUser(null);
        setProfile(null);
        setInflows([]);
        setOutflows([]);
        setOverdrafts([]);
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.uid) return;

    // Switch to Shared Company Ledger
    // const userRef = db.collection('users').doc(user.uid); -> OLD
    const companyRef = db.collection('companies').doc('byose_tech_main'); // Hardcoded ID matching firebase.ts export

    const unsubInflows = companyRef.collection('inflows').orderBy('date', 'desc').onSnapshot(snapshot => {
      setInflows(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Inflow)));
    });
    const unsubOutflows = companyRef.collection('outflows').orderBy('date', 'desc').onSnapshot(snapshot => {
      setOutflows(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Outflow)));
    });
    const unsubOverdrafts = companyRef.collection('overdrafts').orderBy('date', 'desc').onSnapshot(snapshot => {
      setOverdrafts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Overdraft)));
    });
    return () => { unsubInflows(); unsubOutflows(); unsubOverdrafts(); };
  }, [user?.uid]);

  const syncUserProfile = async (firebaseUser: firebase.User) => {
    try {
      // User Profiles remain personal
      const userDocRef = db.collection('users').doc(firebaseUser.uid);
      const userDoc = await userDocRef.get();
      if (userDoc.exists) {
        setProfile(userDoc.data() as UserProfile);
      } else {
        const profileData: UserProfile = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || 'BYOSE Tech Member',
          email: firebaseUser.email || '',
          photoFileName: 'default_avatar.png',
          createdAt: new Date().toISOString()
        };
        await userDocRef.set(profileData);
        setProfile(profileData);
      }
    } catch (err) { console.error(err); }
  };

  const handleLogout = async () => { try { await auth.signOut(); } catch (err) { console.error(err); } };

  const addInflow = async (inflow: Inflow) => {
    if (!isAdmin || !user) return;
    await db.collection('companies').doc('byose_tech_main').collection('inflows').doc(inflow.id).set(inflow);
  };

  const updateInflow = async (updatedInflow: Inflow) => {
    if (!isAdmin || !user) return;
    await db.collection('companies').doc('byose_tech_main').collection('inflows').doc(updatedInflow.id).update(updatedInflow as any);
  };

  const updateOutflow = async (updatedOutflow: Outflow) => {
    if (!isAdmin || !user) return;
    const companyRef = db.collection('companies').doc('byose_tech_main');
    const outflowRef = companyRef.collection('outflows').doc(updatedOutflow.id);

    try {
      await db.runTransaction(async (transaction) => {
        const outflowDoc = await transaction.get(outflowRef);
        if (!outflowDoc.exists) throw new Error("Outflow document does not exist!");

        const oldOutflow = outflowDoc.data() as Outflow;

        // Case 1: Fund Source (Inflow) Changing
        if (oldOutflow.inflowId !== updatedOutflow.inflowId) {
          const oldInflowRef = companyRef.collection('inflows').doc(oldOutflow.inflowId);
          const newInflowRef = companyRef.collection('inflows').doc(updatedOutflow.inflowId);

          const oldInflowDoc = await transaction.get(oldInflowRef);
          const newInflowDoc = await transaction.get(newInflowRef);

          if (!oldInflowDoc.exists || !newInflowDoc.exists) throw new Error("One of the fund sources does not exist!");

          const oldInflow = oldInflowDoc.data() as Inflow;
          const newInflow = newInflowDoc.data() as Inflow;

          // Refund the old source completely
          transaction.update(oldInflowRef, { remainingBalance: oldInflow.remainingBalance + oldOutflow.amount });

          // Deduct from the new source
          transaction.update(newInflowRef, { remainingBalance: newInflow.remainingBalance - updatedOutflow.amount });

        } else {
          // Case 2: Same Fund Source, amount might have changed
          const inflowRef = companyRef.collection('inflows').doc(oldOutflow.inflowId);
          const inflowDoc = await transaction.get(inflowRef);
          if (!inflowDoc.exists) throw new Error("Fund source does not exist!");

          const inflowData = inflowDoc.data() as Inflow;

          // Logic: If old was 100, new is 150. Diff is -50. Balance + (-50) = Balance - 50. Correct.
          // Logic: If old was 100, new is 50. Diff is 50. Balance + 50. Correct.
          const balanceCorrection = oldOutflow.amount - updatedOutflow.amount;
          transaction.update(inflowRef, { remainingBalance: inflowData.remainingBalance + balanceCorrection });
        }

        // Finally update the outflow itself
        // Ensure no undefined fields are passed using JSON stringify/parse which strips undefineds
        const sanitizeOutflow = (data: Outflow) => {
          return JSON.parse(JSON.stringify(data));
        };

        transaction.update(outflowRef, sanitizeOutflow(updatedOutflow));
      });
      // alert("Expense updated successfully!");
    } catch (error) {
      console.error("Update failed: ", error);
      alert("Failed to update expense: " + error);
    }
  };

  const recalculateInflowBalance = async (inflowId: string) => {
    if (!isAdmin || !user) return;
    const companyRef = db.collection('companies').doc('byose_tech_main');
    const inflowRef = companyRef.collection('inflows').doc(inflowId);

    try {
      const outflowSnaps = await companyRef.collection('outflows').where('inflowId', '==', inflowId).get();
      const totalOut = outflowSnaps.docs.reduce((acc, doc) => acc + (doc.data() as Outflow).amount, 0);

      const inflowDoc = await inflowRef.get();
      if (inflowDoc.exists) {
        const inf = inflowDoc.data() as Inflow;
        // Balance = Initial Amount - Sum of Outflows
        await inflowRef.update({ remainingBalance: inf.amount - totalOut });
        alert(`Recalculated! Total Out: ${totalOut.toLocaleString()}. New Balance: ${(inf.amount - totalOut).toLocaleString()}`);
      }
    } catch (err) {
      console.error(err);
      alert("Recalculation failed");
    }
  };

  const addOutflow = async (outflow: Outflow) => {
    if (!isAdmin || !user) return;
    const companyRef = db.collection('companies').doc('byose_tech_main');
    const inflowRef = companyRef.collection('inflows').doc(outflow.inflowId);

    try {
      await db.runTransaction(async (transaction) => {
        const inflowDoc = await transaction.get(inflowRef);
        if (!inflowDoc.exists) {
          throw new Error("Source inflow does not exist!");
        }

        const inflowData = inflowDoc.data() as Inflow;

        let newBalance = inflowData.remainingBalance - outflow.amount;

        // SMART OVERDRAFT LOGIC
        if (newBalance < 0) {
          const overdraftAmount = Math.abs(newBalance);
          newBalance = 0; // Floor at 0

          // Auto-create Overdraft Record
          const overdraftRef = companyRef.collection('overdrafts').doc(); // Auto-ID or generateUUID()
          const newOverdraft: Overdraft = {
            id: overdraftRef.id,
            amount: overdraftAmount,
            date: outflow.date,
            seller: outflow.seller,
            purpose: `Overdraft: ${outflow.purpose}`, // Required field
            notes: `Auto-Overdraft from: ${outflow.purpose} (${outflow.category})`,
            isSettled: false,
            createdAt: new Date().toISOString()
          };

          transaction.set(overdraftRef, newOverdraft);
        }

        transaction.update(inflowRef, { remainingBalance: newBalance });

        // Use sanitizeOutflow helper to remove undefined fields
        const sanitizeOutflow = (data: Outflow) => {
          const clean = { ...data };
          Object.keys(clean).forEach(key => clean[key as keyof Outflow] === undefined && delete clean[key as keyof Outflow]);
          return clean;
        };

        transaction.set(companyRef.collection('outflows').doc(outflow.id), sanitizeOutflow(outflow));
      });
    } catch (error) {
      console.error("Transaction failed: ", error);
      alert("Failed to record expense: " + error);
    }
  };

  // ... existing code ...



  const addOverdraft = async (overdraft: Overdraft) => {
    if (!isAdmin || !user) return;
    await db.collection('companies').doc('byose_tech_main').collection('overdrafts').doc(overdraft.id).set(overdraft);
  };

  const updateOverdraft = async (updatedOverdraft: Overdraft) => {
    if (!isAdmin || !user) return;
    await db.collection('companies').doc('byose_tech_main').collection('overdrafts').doc(updatedOverdraft.id).update(updatedOverdraft as any);
  };

  const settleOverdraft = async (overdraftId: string, inflowId: string) => {
    if (!isAdmin || !user) return;
    const od = overdrafts.find(o => o.id === overdraftId);
    if (!od) return;

    // Check if Inflow exists and has balance
    const companyRef = db.collection('companies').doc(COMPANY_ID);
    const inflowRef = companyRef.collection('inflows').doc(inflowId);
    const infDoc = await inflowRef.get();

    if (infDoc.exists) {
      const infData = infDoc.data() as Inflow;

      // Calculate how much we can pay
      // We can pay up to the Inflow's remaining balance
      const maxPayable = infData.remainingBalance;

      if (maxPayable <= 0) {
        alert("Selected inflow has no funds available.");
        return;
      }

      // The actual payment is the lesser of: The Debt Amount vs The Available Funds
      const paymentAmount = Math.min(od.amount, maxPayable);

      // 1. Deduct from Inflow
      await inflowRef.update({ remainingBalance: infData.remainingBalance - paymentAmount });

      // 2. Log Outflow for this payment
      await companyRef.collection('outflows').add({
        id: generateUUID(),
        date: new Date().toISOString().split('T')[0],
        purpose: paymentAmount < od.amount ? `Partial Settle: ${od.purpose}` : `Settle: ${od.purpose}`,
        category: 'Misc',
        amount: paymentAmount,
        seller: od.seller,
        inflowId: inflowId,
        expenseName: 'Overdraft Settle'
      });

      // 3. Update Overdraft
      const remainingDebt = od.amount - paymentAmount;

      if (remainingDebt <= 0) {
        // Fully Settled
        await companyRef.collection('overdrafts').doc(overdraftId).update({
          amount: 0, // Visual clearance
          isSettled: true,
          settledWithInflowId: inflowId
        });
      } else {
        // Partially Settled - update amount to reflect remaining debt
        await companyRef.collection('overdrafts').doc(overdraftId).update({
          amount: remainingDebt
          // Keep isSettled false
        });
      }
    }
  };

  const deleteInflow = async (id: string) => {
    if (!isAdmin || !user) return;
    await db.collection('companies').doc('byose_tech_main').collection('inflows').doc(id).delete();
  };

  const deleteOutflow = async (id: string) => {
    if (!isAdmin || !user) return;

    // Optimistic UI update could go here, but for now we rely on Snapshot

    const companyRef = db.collection('companies').doc('byose_tech_main');
    const outflowRef = companyRef.collection('outflows').doc(id);

    try {
      await db.runTransaction(async (transaction) => {
        const outDoc = await transaction.get(outflowRef);
        if (!outDoc.exists) return; // Already deleted

        const out = outDoc.data() as Outflow;
        const inflowRef = companyRef.collection('inflows').doc(out.inflowId);
        const infDoc = await transaction.get(inflowRef);

        if (infDoc.exists) {
          const infData = infDoc.data() as Inflow;
          transaction.update(inflowRef, { remainingBalance: infData.remainingBalance + out.amount });
        }

        transaction.delete(outflowRef);
      });
    } catch (error) {
      console.error("Delete failed: ", error);
      alert("Failed to delete expense: " + error);
    }
  };

  const deleteOverdraft = async (id: string) => {
    if (!isAdmin || !user) {
      alert("Delete failed: Not authorized.");
      return;
    }

    try {
      const overdraftRef = db.collection('companies').doc('byose_tech_main').collection('overdrafts').doc(id);
      const doc = await overdraftRef.get();
      if (!doc.exists) {
        alert("Delete failed: Document does not exist.");
        return;
      }

      const od = doc.data() as Overdraft;

      // If settled, attempt refund by finding the associated payment outflow
      if (od.isSettled && od.settledWithInflowId) {
        // Find outflows that look like this settlement
        const potentialOutflows = await db.collection('companies').doc('byose_tech_main').collection('outflows')
          .where('inflowId', '==', od.settledWithInflowId)
          .where('seller', '==', od.seller)
          .where('expenseName', '==', 'Overdraft Settle')
          .get();

        if (!potentialOutflows.empty) {
          // Found matching payment records (likely just one)
          // Delete them to refund the pot using existing logic
          for (const outDoc of potentialOutflows.docs) {
            await deleteOutflow(outDoc.id);
          }
          // alert("Refund processed.");
        } else {
          // alert("No associated payment found to refund.");
        }
      }

      await overdraftRef.delete();
      alert("Overdraft deleted successfully.");
    } catch (e) {
      console.error("Error in deleteOverdraft:", e);
      alert("Error in App.tsx deleteOverdraft: " + e);
      throw e; // Re-throw to trigger the catch block in the UI component
    }
  };

  if (authLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-12 h-12 border-4 border-[#165b4c] border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <Router>
      <div className="flex min-h-screen bg-slate-50 text-slate-900">
        <Routes>
          <Route path="/login" element={!user ? <Auth /> : <Navigate to="/" />} />
          <Route path="/signup" element={!user ? <AnimatedSignUp /> : <Navigate to="/" />} />

          <Route path="/*" element={
            user ? (
              <>
                <Sidebar
                  userEmail={user.email} inflows={inflows} overdrafts={overdrafts} isAdmin={isAdmin} profile={profile}
                  isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)}
                />
                <main className="flex-1 lg:ml-64 p-4 md:p-8 pt-24 lg:pt-8">
                  <div className="lg:hidden fixed top-0 left-0 right-0 h-20 bg-white border-b z-50 flex items-center justify-between px-6">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-600"><Menu size={28} /></button>
                    <div className="flex flex-col items-center"><span className="text-xs font-black tracking-widest text-[#165b4c]">BYOSE</span></div>
                    <button onClick={handleLogout} className="p-2 text-rose-500"><LogOut size={24} /></button>
                  </div>

                  <Routes>
                    <Route path="/" element={<Dashboard inflows={inflows} outflows={outflows} />} />
                    <Route path="/ledger" element={<UnifiedLedger inflows={inflows} outflows={outflows} overdrafts={overdrafts} />} />
                    <Route path="/calendar" element={<CalendarView inflows={inflows} outflows={outflows} />} />
                    <Route path="/inflows" element={<InflowManager inflows={inflows} onAdd={addInflow} onUpdate={updateInflow} onDelete={deleteInflow} isAdmin={isAdmin} onRepay={() => { }} onRecalculate={recalculateInflowBalance} />} />
                    <Route path="/outflows" element={<OutflowManager inflows={inflows} outflows={outflows} onAdd={addOutflow} onUpdate={updateOutflow} onDelete={deleteOutflow} isAdmin={isAdmin} />} />
                    <Route path="/overdrafts" element={<OverdraftManager inflows={inflows} overdrafts={overdrafts} onAdd={addOverdraft} onUpdate={updateOverdraft} onSettle={settleOverdraft} onDelete={deleteOverdraft} isAdmin={isAdmin} />} />
                    <Route path="/banks" element={<BankAccounts inflows={inflows} outflows={outflows} />} />
                    <Route path="/tracker" element={<FlowTracker inflows={inflows} outflows={outflows} />} />

                    <Route path="/profile" element={<Profile user={user} profile={profile} onUpdate={setProfile} />} />
                    <Route path="*" element={<Navigate to="/" />} />
                  </Routes>
                </main>
              </>
            ) : <Navigate to="/login" />
          } />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
