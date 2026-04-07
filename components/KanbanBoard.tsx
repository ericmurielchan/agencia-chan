
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Task, User, ColumnConfig, Notification, ConfirmOptions, Client } from '../types';
import { 
    Plus, Archive, Settings, X, Search, Bell, Layers, Menu
} from 'lucide-react';
import { TaskModal } from './TaskModal';
import confetti from 'canvas-confetti';

interface KanbanBoardProps {
  tasks: Task[];
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
  users: User[];
  currentUser: User;
  columns: ColumnConfig[];
  setColumns: React.Dispatch<React.SetStateAction<ColumnConfig[]>>;
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
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
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({ 
  tasks, setTasks, users, currentUser, columns, setColumns, notifications, setNotifications, openConfirm,
  sidebarOpen, sidebarCompact, isMobile, clients, selectedTaskId, onClearSelectedTask, initialFilter, onClearFilter, onNavigate
}) => {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [showArchivedColumns, setShowArchivedColumns] = useState(false);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [isColumnModalOpen, setIsColumnModalOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<Partial<ColumnConfig> | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<any>(null);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const isAdmin = currentUser.role === 'ADMIN';
  const activeColumns = useMemo(() => columns.filter(c => !c.isArchived).sort((a,b) => a.order - b.order), [columns]);
  const archivedColumns = useMemo(() => columns.filter(c => c.isArchived).sort((a,b) => a.order - b.order), [columns]);
  
  const unreadCount = notifications.filter(n => n.status === 'UNREAD').length;

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
      if (task && task.status !== targetColId) {
          const now = Date.now();
          setTasks(prev => prev.map(t => t.id === draggedTaskId ? { 
              ...t, 
              status: targetColId,
              completedAt: targetColId === 'DONE' ? now : (t.status === 'DONE' ? undefined : t.completedAt)
          } : t));
          
          if (targetColId === 'DONE') {
              confetti({
                  particleCount: 150,
                  spread: 70,
                  origin: { y: 0.6 }
              });
          }
      }
      setDraggedTaskId(null);
  };

  const sidebarWidth = isMobile ? '0px' : (sidebarOpen ? (sidebarCompact ? '80px' : '256px') : '0px');

  const handleUpdateTask = (updatedTask: Task) => {
    setTasks(prev => {
      const exists = prev.some(t => t.id === updatedTask.id);
      if (exists) {
        return prev.map(t => t.id === updatedTask.id ? updatedTask : t);
      } else {
        return [...prev, updatedTask];
      }
    });
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
                    onClick={() => setNotifications(prev => prev.map(n => ({...n, status: 'READ'})))}
                    className="text-[9px] font-black uppercase tracking-widest text-pink-600 hover:text-pink-700"
                  >
                    Limpar
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto custom-scrollbar">
                  {notifications.length > 0 ? (
                    <div className="divide-y divide-slate-50">
                      {notifications.sort((a, b) => b.timestamp - a.timestamp).map(notif => (
                        <button 
                          key={notif.id} 
                          onClick={() => {
                            setNotifications(prev => prev.map(n => n.id === notif.id ? {...n, status: 'READ'} : n));
                            if (notif.navToView === 'kanban' && notif.metadata?.referenceId) {
                              const task = tasks.find(t => t.id === notif.metadata?.referenceId);
                              if (task) setSelectedTask(task);
                            } else if (notif.navToView && onNavigate) {
                              onNavigate(notif.navToView, notif.metadata?.referenceId);
                            }
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
              <img src={currentUser.avatar} alt="Perfil" className="w-full h-full object-cover" />
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

      <main className="flex-1 overflow-x-auto overflow-y-hidden custom-scrollbar">
        <div className="inline-flex h-full p-6 gap-6 items-start">
          {activeColumns.map(col => {
            const colTasks = tasks.filter(t => {
              const matchesStatus = t.status === col.id;
              const matchesArchived = showArchived ? t.archived : !t.archived;
              const matchesSearch = t.title.toLowerCase().includes(searchTerm.toLowerCase());
              
              let matchesFilter = true;
              if (activeFilter) {
                if (activeFilter.status && t.status !== activeFilter.status) matchesFilter = false;
                if (activeFilter.overdue) {
                  const today = new Date().toISOString().split('T')[0];
                  if (!(t.dueDate < today && t.status !== 'DONE' && !t.archived)) matchesFilter = false;
                }
                if (activeFilter.inProgress) {
                  if (!(t.status !== 'BACKLOG' && t.status !== 'DONE' && !t.archived)) matchesFilter = false;
                }
                if (activeFilter.pending) {
                  if (t.status !== 'BACKLOG') matchesFilter = false;
                }
              }

              return matchesStatus && matchesArchived && matchesSearch && matchesFilter;
            });
            return (
              <div key={col.id} onDragOver={e => e.preventDefault()} onDrop={e => handleDropTask(e, col.id)} className="flex-shrink-0 w-80 flex flex-col max-h-full rounded-[32px] bg-slate-200/40 border border-slate-200/50">
                <div className="p-5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-6 rounded-full bg-pink-500"></div>
                    <h3 className="font-black text-[11px] uppercase tracking-widest text-slate-600">{col.label}</h3>
                  </div>
                  <span className="bg-white/80 text-slate-500 text-[10px] px-2 py-0.5 rounded-full font-black shadow-sm border border-slate-100">{colTasks.length}</span>
                </div>
                
                <div className="px-3 pb-5 space-y-4 overflow-y-auto custom-scrollbar flex-1">
                  {colTasks.map(task => (
                    <div 
                      key={task.id} 
                      id={`task-${task.id}`}
                      draggable 
                      onDragStart={e => setDraggedTaskId(task.id)}
                      onClick={() => setSelectedTask(task)}
                      className="bg-white rounded-[32px] shadow-sm border-2 border-white hover:border-pink-200 cursor-grab active:cursor-grabbing transition-all group hover:shadow-premium-hover overflow-hidden flex flex-col"
                    >
                      {/* CAPA SANGRE: SEM PADDING E SEM MARGEM */}
                      {task.coverType === 'color' && (
                        <div className="h-20 w-full border-b border-slate-100 transition-transform group-hover:scale-105 duration-500" style={{ backgroundColor: task.coverValue || '#cbd5e1' }} />
                      )}
                      {task.coverType === 'image' && (
                        <img src={task.coverValue || ''} className="h-24 w-full object-cover border-b border-slate-100 transition-transform group-hover:scale-105 duration-500" alt="Capa" />
                      )}

                      <div className="p-6">
                        <div className="flex justify-between items-start mb-4">
                          <span className={`text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${task.priority === 'HIGH' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'}`}>{task.priority}</span>
                          <div className="flex -space-x-2 transition-transform group-hover:translate-x-1">
                            {task.assigneeIds.slice(0, 3).map(id => (
                              <img key={id} src={users.find(u => u.id === id)?.avatar} className="w-7 h-7 rounded-xl border-2 border-white shadow-sm object-cover" />
                            ))}
                          </div>
                        </div>
                        <h4 className="text-[13px] font-bold text-slate-700 leading-tight group-hover:text-pink-600 transition-colors line-clamp-2 tracking-tight">{task.title}</h4>
                      </div>
                    </div>
                  ))}
                  
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
            onDeleteTask={(id) => { setTasks(prev => prev.filter(t => t.id !== id)); setSelectedTask(null); }} 
            currentUser={currentUser} 
            openConfirm={openConfirm}
            clients={clients}
        />
      )}
    </div>
  );
};
