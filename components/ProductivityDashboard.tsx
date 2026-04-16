
import React, { useState, useMemo } from 'react';
import { Task, User, Squad, Client, Notification, ProductivityGoal } from '../types';
import { calculateKanbanMetrics } from '../utils/metrics';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell, LineChart, Line, CartesianGrid, AreaChart, Area } from 'recharts';
import { Modal } from './Modal';
import { AlertTriangle, Target, Clock, Users, TrendingUp, CheckCircle2, User as UserIcon, List, Gauge, Hourglass, Plus, Settings, Calendar, Info, X } from 'lucide-react';
import { TaskModal } from './TaskModal';

interface ProductivityDashboardProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  users: User[];
  squads: Squad[];
  clients: Client[];
  currentUser: User;
  addNotification?: (data: any) => Promise<void>;
  goals: ProductivityGoal[];
  setGoals: React.Dispatch<React.SetStateAction<ProductivityGoal[]>>;
  onNavigate?: (view: string, filter?: any) => void;
  onSaveGoal?: (goal: ProductivityGoal) => Promise<void>;
}

export const ProductivityDashboard: React.FC<ProductivityDashboardProps> = ({ 
    tasks, 
    setTasks, 
    users, 
    squads, 
    clients, 
    currentUser, 
    addNotification,
    goals,
    setGoals,
    onNavigate,
    onSaveGoal
}) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState<Partial<ProductivityGoal>>({
      type: 'PRODUCTION',
      period: 'MONTHLY',
      targetValue: 0,
      month: new Date().toISOString().substring(0, 7)
  });

  // Filtros
  const [dateRange, setDateRange] = useState<'7days' | '30days' | '90days'>('30days');
  const [selectedSquadId, setSelectedSquadId] = useState<string>('ALL');
  const [selectedUserId, setSelectedUserId] = useState<string>('ALL');

  const isManagement = ['ADMIN', 'MANAGER', 'FINANCE'].includes(currentUser.role);
  const isAdmin = currentUser.role === 'ADMIN';
  
  React.useEffect(() => {
      if (!isManagement) {
          setSelectedUserId(currentUser.id);
          if(currentUser.squad) setSelectedSquadId(currentUser.squad);
      }
  }, [currentUser, isManagement]);

  const formatHours = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    return `${h}h ${m}m`;
  };

  // --- Lógica de Filtragem ---
  const filteredTasks = useMemo(() => {
      const now = new Date();
      let startDate = new Date();
      if (dateRange === '7days') startDate.setDate(now.getDate() - 7);
      if (dateRange === '30days') startDate.setDate(now.getDate() - 30);
      if (dateRange === '90days') startDate.setDate(now.getDate() - 90);

      return tasks.filter(t => {
          const taskDueDate = t.dueDate ? new Date(t.dueDate) : null;
          const taskCompletedDate = t.completedAt ? new Date(t.completedAt) : null;
          
          // Se está concluída, usamos a data de conclusão para o filtro de período
          // Se não está concluída, usamos a data de entrega
          const referenceDate = (t.status === 'DONE' && taskCompletedDate) ? taskCompletedDate : taskDueDate;
          
          const isDateInRange = referenceDate ? referenceDate >= startDate : true; // Se não tem data, incluímos (para não sumir do dashboard)
          
          const isSquadMatch = selectedSquadId === 'ALL' || t.squadId === selectedSquadId;
          const isUserMatch = selectedUserId === 'ALL' || t.assigneeIds.includes(selectedUserId);
          return isDateInRange && isSquadMatch && isUserMatch;
      });
  }, [tasks, dateRange, selectedSquadId, selectedUserId]);

  // --- Metas e Progresso ---
  const currentMonth = new Date().toISOString().substring(0, 7);
  
  const activeGoal = useMemo(() => {
      // Prioridade: Individual > Squad > Global
      if (selectedUserId !== 'ALL') {
          return goals.find(g => g.userId === selectedUserId && g.month === currentMonth);
      }
      if (selectedSquadId !== 'ALL') {
          return goals.find(g => g.squadId === selectedSquadId && g.month === currentMonth);
      }
      return goals.find(g => !g.userId && !g.squadId && g.month === currentMonth);
  }, [goals, selectedUserId, selectedSquadId, currentMonth]);

  const progressMetrics = useMemo(() => {
      if (!activeGoal) return null;

      const realized = activeGoal.type === 'PRODUCTION' 
          ? filteredTasks.filter(t => t.status === 'DONE').length
          : filteredTasks.reduce((acc, t) => acc + t.timeLogs.reduce((s, l) => s + (l.duration || 0), 0), 0) / 3600;

      const percent = (realized / activeGoal.targetValue) * 100;
      
      // Projeção
      const now = new Date();
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const currentDay = now.getDate();
      const dailyAvg = realized / Math.max(currentDay, 1);
      const projection = dailyAvg * daysInMonth;
      const projectionPercent = (projection / activeGoal.targetValue) * 100;

      let status: 'ABOVE' | 'ON_TRACK' | 'BELOW' = 'ON_TRACK';
      if (projectionPercent < 90) status = 'BELOW';
      else if (projectionPercent > 110) status = 'ABOVE';

      return {
          realized,
          percent: Math.min(Math.round(percent), 200),
          dailyAvg,
          projection,
          projectionPercent,
          status
      };
  }, [activeGoal, filteredTasks]);

  // --- Cálculos de KPIs de Tempo ---
  const totalSeconds = useMemo(() => {
    return filteredTasks.reduce((acc, t) => {
        return acc + t.timeLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
    }, 0);
  }, [filteredTasks]);

  const doneTasks = filteredTasks.filter(t => t.status === 'DONE');
  const avgSecondsPerJob = doneTasks.length > 0 ? totalSeconds / doneTasks.length : 0;

  // --- Eficiência (Tempo Estimado vs Real) ---
  const efficiencyMetrics = useMemo(() => {
    let totalEst = 0;
    let totalReal = 0;
    filteredTasks.forEach(t => {
        if (t.estimatedTime > 0) {
            totalEst += t.estimatedTime * 3600; // Converte horas estimadas para segundos
            totalReal += t.timeLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
        }
    });
    const ratio = totalReal > 0 ? (totalEst / totalReal) * 100 : 0;
    return { 
        ratio: Math.min(Math.round(ratio), 200), // Cap em 200% para o gráfico
        totalEst: totalEst / 3600,
        totalReal: totalReal / 3600
    };
  }, [filteredTasks]);

  // --- Métricas Kanban (Respeitando Usuário/Squad selecionados) ---
  const kanbanMetrics = useMemo(() => {
    return calculateKanbanMetrics(tasks, selectedUserId, selectedSquadId);
  }, [tasks, selectedUserId, selectedSquadId]);

  // --- Rankings ---
  const individualRanking = users
    .filter(u => u.role !== 'CLIENT' && (selectedUserId === 'ALL' || u.id === selectedUserId))
    .map(user => {
        const userTasks = filteredTasks.filter(t => t.assigneeIds.includes(user.id));
        const seconds = userTasks.reduce((acc, t) => acc + t.timeLogs.reduce((s, l) => s + (l.duration || 0), 0), 0);
        const completed = userTasks.filter(t => t.status === 'DONE').length;
        
        let est = 0; let act = 0;
        userTasks.forEach(t => {
            if(t.estimatedTime > 0) {
                est += t.estimatedTime;
                act += t.timeLogs.reduce((s, l) => s + (l.duration || 0), 0) / 3600;
            }
        });

        const efficiency = act > 0 ? Math.round((est / act) * 100) : (est > 0 ? 100 : 0);

        // Meta individual
        const userGoal = goals.find(g => g.userId === user.id && g.month === currentMonth);
        const goalProgress = userGoal ? (userGoal.type === 'PRODUCTION' ? (completed / userGoal.targetValue) * 100 : ((seconds / 3600) / userGoal.targetValue) * 100) : 0;

        return {
            id: user.id,
            name: user.name,
            avatar: user.avatar,
            completed,
            seconds,
            efficiency,
            hours: seconds / 3600,
            goalProgress: Math.min(Math.round(goalProgress), 100),
            hasGoal: !!userGoal
        };
    })
    .sort((a,b) => b.seconds - a.seconds);

  const timeDistributionData = useMemo(() => {
      const data: Record<string, number> = {};
      for(let i=6; i>=0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          data[d.toISOString().split('T')[0].substring(5)] = 0;
      }
      
      filteredTasks.forEach(t => {
          t.timeLogs.forEach(log => {
              const dateKey = new Date(log.startTime).toISOString().split('T')[0].substring(5);
              if (data[dateKey] !== undefined) {
                  data[dateKey] += (log.duration || 0) / 3600;
              }
          });
      });

      return Object.entries(data).map(([key, value]) => ({ date: key, horas: Number(value.toFixed(1)) }));
  }, [filteredTasks]);

  const updateTask = (updated: Task) => {
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
      if (selectedTask && selectedTask.id === updated.id) setSelectedTask(updated);
  };

  const handleSaveGoal = async () => {
      if (!newGoal.targetValue || newGoal.targetValue <= 0) return;
      
      const goal: ProductivityGoal = {
          id: Math.random().toString(36).substr(2, 9),
          title: newGoal.title || 'Nova Meta',
          type: newGoal.type as any,
          period: 'MONTHLY',
          targetValue: newGoal.targetValue,
          month: newGoal.month!,
          squadId: newGoal.squadId,
          userId: newGoal.userId,
          createdAt: Date.now()
      };

      if (onSaveGoal) {
          await onSaveGoal(goal);
      } else {
          setGoals(prev => [...prev.filter(g => 
              !(g.month === goal.month && g.userId === goal.userId && g.squadId === goal.squadId)
          ), goal]);
      }
      setShowGoalModal(false);
  };

  return (
    <div className="space-y-6 animate-pop">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Produtividade & Metas</h2>
            <p className="text-slate-500 text-sm font-medium">Gestão de performance e acompanhamento de objetivos.</p>
        </div>
        <div className="flex flex-wrap gap-2">
            {isManagement && (
                <button 
                    onClick={() => setShowGoalModal(true)}
                    className="bg-pink-600 text-white text-xs font-black px-4 py-2.5 rounded-xl flex items-center gap-2 hover:bg-pink-700 transition-all shadow-lg shadow-pink-200"
                >
                    <Target size={16} /> Definir Meta
                </button>
            )}
            <select value={dateRange} onChange={e => setDateRange(e.target.value as any)} className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-pink-100">
                <option value="7days">Últimos 7 dias</option>
                <option value="30days">Últimos 30 dias</option>
                <option value="90days">Últimos 90 dias</option>
            </select>
            {isManagement && (
                <>
                    <select value={selectedSquadId} onChange={e => setSelectedSquadId(e.target.value)} className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-pink-100">
                        <option value="ALL">Todas as Squads</option>
                        {squads.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)} className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-pink-100">
                        <option value="ALL">Time Completo</option>
                        {users.filter(u => u.role !== 'CLIENT').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>
                </>
            )}
        </div>
      </div>

      {/* Alertas de Meta */}
      {isManagement && progressMetrics && progressMetrics.status === 'BELOW' && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-xl flex items-center gap-4 animate-pulse">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 shrink-0">
                  <AlertTriangle size={20} />
              </div>
              <div>
                  <h4 className="text-sm font-black text-red-800">Alerta de Ritmo: Abaixo da Meta</h4>
                  <p className="text-xs text-red-600 font-medium">A projeção atual indica que o atingimento será de apenas {progressMetrics.projectionPercent.toFixed(1)}%.</p>
              </div>
          </div>
      )}

      {/* Kanban Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <button 
            onClick={() => onNavigate?.('kanban', { inProgress: true, archived: false })}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-200 transition-all text-left group"
          >
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-blue-600">Em Andamento</p>
              <h4 className="text-2xl font-black text-slate-800">{kanbanMetrics.inProgress}</h4>
              <div className="mt-2 w-8 h-1 bg-blue-500 rounded-full"></div>
          </button>
          
          <button 
            onClick={() => onNavigate?.('kanban', { overdue: true, archived: false })}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-red-200 transition-all text-left group"
          >
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-red-600">Atrasadas</p>
              <h4 className="text-2xl font-black text-slate-800">{kanbanMetrics.overdue}</h4>
              <div className="mt-2 w-8 h-1 bg-red-500 rounded-full"></div>
          </button>

          <button 
            onClick={() => onNavigate?.('kanban', { status: 'DONE', archived: false })}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all text-left group"
          >
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-emerald-600">Concluídas</p>
              <h4 className="text-2xl font-black text-slate-800">{kanbanMetrics.completed}</h4>
              <div className="mt-2 w-8 h-1 bg-emerald-500 rounded-full"></div>
          </button>

          <button 
            onClick={() => onNavigate?.('kanban', { pending: true, archived: false })}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-amber-200 transition-all text-left group"
          >
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-amber-600">Pendentes (Backlog)</p>
              <h4 className="text-2xl font-black text-slate-800">{kanbanMetrics.pending}</h4>
              <div className="mt-2 w-8 h-1 bg-amber-500 rounded-full"></div>
          </button>

          <button 
            onClick={() => onNavigate?.('kanban', { archived: true })}
            className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-400 transition-all text-left group"
          >
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-slate-600">Arquivadas</p>
              <h4 className="text-2xl font-black text-slate-800">{kanbanMetrics.archived}</h4>
              <div className="mt-2 w-8 h-1 bg-slate-400 rounded-full"></div>
          </button>
      </div>

      {/* KPI Cards de Tempo e Metas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 text-slate-50 opacity-10 group-hover:opacity-20 transition-opacity rotate-12"><Clock size={100}/></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Hourglass size={12}/> Horas Investidas</p>
              <h3 className="text-3xl font-black text-slate-800 mt-2">{formatHours(totalSeconds)}</h3>
              <p className="text-[10px] text-indigo-500 font-bold mt-1">Tempo real logado no período</p>
          </div>
          
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
              <div className="absolute -right-4 -top-4 text-slate-50 opacity-10 group-hover:opacity-20 transition-opacity rotate-12"><Target size={100}/></div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><CheckCircle2 size={12}/> Entregas Totais</p>
              <h3 className="text-3xl font-black text-emerald-600 mt-2">{doneTasks.length}</h3>
              <p className="text-[10px] text-slate-400 font-bold mt-1">Jobs movidos para 'Concluído'</p>
          </div>

          <div className="bg-slate-900 p-5 rounded-2xl shadow-xl relative overflow-hidden group text-white md:col-span-2">
              <div className="absolute -right-4 -top-4 text-white opacity-5 group-hover:opacity-10 transition-opacity rotate-12"><Target size={120}/></div>
              <div className="flex justify-between items-start">
                  <div>
                      <p className="text-[10px] font-black text-pink-400 uppercase tracking-widest flex items-center gap-1"><Target size={12}/> Progresso da Meta ({activeGoal?.title || 'Global'})</p>
                      <div className="flex items-baseline gap-2 mt-2">
                          <h3 className="text-3xl font-black">{progressMetrics ? `${progressMetrics.percent}%` : 'N/A'}</h3>
                          {progressMetrics && (
                              <span className={`text-[10px] font-black px-2 py-0.5 rounded ${progressMetrics.status === 'ABOVE' ? 'bg-emerald-500/20 text-emerald-400' : progressMetrics.status === 'BELOW' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                  {progressMetrics.status === 'ABOVE' ? 'Superando' : progressMetrics.status === 'BELOW' ? 'Abaixo do Ritmo' : 'No Ritmo'}
                              </span>
                          )}
                      </div>
                  </div>
                  <div className="text-right">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Projeção Final</p>
                      <h4 className="text-xl font-black text-white">{progressMetrics ? progressMetrics.projection.toFixed(1) : '0'}</h4>
                      <p className="text-[9px] text-slate-500 font-bold">Meta: {activeGoal?.targetValue || 0}</p>
                  </div>
              </div>
              <div className="mt-4">
                  <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-1000 ${progressMetrics?.status === 'BELOW' ? 'bg-red-500' : 'bg-pink-500'}`} 
                        style={{width: `${progressMetrics?.percent || 0}%`}}
                      ></div>
                  </div>
                  <div className="flex justify-between mt-2">
                      <p className="text-[9px] text-slate-500 font-bold uppercase">Realizado: {progressMetrics?.realized.toFixed(1)}</p>
                      <p className="text-[9px] text-slate-500 font-bold uppercase">Média Diária: {progressMetrics?.dailyAvg.toFixed(1)}</p>
                  </div>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Esforço Diário */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm min-h-[350px] relative">
              <h3 className="font-black text-xs text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><TrendingUp size={16} className="text-pink-600"/> Intensidade de Produção (Horas/Dia)</h3>
              <div className="w-full h-64 min-h-[256px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0} debounce={50}>
                    <AreaChart data={timeDistributionData}>
                        <defs>
                            <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#db2777" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#db2777" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                        <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={10} fontWeight="bold" stroke="#94a3b8"/>
                        <YAxis axisLine={false} tickLine={false} fontSize={10} fontWeight="bold" stroke="#94a3b8"/>
                        <Tooltip 
                            contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '12px'}}
                            cursor={{stroke: '#db2777', strokeWidth: 2}}
                        />
                        <Area type="monotone" dataKey="horas" stroke="#db2777" strokeWidth={4} fillOpacity={1} fill="url(#colorHours)" />
                    </AreaChart>
                </ResponsiveContainer>
              </div>
          </div>

          {/* Ranking Detalhado com Metas Individuais */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/30">
                  <h3 className="font-black text-xs text-slate-400 uppercase tracking-widest flex items-center gap-2"><UserIcon size={16} className="text-indigo-600"/> Performance do Time</h3>
                  <span className="text-[10px] font-black text-slate-400 uppercase">Progresso Individual</span>
              </div>
              <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-sm text-left">
                    <thead className="bg-white text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        <tr>
                            <th className="p-4">Colaborador</th>
                            <th className="p-4 text-center">Horas</th>
                            <th className="p-4 text-center">Entregas</th>
                            <th className="p-4 text-center">Meta Individual</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {individualRanking.map((user, idx) => (
                            <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${idx === 0 ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>{idx+1}</div>
                                        <img src={user.avatar} className="w-8 h-8 rounded-full border-2 border-white shadow-sm"/>
                                        <span className="font-bold text-slate-700 group-hover:text-pink-600 transition-colors">{user.name}</span>
                                    </div>
                                </td>
                                <td className="p-4 text-center font-black text-slate-800">{user.hours.toFixed(1)}h</td>
                                <td className="p-4 text-center font-bold text-emerald-600">{user.completed}</td>
                                <td className="p-4 text-center">
                                    {user.hasGoal ? (
                                        <div className="flex flex-col items-center gap-1">
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${user.goalProgress >= 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-pink-100 text-pink-700'}`}>
                                                {user.goalProgress}%
                                            </span>
                                            <div className="w-16 bg-slate-100 h-1 rounded-full overflow-hidden">
                                                <div className={`h-full transition-all duration-1000 ${user.goalProgress >= 100 ? 'bg-emerald-500' : 'bg-pink-500'}`} style={{width: `${user.goalProgress}%`}}></div>
                                            </div>
                                        </div>
                                    ) : (
                                        <span className="text-[10px] text-slate-300 font-bold uppercase italic">Sem Meta</span>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm md:col-span-2">
               <h3 className="font-black text-xs text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><List size={16} className="text-blue-600"/> Gargalos: Impacto na Meta</h3>
               <div className="space-y-3">
                    {filteredTasks.filter(t => {
                        const real = t.timeLogs.reduce((s, l) => s + (l.duration || 0), 0) / 3600;
                        return t.estimatedTime > 0 && real > t.estimatedTime;
                    }).slice(0, 5).map(task => {
                        const realHours = task.timeLogs.reduce((s, l) => s + (l.duration || 0), 0) / 3600;
                        const overflow = realHours - task.estimatedTime;
                        return (
                            <div key={task.id} onClick={() => setSelectedTask(task)} className="flex items-center justify-between p-4 bg-red-50/30 border border-red-100 rounded-xl hover:bg-red-50 cursor-pointer transition-all">
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-slate-800">{task.title}</h4>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">Estimado: {task.estimatedTime}h • Real: {realHours.toFixed(1)}h</p>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-black text-red-600 flex items-center gap-1">+ {overflow.toFixed(1)}h <AlertTriangle size={12}/></span>
                                    <p className="text-[9px] text-red-400 font-bold uppercase tracking-tighter">Atraso Operacional</p>
                                </div>
                            </div>
                        );
                    })}
                    {filteredTasks.filter(t => (t.timeLogs.reduce((s, l) => s + (l.duration || 0), 0) / 3600) > t.estimatedTime && t.estimatedTime > 0).length === 0 && (
                        <div className="text-center py-10 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-xs font-bold uppercase">Nenhum gargalo identificado.</div>
                    )}
               </div>
          </div>
          
          <div className="bg-pink-600 p-6 rounded-2xl shadow-xl text-white flex flex-col justify-between">
              <div>
                <h3 className="font-black text-xs text-pink-200 uppercase tracking-widest mb-4">Eficiência Operacional</h3>
                <p className="text-sm font-medium leading-relaxed opacity-90">O time está operando com **{efficiencyMetrics.ratio}%** da eficiência planejada.</p>
              </div>
              <div className="mt-8 space-y-4">
                  <div className="flex justify-between text-[10px] font-black uppercase">
                      <span>Uso da Estimativa</span>
                      <span>{Math.round((efficiencyMetrics.totalReal / Math.max(efficiencyMetrics.totalEst, 1)) * 100)}%</span>
                  </div>
                  <div className="w-full bg-white/20 h-3 rounded-full overflow-hidden border border-white/10">
                      <div className="bg-white h-full transition-all duration-1000 shadow-[0_0_15px_rgba(255,255,255,0.5)]" style={{width: `${Math.min((efficiencyMetrics.totalReal / Math.max(efficiencyMetrics.totalEst, 1)) * 100, 100)}%`}}></div>
                  </div>
                  <button onClick={() => window.print()} className="w-full py-3 bg-white text-pink-600 font-black rounded-xl text-xs uppercase tracking-widest hover:bg-pink-50 transition-colors shadow-lg">Exportar Relatório</button>
              </div>
          </div>
      </div>

      {/* Modal de Definição de Meta */}
      {showGoalModal && (
          <Modal 
            isOpen={showGoalModal} 
            onClose={() => setShowGoalModal(false)}
            title="Configurar Meta"
            maxWidth="500px"
          >
              <div className="space-y-6">
                  <div className="space-y-4">
                      <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Título da Meta</label>
                          <input 
                            type="text" 
                            value={newGoal.title} 
                            onChange={e => setNewGoal({...newGoal, title: e.target.value})}
                            placeholder="Ex: Meta Mensal de Entregas"
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-pink-100"
                          />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Tipo</label>
                              <select 
                                value={newGoal.type} 
                                onChange={e => setNewGoal({...newGoal, type: e.target.value as any})}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-pink-100"
                              >
                                  <option value="PRODUCTION">Produção (Entregas)</option>
                                  <option value="HOURS">Horas Logadas</option>
                              </select>
                          </div>
                          <div>
                              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Valor Alvo</label>
                              <input 
                                type="number" 
                                value={newGoal.targetValue} 
                                onChange={e => setNewGoal({...newGoal, targetValue: Number(e.target.value)})}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-pink-100"
                              />
                          </div>
                      </div>
                      <div>
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Atribuir a</label>
                          <select 
                            value={newGoal.userId || newGoal.squadId || 'GLOBAL'} 
                            onChange={e => {
                                const val = e.target.value;
                                if (val === 'GLOBAL') setNewGoal({...newGoal, userId: undefined, squadId: undefined});
                                else if (val.startsWith('squad-')) setNewGoal({...newGoal, squadId: val, userId: undefined});
                                else setNewGoal({...newGoal, userId: val, squadId: undefined});
                            }}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-pink-100"
                          >
                              <option value="GLOBAL">Global (Agência)</option>
                              <optgroup label="Squads">
                                  {squads.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                              </optgroup>
                              <optgroup label="Colaboradores">
                                  {users.filter(u => u.role !== 'CLIENT').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                              </optgroup>
                          </select>
                      </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                      <button onClick={() => setShowGoalModal(false)} className="flex-1 py-3 text-slate-500 font-black text-xs uppercase tracking-widest hover:bg-slate-100 rounded-xl transition-colors">Cancelar</button>
                      <button onClick={handleSaveGoal} className="flex-1 py-3 bg-pink-600 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-pink-700 transition-colors shadow-lg shadow-pink-200">Salvar Meta</button>
                  </div>
              </div>
          </Modal>
      )}

      {selectedTask && (
        <TaskModal 
            task={selectedTask} 
            users={users} 
            onClose={() => setSelectedTask(null)} 
            onUpdate={updateTask}
            currentUser={currentUser}
            onDeleteTask={(id) => { setTasks(prev => prev.filter(t => t.id !== id)); setSelectedTask(null); }}
            openConfirm={async (opts) => { console.log(opts); return true; }}
            clients={clients}
        />
      )}
    </div>
  );
};

