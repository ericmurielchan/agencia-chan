
import React, { useMemo, useState, useEffect } from 'react';
import { Lead, User, LossReason, Squad } from '../../types';
import { 
    Users, TrendingUp, DollarSign, Target, Clock, 
    AlertCircle, CheckCircle2, XCircle, BarChart3, 
    ArrowUpRight, ArrowDownRight, Zap, Settings
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';

interface CRMDashboardProps {
    leads: Lead[];
    users: User[];
    lossReasons: LossReason[];
    currentUser?: User;
    squads?: Squad[];
}

export const CRMDashboard: React.FC<CRMDashboardProps> = ({ leads, users, lossReasons, currentUser, squads = [] }) => {
    // ----------------------------------------------------
    // METAS (GOALS) CONFIGURATION & MANAGEMENT
    // ----------------------------------------------------
    const [goals, setGoals] = useState<{
        global: { leads: number; revenue: number };
        squads: Record<string, { leads: number; revenue: number }>;
        users: Record<string, { leads: number; revenue: number }>;
    }>(() => {
        const saved = localStorage.getItem('crm_goals');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                console.error(e);
            }
        }
        return {
            global: { leads: 15, revenue: 50000 },
            squads: {},
            users: {}
        };
    });

    useEffect(() => {
        localStorage.setItem('crm_goals', JSON.stringify(goals));
    }, [goals]);

    // Active goal for currently logged in user based on context
    const activeGoal = useMemo(() => {
        if (!currentUser) return goals.global;

        // 1. User specific goal
        if (goals.users[currentUser.id]) {
            return goals.users[currentUser.id];
        }

        // 2. Squad specific goal
        if (squads && currentUser.id) {
            const userSquad = squads.find(s => s.members?.includes(currentUser.id));
            if (userSquad && goals.squads[userSquad.id]) {
                return goals.squads[userSquad.id];
            }
        }

        // 3. Fallback to Global
        return goals.global;
    }, [goals, currentUser, squads]);

    // Goal Configuration Form States
    const [showGoalConfig, setShowGoalConfig] = useState(false);
    const [goalLevel, setGoalLevel] = useState<'GLOBAL' | 'SQUAD' | 'USER'>('GLOBAL');
    const [selectedSquadId, setSelectedSquadId] = useState<string>('');
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [leadGoalInput, setLeadGoalInput] = useState<number>(15);
    const [revenueGoalInput, setRevenueGoalInput] = useState<number>(50000);

    const canConfigGoals = currentUser && ['ADMIN', 'FINANCE', 'MANAGER', 'COMMERCIAL_MANAGER'].includes(currentUser.role);

    const stats = useMemo(() => {
        const total = leads.length;
        const newLeads = leads.filter(l => l.stageId === 'NEW').length;
        const inNegotiation = leads.filter(l => l.stageId === 'NEGOTIATION' || l.stageId === 'PROPOSAL').length;
        const won = leads.filter(l => l.status === 'WON').length;
        const lost = leads.filter(l => l.status === 'LOST').length;
        const noContact = leads.filter(l => !l.lastContact).length;
        const noResponsible = leads.filter(l => !l.responsibleId).length;

        const valueNegotiation = leads.filter(l => l.status === 'OPEN').reduce((acc, l) => acc + (l.value || 0), 0);
        const valueWon = leads.filter(l => l.status === 'WON').reduce((acc, l) => acc + (l.value || 0), 0);
        const valueLost = leads.filter(l => l.status === 'LOST').reduce((acc, l) => acc + (l.value || 0), 0);
        const avgTicket = won > 0 ? valueWon / won : 0;

        // CRM Tasks calculations
        const totalTasks = leads.reduce((acc, l) => acc + (l.tasks?.length || 0), 0);
        const completedTasks = leads.reduce((acc, l) => acc + (l.tasks?.filter(t => t.completed).length || 0), 0);
        const pendingTasks = totalTasks - completedTasks;

        // Conversion rate
        const conversionRate = total > 0 ? (won / total) * 100 : 0;

        return {
            total, newLeads, inNegotiation, won, lost, noContact, noResponsible,
            valueNegotiation, valueWon, valueLost, avgTicket, conversionRate,
            totalTasks, completedTasks, pendingTasks
        };
    }, [leads]);

    // ----------------------------------------------------
    // DYNAMIC GROWTH TREND CALCULATIONS
    // ----------------------------------------------------
    const { leadGrowth, revenueGrowth } = useMemo(() => {
        const now = Date.now();
        const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;
        const sixtyDaysAgo = now - 60 * 24 * 60 * 60 * 1000;

        // Leads Growth
        const currentPeriodLeads = leads.filter(l => l.createdAt >= thirtyDaysAgo).length;
        const previousPeriodLeads = leads.filter(l => l.createdAt >= sixtyDaysAgo && l.createdAt < thirtyDaysAgo).length;

        let leadGrowth = 0;
        if (previousPeriodLeads > 0) {
            leadGrowth = ((currentPeriodLeads - previousPeriodLeads) / previousPeriodLeads) * 100;
        } else if (currentPeriodLeads > 0) {
            leadGrowth = 100; // 100% growth if none in previous but some in current
        }

        // Revenue Growth
        const currentPeriodRevenue = leads
            .filter(l => l.status === 'WON' && l.updatedAt >= thirtyDaysAgo)
            .reduce((acc, l) => acc + (l.value || 0), 0);

        const previousPeriodRevenue = leads
            .filter(l => l.status === 'WON' && l.updatedAt >= sixtyDaysAgo && l.updatedAt < thirtyDaysAgo)
            .reduce((acc, l) => acc + (l.value || 0), 0);

        let revenueGrowth = 0;
        if (previousPeriodRevenue > 0) {
            revenueGrowth = ((currentPeriodRevenue - previousPeriodRevenue) / previousPeriodRevenue) * 100;
        } else if (currentPeriodRevenue > 0) {
            revenueGrowth = 100;
        }

        return { leadGrowth, revenueGrowth };
    }, [leads]);

    const leadProgressPct = activeGoal.leads > 0 ? Math.min(100, (stats.total / activeGoal.leads) * 100) : 0;
    const revenueProgressPct = activeGoal.revenue > 0 ? Math.min(100, (stats.valueWon / activeGoal.revenue) * 100) : 0;

    const funnelData = useMemo(() => {
        const stages = [
            { id: 'NEW', label: 'Novos' },
            { id: 'QUALIFIED', label: 'Qualificados' },
            { id: 'PROPOSAL', label: 'Proposta' },
            { id: 'NEGOTIATION', label: 'Negociação' },
            { id: 'WON', label: 'Ganhos' }
        ];

        return stages.map(s => ({
            name: s.label,
            value: leads.filter(l => l.stageId === s.id || (s.id === 'WON' && l.status === 'WON')).length,
            amount: leads.filter(l => l.stageId === s.id || (s.id === 'WON' && l.status === 'WON')).reduce((acc, l) => acc + (l.value || 0), 0)
        }));
    }, [leads]);

    const lossReasonData = useMemo(() => {
        return lossReasons.map(reason => ({
            name: reason.label,
            value: leads.filter(l => l.lossReasonId === reason.id).length
        })).filter(r => r.value > 0).sort((a, b) => b.value - a.value);
    }, [leads, lossReasons]);

    const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981'];

    return (
        <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500">
            {/* GOAL CONFIGURATION PANEL */}
            {canConfigGoals && (
                <div className="flex justify-between items-center bg-white p-4 rounded-[20px] border border-slate-100 shadow-sm">
                    <div>
                        <span className="text-[10px] uppercase font-extrabold tracking-wider text-slate-400">Metas Ativas</span>
                        <h4 className="text-xs font-black text-slate-700 uppercase">
                            Visualizando metas de: <span className="text-indigo-600">
                                {goals.users[currentUser.id] 
                                    ? `Usuário (Individual)` 
                                    : (squads.find(s => s.members?.includes(currentUser.id)) 
                                        ? `Equipe (${squads.find(s => s.members?.includes(currentUser.id))?.name})` 
                                        : 'Global (Padrão)')}
                            </span>
                        </h4>
                    </div>
                    <button 
                        onClick={() => {
                            // Prepopulate the form with active level
                            setLeadGoalInput(activeGoal.leads);
                            setRevenueGoalInput(activeGoal.revenue);
                            setShowGoalConfig(!showGoalConfig);
                        }}
                        className="flex items-center gap-2 px-3.5 py-2 border border-slate-200/80 hover:border-slate-300 bg-white hover:bg-slate-50 text-slate-600 rounded-full text-[11px] font-bold transition-all shadow-sm"
                    >
                        <Target size={14} className="text-indigo-500" />
                        <span>{showGoalConfig ? 'Fechar Configurações' : 'Configurar Metas'}</span>
                    </button>
                </div>
            )}

            {showGoalConfig && canConfigGoals && (
                <div className="bg-slate-50/60 border border-slate-200/80 rounded-[20px] p-4 sm:p-5 space-y-4 animate-in slide-in-from-top-3 duration-200">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                        <div>
                            <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Configurar Metas de Vendas (CRM)</h4>
                            <p className="text-[10px] text-slate-400 font-semibold uppercase">Defina as metas globais, por equipe (squad) ou individuais</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* 1. Nível da Meta */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Definir Meta para:</label>
                            <div className="grid grid-cols-3 gap-1 bg-white p-1 rounded-xl border border-slate-200/80">
                                <button
                                    onClick={() => {
                                        setGoalLevel('GLOBAL');
                                        setLeadGoalInput(goals.global.leads);
                                        setRevenueGoalInput(goals.global.revenue);
                                    }}
                                    className={`py-1.5 px-2 rounded-lg text-[9px] font-bold text-center transition-all ${
                                        goalLevel === 'GLOBAL' 
                                            ? 'bg-indigo-600 text-white shadow-sm' 
                                            : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    Geral
                                </button>
                                <button
                                    onClick={() => {
                                        setGoalLevel('SQUAD');
                                        const firstSquadId = squads?.[0]?.id || '';
                                        setSelectedSquadId(firstSquadId);
                                        const existing = goals.squads[firstSquadId] || { leads: 10, revenue: 50000 };
                                        setLeadGoalInput(existing.leads);
                                        setRevenueGoalInput(existing.revenue);
                                    }}
                                    className={`py-1.5 px-2 rounded-lg text-[9px] font-bold text-center transition-all ${
                                        goalLevel === 'SQUAD' 
                                            ? 'bg-indigo-600 text-white shadow-sm' 
                                            : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    Equipe
                                </button>
                                <button
                                    onClick={() => {
                                        setGoalLevel('USER');
                                        const firstUserId = users?.[0]?.id || '';
                                        setSelectedUserId(firstUserId);
                                        const existing = goals.users[firstUserId] || { leads: 5, revenue: 20000 };
                                        setLeadGoalInput(existing.leads);
                                        setRevenueGoalInput(existing.revenue);
                                    }}
                                    className={`py-1.5 px-2 rounded-lg text-[9px] font-bold text-center transition-all ${
                                        goalLevel === 'USER' 
                                            ? 'bg-indigo-600 text-white shadow-sm' 
                                            : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    Usuário
                                </button>
                            </div>
                        </div>

                        {/* 2. Seleção de Equipe ou Usuário */}
                        {goalLevel === 'SQUAD' && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Selecionar Equipe (Squad):</label>
                                <select
                                    value={selectedSquadId}
                                    onChange={e => {
                                        const id = e.target.value;
                                        setSelectedSquadId(id);
                                        const existing = goals.squads[id] || { leads: 10, revenue: 50000 };
                                        setLeadGoalInput(existing.leads);
                                        setRevenueGoalInput(existing.revenue);
                                    }}
                                    className="w-full bg-white border border-slate-200/80 rounded-xl p-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                >
                                    <option value="" disabled>Selecione uma equipe</option>
                                    {squads?.map(s => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {goalLevel === 'USER' && (
                            <div className="space-y-1.5">
                                <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Selecionar Usuário:</label>
                                <select
                                    value={selectedUserId}
                                    onChange={e => {
                                        const id = e.target.value;
                                        setSelectedUserId(id);
                                        const existing = goals.users[id] || { leads: 5, revenue: 20000 };
                                        setLeadGoalInput(existing.leads);
                                        setRevenueGoalInput(existing.revenue);
                                    }}
                                    className="w-full bg-white border border-slate-200/80 rounded-xl p-2.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                >
                                    <option value="" disabled>Selecione um usuário</option>
                                    {users.filter(u => u.role !== 'CLIENT').map(u => (
                                        <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {goalLevel === 'GLOBAL' && (
                            <div className="hidden sm:block"></div>
                        )}

                        {/* 3. Inputs de Valores */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400">Metas de Performance:</label>
                            <div className="flex gap-2">
                                <div className="flex-1">
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={leadGoalInput}
                                            onChange={e => setLeadGoalInput(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="w-full bg-white border border-slate-200/80 rounded-xl p-2.5 pl-8 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                            placeholder="Leads"
                                        />
                                        <Users size={12} className="absolute left-3 top-3.5 text-slate-400" />
                                    </div>
                                    <span className="text-[8px] text-slate-400 font-bold ml-1">Leads (Meta)</span>
                                </div>
                                <div className="flex-1">
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={revenueGoalInput}
                                            onChange={e => setRevenueGoalInput(Math.max(0, parseInt(e.target.value) || 0))}
                                            className="w-full bg-white border border-slate-200/80 rounded-xl p-2.5 pl-8 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-100"
                                            placeholder="Faturamento"
                                        />
                                        <DollarSign size={12} className="absolute left-3 top-3.5 text-slate-400" />
                                    </div>
                                    <span className="text-[8px] text-slate-400 font-bold ml-1">Faturamento (R$)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button
                            onClick={() => {
                                setGoals(prev => {
                                    const updated = { ...prev };
                                    if (goalLevel === 'GLOBAL') {
                                        updated.global = { leads: leadGoalInput, revenue: revenueGoalInput };
                                    } else if (goalLevel === 'SQUAD') {
                                        if (selectedSquadId) {
                                            updated.squads = {
                                                ...updated.squads,
                                                [selectedSquadId]: { leads: leadGoalInput, revenue: revenueGoalInput }
                                            };
                                        }
                                    } else if (goalLevel === 'USER') {
                                        if (selectedUserId) {
                                            updated.users = {
                                                ...updated.users,
                                                [selectedUserId]: { leads: leadGoalInput, revenue: revenueGoalInput }
                                            };
                                        }
                                    }
                                    return updated;
                                });
                                setShowGoalConfig(false);
                            }}
                            disabled={goalLevel === 'SQUAD' ? !selectedSquadId : goalLevel === 'USER' ? !selectedUserId : false}
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-200 text-white text-[10px] font-black uppercase tracking-wider rounded-xl shadow-md shadow-indigo-100 transition-all"
                        >
                            Salvar Configuração
                        </button>
                    </div>
                </div>
            )}

            {/* TOP INDICATORS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {/* Total Leads */}
                <div className="bg-white p-4 sm:p-5 rounded-[20px] sm:rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-3 sm:mb-4">
                        <div className="p-2 sm:p-2.5 bg-blue-50 text-blue-600 rounded-xl sm:rounded-2xl">
                            <Users size={18} className="sm:w-5 sm:h-5" />
                        </div>
                        <span className={`flex items-center gap-0.5 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            leadGrowth > 0 
                                ? 'text-emerald-600 bg-emerald-50' 
                                : leadGrowth < 0 
                                    ? 'text-rose-600 bg-rose-50' 
                                    : 'text-slate-500 bg-slate-50'
                        }`}>
                            {leadGrowth > 0 ? <ArrowUpRight size={10} /> : leadGrowth < 0 ? <ArrowDownRight size={10} /> : null}
                            {leadGrowth > 0 ? `+${leadGrowth.toFixed(0)}%` : `${leadGrowth.toFixed(0)}%`}
                        </span>
                    </div>
                    <p className="text-slate-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Total de Leads</p>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-800 mt-1">{stats.total}</h3>
                    <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: `${leadProgressPct}%` }}></div>
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 whitespace-nowrap">
                            {leadProgressPct.toFixed(0)}% meta ({activeGoal.leads} un)
                        </span>
                    </div>
                </div>

                {/* CRM Opportunities Value */}
                <div className="bg-white p-4 sm:p-5 rounded-[20px] sm:rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-3 sm:mb-4">
                        <div className="p-2 sm:p-2.5 bg-amber-50 text-amber-600 rounded-xl sm:rounded-2xl">
                            <TrendingUp size={18} className="sm:w-5 sm:h-5" />
                        </div>
                        <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-amber-600 bg-amber-100 px-2.5 py-1 rounded-full">
                            Em aberto
                        </span>
                    </div>
                    <p className="text-slate-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Oportunidades em Aberto</p>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-800 mt-1">R$ {(stats.valueNegotiation || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 mt-1 font-bold">Total ativo em negociação</p>
                </div>

                {/* Won Revenue */}
                <div className="bg-white p-4 sm:p-5 rounded-[20px] sm:rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-3 sm:mb-4">
                        <div className="p-2 sm:p-2.5 bg-emerald-50 text-emerald-600 rounded-xl sm:rounded-2xl">
                            <DollarSign size={18} className="sm:w-5 sm:h-5" />
                        </div>
                        <span className={`flex items-center gap-0.5 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            revenueGrowth > 0 
                                ? 'text-emerald-600 bg-emerald-50' 
                                : revenueGrowth < 0 
                                    ? 'text-rose-600 bg-rose-50' 
                                    : 'text-slate-500 bg-slate-50'
                        }`}>
                            {revenueGrowth > 0 ? <ArrowUpRight size={10} /> : revenueGrowth < 0 ? <ArrowDownRight size={10} /> : null}
                            {revenueGrowth > 0 ? `+${revenueGrowth.toFixed(0)}%` : `${revenueGrowth.toFixed(0)}%`}
                        </span>
                    </div>
                    <p className="text-slate-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Receita Ganhos</p>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-800 mt-1">R$ {(stats.valueWon || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                    <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${revenueProgressPct}%` }}></div>
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 whitespace-nowrap">
                            {revenueProgressPct.toFixed(0)}% meta (R$ {Math.round(activeGoal.revenue / 1000)}k)
                        </span>
                    </div>
                </div>

                {/* Lost Deals Value */}
                <div className="bg-white p-4 sm:p-5 rounded-[20px] sm:rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-3 sm:mb-4">
                        <div className="p-2 sm:p-2.5 bg-rose-50 text-rose-600 rounded-xl sm:rounded-2xl">
                            <XCircle size={18} className="sm:w-5 sm:h-5" />
                        </div>
                        <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-full">
                            Cancelados
                        </span>
                    </div>
                    <p className="text-slate-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Negócios Perdidos</p>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-800 mt-1">R$ {(stats.valueLost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 mt-1 font-bold">Volume não convertido</p>
                </div>

                {/* Conversion Rate */}
                <div className="bg-white p-4 sm:p-5 rounded-[20px] sm:rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-3 sm:mb-4">
                        <div className="p-2 sm:p-2.5 bg-indigo-50 text-indigo-600 rounded-xl sm:rounded-2xl">
                            <Target size={18} className="sm:w-5 sm:h-5" />
                        </div>
                        <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                            {stats.conversionRate.toFixed(1)}%
                        </span>
                    </div>
                    <p className="text-slate-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Taxa de Conversão</p>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-800 mt-1">{stats.won} Negócios</h3>
                    <div className="mt-3 flex items-center gap-2 text-[9px] sm:text-[10px] font-bold text-slate-400">
                        <CheckCircle2 size={12} className="text-emerald-500" />
                        <span>{stats.won} ganhos</span>
                        <span className="mx-0.5">•</span>
                        <XCircle size={12} className="text-red-500" />
                        <span>{stats.lost} perdidos</span>
                    </div>
                </div>

                {/* CRM Tasks Created */}
                <div className="bg-white p-4 sm:p-5 rounded-[20px] sm:rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-3 sm:mb-4">
                        <div className="p-2 sm:p-2.5 bg-purple-50 text-purple-600 rounded-xl sm:rounded-2xl">
                            <CheckCircle2 size={18} className="sm:w-5 sm:h-5" />
                        </div>
                        <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
                            Tarefas
                        </span>
                    </div>
                    <p className="text-slate-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Tarefas no CRM</p>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-800 mt-1">{stats.totalTasks} tarefas</h3>
                    <div className="mt-3 flex items-center gap-2 text-[9px] sm:text-[10px] font-bold text-slate-400">
                        <span className="text-emerald-600">{stats.completedTasks} concluídas</span>
                        <span className="mx-0.5">•</span>
                        <span className="text-amber-600">{stats.pendingTasks} pendentes</span>
                    </div>
                </div>

                {/* Pending Actions */}
                <div className="bg-white p-4 sm:p-5 rounded-[20px] sm:rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-3 sm:mb-4">
                        <div className="p-2 sm:p-2.5 bg-orange-50 text-orange-600 rounded-xl sm:rounded-2xl">
                            <Clock size={18} className="sm:w-5 sm:h-5" />
                        </div>
                        <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                            Atenção
                        </span>
                    </div>
                    <p className="text-slate-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Ações Pendentes</p>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-800 mt-1">{stats.noContact + stats.noResponsible}</h3>
                    <div className="mt-3 flex gap-2 text-[9px] sm:text-[10px] font-bold text-slate-500">
                        <span>Sem Resp: <strong className="text-orange-600">{stats.noResponsible}</strong></span>
                        <span>•</span>
                        <span>Sem Contato: <strong className="text-orange-600">{stats.noContact}</strong></span>
                    </div>
                </div>
            </div>

            {/* CHARTS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* FUNNEL CHART */}
                <div className="lg:col-span-2 bg-white p-5 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6 sm:mb-8">
                        <div>
                            <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-tight">Funil de Vendas</h3>
                            <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase mt-1">Volume por etapa</p>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex items-center gap-1.5">
                                <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
                                <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase">Leads</span>
                            </div>
                        </div>
                    </div>
                    <div className="h-[250px] sm:h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <BarChart data={funnelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis 
                                    dataKey="name" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 800 }} 
                                    dy={10}
                                />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 800 }} />
                                <Tooltip 
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', padding: '12px' }}
                                />
                                <Bar dataKey="value" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* LOSS REASONS */}
                <div className="bg-white p-5 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-sm">
                    <div className="mb-6 sm:mb-8">
                        <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-tight">Motivos de Perda</h3>
                        <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase mt-1">Ranking de perdas</p>
                    </div>
                    <div className="h-[200px] sm:h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <PieChart>
                                <Pie
                                    data={lossReasonData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {lossReasonData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip 
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 space-y-2">
                        {lossReasonData.slice(0, 3).map((item, index) => (
                            <div key={item.name} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                    <span className="text-[9px] sm:text-[10px] font-bold text-slate-600">{item.name}</span>
                                </div>
                                <span className="text-[9px] sm:text-[10px] font-black text-slate-400">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* PERFORMANCE & ACTIONABLE INDICATORS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white p-5 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-pink-50 text-pink-600 rounded-xl">
                            <Zap size={18} />
                        </div>
                        <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-tight">Indicadores Acionáveis</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div className="p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100">
                            <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Leads Parados</p>
                            <h4 className="text-lg sm:text-xl font-black text-slate-800">
                                {leads.filter(l => l.status === 'OPEN' && (Date.now() - new Date(l.lastContact).getTime() > 86400000 * 5)).length}
                            </h4>
                        </div>
                        <div className="p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100">
                            <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Sem Responsável</p>
                            <h4 className="text-lg sm:text-xl font-black text-slate-800">{stats.noResponsible}</h4>
                        </div>
                        <div className="p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100">
                            <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Valor Negociação</p>
                            <h4 className="text-lg sm:text-xl font-black text-slate-800">R$ {Math.round(stats.valueNegotiation / 1000)}k</h4>
                        </div>
                        <div className="p-3 sm:p-4 bg-slate-50 rounded-xl sm:rounded-2xl border border-slate-100">
                            <p className="text-[8px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Conversão Geral</p>
                            <h4 className="text-lg sm:text-xl font-black text-slate-800">{stats.conversionRate.toFixed(1)}%</h4>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-5 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
                            <BarChart3 size={18} />
                        </div>
                        <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-tight">Performance por Etapa</h3>
                    </div>
                    <div className="h-[180px] sm:h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                            <BarChart data={funnelData} layout="vertical" margin={{ left: -20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 9, fontWeight: 800 }} width={80} />
                                <Tooltip 
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="amount" fill="#8b5cf6" radius={[0, 6, 6, 0]} barSize={15} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};
