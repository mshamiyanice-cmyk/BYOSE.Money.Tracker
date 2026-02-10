
import React, { useState } from 'react';
import { Inflow, Outflow } from '../types';
import { Search, MapPin, ArrowRight, History, CreditCard, Building2, Tag, Wallet, Percent } from 'lucide-react';

interface FlowTrackerProps {
  inflows: Inflow[];
  outflows: Outflow[];
}

const FlowTracker: React.FC<FlowTrackerProps> = ({ inflows, outflows }) => {
  const [selectedInflowId, setSelectedInflowId] = useState<string | null>(null);

  const selectedInflow = inflows.find(i => i.id === selectedInflowId);
  const relatedOutflows = outflows.filter(o => o.inflowId === selectedInflowId);
  const totalSpent = selectedInflow ? (selectedInflow.amount - selectedInflow.remainingBalance) : 0;
  const utilizationPercent = selectedInflow ? Math.min(100, (totalSpent / selectedInflow.amount) * 100) : 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      {/* Left Selection Column */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 mb-6">
             <div className="p-2 bg-[#165b4c] text-white rounded-xl"><History size={18} /></div>
             <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Active Revenue Pots</h3>
          </div>
          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {inflows.map(inf => {
              const spent = inf.amount - inf.remainingBalance;
              const perc = (spent / inf.amount) * 100;
              return (
                <button
                  key={inf.id}
                  onClick={() => setSelectedInflowId(inf.id)}
                  className={`w-full p-5 rounded-2xl text-left transition-all border-2 group relative overflow-hidden ${
                    selectedInflowId === inf.id 
                    ? 'bg-[#165b4c] border-[#165b4c] text-white shadow-2xl shadow-[#165b4c]/30' 
                    : 'bg-white border-slate-100 text-slate-600 hover:border-[#165b4c]/20 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3 relative z-10">
                    <div className="min-w-0">
                      <p className="font-black text-sm truncate uppercase tracking-tight">{inf.source}</p>
                      <p className={`text-[10px] font-bold ${selectedInflowId === inf.id ? 'text-emerald-200' : 'text-slate-400'}`}>{inf.product}</p>
                    </div>
                    <span className="text-[10px] font-black font-mono opacity-50 shrink-0">{inf.date}</span>
                  </div>
                  <div className="flex justify-between items-center relative z-10 mb-4">
                    <span className="text-lg font-black">{inf.amount.toLocaleString()} <span className="text-xs opacity-70">RWF</span></span>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${selectedInflowId === inf.id ? 'bg-white/20' : 'bg-slate-50 group-hover:bg-[#165b4c]/10'}`}>
                      <ArrowRight size={14} className={selectedInflowId === inf.id ? 'text-white' : 'text-[#165b4c]'} />
                    </div>
                  </div>
                  {/* Pot Gauge */}
                  <div className="w-full h-1.5 bg-slate-100/20 rounded-full overflow-hidden relative z-10">
                    <div 
                      className={`h-full transition-all duration-1000 ${selectedInflowId === inf.id ? 'bg-white' : 'bg-[#165b4c]'}`}
                      style={{ width: `${Math.min(100, perc)}%` }}
                    ></div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Journey Visualization Column */}
      <div className="lg:col-span-8">
        {selectedInflow ? (
          <div className="bg-white p-8 md:p-12 rounded-[48px] shadow-2xl border border-slate-100 relative overflow-hidden">
            {/* Background Accent */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full -mr-32 -mt-32 opacity-50"></div>

            <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-12 relative z-10">
              <div className="max-w-md">
                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.25em] mb-2 block">Fund Lifecycle Tracking</span>
                <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none">{selectedInflow.source}</h3>
                <p className="text-slate-400 text-sm font-medium mt-3 leading-relaxed">Tracing every penny from acquisition on {selectedInflow.date} to its final strategic application.</p>
              </div>
              <div className="md:text-right bg-slate-50 p-6 rounded-3xl border border-slate-100 shadow-inner flex flex-col items-center md:items-end">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Utilization Gauge</p>
                <div className="flex items-center gap-3">
                  <p className="text-2xl font-black text-[#165b4c]">{utilizationPercent.toFixed(1)}%</p>
                  <Percent size={18} className="text-slate-300" />
                </div>
                <div className="w-32 h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-[#165b4c]" style={{ width: `${utilizationPercent}%` }}></div>
                </div>
              </div>
            </div>

            <div className="space-y-0 relative">
              {/* Central Path Line */}
              <div className="absolute left-8 top-12 bottom-12 w-1 bg-gradient-to-b from-emerald-200 via-slate-100 to-rose-200 rounded-full"></div>

              {/* START NODE */}
              <div className="flex gap-10 relative z-10 pb-16">
                <div className="w-16 h-16 rounded-[24px] bg-[#165b4c] text-white flex items-center justify-center shadow-2xl shadow-[#165b4c]/40 ring-8 ring-white shrink-0">
                  <CreditCard size={28} />
                </div>
                <div className="flex-1 pt-2">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[9px] font-black rounded-md uppercase tracking-wider">Origin</span>
                    <span className="text-xs font-bold text-slate-400">{selectedInflow.date}</span>
                  </div>
                  <h4 className="text-xl font-black text-slate-800">Funds Received</h4>
                  <p className="text-slate-500 font-medium max-w-md mt-2 leading-relaxed">Initial principal of <span className="text-[#165b4c] font-black">{selectedInflow.amount.toLocaleString()} RWF</span> authorized as {selectedInflow.product}.</p>
                </div>
              </div>

              {/* JOURNEY STEPS */}
              {relatedOutflows.map((out, idx) => (
                <div key={out.id} className="flex gap-10 relative z-10 pb-16 group">
                  <div className="w-16 h-16 rounded-[24px] bg-white border-2 border-slate-100 flex items-center justify-center shadow-xl group-hover:border-rose-300 transition-all shrink-0 relative overflow-hidden">
                    <div className="absolute inset-0 bg-rose-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <Building2 size={24} className="text-slate-400 group-hover:text-rose-500 transition-colors relative z-10" />
                  </div>
                  <div className="flex-1 pt-2">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[9px] font-black rounded-md uppercase tracking-wider">Step {idx + 1}: {out.category}</span>
                      <span className="text-xs font-bold text-slate-400">{out.date}</span>
                    </div>
                    <div className="flex justify-between items-start">
                      <h4 className="text-lg font-black text-slate-800">{out.seller}</h4>
                      <span className="text-lg font-black text-rose-600">-{out.amount.toLocaleString()} RWF</span>
                    </div>
                    <p className="text-slate-500 font-medium text-sm mt-1">{out.purpose}</p>
                    {out.expenseName && (
                      <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100">
                        <Tag size={12} className="text-rose-500" />
                        <span className="text-[10px] font-black text-slate-600 uppercase tracking-tighter">{out.expenseName}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* FINAL STATUS NODE */}
              <div className="flex gap-10 relative z-10 pt-4">
                <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center shadow-xl ring-8 ring-white shrink-0 ${selectedInflow.remainingBalance > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                  <Wallet size={28} />
                </div>
                <div className="flex-1 pt-2">
                   <h4 className="text-xl font-black text-slate-800">Current Pot Balance</h4>
                   <p className={`text-2xl font-black mt-1 ${selectedInflow.remainingBalance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                     {selectedInflow.remainingBalance.toLocaleString()} RWF
                   </p>
                   <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">
                     {selectedInflow.remainingBalance > 0 ? 'Liquid Capital Available' : 'Source Overdrawn / Debt Entry'}
                   </p>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[600px] bg-white rounded-[48px] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center p-12 text-center group">
             <div className="w-24 h-24 bg-slate-50 rounded-[32px] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                <Search size={48} className="text-slate-200" />
             </div>
             <h3 className="text-2xl font-black text-slate-400">Ledger Trace Required</h3>
             <p className="text-slate-300 font-medium max-w-xs mt-4">Select an active revenue pot from the registry to visualize its complete money journey.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default FlowTracker;
