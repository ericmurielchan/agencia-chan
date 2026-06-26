
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Task, User, ColumnConfig, Notification, SystemModule, ConfirmOptions, Client, Squad } from '../types';
import { 
    Plus, Archive, Settings, X, Search, Bell, Layers, Menu, Calendar, Clock, Play
} from 'lucide-react';
import { TaskModal } from './TaskModal';
import confetti from 'canvas-confetti';

const TaskTimerBadge: React.FC<{ task: Task; isHeader?: boolean }> = ({ task, isHeader }) => {
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    let interval: any;
    if (task.isTracking) {
      interval = setInterval(() => {
        const activeLog = task.timeLogs?.find(l => !l.endTime);
        if (activeLog) {
          const elapsed = Math.floor((Date.now() - activeLog.startTime) / 1000);
          setSecondsElapsed(elapsed);
        }
      }, 1000);
    } else {
      setSecondsElapsed(0);
    }
    return () => clearInterval(interval);
  }, [task.isTracking, task.timeLogs]);

  const getAccumulatedSeconds = () => {
    const closed = (task.timeLogs || []).reduce((acc, log) => acc + (log.duration || 0), 0);
    return closed + secondsElapsed;
  };

  const formatSeconds = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (isHeader) {
    return (
      <span className="text-xs font-mono font-black text-pink-500 tracking-wider">
        {formatSeconds(getAccumulatedSeconds())}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest bg-pink-500 text-white shadow-sm shadow-pink-500/20 animate-pulse">
      <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping"></span>
      {formatSeconds(getAccumulatedSeconds())}
    </span>
  );
};

interface KanbanBoardProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  users: User[];
  currentUser: User;
  columns: ColumnConfig[];
  setColumns: React.Dispatch<React.SetStateAction<ColumnConfig[]>>;
  notifications: Notification[];
  addNotification: (data: any) => Promise<void>;
  onNotificationClick: (notif: Notification) => Promise<void>;
  onMarkAllAsRead: () => Promise<void>;
  openConfirm: (options: ConfirmOptions) => Promise<boolean>;
  sidebarOpen: boolean;
  sidebarCompact: boolean;
  isMobile: boolean;
  clients: Client[];
  selectedTaskId?: string | null;
  onClearSelectedTask?: () => void;
  initialFilter?: any;
  onClearFilter?: () => void;
  onNavigate?: (view: string, refId?: string) => void;
  onSaveTask?: (task: Task) => void;
  onDeleteTask?: (id: string) => void;
  squads?: Squad[];
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  tasks, setTasks, users, currentUser, columns, setColumns, notifications, addNotification, onNotificationClick, onMarkAllAsRead, openConfirm,
  sidebarOpen, sidebarCompact, isMobile, clients, selectedTaskId, onClearSelectedTask, initialFilter, onClearFilter, onNavigate,
  onSaveTask, onDeleteTask, squads = []
}) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [showArchivedColumns, setShowArchivedColumns] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<Partial<ColumnConfig> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<any>(null);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const isAdmin = currentUser.role === 'ADMIN';
  const isManager = currentUser.role === 'MANAGER';
  
  const visibleTasks = useMemo(() => {
    if (isAdmin) return tasks;
    if (isManager) {
        const mySquads = squads.filter(s => s.members?.includes(currentUser.id));
        const mySquadIds = mySquads.map(s => s.id);
        return tasks.filter(t => (t.squadId && mySquadIds.includes(t.squadId)) || t.assigneeIds.includes(currentUser.id));
    }
    return tasks.filter(t => t.assigneeIds.includes(currentUser.id));
  }, [tasks, currentUser, isAdmin, isManager, squads]);

  const activeColumns = useMemo(() => columns.filter(c => !c.isArchived).sort((a,b) => a.order - b.order), [columns]);
  const archivedColumns = useMemo(() => columns.filter(c => c.isArchived).sort((a,b) => a.order - b.order), [columns]);
  
  const filterNotification = (n: Notification) => {
    // Basic existence and status checks
    const basicMatch = n.targetUserId === currentUser.id || (!n.targetUserId && (!n.targetRole || n.targetRole === currentUser.role));
    if (!basicMatch) return false;

    // Commercial restrictions (Production vs Commercial)
    if (currentUser.role === 'COMMERCIAL') {
        // If they are explicitly targeted by ID, allow it regardless of module
        if (n.targetUserId === currentUser.id) return true;
        
        // Otherwise, only show notifications from commercial-related modules
        const commercialModules: SystemModule[] = ['CRM', 'CLIENTS', 'HELP', 'DASHBOARD'];
        return commercialModules.includes(n.originModule);
    }

    return true;
  };

  const unreadCount = (currentUser.preferences?.systemNotifications !== false)
    ? notifications.filter(n => n.status === 'UNREAD' && filterNotification(n)).length
    : 0;

  useEffect(() => {
    if (selectedTaskId) {
      const task = tasks.find(t => t.id === selectedTaskId);
      if (task) {
        setSelectedTask(task);
        // Scroll to task if possible (optional)
        const element = document.getElementById(`task-${task.id}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      if (onClearSelectedTask) onClearSelectedTask();
    }
  }, [selectedTaskId, tasks, onClearSelectedTask]);

  useEffect(() => {
    if (initialFilter) {
      setActiveFilter(initialFilter);
      if (initialFilter.archived !== undefined) setShowArchived(initialFilter.archived);
      if (onClearFilter) onClearFilter();
    }
  }, [initialFilter, onClearFilter]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveColumn = () => {
    if (!editingColumn?.label) return;
    if (editingColumn.id) setColumns(prev => prev.map(c => c.id === editingColumn.id ? { ...c, ...editingColumn } as ColumnConfig : c));
    else setColumns(prev => [...prev, { id: 'col-' + Date.now(), label: editingColumn.label, color: 'border-slate-400', order: columns.length, wipLimit: editingColumn.wipLimit || null, isArchived: false } as ColumnConfig]);
    setIsColumnModalOpen(false);
  };

  const handleDropTask = (e: React.DragEvent, targetColId: string) => {
      e.preventDefault();
      if (!draggedTaskId) return;
      const task = tasks.find(t => t.id === draggedTaskId);
      if (task) {
          // Find sorted tasks under the target category to insert the dragged task at the very top (first position)
          const colTasks = tasks
            .filter(t => t.status === targetColId && t.id !== draggedTaskId && (showArchived ? t.archived : !t.archived))
            .sort((a, b) => {
              const posA = a.position !== undefined ? a.position : (a.createdAt || 0);
              const posB = b.position !== undefined ? b.position : (b.createdAt || 0);
              return posA - posB;
            });

          let newPosition = 0;
          if (colTasks.length > 0) {
              const firstTaskPos = colTasks[0].position !== undefined ? colTasks[0].position : (colTasks[0].createdAt || 0);
              newPosition = firstTaskPos - 1000;
          } else {
              newPosition = Date.now();
          }

          const now = Date.now();
          const updatedTask = { 
              ...task, 
              status: targetColId,
              position: newPosition,
              completedAt: targetColId === 'DONE' ? now : (task.status === 'DONE' ? undefined : task.completedAt)
          };
          
          // Update local state immediately
          setTasks(prev => prev.map(t => t.id === draggedTaskId ? updatedTask : t));
          
          if (onSaveTask) {
              onSaveTask(updatedTask);
          }
          
          if (targetColId === 'DONE' && task.status !== 'DONE') {
              confetti({
                  particleCount: 150,
                  spread: 70,
                  origin: { y: 0.6 }
              });
          }
      }
      setDraggedTaskId(null);
      setDragOverColumnId(null);
      setDragOverTaskId(null);
  };

  const handleDropOnTask = (draggedId: string, targetId: string) => {
      setDragOverColumnId(null);
      setDragOverTaskId(null);
      const draggedTask = tasks.find(t => t.id === draggedId);
      const targetTask = tasks.find(t => t.id === targetId);
      if (!draggedTask || !targetTask) return;
      
      const targetColId = targetTask.status;
      
      // Get all tasks in the target column sorted, excluding the dragged task itself
      const colTasks = tasks
        .filter(t => t.status === targetColId && t.id !== draggedId && (showArchived ? t.archived : !t.archived))
        .sort((a, b) => {
          const posA = a.position !== undefined ? a.position : (a.createdAt || 0);
          const posB = b.position !== undefined ? b.position : (b.createdAt || 0);
          return posA - posB;
        });
        
      const targetIndex = colTasks.findIndex(t => t.id === targetId);
      
      let newPosition = 0;
      if (targetIndex === 0) {
          // If dropped on the first item, insert it before it
          const firstTaskPos = colTasks[0]?.position !== undefined ? colTasks[0].position : (colTasks[0]?.createdAt || 0);
          newPosition = firstTaskPos - 1000;
      } else {
          // Intercalate between the preceding item and the target item
          const prevTask = colTasks[targetIndex - 1];
          const prevTaskPos = prevTask.position !== undefined ? prevTask.position : (prevTask.createdAt || 0);
          const targetTaskPos = targetTask.position !== undefined ? targetTask.position : (targetTask.createdAt || 0);
          newPosition = prevTaskPos + (targetTaskPos - prevTaskPos) / 2;
      }
      
      const now = Date.now();
      const updatedTask = {
          ...draggedTask,
          status: targetColId,
          position: newPosition,
          completedAt: targetColId === 'DONE' ? now : (draggedTask.status === 'DONE' ? undefined : draggedTask.completedAt)
      };
      
      setTasks(prev => prev.map(t => t.id === draggedId ? updatedTask : t));
      
      if (onSaveTask) {
          onSaveTask(updatedTask);
      }
      
      if (targetColId === 'DONE' && draggedTask.status !== 'DONE') {
          confetti({
              particleCount: 150,
              spread: 70,
              origin: { y: 0.6 }
          });
      }
      setDraggedTaskId(null);
      setDragOverColumnId(null);
      setDragOverTaskId(null);
  };

  const sidebarWidth = isMobile ? '0px' : (sidebarOpen ? (sidebarCompact ? '80px' : '256px') : '0px');

  const handleUpdateTask = (updatedTask: Task) => {
    // Update local state immediately for better UX
    setTasks(prev => {
      const exists = prev.some(t => t.id === updatedTask.id);
      if (exists) {
        return prev.map(t => t.id === updatedTask.id ? updatedTask : t);
      } else {
        return [...prev, updatedTask];
      }
    });
    
    if (onSaveTask) {
      onSaveTask(updatedTask);
    }
    
    setSelectedTask(updatedTask);
  };

  const toggleSidebar = () => {
      // This is a bit tricky since we don't have setSidebarOpen here
      // But we can use a custom event or just assume App.tsx handles it if we provide a way
      // Actually, we should probably pass a toggle function to KanbanBoard
  };

  return (
    <div 
      className="fixed inset-0 flex flex-col bg-slate-50 overflow-hidden transition-all duration-300 ease-in-out"
      style={{ left: sidebarWidth }}
    >
      <header className="flex-none w-full bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 md:px-6 py-3 md:py-4 flex items-center justify-between z-50 shadow-sm">
        <div className="flex items-center gap-2 md:gap-4 shrink-0">
          {isMobile && (
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
                className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm"
              >
                <Menu size={20} />
              </button>
          )}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="w-10 h-10 md:w-11 md:h-11 rounded-xl md:rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-500 hover:text-pink-600 transition-all hover:shadow-md hover:border-pink-200 relative group"
            >
              <Bell size={18} className="group-hover:scale-110 transition-transform" />
              {unreadCount > 0 && (
                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
              )}
            </button>
            {showNotifDropdown && (
              <div className="absolute left-0 top-full mt-3 w-72 md:w-80 bg-white rounded-2xl md:rounded-3xl shadow-2xl border border-slate-100 z-[60] animate-pop overflow-hidden">
                <div className="p-4 md:p-5 border-b bg-slate-50/50 flex justify-between items-center">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Notificações</h3>
                  <button 
                    onClick={onMarkAllAsRead}
                    className="text-[9px] font-black uppercase tracking-widest text-pink-600 hover:text-pink-700"
                  >
                    Limpar
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  {(notifications.filter(filterNotification).length > 0 && currentUser.preferences?.systemNotifications !== false) ? (
                    <div className="divide-y divide-slate-50">
                      {notifications
                        .filter(filterNotification)
                        .sort((a, b) => b.timestamp - a.timestamp)
                        .map(notif => (
                        <button 
                          key={notif.id} 
                          onClick={() => {
                            onNotificationClick(notif);
                            setShowNotifDropdown(false);
                          }}
                          className={`w-full p-4 text-left hover:bg-slate-50 transition-colors flex gap-3 items-start ${notif.status === 'UNREAD' ? 'bg-pink-50/30' : ''}`}
                        >
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                            notif.type === 'ALERT' ? 'bg-red-100 text-red-600' :
                            notif.type === 'WARNING' ? 'bg-amber-100 text-amber-600' :
                            notif.type === 'SUCCESS' ? 'bg-emerald-100 text-emerald-600' :
                            'bg-blue-100 text-blue-600'
                          }`}>
                            <Bell size={12} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`text-[10px] font-black uppercase tracking-tight truncate ${notif.status === 'UNREAD' ? 'text-slate-900' : 'text-slate-600'}`}>{notif.title}</p>
                            <p className="text-[10px] text-slate-500 font-medium line-clamp-2 leading-tight mt-0.5">{notif.message}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 md:p-10 text-center">
                        <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-xl md:rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-300">
                            <Bell size={20} />
                        </div>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Sem novidades</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          <div className="bg-white px-3 md:px-5 py-1.5 md:py-2 rounded-xl md:rounded-2xl shadow-sm border border-slate-100 flex items-center gap-2 md:gap-4 group transition-all cursor-default hover:shadow-md hover:border-slate-200 hidden xs:flex">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-black text-slate-800 leading-none tracking-tight">{currentUser.name}</p>
              <p className="text-[9px] text-slate-400 uppercase font-black mt-1 tracking-widest">{currentUser.role}</p>
            </div>
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg md:rounded-xl overflow-hidden border-2 border-white shadow-sm bg-slate-100 transition-transform group-hover:scale-105">
              <img src={currentUser.avatar || undefined} alt="Perfil" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>
        <div className="flex-1 max-w-lg mx-4 md:mx-8 hidden md:block">
          <div className="relative group">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-pink-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Pesquisar jobs..." 
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-slate-100/60 border border-transparent focus:bg-white focus:border-pink-200 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold text-slate-700 outline-none transition-all placeholder:text-slate-400 shadow-inner"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          {activeFilter && (
            <button 
              onClick={() => setActiveFilter(null)}
              className="h-10 md:h-11 px-4 bg-pink-50 text-pink-600 border border-pink-200 rounded-xl md:rounded-2xl flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:bg-pink-100 transition-all"
            >
              Limpar Filtro <X size={14} />
            </button>
          )}
          <button onClick={() => setShowArchived(!showArchived)} className={`w-10 h-10 md:w-11 md:h-11 rounded-xl md:rounded-2xl flex items-center justify-center transition-all border ${showArchived ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-400 border-slate-200 hover:text-pink-600'}`} title="Jobs Arquivados"><Archive size={18}/></button>
          {isAdmin && (<button onClick={() => setShowArchivedColumns(true)} className="w-10 h-10 md:w-11 md:h-11 rounded-xl md:rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-pink-600 transition-all hidden sm:flex" title="Configurações do Quadro"><Settings size={18}/></button>)}
          <div className="w-px h-8 bg-slate-200 mx-1 hidden sm:block"></div>
          <button onClick={() => setSelectedTask({ id: Date.now().toString(), title: '', description: '', status: activeColumns[0]?.id || 'BACKLOG', priority: 'MEDIUM', dueDate: '', timeLogs: [], assigneeIds: [currentUser.id], checklists: [], comments: [], history: [], estimatedTime: 0, isTracking: false, createdAt: Date.now() } as Task)} className="h-10 md:h-11 px-3 md:px-6 bg-pink-600 hover:bg-pink-700 text-white rounded-xl md:rounded-2xl flex items-center gap-2 md:gap-3 text-[10px] md:text-xs font-black uppercase tracking-widest shadow-lg shadow-pink-500/30 transition-all transform hover:scale-[1.02] active:scale-95 whitespace-nowrap">
            <Plus size={18} strokeWidth={3} /> 
            <span className="hidden xs:inline">NOVO JOB</span>
            <span className="xs:hidden">NOVO</span>
          </button>
        </div>
      </header>

      {/* Active production tracker bar */}
      {tasks.filter(t => t.isTracking).length > 0 && (
        <div className="mx-6 mt-4 bg-slate-900 border border-slate-800 rounded-[24px] p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl shadow-pink-500/5 animate-pop">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-pink-500"></span>
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-pink-500">Job em Produção Ativa</p>
              <p className="text-xs font-bold text-white mt-0.5 line-clamp-1 max-w-md">
                {tasks.filter(t => t.isTracking).map(t => t.title).join(', ')}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {tasks.filter(t => t.isTracking).map(t => (
              <div key={t.id} className="flex items-center gap-3 bg-slate-800/80 border border-slate-700/50 px-4 py-2 rounded-xl">
                <span className="text-[10px] font-bold text-slate-300 line-clamp-1 max-w-[150px]">{t.title}</span>
                <TaskTimerBadge task={t} isHeader />
                <button 
                  onClick={() => setSelectedTask(t)}
                  className="px-3 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-lg text-[9px] font-black uppercase tracking-widest transition-all active:scale-95"
                >
                  Abrir Job
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <main className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
        <div className="inline-flex h-full p-6 gap-6 items-start">
          {activeColumns.map(col => {
            const colTasks = visibleTasks.filter(t => {
              const matchesStatus = t.status === col.id;
              const matchesArchived = showArchived ? t.archived : !t.archived;
              const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
              
              let matchesFilter = true;
              if (activeFilter) {
                if (activeFilter.status && t.status !== activeFilter.status) matchesFilter = false;
                if (activeFilter.overdue) {
                  const today = new Date().toISOString().split('T')[0];
                  if (!(t.dueDate && t.dueDate.split('T')[0] < today && t.status !== 'DONE' && !t.archived)) matchesFilter = false;
                }
                if (activeFilter.inProgress) {
                  if (!(t.status !== 'BACKLOG' && t.status !== 'DONE' && !t.archived)) matchesFilter = false;
                }
                if (activeFilter.pending) {
                  if (t.status !== 'BACKLOG') matchesFilter = false;
                }
              }

              return matchesStatus && matchesArchived && matchesSearch && matchesFilter;
            }).sort((a, b) => {
              const posA = a.position !== undefined ? a.position : (a.createdAt || 0);
              const posB = b.position !== undefined ? b.position : (b.createdAt || 0);
              return posA - posB;
            });
            return (
              <div 
                key={col.id} 
                onDragOver={e => {
                  e.preventDefault();
                  if (dragOverColumnId !== col.id) {
                    setDragOverColumnId(col.id);
                  }
                  if (dragOverTaskId !== null) {
                    setDragOverTaskId(null);
                  }
                }} 
                onDrop={e => handleDropTask(e, col.id)} 
                className={`flex-shrink-0 w-80 flex flex-col max-h-full rounded-[32px] transition-all duration-200 border ${
                  draggedTaskId && dragOverColumnId === col.id 
                    ? 'bg-pink-50/40 border-pink-200 shadow-md scale-[1.01]' 
                    : 'bg-slate-200/40 border-slate-200/50'
                }`}
              >
                <div className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-6 rounded-full bg-pink-500"></div>
                    <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-600">{col.label}</h3>
                  </div>
                  <span className="bg-white/80 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-black shadow-sm border border-slate-100">{colTasks.length}</span>
                </div>
                
                <div className="px-3 pb-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                  {/* Empty Column Drop Target Placeholder or Column Top Target Placeholder */}
                  {draggedTaskId && dragOverColumnId === col.id && (dragOverTaskId === null || colTasks.length === 0) && (
                    <div className="border-2 border-dashed border-pink-300 bg-pink-50/30 rounded-[32px] p-5 h-28 flex flex-col items-center justify-center text-pink-500 gap-1 transition-all duration-200 animate-pulse select-none">
                      <span className="text-[10px] uppercase tracking-[0.2em] font-black">Mover para o topo</span>
                    </div>
                  )}

                  {colTasks.map(task => {
                    const isOverThisTask = draggedTaskId && dragOverTaskId === task.id && draggedTaskId !== task.id;
                    
                    return (
                      <React.Fragment key={task.id}>
                        {isOverThisTask && (
                          <div className="border-2 border-dashed border-pink-300 bg-pink-50/30 rounded-[32px] p-5 h-28 flex flex-col items-center justify-center text-pink-500 gap-1 transition-all duration-200 animate-pulse select-none">
                            <span className="text-[10px] uppercase tracking-[0.2em] font-black">Posicionar aqui</span>
                          </div>
                        )}
                        <div 
                          id={`task-${task.id}`}
                          draggable 
                          onDragStart={e => setDraggedTaskId(task.id)}
                          onDragEnd={() => {
                            setDraggedTaskId(null);
                            setDragOverColumnId(null);
                            setDragOverTaskId(null);
                          }}
                          onClick={() => setSelectedTask(task)}
                          onDragOver={e => {
                            if (draggedTaskId === task.id) return;
                            e.preventDefault();
                            e.stopPropagation();
                            if (dragOverTaskId !== task.id) {
                              setDragOverTaskId(task.id);
                            }
                            if (dragOverColumnId !== col.id) {
                              setDragOverColumnId(col.id);
                            }
                          }}
                          onDrop={e => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (!draggedTaskId || draggedTaskId === task.id) return;
                            handleDropOnTask(draggedTaskId, task.id);
                          }}
                          className={`bg-white rounded-[32px] shadow-sm border-2 cursor-grab active:cursor-grabbing transition-all group hover:shadow-premium-hover overflow-hidden flex flex-col ${
                            task.isTracking 
                              ? 'border-pink-500 shadow-lg shadow-pink-500/10 ring-4 ring-pink-500/5' 
                              : 'border-white hover:border-pink-200'
                          }`}
                        >
                          {/* CAPA SANGRE: SEM PADDING E SEM MARGEM */}
                          {task.coverType === 'color' && (
                            <div className="h-20 w-full border-b border-slate-100 transition-transform group-hover:scale-105 duration-500" style={{ backgroundColor: task.coverValue || '#cbd5e1' }} />
                          )}
                          {task.coverType === 'image' && task.coverValue && (
                            <img src={task.coverValue} className="h-24 w-full object-cover border-b border-slate-100 transition-transform group-hover:scale-105 duration-500" alt="Capa" />
                          )}

                          <div className="p-6">
                            <div className="flex justify-between items-start mb-4">
                              <div className="flex gap-1.5 flex-wrap items-center">
                                <span className={`text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${
                                  task.priority === 'HIGH' ? 'bg-red-50 text-red-600 border border-red-100' : 
                                  task.priority === 'MEDIUM' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 
                                  'bg-slate-50 text-slate-500 border border-slate-100'
                                }`}>
                                  {task.priority === 'HIGH' ? 'ALTA' : task.priority === 'MEDIUM' ? 'MÉDIA' : 'BAIXA'}
                                </span>
                                {task.isTracking && <TaskTimerBadge task={task} />}
                                {(() => {
                                  if (!task.dueDate || task.status === 'DONE') return null;
                                  try {
                                    const d = new Date(task.dueDate);
                                    if (isNaN(d.getTime())) return null;
                                    const now = new Date();
                                    const diffMs = d.getTime() - now.getTime();
                                    const diffHours = diffMs / (1000 * 60 * 60);
                                    if (diffMs < 0) {
                                      return <span className="text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest bg-red-100 text-red-700 border border-red-200">Atrasada</span>;
                                    } else if (diffHours <= 24) {
                                      return <span className="text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest bg-amber-100 text-amber-700 border border-amber-200">Vence Hoje</span>;
                                    } else if (diffHours <= 72) {
                                      return <span className="text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest bg-blue-100 text-blue-700 border border-blue-200">Em Breve</span>;
                                    }
                                  } catch (e) {}
                                  return null;
                                })()}
                              </div>
                              <div className="flex -space-x-2 transition-transform group-hover:translate-x-1">
                                {Array.from(new Set(task.assigneeIds || [])).slice(0, 3).map((id, idx) => (
                                  <img key={`${id}-${idx}`} src={users.find(u => u.id === id)?.avatar || undefined} className="w-7 h-7 rounded-xl border-2 border-white shadow-sm object-cover" />
                                ))}
                              </div>
                            </div>
                            <h4 className="text-[13px] font-bold text-slate-700 leading-tight group-hover:text-pink-600 transition-colors line-clamp-2 tracking-tight">{task.title}</h4>
                            {task.dueDate && (
                              <div className={`flex items-center gap-1.5 mt-3 text-[10px] font-bold ${(() => {
                                if (task.status === 'DONE') return 'text-slate-400';
                                try {
                                  const d = new Date(task.dueDate);
                                  if (isNaN(d.getTime())) return 'text-slate-500';
                                  const diffMs = d.getTime() - Date.now();
                                  if (diffMs < 0) return 'text-red-600 animate-pulse';
                                  if (diffMs / (1000 * 60 * 60) <= 24) return 'text-amber-600';
                                  if (diffMs / (1000 * 60 * 60) <= 72) return 'text-blue-600';
                                } catch (e) {}
                                return 'text-slate-500';
                              })()}`}>
                                <Calendar size={12} className="shrink-0" />
                                <span>
                                  {(() => {
                                    try {
                                      const d = new Date(task.dueDate);
                                      if (isNaN(d.getTime())) return task.dueDate;
                                      const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' };
                                      return d.toLocaleString('pt-BR', options);
                                    } catch (e) {
                                      return task.dueDate;
                                    }
                                  })()}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                  
                  <button onClick={() => setSelectedTask({ id: Date.now().toString(), title: '', description: '', status: col.id, priority: 'MEDIUM', dueDate: '', timeLogs: [], assigneeIds: [currentUser.id], checklists: [], comments: [], history: [], estimatedTime: 0, isTracking: false, createdAt: Date.now() } as Task)} className="w-full py-4 border-2 border-dashed border-slate-300/50 rounded-[32px] text-slate-400 hover:text-pink-500 hover:border-pink-200 transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest bg-white/30"><Plus size={16}/> ADICIONAR</button>
                </div>
              </div>
            );
          })}
          {isAdmin && (<button onClick={() => { setEditingColumn({ label: '', color: 'border-slate-400', wipLimit: null }); setIsColumnModalOpen(true); }} className="flex-shrink-0 w-80 h-20 bg-white/30 border-2 border-dashed border-slate-300 rounded-[32px] flex items-center justify-center gap-3 text-slate-400 font-black uppercase text-xs tracking-widest hover:bg-white hover:text-slate-600 transition-all group"><Plus size={20} /> NOVA LISTA</button>)}
        </div>
      </main>

      {/* MODALS */}
      {isColumnModalOpen && (
          <div className="fixed inset-0 bg-black/10 z-[99999] flex items-center justify-center p-4 transition-all duration-300" onClick={() => setIsColumnModalOpen(false)}>
              <div className="bg-white rounded-[32px] w-full max-w-sm p-8 shadow-2xl animate-pop border border-slate-200" onClick={e => e.stopPropagation()}>
                  <h3 className="text-xl font-black mb-6 text-slate-800 uppercase tracking-tighter">Configurar Coluna</h3>
                  <div className="space-y-4">
                    <input className="w-full border-2 border-slate-100 rounded-2xl p-4 text-sm font-bold outline-none focus:border-pink-500 transition-all bg-slate-50" value={editingColumn?.label || ''} onChange={e => setEditingColumn({...editingColumn, label: e.target.value})} placeholder="Título da Coluna" />
                    <button onClick={handleSaveColumn} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase shadow-xl hover:bg-slate-800 transition-all">Salvar Alterações</button>
                  </div>
              </div>
          </div>
      )}

      {showArchivedColumns && (
          <div className="fixed inset-0 bg-black/10 z-[99999] flex items-center justify-center p-4 transition-all duration-300" onClick={() => setShowArchivedColumns(false)}>
              <div className="bg-white rounded-[32px] w-full max-w-md p-8 shadow-2xl animate-pop border border-slate-200" onClick={e => e.stopPropagation()}>
                  <h3 className="text-xl font-black mb-6 uppercase tracking-tighter">Listas Arquivadas</h3>
                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2 custom-scrollbar">
                      {archivedColumns.map(col => (
                          <div key={col.id} className="flex items-center justify-between p-4 border border-slate-100 rounded-2xl bg-slate-50">
                              <span className="font-bold text-slate-700">{col.label}</span>
                              <button onClick={() => setColumns(prev => prev.map(c => c.id === col.id ? {...c, isArchived: false} : c))} className="text-pink-600 font-black text-[10px] uppercase bg-white px-3 py-1.5 rounded-lg shadow-sm border">Reativar</button>
                          </div>
                      ))}
                      {archivedColumns.length === 0 && <p className="text-center text-slate-400 py-10 font-bold uppercase text-xs">Nenhuma lista arquivada.</p>}
                  </div>
                  <button onClick={() => setShowArchivedColumns(false)} className="w-full mt-6 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-xs">Fechar</button>
              </div>
          </div>
      )}

      {selectedTask && (
        <TaskModal 
            task={selectedTask} 
            users={users} 
            onClose={() => setSelectedTask(null)} 
            onUpdate={handleUpdateTask} 
            onDeleteTask={(id) => { 
                if (onDeleteTask) {
                    onDeleteTask(id);
                } else {
                    setTasks(prev => prev.filter(t => t.id !== id));
                }
                setSelectedTask(null); 
            }} 
            currentUser={currentUser} 
            openConfirm={openConfirm}
            clients={clients}
            addNotification={addNotification}
        />
      )}
    </div>
  );
};
