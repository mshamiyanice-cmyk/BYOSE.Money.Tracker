
import React from 'react';
import { NavLink, Link } from 'react-router-dom';
import { auth } from '../services/firebase';
import { Inflow, Overdraft, UserProfile } from '../types';
import { X, LogOut, UserCircle, LayoutDashboard, ListTodo, Calendar, TrendingUp, TrendingDown, Receipt, Route } from 'lucide-react';
import './responsive.css';
        <div className="flex flex-col items-start mb-10 pl-2">
          <img src="/logo.jpg" alt="Company Logo" className="w-24 h-24 rounded-full border-2 border-white/10" />
        </div>

        <nav className="space-y-1 mb-10 overflow-y-auto max-h-[60vh] custom-scrollbar">
          {links.map(link => (
            <NavLink
              key={link.to} to={link.to} onClick={() => { if (window.innerWidth < 1024) onClose(); }}
              className={({ isActive }) =>
                `flex items-center gap-4 px-4 py-3 rounded-2xl transition-all ${isActive ? 'bg-[#165b4c] text-white shadow-lg font-bold' : 'text-slate-400 hover:bg-white/5'
                } ${''}`
              }
            >
              <link.icon size={20} className="stroke-[2.5px]" />
              <span className="text-sm">{link.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="mb-10 px-1">
          <p className="text-[10px] text-slate-500 mb-4 uppercase tracking-[0.2em] font-black">Account State</p>
          <div className={`p-4 rounded-3xl border ${totalDebt > 0 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-[#165b4c]/10 border-[#165b4c]/20'}`}>
            <p className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">{totalDebt > 0 ? 'Exposure' : 'Liquidity'}</p>
            <p className={`text-sm font-black ${totalDebt > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
              {totalDebt > 0 ? `-${totalDebt.toLocaleString()} RWF` : 'Pot Healthy'}
            </p>
          </div>
        </div>

        <div className="pt-8 border-t border-white/5 space-y-3">
          <Link to="/profile" className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl border border-white/5">
            <UserCircle size={24} className="text-slate-400" />
            <div className="flex-1 min-w-0"><p className="text-xs font-black text-slate-100 truncate">{profile?.name || 'Accountant'}</p></div>
          </Link>
          <button onClick={handleLogout} className="w-full flex items-center gap-4 px-4 py-4 rounded-2xl text-rose-400 bg-rose-500/5 hover:bg-rose-500/10 transition-all">
            <LogOut size={20} /> <span className="font-black text-xs uppercase tracking-widest">Sign Out</span>
          </button>
        </div>
      </aside >
    </>
  );
};

export default Sidebar;
