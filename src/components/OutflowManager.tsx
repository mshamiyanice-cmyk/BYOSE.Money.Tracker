
import React, { useState } from 'react';
import { format } from 'date-fns';
import { generateUUID } from '../lib/utils';
import { Inflow, Outflow } from '../types';

interface OutflowManagerProps {
  inflows: Inflow[];
  outflows: Outflow[];
  onAdd: (outflow: Outflow) => void;
  onDelete: (id: string) => void;
  isAdmin: boolean;
}

const CATEGORIES = ['Cost of Goods', 'Office', 'Marketing', 'Rent', 'Taxes', 'Wages', 'Misc'];

const OutflowManager: React.FC<OutflowManagerProps> = ({ inflows, outflows, onAdd, onDelete, isAdmin }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    purpose: '',
    category: 'Cost of Goods',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    seller: '',
    inflowId: '',
    expenseName: ''
  });

  const availableInflows = inflows;
  const isDetailRequired = formData.category === 'Cost of Goods' || formData.category === 'Misc';

  const formatNumberWithCommas = (val: string) => {
    const numericValue = val.replace(/[^0-9]/g, '');
    return numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setFormData({ ...formData, amount: formatNumberWithCommas(val) });
  };

  const handleSubmit = (e: React.FormEvent) => {
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

    onAdd({
      id: generateUUID(),
      purpose: formData.purpose,
      category: formData.category,
      amount: amountNum,
      date: formData.date,
      seller: formData.seller,
      inflowId: formData.inflowId,
      expenseName: isDetailRequired ? formData.expenseName : undefined
    });
    setFormData({ purpose: '', category: 'Cost of Goods', amount: '', date: new Date().toISOString().split('T')[0], seller: '', inflowId: '', expenseName: '' });
    setShowForm(false);
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
            onClick={() => setShowForm(!showForm)}
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
                  placeholder={formData.category === 'Cost of Goods' ? "e.g. 10 Bags of Cement" : "e.g. Office Repair"}
                />
              </div>
            )}

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
          <button type="submit" className="mt-6 w-full bg-rose-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-rose-700 transition-all active:scale-[0.98]">
            Log Expense
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
                    <button onClick={() => onDelete(out.id)} className="text-slate-300 hover:text-rose-600 p-2 transition-colors"><i className="fas fa-trash-alt"></i></button>
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
    </div>
  );
};

export default OutflowManager;
