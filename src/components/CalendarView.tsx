
import React, { useState } from 'react';
import { Inflow, Outflow } from '../types';
import { Button } from './ui/button';
import { X, ArrowUpCircle, ArrowDownCircle, Store, Tag, Info } from 'lucide-react';

interface CalendarViewProps {
  inflows: Inflow[];
  outflows: Outflow[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ inflows, outflows }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayDetails, setSelectedDayDetails] = useState<{ day: number, dateStr: string } | null>(null);

  const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1));

  const days = [];
  const totalDays = daysInMonth(year, month);
  const offset = firstDayOfMonth(year, month);

  // Padding for start of month
  for (let i = 0; i < offset; i++) {
    days.push(null);
  }
  for (let i = 1; i <= totalDays; i++) {
    days.push(i);
  }

  const getTransactionsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return {
      ins: inflows.filter(i => i.date === dateStr),
      outs: outflows.filter(o => o.date === dateStr),
      dateStr
    };
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];

  const handleDayClick = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    setSelectedDayDetails({ day, dateStr });
  };

  return (
    <div className="space-y-6 relative">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <h2 className="text-xl font-bold text-slate-800">{monthNames[month]} {year}</h2>
          <div className="flex gap-2">
            <button onClick={prevMonth} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
              <i className="fas fa-chevron-left text-slate-500"></i>
            </button>
            <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors text-slate-600">
              Today
            </button>
            <button onClick={nextMonth} className="p-2 hover:bg-slate-200 rounded-lg transition-colors">
              <i className="fas fa-chevron-right text-slate-500"></i>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 border-b border-slate-100 bg-white">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
            <div key={d} className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">
              {d}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 auto-rows-fr bg-slate-50/20">
          {days.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="bg-slate-50/30 p-4 border border-slate-50 min-h-[140px]"></div>;

            const { ins, outs } = getTransactionsForDay(day);
            const hasActivity = ins.length > 0 || outs.length > 0;
            const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

            return (
              <div
                key={day}
                onClick={() => handleDayClick(day)}
                className={`p-2 border border-slate-100 min-h-[140px] relative transition-all cursor-pointer group hover:z-10 hover:shadow-xl hover:border-[#165b4c]/30 ${hasActivity ? 'bg-white' : 'bg-slate-50/10'
                  }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-colors ${isToday ? 'bg-[#165b4c] text-white' : 'text-slate-400 group-hover:text-slate-800'
                    }`}>
                    {day}
                  </span>
                  {hasActivity && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#165b4c]/40 animate-pulse"></span>
                    </div>
                  )}
                </div>

                <div className="space-y-1 overflow-hidden">
                  {ins.slice(0, 2).map(i => (
                    <div key={i.id} className="text-[9px] px-1.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md flex justify-between items-center truncate shadow-sm">
                      <span className="truncate font-semibold">{i.source}</span>
                      <span className="font-black ml-1">+{i.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  {outs.slice(0, 2).map(o => (
                    <div key={o.id} className="text-[9px] px-1.5 py-1 bg-rose-50 text-rose-700 border border-rose-100 rounded-md flex justify-between items-center truncate shadow-sm">
                      <span className="truncate font-semibold">{o.seller}</span>
                      <span className="font-black ml-1">-{o.amount.toLocaleString()}</span>
                    </div>
                  ))}
                  {(ins.length + outs.length) > 4 && (
                    <div className="text-[8px] text-center font-bold text-slate-400 py-0.5">
                      +{(ins.length + outs.length) - 4} more activities
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Daily Detailed Transaction Log Modal */}
      {selectedDayDetails && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[32px] shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            {/* Header */}
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-10">
              <div>
                <p className="text-[#165b4c] text-xs font-black uppercase tracking-[0.2em] mb-1">BYOSE TECH Log</p>
                <h3 className="text-3xl font-black text-slate-900 leading-tight">
                  {monthNames[month]} {selectedDayDetails.day}, {year}
                </h3>
              </div>
              <button
                onClick={() => setSelectedDayDetails(null)}
                className="w-12 h-12 bg-slate-50 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-2xl flex items-center justify-center transition-all shadow-sm"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-8 overflow-y-auto space-y-8">
              {/* Summary Bar */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Inflow</p>
                  <p className="text-xl font-black text-emerald-700">
                    {getTransactionsForDay(selectedDayDetails.day).ins.reduce((s, i) => s + i.amount, 0).toLocaleString()} <span className="text-xs font-medium">RWF</span>
                  </p>
                </div>
                <div className="p-4 bg-rose-50 rounded-2xl border border-rose-100">
                  <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Total Outflow</p>
                  <p className="text-xl font-black text-rose-700">
                    {getTransactionsForDay(selectedDayDetails.day).outs.reduce((s, o) => s + o.amount, 0).toLocaleString()} <span className="text-xs font-medium">RWF</span>
                  </p>
                </div>
              </div>

              {/* Detail Lists */}
              <div className="space-y-8">
                {/* INFLOWS */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <ArrowUpCircle className="text-emerald-500" size={18} />
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Revenue & Receipts</h4>
                  </div>
                  <div className="space-y-3">
                    {getTransactionsForDay(selectedDayDetails.day).ins.length > 0 ? (
                      getTransactionsForDay(selectedDayDetails.day).ins.map(inf => (
                        <div key={inf.id} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100 flex justify-between items-center group hover:bg-emerald-50/30 transition-colors">
                          <div className="flex gap-4 items-center">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm border border-slate-100 group-hover:border-emerald-200">
                              <Info size={16} />
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-sm">{inf.source}</p>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{inf.product}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-base font-black text-emerald-600">+{inf.amount.toLocaleString()} RWF</p>
                            <p className="text-[10px] text-slate-400 font-medium">Balance: {inf.remainingBalance.toLocaleString()} RWF</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-400 italic py-2">No funds received on this date.</p>
                    )}
                  </div>
                </section>

                {/* OUTFLOWS */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <ArrowDownCircle className="text-rose-500" size={18} />
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-wider">Expenditures & Payments</h4>
                  </div>
                  <div className="space-y-3">
                    {getTransactionsForDay(selectedDayDetails.day).outs.length > 0 ? (
                      getTransactionsForDay(selectedDayDetails.day).outs.map(out => (
                        <div key={out.id} className="p-5 bg-slate-50/50 rounded-2xl border border-slate-100 group hover:bg-rose-50/30 transition-colors">
                          <div className="flex justify-between items-start mb-3">
                            <div className="flex gap-3 items-center">
                              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-rose-600 shadow-sm border border-slate-100 group-hover:border-rose-200">
                                <Store size={18} />
                              </div>
                              <div>
                                <p className="font-bold text-slate-900">{out.seller}</p>
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] px-2 py-0.5 bg-rose-100 text-rose-600 rounded-full font-black uppercase">{out.category}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-lg font-black text-rose-600">-{out.amount.toLocaleString()} RWF</p>
                            </div>
                          </div>

                          <div className="pl-12 space-y-2 border-l-2 border-slate-100 ml-5">
                            <div className="flex items-start gap-2">
                              <Tag size={12} className="text-slate-400 mt-1 shrink-0" />
                              <p className="text-sm text-slate-700 font-medium leading-tight">
                                <span className="font-black text-slate-900 mr-2">{out.expenseName || 'Operational'}</span>
                                {out.purpose}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                                Traced to: {inflows.find(i => i.id === out.inflowId)?.source || 'Unknown Pot'}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-400 italic py-2">No money spent on this date.</p>
                    )}
                  </div>
                </section>
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-center">
              <Button
                variant="outline"
                className="rounded-2xl px-12 h-12 font-bold bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                onClick={() => setSelectedDayDetails(null)}
              >
                Return to Calendar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarView;
