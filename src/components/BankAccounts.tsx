import React, { useState } from 'react';
import { Inflow, Outflow } from '../types';
import { Landmark, ArrowUpRight, ArrowDownLeft, Building2, Wallet } from 'lucide-react';
import { format } from 'date-fns';

interface BankAccountsProps {
    inflows: Inflow[];
    outflows: Outflow[];
}

interface BankAccount {
    id: string; // Composite: name + number
    name: string;
    number: string;
    currency: 'RWF' | 'USD';
    balance: number;
    totalIn: number;
    totalOut: number;
    transactions: {
        id: string;
        date: string;
        description: string;
        amount: number;
        type: 'in' | 'out';
    }[];
}

const BankAccounts: React.FC<BankAccountsProps> = ({ inflows, outflows }) => {
    const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);

    // Derive accounts from data
    const accounts: BankAccount[] = [];
    const accountMap = new Map<string, BankAccount>();

    // Process Inflows (Deposits)
    inflows.forEach(inf => {
        // Check if it's a bank transaction
        if (inf.product === 'Deposit' || inf.paymentMethod === 'Bank') {
            const bankName = inf.bankAccountName || 'Main Account';
            const accNum = inf.accountNumber || 'N/A';
            const currency = inf.currency || 'RWF';
            const key = `${bankName}-${accNum}-${currency}`;

            if (!accountMap.has(key)) {
                accountMap.set(key, {
                    id: key,
                    name: bankName,
                    number: accNum,
                    currency,
                    balance: 0,
                    totalIn: 0,
                    totalOut: 0,
                    transactions: []
                });
            }

            const acc = accountMap.get(key)!;
            acc.balance += inf.amount;
            acc.totalIn += inf.amount;
            acc.transactions.push({
                id: inf.id,
                date: inf.date,
                description: `Deposit from ${inf.source}`,
                amount: inf.amount,
                type: 'in'
            });
        }
    });

    // Process Outflows (Payments) based on Inflow linkage
    outflows.forEach(out => {
        // Find the source inflow to know which bank it came from
        const sourceInflow = inflows.find(i => i.id === out.inflowId);
        if (sourceInflow && (sourceInflow.product === 'Deposit' || sourceInflow.paymentMethod === 'Bank')) {
            const bankName = sourceInflow.bankAccountName || 'Main Account';
            const accNum = sourceInflow.accountNumber || 'N/A';
            const currency = sourceInflow.currency || 'RWF';
            const key = `${bankName}-${accNum}-${currency}`;

            if (accountMap.has(key)) {
                const acc = accountMap.get(key)!;
                acc.balance -= out.amount;
                acc.totalOut += out.amount;
                acc.transactions.push({
                    id: out.id,
                    date: out.date,
                    description: `Payment to ${out.seller} (${out.purpose})`,
                    amount: out.amount,
                    type: 'out'
                });
            }
        }
    });

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Bank Accounts</h2>
                    <p className="text-slate-400 font-medium">Overview of all linked bank accounts</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from(accountMap.values()).map(acc => (
                    <div
                        key={acc.id}
                        onClick={() => setSelectedAccount(acc)}
                        className="group bg-white p-6 rounded-[24px] shadow-sm border border-slate-100 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 p-32 bg-[#165b4c]/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />

                        <div className="relative z-10">
                            <div className="flex justify-between items-start mb-8">
                                <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-[#165b4c] group-hover:text-white transition-colors">
                                    <Building2 size={24} />
                                </div>
                                <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-wider">
                                    {acc.currency}
                                </span>
                            </div>

                            <h3 className="text-lg font-bold text-slate-800 mb-1">{acc.name}</h3>
                            <p className="text-sm text-slate-400 font-mono mb-6">**** {acc.number.slice(-4)}</p>

                            <div className="space-y-1">
                                <p className="text-sm text-slate-400 font-medium">Available Balance</p>
                                <p className={`text-2xl font-black ${acc.balance < 0 ? 'text-rose-600' : 'text-[#165b4c]'}`}>
                                    {acc.currency === 'USD' ? '$' : 'RWF'} {acc.balance.toLocaleString()}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}

                {accountMap.size === 0 && (
                    <div className="col-span-full py-20 text-center bg-slate-50 rounded-[24px] border-2 border-dashed border-slate-200">
                        <Wallet className="mx-auto text-slate-300 mb-4" size={48} />
                        <h3 className="text-lg font-bold text-slate-400">No Bank Accounts Found</h3>
                        <p className="text-slate-400">Log a "Deposit" inflow to see accounts here.</p>
                    </div>
                )}
            </div>

            {/* Transaction History Modal */}
            {selectedAccount && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div>
                                <h3 className="text-xl font-bold text-slate-800">{selectedAccount.name} History</h3>
                                <p className="text-sm text-slate-400 font-mono">{selectedAccount.number}</p>
                            </div>
                            <button onClick={() => setSelectedAccount(null)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                                <i className="fas fa-times text-slate-400"></i>
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
                            <div className="space-y-4">
                                {selectedAccount.transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(t => (
                                    <div key={t.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-xl flex items-center justify-center w-12 h-12 shrink-0 ${t.type === 'in' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                                {t.type === 'in' ? <ArrowDownLeft size={20} /> : <ArrowUpRight size={20} />}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm line-clamp-1">{t.description}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{format(new Date(t.date), 'MMM dd, yyyy')}</p>
                                            </div>
                                        </div>
                                        <span className={`font-mono font-bold text-lg whitespace-nowrap ${t.type === 'in' ? 'text-emerald-600' : 'text-slate-800'}`}>
                                            {t.type === 'in' ? '+' : '-'}{t.amount.toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                                {selectedAccount.transactions.length === 0 && (
                                    <div className="text-center py-12">
                                        <p className="text-slate-400 font-medium">No transactions found for this account.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BankAccounts;
