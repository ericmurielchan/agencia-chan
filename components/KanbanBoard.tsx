
import React, { useState, useRef, useEffect } from 'react';
import { Task, TaskStatus, User, Comment, ChecklistItem, ColumnConfig, TaskCover, HistoryLog } from '../types';
import { 
    Clock, Play, Pause, Plus, MoreHorizontal, Calendar, 
    CheckCircle, User as UserIcon, MessageSquare, Paperclip, 
    X, Trash2, Edit2, Archive, Image as ImageIcon, Eye, 
    Palette, CheckSquare, Users, CreditCard, Layout, Upload, Download, Check, AlertCircle, Activity, Inbox
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { TaskModal } from './TaskModal';

interface KanbanBoardProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  users: User[];
  currentUser: User;
  columns: ColumnConfig[];
  setColumns: React.Dispatch<React.SetStateAction<ColumnConfig[]>>;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ tasks, setTasks, users, currentUser, columns, setColumns }) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isEditingColumn, setIsEditingColumn] = useState<string | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const isManagerOrAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER';

  // --- Approval Logic ---
  const pendingRequests = tasks.filter(t => {
      // É requisição de cliente E está pendente
      if (!t.clientRequest || t.approvalStatus !== 'PENDING') return false;
      
      // ADMIN vê tudo
      if (currentUser.role === 'ADMIN') return true;
      
      // MANAGER vê apenas da sua Squad
      if (currentUser.role === 'MANAGER') {
          return t.squadId === currentUser.squad;
      }
      return false;
  });

  const handleApprove = (taskId: string) => {
      const task = tasks.find(t => t.id === taskId);
      if(!task) return;

      const historyLog: HistoryLog = {
          id: Date.now().toString(),
          action: 'Aprovou a solicitação',
          userId: currentUser.id,
          timestamp: Date.now()
      };

      setTasks(prev => prev.map(t => t.id === taskId ? { 
          ...t, 
          approvalStatus: 'APPROVED', 
          status: 'BACKLOG', // Garante que vai para o backlog
          history: [...t.history, historyLog] 
      } : t));
      
      confetti({ particleCount: 50, spread: 50, origin: { y: 0.6 } });
  };

  const handleReject = (taskId: string) => {
      const reason = prompt("Motivo da reprovação (opcional):");
      
      const historyLog: HistoryLog = {
          id: Date.now().toString(),
          action: `Reprovou a solicitação. Motivo: ${reason || 'Não informado'}`,
          userId: currentUser.id,
          timestamp: Date.now()
      };

      setTasks(prev => prev.map(t => t.id === taskId ? { 
          ...t, 
          approvalStatus: 'REJECTED', 
          archived: true, // Arquiva para sair da lista
          history: [...t.history, historyLog] 
      } : t));
  };

  // --- End Approval Logic ---

  const triggerConfetti = () => {
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
  };

  const addTask = () => {
    const newTask: Task = {
        id: Date.now().toString(),
        title: 'Nova Demanda',
        description: '',
        status: 'BACKLOG',
        priority: 'MEDIUM',
        dueDate: new Date().toISOString().split('T')[0],
        estimatedTime: 0,
        timeLogs: [],
        isTracking: false,
        assigneeIds: [currentUser.id],
        checklists: [],
        comments: [],
        history: [{ id: 'h_init', action: 'criou a tarefa', userId: currentUser.id, timestamp: Date.now() }],
        archived: false,
        clientRequest: false // Tarefas criadas internamente não são requests
    };
    setTasks(prev => [...prev, newTask]);
    setSelectedTask(newTask);
  };

  const updateTask = (updated: Task) => {
      setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
      if (selectedTask && selectedTask.id === updated.id) {
        setSelectedTask(updated);
      }
  };

  const handleColumnTitleChange = (id: string, newTitle: string) => {
      if (currentUser.role !== 'ADMIN') {
          alert("Apenas administradores podem editar colunas.");
          return;
      }
      setColumns(prev => prev.map(c => c.id === id ? { ...c, label: newTitle } : c));
      setIsEditingColumn(null);
  };

  const addColumn = () => {
      if (currentUser.role !== 'ADMIN') return alert("Apenas administradores.");
      const name = prompt("Nome da Nova Coluna:");
      if (name) {
          const newId = name.toUpperCase().replace(/\s/g, '_');
          setColumns([...columns, { id: newId, label: name, color: 'border-t-4 border-slate-400' }]);
      }
  };

  // --- Drag and Drop Handlers ---
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
      setDraggedTaskId(taskId);
      e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent) => {
      e.preventDefault(); 
      e.dataTransfer.dropEffect = "move";
  };

  const handleDrop = (e: React.DragEvent, targetColId: string) => {
      e.preventDefault();
      
      if (!draggedTaskId) return;

      const task = tasks.find(t => t.id === draggedTaskId);
      if (task && task.status !== targetColId) {
          const colName = columns.find(c => c.id === targetColId)?.label || targetColId;
          
          const updatedTask: Task = {
              ...task,
              status: targetColId,
              history: [
                  ...task.history, 
                  { 
                      id: Date.now().toString(), 
                      action: `moveu para ${colName}`, 
                      userId: currentUser.id, 
                      timestamp: Date.now() 
                  }
              ]
          };
          
          updateTask(updatedTask);
          if (targetColId === 'DONE') triggerConfetti();
      }
      setDraggedTaskId(null);
  };

  // Filter tasks for columns based on Role and Status
  const visibleTasks = tasks.filter(t => {
      // 1. Filtros Globais (Arquivadas e Pendentes de Aprovação)
      // Se estiver arquivada e não estamos mostrando arquivadas, esconde
      if (!showArchived && t.archived) return false;
      if (showArchived && !t.archived) return false;

      // Se for request de cliente, só mostra no board se estiver APROVADA
      // (As pendentes aparecem no inbox acima)
      if (t.clientRequest && t.approvalStatus === 'PENDING') return false;
      if (t.clientRequest && t.approvalStatus === 'REJECTED') return false; 

      // 2. Filtro de Permissão (Visibilidade)
      
      // ADMIN e FINANCE veem tudo
      if (currentUser.role === 'ADMIN' || currentUser.role === 'FINANCE') return true;

      // MANAGER vê tudo do seu Squad
      if (currentUser.role === 'MANAGER') {
          return t.squadId === currentUser.squad;
      }

      // OUTROS (Employee, Freelancer, Client) veem APENAS se estiverem atribuídos
      return t.assigneeIds.includes(currentUser.id);
  });

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Quadro de Campanhas</h2>
          <p className="text-slate-500 text-sm">
              {currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER' 
                ? 'Gerenciamento visual e ágil' 
                : 'Minhas tarefas atribuídas'}
          </p>
        </div>
        <div className="flex gap-2">
            <button 
                onClick={() => setShowArchived(!showArchived)} 
                className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${showArchived ? 'bg-slate-800 text-white' : 'bg-white text-slate-600 border border-slate-200'}`}
            >
                {showArchived ? <Eye size={18}/> : <Archive size={18}/>} 
                {showArchived ? 'Ver Ativos' : 'Arquivados'}
            </button>
            {currentUser.role === 'ADMIN' && (
                <button onClick={addColumn} className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
                    <Layout size={18} /> Coluna
                </button>
            )}
            <button onClick={addTask} className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-lg shadow-pink-500/20">
                <Plus size={18} /> Nova Demanda
            </button>
        </div>
      </div>

      {/* --- INBOX DE APROVAÇÃO (Para Gestores) --- */}
      {isManagerOrAdmin && pendingRequests.length > 0 && !showArchived && (
          <div className="mb-6 bg-orange-50 border border-orange-200 rounded-xl p-4 animate-pop">
              <div className="flex items-center gap-2 mb-3">
                  <div className="bg-orange-100 p-2 rounded-lg text-orange-600">
                      <Inbox size={20}/>
                  </div>
                  <div>
                      <h3 className="font-bold text-orange-800">Solicitações Pendentes ({pendingRequests.length})</h3>
                      <p className="text-xs text-orange-600">Aprove ou rejeite as demandas enviadas pelos clientes.</p>
                  </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {pendingRequests.map(req => {
                      const requester = users.find(u => u.id === req.assigneeIds[0]); // Assumindo criador como primeiro assignee
                      return (
                          <div key={req.id} className="bg-white p-4 rounded-lg border border-orange-100 shadow-sm flex flex-col">
                              <div className="flex items-start justify-between mb-2">
                                  <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded uppercase tracking-wide">
                                      {req.description.match(/^\[(.*?)\]/)?.[1] || 'Solicitação'}
                                  </span>
                                  <span className="text-xs text-slate-400">{new Date(req.history[0]?.timestamp || Date.now()).toLocaleDateString()}</span>
                              </div>
                              <h4 className="font-bold text-slate-800 text-sm mb-1">{req.title}</h4>
                              <p className="text-xs text-slate-500 mb-4 line-clamp-2">{req.description.replace(/^\[.*?\]\s*/, '')}</p>
                              
                              {requester && (
                                  <div className="flex items-center gap-2 mb-3">
                                      <img src={requester.avatar} className="w-5 h-5 rounded-full"/>
                                      <span className="text-xs text-slate-600 font-medium">{requester.name}</span>
                                  </div>
                              )}

                              <div className="mt-auto flex gap-2">
                                  <button 
                                    onClick={() => handleApprove(req.id)}
                                    className="flex-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 py-1.5 rounded text-xs font-bold transition-colors flex items-center justify-center gap-1"
                                  >
                                      <Check size={14}/> Aprovar
                                  </button>
                                  <button 
                                    onClick={() => handleReject(req.id)}
                                    className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 py-1.5 rounded text-xs font-bold transition-colors flex items-center justify-center gap-1"
                                  >
                                      <X size={14}/> Rejeitar
                                  </button>
                              </div>
                          </div>
                      );
                  })}
              </div>
          </div>
      )}

      <div className="flex-1 flex gap-4 overflow-x-auto pb-4 hide-scrollbar">
        {columns.map(col => (
          <div 
            key={col.id} 
            className={`flex-shrink-0 w-80 flex flex-col rounded-xl bg-slate-100/50 border h-full max-h-full transition-colors ${draggedTaskId ? 'border-dashed border-slate-300 bg-slate-50' : 'border-slate-200/60'}`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
          >
            <div className={`p-3 font-bold text-slate-700 flex justify-between items-center bg-slate-100 rounded-t-xl ${col.color}`}>
               {isEditingColumn === col.id ? (
                  <input 
                    autoFocus
                    className="bg-white px-2 py-1 rounded border border-blue-300 outline-none text-sm w-full font-normal"
                    defaultValue={col.label}
                    onBlur={(e) => handleColumnTitleChange(col.id, e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleColumnTitleChange(col.id, e.currentTarget.value)}
                  />
              ) : (
                  <span 
                    onClick={() => currentUser.role === 'ADMIN' && setIsEditingColumn(col.id)} 
                    className={`cursor-pointer w-full ${currentUser.role === 'ADMIN' ? 'hover:text-blue-600' : ''}`}
                    title={currentUser.role === 'ADMIN' ? "Clique para editar o nome da coluna" : ""}
                  >
                      {col.label}
                  </span>
              )}
               <span className="text-xs font-normal text-slate-500 bg-slate-200 px-2 py-0.5 rounded-full">{visibleTasks.filter(t => t.status === col.id).length}</span>
            </div>
            
            <div className="p-2 flex-1 overflow-y-auto space-y-2 custom-scrollbar">
              {visibleTasks.filter(t => t.status === col.id).map(task => (
                  <TaskCard 
                    key={task.id} 
                    task={task} 
                    users={users} 
                    onClick={() => setSelectedTask(task)} 
                    currentUser={currentUser}
                    updateTask={updateTask}
                    onDragStart={(e: React.DragEvent) => handleDragStart(e, task.id)}
                  />
              ))}
            </div>
             <button onClick={addTask} className="m-2 p-2 text-slate-500 hover:bg-slate-200 rounded-lg text-sm flex items-center gap-2 transition-colors">
                <Plus size={16}/> Adicionar cartão
             </button>
          </div>
        ))}
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

// --- Task Card (Trello Style) ---
const TaskCard = ({ task, users, onClick, currentUser, updateTask, onDragStart }: any) => {
    const completedChecklist = task.checklists.filter((c: any) => c.isCompleted).length;
    const totalChecklist = task.checklists.length;
    
    // Timer Toggle
    const toggleTimer = (e: React.MouseEvent) => {
        e.stopPropagation();
        const isStarting = !task.isTracking;
        let newLogs = [...task.timeLogs];
        if (isStarting) {
            newLogs.push({ userId: currentUser.id, startTime: Date.now(), duration: 0 });
        } else {
            const lastIdx = newLogs.length - 1;
            if (lastIdx >= 0) newLogs[lastIdx] = { ...newLogs[lastIdx], endTime: Date.now() };
        }
        updateTask({ ...task, isTracking: isStarting, timeLogs: newLogs });
    };

    return (
        <div 
            draggable 
            onDragStart={onDragStart}
            onClick={onClick} 
            className="group relative bg-white rounded-lg shadow-sm border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all cursor-grab active:cursor-grabbing overflow-hidden"
        >
            {/* Cover Image */}
            {task.cover && (
                <div 
                    className={`w-full ${task.cover.type === 'COLOR' ? 'h-8' : 'h-32'} bg-cover bg-center`}
                    style={{ 
                        backgroundColor: task.cover.type === 'COLOR' ? task.cover.value : undefined,
                        backgroundImage: task.cover.type === 'IMAGE' ? `url(${task.cover.value})` : undefined
                    }}
                />
            )}
            
            <div className="p-3">
                {/* Labels/Badges */}
                <div className="flex flex-wrap gap-1 mb-2">
                    {task.priority === 'HIGH' && <span className="bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded">URGENTE</span>}
                    {task.clientRequest && <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-0.5 rounded">CLIENTE</span>}
                    {task.archived && <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded">ARQUIVADO</span>}
                </div>

                <h4 className="text-sm font-medium text-slate-800 leading-snug mb-3">{task.title}</h4>

                {/* Footer Icons & Members */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-slate-400">
                        {task.isTracking && <div className="text-pink-500 animate-pulse"><Clock size={14}/></div>}
                        {task.description && <div title="Possui descrição"><Layout size={14}/></div>}
                        {task.comments.length > 0 && (
                            <div className="flex items-center gap-1 text-xs">
                                <MessageSquare size={14}/> <span className="pt-0.5">{task.comments.length}</span>
                            </div>
                        )}
                        {totalChecklist > 0 && (
                            <div className={`flex items-center gap-1 text-xs ${completedChecklist === totalChecklist ? 'text-emerald-600 bg-emerald-50 px-1 rounded' : ''}`}>
                                <CheckSquare size={14}/> <span className="pt-0.5">{completedChecklist}/{totalChecklist}</span>
                            </div>
                        )}
                        {task.dueDate && (
                             <div className={`flex items-center gap-1 text-xs ${new Date(task.dueDate) < new Date() && task.status !== 'DONE' ? 'text-red-500 bg-red-50 px-1 rounded' : ''}`}>
                                <Calendar size={14}/> <span className="pt-0.5">{new Date(task.dueDate).getDate()}/{new Date(task.dueDate).getMonth()+1}</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="flex -space-x-1">
                         {task.assigneeIds.map((uid: string) => {
                            const u = users.find((user: any) => user.id === uid);
                            if (!u) return null;
                            return <img key={uid} src={u.avatar} className="w-6 h-6 rounded-full border-2 border-white" title={u.name} />;
                        })}
                    </div>
                </div>
            </div>
            
            {/* Quick Actions on Hover (Desktop) */}
            <button 
                onClick={toggleTimer} 
                className={`absolute top-2 right-2 p-1.5 rounded bg-white/90 shadow-sm hover:bg-pink-50 hover:text-pink-600 opacity-0 group-hover:opacity-100 transition-opacity z-10 ${task.isTracking ? 'text-pink-600 opacity-100' : 'text-slate-400'}`}
                title={task.isTracking ? "Pausar Timer" : "Iniciar Timer"}
            >
                {task.isTracking ? <Pause size={14}/> : <Play size={14}/>}
            </button>
        </div>
    );
};
