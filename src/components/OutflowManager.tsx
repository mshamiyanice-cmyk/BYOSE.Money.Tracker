
import React, { useState } from 'react';
import { format } from 'date-fns';
import { generateUUID } from '../lib/utils';
import { Inflow, Outflow } from '../types';
import { BANK_ACCOUNTS } from '../constants';
import { StickyNote, Landmark, Smartphone, CreditCard, Hand, Pencil } from 'lucide-react';

interface OutflowManagerProps {
  inflows: Inflow[];
  outflows: Outflow[];
  onAdd: (outflow: Outflow) => Promise<void>;
  onUpdate: (outflow: Outflow) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  isAdmin: boolean;
}

// Categories updated to include Import
const CATEGORIES = ['Cost of Goods', 'Import', 'Office', 'Marketing', 'Rent', 'Taxes', 'Wages', 'Banking', 'Misc'];

const OutflowManager: React.FC<OutflowManagerProps> = ({ inflows, outflows, onAdd, onUpdate, onDelete, isAdmin }) => {
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [fundSourceSearch, setFundSourceSearch] = useState('');
  const [noteModal, setNoteModal] = useState<{ id: string, text: string } | null>(null);
  const [viewOutflow, setViewOutflow] = useState<Outflow | null>(null);
  const [formData, setFormData] = useState({
    purpose: '',
    category: 'Cost of Goods',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    seller: '',
    inflowId: '',
    expenseName: '',
    paymentMethod: 'Bank' as 'Bank' | 'Momo' | 'Hand in Hand',
    accountNumber: '',
    currency: 'RWF' as 'RWF' | 'USD',
    exchangeRate: ''
  });

  const availableInflows = inflows;
  const isDetailRequired = formData.category === 'Cost of Goods' || formData.category === 'Import' || formData.category === 'Misc';

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

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData({ ...formData, amount: formatNumberWithCommas(val) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    const rawAmount = formData.amount.replace(/,/g, '');
    const amountNum = parseFloat(rawAmount);
    const selectedInflow = inflows.find(i => i.id === formData.inflowId);

    if (!formData.purpose || isNaN(amountNum) || !formData.inflowId || !formData.seller) return;
    if (isDetailRequired && !formData.expenseName) return;

    if (selectedInflow && amountNum > selectedInflow.remainingBalance) {
      const overdraftAmount = amountNum - selectedInflow.remainingBalance;
      if (!confirm(`Insufficient funds in ${selectedInflow.source}.\n\nThis will empty the pot and create an Overdraft of ${overdraftAmount.toLocaleString()} RWF.\n\nProceed?`)) return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await onUpdate({
          id: editingId,
          purpose: formData.purpose,
          category: formData.category,
          amount: amountNum,
          date: formData.date,
          seller: formData.seller,
          inflowId: formData.inflowId,
          expenseName: isDetailRequired ? formData.expenseName : undefined,
          paymentMethod: formData.paymentMethod,
          accountNumber: formData.accountNumber,
          currency: formData.currency,
          exchangeRate: formData.exchangeRate ? parseFloat(formData.exchangeRate) : undefined,
          // Preserve existing notes if not editing them here? Or keep them as is.
          notes: outflows.find(o => o.id === editingId)?.notes
        });
      } else {
        await onAdd({
          id: generateUUID(),
          purpose: formData.purpose,
          category: formData.category,
          amount: amountNum,
          date: formData.date,
          seller: formData.seller,
          inflowId: formData.inflowId,
          expenseName: isDetailRequired ? formData.expenseName : undefined,
          paymentMethod: formData.paymentMethod,
          accountNumber: formData.accountNumber,
          currency: formData.currency,
          exchangeRate: formData.exchangeRate ? parseFloat(formData.exchangeRate) : undefined
        });
      }

      setFormData({
        purpose: '',
        category: 'Cost of Goods',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        seller: '',
        inflowId: '',
        expenseName: '',
        paymentMethod: 'Bank',
        accountNumber: '',
        currency: 'RWF',
        exchangeRate: ''
      });
      setShowForm(false);
      setEditingId(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this expense? This will refund the amount to the source pot.")) return;
    setDeletingId(id);
    try {
      await onDelete(id);
    } catch (error) {
      console.error(error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Track Spending (Outflows)</h2>
          {!isAdmin && <p className="text-xs text-slate-400 font-medium">Read-only access enabled.</p>}
        </div>

        {/* Fund Source Search Input */}
        <div className="relative">
          <input
            type="text"
            placeholder="Filter by Fund Source..."
            className="pl-9 pr-4 py-2 bg-slate-100 border-none rounded-xl text-sm font-bold text-slate-600 outline-none focus:ring-2 focus:ring-slate-200 transition-all w-full sm:w-64"
            value={fundSourceSearch}
            onChange={e => setFundSourceSearch(e.target.value)}
          />
          <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setShowForm(!showForm);
              if (showForm) setEditingId(null); // Clear editing if cancelling
              if (!showForm && editingId) setEditingId(null); // Clear if opening fresh
              if (!showForm) {
                // Reset form when opening new
                setFormData({
                  purpose: '',
                  category: 'Cost of Goods',
                  amount: '',
                  date: new Date().toISOString().split('T')[0],
                  seller: '',
                  inflowId: '',
                  expenseName: '',
                  paymentMethod: 'Bank',
                  accountNumber: '',
                  currency: 'RWF',
                  exchangeRate: ''
                });
              }
            }}
            disabled={availableInflows.length === 0}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${availableInflows.length === 0
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-rose-600 text-white shadow-lg'
              }`}
          >
            <i className={`fas ${showForm ? 'fa-times' : 'fa-plus'}`}></i>
            {showForm ? 'Cancel' : 'New Expense'}
          </button>
        )}
      </div>

      {isAdmin && showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-lg border border-rose-100 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Fund Source (Tracing money used)</label>
              <select
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 text-slate-900 outline-none"
                value={formData.inflowId}
                onChange={e => setFormData({ ...formData, inflowId: e.target.value })}
              >
                <option value="">Select where this money came from...</option>
                {availableInflows.map(inf => (
                  <option key={inf.id} value={inf.id} className={inf.remainingBalance < 0 ? 'text-rose-600' : ''}>
                    {inf.source} — {inf.remainingBalance.toLocaleString()} RWF {inf.remainingBalance < 0 ? '(DEBT)' : 'available'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Category</label>
              <select
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 text-slate-900 outline-none"
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value })}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Vendor / Seller</label>
              <input
                type="text" required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 text-slate-900 outline-none"
                value={formData.seller}
                onChange={e => setFormData({ ...formData, seller: e.target.value })}
                placeholder="Business or Person name"
              />
            </div>

            {isDetailRequired && (
              <div className="md:col-span-2 animate-in slide-in-from-left-2 duration-300">
                <label className="block text-xs font-bold text-rose-600 uppercase mb-2">
                  <i className="fas fa-tag mr-1"></i> Specific Expense Name / Item
                </label>
                <input
                  type="text" required
                  className="w-full px-4 py-3 bg-rose-50/30 border border-rose-200 rounded-lg focus:ring-2 focus:ring-rose-500 text-slate-900 outline-none"
                  value={formData.expenseName}
                  onChange={e => setFormData({ ...formData, expenseName: e.target.value })}
                  placeholder={formData.category === 'Cost of Goods' ? "e.g. 10 Bags of Cement" : (formData.category === 'Import' ? "e.g. Customs Duty / Shipping" : "e.g. Office Repair")}
                />
              </div>
            )}

            {/* Payment Method Section */}
            <div className="space-y-4 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Payment Channel</label>
                <div className="grid grid-cols-3 gap-3">
                  <div
                    onClick={() => setFormData({ ...formData, paymentMethod: 'Bank' })}
                    className={`cursor-pointer px-2 py-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${formData.paymentMethod === 'Bank' ? 'border-rose-500 bg-rose-50 text-rose-600' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                  >
                    <Landmark size={18} />
                    <span className="font-bold text-[10px] uppercase">Bank</span>
                  </div>
                  <div
                    onClick={() => setFormData({ ...formData, paymentMethod: 'Momo' })}
                    className={`cursor-pointer px-2 py-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${formData.paymentMethod === 'Momo' ? 'border-rose-500 bg-rose-50 text-rose-600' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                  >
                    <Smartphone size={18} />
                    <span className="font-bold text-[10px] uppercase">Momo</span>
                  </div>
                  <div
                    onClick={() => setFormData({ ...formData, paymentMethod: 'Hand in Hand' })}
                    className={`cursor-pointer px-2 py-3 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition-all ${formData.paymentMethod === 'Hand in Hand' ? 'border-rose-500 bg-rose-50 text-rose-600' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-slate-200'}`}
                  >
                    <Hand size={18} />
                    <span className="font-bold text-[10px] uppercase">Hand in Hand</span>
                  </div>
                </div>
              </div>

              {(formData.paymentMethod === 'Bank' || formData.paymentMethod === 'Momo') && (
                <div className="space-y-2 animate-in slide-in-from-left-2 duration-300">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    {formData.paymentMethod === 'Bank' ? 'Select Corporate Account' : 'Account Number'}
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    {formData.paymentMethod === 'Bank' ? (
                      <select
                        required
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 text-slate-900 outline-none font-bold appearance-none"
                        value={formData.accountNumber}
                        onChange={e => {
                          const selectedAcc = BANK_ACCOUNTS.find(acc => acc.number === e.target.value);
                          if (selectedAcc) {
                            setFormData({
                              ...formData,
                              accountNumber: e.target.value,
                              currency: selectedAcc.currency // Auto-switch currency
                            });
                          } else {
                            setFormData({ ...formData, accountNumber: e.target.value });
                          }
                        }}
                      >
                        <option value="">Choose Account...</option>
                        {BANK_ACCOUNTS.map(acc => (
                          <option key={acc.number} value={acc.number}>
                            {acc.name} — {acc.currency} (********{acc.number.slice(-4)})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text" required
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 text-slate-900 outline-none font-mono font-bold"
                        value={formData.accountNumber}
                        onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
                        placeholder="XXXX-XXXX-XXXX"
                      />
                    )}
                  </div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Amount ({formData.currency})</label>
                  <div className="flex gap-4">
                    <div className="flex bg-slate-100 p-1 rounded-xl shrink-0">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, currency: 'RWF' })}
                        className={`px-4 py-3 rounded-lg text-sm font-bold transition-all ${formData.currency === 'RWF' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        RWF
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, currency: 'USD' })}
                        className={`px-4 py-3 rounded-lg text-sm font-bold transition-all ${formData.currency === 'USD' ? 'bg-white text-rose-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
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
                        inputMode="decimal"
                        className="w-full pl-14 pr-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none text-slate-900 font-bold text-lg"
                        value={formData.amount}
                        onChange={handleAmountChange}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Optional Exchange Rate */}
                  {formData.currency === 'USD' && (
                    <div className="space-y-2 animate-in slide-in-from-top-2">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Exchange Rate (Optional)</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">1 USD = </span>
                        <input
                          type="number"
                          className="w-full pl-20 pr-12 py-3 bg-slate-50 border-2 border-slate-100 rounded-xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none text-slate-900 font-bold font-mono"
                          value={formData.exchangeRate}
                          onChange={e => setFormData({ ...formData, exchangeRate: e.target.value })}
                          placeholder="Current Rate"
                        />
                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">RWF</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">General Purpose</label>
              <input
                type="text" required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 text-slate-900 outline-none"
                value={formData.purpose}
                onChange={e => setFormData({ ...formData, purpose: e.target.value })}
              />
            </div>

            {/* Dynamic Amount Display */}
            {formData.currency === 'USD' && formData.amount && formData.exchangeRate && (
              <div className="bg-slate-50 p-4 rounded-xl border-l-4 border-rose-500 animate-in fade-in slide-in-from-top-2">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Equivalent Amount (RWF)</p>
                <p className="text-2xl font-black text-rose-600 font-mono">
                  {(parseFloat(formData.amount.replace(/,/g, '')) * parseFloat(formData.exchangeRate)).toLocaleString(undefined, { maximumFractionDigits: 2 })} <span className="text-sm text-slate-400">RWF</span>
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Date</label>
              <input
                type="date"
                required
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 text-slate-900 outline-none"
                value={formData.date}
                max={new Date().toISOString().split('T')[0]} // Prevent future dates if desired, optional
                onChange={e => setFormData({ ...formData, date: e.target.value })}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`mt-6 w-full ${isSubmitting ? 'bg-slate-400' : 'bg-rose-600 hover:bg-rose-700'} text-white font-bold py-3 rounded-xl shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2`}
          >
            {isSubmitting && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
            {isSubmitting ? 'Processing...' : (editingId ? 'Update Expense' : 'Log Expense')}
          </button>
        </form>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
            <tr>
              <th className="px-6 py-4">Date</th>
              <th className="px-6 py-4">Vendor</th>
              <th className="px-6 py-4">Fund Source</th>
              <th className="px-6 py-4">Use / Purpose</th>
              <th className="px-6 py-4">Amount</th>
              {isAdmin && <th className="px-6 py-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {outflows.filter(out => {
              if (!fundSourceSearch) return true;
              const sourceName = inflows.find(i => i.id === out.inflowId)?.source || '';
              return sourceName.toLowerCase().includes(fundSourceSearch.toLowerCase());
            }).map(out => (
              <tr
                key={out.id}
                onClick={() => setViewOutflow(out)}
                className="hover:bg-slate-50 group cursor-pointer transition-colors"
              >
                <td className="px-6 py-4 text-sm text-slate-500">{out.date}</td>
                <td className="px-6 py-4">
                  <p className="font-bold text-slate-800">{out.seller}</p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">{out.category}</p>

                  {/* Payment Method Badge */}
                  {out.paymentMethod && (
                    <div className="mt-1 flex items-center gap-1 text-[10px] text-slate-400 font-medium bg-slate-100 px-2 py-1 rounded-md w-fit">
                      {out.paymentMethod === 'Bank' && <Landmark size={10} />}
                      {out.paymentMethod === 'Momo' && <Smartphone size={10} />}
                      {out.paymentMethod === 'Hand in Hand' && <Hand size={10} />}
                      <span>{out.paymentMethod} {out.accountNumber ? `• ${out.accountNumber}` : ''}</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm font-bold text-slate-700">
                    {inflows.find(i => i.id === out.inflowId)?.source || <span className="text-red-500 italic">Unknown Source</span>}
                  </p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">
                    {inflows.find(i => i.id === out.inflowId)?.product}
                  </p>
                </td>
                <td className="px-6 py-4">
                  <p className="text-sm text-slate-700 font-medium">
                    {out.expenseName ? (
                      <><span className="text-rose-600 font-bold">{out.expenseName}</span> <span className="text-slate-300 mx-1">|</span> {out.purpose}</>
                    ) : (
                      out.purpose
                    )}
                  </p>
                </td>
                <td className="px-6 py-4 font-mono font-bold text-rose-600">-{out.amount.toLocaleString()} RWF</td>
                {isAdmin && (
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setNoteModal({ id: out.id, text: out.notes || '' })}
                      className={`p-2 mr-2 rounded-lg transition-all ${out.notes ? 'text-amber-500 bg-amber-50 hover:bg-amber-100' : 'text-slate-300 hover:text-amber-500 hover:bg-amber-50'}`}
                    >
                      <StickyNote size={18} />
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(out.id);
                        setFormData({
                          purpose: out.purpose,
                          category: out.category,
                          amount: out.amount.toString(), // formatNumberWithCommas might be needed if using that specific input logic
                          date: out.date,
                          seller: out.seller,
                          inflowId: out.inflowId,
                          expenseName: out.expenseName || '',
                          paymentMethod: out.paymentMethod || 'Bank',
                          accountNumber: out.accountNumber || '',
                          currency: out.currency || 'RWF',
                          exchangeRate: out.exchangeRate ? out.exchangeRate.toString() : ''
                        });
                        setShowForm(true);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="p-2 mr-2 text-slate-300 hover:text-blue-600 transition-colors"
                    >
                      <Pencil size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(out.id)}
                      disabled={deletingId === out.id}
                      className="text-slate-300 hover:text-rose-600 p-2 transition-colors"
                    >
                      {deletingId === out.id ? <div className="w-4 h-4 border-2 border-rose-600 border-t-transparent rounded-full animate-spin" /> : <i className="fas fa-trash-alt"></i>}
                    </button>
                  </td>
                )}
              </tr>
            ))}
            {outflows.length === 0 && (
              <tr><td colSpan={isAdmin ? 5 : 4} className="px-6 py-12 text-center text-slate-400 italic">No expenses recorded yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {noteModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl p-6 w-full max-w-md scale-100 animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <StickyNote className="text-rose-600" />
              Add Expense Note
            </h3>
            <textarea
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[120px] outline-none focus:ring-2 focus:ring-rose-500 text-slate-700 font-medium resize-none shadow-inner"
              placeholder="e.g. Invoice #1234, Approved by Manager..."
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
                  const item = outflows.find(o => o.id === noteModal.id);
                  if (item) {
                    onUpdate({ ...item, notes: noteModal.text });
                  }
                  setNoteModal(null);
                }}
                className="flex-1 py-3 rounded-xl font-bold bg-rose-600 text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                Save Note
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {viewOutflow && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setViewOutflow(null)}>
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="bg-slate-50 p-6 border-b border-slate-100 flex justify-between items-start">
              <div>
                <h3 className="text-xl font-black text-slate-800">Expense Details</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">{viewOutflow.id}</p>
              </div>
              <button onClick={() => setViewOutflow(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-400">
                <i className="fas fa-times"></i>
              </button>
            </div>

            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Header Amount */}
              <div className="bg-slate-900 p-6 rounded-2xl text-center">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Total Amount</p>
                <p className="text-3xl font-black text-white font-mono">
                  {viewOutflow.amount.toLocaleString()} <span className="text-sm text-slate-500">RWF</span>
                </p>
                {viewOutflow.currency === 'USD' && viewOutflow.exchangeRate && (
                  <p className="text-xs text-slate-500 mt-2 font-mono">
                    (Paid as: {(viewOutflow.amount / viewOutflow.exchangeRate).toLocaleString(undefined, { maximumFractionDigits: 2 })} USD @ {viewOutflow.exchangeRate})
                  </p>
                )}
              </div>

              {/* Main Info Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Date</label>
                  <p className="font-bold text-slate-800">{format(new Date(viewOutflow.date), 'PPP')}</p>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Vendor / Seller</label>
                  <p className="font-bold text-slate-800">{viewOutflow.seller}</p>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Fund Source</label>
                  <p className="font-bold text-slate-800 text-sm">
                    {inflows.find(i => i.id === viewOutflow.inflowId)?.source || 'Unknown Source'}
                  </p>
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Category</label>
                  <span className="inline-block px-2 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-slate-100 text-slate-600">
                    {viewOutflow.category}
                  </span>
                </div>
              </div>

              {/* Purpose / Item */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <label className="block text-[10px] uppercase font-black text-slate-400 tracking-widest mb-1">Configuration</label>
                <div className="font-medium text-slate-700">
                  {viewOutflow.expenseName ? (
                    <>
                      <span className="font-bold text-slate-900 block">{viewOutflow.expenseName}</span>
                      <span className="text-sm text-slate-500 block mt-1">{viewOutflow.purpose}</span>
                    </>
                  ) : (
                    <span className="font-bold text-slate-900">{viewOutflow.purpose}</span>
                  )}
                </div>
              </div>

              {/* Payment Details */}
              <div className="border-t border-slate-100 pt-6">
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-widest mb-4">Payment Method Details</h4>
                <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-500">Method</span>
                    <div className="flex items-center gap-2 text-sm font-bold text-slate-800">
                      {viewOutflow.paymentMethod === 'Bank' && <Landmark size={14} className="text-[#165b4c]" />}
                      {viewOutflow.paymentMethod === 'Momo' && <Smartphone size={14} className="text-amber-500" />}
                      {viewOutflow.paymentMethod === 'Hand in Hand' && <Hand size={14} className="text-slate-500" />}
                      {viewOutflow.paymentMethod || 'N/A'}
                    </div>
                  </div>
                  {(viewOutflow.accountNumber) && (
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-500">Account / Number</span>
                      <span className="text-sm font-mono font-bold text-slate-700">
                        {viewOutflow.paymentMethod === 'Bank' ?
                          (BANK_ACCOUNTS.find(acc => acc.number === viewOutflow.accountNumber)?.name + ' ')
                          : ''}
                        {viewOutflow.accountNumber ? `• ${viewOutflow.accountNumber}` : ''}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {viewOutflow.notes && (
                <div className="border-t border-slate-100 pt-6">
                  <label className="block text-[10px] uppercase font-black text-slate-400 tracking-widest mb-2">Notes</label>
                  <div className="bg-amber-50 p-4 rounded-xl text-amber-900 text-sm font-medium italic border border-amber-100">
                    "{viewOutflow.notes}"
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutflowManager;
