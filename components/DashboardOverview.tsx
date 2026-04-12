import React, { useState, useMemo } from 'react';
import { Task, Lead, FinancialTransaction, User, Client, CardInvoice, BankAccount, CreditCard, ProductivityGoal, Squad } from '../types';
import { calculateKanbanMetrics } from '../utils/metrics';
import { 
    Layout, 
    Zap, 
    AlertTriangle, 
    Archive, 
    PieChart as PieChartIcon, 
    BarChart2, 
    TrendingUp, 
    Calendar, 
    AlertCircle, 
    Clock, 
    DollarSign, 
    Users, 
    CheckCircle2, 
    TrendingDown, 
    ArrowUpRight, 
    ArrowDownRight, 
    Plus, 
    Briefcase, 
    History,
    Target,
    Activity,
    Bell,
    ChevronRight,
    Wallet,
    PiggyBank,
    Scale
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';

interface DashboardProps {
  tasks: Task[];
  leads: Lead[];
  finance: FinancialTransaction[];
  users: User[];
  clients: Client[];
  cardInvoices: CardInvoice[];
  bankAccounts: BankAccount[];
  creditCards: CreditCard[];
  currentUser: User;
  setCurrentView: (view: string) => void;
  goals: ProductivityGoal[];
  squads: Squad[];
}

export const DashboardOverview: React.FC<DashboardProps> = ({ 
    tasks, 
    leads, 
    finance, 
    users, 
    clients, 
    cardInvoices, 
    bankAccounts,
    creditCards,
    currentUser, 
    setCurrentView,
    goals,
    squads
}) => {
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(1)).toISOString().split('T')[0]); // First day of current month
  const [endDate, setEndDate] = useState(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]); // Last day of current month
  const [activePreset, setActivePreset] = useState<'7days' | '30days' | 'quarter' | 'month' | 'custom'>('month');

  const isFinance = currentUser.role === 'FINANCE';
  const isAdmin = currentUser.role === 'ADMIN';
  const isManager = currentUser.role === 'MANAGER';
  const isEmployee = currentUser.role === 'EMPLOYEE';
  const isFreelancer = currentUser.role === 'FREELANCER';

  const [selectedUserId, setSelectedUserId] = useState<string | 'ALL'>(isEmployee || isFreelancer ? currentUser.id : 'ALL');
  const [selectedSquadId, setSelectedSquadId] = useState<string | 'ALL'>(isManager ? currentUser.squad || 'ALL' : 'ALL');

  const applyPreset = (days: number | 'month', presetName: '7days' | '30days' | 'quarter' | 'month') => {
      const end = new Date();
      const start = new Date();
      if (days === 'month') {
          start.setDate(1);
          end.setMonth(end.getMonth() + 1);
          end.setDate(0);
      } else {
          start.setDate(end.getDate() - days);
      }
      setEndDate(end.toISOString().split('T')[0]);
      setStartDate(start.toISOString().split('T')[0]);
      setActivePreset(presetName);
  };

  const handleCustomDateChange = (type: 'start' | 'end', value: string) => {
      if (type === 'start') setStartDate(value);
      else setEndDate(value);
      setActivePreset('custom');
  };

  const filterByDate = (dateStr: string) => {
      if (!dateStr) return false;
      return dateStr >= startDate && dateStr <= endDate;
  };

  // Role-based filtering logic
  const filteredData = useMemo(() => {
    let baseTasks = tasks;
    let baseLeads = leads;
    let baseFinance = finance;
    let baseClients = clients;

    if (currentUser.role === 'EMPLOYEE' || currentUser.role === 'FREELANCER') {
        baseTasks = tasks.filter(t => t.assigneeIds.includes(currentUser.id));
        baseLeads = leads.filter(l => l.responsibleId === currentUser.id);
        baseClients = clients.filter(c => c.responsibleId === currentUser.id);
    } else if (currentUser.role === 'MANAGER') {
        if (currentUser.squad) {
            baseTasks = tasks.filter(t => t.squadId === currentUser.squad);
            baseClients = clients.filter(c => c.squadId === currentUser.squad);
            
            const squadMembers = users.filter(u => u.squad === currentUser.squad).map(u => u.id);
            baseLeads = leads.filter(l => l.responsibleId && squadMembers.includes(l.responsibleId));
        }
    }

    // Apply manual filters from dropdowns
    if (selectedSquadId !== 'ALL') {
        baseTasks = baseTasks.filter(t => t.squadId === selectedSquadId);
        baseLeads = baseLeads.filter(l => {
            const resp = users.find(u => u.id === l.responsibleId);
            return resp?.squad === selectedSquadId;
        });
        baseClients = baseClients.filter(c => c.squadId === selectedSquadId);
    }
    if (selectedUserId !== 'ALL') {
        baseTasks = baseTasks.filter(t => t.assigneeIds.includes(selectedUserId));
        baseLeads = baseLeads.filter(l => l.responsibleId === selectedUserId);
        baseClients = baseClients.filter(c => c.responsibleId === selectedUserId);
    }

    return {
        tasks: baseTasks,
        leads: baseLeads,
        finance: baseFinance,
        clients: baseClients
    };
  }, [tasks, leads, finance, clients, currentUser, users]);

  const stats = useMemo(() => {
    const periodTxs = filteredData.finance.filter(f => filterByDate(f.date));
    
    // Cash flow chart data
    const cashFlowData: Record<string, { date: string, income: number, expense: number }> = {};
    periodTxs.forEach(tx => {
        const date = tx.date;
        if (!cashFlowData[date]) cashFlowData[date] = { date, income: 0, expense: 0 };
        if (tx.type === 'INCOME' && tx.status === 'PAID') cashFlowData[date].income += tx.amount;
        if (tx.type === 'EXPENSE' && tx.status === 'PAID') cashFlowData[date].expense += tx.amount;
    });
    const chartData = Object.values(cashFlowData).sort((a, b) => a.date.localeCompare(b.date));

    const revenue = periodTxs.filter(f => f.type === 'INCOME' && f.status === 'PAID').reduce((acc, c) => acc + c.amount, 0);
    const expenses = periodTxs.filter(f => f.type === 'EXPENSE' && f.status === 'PAID').reduce((acc, c) => acc + c.amount, 0);
    const profit = revenue - expenses;

    const periodLeads = filteredData.leads.filter(l => filterByDate(new Date(l.createdAt).toISOString().split('T')[0]));
    const newLeads = periodLeads.length;
    
    const activeClients = filteredData.clients.filter(c => c.status === 'ACTIVE').length;
    
    const todayStr = new Date().toISOString().split('T')[0];
    const next7DaysStr = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    const kanbanMetrics = calculateKanbanMetrics(filteredData.tasks);

    const totalBalance = bankAccounts.reduce((acc, curr) => acc + curr.balance, 0);
    const accountsToPayNextDays = filteredData.finance.filter(f => f.type === 'EXPENSE' && f.status === 'PENDING' && f.date >= todayStr && f.date <= next7DaysStr).reduce((acc, c) => acc + c.amount, 0);
    const delinquency = filteredData.finance.filter(f => f.type === 'INCOME' && f.status === 'PENDING' && f.date < todayStr).reduce((acc, c) => acc + c.amount, 0);
    const delinquentClientsCount = new Set(filteredData.finance.filter(f => f.type === 'INCOME' && f.status === 'PENDING' && f.date < todayStr).map(f => f.clientId).filter(Boolean)).size;

    // Commercial metrics
    const funnelLeads = filteredData.leads.filter(l => l.status === 'OPEN').length;
    const valueInNegotiation = filteredData.leads.filter(l => l.status === 'OPEN').reduce((acc, l) => acc + (l.value || 0), 0);
    const leadsNoContact = filteredData.leads.filter(l => l.status === 'OPEN' && (!l.lastContact || l.history.length === 0)).length;
    const wonLeads = filteredData.leads.filter(l => l.status === 'WON' && filterByDate(new Date(l.updatedAt).toISOString().split('T')[0])).length;
    const lostLeads = filteredData.leads.filter(l => l.status === 'LOST' && filterByDate(new Date(l.updatedAt).toISOString().split('T')[0])).length;
    const conversionRate = (wonLeads + lostLeads) > 0 ? (wonLeads / (wonLeads + lostLeads)) * 100 : 0;

    // Operational Bottlenecks
    const bottlenecks = filteredData.tasks.filter(t => {
        const realHours = t.timeLogs.reduce((s, l) => s + (l.duration || 0), 0) / 3600;
        return t.estimatedTime > 0 && realHours > t.estimatedTime;
    }).length;

    // Team below goal
    const currentMonth = new Date().toISOString().substring(0, 7);
    const teamBelowGoal = goals.some(g => {
        if (g.month !== currentMonth) return false;
        const realized = g.type === 'PRODUCTION' 
            ? tasks.filter(t => t.status === 'DONE' && (g.userId ? t.assigneeIds.includes(g.userId) : (g.squadId ? t.squadId === g.squadId : true))).length
            : tasks.filter(t => (g.userId ? t.assigneeIds.includes(g.userId) : (g.squadId ? t.squadId === g.squadId : true))).reduce((acc, t) => acc + t.timeLogs.reduce((s, l) => s + (l.duration || 0), 0), 0) / 3600;
        return (realized / g.targetValue) < 0.9;
    });

    return {
        revenue,
        expenses,
        profit,
        newLeads,
        activeClients,
        overdueTasks: kanbanMetrics.overdue,
        inProgressTasks: kanbanMetrics.inProgress,
        completedTasks: kanbanMetrics.completed,
        totalBalance,
        accountsToPayNextDays,
        delinquency,
        delinquentClientsCount,
        funnelLeads,
        valueInNegotiation,
        leadsNoContact,
        conversionRate,
        bottlenecks: kanbanMetrics.bottlenecks,
        teamBelowGoal,
        chartData
    };
  }, [filteredData, tasks, goals, bankAccounts, startDate, endDate]);

  const alerts = useMemo(() => {
    const list = [];
    if (stats.leadsNoContact > 0) list.push({ type: 'CRM', message: `${stats.leadsNoContact} leads sem contato recente`, icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-50', action: 'crm' });
    if (stats.overdueTasks > 0) list.push({ type: 'TASKS', message: `${stats.overdueTasks} tarefas atrasadas`, icon: Clock, color: 'text-red-500', bg: 'bg-red-50', action: 'kanban' });
    if (stats.delinquency > 0) {
        list.push({ 
            type: 'FINANCE', 
            message: `Inadimplência: R$ ${(stats.delinquency || 0).toLocaleString('pt-BR')}`, 
            icon: AlertTriangle, 
            color: 'text-pink-500', 
            bg: 'bg-pink-50',
            action: 'finance'
        });
    }
    if (stats.teamBelowGoal) {
        list.push({ 
            type: 'PRODUCTIVITY', 
            message: `Equipe ou Colaborador abaixo da meta esperada`, 
            icon: Target, 
            color: 'text-indigo-500', 
            bg: 'bg-indigo-50',
            action: 'productivity'
        });
    }
    return list;
  }, [stats]);

  const shortcuts = [
    { label: 'Novo Lead', icon: Plus, view: 'crm', color: 'bg-pink-600' },
    { label: 'Nova Tarefa', icon: CheckCircle2, view: 'kanban', color: 'bg-blue-600' },
    { label: 'Nova Despesa', icon: DollarSign, view: 'finance', color: 'bg-slate-900' },
    { label: 'Novo Cliente', icon: Users, view: 'clients', color: 'bg-emerald-600' },
  ];

  return (
    <div className="space-y-6 animate-pop pb-10">
      {/* Header Section */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
        <div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Olá, {currentUser.name.split(' ')[0]} 👋</h1>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest mt-1">Visão Geral Estratégica</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto bg-slate-50 p-2 rounded-2xl border border-slate-100">
            {/* Squad Filter */}
            {(isAdmin) && (
                <select 
                    value={selectedSquadId} 
                    onChange={(e) => setSelectedSquadId(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-600 outline-none focus:border-pink-200 transition-all w-full sm:w-auto"
                >
                    <option value="ALL">Todas as Squads</option>
                    {squads.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
            )}

            {/* User Filter */}
            {(isAdmin || isManager) && (
                <select 
                    value={selectedUserId} 
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-[10px] font-bold text-slate-600 outline-none focus:border-pink-200 transition-all w-full sm:w-auto"
                >
                    <option value="ALL">Todos os Colaboradores</option>
                    {users.filter(u => u.role !== 'CLIENT' && (selectedSquadId === 'ALL' || u.squad === selectedSquadId)).map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                </select>
            )}

            <div className="flex bg-white rounded-xl shadow-sm border border-slate-200 p-1 w-full sm:w-auto overflow-x-auto">
                <button onClick={() => applyPreset('month', 'month')} className={`flex-1 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activePreset === 'month' ? 'bg-pink-50 text-pink-600' : 'text-slate-400 hover:text-slate-600'}`}>Mês Atual</button>
                <button onClick={() => applyPreset(7, '7days')} className={`flex-1 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activePreset === '7days' ? 'bg-pink-50 text-pink-600' : 'text-slate-400 hover:text-slate-600'}`}>7D</button>
                <button onClick={() => applyPreset(30, '30days')} className={`flex-1 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activePreset === '30days' ? 'bg-pink-50 text-pink-600' : 'text-slate-400 hover:text-slate-600'}`}>30D</button>
                <button onClick={() => applyPreset(90, 'quarter')} className={`flex-1 px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${activePreset === 'quarter' ? 'bg-pink-50 text-pink-600' : 'text-slate-400 hover:text-slate-600'}`}>90D</button>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-3">
                <input type="date" value={startDate} onChange={(e) => handleCustomDateChange('start', e.target.value)} className="text-[10px] font-bold text-slate-600 outline-none bg-white border border-slate-200 rounded-xl px-3 py-2 flex-1 sm:flex-none" />
                <span className="text-slate-400 text-xs font-bold">-</span>
                <input type="date" value={endDate} onChange={(e) => handleCustomDateChange('end', e.target.value)} className="text-[10px] font-bold text-slate-600 outline-none bg-white border border-slate-200 rounded-xl px-3 py-2 flex-1 sm:flex-none" />
            </div>
        </div>
      </div>

      {/* Executive Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {/* Finance Context */}
        {(isAdmin || isManager || isFinance) && (
            <>
                <div onClick={() => setCurrentView('finance')} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-premium cursor-pointer hover:border-emerald-200 transition-all">
                    <p className="text-emerald-500 text-[9px] font-black uppercase tracking-widest mb-1">Receita</p>
                    <h3 className="text-xl font-black text-slate-800 tracking-tighter">R$ {(stats.revenue || 0).toLocaleString('pt-BR')}</h3>
                </div>
                <div onClick={() => setCurrentView('finance')} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-premium cursor-pointer hover:border-red-200 transition-all">
                    <p className="text-red-500 text-[9px] font-black uppercase tracking-widest mb-1">Despesas</p>
                    <h3 className="text-xl font-black text-slate-800 tracking-tighter">R$ {(stats.expenses || 0).toLocaleString('pt-BR')}</h3>
                </div>
                <div onClick={() => setCurrentView('finance')} className={`p-5 rounded-3xl border shadow-premium cursor-pointer transition-all ${stats.profit >= 0 ? 'bg-emerald-50 border-emerald-100 hover:border-emerald-300' : 'bg-red-50 border-red-100 hover:border-red-300'}`}>
                    <p className={`${stats.profit >= 0 ? 'text-emerald-600' : 'text-red-600'} text-[9px] font-black uppercase tracking-widest mb-1`}>Lucro</p>
                    <h3 className={`text-xl font-black tracking-tighter ${stats.profit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>R$ {(stats.profit || 0).toLocaleString('pt-BR')}</h3>
                </div>
            </>
        )}

        {/* Commercial Context */}
        {(isAdmin || isManager || isEmployee || isFreelancer) && (
            <>
                <div onClick={() => setCurrentView('crm')} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-premium cursor-pointer hover:border-pink-200 transition-all">
                    <p className="text-pink-500 text-[9px] font-black uppercase tracking-widest mb-1">Novos Leads</p>
                    <h3 className="text-xl font-black text-slate-800 tracking-tighter">{stats.newLeads}</h3>
                </div>
                <div onClick={() => setCurrentView('crm')} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-premium cursor-pointer hover:border-indigo-200 transition-all">
                    <p className="text-indigo-500 text-[9px] font-black uppercase tracking-widest mb-1">Em Negociação</p>
                    <h3 className="text-xl font-black text-slate-800 tracking-tighter">R$ {(stats.valueInNegotiation || 0).toLocaleString('pt-BR')}</h3>
                </div>
                <div onClick={() => setCurrentView('crm')} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-premium cursor-pointer hover:border-amber-200 transition-all">
                    <p className="text-amber-500 text-[9px] font-black uppercase tracking-widest mb-1">Conversão</p>
                    <h3 className="text-xl font-black text-slate-800 tracking-tighter">{stats.conversionRate.toFixed(1)}%</h3>
                </div>
            </>
        )}

        {/* Clients Context */}
        {(isAdmin || isManager) && (
            <div onClick={() => setCurrentView('clients')} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-premium cursor-pointer hover:border-blue-200 transition-all">
                <p className="text-blue-500 text-[9px] font-black uppercase tracking-widest mb-1">Clientes Ativos</p>
                <h3 className="text-xl font-black text-slate-800 tracking-tighter">{stats.activeClients}</h3>
            </div>
        )}
      </div>

      {/* Main Blocks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* COMERCIAL (AÇÃO) */}
          {(isAdmin || isManager || isEmployee || isFreelancer) && (
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-premium flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                          <Target size={18} className="text-pink-500" /> Comercial (Ação)
                      </h3>
                      <button onClick={() => setCurrentView('crm')} className="text-[10px] font-black text-pink-600 uppercase tracking-widest hover:underline">Ver CRM</button>
                  </div>
                  <div className="space-y-4">
                      <div onClick={() => setCurrentView('crm')} className="p-4 bg-amber-50 rounded-2xl border border-amber-100 cursor-pointer hover:bg-amber-100 transition-all">
                          <p className="text-[10px] font-black text-amber-600 uppercase mb-1">Leads sem contato</p>
                          <p className="text-2xl font-black text-amber-700">{stats.leadsNoContact}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Total Negociação</p>
                              <p className="text-lg font-black text-slate-800">R$ {(stats.valueInNegotiation || 0).toLocaleString('pt-BR')}</p>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                              <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Taxa Conversão</p>
                              <p className="text-lg font-black text-slate-800">{stats.conversionRate.toFixed(1)}%</p>
                          </div>
                      </div>
                  </div>
              </div>
          )}

          {/* FINANCEIRO (RISCO) */}
          {(isAdmin || isManager || isFinance) && (
              <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-2xl flex flex-col text-white">
                  <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                          <DollarSign size={18} className="text-pink-400" /> Financeiro (Risco)
                      </h3>
                      <button onClick={() => setCurrentView('finance')} className="text-[10px] font-black text-pink-400 uppercase tracking-widest hover:underline">Ver Financeiro</button>
                  </div>
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                      <div className="space-y-6">
                          <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Saldo Atual</p>
                              <h3 className="text-3xl font-black tracking-tighter">R$ {(stats.totalBalance || 0).toLocaleString('pt-BR')}</h3>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                              <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700">
                                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">A Vencer (7D)</p>
                                  <p className="text-lg font-black text-white">R$ {(stats.accountsToPayNextDays || 0).toLocaleString('pt-BR')}</p>
                              </div>
                              <div onClick={() => setCurrentView('finance')} className="bg-red-900/30 p-4 rounded-2xl border border-red-900/50 cursor-pointer hover:bg-red-900/50 transition-all">
                                  <p className="text-[9px] font-black text-red-400 uppercase mb-1">Inadimplência</p>
                                  <p className="text-lg font-black text-red-400">R$ {(stats.delinquency || 0).toLocaleString('pt-BR')}</p>
                              </div>
                          </div>
                      </div>
                      <div className="h-48 w-full bg-slate-800/50 rounded-3xl p-4 border border-slate-800">
                          <p className="text-[9px] font-black text-slate-500 uppercase mb-4">Fluxo de Caixa</p>
                          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                              <BarChart data={stats.chartData}>
                                  <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} />
                                  <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} />
                                  <Tooltip 
                                    contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', fontSize: '10px' }}
                                    itemStyle={{ color: '#fff' }}
                                  />
                              </BarChart>
                          </ResponsiveContainer>
                      </div>
                  </div>
              </div>
          )}

          {/* OPERACIONAL (PERFORMANCE) */}
          {(isAdmin || isManager || isEmployee || isFreelancer) && (
              <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-premium flex flex-col">
                  <div className="flex items-center justify-between mb-8">
                      <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                          <Activity size={18} className="text-blue-500" /> Operacional (Performance)
                      </h3>
                      <button onClick={() => setCurrentView('kanban')} className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline">Ver Kanban</button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100">
                          <p className="text-[9px] font-black text-blue-600 uppercase mb-1">Em Andamento</p>
                          <p className="text-xl font-black text-blue-700">{stats.inProgressTasks}</p>
                      </div>
                      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                          <p className="text-[9px] font-black text-emerald-600 uppercase mb-1">Entregas</p>
                          <p className="text-xl font-black text-emerald-700">{stats.completedTasks}</p>
                      </div>
                      <div className="p-4 bg-red-50 rounded-2xl border border-red-100">
                          <p className="text-[9px] font-black text-red-600 uppercase mb-1">Gargalos</p>
                          <p className="text-xl font-black text-red-700">{stats.bottlenecks}</p>
                      </div>
                  </div>
                  <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
                      <div>
                          <p className="text-[10px] font-black text-slate-400 uppercase">Status da Meta</p>
                          <p className={`text-xs font-black ${stats.teamBelowGoal ? 'text-red-500' : 'text-emerald-500'}`}>
                              {stats.teamBelowGoal ? 'Abaixo do esperado' : 'Dentro do planejado'}
                          </p>
                      </div>
                      <button onClick={() => setCurrentView('productivity')} className="bg-white p-2 rounded-xl shadow-sm border border-slate-200 hover:bg-slate-50 transition-all">
                          <Target size={16} className="text-indigo-500" />
                      </button>
                  </div>
              </div>
          )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Alerts Section */}
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-premium">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                  <Bell size={18} className="text-amber-500" /> Alertas e Pendências Críticas
              </h3>
              <div className="space-y-3">
                  {alerts.map((alert, idx) => (
                      <div key={idx} className={`flex items-center justify-between p-4 ${alert.bg} rounded-2xl border border-transparent hover:border-slate-100 transition-all`}>
                          <div className="flex items-center gap-4">
                              <div className={`p-2 rounded-xl bg-white shadow-sm ${alert.color}`}>
                                  <alert.icon size={18} />
                              </div>
                              <div>
                                  <p className={`text-xs font-black ${alert.color} uppercase tracking-tight`}>{alert.type}</p>
                                  <p className="text-[11px] font-bold text-slate-600">{alert.message}</p>
                              </div>
                          </div>
                          <button 
                            onClick={() => setCurrentView(alert.action)}
                            className="p-2 hover:bg-white rounded-lg text-slate-400 transition-all"
                          >
                              <ChevronRight size={16} />
                          </button>
                      </div>
                  ))}
                  {alerts.length === 0 && (
                      <div className="py-10 text-center">
                          <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-3" />
                          <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Nenhuma pendência crítica</p>
                      </div>
                  )}
              </div>
          </div>

          {/* Shortcuts Section */}
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-premium">
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6 flex items-center gap-2">
                  <Zap size={18} className="text-pink-500" /> Atalhos Rápidos
              </h3>
              <div className="grid grid-cols-2 gap-4">
                  {shortcuts.map((shortcut, idx) => (
                      <button 
                        key={idx}
                        onClick={() => setCurrentView(shortcut.view)}
                        className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-3xl border border-slate-100 hover:border-pink-200 hover:bg-white hover:shadow-xl transition-all group"
                      >
                          <div className={`w-12 h-12 rounded-2xl ${shortcut.color} text-white flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform`}>
                              <shortcut.icon size={24} />
                          </div>
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{shortcut.label}</span>
                      </button>
                  ))}
              </div>
          </div>
      </div>
    </div>
  );
};
