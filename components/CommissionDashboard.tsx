import React, { useState, useMemo } from 'react';
import { saveBankAccount } from '../services/supabaseService';
import { 
    User, 
    Lead, 
    BankAccount, 
    FinancialCategory, 
    FinancialTransaction 
} from '../types';
import { 
    Award, 
    DollarSign, 
    TrendingUp, 
    ChevronDown, 
    ChevronUp, 
    CheckCircle2, 
    Calendar, 
    ArrowUpRight, 
    Sliders,
    Users,
    Check,
    Wallet,
    Percent,
    AlertCircle,
    Building2,
    Briefcase
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CommissionDashboardProps {
    users: User[];
    leads: Lead[];
    bankAccounts: BankAccount[];
    categories: FinancialCategory[];
    currentUser: User;
    startDate: string;
    endDate: string;
    onSaveTransaction?: (t: FinancialTransaction) => Promise<void>;
    setTransactions: React.Dispatch<React.SetStateAction<FinancialTransaction[]>>;
    setBankAccounts: React.Dispatch<React.SetStateAction<BankAccount[]>>;
}

export const CommissionDashboard: React.FC<CommissionDashboardProps> = ({
    users,
    leads,
    bankAccounts,
    categories,
    currentUser,
    startDate,
    endDate,
    onSaveTransaction,
    setTransactions,
    setBankAccounts
}) => {
    // 3 customizable Target levels and commission rates
    const [tier1Amount, setTier1Amount] = useState(10000);
    const [tier1Rate, setTier1Rate] = useState(2.5); // Bronze (2.5%)
    
    const [tier2Amount, setTier2Amount] = useState(25000);
    const [tier2Rate, setTier2Rate] = useState(5.0); // Prata (5%)
    
    const [tier3Amount, setTier3Amount] = useState(50000);
    const [tier3Rate, setTier3Rate] = useState(10.0); // Ouro (10%)

    const [baseRate, setBaseRate] = useState(1.0); // No tier reached (1%)

    // Expanded agents view state
    const [expandedAgents, setExpandedAgents] = useState<Record<string, boolean>>({});

    // Transaction launch modal state
    const [launchModalAgentId, setLaunchModalAgentId] = useState<string | null>(null);
    const [launchDescription, setLaunchDescription] = useState('');
    const [launchAmount, setLaunchAmount] = useState(0);
    const [launchDate, setLaunchDate] = useState(new Date().toISOString().split('T')[0]);
    const [selectedBankId, setSelectedBankId] = useState('');
    const [selectedCategoryId, setSelectedCategoryId] = useState('');
    const [launchStatus, setLaunchStatus] = useState<'PAID' | 'PENDING'>('PAID');
    const [launchSuccessMsg, setLaunchSuccessMsg] = useState<string | null>(null);
    const [launchErrorMsg, setLaunchErrorMsg] = useState<string | null>(null);

    // Toggle Agent expansion
    const toggleAgent = (id: string) => {
        setExpandedAgents(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Filter won leads within selected period
    const wonLeadsInPeriod = useMemo(() => {
        return leads.filter(l => {
            if (l.status !== 'WON') return false;
            
            const leadDateVal = l.updatedAt || l.createdAt;
            if (!leadDateVal) return false;
            
            const leadTime = typeof leadDateVal === 'number' ? leadDateVal : new Date(leadDateVal).getTime();
            const start = new Date(startDate).getTime();
            // End of the day for the endDate
            const end = new Date(endDate + 'T23:59:59.999Z').getTime();
            
            return leadTime >= start && leadTime <= end;
        });
    }, [leads, startDate, endDate]);

    // Commercial or manager role users list + anyone with won leads in period
    const relevantUsers = useMemo(() => {
        const withRole = users.filter(u => u.role === 'COMMERCIAL' || u.role === 'MANAGER' || u.role === 'ADMIN');
        const wonLeadsResponsibleIds = new Set(wonLeadsInPeriod.map(l => l.responsibleId).filter(Boolean));
        
        const finalUsers = [...withRole];
        users.forEach(u => {
            if (wonLeadsResponsibleIds.has(u.id) && !finalUsers.some(fu => fu.id === u.id)) {
                finalUsers.push(u);
            }
        });
        
        return finalUsers;
    }, [users, wonLeadsInPeriod]);

    // Calculate goals and commission metrics for each agent
    const agentsStats = useMemo(() => {
        return relevantUsers.map(u => {
            const agentLeads = wonLeadsInPeriod.filter(l => l.responsibleId === u.id);
            const totalSalesValue = agentLeads.reduce((acc, l) => acc + (l.value || 0), 0);
            const salesCount = agentLeads.length;

            let rate = baseRate;
            let currentTierName = 'Abaixo da Meta';
            let tierColorClass = 'text-slate-500 bg-slate-100 border-slate-200';
            let nextGoalAmount = tier1Amount;
            let progressPercent = 0;

            if (totalSalesValue >= tier3Amount) {
                rate = tier3Rate;
                currentTierName = 'Ouro (Nível 3)';
                tierColorClass = 'text-amber-700 bg-amber-50 border-amber-200';
                nextGoalAmount = 0;
                progressPercent = 100;
            } else if (totalSalesValue >= tier2Amount) {
                rate = tier2Rate;
                currentTierName = 'Prata (Nível 2)';
                tierColorClass = 'text-indigo-700 bg-indigo-50 border-indigo-200';
                nextGoalAmount = tier3Amount;
                progressPercent = Math.min(100, Math.round(((totalSalesValue - tier2Amount) / (tier3Amount - tier2Amount)) * 100));
            } else if (totalSalesValue >= tier1Amount) {
                rate = tier1Rate;
                currentTierName = 'Bronze (Nível 1)';
                tierColorClass = 'text-orange-700 bg-orange-50 border-orange-200';
                nextGoalAmount = tier2Amount;
                progressPercent = Math.min(100, Math.round(((totalSalesValue - tier1Amount) / (tier2Amount - tier1Amount)) * 100));
            } else {
                rate = baseRate;
                nextGoalAmount = tier1Amount;
                progressPercent = Math.min(100, Math.round((totalSalesValue / tier1Amount) * 100));
            }

            const calculatedCommissionValue = totalSalesValue * (rate / 100);

            return {
                id: u.id,
                user: u,
                totalSalesValue,
                salesCount,
                rate,
                currentTierName,
                tierColorClass,
                nextGoalAmount,
                progressPercent,
                calculatedCommissionValue,
                leads: agentLeads
            };
        }).sort((a, b) => b.totalSalesValue - a.totalSalesValue);
    }, [relevantUsers, wonLeadsInPeriod, tier1Amount, tier1Rate, tier2Amount, tier2Rate, tier3Amount, tier3Rate, baseRate]);

    // Overall summary metrics
    const overallStats = useMemo(() => {
        const totalSales = wonLeadsInPeriod.reduce((acc, l) => acc + (l.value || 0), 0);
        const totalCommissionsToPay = agentsStats.reduce((acc, a) => acc + a.calculatedCommissionValue, 0);
        const topSeller = agentsStats[0]?.totalSalesValue > 0 ? agentsStats[0] : null;
        
        let bronzeCount = 0;
        let silverCount = 0;
        let goldCount = 0;
        agentsStats.forEach(a => {
            if (a.totalSalesValue >= tier3Amount) goldCount++;
            else if (a.totalSalesValue >= tier2Amount) silverCount++;
            else if (a.totalSalesValue >= tier1Amount) bronzeCount++;
        });

        return {
            totalSales,
            totalCommissionsToPay,
            topSeller,
            bronzeCount,
            silverCount,
            goldCount
        };
    }, [wonLeadsInPeriod, agentsStats, tier1Amount, tier2Amount, tier3Amount]);

    // Trigger launching modal
    const openLaunchModal = (agentId: string, calcCommission: number, agentName: string) => {
        setLaunchModalAgentId(agentId);
        setLaunchAmount(Math.round(calcCommission * 100) / 100);
        setLaunchDescription(`Pagamento de Comissão Comercial - ${agentName} (${startDate} a ${endDate})`);
        setLaunchDate(new Date().toISOString().split('T')[0]);
        setLaunchSuccessMsg(null);
        setLaunchErrorMsg(null);

        // Pre-select first checking account if available
        const checkingAcc = bankAccounts.find(a => a.type === 'CHECKING' && a.status === 'ACTIVE') || bankAccounts[0];
        setSelectedBankId(checkingAcc ? checkingAcc.id : '');

        // Pre-select expense category with "comissao" or "pessoal" name
        const commCat = categories.find(c => 
            c.type === 'EXPENSE' && 
            (c.name.toLowerCase().includes('comis') || c.name.toLowerCase().includes('pessoal') || c.name.toLowerCase().includes('venda'))
        ) || categories.find(c => c.type === 'EXPENSE') || categories[0];
        setSelectedCategoryId(commCat ? commCat.id : '');
    };

    // Save commission launch
    const handleLaunchCommission = async () => {
        if (!launchDescription || !launchAmount || !selectedBankId || !selectedCategoryId) {
            setLaunchErrorMsg('Por favor, preencha todos os campos obrigatórios.');
            return;
        }

        try {
            const payoutTxn: FinancialTransaction = {
                id: `comm_${Date.now()}`,
                description: launchDescription,
                amount: launchAmount,
                type: 'EXPENSE',
                date: launchDate,
                status: launchStatus,
                categoryId: selectedCategoryId,
                bankAccountId: selectedBankId,
                responsibleId: launchModalAgentId || currentUser.id,
                createdAt: Date.now()
            };

            if (onSaveTransaction) {
                await onSaveTransaction(payoutTxn);
            } else {
                setTransactions(prev => [payoutTxn, ...prev]);
            }

            // Update local bank account balance if marked as PAID
            if (launchStatus === 'PAID') {
                setBankAccounts(prev => prev.map(acc => {
                    if (acc.id === selectedBankId) {
                        const updatedAcc = {
                            ...acc,
                            balance: acc.balance - launchAmount
                        };
                        saveBankAccount(updatedAcc).catch(err => {
                            console.error('Erro ao salvar saldo de comissao atualizado:', err);
                        });
                        return updatedAcc;
                    }
                    return acc;
                }));
            }

            setLaunchSuccessMsg(`Comissão de ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(launchAmount)} lançada com sucesso no financeiro!`);
            
            // Auto close after 2 seconds
            setTimeout(() => {
                setLaunchModalAgentId(null);
            }, 2000);
        } catch (err: any) {
            console.error(err);
            setLaunchErrorMsg(err.message || 'Ocorreu um erro ao lançar a comissão.');
        }
    };

    return (
        <div className="space-y-6">
            {/* Period status indicator */}
            <div className="bg-slate-900 text-white rounded-[32px] p-6 border border-slate-800 shadow-premium flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3.5 bg-pink-500/10 text-pink-400 rounded-2xl border border-pink-500/20">
                        <Calendar size={22} />
                    </div>
                    <div>
                        <span className="text-[10px] font-black uppercase text-pink-400 tracking-[0.2em] block">Controle e Fechamento</span>
                        <h2 className="text-2xl font-black text-white tracking-tight mt-0.5">Comissões Comercial</h2>
                        <p className="text-xs text-slate-400/80 font-bold mt-1">
                            Sincronizado com o período de: <strong className="text-slate-100">{new Date(startDate).toLocaleDateString('pt-BR')}</strong> até <strong className="text-slate-100">{new Date(endDate).toLocaleDateString('pt-BR')}</strong>
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-2xl text-[9px] text-slate-400 font-extrabold uppercase tracking-widest">
                    <CheckCircle2 size={13} className="text-emerald-500" /> Negócios Ganhos no CRM
                </div>
            </div>

            {/* Overall stats list */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-premium relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <TrendingUp size={80} className="text-emerald-500" />
                    </div>
                    <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Total de Vendas no CRM</p>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tighter">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(overallStats.totalSales)}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-2 font-mono">
                        {wonLeadsInPeriod.length} contratos fechados ganhos
                    </p>
                </div>

                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-premium relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <DollarSign size={80} className="text-pink-500" />
                    </div>
                    <p className="text-pink-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Comissões Geradas</p>
                    <h3 className="text-2xl font-black text-slate-800 tracking-tighter">
                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(overallStats.totalCommissionsToPay)}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-2 font-mono">
                        Estimativa pendente de lançamento
                    </p>
                </div>

                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-premium relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Award size={80} className="text-amber-500" />
                    </div>
                    <p className="text-amber-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Destaque de Vendas</p>
                    <h3 className="text-lg font-black text-slate-800 tracking-tight leading-7 truncate">
                        {overallStats.topSeller ? overallStats.topSeller.user.name : 'Nenhum'}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-bold mt-1 font-mono">
                        {overallStats.topSeller ? `${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(overallStats.topSeller.totalSalesValue)} vendidos` : 'Sem vendas no período'}
                    </p>
                </div>

                <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-premium relative overflow-hidden group">
                    <div className="absolute right-0 top-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                        <Users size={80} className="text-indigo-500" />
                    </div>
                    <p className="text-indigo-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">Metas Atingidas</p>
                    <div className="flex gap-2 items-center mt-1">
                        <span className="px-2 py-1 bg-amber-50 border border-amber-200 text-amber-700 rounded-xl text-[9px] font-black uppercase">
                            👑 Ouro: {overallStats.goldCount}
                        </span>
                        <span className="px-2 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl text-[9px] font-black uppercase">
                            ✨ Prata: {overallStats.silverCount}
                        </span>
                        <span className="px-2 py-1 bg-orange-50 border border-orange-200 text-orange-700 rounded-xl text-[9px] font-black uppercase">
                            🔥 Bronz: {overallStats.bronzeCount}
                        </span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold mt-2 font-mono">
                        De um total de {agentsStats.length} comerciais ativos
                    </p>
                </div>
            </div>

            {/* Target Settings Adjust Panel */}
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-premium p-6">
                <div className="flex items-center gap-2 mb-6">
                    <div className="p-2 bg-pink-50 text-pink-500 rounded-xl">
                        <Sliders size={16} />
                    </div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Configuração de Faixas de Metas e Alíquotas</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Base Level */}
                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                        <div className="flex items-center justify-between gap-1 mb-3">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Comissão de Entrada</span>
                            <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full text-[9px] font-black uppercase">Base</span>
                        </div>
                        <div className="space-y-3">
                            <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Alíquota (%)</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        step="0.1"
                                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-black outline-none focus:border-pink-500 transition-all pr-8"
                                        value={baseRate}
                                        onChange={(e) => setBaseRate(parseFloat(e.target.value) || 0)}
                                    />
                                    <Percent size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Level 1 (Bronze) */}
                    <div className="bg-orange-50/30 p-4 rounded-2xl border border-orange-100/50">
                        <div className="flex items-center justify-between gap-1 mb-3">
                            <span className="text-[10px] font-black uppercase tracking-wider text-orange-800">Meta Bronze (Nível 1)</span>
                            <span className="px-2 py-0.5 bg-orange-100 text-orange-800 rounded-full text-[9px] font-black uppercase">Tier 1</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Valor Alvo (R$)</label>
                                <input 
                                    type="number" 
                                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-black outline-none focus:border-pink-500 transition-all"
                                    value={tier1Amount}
                                    onChange={(e) => setTier1Amount(parseInt(e.target.value) || 0)}
                                />
                            </div>
                            <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Comissão (%)</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        step="0.1"
                                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-black outline-none focus:border-pink-500 transition-all pr-6"
                                        value={tier1Rate}
                                        onChange={(e) => setTier1Rate(parseFloat(e.target.value) || 0)}
                                    />
                                    <Percent size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Level 2 (Silver) */}
                    <div className="bg-indigo-50/30 p-4 rounded-2xl border border-indigo-100/50">
                        <div className="flex items-center justify-between gap-1 mb-3">
                            <span className="text-[10px] font-black uppercase tracking-wider text-indigo-800">Meta Prata (Nível 2)</span>
                            <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-[9px] font-black uppercase">Tier 2</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Valor Alvo (R$)</label>
                                <input 
                                    type="number" 
                                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-black outline-none focus:border-pink-500 transition-all"
                                    value={tier2Amount}
                                    onChange={(e) => setTier2Amount(parseInt(e.target.value) || 0)}
                                />
                            </div>
                            <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Comissão (%)</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        step="0.1"
                                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-black outline-none focus:border-pink-500 transition-all pr-6"
                                        value={tier2Rate}
                                        onChange={(e) => setTier2Rate(parseFloat(e.target.value) || 0)}
                                    />
                                    <Percent size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Level 3 (Gold) */}
                    <div className="bg-amber-550/5 p-4 rounded-2xl border border-amber-200/50">
                        <div className="flex items-center justify-between gap-1 mb-3">
                            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">Meta Ouro (Nível 3)</span>
                            <span className="px-2 py-0.5 bg-amber-100 text-amber-800 rounded-full text-[9px] font-black uppercase">Tier 3</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Valor Alvo (R$)</label>
                                <input 
                                    type="number" 
                                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-black outline-none focus:border-pink-500 transition-all"
                                    value={tier3Amount}
                                    onChange={(e) => setTier3Amount(parseInt(e.target.value) || 0)}
                                />
                            </div>
                            <div>
                                <label className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Comissão (%)</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        step="0.1"
                                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-black outline-none focus:border-pink-500 transition-all pr-6"
                                        value={tier3Rate}
                                        onChange={(e) => setTier3Rate(parseFloat(e.target.value) || 0)}
                                    />
                                    <Percent size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Agent List */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">Alocação Individual por Vendedor</h3>
                    <span className="text-[9px] font-mono text-slate-400 font-bold bg-slate-100 px-3 py-1 rounded-full">{agentsStats.length} comerciais listados</span>
                </div>

                {agentsStats.length === 0 ? (
                    <div className="bg-white rounded-[32px] border border-slate-100 p-12 text-center">
                        <AlertCircle className="mx-auto text-slate-300 mb-3" size={36} />
                        <h4 className="text-sm font-bold text-slate-700 uppercase">Nenhum Vendedor Encontrado</h4>
                        <p className="text-xs text-slate-400 max-w-sm mx-auto mt-1 font-semibold leading-relaxed">
                            Não há leads ganhos ou usuários com cargo de Comercial ativos neste período de datas.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {agentsStats.map(agent => {
                            const isExpanded = expandedAgents[agent.id] || false;
                            
                            return (
                                <div key={agent.id} className="bg-white rounded-[32px] border border-slate-100 shadow-premium overflow-hidden transition-all duration-300 hover:border-slate-200">
                                    {/* Main Row summary info */}
                                    <div className="p-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
                                        <div className="flex items-center gap-4 min-w-[240px]">
                                            <img 
                                                src={agent.user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${agent.user.name}`} 
                                                alt={agent.user.name} 
                                                className="w-12 h-12 rounded-2xl bg-pink-50 shrink-0 border border-slate-100"
                                                referrerPolicy="no-referrer"
                                            />
                                            <div>
                                                <h4 className="text-sm font-black text-slate-800 tracking-tight">{agent.user.name}</h4>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[9px] font-mono text-slate-400 font-bold uppercase truncate max-w-[120px]">{agent.user.email}</span>
                                                    <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-500 rounded-full text-[8px] font-black uppercase tracking-tight">{agent.user.role}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Sales Value and Count */}
                                        <div className="grid grid-cols-2 gap-8 shrink-0">
                                            <div>
                                                <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block mb-1">Volume de Vendas</span>
                                                <span className="text-sm font-black text-slate-800 leading-none">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(agent.totalSalesValue)}
                                                </span>
                                                <span className="text-[9px] text-slate-400 font-bold block mt-1 font-mono">{agent.salesCount} negócios</span>
                                            </div>

                                            <div>
                                                <span className="text-[9px] uppercase font-black text-slate-400 tracking-wider block mb-1">Taxa & Comissão</span>
                                                <span className="text-sm font-black text-pink-600 leading-none">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(agent.calculatedCommissionValue)}
                                                </span>
                                                <span className="text-[9px] text-pink-500 font-black block mt-1 font-mono">{agent.rate}% comissão</span>
                                            </div>
                                        </div>

                                        {/* Target Progress Bar */}
                                        <div className="flex-1 min-w-[200px] max-w-sm">
                                            <div className="flex items-center justify-between gap-2 mb-1.5">
                                                <span className={`px-2.5 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest ${agent.tierColorClass}`}>
                                                    {agent.currentTierName}
                                                </span>
                                                <span className="text-[9px] text-slate-400 font-extrabold font-mono hover:underline">
                                                    {agent.nextGoalAmount > 0 
                                                        ? `${agent.progressPercent}% para o próximo nível` 
                                                        : '✨ Meta Máxima Ouro!'
                                                    }
                                                </span>
                                            </div>
                                            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                                                <div 
                                                    className="bg-gradient-to-r from-pink-500 to-indigo-600 h-1.5 rounded-full transition-all duration-500"
                                                    style={{ width: `${agent.progressPercent}%` }}
                                                />
                                            </div>
                                            <div className="flex items-center justify-between text-[8px] text-slate-400 font-mono mt-1 font-bold">
                                                <span>Acumulado: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(agent.totalSalesValue)}</span>
                                                {agent.nextGoalAmount > 0 && (
                                                    <span>Próximo Alvo: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(agent.nextGoalAmount)}</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions buttons */}
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => openLaunchModal(agent.id, agent.calculatedCommissionValue, agent.user.name)}
                                                disabled={agent.calculatedCommissionValue === 0}
                                                className={`px-4 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all ${
                                                    agent.calculatedCommissionValue > 0 
                                                    ? 'bg-slate-900 border border-transparent text-white hover:bg-slate-800 cursor-pointer' 
                                                    : 'bg-slate-50 border border-slate-100 text-slate-300 cursor-not-allowed'
                                                }`}
                                            >
                                                <ArrowUpRight size={12} /> Lançar Pagamento
                                            </button>

                                            <button
                                                onClick={() => toggleAgent(agent.id)}
                                                className="p-2.5 bg-slate-50 border border-slate-100 hover:border-slate-200 rounded-xl text-slate-500 hover:text-slate-700 transition-all shrink-0"
                                            >
                                                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Collapsible Leads Won row */}
                                    <AnimatePresence>
                                        {isExpanded && (
                                            <motion.div 
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: 'auto', opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="border-t border-slate-50 bg-slate-50/40"
                                            >
                                                <div className="p-6 space-y-4">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Lista de Clientes/Negócios que justificam o cálculo</span>
                                                        <span className="text-[9px] font-mono text-slate-400 font-bold">Total: {agent.leads.length} leads ganhos no período</span>
                                                    </div>

                                                    {agent.leads.length === 0 ? (
                                                        <p className="text-xs text-slate-400 italic">Estranho, esse comercial não possui leads marcados como GANHOS nesta janela de tempo.</p>
                                                    ) : (
                                                        <div className="overflow-x-auto">
                                                            <table className="w-full text-left border-collapse">
                                                                <thead>
                                                                    <tr className="border-b border-slate-100">
                                                                        <th className="py-2.5 pb-2 text-[8px] font-black uppercase tracking-wider text-slate-400">Cliente / Empresa</th>
                                                                        <th className="py-2.5 pb-2 text-[8px] font-black uppercase tracking-wider text-slate-400">Contato</th>
                                                                        <th className="py-2.5 pb-2 text-[8px] font-black uppercase tracking-wider text-slate-400">Origem</th>
                                                                        <th className="py-2.5 pb-2 text-[8px] font-black uppercase tracking-wider text-slate-400">Data Fechamento</th>
                                                                        <th className="py-2.5 pb-2 text-[8px] font-black uppercase tracking-wider text-slate-400 text-right">Valor do Contrato</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-slate-100/50">
                                                                    {agent.leads.map(lead => (
                                                                        <tr key={lead.id} className="hover:bg-slate-100/30 text-xs text-slate-600 font-semibold">
                                                                            <td className="py-3 font-bold text-slate-800 flex items-center gap-1.5">
                                                                                <Building2 size={12} className="text-slate-450" /> {lead.company || lead.name}
                                                                            </td>
                                                                            <td className="py-3">{lead.name}</td>
                                                                            <td className="py-3">
                                                                                <span className="px-2 py-0.5 bg-slate-100 rounded-full text-[8.5px] font-mono text-slate-500">
                                                                                    {lead.source || 'CRM'}
                                                                                </span>
                                                                            </td>
                                                                            <td className="py-3 font-mono font-bold text-[10.5px]">
                                                                                {new Date(lead.updatedAt || lead.createdAt).toLocaleDateString('pt-BR')}
                                                                            </td>
                                                                            <td className="py-3 text-right font-black text-slate-800">
                                                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(lead.value || 0)}
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Launch Payout modal */}
            {launchModalAgentId && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[32px] border border-slate-100 shadow-premium w-full max-w-[500px] overflow-hidden">
                        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight flex items-center gap-2">
                                <Wallet size={18} className="text-pink-500" /> Registrar Comissão no Financeiro
                            </h3>
                            <button 
                                onClick={() => setLaunchModalAgentId(null)}
                                className="p-2 text-slate-350 hover:bg-slate-50 rounded-full transition-colors font-bold text-xs"
                            >
                                Fechar
                            </button>
                        </div>

                        <div className="p-8 space-y-5">
                            {launchSuccessMsg && (
                                <div className="bg-emerald-50 text-emerald-700 p-4 rounded-2xl border border-emerald-100 flex items-start gap-3 text-xs font-bold leading-relaxed">
                                    <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                                    <span>{launchSuccessMsg}</span>
                                </div>
                            )}

                            {launchErrorMsg && (
                                <div className="bg-red-50 text-red-750 p-4 rounded-2xl border border-red-150 flex items-start gap-3 text-xs font-bold leading-relaxed">
                                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                    <span>{launchErrorMsg}</span>
                                </div>
                            )}

                            <div className="space-y-4">
                                {/********* DESCRIPTION *********/}
                                <div>
                                    <label className="text-[9px] uppercase tracking-widest font-black text-slate-450 block mb-1.5">Descrição do Lançamento</label>
                                    <input 
                                        type="text"
                                        className="w-full bg-slate-50 border border-transparent focus:bg-white focus:border-pink-500 outline-none rounded-xl p-3 text-xs font-bold transition-all"
                                        value={launchDescription}
                                        onChange={(e) => setLaunchDescription(e.target.value)}
                                        placeholder="Ex: Pagamento comissão..."
                                    />
                                </div>

                                {/********* PRICE AND DATE *********/}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[9px] uppercase tracking-widest font-black text-slate-455 block mb-1.5">Valor do Pagamento</label>
                                        <div className="relative">
                                            <input 
                                                type="number"
                                                className="w-full bg-slate-50 border border-transparent focus:bg-white focus:border-pink-500 outline-none rounded-xl p-3 text-xs font-black transition-all pl-8"
                                                value={launchAmount}
                                                onChange={(e) => setLaunchAmount(parseFloat(e.target.value) || 0)}
                                            />
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-400">R$</span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[9px] uppercase tracking-widest font-black text-slate-455 block mb-1.5">Data de Lançamento</label>
                                        <input 
                                            type="date"
                                            className="w-full bg-slate-50 border border-transparent focus:bg-white focus:border-pink-500 outline-none rounded-xl p-3 text-xs font-black transition-all"
                                            value={launchDate}
                                            onChange={(e) => setLaunchDate(e.target.value)}
                                        />
                                    </div>
                                </div>

                                {/********* BANK ACCOUNT AND CATEGORY *********/}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[9px] uppercase tracking-widest font-black text-slate-455 block mb-1.5">Conta Origem (Débito)</label>
                                        <select 
                                            className="w-full bg-slate-50 border border-transparent focus:bg-white focus:border-pink-500 outline-none rounded-xl p-3 text-xs font-black transition-all"
                                            value={selectedBankId}
                                            onChange={(e) => setSelectedBankId(e.target.value)}
                                        >
                                            <option value="">Selecione uma conta...</option>
                                            {bankAccounts.map(b => (
                                                <option key={b.id} value={b.id}>{b.name} (Saldo: R$ {b.balance.toLocaleString('pt-BR')})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[9px] uppercase tracking-widest font-black text-slate-455 block mb-1.5 font-sans">Categoria (Despesa)</label>
                                        <select 
                                            className="w-full bg-slate-50 border border-transparent focus:bg-white focus:border-pink-500 outline-none rounded-xl p-3 text-xs font-black transition-all"
                                            value={selectedCategoryId}
                                            onChange={(e) => setSelectedCategoryId(e.target.value)}
                                        >
                                            <option value="">Selecione uma categoria...</option>
                                            {categories.filter(c => c.type === 'EXPENSE' || c.type === 'BOTH').map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/********* STATUS *********/}
                                <div>
                                    <label className="text-[9px] uppercase tracking-widest font-black text-slate-45x block mb-2">Situação da Transação</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button 
                                            type="button"
                                            onClick={() => setLaunchStatus('PAID')}
                                            className={`p-3 rounded-xl text-xs font-black uppercase text-center border transition-all ${
                                                launchStatus === 'PAID' 
                                                ? 'bg-emerald-50 border-emerald-300 text-emerald-700' 
                                                : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'
                                            }`}
                                        >
                                            Pago (Efetivado de imediato)
                                        </button>
                                        <button 
                                            type="button"
                                            onClick={() => setLaunchStatus('PENDING')}
                                            className={`p-3 rounded-xl text-xs font-black uppercase text-center border transition-all ${
                                                launchStatus === 'PENDING' 
                                                ? 'bg-amber-50 border-amber-300 text-amber-700' 
                                                : 'bg-slate-50 border-slate-100 text-slate-400 hover:bg-slate-100'
                                            }`}
                                        >
                                            Pendente (A pagar)
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-3 rounded-b-[32px]">
                            <button 
                                onClick={() => setLaunchModalAgentId(null)} 
                                className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={handleLaunchCommission} 
                                className="px-8 py-3 bg-pink-600 hover:bg-pink-500 text-white font-black text-[10px] uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-pink-200"
                            >
                                Confirmar e Registrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
