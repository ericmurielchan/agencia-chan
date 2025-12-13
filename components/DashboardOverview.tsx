
import React, { useState, useMemo } from 'react';
import { Task, Lead, FinancialRecord, User } from '../types';
import { Layout, Zap, AlertTriangle, Archive, PieChart as PieChartIcon, BarChart2, TrendingUp, Calendar, AlertCircle, Clock } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';

interface DashboardProps {
  tasks: Task[];
  leads: Lead[];
  finance: FinancialRecord[];
  users: User[];
}

export const DashboardOverview: React.FC<DashboardProps> = ({ tasks, leads, finance, users }) => {
  // Inicializa com últimos 30 dias
  const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [activePreset, setActivePreset] = useState<'7days' | '30days' | 'quarter' | 'custom'>('30days');

  // Helper para aplicar presets
  const applyPreset = (days: number, presetName: '7days' | '30days' | 'quarter') => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - days);
      
      setEndDate(end.toISOString().split('T')[0]);
      setStartDate(start.toISOString().split('T')[0]);
      setActivePreset(presetName);
  };

  const handleCustomDateChange = (type: 'start' | 'end', value: string) => {
      if (type === 'start') setStartDate(value);
      else setEndDate(value);
      setActivePreset('custom');
  };

  // Lógica de Filtro baseada no range selecionado
  const filterByDate = (dateStr: string) => {
      if (!dateStr) return false;
      return dateStr >= startDate && dateStr <= endDate;
  };

  // Filtros aplicados aos dados
  // Nota: Mantemos IN_PROGRESS visível independente da data para não perder o foco operacional atual,
  // mas o filtro de data se aplica estritamente para conclusões, backlog e financeiro.
  const filteredTasks = useMemo(() => tasks.filter(t => filterByDate(t.dueDate) || t.status === 'IN_PROGRESS'), [tasks, startDate, endDate]);
  const filteredFinance = useMemo(() => finance.filter(f => filterByDate(f.dueDate)), [finance, startDate, endDate]);
  
  // --- INDICADORES OPERACIONAIS (KPIs) ---
  const activeTasks = tasks.filter(t => !t.archived && t.status !== 'DONE');
  const inProgressCount = activeTasks.filter(t => t.status === 'IN_PROGRESS').length;
  const reviewCount = activeTasks.filter(t => t.status === 'REVIEW').length;
  
  // Atrasadas (Global, não arquivadas e não concluídas)
  const overdueCount = tasks.filter(t => {
      return !t.archived && t.status !== 'DONE' && new Date(t.dueDate) < new Date(new Date().setHours(0,0,0,0));
  }).length;
  
  // Arquivadas
  const archivedCount = tasks.filter(t => t.archived).length;
  
  // Métricas Financeiras
  const revenue = filteredFinance.filter(f => f.type === 'INCOME' && f.status === 'PAID').reduce((acc, c) => acc + c.amount, 0);
  
  // --- DADOS PARA GRÁFICOS ---
  
  // 1. Distribuição de Status (Pie Chart) - Baseado no filtro
  // Usamos filteredTasks para refletir o range selecionado (exceto In Progress que é fixo)
  const statusDistribution = [
      { name: 'A Fazer', value: filteredTasks.filter(t => t.status === 'TODO' || t.status === 'BACKLOG').length, color: '#94a3b8' },
      { name: 'Em Andamento', value: filteredTasks.filter(t => t.status === 'IN_PROGRESS').length, color: '#3b82f6' },
      { name: 'Revisão', value: filteredTasks.filter(t => t.status === 'REVIEW').length, color: '#a855f7' },
      { name: 'Concluídas', value: filteredTasks.filter(t => t.status === 'DONE').length, color: '#10b981' } // Adicionado Concluídas para ver produtividade do período
  ].filter(d => d.value > 0);

  // 2. Carga de Trabalho por Usuário (Bar Chart)
  const workloadData = users
    .filter(u => u.role !== 'CLIENT' && u.role !== 'ADMIN')
    .map(u => {
        // Considera tarefas ativas no geral para carga de trabalho atual
        const userTasks = activeTasks.filter(t => t.assigneeIds.includes(u.id));
        return {
            name: u.name.split(' ')[0], 
            tasks: userTasks.length,
            highPriority: userTasks.filter(t => t.priority === 'HIGH').length
        };
    })
    .sort((a,b) => b.tasks - a.tasks);

  return (
    <div className="space-y-6 animate-pop">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
            <h1 className="text-2xl font-bold text-slate-800">Visão Operacional & Estratégica</h1>
            <p className="text-slate-500 text-sm">Monitoramento em tempo real da saúde da agência</p>
        </div>
        
        {/* Controles de Filtro Personalizado */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto bg-slate-50 p-2 rounded-lg border border-slate-100">
            {/* Presets */}
            <div className="flex bg-white rounded-lg shadow-sm border border-slate-200 p-1 w-full sm:w-auto">
                <button 
                    onClick={() => applyPreset(7, '7days')}
                    className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activePreset === '7days' ? 'bg-pink-50 text-pink-600 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    7 Dias
                </button>
                <button 
                    onClick={() => applyPreset(30, '30days')}
                    className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activePreset === '30days' ? 'bg-pink-50 text-pink-600 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    30 Dias
                </button>
                <button 
                    onClick={() => applyPreset(90, 'quarter')}
                    className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-medium rounded-md transition-all ${activePreset === 'quarter' ? 'bg-pink-50 text-pink-600 font-bold' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    Trimestre
                </button>
            </div>

            {/* Inputs Manuais */}
            <div className="flex items-center gap-2 w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-3">
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-sm">
                    <Calendar size={14} className="text-slate-400"/>
                    <input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => handleCustomDateChange('start', e.target.value)}
                        className="text-xs text-slate-600 outline-none w-24 bg-transparent font-medium"
                    />
                </div>
                <span className="text-slate-400 text-xs">até</span>
                <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-sm">
                    <input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => handleCustomDateChange('end', e.target.value)}
                        className="text-xs text-slate-600 outline-none w-24 bg-transparent font-medium"
                    />
                </div>
            </div>
        </div>
      </div>

      {/* --- CARDS OPERACIONAIS SUPERIORES --- */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        {/* Em Andamento */}
        <div className="bg-white p-5 rounded-xl border border-blue-100 shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap size={60} className="text-blue-500" />
            </div>
            <p className="text-blue-500 text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                <Layout size={14}/> Em Produção
            </p>
            <h3 className="text-3xl font-bold text-slate-800 mt-2">{inProgressCount}</h3>
            <div className="mt-2 text-xs text-slate-400">
                Tarefas sendo executadas agora
            </div>
        </div>

        {/* Atrasadas */}
        <div className="bg-white p-5 rounded-xl border border-red-100 shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <AlertCircle size={60} className="text-red-500" />
            </div>
            <p className="text-red-500 text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                <AlertTriangle size={14}/> Atrasadas
            </p>
            <h3 className="text-3xl font-bold text-red-600 mt-2">{overdueCount}</h3>
            <div className="mt-2 text-xs text-red-400 font-medium">
                Requerem atenção imediata
            </div>
        </div>

        {/* Arquivadas */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Archive size={60} className="text-slate-500" />
            </div>
            <p className="text-slate-500 text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                <Archive size={14}/> Arquivadas
            </p>
            <h3 className="text-3xl font-bold text-slate-700 mt-2">{archivedCount}</h3>
            <div className="mt-2 text-xs text-slate-400">
                Histórico de tarefas (Total)
            </div>
        </div>

         {/* Receita (Visão Rápida) */}
         <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 shadow-sm relative overflow-hidden group text-white">
            <div className="absolute right-0 top-0 p-4 opacity-20 group-hover:opacity-30 transition-opacity">
                <TrendingUp size={60} className="text-emerald-400" />
            </div>
            <p className="text-emerald-400 text-xs font-bold uppercase tracking-wide flex items-center gap-1">
                <TrendingUp size={14}/> Receita (Período)
            </p>
            <h3 className="text-3xl font-bold mt-2">R$ {revenue.toLocaleString('pt-BR', { notation: 'compact' })}</h3>
            <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                <Calendar size={10} />
                {new Date(startDate).toLocaleDateString()} - {new Date(endDate).toLocaleDateString()}
            </div>
        </div>
      </div>
      
      {/* --- GRÁFICOS DE DECISÃO --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Distribuição de Status */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
              <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
                  <PieChartIcon size={18} className="text-slate-400"/> Distribuição (Período)
              </h3>
              <div className="flex-1 min-h-[250px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                          <Pie
                              data={statusDistribution}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                          >
                              {statusDistribution.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                          </Pie>
                          <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                          <Legend verticalAlign="bottom" height={36}/>
                      </PieChart>
                  </ResponsiveContainer>
                  {/* Centro do Donut */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] text-center pointer-events-none">
                      <span className="text-3xl font-bold text-slate-800">{filteredTasks.length}</span>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Tarefas</p>
                  </div>
              </div>
          </div>

          {/* Carga de Trabalho da Equipe */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm md:col-span-2">
              <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2">
                  <BarChart2 size={18} className="text-slate-400"/> Carga de Trabalho Atual
              </h3>
              <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={workloadData}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                          <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12} stroke="#64748b"/>
                          <YAxis axisLine={false} tickLine={false} fontSize={12} stroke="#64748b"/>
                          <Tooltip cursor={{fill: '#f8fafc'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                          <Legend />
                          <Bar name="Total Ativas" dataKey="tasks" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={30} />
                          <Bar name="Alta Prioridade" dataKey="highPriority" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={30} />
                      </BarChart>
                  </ResponsiveContainer>
              </div>
          </div>
      </div>

      {/* --- LISTA DE ALERTA OPERACIONAL --- */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-orange-50 border-b border-orange-100 flex justify-between items-center">
              <h3 className="font-bold text-orange-800 flex items-center gap-2">
                  <AlertTriangle size={18}/> Alerta: Prioridades Travadas
              </h3>
              <span className="text-xs text-orange-600 font-medium">Tarefas 'Alta Prioridade' que não estão concluídas</span>
          </div>
          <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
              {tasks.filter(t => t.priority === 'HIGH' && t.status !== 'DONE' && !t.archived).map(task => (
                  <div key={task.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${task.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                              <Clock size={16}/>
                          </div>
                          <div>
                              <p className="font-bold text-slate-800 text-sm">{task.title}</p>
                              <p className="text-xs text-slate-500">Status: {task.status} • Prazo: {task.dueDate}</p>
                          </div>
                      </div>
                      <div className="flex -space-x-2">
                          {task.assigneeIds.map(uid => {
                              const u = users.find(user => user.id === uid);
                              if(!u) return null;
                              return <img key={uid} src={u.avatar} className="w-8 h-8 rounded-full border-2 border-white" title={u.name}/>
                          })}
                      </div>
                  </div>
              ))}
              {tasks.filter(t => t.priority === 'HIGH' && t.status !== 'DONE' && !t.archived).length === 0 && (
                  <div className="p-8 text-center text-slate-400">
                      Tudo certo! Nenhuma tarefa urgente travada.
                  </div>
              )}
          </div>
      </div>

    </div>
  );
};
