import React, { useState } from 'react';
import { Inflow, Overdraft } from '../types';
import { generateUUID } from '../lib/utils';
import { Button } from './ui/button';
import { TriangleAlert, ReceiptText, CheckCircle2, Trash2, Wallet, Plus, X as CloseIcon } from 'lucide-react';

interface OverdraftManagerProps {
  inflows: Inflow[];
  overdrafts: Overdraft[];
  onAdd: (overdraft: Overdraft) => void;
  onSettle: (overdraftId: string, inflowId: string) => void;
  onDelete: (id: string) => void;
  isAdmin: boolean;
}

const OverdraftManager: React.FC<OverdraftManagerProps> = ({ inflows, overdrafts, onAdd, onSettle, onDelete, isAdmin }) => {
  const [showForm, setShowForm] = useState(false);
  const [showSettleModal, setShowSettleModal] = useState<string | null>(null);
  const [selectedInflowId, setSelectedInflowId] = useState('');
  const [formData, setFormData] = useState({
    purpose: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    seller: ''
  });

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

    if (!formData.purpose || isNaN(amountNum) || !formData.seller) return;

    onAdd({
      id: generateUUID(),
      purpose: formData.purpose,
      amount: amountNum,
      date: formData.date,
      seller: formData.seller,
      isSettled: false
    });

    setFormData({ purpose: '', amount: '', date: new Date().toISOString().split('T')[0], seller: '' });
    setShowForm(false);
  };

  const handleSettle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (showSettleModal && selectedInflowId) {
      onSettle(showSettleModal, selectedInflowId);
      setShowSettleModal(null);
      setSelectedInflowId('');
    }
  };

  const activeOverdrafts = overdrafts.filter(o => !o.isSettled);

  return (
    <div className="space-y-8 pb-20 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="flex-1">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">External Overdrafts</h2>
          <p className="text-xs md:text-sm text-slate-500 font-bold uppercase tracking-widest mt-1 opacity-70">External Payables Management</p>
          {!isAdmin && <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">Observer Status</p>}
        </div>
        {isAdmin && (
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-rose-600 hover:bg-rose-700 rounded-2xl flex items-center gap-3 px-6 h-12 md:h-14 shadow-2xl shadow-rose-200 transition-all active:scale-95 w-full sm:w-auto"
          >
            {showForm ? <CloseIcon size={20} /> : <Plus size={20} />}
            <span className="font-black uppercase text-xs tracking-widest">{showForm ? 'Abort' : 'Log External Usage'}</span>
          </Button>
        )}
      </div>

      {isAdmin && showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 md:p-10 rounded-[32px] shadow-2xl border border-rose-100 animate-in fade-in slide-in-from-top-4 duration-500 overflow-hidden relative z-30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
            <div className="md:col-span-2 space-y-3">
              <label className="block text-[11px] font-black text-rose-600 uppercase tracking-widest ml-1">Exposure Context</label>
              <input
                type="text" required
                className="w-full px-6 py-4 bg-rose-50/20 border-2 border-rose-100/50 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all text-slate-900 font-bold text-lg"
                value={formData.purpose}
                onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                placeholder="Audit description for this external payment"
              />
            </div>
            <div className="space-y-3">
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Receiving Party</label>
              <input
                type="text" required
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none transition-all text-slate-900 font-bold"
                value={formData.seller}
                onChange={e => setFormData({ ...formData, seller: e.target.value })}
                placeholder="Creditor/Vendor Name"
              />
            </div>
            <div className="space-y-3">
              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Owed Quantum (RWF)</label>
              <input
                type="text" required inputMode="numeric"
                className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl focus:ring-4 focus:ring-rose-500/10 focus:border-rose-500 outline-none text-slate-900 font-bold"
                value={formData.amount}
                onChange={handleAmountChange}
                placeholder="0"
              />
            </div>
          </div>
          <Button type="submit" className="mt-12 w-full h-16 text-xl font-black rounded-3xl shadow-2xl shadow-rose-200 transition-all active:scale-[0.98] bg-rose-600 hover:bg-rose-700">
            Authorize External Liability
          </Button>
        </form>
      )}

      {isAdmin && showSettleModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[48px] shadow-2xl max-w-lg w-full p-8 md:p-12 animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="w-16 h-16 md:w-20 md:h-20 bg-[#165b4c]/10 rounded-3xl flex items-center justify-center mx-auto mb-6 md:mb-8">
              <Wallet size={32} className="text-[#165b4c]" />
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-slate-900 mb-2 text-center tracking-tight">Debt Liquidation</h3>
            <p className="text-slate-500 text-[10px] md:text-sm font-bold text-center mb-8 md:mb-10 uppercase tracking-widest opacity-60">Settle via Internal Ecosystem</p>

            <form onSubmit={handleSettle} className="space-y-6 md:space-y-8">
              <div className="space-y-3">
                <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Liquidity Provider (Source Pot)</label>
                <select
                  required
                  className="w-full px-4 py-4 md:px-6 md:py-5 bg-slate-50 border-2 border-slate-100 rounded-3xl outline-none focus:ring-4 focus:ring-[#165b4c]/10 focus:border-[#165b4c] font-bold text-slate-900 cursor-pointer text-sm"
                  value={selectedInflowId}
                  onChange={e => setSelectedInflowId(e.target.value)}
                >
                  <option value="">Select capital source...</option>
                  {inflows.filter(i => i.remainingBalance > 0).map(i => (
                    <option key={i.id} value={i.id}>{i.source} — {i.remainingBalance.toLocaleString()} Available</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-4">
                <Button type="submit" className="h-14 md:h-16 text-lg md:text-xl font-black rounded-3xl shadow-2xl shadow-[#165b4c]/20">Authorize Settlement</Button>
                <button type="button" className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-rose-500 transition-colors py-2" onClick={() => setShowSettleModal(null)}>Cancel Operation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="space-y-10">
        <div className="bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 border border-rose-100 overflow-hidden">
          <div className="px-6 md:px-10 py-5 md:py-6 bg-rose-50/50 border-b border-rose-100 flex items-center gap-4">
            <div className="p-2 md:p-3 bg-rose-600 text-white rounded-2xl shadow-lg shadow-rose-200">
              <TriangleAlert size={20} />
            </div>
            <h3 className="font-black text-rose-900 uppercase tracking-[0.2em] text-xs md:text-sm">Active Liabilities (Awaiting Settlement)</h3>
          </div>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left min-w-[850px]">
              <thead className="bg-slate-50/50 text-slate-400 text-[10px] font-black uppercase tracking-[0.25em]">
                <tr>
                  <th className="px-10 py-6 whitespace-nowrap">Audit Date</th>
                  <th className="px-10 py-6">Creditor Identity</th>
                  <th className="px-10 py-6">Liability Logic</th>
                  <th className="px-10 py-6 whitespace-nowrap text-right">Owed Balance</th>
                  {isAdmin && <th className="px-10 py-6 text-right whitespace-nowrap">Accounting Control</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {activeOverdrafts.map(od => (
                  <tr key={od.id} className="hover:bg-rose-50/30 transition-all group">
                    <td className="px-10 py-6 text-xs font-bold text-slate-500 whitespace-nowrap">{od.date}</td>
                    <td className="px-10 py-6">
                      <p className="font-black text-slate-900 text-base">{od.seller}</p>
                      <span className="inline-block mt-2 text-[9px] bg-rose-600 text-white px-3 py-1 rounded-lg font-black uppercase tracking-widest shadow-lg shadow-rose-200">UNSETTLED</span>
                    </td>
                    <td className="px-10 py-6 text-sm font-bold text-slate-600 leading-relaxed max-w-xs">{od.purpose}</td>
                    <td className="px-10 py-6 font-mono font-black text-lg text-rose-600 text-right whitespace-nowrap">{od.amount.toLocaleString()} RWF</td>
                    {isAdmin && (
                      <td className="px-10 py-6 text-right whitespace-nowrap">
                        <div className="flex justify-end items-center gap-3">
                          <button
                            onClick={() => setShowSettleModal(od.id)}
                            className="text-[10px] bg-[#165b4c] text-white hover:bg-slate-900 font-black px-5 py-2.5 rounded-2xl transition-all shadow-xl shadow-[#165b4c]/20 active:scale-95"
                          >
                            LIQUIDATE
                          </button>
                          <button onClick={() => onDelete(od.id)} className="w-10 h-10 flex items-center justify-center text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-2xl transition-all"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
                {activeOverdrafts.length === 0 && (
                  <tr><td colSpan={isAdmin ? 5 : 4} className="px-10 py-24 text-center text-slate-300 font-black uppercase tracking-[0.3em] text-sm italic">Clean Registry: No Active External Liabilities</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverdraftManager;