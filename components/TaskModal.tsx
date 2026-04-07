
import React, { useState, useRef, useEffect } from 'react';
import { Modal } from './Modal';
import { Task, User, Comment, ChecklistItem, HistoryLog, TimeLog, ConfirmOptions, Client } from '../types';
import { 
    Clock, Plus, CheckCircle, X, Trash2, Archive, Image as ImageIcon, 
    CheckSquare, Users, Layout, Upload, Check, Activity, Play, Pause, 
    Calendar, Save, Palette, Camera, Trash, MoreHorizontal, MessageCircle,
    UserPlus, Hash, AlignLeft, Info, History, User as UserIcon, AtSign, Building2
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TaskModalProps {
    task: Task;
    users: User[];
    onClose: () => void;
    onUpdate: (t: Task) => void;
    onDeleteTask: (id: string) => void;
    currentUser: User;
    openConfirm: (options: ConfirmOptions) => Promise<boolean>;
    clients: Client[];
}

const PRESET_COLORS = ['#db2777', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#0f172a', '#64748b', '#ec4899', '#6366f1'];

export const TaskModal: React.FC<TaskModalProps> = ({ task, users, onClose, onUpdate, onDeleteTask, currentUser, openConfirm, clients }) => {
    const [localTitle, setLocalTitle] = useState(task.title);
    const [localDesc, setLocalDesc] = useState(task.description);
    const [newChecklistText, setNewChecklistText] = useState('');
    const [newComment, setNewComment] = useState('');
    const [activePopover, setActivePopover] = useState<'MEMBERS' | 'COVERS' | string | null>(null);
    const [isEditingDesc, setIsEditingDesc] = useState(false);
    const [secondsElapsed, setSecondsElapsed] = useState(0);
    const [activeTab, setActiveTab] = useState<'CHAT' | 'HISTORY'>('CHAT');

    // Estados para Menção
    const [mentionSearch, setMentionSearch] = useState('');
    const [showMentionFor, setShowMentionFor] = useState<'DESC' | 'CHAT' | null>(null);

    const popoverRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const descTextareaRef = useRef<HTMLTextAreaElement>(null);
    const chatTextareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        let interval: any;
        if (task.isTracking) {
            interval = setInterval(() => {
                const activeLog = task.timeLogs.find(l => !l.endTime);
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

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
                setActivePopover(null);
                setShowMentionFor(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleTextChangeWithMention = (
        text: string, 
        setter: (v: string) => void, 
        type: 'DESC' | 'CHAT',
        cursorPos: number
    ) => {
        setter(text);
        
        // Pega o texto antes do cursor para ver se termina com @ ou @filtro
        const textBeforeCursor = text.slice(0, cursorPos);
        const mentionMatch = textBeforeCursor.match(/@(\w*)$/);

        if (mentionMatch) {
            setMentionSearch(mentionMatch[1].toLowerCase());
            setShowMentionFor(type);
        } else {
            setShowMentionFor(null);
        }
    };

    const insertMention = (user: User, type: 'DESC' | 'CHAT') => {
        const setter = type === 'DESC' ? setLocalDesc : setNewComment;
        const currentText = type === 'DESC' ? localDesc : newComment;
        const ref = type === 'DESC' ? descTextareaRef : chatTextareaRef;
        
        if (!ref.current) return;

        const cursorPos = ref.current.selectionStart;
        const textBefore = currentText.slice(0, cursorPos);
        const textAfter = currentText.slice(cursorPos);
        
        // Substitui o @filtro pelo nome do usuário
        const newTextBefore = textBefore.replace(/@(\w*)$/, `@${user.name} `);
        setter(newTextBefore + textAfter);
        setShowMentionFor(null);
        
        // Devolve o foco
        setTimeout(() => ref.current?.focus(), 0);
    };

    const filteredMentionUsers = users.filter(u => 
        u.role !== 'CLIENT' && 
        u.name.toLowerCase().includes(mentionSearch)
    );

    const formatSeconds = (totalSeconds: number) => {
        const h = Math.floor(totalSeconds / 3600);
        const m = Math.floor((totalSeconds % 3600) / 60);
        const s = totalSeconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const getAccumulatedSeconds = () => {
        const closed = task.timeLogs.reduce((acc, log) => acc + (log.duration || 0), 0);
        return closed + secondsElapsed;
    };

    const createLog = (action: string): HistoryLog => ({
        id: Date.now().toString(),
        action,
        userId: currentUser.id,
        timestamp: Date.now()
    });

    const updateWithLog = (updatedProps: Partial<Task>, action: string | null) => {
        const updatedTask = { ...task, ...updatedProps };
        if (action) {
            updatedTask.history = [...task.history, createLog(action)];
        }
        onUpdate(updatedTask);
    };

    const handleToggleTimer = () => {
        const now = Date.now();
        if (task.isTracking) {
            const updatedLogs = task.timeLogs.map(log => {
                if (!log.endTime) {
                    return { ...log, endTime: now, duration: Math.floor((now - log.startTime) / 1000) };
                }
                return log;
            });
            updateWithLog({ isTracking: false, timeLogs: updatedLogs }, 'pausou o cronômetro');
        } else {
            const newLog: TimeLog = { userId: currentUser.id, startTime: now, duration: 0 };
            updateWithLog({ isTracking: true, status: 'IN_PROGRESS', timeLogs: [...task.timeLogs, newLog] }, 'iniciou produção');
        }
    };

    const handleAddChecklist = () => {
        if (!newChecklistText.trim()) return;
        const newItem: ChecklistItem = { id: Date.now().toString(), text: newChecklistText, isCompleted: false };
        updateWithLog({ checklists: [...task.checklists, newItem] }, `adicionou sub-tarefa: ${newChecklistText}`);
        setNewChecklistText('');
    };

    const handleUpdateChecklistItem = (itemId: string, updates: Partial<ChecklistItem>) => {
        const updatedChecklists = task.checklists.map(c => c.id === itemId ? { ...c, ...updates } : c);
        onUpdate({ ...task, checklists: updatedChecklists });
    };

    const handleAddComment = () => {
        if (!newComment.trim()) return;
        const comment: Comment = { id: Date.now().toString(), userId: currentUser.id, text: newComment, timestamp: Date.now() };
        onUpdate({ ...task, comments: [...task.comments, comment] });
        setNewComment('');
    };

    const checklistProgress = task.checklists.length > 0 
        ? Math.round((task.checklists.filter(c => c.isCompleted).length / task.checklists.length) * 100) 
        : 0;

    return (
        <Modal 
            isOpen={true} 
            onClose={onClose} 
            maxWidth="896px" 
            hideHeader={true} 
            noPadding={true} 
            scrollable={true}
        >
            <div className="flex flex-col h-full">
                
                {/* --- HEADER / CAPA (FIXO NO TOPO) --- */}
                <div className={`w-full h-36 shrink-0 relative transition-all duration-500 flex items-center justify-center ${!task.coverType ? 'bg-slate-100' : ''}`} style={{ backgroundColor: task.coverType === 'color' ? task.coverValue! : undefined }}>
                    {task.coverType === 'image' && <img src={task.coverValue!} alt="Capa" className="w-full h-full object-cover" />}
                    <button onClick={() => setActivePopover('COVERS')} className="absolute bottom-4 right-4 bg-white/95 hover:bg-white text-slate-800 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] shadow-xl flex items-center gap-2 transition-all hover:scale-105 active:scale-95">
                        <Palette size={14} className="text-pink-600"/> {task.coverType ? 'Mudar Capa' : 'Add Capa'}
                    </button>
                    <button onClick={onClose} className="absolute top-4 right-4 p-2 bg-black/10 hover:bg-black/20 rounded-full transition-colors text-white backdrop-blur-md"><X size={18}/></button>
                </div>

                {/* --- CORPO DO MODAL (SCROLLABLE) --- */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-5 md:p-8">
                    <div className="flex flex-col md:flex-row gap-8">
                        {/* --- COLUNA PRINCIPAL (ESQUERDA) --- */}
                        <div className="flex-1 space-y-8">
                        {/* Título */}
                        <div className="flex gap-4">
                            <div className="p-2.5 bg-slate-100 rounded-xl text-slate-400 h-fit"><Layout size={20}/></div>
                            <div className="flex-1">
                                <input className="w-full text-2xl font-black text-slate-800 bg-transparent border-none focus:ring-0 p-0 outline-none placeholder:text-slate-200 tracking-tight" value={localTitle} onChange={e => setLocalTitle(e.target.value)} onBlur={() => updateWithLog({ title: localTitle }, 'alterou o título')} placeholder="Nome da Tarefa..."/>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Status:</span>
                                    <span className="text-[9px] font-black text-pink-600 bg-pink-50 px-2.5 py-0.5 rounded-lg uppercase tracking-widest">{task.status}</span>
                                </div>
                            </div>
                        </div>

                        {/* Metadados */}
                        <div className="ml-14 flex flex-wrap gap-8">
                            {task.assigneeIds.length > 0 && (
                                <div>
                                    <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Membros</h4>
                                    <div className="flex -space-x-2.5">
                                        {task.assigneeIds.map(id => {
                                            const u = users.find(user => user.id === id);
                                            return <img key={id} src={u?.avatar} title={u?.name} className="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover hover:translate-y-[-2px] transition-transform cursor-pointer" />;
                                        })}
                                        <button onClick={() => setActivePopover('MEMBERS')} className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-colors shadow-sm"><Plus size={14}/></button>
                                    </div>
                                </div>
                            )}
                            <div>
                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Cliente</h4>
                                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
                                    <Building2 size={14} className="text-slate-400"/>
                                    <select 
                                        className="bg-transparent text-[11px] font-black text-slate-700 outline-none appearance-none cursor-pointer" 
                                        value={task.clientId || ''} 
                                        onChange={e => updateWithLog({ clientId: e.target.value }, 'vinculou a um cliente')}
                                    >
                                        <option value="">Sem Cliente</option>
                                        {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div>
                                <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Entrega</h4>
                                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 px-3 py-1.5 rounded-xl">
                                    <Calendar size={14} className="text-slate-400"/>
                                    <input type="date" className="bg-transparent text-[11px] font-black text-slate-700 outline-none" value={task.dueDate} onChange={e => updateWithLog({ dueDate: e.target.value }, 'alterou o prazo')}/>
                                </div>
                            </div>
                        </div>

                        {/* Descrição / Briefing com MENÇÃO */}
                        <div className="flex gap-4">
                            <div className="p-2.5 bg-slate-100 rounded-xl text-slate-400 h-fit"><AlignLeft size={20}/></div>
                            <div className="flex-1 relative">
                                <h3 className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em] mb-3">Briefing Detalhado</h3>
                                {isEditingDesc ? (
                                    <div className="space-y-3 animate-pop">
                                        <div className="relative">
                                            <textarea 
                                                ref={descTextareaRef}
                                                className="w-full min-h-[120px] bg-slate-50 border-2 border-slate-200 rounded-2xl p-4 text-xs font-medium outline-none focus:border-pink-500 focus:bg-white transition-all shadow-inner"
                                                value={localDesc}
                                                onChange={e => handleTextChangeWithMention(e.target.value, setLocalDesc, 'DESC', e.target.selectionStart)}
                                                autoFocus
                                                placeholder="Detalhe o briefing (use @ para citar)..."
                                            />
                                            {showMentionFor === 'DESC' && (
                                                <div className="absolute top-full left-0 z-[11005] mt-1 w-64 bg-white rounded-xl shadow-2xl border border-slate-100 p-2 animate-pop">
                                                    <p className="text-[8px] font-black text-slate-400 uppercase p-2 border-b">Citar Colaborador</p>
                                                    <div className="max-h-48 overflow-y-auto custom-scrollbar mt-1">
                                                        {filteredMentionUsers.map(u => (
                                                            <button key={u.id} onClick={() => insertMention(u, 'DESC')} className="w-full flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg text-left transition-colors">
                                                                <img src={u.avatar} className="w-6 h-6 rounded-full object-cover border" />
                                                                <span className="text-[10px] font-bold text-slate-700">{u.name}</span>
                                                            </button>
                                                        ))}
                                                        {filteredMentionUsers.length === 0 && <p className="p-3 text-[10px] text-slate-400 italic">Nenhum membro encontrado</p>}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => { updateWithLog({ description: localDesc }, 'atualizou o briefing'); setIsEditingDesc(false); }} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl shadow-slate-200">Salvar</button>
                                            <button onClick={() => { setLocalDesc(task.description); setIsEditingDesc(false); }} className="px-4 py-2 text-slate-400 font-bold text-[9px] uppercase tracking-widest hover:text-slate-600 transition-colors">Cancelar</button>
                                        </div>
                                    </div>
                                ) : (
                                    <div onClick={() => setIsEditingDesc(true)} className="bg-slate-50/50 hover:bg-slate-100 rounded-2xl p-4 text-xs text-slate-600 leading-relaxed cursor-text min-h-[80px] border-2 border-transparent hover:border-slate-200 transition-all whitespace-pre-wrap font-medium shadow-sm">
                                        {localDesc || "Adicione instruções (use @ para citar alguém)..."}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Checklist */}
                        <div className="flex gap-4">
                            <div className="p-2.5 bg-slate-100 rounded-xl text-slate-400 h-fit"><CheckSquare size={20}/></div>
                            <div className="flex-1">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-black text-[10px] text-slate-400 uppercase tracking-[0.2em]">Checklist de Etapas</h3>
                                    <span className="text-[9px] font-black text-pink-600 bg-pink-50 px-2.5 py-0.5 rounded-full">{checklistProgress}%</span>
                                </div>
                                <div className="w-full bg-slate-100 h-2 rounded-full mb-6 overflow-hidden border border-white shadow-inner">
                                    <div className="h-full bg-gradient-to-r from-pink-500 to-pink-600 transition-all duration-1000 ease-out" style={{ width: `${checklistProgress}%` }} />
                                </div>
                                <div className="space-y-2 mb-6">
                                    {task.checklists.map(item => {
                                        const assignee = users.find(u => u.id === item.assigneeId);
                                        return (
                                            <div key={item.id} className="flex flex-col gap-2 group bg-slate-50/50 hover:bg-white p-3 rounded-2xl border border-transparent hover:border-slate-100 transition-all shadow-sm">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative flex items-center justify-center shrink-0">
                                                        <input type="checkbox" checked={item.isCompleted} onChange={() => {
                                                            const updated = task.checklists.map(c => c.id === item.id ? { ...c, isCompleted: !c.isCompleted } : c);
                                                            onUpdate({ ...task, checklists: updated });
                                                            if (!item.isCompleted && updated.every(u => u.isCompleted)) confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } });
                                                        }} className="w-5 h-5 rounded-lg border-2 border-slate-200 text-pink-600 focus:ring-pink-500/20 cursor-pointer appearance-none checked:bg-pink-600 checked:border-pink-600 transition-all"/>
                                                        {item.isCompleted && <Check size={12} className="absolute text-white pointer-events-none" strokeWidth={4}/>}
                                                    </div>
                                                    <span className={`text-xs font-bold flex-1 transition-all ${item.isCompleted ? 'text-slate-300 line-through' : 'text-slate-700'}`}>{item.text}</span>
                                                    <button onClick={() => updateWithLog({ checklists: task.checklists.filter(c => c.id !== item.id) }, `removeu: ${item.text}`)} className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all p-1 hover:bg-red-50 rounded-lg"><Trash2 size={14}/></button>
                                                </div>
                                                <div className="ml-8 flex items-center gap-4">
                                                    <div className="flex items-center gap-1.5 bg-white/50 px-2 py-1 rounded-lg border border-slate-100 relative group/date">
                                                        <Calendar size={10} className="text-slate-300"/>
                                                        <input type="date" className="bg-transparent text-[9px] font-bold text-slate-500 outline-none w-20" value={item.dueDate || ''} onChange={(e) => handleUpdateChecklistItem(item.id, { dueDate: e.target.value })}/>
                                                    </div>
                                                    <div className="relative">
                                                        <button onClick={() => setActivePopover(`CHECKLIST_USER_${item.id}`)} className="flex items-center gap-1.5 bg-white/50 px-2 py-1 rounded-lg border border-slate-100 hover:bg-indigo-50 transition-all">
                                                            {assignee ? <img src={assignee.avatar} className="w-3.5 h-3.5 rounded-full object-cover" /> : <UserPlus size={10} className="text-slate-300"/>}
                                                            <span className="text-[9px] font-bold text-slate-500">{assignee ? assignee.name.split(' ')[0] : 'Atribuir'}</span>
                                                        </button>
                                                        {activePopover === `CHECKLIST_USER_${item.id}` && (
                                                            <div ref={popoverRef} className="absolute left-0 bottom-full mb-2 w-48 bg-white rounded-xl shadow-2xl border border-slate-100 p-2 z-[11001] animate-pop">
                                                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-2 mb-2">Responsável Etapa</p>
                                                                <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar mt-1">
                                                                    {users.filter(u => u.role !== 'CLIENT').map(u => (
                                                                        <button key={u.id} onClick={() => { handleUpdateChecklistItem(item.id, { assigneeId: item.assigneeId === u.id ? undefined : u.id }); setActivePopover(null); }} className={`w-full flex items-center gap-2 p-1.5 rounded-lg text-[10px] font-bold transition-all ${item.assigneeId === u.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-500'}`}>
                                                                            <img src={u.avatar} className="w-4 h-4 rounded-full object-cover" /> {u.name}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex gap-2">
                                    <input className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-[11px] font-bold outline-none focus:border-pink-500 focus:bg-white transition-all shadow-inner" placeholder="Add nova sub-tarefa..." value={newChecklistText} onChange={e => setNewChecklistText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddChecklist()}/>
                                    <button onClick={handleAddChecklist} className="bg-slate-900 hover:bg-slate-800 text-white px-4 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95">Add</button>
                                </div>
                            </div>
                        </div>

                        {/* Sessão Dupla: Chat vs Histórico com MENÇÃO no Chat */}
                        <div className="flex gap-4 border-t border-slate-50 pt-8">
                            <div className="p-2.5 bg-slate-100 rounded-xl text-slate-400 h-fit">{activeTab === 'CHAT' ? <MessageCircle size={20}/> : <History size={20}/>}</div>
                            <div className="flex-1 space-y-6">
                                <div className="flex items-center gap-4 border-b border-slate-50">
                                    <button onClick={() => setActiveTab('CHAT')} className={`pb-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${activeTab === 'CHAT' ? 'text-pink-600 border-pink-600' : 'text-slate-300 border-transparent hover:text-slate-400'}`}>Chat</button>
                                    <button onClick={() => setActiveTab('HISTORY')} className={`pb-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all border-b-2 ${activeTab === 'HISTORY' ? 'text-pink-600 border-pink-600' : 'text-slate-300 border-transparent hover:text-slate-400'}`}>Logs</button>
                                </div>
                                
                                {activeTab === 'CHAT' ? (
                                    <div className="space-y-6 animate-pop">
                                        <div className="flex gap-3">
                                            <img src={currentUser.avatar} className="w-8 h-8 rounded-xl border shadow-sm object-cover" />
                                            <div className="flex-1 space-y-2 relative">
                                                <textarea 
                                                    ref={chatTextareaRef}
                                                    className="w-full bg-white border border-slate-200 rounded-2xl p-3 text-xs font-medium outline-none focus:border-pink-500 shadow-sm resize-none h-20 focus:shadow-md transition-all"
                                                    placeholder="Digite sua mensagem (use @)..."
                                                    value={newComment}
                                                    onChange={e => handleTextChangeWithMention(e.target.value, setNewComment, 'CHAT', e.target.selectionStart)}
                                                />
                                                {showMentionFor === 'CHAT' && (
                                                    <div className="absolute bottom-full left-0 z-[11005] mb-2 w-64 bg-white rounded-xl shadow-2xl border border-slate-100 p-2 animate-pop">
                                                        <div className="max-h-40 overflow-y-auto custom-scrollbar">
                                                            {filteredMentionUsers.map(u => (
                                                                <button key={u.id} onClick={() => insertMention(u, 'CHAT')} className="w-full flex items-center gap-2 p-2 hover:bg-slate-50 rounded-lg text-left transition-colors">
                                                                    <img src={u.avatar} className="w-5 h-5 rounded-full object-cover border" />
                                                                    <span className="text-[10px] font-bold text-slate-700">{u.name}</span>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                <button onClick={handleAddComment} className="px-5 py-2 bg-pink-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-pink-600/20 hover:bg-pink-700 hover:-translate-y-0.5 transition-all active:scale-95">Enviar</button>
                                            </div>
                                        </div>
                                        <div className="space-y-6 pt-2">
                                            {task.comments.sort((a,b) => b.timestamp - a.timestamp).map(comment => {
                                                const user = users.find(u => u.id === comment.userId);
                                                const isMe = comment.userId === currentUser.id;
                                                return (
                                                    <div key={comment.id} className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''} group`}>
                                                        <img src={user?.avatar} className="w-8 h-8 rounded-xl border shadow-sm shrink-0 object-cover" />
                                                        <div className={`flex-1 max-w-[85%] ${isMe ? 'text-right' : ''}`}>
                                                            <div className={`flex items-center gap-2 mb-1 ${isMe ? 'justify-end' : ''}`}>
                                                                <span className="font-black text-[9px] text-slate-700 uppercase">{user?.name}</span>
                                                                <span className="text-[8px] text-slate-300 font-bold">{new Date(comment.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                                            </div>
                                                            <div className={`text-xs p-3 rounded-2xl inline-block shadow-sm border ${isMe ? 'bg-slate-900 text-white border-slate-800 rounded-tr-none' : 'bg-slate-50 text-slate-700 border-slate-100 rounded-tl-none'}`}>
                                                                {comment.text.split(/(@\w+ \w+)/g).map((part, i) => 
                                                                    part.startsWith('@') ? <span key={i} className="text-pink-500 font-black">{part}</span> : part
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-4 animate-pop max-h-[300px] overflow-y-auto pr-3 custom-scrollbar">
                                        {task.history.sort((a,b) => b.timestamp - a.timestamp).map(log => {
                                            const user = users.find(u => u.id === log.userId);
                                            return (
                                                <div key={log.id} className="flex gap-3 items-start pl-1 relative before:absolute before:left-[1.1rem] before:top-6 before:bottom-[-1.2rem] before:w-px before:bg-slate-100 last:before:hidden">
                                                    <img src={user?.avatar} className="w-6 h-6 rounded-lg border-2 border-white shadow-sm shrink-0 relative z-10" />
                                                    <div className="pt-0.5">
                                                        <p className="text-[11px] text-slate-500"><span className="font-black text-slate-800 uppercase text-[9px] mr-1">{user?.name}</span> {log.action}</p>
                                                        <span className="text-[8px] text-slate-300 font-black uppercase tracking-widest">{new Date(log.timestamp).toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* --- SIDEBAR DE AÇÕES (DIREITA) --- */}
                    <div className="w-full md:w-[180px] space-y-8">
                        <div className={`p-5 rounded-[24px] transition-all duration-500 shadow-xl ${task.isTracking ? 'bg-slate-900 ring-[6px] ring-pink-500/10' : 'bg-white border border-slate-100'}`}>
                            <div className="flex items-center justify-between mb-3">
                                <p className={`text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 ${task.isTracking ? 'text-pink-500' : 'text-slate-400'}`}>
                                    <Clock size={12} className={task.isTracking ? 'animate-spin-slow' : ''}/> {task.isTracking ? 'Job Online' : 'Timer Off'}
                                </p>
                                {task.isTracking && <span className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-ping"></span>}
                            </div>
                            <h3 className={`text-2xl font-black font-mono tracking-tighter mb-4 ${task.isTracking ? 'text-white' : 'text-slate-800'}`}>{formatSeconds(getAccumulatedSeconds())}</h3>
                            <button onClick={handleToggleTimer} className={`w-full py-3 rounded-xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] transition-all shadow-xl active:scale-95 ${task.isTracking ? 'bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600' : 'bg-pink-600 text-white shadow-pink-600/30 hover:bg-pink-700'}`}>
                                {task.isTracking ? <Pause size={14} fill="currentColor"/> : <Play size={14} fill="currentColor"/>} {task.isTracking ? 'Pausar' : 'Iniciar'}
                            </button>
                        </div>
                        <div className="space-y-2">
                            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-3">Adicionar</h4>
                            <button onClick={() => setActivePopover('MEMBERS')} className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-white rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-600 transition-all border-2 border-transparent hover:border-slate-100 shadow-sm group">
                                <div className="p-1 bg-indigo-50 text-indigo-500 rounded group-hover:bg-indigo-500 group-hover:text-white transition-all"><UserPlus size={14}/></div> Membros
                            </button>
                            <button onClick={() => setActivePopover('COVERS')} className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-white rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-600 transition-all border-2 border-transparent hover:border-slate-100 shadow-sm group">
                                <div className="p-1 bg-pink-50 text-pink-500 rounded group-hover:bg-pink-500 group-hover:text-white transition-all"><Palette size={14}/></div> Alterar Capa
                            </button>
                        </div>
                        <div className="space-y-2 pt-4 border-t border-slate-50">
                            <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1 mb-3">Operações</h4>
                            <button onClick={() => updateWithLog({ archived: !task.archived }, task.archived ? 'reativou o job' : 'arquivou o job')} className="w-full flex items-center gap-3 p-3 bg-slate-50 hover:bg-white rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-600 transition-all border-2 border-transparent hover:border-slate-100 shadow-sm">
                                <Archive size={14} className="text-slate-400"/> {task.archived ? 'Reativar' : 'Arquivar'}
                            </button>
                            <button onClick={async () => {
                                const ok = await openConfirm({ title: "Excluir Definitivo?", description: "Esta ação apagará todos os dados desta tarefa permanentemente.", variant: "danger" });
                                if (ok) onDeleteTask(task.id);
                            }} className="w-full flex items-center gap-3 p-3 bg-red-50/50 hover:bg-red-500 hover:text-white rounded-xl text-[9px] font-black uppercase tracking-widest text-red-600 transition-all border-2 border-transparent shadow-sm group">
                                <Trash2 size={14} className="group-hover:text-white transition-colors"/> Excluir Job
                            </button>
                        </div>
                        <div className="pt-6 flex flex-col items-center">
                            {task.status !== 'DONE' && (
                                <button onClick={() => { updateWithLog({ status: 'DONE', isTracking: false, completedAt: Date.now() }, 'concluiu o job'); confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 } }); onClose(); }} className="w-full py-4 bg-emerald-600 text-white rounded-[20px] text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-emerald-200 hover:bg-emerald-700 hover:-translate-y-1 transition-all active:scale-95">Concluir</button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

                {/* --- POPOVERS SUPORTE --- */}
                {activePopover === 'COVERS' && (
                    <div ref={popoverRef} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 bg-white rounded-[32px] shadow-2xl border border-slate-100 p-6 animate-pop z-[11002]">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5 border-b pb-3">Cores</h5>
                        <div className="grid grid-cols-4 gap-4 mb-8">
                            {PRESET_COLORS.map(c => <button key={c} onClick={() => { updateWithLog({ coverType: 'color', coverValue: c }, 'mudou a cor da capa'); setActivePopover(null); }} className="w-10 h-10 rounded-xl border-4 border-white shadow-sm hover:scale-125 transition-transform" style={{ backgroundColor: c }}/>)}
                        </div>
                        <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-center gap-3 py-4 bg-slate-50 hover:bg-slate-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 border-2 border-dashed border-slate-200"><Camera size={18}/> Upload Foto</button>
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => { updateWithLog({ coverType: 'image', coverValue: reader.result as string }, 'subiu imagem de capa'); setActivePopover(null); };
                                reader.readAsDataURL(file);
                            }
                        }} />
                    </div>
                )}

                {activePopover === 'MEMBERS' && (
                    <div ref={popoverRef} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 bg-white rounded-[32px] shadow-2xl border border-slate-100 p-6 animate-pop z-[11002]">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5 border-b pb-3">Atribuir Membros</h5>
                        <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                            {users.filter(u => u.role !== 'CLIENT').map(u => (
                                <button key={u.id} onClick={() => {
                                    const current = task.assigneeIds;
                                    const newIds = current.includes(u.id) ? current.filter(id => id !== u.id) : [...current, u.id];
                                    updateWithLog({ assigneeIds: newIds }, current.includes(u.id) ? `removeu ${u.name}` : `atribuiu a tarefa para ${u.name}`);
                                }} className={`w-full flex items-center justify-between p-3 rounded-2xl transition-all border-2 ${task.assigneeIds.includes(u.id) ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'hover:bg-slate-50 text-slate-500 border-transparent'}`}>
                                    <div className="flex items-center gap-3"><img src={u.avatar} className="w-8 h-8 rounded-full object-cover border-2 border-white shadow-sm" /><span className="text-[11px] font-bold">{u.name}</span></div>
                                    {task.assigneeIds.includes(u.id) && <div className="bg-indigo-600 p-1 rounded-full text-white"><Check size={12} strokeWidth={4}/></div>}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </Modal>
    );
};
