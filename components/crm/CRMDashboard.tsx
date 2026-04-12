
import React, { useMemo } from 'react';
import { Lead, User, LossReason } from '../../types';
import { 
    Users, TrendingUp, DollarSign, Target, Clock, 
    AlertCircle, CheckCircle2, XCircle, BarChart3, 
    ArrowUpRight, ArrowDownRight, Zap
} from 'lucide-react';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';

interface CRMDashboardProps {
    leads: Lead[];
    users: User[];
    lossReasons: LossReason[];
}

export const CRMDashboard: React.FC<CRMDashboardProps> = ({ leads, users, lossReasons }) => {
    const stats = useMemo(() => {
        const total = leads.length;
        const newLeads = leads.filter(l => l.stageId === 'NEW').length;
        const inNegotiation = leads.filter(l => l.stageId === 'NEGOTIATION' || l.stageId === 'PROPOSAL').length;
        const won = leads.filter(l => l.status === 'WON').length;
        const lost = leads.filter(l => l.status === 'LOST').length;
        const noContact = leads.filter(l => !l.lastContact).length;
        const noResponsible = leads.filter(l => !l.responsibleId).length;

        const valueNegotiation = leads.filter(l => l.status === 'OPEN').reduce((acc, l) => acc + l.value, 0);
        const valueWon = leads.filter(l => l.status === 'WON').reduce((acc, l) => acc + l.value, 0);
        const valueLost = leads.filter(l => l.status === 'LOST').reduce((acc, l) => acc + l.value, 0);
        const avgTicket = won > 0 ? valueWon / won : 0;

        // Conversion rate
        const conversionRate = total > 0 ? (won / total) * 100 : 0;

        return {
            total, newLeads, inNegotiation, won, lost, noContact, noResponsible,
            valueNegotiation, valueWon, valueLost, avgTicket, conversionRate
        };
    }, [leads]);

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
            amount: leads.filter(l => l.stageId === s.id || (s.id === 'WON' && l.status === 'WON')).reduce((acc, l) => acc + l.value, 0)
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
            {/* TOP INDICATORS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-3 sm:mb-4">
                        <div className="p-2 sm:p-3 bg-blue-50 text-blue-600 rounded-xl sm:rounded-2xl">
                            <Users size={20} className="sm:w-6 sm:h-6" />
                        </div>
                        <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                            <ArrowUpRight size={10} className="sm:w-3 sm:h-3" /> +12%
                        </span>
                    </div>
                    <p className="text-slate-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Total de Leads</p>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-800 mt-1">{stats.total}</h3>
                    <div className="mt-3 sm:mt-4 flex items-center gap-2">
                        <div className="flex-1 h-1 sm:h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500" style={{ width: '70%' }}></div>
                        </div>
                        <span className="text-[9px] sm:text-[10px] font-bold text-slate-400">70% meta</span>
                    </div>
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-3 sm:mb-4">
                        <div className="p-2 sm:p-3 bg-emerald-50 text-emerald-600 rounded-xl sm:rounded-2xl">
                            <DollarSign size={20} className="sm:w-6 sm:h-6" />
                        </div>
                        <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
                            <ArrowUpRight size={10} className="sm:w-3 sm:h-3" /> +8%
                        </span>
                    </div>
                    <p className="text-slate-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Receita Ganhos</p>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-800 mt-1">R$ {(stats.valueWon || 0).toLocaleString()}</h3>
                    <p className="text-[9px] sm:text-[10px] text-slate-400 mt-1 font-bold">Ticket Médio: R$ {(stats.avgTicket || 0).toLocaleString()}</p>
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-3 sm:mb-4">
                        <div className="p-2 sm:p-3 bg-indigo-50 text-indigo-600 rounded-xl sm:rounded-2xl">
                            <Target size={20} className="sm:w-6 sm:h-6" />
                        </div>
                        <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-full">
                            {stats.conversionRate.toFixed(1)}%
                        </span>
                    </div>
                    <p className="text-slate-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Taxa de Conversão</p>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-800 mt-1">{stats.won} Negócios</h3>
                    <div className="mt-3 sm:mt-4 flex items-center gap-2 text-[9px] sm:text-[10px] font-bold text-slate-400">
                        <CheckCircle2 size={12} className="text-emerald-500 sm:w-3.5 sm:h-3.5" />
                        <span>{stats.won} ganhos</span>
                        <span className="mx-1">•</span>
                        <XCircle size={12} className="text-red-500 sm:w-3.5 sm:h-3.5" />
                        <span>{stats.lost} perdidos</span>
                    </div>
                </div>

                <div className="bg-white p-4 sm:p-6 rounded-[20px] sm:rounded-[24px] border border-slate-100 shadow-sm hover:shadow-md transition-all">
                    <div className="flex justify-between items-start mb-3 sm:mb-4">
                        <div className="p-2 sm:p-3 bg-orange-50 text-orange-600 rounded-xl sm:rounded-2xl">
                            <Clock size={20} className="sm:w-6 sm:h-6" />
                        </div>
                        <span className="flex items-center gap-1 text-[9px] sm:text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">
                            Atenção
                        </span>
                    </div>
                    <p className="text-slate-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Ações Pendentes</p>
                    <h3 className="text-xl sm:text-2xl font-black text-slate-800 mt-1">{stats.noContact + stats.noResponsible}</h3>
                    <div className="mt-3 sm:mt-4 space-y-1">
                        <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 flex justify-between">
                            <span>Sem Responsável:</span>
                            <span className="text-orange-600">{stats.noResponsible}</span>
                        </p>
                        <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 flex justify-between">
                            <span>Sem Contato:</span>
                            <span className="text-orange-600">{stats.noContact}</span>
                        </p>
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
