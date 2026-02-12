import React, { useState, useEffect, useRef } from 'react';
import { Inflow } from '../types';
import { Calendar } from './ui/Calendar';
// Removed parseISO as it was reported as missing from date-fns exports
import { format } from 'date-fns';
import { Button } from './ui/button';
import { generateUUID } from '../lib/utils';
import { Landmark, Smartphone, CreditCard, StickyNote, Pencil } from 'lucide-react';

interface InflowManagerProps {
  inflows: Inflow[];
  onAdd: (inflow: Inflow) => void;
  onUpdate: (inflow: Inflow) => void;
  onDelete: (id: string) => void;
  onRepay: (debtId: string, surplusId: string, amount: number) => void;
  isAdmin: boolean;
}

const PRODUCTS = [
  'Service Revenue',
  'Investment',
  'Donation (Grants)',
  'Refunds',
  'Rocks',
  'Trimming',
  'Maintenance & Repair',
  'Pest Control',
  'Installation',
  'Gardening'
];

const InflowManager: React.FC<InflowManagerProps> = ({ inflows, onAdd, onUpdate, onDelete, onRepay, isAdmin }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showRepayModal, setShowRepayModal] = useState<string | null>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    source: '',
    product: 'Service Revenue',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    description: '',
    paymentMethod: 'Bank' as 'Bank' | 'Momo',
    accountNumber: ''
  });

  const [repayData, setRepayData] = useState({
    surplusId: '',
    amount: ''
  });

  const [noteModal, setNoteModal] = useState<{ id: string, text: string } | null>(null);
  const [balanceEditModal, setBalanceEditModal] = useState<{ id: string, currentBalance: number } | null>(null);

  const formatNumberWithCommas = (val: string) => {
    const numericValue = val.replace(/[^0-9]/g, '');
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleEdit = (inf: Inflow) => {
    if (!isAdmin) return;
    setEditingId(inf.id);
    setFormData({
      source: inf.source,
      product: inf.product,
      amount: formatNumberWithCommas(inf.amount.toString()),
      date: inf.date,
      description: inf.description,
      paymentMethod: inf.paymentMethod || 'Bank',
      accountNumber: inf.accountNumber || ''
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Submitting form...", formData);
    if (!isAdmin) {
      console.error("Not admin");
      return;
    }
    const rawAmount = formData.amount.replace(/,/g, '');
    const amountNum = parseFloat(rawAmount);

    if (!formData.source || isNaN(amountNum)) {
      console.error("Validation failed", { source: formData.source, amountNum });
      return;
    }

    try {
      if (editingId) {
        const original = inflows.find(i => i.id === editingId);
        if (original) {
          onUpdate({
            ...original,
            source: formData.source,
            product: formData.product,
            amount: amountNum,
            remainingBalance: amountNum - (original.amount - original.remainingBalance),
            date: formData.date,
            description: formData.description,
            paymentMethod: formData.paymentMethod,
            accountNumber: formData.accountNumber
          });
        }
      } else {
        console.log("Calling onAdd...");
        await onAdd({
          id: generateUUID(),
          source: formData.source,
          product: formData.product,
          amount: amountNum,
          remainingBalance: amountNum,
          date: formData.date,
          description: formData.description,
          paymentMethod: formData.paymentMethod,
          accountNumber: formData.accountNumber
        });
        console.log("onAdd completed");
      }

      setFormData({
        source: '',
        product: 'Service Revenue',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        description: '',
        paymentMethod: 'Bank',
        accountNumber: ''
      });
      setShowForm(false);
      setEditingId(null);
    } catch (err) {
      console.error("Error submitting form:", err);
      alert("Error submitting form: " + err);
    }
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData({ ...formData, amount: formatNumberWithCommas(val) });
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setFormData({ ...formData, date: format(date, 'yyyy-MM-dd') });
      setShowCalendar(false);
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case 'Investment': return 'bg-amber-100 text-amber-700';
      case 'Donation (Grants)': return 'bg-purple-100 text-purple-700';
      case 'Refunds': return 'bg-rose-100 text-rose-700';
      case 'Service Revenue': return 'bg-emerald-100 text-emerald-700';
      default: return 'bg-emerald-50 text-[#165b4c]';
    }
  };

  return (
    <div className="space-y-6 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800">Funds Received (Inflows)</h2>
          {!isAdmin && <p className="text-xs text-slate-400 font-medium">Read-only access enabled.</p>}
        </div>
        {isAdmin && (
          <Button
            onClick={() => {
              setShowForm(!showForm);
              if (showForm) setEditingId(null);
            }}
            className="rounded-xl flex items-center gap-2 w-full sm:w-auto justify-center h-12 md:h-auto shadow-lg px-6"
          >
            <i className={`fas ${showForm ? 'fa-times' : 'fa-plus'}`}></i>
            <span className="font-bold">{showForm ? 'Cancel' : 'New Inflow'}</span>
          </Button>
        )}
      </div>

      {isAdmin && showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-4 md:p-8 rounded-[24px] shadow-2xl border border-slate-100 animate-in fade-in slide-in-from-top-4 duration-500 overflow-visible relative z-30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Receipt Source</label>
              <input
                type="text" required
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-[#165b4c]/10 focus:border-[#165b4c] outline-none transition-all text-slate-900 font-bold"
                value={formData.source}
                onChange={e => setFormData({ ...formData, source: e.target.value })}
                placeholder="Client or Project Name"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Stream Classification</label>
              <select
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-[#165b4c]/10 focus:border-[#165b4c] outline-none cursor-pointer text-slate-900 font-bold"
                value={formData.product}
                onChange={e => setFormData({ ...formData, product: e.target.value })}
              >
                {PRODUCTS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>

            {/* Payment Method Section */}
            <div className="space-y-4 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Channel</label>
                <div className="grid grid-cols-2 gap-3">
                  <div
                    onClick={() => setFormData({ ...formData, paymentMethod: 'Bank' })}
                    className={`cursor-pointer px-4 py-3 rounded-2xl border-2 flex items-center justify-center gap-3 transition-all ${formData.paymentMethod === 'Bank' ? 'border-[#165b4c] bg-[#165b4c]/5 text-[#165b4c]' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                  >
                    <Landmark size={20} />
                    <span className="font-bold text-sm">Bank</span>
                  </div>
                  <div
                    onClick={() => setFormData({ ...formData, paymentMethod: 'Momo' })}
                    className={`cursor-pointer px-4 py-3 rounded-2xl border-2 flex items-center justify-center gap-3 transition-all ${formData.paymentMethod === 'Momo' ? 'border-[#165b4c] bg-[#165b4c]/5 text-[#165b4c]' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                  >
                    <Smartphone size={20} />
                    <span className="font-bold text-sm">Momo</span>
                  </div>
                </div>
              </div>

              {(formData.paymentMethod === 'Bank' || formData.paymentMethod === 'Momo') && (
                <div className="space-y-2 animate-in slide-in-from-left-2 duration-300">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Number</label>
                  <div className="relative">
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text" required
                      className="w-full pl-12 pr-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-[#165b4c]/10 focus:border-[#165b4c] outline-none transition-all text-slate-900 font-bold font-mono"
                      value={formData.accountNumber}
                      onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
                      placeholder="XXXX-XXXX-XXXX"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount (RWF)</label>
              <input
                type="text" required
                inputMode="numeric"
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-[#165b4c]/10 focus:border-[#165b4c] outline-none text-slate-900 font-bold"
                value={formData.amount}
                onChange={handleAmountChange}
                placeholder="0"
              />
            </div>
            <div className="space-y-2 relative">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Date Logged</label>
              <div
                className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus-within:ring-4 focus-within:ring-[#165b4c]/10 focus-within:border-[#165b4c] transition-all flex items-center justify-between cursor-pointer"
                onClick={() => setShowCalendar(!showCalendar)}
              >
                {/* Fixed parseISO error by using native Date */}
                <span className="text-slate-800 font-bold">{format(new Date(formData.date), 'PPP')}</span>
                <i className="fas fa-calendar-alt text-[#165b4c]"></i>
              </div>
              {showCalendar && (
                <div ref={calendarRef} className="absolute z-50 mt-4 bg-white rounded-3xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border border-slate-100 p-2 animate-in zoom-in-95 duration-200 right-0">
                  {/* Fixed parseISO error by using native Date */}
                  <Calendar mode="single" selected={new Date(formData.date)} onSelect={handleDateSelect} disabled={(date) => date > new Date()} initialFocus />
                </div>
              )}
            </div>
          </div>
          <button type="submit" className="mt-10 w-full h-14 text-lg font-black rounded-2xl shadow-xl shadow-[#165b4c]/20 hover:shadow-[#165b4c]/30 transition-all active:scale-95 bg-[#165b4c] text-white flex items-center justify-center">
            {editingId ? 'Confirm Record Update' : 'Initialize Revenue Log'}
          </button>
        </form>
      )}

      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-left min-w-[850px]">
            <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.15em]">
              <tr>
                <th className="px-8 py-5 whitespace-nowrap">Accounting Date</th>
                <th className="px-8 py-5">Source</th>
                <th className="px-8 py-5 whitespace-nowrap">Current Status</th>
                <th className="px-8 py-5 whitespace-nowrap">Logged Principal</th>
                {isAdmin && <th className="px-8 py-5 text-right whitespace-nowrap">Ledger Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {inflows.map(inf => (
                <tr key={inf.id} className="hover:bg-slate-50 group transition-colors">
                  <td className="px-8 py-5 text-xs font-bold text-slate-500 whitespace-nowrap">{inf.date}</td>
                  <td className="px-8 py-5 min-w-[200px]">
                    <p className="font-black text-slate-900 text-sm leading-tight">{inf.source}</p>
                    <span className={`inline-block mt-1 text-[8px] px-2 py-0.5 rounded-md font-black uppercase tracking-wider ${getCategoryBadgeClass(inf.product)}`}>
                      {inf.product}
                    </span>

                    {/* Payment Method Badge */}
                    {inf.paymentMethod && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-400 font-medium">
                        {inf.paymentMethod === 'Bank' ? <Landmark size={12} /> : <Smartphone size={12} />}
                        <span>{inf.paymentMethod} {inf.accountNumber ? `• ${inf.accountNumber}` : ''}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <span className={`font-mono font-black text-sm ${inf.remainingBalance < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                        {inf.remainingBalance.toLocaleString()} RWF
                      </span>
                      {inf.remainingBalance < 0 && (
                        <span className="bg-rose-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded animate-pulse">LIABILITY</span>
                      )}
                      {isAdmin && (
                        <button
                          onClick={() => setBalanceEditModal({ id: inf.id, currentBalance: inf.remainingBalance })}
                          className="ml-1 text-slate-300 hover:text-[#165b4c] opacity-0 group-hover:opacity-100 transition-all p-1"
                          title="Correct Balance Discrepancy"
                        >
                          <Pencil size={12} />
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="px-8 py-5 font-mono text-xs font-bold text-slate-400 whitespace-nowrap">{inf.amount.toLocaleString()} RWF</td>
                  {isAdmin && (
                    <td className="px-8 py-5 text-right whitespace-nowrap">
                      <div className="flex justify-end items-center gap-1">
                        {inf.remainingBalance < 0 && (
                          <button
                            onClick={() => setShowRepayModal(inf.id)}
                            className="text-[10px] bg-rose-50 text-rose-600 hover:bg-rose-100 font-black px-4 py-2 rounded-xl transition-all border border-rose-100 mr-2 active:scale-95"
                          >
                            SETTLE
                          </button>
                        )}
                        <button
                          onClick={() => setNoteModal({ id: inf.id, text: inf.notes || '' })}
                          className={`p-3 rounded-xl transition-all ${inf.notes ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' : 'text-slate-300 hover:text-amber-500 hover:bg-amber-50'}`}
                        >
                          <StickyNote size={18} />
                        </button>
                        <button onClick={() => handleEdit(inf)} className="text-slate-300 hover:text-[#165b4c] hover:bg-[#165b4c]/5 p-3 rounded-xl transition-all"><i className="fas fa-edit"></i></button>
                        <button onClick={() => onDelete(inf.id)} className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 p-3 rounded-xl transition-all"><i className="fas fa-trash-alt"></i></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
              {inflows.length === 0 && (
                <tr><td colSpan={isAdmin ? 5 : 4} className="px-8 py-16 text-center text-slate-400 font-bold italic">Audit database is currently empty.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {noteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md scale-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <StickyNote className="text-[#165b4c]" />
              Attach Note to Transaction
            </h3>
            <textarea
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[120px] outline-none focus:ring-2 focus:ring-[#165b4c] text-slate-700 font-medium resize-none shadow-inner"
              placeholder="e.g. Payment verified via email..."
              value={noteModal.text}
              onChange={e => setNoteModal({ ...noteModal, text: e.target.value })}
              autoFocus
            />
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setNoteModal(null)}
                className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const item = inflows.find(i => i.id === noteModal.id);
                  if (item) {
                    onUpdate({ ...item, notes: noteModal.text });
                  }
                  setNoteModal(null);
                }}
                className="flex-1 py-3 rounded-xl font-bold bg-[#165b4c] text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {balanceEditModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md scale-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Pencil className="text-[#165b4c]" />
              Manual Balance Correction
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Use this tool to fix "Ghost Deductions" or data sync errors. This will forcefully overwrite the remaining balance.
            </p>
            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Correct Balance (RWF)</label>
              <input
                type="number"
                className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-[#165b4c] text-slate-900 font-bold font-mono text-xl"
                value={balanceEditModal.currentBalance}
                onChange={e => setBalanceEditModal({ ...balanceEditModal, currentBalance: parseFloat(e.target.value) || 0 })}
                autoFocus
              />
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setBalanceEditModal(null)}
                className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const item = inflows.find(i => i.id === balanceEditModal.id);
                  if (item) {
                    onUpdate({ ...item, remainingBalance: balanceEditModal.currentBalance });
                  }
                  setBalanceEditModal(null);
                }}
                className="flex-1 py-3 rounded-xl font-bold bg-[#165b4c] text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                Update Balance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InflowManager;