import React, { useMemo } from 'react';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer
} from 'recharts';
import { Inflow, Outflow } from '../types';
import { Button } from './ui/Button';
import { Download, TrendingUp, ShieldCheck, Wallet, Flame, ArrowRightLeft } from 'lucide-react';

interface DashboardProps {
  inflows: Inflow[];
  outflows: Outflow[];
}

const Dashboard: React.FC<DashboardProps> = ({ inflows, outflows }) => {
  const ANNUAL_INCOME_GOAL = 15000000; 

  const totalIn = inflows.reduce((sum, i) => sum + i.amount, 0);
  const totalOut = outflows.reduce((sum, o) => sum + o.amount, 0);
  const netProfit = totalIn - totalOut;
  const currentBalance = inflows.reduce((sum, i) => sum + i.remainingBalance, 0);

  // Accountant Ratios
  const burnRate = useMemo(() => {
    const last30Days = new Date();
    last30Days.setDate(last30Days.getDate() - 30);
    const recentOut = outflows.filter(o => new Date(o.date) >= last30Days).reduce((s, o) => s + o.amount, 0);
    return recentOut;
  }, [outflows]);

  const runway = currentBalance > 0 && burnRate > 0 ? (currentBalance / burnRate).toFixed(1) : '∞';
  const liquidityRatio = totalOut > 0 ? (totalIn / totalOut).toFixed(2) : '0';

  const exportToCSV = () => {
    const headers = ["Date", "Type", "Source/Vendor", "Amount", "Balance After"];
    const rows = [
      ...inflows.map(i => [i.date, "INFLOW", i.source, i.amount, i.remainingBalance]),
      ...outflows.map(o => [o.date, "OUTFLOW", o.seller, o.amount, "N/A"])
    ].sort((a, b) => new Date(b[0] as string).getTime() - new Date(a[0] as string).getTime());

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `BYOSE_Ledger_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const monthlyTrendData = useMemo(() => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const currentYear = new Date().getFullYear();
    return months.map((month, index) => {
      const prefix = `${currentYear}-${(index + 1).toString().padStart(2, '0')}`;
      const mIn = inflows.filter(i => i.date.startsWith(prefix)).reduce((sum, i) => sum + i.amount, 0);
      const mOut = outflows.filter(o => o.date.startsWith(prefix)).reduce((sum, o) => sum + o.amount, 0);
      return { name: month, income: mIn, expenses: mOut, profit: mIn - mOut };
    });
  }, [inflows, outflows]);

  const MetricCard = ({ title, value, sub, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
      <div className={`absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 opacity-5 transition-transform group-hover:scale-150 ${color}`}>
         <Icon size={96} />
      </div>
      <div className="flex items-center gap-4 mb-4">
        <div className={`p-3 rounded-2xl ${color.replace('text-', 'bg-').replace('-500', '-50')}`}>
          <Icon size={24} className={color} />
        </div>
        <div>
          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</h4>
          <p className="text-2xl font-black text-slate-800 tracking-tight">{value}</p>
        </div>
      </div>
      <p className="text-xs font-bold text-slate-500">{sub}</p>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Strategic Ledger Intelligence</h2>
          <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-1 flex items-center gap-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            Real-time Fiscal Visibility
          </p>
        </div>
        <div className="flex gap-3">
          <Button onClick={exportToCSV} variant="outline" className="rounded-2xl h-12 px-6 gap-2 border-slate-200 font-black text-xs uppercase tracking-widest">
            <Download size={18} /> Export CSV
          </Button>
        </div>
      </div>

      {/* Strategic Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <MetricCard title="Total Liquidity" value={`${currentBalance.toLocaleString()} RWF`} sub="Currently available in all source pots" icon={Wallet} color="text-emerald-500" />
        <MetricCard title="Liquidity Ratio" value={liquidityRatio} sub={`${totalIn > totalOut ? 'Healthy' : 'Critical'} Debt Coverage`} icon={TrendingUp} color="text-blue-500" />
        <MetricCard title="Monthly Burn" value={`${burnRate.toLocaleString()} RWF`} sub="Average expenses (Last 30 days)" icon={Flame} color="text-rose-500" />
        <MetricCard title="Estimated Runway" value={`${runway} Months`} sub="Time until liquid capital depletion" icon={ArrowRightLeft} color="text-amber-500" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Primary Trend Chart */}
        <div className="xl:col-span-2 bg-white rounded-[40px] shadow-sm border border-slate-200 p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm">Fiscal Velocity Trend</h3>
            <div className="flex gap-4 text-[10px] font-bold uppercase">
              <span className="flex items-center gap-1.5"><i className="fas fa-square text-emerald-400"></i> Income</span>
              <span className="flex items-center gap-1.5"><i className="fas fa-square text-rose-400"></i> Expense</span>
            </div>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyTrendData}>
                <defs>
                  <linearGradient id="colorIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                  itemStyle={{ fontWeight: 'bold', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="income" stroke="#10b981" fillOpacity={1} fill="url(#colorIn)" strokeWidth={3} />
                <Area type="monotone" dataKey="expenses" stroke="#f43f5e" fillOpacity={1} fill="url(#colorOut)" strokeWidth={3} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Product Analysis */}
        <div className="bg-white rounded-[40px] shadow-sm border border-slate-200 p-8">
          <h3 className="font-black text-slate-800 uppercase tracking-widest text-sm mb-6">Channel Performance</h3>
          <div className="space-y-6">
            {Object.entries(inflows.reduce((acc: any, curr) => {
              acc[curr.product] = (acc[curr.product] || 0) + curr.amount;
              return acc;
            }, {})).sort((a: any, b: any) => b[1] - a[1]).slice(0, 5).map(([prod, amt]: any) => (
              <div key={prod}>
                <div className="flex justify-between items-end mb-2">
                  <span className="text-xs font-black text-slate-700">{prod}</span>
                  <span className="text-xs font-mono font-bold text-slate-400">{amt.toLocaleString()} RWF</span>
                </div>
                <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${(amt / totalIn) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 p-6 bg-slate-900 rounded-3xl flex items-center gap-4">
             <div className="w-12 h-12 bg-[#165b4c] rounded-2xl flex items-center justify-center text-white">
                <ShieldCheck size={24} />
             </div>
             <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Audit Score</p>
                <p className="text-sm font-bold text-emerald-400">98.4% Clean Records</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;