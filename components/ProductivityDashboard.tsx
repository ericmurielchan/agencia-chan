
import React, { useState, useMemo } from 'react';
import { Task, User, Squad, Client } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell, LineChart, Line, CartesianGrid } from 'recharts';
import { AlertTriangle, Target, Clock, Users, TrendingUp, CheckCircle2, User as UserIcon, List } from 'lucide-react';
import { TaskModal } from './TaskModal';

interface ProductivityDashboardProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  users: User[];
  squads: Squad[];
  clients: Client[];
  currentUser: User;
}

export const ProductivityDashboard: React.FC<ProductivityDashboardProps> = ({ tasks, setTasks, users, squads, clients, currentUser }) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  // Filtros
  const [dateRange, setDateRange] = useState<'7days' | '30days' | '90days'>('30days');
  const [selectedSquadId, setSelectedSquadId] = useState<string>('ALL');
  const [selectedUserId, setSelectedUserId] = useState<string>('ALL');
  const [selectedClientId, setSelectedClientId] = useState<string>('ALL');

  // Permissão: Se não for ADMIN/MANAGER, força o filtro de usuário para o próprio ID
  const isManagement = ['ADMIN', 'MANAGER', 'FINANCE'].includes(currentUser.role);
  
  // Efeito para forçar filtro de usuário se não for gestão
  React.useEffect(() => {
      if (!isManagement) {
          setSelectedUserId(currentUser.id);
          // Se o usuário tem squad, força squad também para contexto
          if(currentUser.squad) setSelectedSquadId(currentUser.squad);
      }
  }, [currentUser, isManagement]);

  // --- Lógica de Filtragem ---
  const filteredTasks = useMemo(() => {
      const now = new Date();
      let startDate = new Date();
      if (dateRange === '7days') startDate.setDate(now.getDate() - 7);
      if (dateRange === '30days') startDate.setDate(now.getDate() - 30);
      if (dateRange === '90days') startDate.setDate(now.getDate() - 90);

      return tasks.filter(t => {
          // Filtro de Data (Vencimento ou Criação dentro do range, ou ativa no momento)
          const taskDate = new Date(t.dueDate);
          const isDateInRange = taskDate >= startDate; // Simplificado para dueDate futura ou recente

          // Filtro de Squad
          const isSquadMatch = selectedSquadId === 'ALL' || t.squadId === selectedSquadId;

          // Filtro de Usuário (verifica se o usuário é um dos assignees)
          // Se não for management, selectedUserId já está travado no currentUser.id
          const isUserMatch = selectedUserId === 'ALL' || t.assigneeIds.includes(selectedUserId);

          // Filtro de Cliente (Baseado no Squad do Cliente)
          let isClientMatch = true;
          if (selectedClientId !== 'ALL') {
              const client = clients.find(c => c.id === selectedClientId);
              // Assume que tarefas do cliente estão na squad do cliente
              // Ou se o título da tarefa contiver o nome do cliente (fallback simples)
              if (client) {
                  isClientMatch = (t.squadId === client.squadId) || t.title.toLowerCase().includes(client.name.toLowerCase());
              }
          }

          return isDateInRange && isSquadMatch && isUserMatch && isClientMatch;
      });
  }, [tasks, dateRange, selectedSquadId, selectedUserId, selectedClientId, clients]);

  // --- Cálculos de KPIs ---
  const activeTasks = filteredTasks.filter(t => !t.archived && t.status !== 'DONE');
  const pendingTasks = activeTasks.filter(t => t.status === 'BACKLOG' || t.status === 'TODO');
  const inProgressTasks = activeTasks.filter(t => t.status === 'IN_PROGRESS' || t.status === 'REVIEW');
  const doneTasks = filteredTasks.filter(t => t.status === 'DONE');
  
  const overdueTasks = filteredTasks.filter(t => {
      return !t.archived && t.status !== 'DONE' && new Date(t.dueDate) < new Date(new Date().setHours(0,0,0,0));
  });

  // Taxa de Entrega no Prazo (On-time Delivery)
  // Tarefas concluídas que não estouraram o prazo
  const onTimeTasks = doneTasks.filter(t => new Date(t.dueDate) >= new Date()).length;
  const onTimeRate = doneTasks.length > 0 ? Math.round((onTimeTasks / doneTasks.length) * 100) : 100;

  // --- Rankings ---

  // 1. Ranking Individual
  const individualRanking = users
    .filter(u => u.role !== 'CLIENT' && u.role !== 'ADMIN') // Apenas produtivos
    .filter(u => selectedUserId === 'ALL' || u.id === selectedUserId) // Respeita filtro
    .map(user => {
        const userTasks = filteredTasks.filter(t => t.assigneeIds.includes(user.id));
        const completed = userTasks.filter(t => t.status === 'DONE').length;
        const overdue = userTasks.filter(t => !t.archived && t.status !== 'DONE' && new Date(t.dueDate) < new Date()).length;
        
        let totalEst = 0; 
        let totalAct = 0;
        userTasks.forEach(t => {
             totalEst += t.estimatedTime || 0;
             const logSum = t.timeLogs.reduce((acc, l) => acc + l.duration, 0) / 3600;
             totalAct += logSum;
        });

        const efficiency = totalAct > 0 ? Math.round((totalEst / totalAct) * 100) : (totalEst > 0 ? 100 : 0);

        return {
            id: user.id,
            name: user.name,
            avatar: user.avatar,
            completed,
            overdue,
            efficiency,
            active: userTasks.filter(t => t.status !== 'DONE' && !t.archived).length
        };
    })
    .sort((a,b) => b.completed - a.completed); // Default sort by delivery

  // 2. Ranking de Squads
  const squadRanking = squads.map(squad => {
      const squadTasks = filteredTasks.filter(t => t.squadId === squad.id);
      const completed = squadTasks.filter(t => t.status === 'DONE').length;
      const overdue = squadTasks.filter(t => !t.archived && t.status !== 'DONE' && new Date(t.dueDate) < new Date()).length;
      
      return {
          id: squad.id,
          name: squad.name,
          completed,
          overdue,
          active: squadTasks.filter(t => t.status !== 'DONE' && !t.archived).length
      };
  }).sort((a,b) => b.completed - a.completed);

  // --- Gráfico de Histórico (Simulado com dados disponíveis) ---
  // Agrupar tarefas concluídas por data (nos últimos X dias)
  const historyData = useMemo(() => {
      const data: Record<string, number> = {};
      // Inicializa últimos 7 dias
      for(let i=6; i>=0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          data[d.toISOString().split('T')[0].substring(5)] = 0;
      }
      
      doneTasks.forEach(t => {
           // Simulação: assume dueDate como data de entrega para fins de gráfico se não tiver logs
           // O ideal seria pegar o timestamp do log de conclusão ou history
           const dateKey = t.dueDate.substring(5); // MM-DD
           if (data[dateKey] !== undefined) {
               data[dateKey] += 1;
           }
      });

      return Object.entries(data).map(([key, value]) => ({ date: key, entregas: value }));
  }, [doneTasks]);

  const updateTask = (updated: Task) => {
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
      if (selectedTask && selectedTask.id === updated.id) {
        setSelectedTask(updated);
      }
  };

  const renderTaskList = (title: string, listTasks: Task[], icon: React.ReactNode, headerColor: string) => (
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
          <div className={`p-4 border-b border-slate-100 flex justify-between items-center ${headerColor}`}>
              <h3 className="font-bold text-slate-700 flex items-center gap-2">{icon} {title}</h3>
              <span className="text-xs bg-white/50 px-2 py-1 rounded font-bold text-slate-600">{listTasks.length}</span>
          </div>
          <div className="flex-1 overflow-y-auto max-h-[350px] p-2 space-y-2 custom-scrollbar bg-slate-50/50">
              {listTasks.length === 0 && (
                  <div className="text-center p-8 text-slate-400 text-sm italic">
                      Nenhuma tarefa nesta categoria.
                  </div>
              )}
              {listTasks.map(task => (
                  <div 
                    key={task.id} 
                    onClick={() => setSelectedTask(task)}
                    className="bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-pink-200 cursor-pointer transition-all group"
                  >
                      <div className="flex justify-between items-start mb-1">
                          <h4 className="text-sm font-bold text-slate-700 line-clamp-1 group-hover:text-pink-600 transition-colors">{task.title}</h4>
                          {task.priority === 'HIGH' && <span className="w-2 h-2 bg-red-500 rounded-full shrink-0"></span>}
                      </div>
                      <div className="flex justify-between items-end mt-2">
                          <div className="flex -space-x-1.5">
                              {task.assigneeIds.map(uid => {
                                  const u = users.find(user => user.id === uid);
                                  if(!u) return null;
                                  return <img key={uid} src={u.avatar} className="w-5 h-5 rounded-full border border-white" title={u.name}/>
                              })}
                          </div>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${new Date(task.dueDate) < new Date() && task.status !== 'DONE' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                              {new Date(task.dueDate).toLocaleDateString(undefined, {day: '2-digit', month: '2-digit'})}
                          </span>
                      </div>
                  </div>
              ))}
          </div>
      </div>
  );

  return (
    <div className="space-y-6 animate-pop">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800">Painel de Produtividade</h2>
            <p className="text-slate-500 text-sm">Métricas de performance, gargalos e eficiência operacional.</p>
        </div>
        <div className="flex flex-wrap gap-2">
            {/* Filters */}
            <select 
                value={dateRange} 
                onChange={e => setDateRange(e.target.value as any)}
                className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg p-2 outline-none focus:border-pink-500"
            >
                <option value="7days">Últimos 7 dias</option>
                <option value="30days">Últimos 30 dias</option>
                <option value="90days">Últimos 90 dias</option>
            </select>

            {isManagement && (
                <>
                    <select 
                        value={selectedSquadId} 
                        onChange={e => setSelectedSquadId(e.target.value)}
                        className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg p-2 outline-none focus:border-pink-500"
                    >
                        <option value="ALL">Todas as Squads</option>
                        {squads.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    
                    <select 
                        value={selectedUserId} 
                        onChange={e => setSelectedUserId(e.target.value)}
                        className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg p-2 outline-none focus:border-pink-500"
                    >
                        <option value="ALL">Todos Usuários</option>
                        {users.filter(u => u.role !== 'CLIENT').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                    </select>

                    <select 
                        value={selectedClientId} 
                        onChange={e => setSelectedClientId(e.target.value)}
                        className="bg-white border border-slate-200 text-slate-700 text-sm rounded-lg p-2 outline-none focus:border-pink-500"
                    >
                        <option value="ALL">Todos Clientes</option>
                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </>
            )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Users size={12}/> Demandas Ativas</p>
              <h3 className="text-2xl font-bold text-slate-800 mt-2">{activeTasks.length}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Total em aberto</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Clock size={12}/> Pendentes</p>
              <h3 className="text-2xl font-bold text-orange-600 mt-2">{pendingTasks.length}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Backlog e A Fazer</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><Target size={12}/> Em Produção</p>
              <h3 className="text-2xl font-bold text-blue-600 mt-2">{inProgressTasks.length}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Execução e Revisão</p>
          </div>
           <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><AlertTriangle size={12}/> Atrasadas</p>
              <h3 className="text-2xl font-bold text-red-600 mt-2">{overdueTasks.length}</h3>
              <p className="text-[10px] text-slate-400 mt-1">Estouraram o prazo</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1"><CheckCircle2 size={12}/> Entregues</p>
              <div className="flex items-end gap-2 mt-2">
                  <h3 className="text-2xl font-bold text-emerald-600">{doneTasks.length}</h3>
                  <span className={`text-xs font-bold mb-1 px-1.5 rounded ${onTimeRate >= 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {onTimeRate}% no prazo
                  </span>
              </div>
          </div>
      </div>

      {/* --- TASK LISTS DETAILED --- */}
      <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mt-4"><List size={20}/> Detalhamento de Tarefas</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {renderTaskList('Atrasadas', overdueTasks, <AlertTriangle size={18} className="text-red-500"/>, 'bg-red-50 border-red-100')}
          {renderTaskList('Em Andamento', inProgressTasks, <Target size={18} className="text-blue-500"/>, 'bg-blue-50 border-blue-100')}
          {renderTaskList('Pendentes', pendingTasks, <Clock size={18} className="text-orange-500"/>, 'bg-orange-50 border-orange-100')}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          
          {/* Ranking Individual */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
              <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-bold text-slate-700 flex items-center gap-2"><UserIcon size={18}/> Performance Individual</h3>
              </div>
              <div className="flex-1 overflow-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-white text-slate-500 font-semibold border-b border-slate-100">
                        <tr>
                            <th className="p-4">Colaborador</th>
                            <th className="p-4 text-center">Entregues</th>
                            <th className="p-4 text-center">Ativas</th>
                            <th className="p-4 text-center text-red-500">Atrasos</th>
                            <th className="p-4 text-center">Eficiência</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {individualRanking.map((user, idx) => (
                            <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <span className={`font-bold w-4 text-center ${idx < 3 ? 'text-amber-500' : 'text-slate-300'}`}>{idx+1}</span>
                                        <img src={user.avatar} className="w-8 h-8 rounded-full border border-slate-200"/>
                                        <span className="font-medium text-slate-700">{user.name}</span>
                                    </div>
                                </td>
                                <td className="p-4 text-center font-bold text-emerald-600">{user.completed}</td>
                                <td className="p-4 text-center text-slate-600">{user.active}</td>
                                <td className="p-4 text-center text-red-500 font-medium">{user.overdue}</td>
                                <td className="p-4 text-center">
                                    <div className="flex items-center justify-center gap-1">
                                        <span className={`text-xs font-bold ${user.efficiency > 100 ? 'text-blue-600' : user.efficiency < 80 ? 'text-red-500' : 'text-emerald-600'}`}>
                                            {user.efficiency}%
                                        </span>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {individualRanking.length === 0 && (
                            <tr><td colSpan={5} className="p-8 text-center text-slate-400">Nenhum dado encontrado para os filtros selecionados.</td></tr>
                        )}
                    </tbody>
                </table>
              </div>
          </div>

          {/* Charts & Squad Ranking */}
          <div className="space-y-6">
               {/* Chart */}
               <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                   <h3 className="font-bold text-slate-700 mb-6 flex items-center gap-2"><TrendingUp size={18}/> Volume de Entregas (Últimos Dias)</h3>
                   <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={historyData}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                              <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={12} stroke="#94a3b8"/>
                              <YAxis axisLine={false} tickLine={false} fontSize={12} stroke="#94a3b8" allowDecimals={false}/>
                              <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                              <Line type="monotone" dataKey="entregas" stroke="#db2777" strokeWidth={3} dot={{r: 4, fill: '#db2777', strokeWidth: 2, stroke: '#fff'}} />
                          </LineChart>
                      </ResponsiveContainer>
                   </div>
               </div>

               {/* Squad Ranking (Only for Management) */}
               {isManagement && (
                   <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                       <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                          <h3 className="font-bold text-slate-700 flex items-center gap-2"><Users size={18}/> Performance por Squad</h3>
                       </div>
                       <table className="w-full text-sm text-left">
                            <thead className="bg-white text-slate-500 font-semibold border-b border-slate-100">
                                <tr>
                                    <th className="p-3">Squad</th>
                                    <th className="p-3 text-center">Entregas</th>
                                    <th className="p-3 text-center text-red-500">Atrasos</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {squadRanking.map(s => (
                                    <tr key={s.id} className="hover:bg-slate-50">
                                        <td className="p-3 font-medium text-slate-700">{s.name}</td>
                                        <td className="p-3 text-center font-bold text-emerald-600">{s.completed}</td>
                                        <td className="p-3 text-center text-red-500">{s.overdue}</td>
                                    </tr>
                                ))}
                            </tbody>
                       </table>
                   </div>
               )}
          </div>
      </div>

      {selectedTask && (
        <TaskModal 
            task={selectedTask} 
            users={users} 
            onClose={() => setSelectedTask(null)} 
            onUpdate={updateTask}
            currentUser={currentUser}
        />
      )}
    </div>
  );
};
