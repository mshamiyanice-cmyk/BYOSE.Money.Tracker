
import React, { useState, useEffect } from 'react';
// Use compat import to resolve firebase.User type and property access errors
import firebase from 'firebase/compat/app';
import { auth, db } from '../services/firebase';
import { UserProfile } from '../types';
import { Button } from './ui/button';
import { User as UserIcon, Mail, Calendar, Trash2, Save, LogOut, ShieldCheck, UserCircle, X, Image as ImageIcon, Fingerprint } from 'lucide-react';

interface ProfileProps {
  user: firebase.User;
  profile: UserProfile | null;
  onUpdate: (profile: UserProfile) => void;
}

const Profile: React.FC<ProfileProps> = ({ user, profile, onUpdate }) => {
  const [name, setName] = useState(profile?.name || user.displayName || '');
  const [photoFileName, setPhotoFileName] = useState(profile?.photoFileName || 'default_avatar.png');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');

  const isAdmin = ['mshamiyanice@gmail.com', 'gakundohope5@gmail.com'].includes(user.email || '');

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setPhotoFileName(profile.photoFileName);
    }
  }, [profile]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // Update Firebase Auth Display Name using v8 user instance method
      await user.updateProfile({ displayName: name });

      // Update the authoritative Firestore document using v8 syntax
      const userDocRef = db.collection('users').doc(user.uid);
      const updatedFields = {
        name: name,
        photoFileName: photoFileName
      };
      await userDocRef.update(updatedFields);

      // Sync local state to reflect changes instantly in the UI
      if (profile) {
        onUpdate({ ...profile, ...updatedFields });
      }

      setSuccess('Your profile has been successfully updated.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err: any) {
      console.error(err);
      setError('An error occurred while updating your profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      setError('A password is required to verify account deletion.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Use v8 compatible EmailAuthProvider
      const credential = firebase.auth.EmailAuthProvider.credential(user.email!, deletePassword);
      // Use v8 user instance method for reauthentication
      await user.reauthenticateWithCredential(credential);

      // Delete the Firestore data first using v8 syntax
      await db.collection('users').doc(user.uid).delete();
      // Use v8 user instance method for deletion
      await user.delete();
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/wrong-password') {
        setError('The password provided is incorrect.');
      } else {
        setError('Account deletion failed. Try signing out and signing back in first.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Use v8 compatible signOut on auth instance
      await auth.signOut();
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">
      <div className="bg-white rounded-[40px] shadow-2xl border border-slate-100 overflow-hidden relative">
        {/* Banner Section */}
        <div className="h-48 bg-gradient-to-br from-[#165b4c] via-slate-800 to-slate-900 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent animate-pulse"></div>

          <div className="absolute -bottom-20 left-12 p-3 bg-white rounded-[40px] shadow-2xl border border-slate-50">
            <div className="w-40 h-40 rounded-[32px] bg-slate-100 flex items-center justify-center overflow-hidden border-4 border-white group relative shadow-inner">
              <UserCircle size={100} className="text-[#165b4c] transition-transform group-hover:scale-110 duration-500" />
              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 backdrop-blur-[2px]">
                <ImageIcon size={24} className="text-white mb-2" />
                <p className="text-[10px] text-white font-black uppercase tracking-[0.2em] text-center px-4">
                  {photoFileName}
                </p>
              </div>
            </div>
          </div>

          <div className="absolute top-8 right-8">
            <div className={`px-5 py-2.5 rounded-2xl border-2 flex items-center gap-3 backdrop-blur-xl shadow-lg ${isAdmin ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-50' : 'bg-blue-500/20 border-blue-400/30 text-blue-50'
              }`}>
              {isAdmin ? <ShieldCheck size={18} /> : <UserIcon size={18} />}
              <span className="text-xs font-black uppercase tracking-[0.15em]">{isAdmin ? 'System Administrator' : 'Financial Analyst'}</span>
            </div>
          </div>
        </div>

        <div className="pt-28 px-12 pb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12">
            <div>
              <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-2">
                {profile?.name || user.displayName || 'BYOSE Tech Member'}
              </h1>
              <div className="flex flex-wrap gap-4">
                <p className="text-slate-500 font-bold flex items-center gap-2.5 text-sm bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                  <Mail size={16} className="text-[#165b4c]" />
                  {user.email}
                </p>
                <p className="text-slate-400 font-bold flex items-center gap-2.5 text-sm bg-slate-50 px-4 py-2 rounded-xl border border-slate-100">
                  <Fingerprint size={16} />
                  ID: {user.uid.slice(0, 8)}...
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="px-8 py-3.5 bg-white text-slate-600 font-black rounded-2xl border-2 border-slate-200 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all flex items-center gap-3 shadow-sm active:scale-95"
            >
              <LogOut size={20} />
              Terminate Session
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-5 gap-12">
            <div className="xl:col-span-3 space-y-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-1 h-6 bg-[#165b4c] rounded-full"></div>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.25em]">Account Credentials</h3>
              </div>

              <form onSubmit={handleUpdate} className="space-y-6">
                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Full Legal Name</label>
                  <div className="relative group">
                    <input
                      type="text"
                      required
                      className="w-full px-6 py-4 pl-14 bg-slate-50 border-2 border-slate-100 rounded-[24px] focus:ring-4 focus:ring-[#165b4c]/10 focus:border-[#165b4c] outline-none transition-all text-slate-900 font-bold text-lg"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter full name"
                    />
                    <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#165b4c] transition-colors" size={22} />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-1">Identity Image Identifier</label>
                  <div className="relative group">
                    <input
                      type="text"
                      required
                      className="w-full px-6 py-4 pl-14 bg-slate-50 border-2 border-slate-100 rounded-[24px] focus:ring-4 focus:ring-[#165b4c]/10 focus:border-[#165b4c] outline-none transition-all text-slate-900 font-bold text-lg"
                      value={photoFileName}
                      onChange={(e) => setPhotoFileName(e.target.value)}
                      placeholder="e.g., avatar_finance.png"
                    />
                    <ImageIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#165b4c] transition-colors" size={22} />
                  </div>
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-16 text-xl font-black rounded-[24px] shadow-2xl shadow-[#165b4c]/30 hover:shadow-[#165b4c]/40 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                  >
                    {loading ? <i className="fas fa-circle-notch fa-spin"></i> : <Save size={24} />}
                    Synchronize Profile
                  </Button>
                  {success && (
                    <div className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3 text-emerald-700 font-bold text-sm animate-in fade-in slide-in-from-top-2">
                      <ShieldCheck size={18} />
                      {success}
                    </div>
                  )}
                  {error && !showDeleteConfirm && (
                    <div className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-600 font-bold text-sm">
                      <X size={18} />
                      {error}
                    </div>
                  )}
                </div>
              </form>
            </div>

            <div className="xl:col-span-2 space-y-8">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-1 h-6 bg-slate-300 rounded-full"></div>
                <h3 className="text-sm font-black text-slate-400 uppercase tracking-[0.25em]">Audit Log Info</h3>
              </div>

              <div className="space-y-4">
                <div className="p-8 bg-slate-50 rounded-[32px] border-2 border-slate-100 flex items-center gap-6 hover:bg-white hover:shadow-xl hover:border-slate-200 transition-all group">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-[#165b4c] shadow-md border border-slate-100 group-hover:scale-110 transition-transform">
                    <Mail size={32} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Authenticated Email</p>
                    <p className="text-base font-black text-slate-800 truncate">{user.email}</p>
                  </div>
                </div>

                <div className="p-8 bg-slate-50 rounded-[32px] border-2 border-slate-100 flex items-center gap-6 hover:bg-white hover:shadow-xl hover:border-slate-200 transition-all group">
                  <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-[#165b4c] shadow-md border border-slate-100 group-hover:scale-110 transition-transform">
                    <Calendar size={32} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Registration Date</p>
                    <p className="text-base font-black text-slate-800">
                      {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Pending Sync'}
                    </p>
                  </div>
                </div>

                <div className="p-6 bg-slate-900 rounded-[32px] border-2 border-slate-800 flex items-center gap-6">
                  <div className="w-12 h-12 bg-[#165b4c] rounded-xl flex items-center justify-center text-white shadow-lg">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">System Status</p>
                    <p className="text-sm font-bold text-emerald-400">Account Verified & Active</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-rose-50/40 rounded-[40px] border-4 border-dashed border-rose-100 p-12 transition-colors hover:bg-rose-50/60 group">
        <div className="flex flex-col md:flex-row items-center justify-between gap-10">
          <div className="flex items-center gap-8">
            <div className="w-20 h-20 bg-rose-100 text-rose-600 rounded-[32px] flex items-center justify-center shadow-xl group-hover:scale-105 transition-transform">
              <Trash2 size={40} />
            </div>
            <div className="text-center md:text-left">
              <h3 className="text-2xl font-black text-rose-900 tracking-tight">Decommission Account</h3>
              <p className="text-rose-700/80 font-bold max-w-sm mt-1 leading-relaxed">Permanently erase your identity document from BYOSE TECH servers and delete your login.</p>
            </div>
          </div>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-10 py-4 bg-rose-600 text-white font-black rounded-2xl hover:bg-rose-700 transition-all shadow-2xl shadow-rose-200 active:scale-95 flex items-center gap-3"
          >
            Delete Permanently
          </button>
        </div>
      </div>

      {/* Re-authentication Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-[200] flex items-center justify-center p-6 animate-in fade-in duration-500">
          <div className="bg-white rounded-[48px] shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] max-w-md w-full p-12 animate-in zoom-in-95 slide-in-from-bottom-8 duration-500 border border-slate-100">
            <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner border border-rose-100">
              <Trash2 size={48} className="text-rose-500" />
            </div>
            <h3 className="text-3xl font-black text-slate-900 text-center mb-4 tracking-tight">Confirm Deletion</h3>
            <p className="text-slate-500 text-center font-bold text-sm mb-10 leading-relaxed px-4">
              Warning: This will remove your user document from Firestore. You must re-authenticate with your password to confirm identity.
            </p>

            <div className="space-y-6">
              <div>
                <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 ml-2">Verification Password</label>
                <input
                  type="password"
                  className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-[24px] outline-none focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 transition-all font-bold text-lg text-center"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>

              {error && <p className="text-rose-600 text-sm font-black text-center bg-rose-50 py-3 rounded-xl animate-shake">{error}</p>}

              <div className="flex flex-col gap-4 pt-4">
                <button
                  onClick={handleDeleteAccount}
                  disabled={loading}
                  className="w-full h-16 bg-rose-600 text-white font-black rounded-[24px] shadow-2xl shadow-rose-200 hover:bg-rose-700 transition-all active:scale-[0.98] flex items-center justify-center gap-3"
                >
                  {loading ? <i className="fas fa-circle-notch fa-spin"></i> : "Confirm Destruction"}
                </button>
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); setError(''); }}
                  className="w-full h-16 bg-slate-50 text-slate-500 font-black rounded-[24px] hover:bg-slate-100 transition-all flex items-center justify-center gap-3 border border-slate-200"
                >
                  Return to Profile
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
