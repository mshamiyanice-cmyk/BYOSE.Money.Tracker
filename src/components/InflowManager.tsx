import React, { useState, useEffect, useRef } from 'react';
import { Inflow } from '../types';
import { Calendar } from './ui/Calendar';
// Removed parseISO as it was reported as missing from date-fns exports
import { format } from 'date-fns';
import { Button } from './ui/button';
import { generateUUID } from '../lib/utils';
import { Landmark, Smartphone, CreditCard, StickyNote, Pencil, RefreshCw, Hand } from 'lucide-react';
import { BANK_ACCOUNTS } from '../constants';

interface InflowManagerProps {
  inflows: Inflow[];
  onAdd: (inflow: Inflow) => Promise<void>;
  onUpdate: (inflow: Inflow) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRepay: (debtId: string, surplusId: string, amount: number) => Promise<void>;
  onRecalculate: (id: string) => Promise<void>;
  isAdmin: boolean;
}

const PRODUCTS = [
  'Service Revenue',
  'Deposit', // New classification
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

const InflowManager: React.FC<InflowManagerProps> = ({ inflows, onAdd, onUpdate, onDelete, onRepay, onRecalculate, isAdmin }) => {
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [recalculatingId, setRecalculatingId] = useState<string | null>(null);
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
    paymentMethod: 'Bank' as 'Bank' | 'Momo' | 'Hand in Hand',
    accountNumber: '',
    currency: 'RWF' as 'RWF' | 'USD',
    bankAccountName: ''
  });

  const [repayData, setRepayData] = useState({
    surplusId: '',
    amount: ''
  });

  const [noteModal, setNoteModal] = useState<{ id: string, text: string } | null>(null);
  const [balanceEditModal, setBalanceEditModal] = useState<{ id: string, currentBalance: number } | null>(null);

  const formatNumberWithCommas = (val: string) => {
    // Remove everything that is not a digit or a dot
    const cleanVal = val.replace(/[^0-9.]/g, '');

    // Split at the first dot
    const parts = cleanVal.split('.');
    const integerPart = parts[0];
    const decimalPart = parts.length > 1 ? '.' + parts.slice(1).join('') : '';

    // Add commas to integer part
    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');

    return formattedInteger + decimalPart;
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
      accountNumber: inf.accountNumber || '',
      currency: inf.currency || 'RWF',
      bankAccountName: inf.bankAccountName || ''
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

    setIsSubmitting(true);
    try {
      if (editingId) {
        const original = inflows.find(i => i.id === editingId);
        if (original) {
          await onUpdate({
            ...original,
            source: formData.source,
            product: formData.product,
            amount: amountNum,
            remainingBalance: amountNum - (original.amount - original.remainingBalance),
            date: formData.date,
            description: formData.description,
            paymentMethod: formData.paymentMethod,
            accountNumber: formData.accountNumber,
            currency: formData.currency,
            bankAccountName: formData.bankAccountName
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
          accountNumber: formData.accountNumber,
          currency: formData.currency,
          bankAccountName: formData.bankAccountName
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
        accountNumber: '',
        currency: 'RWF',
        bankAccountName: ''
      });
      setShowForm(false);
      setShowForm(false);
      setEditingId(null);
    } catch (err) {
      console.error("Error submitting form:", err);
      alert("Error submitting form: " + err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this inflow? This is a destructive action.")) return;
    setDeletingId(id);
    try {
      await onDelete(id);
    } catch (error) {
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  };

  const handleRecalculate = async (id: string) => {
    setRecalculatingId(id);
    try {
      await onRecalculate(id);
    } catch (error) {
      console.error(error);
    } finally {
      setRecalculatingId(null);
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

            {/* Payment Method / Deposit Details Section */}
            <div className="space-y-4 md:col-span-2">
              {formData.product === 'Deposit' ? (
                <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 animate-in slide-in-from-top-2 duration-300">
                  <h4 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Landmark size={16} /> Target Bank Account
                  </h4>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Account</label>
                      <select
                        className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#165b4c]/10 focus:border-[#165b4c] outline-none text-slate-900 font-bold appearance-none cursor-pointer"
                        value={formData.accountNumber || ''}
                        onChange={(e) => {
                          const selected = BANK_ACCOUNTS.find(acc => acc.number === e.target.value);
                          if (selected) {
                            setFormData({
                              ...formData,
                              bankAccountName: selected.name,
                              accountNumber: selected.number,
                              currency: selected.currency
                            });
                          }
                        }}
                      >
                        <option value="">-- Choose Corporate Account --</option>
                        {BANK_ACCOUNTS.map(acc => (
                          <option key={acc.number} value={acc.number}>
                            {acc.name} - {acc.currency} (**** {acc.number.slice(-4)})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Channel</label>
                    <div className="grid grid-cols-3 gap-3">
                      <div
                        onClick={() => setFormData({ ...formData, paymentMethod: 'Bank' })}
                        className={`cursor-pointer px-2 py-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${formData.paymentMethod === 'Bank' ? 'border-[#165b4c] bg-[#165b4c]/5 text-[#165b4c]' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                      >
                        <Landmark size={18} />
                        <span className="font-bold text-[10px] uppercase">Bank</span>
                      </div>
                      <div
                        onClick={() => setFormData({ ...formData, paymentMethod: 'Momo' })}
                        className={`cursor-pointer px-2 py-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${formData.paymentMethod === 'Momo' ? 'border-[#165b4c] bg-[#165b4c]/5 text-[#165b4c]' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                      >
                        <Smartphone size={18} />
                        <span className="font-bold text-[10px] uppercase">Momo</span>
                      </div>
                      <div
                        onClick={() => setFormData({ ...formData, paymentMethod: 'Hand in Hand' })}
                        className={`cursor-pointer px-2 py-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${formData.paymentMethod === 'Hand in Hand' ? 'border-[#165b4c] bg-[#165b4c]/5 text-[#165b4c]' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                      >
                        <Hand size={18} />
                        <span className="font-bold text-[10px] uppercase">Hand in Hand</span>
                      </div>
                    </div>
                  </div>

                  {(formData.paymentMethod === 'Bank') && (
                    <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 animate-in slide-in-from-left-2 duration-300 md:col-span-2">
                      <h4 className="text-sm font-black text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                        <Landmark size={16} /> Target Bank Account
                      </h4>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Select Account</label>
                          <select
                            className="w-full px-5 py-4 bg-white border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#165b4c]/10 focus:border-[#165b4c] outline-none text-slate-900 font-bold appearance-none cursor-pointer"
                            value={formData.accountNumber || ''}
                            onChange={(e) => {
                              const selected = BANK_ACCOUNTS.find(acc => acc.number === e.target.value);
                              if (selected) {
                                setFormData({
                                  ...formData,
                                  bankAccountName: selected.name,
                                  accountNumber: selected.number,
                                  currency: selected.currency
                                });
                              }
                            }}
                          >
                            <option value="">-- Choose Corporate Account --</option>
                            {BANK_ACCOUNTS.map(acc => (
                              <option key={acc.number} value={acc.number}>
                                {acc.name} - {acc.currency} (**** {acc.number.slice(-4)})
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>
                    </div>
                  )}

                  {(formData.paymentMethod === 'Momo') && (
                    <div className="space-y-2 animate-in slide-in-from-left-2 duration-300">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Momo Number</label>
                      <div className="relative">
                        <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                          type="text" required
                          className="w-full pl-12 pr-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-[#165b4c]/10 focus:border-[#165b4c] outline-none transition-all text-slate-900 font-bold font-mono"
                          value={formData.accountNumber}
                          onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
                          placeholder="07..."
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Currency & Amount</label>
              <div className="flex gap-4">
                <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, currency: 'RWF' })}
                    className={`px-4 py-3 rounded-lg text-sm font-bold transition-all ${formData.currency === 'RWF' ? 'bg-white text-[#165b4c] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    RWF
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, currency: 'USD' })}
                    className={`px-4 py-3 rounded-lg text-sm font-bold transition-all ${formData.currency === 'USD' ? 'bg-white text-[#165b4c] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                  >
                    USD
                  </button>
                </div>
                <div className="relative flex-1">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                    {formData.currency === 'RWF' ? 'RWF' : '$'}
                  </span>
                  <input
                    type="text" required
                    inputMode="numeric"
                    className="w-full pl-14 pr-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-[#165b4c]/10 focus:border-[#165b4c] outline-none text-slate-900 font-bold"
                    value={formData.amount}
                    onChange={handleAmountChange}
                    placeholder="0"
                  />
                </div>
              </div>
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
          <button
            type="submit"
            disabled={isSubmitting}
            className={`mt-10 w-full h-14 text-lg font-black rounded-2xl shadow-xl transition-all active:scale-95 text-white flex items-center justify-center gap-2 ${isSubmitting ? 'bg-slate-400' : 'bg-[#165b4c] hover:shadow-[#165b4c]/30'}`}
          >
            {isSubmitting && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {isSubmitting ? 'Processing...' : (editingId ? 'Confirm Record Update' : 'Initialize Revenue Log')}
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
                    {inf.product === 'Deposit' ? (
                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-400 font-medium">
                        <Landmark size={12} />
                        <span>{inf.bankAccountName || 'Bank Deposit'} {inf.accountNumber ? `• ${inf.accountNumber}` : ''}</span>
                      </div>
                    ) : (
                      inf.paymentMethod && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-400 font-medium">
                          {inf.paymentMethod === 'Bank' && <Landmark size={12} />}
                          {inf.paymentMethod === 'Momo' && <Smartphone size={12} />}
                          {inf.paymentMethod === 'Hand in Hand' && <Hand size={12} />}
                          <span>{inf.paymentMethod} {inf.accountNumber ? `• ${inf.accountNumber}` : ''}</span>
                        </div>
                      )
                    )}
                  </td>
                  <td className="px-8 py-5 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <span className={`font-mono font-black text-sm ${inf.remainingBalance < 0 ? 'text-rose-600' : 'text-slate-800'}`}>
                        {inf.remainingBalance.toLocaleString()} {inf.currency === 'USD' ? '$' : 'RWF'}
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
                  <td className="px-8 py-5 font-mono text-xs font-bold text-slate-400 whitespace-nowrap">
                    {inf.amount.toLocaleString()} {inf.currency === 'USD' ? '$' : 'RWF'}
                  </td>
                  {isAdmin && (
                    <td className="px-8 py-5 text-right whitespace-nowrap">
                      <div className="flex justify-end items-center gap-1">
                        <button
                          onClick={() => handleRecalculate(inf.id)}
                          disabled={recalculatingId === inf.id}
                          className="mr-2 text-slate-300 hover:text-blue-500 hover:bg-blue-50 p-3 rounded-xl transition-all"
                          title="Recalculate Balance (Fix Sync)"
                        >
                          <RefreshCw size={18} className={recalculatingId === inf.id ? 'animate-spin text-blue-500' : ''} />
                        </button>
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
                        <button onClick={() => handleDelete(inf.id)} disabled={deletingId === inf.id} className="text-slate-300 hover:text-rose-600 hover:bg-rose-50 p-3 rounded-xl transition-all">
                          {deletingId === inf.id ? <div className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" /> : <i className="fas fa-trash-alt"></i>}
                        </button>
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