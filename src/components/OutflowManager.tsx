
import React, { useState } from 'react';
import { format } from 'date-fns';
import { generateUUID } from '../lib/utils';
import { Inflow, Outflow } from '../types';
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
  const [noteModal, setNoteModal] = useState<{ id: string, text: string } | null>(null);
  const [formData, setFormData] = useState({
    purpose: '',
    category: 'Cost of Goods',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    seller: '',
    inflowId: '',
    expenseName: '',
    paymentMethod: 'Bank' as 'Bank' | 'Momo' | 'Hand in Hand',
    accountNumber: ''
  });

  const availableInflows = inflows;
  const isDetailRequired = formData.category === 'Cost of Goods' || formData.category === 'Import' || formData.category === 'Misc';

  const formatNumberWithCommas = (val: string) => {
    const numericValue = val.replace(/[^0-9]/g, '');
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
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
      if (!confirm(`Insufficient funds in ${selectedInflow.source}. Log as debt?`)) return;
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
          accountNumber: formData.accountNumber
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
        accountNumber: ''
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
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Track Spending (Outflows)</h2>
          {!isAdmin && <p className="text-xs text-slate-400 font-medium">Read-only access enabled.</p>}
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
                  accountNumber: ''
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
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Account Number</label>
                  <div className="relative">
                    <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input
                      type="text" required
                      className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 text-slate-900 outline-none font-mono font-bold"
                      value={formData.accountNumber}
                      onChange={e => setFormData({ ...formData, accountNumber: e.target.value })}
                      placeholder="XXXX-XXXX-XXXX"
                    />
                  </div>
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

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Amount (RWF)</label>
              <input
                type="text" required
                inputMode="numeric"
                className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-rose-500 text-slate-900 outline-none"
                value={formData.amount}
                onChange={handleAmountChange}
              />
            </div>

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
              <th className="px-6 py-4">Use / Purpose</th>
              <th className="px-6 py-4">Amount</th>
              {isAdmin && <th className="px-6 py-4 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {outflows.map(out => (
              <tr key={out.id} className="hover:bg-slate-50 group">
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
                          accountNumber: out.accountNumber || ''
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
    </div>
  );
};

export default OutflowManager;
