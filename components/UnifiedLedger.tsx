
import React, { useState, useMemo } from 'react';
import { Inflow, Outflow, Overdraft } from '../types';
import { Search, Filter, ArrowUpRight, ArrowDownLeft, AlertCircle, FileText, Download } from 'lucide-react';

interface UnifiedLedgerProps {
  inflows: Inflow[];
  outflows: Outflow[];
  overdrafts: Overdraft[];
}

type CombinedTransaction = {
  id: string;
  date: string;
  type: 'INFLOW' | 'OUTFLOW' | 'OVERDRAFT';
  label: string;
  party: string;
  amount: number;
  category: string;
};

const UnifiedLedger: React.FC<UnifiedLedgerProps> = ({ inflows, outflows, overdrafts }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'INFLOW' | 'OUTFLOW' | 'OVERDRAFT'>('ALL');

  const combined = useMemo(() => {
    const list: CombinedTransaction[] = [
      ...inflows.map(i => ({
        id: i.id,
        date: i.date,
        type: 'INFLOW' as const,
        label: i.product,
        party: i.source,
        amount: i.amount,
        category: 'Revenue'
      })),
      ...outflows.map(o => ({
        id: o.id,
        date: o.date,
        type: 'OUTFLOW' as const,
        label: o.expenseName || o.purpose,
        party: o.seller,
        amount: -o.amount,
        category: o.category
      })),
      ...overdrafts.map(od => ({
        id: od.id,
        date: od.date,
        type: 'OVERDRFT' as any, // Visual tag
        label: od.purpose,
        party: od.seller,
        amount: -od.amount,
        category: od.isSettled ? 'Settled' : 'Pending'
      }))
    ];
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [inflows, outflows, overdrafts]);

  const filteredData = combined.filter(item => {
    const matchesSearch = item.party.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.label.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'ALL' || item.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Master Ledger</h2>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Unified Transaction Stream</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#165b4c]" size={18} />
            <input 
              type="text"
              placeholder="Search audit trail..."
              className="pl-12 pr-6 py-3 bg-white border-2 border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-[#165b4c]/10 focus:border-[#165b4c] text-sm font-bold w-full md:w-64 transition-all"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <select 
            className="px-4 py-3 bg-white border-2 border-slate-100 rounded-2xl text-sm font-black text-slate-600 outline-none cursor-pointer focus:border-[#165b4c]"
            value={filterType}
            onChange={e => setFilterType(e.target.value as any)}
          >
            <option value="ALL">All Entries</option>
            <option value="INFLOW">Credits Only</option>
            <option value="OUTFLOW">Debits Only</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              <tr>
                <th className="px-8 py-5">Accounting Date</th>
                <th className="px-8 py-5">Transaction Details</th>
                <th className="px-8 py-5">Classification</th>
                <th className="px-8 py-5 text-right">Impact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredData.map((item, idx) => (
                <tr key={`${item.id}-${idx}`} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <span className="text-xs font-bold text-slate-400 font-mono">{item.date}</span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                        item.amount > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {item.amount > 0 ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 text-sm leading-tight">{item.party}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter mt-1">{item.label}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className={`text-[9px] font-black px-2 py-1 rounded-md uppercase tracking-wider ${
                      item.amount > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {item.category}
                    </span>
                  </td>
                  <td className={`px-8 py-5 text-right font-mono font-black text-sm ${
                    item.amount > 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {item.amount > 0 ? '+' : ''}{item.amount.toLocaleString()} RWF
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-8 py-20 text-center">
                    <FileText className="mx-auto text-slate-200 mb-4" size={48} />
                    <p className="text-slate-400 font-bold italic">No matching records found in the ledger.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UnifiedLedger;
