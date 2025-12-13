
import React, { useState, useRef, useEffect } from 'react';
import { Task, User, Comment, ChecklistItem, HistoryLog } from '../types';
import { 
    Clock, Plus, CheckCircle, MessageSquare, 
    X, Trash2, Archive, Image as ImageIcon, Eye, 
    CheckSquare, Users, CreditCard, Layout, Upload, Check, Activity, AlertCircle 
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TaskModalProps {
    task: Task;
    users: User[];
    onClose: () => void;
    onUpdate: (t: Task) => void;
    currentUser: User;
}

export const TaskModal: React.FC<TaskModalProps> = ({ task, users, onClose, onUpdate, currentUser }) => {
    const [newComment, setNewComment] = useState('');
    const [mentionFilter, setMentionFilter] = useState('');
    const [showMentions, setShowMentions] = useState(false);
    const [newChecklistText, setNewChecklistText] = useState('');
    
    // Estados locais para edição de texto (para validação)
    const [localTitle, setLocalTitle] = useState(task.title);
    const [localDesc, setLocalDesc] = useState(task.description);

    const commentInputRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // Popovers
    const [activePopover, setActivePopover] = useState<string | null>(null);

    // Sync state if prop changes
    useEffect(() => {
        setLocalTitle(task.title);
        setLocalDesc(task.description);
    }, [task.id, task.title, task.description]);

    // --- Helpers for History ---
    const createLog = (action: string): HistoryLog => ({
        id: Date.now().toString(),
        action,
        userId: currentUser.id,
        timestamp: Date.now()
    });

    const updateWithLog = (updatedTaskProps: Partial<Task>, logAction: string) => {
        onUpdate({
            ...task,
            ...updatedTaskProps,
            history: [...task.history, createLog(logAction)]
        });
    };

    // --- Actions ---

    const markAsDone = () => {
        updateWithLog({ status: 'DONE' }, 'concluiu a tarefa');
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    };
    
    const saveTitle = () => {
        if (localTitle.trim() === '') return;
        if (localTitle !== task.title) {
            updateWithLog({ title: localTitle }, `alterou o título para "${localTitle}"`);
        }
    };
    
    const cancelTitle = () => {
        setLocalTitle(task.title);
    };

    const saveDesc = () => {
        if (localDesc !== task.description) {
            updateWithLog({ description: localDesc }, `atualizou a descrição`);
        }
    };

    const cancelDesc = () => {
        setLocalDesc(task.description);
    };

    // --- Checklist Logic ---
    const addChecklistItem = () => {
        if (newChecklistText.trim()) {
            const newItem: ChecklistItem = { 
                id: Date.now().toString(), 
                text: newChecklistText, 
                isCompleted: false,
                dueDate: new Date().toISOString().split('T')[0] 
            };
            const updatedChecklists = [...(task.checklists || []), newItem];
            updateWithLog({ checklists: updatedChecklists }, `adicionou item ao checklist: "${newChecklistText}"`);
            setNewChecklistText('');
        }
    };

    const toggleChecklist = (itemId: string) => {
        const item = task.checklists.find(c => c.id === itemId);
        if (!item) return;

        const newChecklists = task.checklists.map(c => c.id === itemId ? { ...c, isCompleted: !c.isCompleted } : c);
        
        if (!item.isCompleted) {
            updateWithLog({ checklists: newChecklists }, `concluiu o item "${item.text}"`);
        } else {
             onUpdate({...task, checklists: newChecklists});
        }
    };

    const updateChecklistDate = (itemId: string, date: string) => {
        const newChecklists = task.checklists.map(c => c.id === itemId ? { ...c, dueDate: date } : c);
        onUpdate({...task, checklists: newChecklists});
    };

    const deleteChecklistItem = (itemId: string) => {
        const item = task.checklists.find(c => c.id === itemId);
        updateWithLog(
            { checklists: task.checklists.filter(c => c.id !== itemId) }, 
            `removeu o item "${item?.text}"`
        );
    };

    // --- Comment with Mentions ---
    const handleCommentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setNewComment(val);
        
        const match = val.match(/@([\w\s]*)$/);
        if (match) {
            setMentionFilter(match[1].toLowerCase());
            setShowMentions(true);
        } else {
            setShowMentions(false);
        }
    };

    const insertMention = (userName: string) => {
        setNewComment(prev => prev.replace(/@([\w\s]*)$/, `@${userName} `));
        setShowMentions(false);
        commentInputRef.current?.focus();
    };

    const addComment = () => {
        if (!newComment.trim()) return;
        const comment: Comment = {
            id: Date.now().toString(),
            userId: currentUser.id,
            text: newComment,
            timestamp: Date.now()
        };
        onUpdate({ ...task, comments: [...task.comments, comment] });
        setNewComment('');
    };

    // --- Cover & Members ---
    const setCover = (type: 'COLOR' | 'IMAGE', value: string) => {
        updateWithLog({ cover: { type, value } }, `atualizou a capa do cartão`);
        setActivePopover(null);
    };

    const removeCover = () => {
        updateWithLog({ cover: undefined }, `removeu a capa do cartão`);
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCover('IMAGE', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const toggleMember = (userId: string) => {
        const exists = task.assigneeIds.includes(userId);
        const user = users.find(u => u.id === userId);
        let newIds;
        
        if(exists) {
            newIds = task.assigneeIds.filter(id => id !== userId);
            updateWithLog({ assigneeIds: newIds }, `removeu ${user?.name} do cartão`);
        } else {
            newIds = [...task.assigneeIds, userId];
            updateWithLog({ assigneeIds: newIds }, `adicionou ${user?.name} ao cartão`);
        }
    };

    const toggleArchive = () => {
        const newState = !task.archived;
        updateWithLog({ archived: newState }, newState ? 'arquivou o cartão' : 'restaurou o cartão do arquivo');
    };

    const checklistProgress = task.checklists.length > 0 
        ? Math.round((task.checklists.filter(c => c.isCompleted).length / task.checklists.length) * 100) 
        : 0;
    
    const isTitleDirty = localTitle !== task.title;
    const isDescDirty = localDesc !== task.description;

    const activityFeed = [
        ...task.comments.map(c => ({ type: 'COMMENT', data: c, timestamp: c.timestamp })),
        ...task.history.map(h => ({ type: 'HISTORY', data: h, timestamp: h.timestamp }))
    ].sort((a, b) => b.timestamp - a.timestamp);

    return (
        <div className="fixed inset-0 bg-black/60 z-[100] flex justify-center overflow-y-auto py-10" onClick={onClose}>
            <div className="bg-slate-50 w-full max-w-4xl rounded-xl shadow-2xl relative min-h-[500px] h-fit my-auto" onClick={e => e.stopPropagation()}>
                
                <button onClick={onClose} className="absolute top-2 right-2 p-2 rounded-full bg-black/5 hover:bg-black/10 z-20 transition-colors">
                    <X size={20} className="text-slate-600"/>
                </button>

                {task.cover && (
                    <div 
                        className={`w-full relative ${task.cover.type === 'COLOR' ? 'h-32' : 'h-64'} bg-cover bg-center rounded-t-xl`}
                        style={{ 
                            backgroundColor: task.cover.type === 'COLOR' ? task.cover.value : undefined,
                            backgroundImage: task.cover.type === 'IMAGE' ? `url(${task.cover.value})` : undefined
                        }}
                    >
                        <button 
                            className="absolute bottom-4 right-4 bg-white/80 hover:bg-white px-3 py-1.5 rounded text-xs font-bold shadow-sm backdrop-blur-sm transition-colors"
                            onClick={removeCover}
                        >
                            Remover Capa
                        </button>
                    </div>
                )}

                <div className="flex flex-col md:flex-row p-6 gap-8">
                    <div className="flex-1 space-y-6">
                        
                        {/* Title Section */}
                        <div className="flex gap-4 items-start">
                            <CreditCard className="mt-2 text-slate-600" size={24}/>
                            <div className="flex-1">
                                <div className={`relative transition-all rounded-lg p-1 ${isTitleDirty ? 'bg-amber-50 ring-2 ring-amber-200' : 'hover:bg-slate-100'}`}>
                                    <input 
                                        className="text-xl font-bold text-slate-800 w-full bg-transparent border-none outline-none placeholder-slate-400"
                                        value={localTitle}
                                        onChange={(e) => setLocalTitle(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.currentTarget.blur();
                                                saveTitle();
                                            }
                                            if (e.key === 'Escape') {
                                                cancelTitle();
                                            }
                                        }}
                                        placeholder="Título da Tarefa"
                                    />
                                </div>
                                
                                {isTitleDirty && (
                                    <div className="flex items-center gap-2 mt-2 animate-pop">
                                        <button onClick={saveTitle} className="flex items-center gap-1 bg-emerald-600 text-white px-3 py-1 rounded text-xs font-bold hover:bg-emerald-700 transition-colors">
                                            <Check size={14}/> Salvar
                                        </button>
                                        <button onClick={cancelTitle} className="flex items-center gap-1 bg-slate-200 text-slate-600 px-3 py-1 rounded text-xs font-bold hover:bg-slate-300 transition-colors">
                                            <X size={14}/> Cancelar
                                        </button>
                                        <span className="text-xs text-amber-600 ml-2 flex items-center gap-1"><AlertCircle size={12}/> Alterações pendentes</span>
                                    </div>
                                )}
                                
                                <div className="text-sm text-slate-500 mt-1 pl-1">
                                    na coluna <span className="underline font-medium">{task.status}</span>
                                </div>
                            </div>
                        </div>

                        {/* Members & Labels display area */}
                        <div className="flex flex-wrap gap-6 ml-10">
                            {task.assigneeIds.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Membros</h4>
                                    <div className="flex gap-2">
                                        {task.assigneeIds.map((uid: string) => {
                                            const u = users.find((user: any) => user.id === uid);
                                            return u ? <img key={uid} src={u.avatar} className="w-8 h-8 rounded-full" title={u.name}/> : null;
                                        })}
                                        <button onClick={() => setActivePopover('MEMBERS')} className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center hover:bg-slate-300 text-slate-500 hover:text-slate-700 transition-colors">+</button>
                                    </div>
                                </div>
                            )}
                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Notificações</h4>
                                <div className="text-xs bg-slate-200 px-3 py-1.5 rounded inline-flex items-center gap-1 text-slate-600">
                                    <Eye size={14}/> {task.assigneeIds.includes(currentUser.id) ? 'Seguindo' : 'Não seguindo'}
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div className="flex gap-4">
                            <Layout className="mt-1 text-slate-600" size={24}/>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-slate-700">Descrição</h3>
                                </div>
                                
                                <div className={`relative rounded-lg transition-all ${isDescDirty ? 'bg-amber-50 ring-2 ring-amber-200 p-1' : ''}`}>
                                    <textarea 
                                        className={`w-full min-h-[100px] p-3 rounded-lg border outline-none transition-colors text-sm text-slate-700 resize-none ${
                                            isDescDirty ? 'bg-white border-amber-200' : 'bg-slate-100 border-transparent hover:bg-slate-200 focus:bg-white focus:border-blue-300'
                                        }`}
                                        placeholder="Adicione uma descrição mais detalhada..."
                                        value={localDesc}
                                        onChange={(e) => setLocalDesc(e.target.value)}
                                    />
                                    
                                    {isDescDirty && (
                                        <div className="flex items-center gap-2 mt-2 animate-pop px-1 pb-1">
                                            <button onClick={saveDesc} className="flex items-center gap-1 bg-emerald-600 text-white px-4 py-1.5 rounded text-sm font-bold hover:bg-emerald-700 transition-colors">
                                                Salvar Descrição
                                            </button>
                                            <button onClick={cancelDesc} className="text-slate-500 hover:text-slate-700 text-sm px-3 font-medium">
                                                Cancelar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Checklist */}
                        <div className="flex gap-4">
                            <CheckSquare className="mt-1 text-slate-600" size={24}/>
                            <div className="flex-1">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-bold text-slate-700">Checklist</h3>
                                </div>
                                
                                {task.checklists.length > 0 && (
                                    <div className="w-full bg-slate-200 rounded-full h-2 mb-4">
                                        <div className="bg-emerald-500 h-2 rounded-full transition-all duration-500" style={{width: `${checklistProgress}%`}}></div>
                                    </div>
                                )}

                                <div className="space-y-2 mb-3">
                                    {task.checklists.map((item: any) => (
                                        <div key={item.id} className="flex items-center gap-3 group hover:bg-slate-100 p-1 rounded transition-colors">
                                            <input 
                                                type="checkbox" 
                                                checked={item.isCompleted} 
                                                onChange={() => toggleChecklist(item.id)}
                                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                            />
                                            <span className={`flex-1 text-sm transition-all ${item.isCompleted ? 'line-through text-slate-400' : 'text-slate-700'}`}>{item.text}</span>
                                            
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="date" 
                                                    className="text-xs bg-transparent border border-slate-200 rounded px-1 text-slate-500 hover:border-slate-300 transition-colors"
                                                    value={item.dueDate || ''}
                                                    onChange={(e) => updateChecklistDate(item.id, e.target.value)}
                                                />
                                                <button onClick={() => deleteChecklistItem(item.id)} className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Trash2 size={14}/>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-2">
                                    <input 
                                        type="text"
                                        placeholder="Adicionar um item..."
                                        className="flex-1 bg-slate-100 border-none rounded px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        value={newChecklistText}
                                        onChange={(e) => setNewChecklistText(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && addChecklistItem()}
                                    />
                                    <button onClick={addChecklistItem} className="bg-slate-200 hover:bg-slate-300 text-slate-600 px-3 py-1.5 rounded text-sm font-medium transition-colors">Adicionar</button>
                                </div>
                            </div>
                        </div>

                        {/* Activity / Comments */}
                        <div className="flex gap-4">
                             <Activity className="mt-1 text-slate-600" size={24}/>
                             <div className="flex-1">
                                <h3 className="font-bold text-slate-700 mb-4">Atividade & Comentários</h3>
                                
                                <div className="flex gap-3 mb-6 relative">
                                    <img src={currentUser.avatar} className="w-8 h-8 rounded-full" />
                                    <div className="flex-1 relative">
                                        <textarea 
                                            ref={commentInputRef}
                                            className="w-full bg-white border border-slate-200 rounded-lg p-3 text-sm focus:border-blue-500 outline-none shadow-sm transition-all"
                                            placeholder="Escreva um comentário (Use @ para mencionar)..."
                                            rows={2}
                                            value={newComment}
                                            onChange={handleCommentChange}
                                        />
                                        {/* Mentions Dropdown */}
                                        {showMentions && (
                                            <div className="absolute top-full left-0 bg-white border border-slate-200 shadow-xl rounded-lg mt-1 w-64 z-50 max-h-48 overflow-y-auto animate-pop">
                                                {users
                                                    .filter((u:any) => u.name.toLowerCase().includes(mentionFilter))
                                                    .map((u:any) => (
                                                    <button key={u.id} onClick={() => insertMention(u.name)} className="flex items-center gap-2 w-full p-2 hover:bg-blue-50 text-left text-sm transition-colors">
                                                        <img src={u.avatar} className="w-6 h-6 rounded-full"/>
                                                        <span className="font-medium text-slate-700">{u.name}</span>
                                                    </button>
                                                ))}
                                                {users.filter((u:any) => u.name.toLowerCase().includes(mentionFilter)).length === 0 && (
                                                    <div className="p-2 text-xs text-slate-400 text-center">Ninguém encontrado</div>
                                                )}
                                            </div>
                                        )}
                                        <button 
                                            onClick={addComment}
                                            disabled={!newComment.trim()}
                                            className="mt-2 bg-blue-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                                        >
                                            Salvar Comentário
                                        </button>
                                    </div>
                                </div>

                                {/* UNIFIED ACTIVITY FEED (NEWEST FIRST) */}
                                <div className="space-y-4">
                                    {activityFeed.map((item: any, idx) => {
                                         const u = users.find((user: any) => user.id === item.data.userId) || currentUser;
                                         
                                         if (item.type === 'COMMENT') {
                                             return (
                                                 <div key={item.data.id} className="flex gap-3">
                                                     <img src={u.avatar} className="w-8 h-8 rounded-full" />
                                                     <div>
                                                         <div className="flex items-baseline gap-2">
                                                             <span className="font-bold text-sm text-slate-800">{u.name}</span>
                                                             <span className="text-xs text-slate-500">{new Date(item.timestamp).toLocaleString()}</span>
                                                         </div>
                                                         <div className="bg-white p-2 rounded-lg border border-slate-200 text-sm text-slate-700 mt-1 shadow-sm">
                                                             {item.data.text.split(' ').map((word: string, i: number) => 
                                                                 word.startsWith('@') 
                                                                    ? <span key={i} className="text-blue-600 font-bold bg-blue-50 px-1 rounded">{word}</span> 
                                                                    : <span key={i}>{word} </span>
                                                             )}
                                                         </div>
                                                     </div>
                                                 </div>
                                             );
                                         } else {
                                             // HISTORY LOG
                                             return (
                                                <div key={item.data.id} className="flex gap-3 items-center ml-2">
                                                    <div className="w-4 flex justify-center"><div className="w-1.5 h-1.5 bg-slate-300 rounded-full"></div></div>
                                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                                        <img src={u.avatar} className="w-4 h-4 rounded-full grayscale opacity-70" />
                                                        <span className="font-bold text-slate-600">{u.name}</span>
                                                        <span>{item.data.action}</span>
                                                        <span className="text-slate-400">• {new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                    </div>
                                                </div>
                                             );
                                         }
                                    })}
                                </div>
                             </div>
                        </div>

                    </div>

                    {/* Sidebar Actions */}
                    <div className="w-48 space-y-2 pt-12">
                         <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Ações</h4>
                         
                         {task.status !== 'DONE' && (
                             <button onClick={markAsDone} className="w-full text-left bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 rounded text-sm font-medium flex items-center gap-2 transition-colors mb-2">
                                <CheckCircle size={16}/> Concluir Tarefa
                             </button>
                         )}

                         <div className="border-t border-slate-200 my-2"></div>

                         <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Adicionar ao cartão</h4>
                         
                         {/* Members Button with Popover */}
                         <div className="relative">
                             <button onClick={() => setActivePopover(activePopover === 'MEMBERS' ? null : 'MEMBERS')} className="w-full text-left bg-slate-200 hover:bg-slate-300 px-3 py-1.5 rounded text-sm text-slate-700 font-medium flex items-center gap-2 transition-colors">
                                <Users size={16}/> Membros
                             </button>
                             {activePopover === 'MEMBERS' && (
                                 <>
                                     <div className="fixed inset-0 z-[110]" onClick={() => setActivePopover(null)}></div>
                                     <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 z-[120] p-2 animate-pop">
                                         <h4 className="text-xs font-bold text-slate-500 text-center border-b pb-2 mb-2">Membros</h4>
                                         <div className="space-y-1 max-h-60 overflow-y-auto">
                                             {users.map((u:any) => (
                                                 <button 
                                                    key={u.id} 
                                                    onClick={() => toggleMember(u.id)}
                                                    className="w-full flex items-center justify-between p-2 hover:bg-slate-50 rounded text-left text-sm transition-colors"
                                                 >
                                                     <div className="flex items-center gap-2">
                                                         <img src={u.avatar} className="w-6 h-6 rounded-full"/>
                                                         <span>{u.name}</span>
                                                     </div>
                                                     {task.assigneeIds.includes(u.id) && <CheckCircle size={14} className="text-blue-600"/>}
                                                 </button>
                                             ))}
                                         </div>
                                     </div>
                                 </>
                             )}
                         </div>

                         {/* Cover Button with Popover */}
                         <div className="relative">
                            <button onClick={() => setActivePopover(activePopover === 'COVER' ? null : 'COVER')} className="w-full text-left bg-slate-200 hover:bg-slate-300 px-3 py-1.5 rounded text-sm text-slate-700 font-medium flex items-center gap-2 transition-colors">
                                <ImageIcon size={16}/> Capa
                            </button>
                            {activePopover === 'COVER' && (
                                <>
                                    <div className="fixed inset-0 z-[110]" onClick={() => setActivePopover(null)}></div>
                                    <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-slate-200 z-[120] p-3 animate-pop">
                                        <h4 className="text-xs font-bold text-slate-500 text-center border-b pb-2 mb-2">Capa</h4>
                                        
                                        <p className="text-xs text-slate-500 mb-1">Cores (Presets)</p>
                                        <div className="grid grid-cols-5 gap-1 mb-3">
                                            {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'].map(color => (
                                                <button 
                                                    key={color} 
                                                    className="h-8 w-full rounded hover:opacity-80 border border-slate-100 transition-opacity"
                                                    style={{backgroundColor: color}}
                                                    onClick={() => setCover('COLOR', color)}
                                                />
                                            ))}
                                        </div>
                                        
                                        <div className="flex items-center gap-2 mb-3">
                                            <label className="text-xs text-slate-500">Cor Personalizada:</label>
                                            <input 
                                                type="color" 
                                                className="w-full h-8 cursor-pointer border-none p-0 bg-transparent"
                                                onChange={(e) => setCover('COLOR', e.target.value)}
                                                title="Escolher cor personalizada"
                                            />
                                        </div>

                                        <p className="text-xs text-slate-500 mb-1">Imagens (Presets)</p>
                                        <div className="grid grid-cols-3 gap-1 mb-3">
                                             <button onClick={() => setCover('IMAGE', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200')} className="h-10 bg-cover bg-center rounded hover:opacity-80 transition-opacity" style={{backgroundImage: 'url(https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=200)'}} />
                                             <button onClick={() => setCover('IMAGE', 'https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=200')} className="h-10 bg-cover bg-center rounded hover:opacity-80 transition-opacity" style={{backgroundImage: 'url(https://images.unsplash.com/photo-1557683316-973673baf926?q=80&w=200)'}} />
                                             <button onClick={() => setCover('IMAGE', 'https://images.unsplash.com/photo-1558655146-d09347e0b7a8?q=80&w=200')} className="h-10 bg-cover bg-center rounded hover:opacity-80 transition-opacity" style={{backgroundImage: 'url(https://images.unsplash.com/photo-1558655146-d09347e0b7a8?q=80&w=200)'}} />
                                        </div>
                                        
                                        <div className="mb-2">
                                            <label className="block text-xs text-slate-500 mb-1">Upload do Computador</label>
                                            <button 
                                                className="w-full bg-slate-100 hover:bg-slate-200 text-xs py-1.5 rounded text-slate-600 flex items-center justify-center gap-2 transition-colors"
                                                onClick={() => fileInputRef.current?.click()}
                                            >
                                                <Upload size={14}/> Carregar Imagem
                                            </button>
                                            <input 
                                                type="file" 
                                                ref={fileInputRef} 
                                                className="hidden" 
                                                accept="image/*"
                                                onChange={handleImageUpload}
                                            />
                                        </div>

                                        <button onClick={removeCover} className="w-full bg-red-50 hover:bg-red-100 text-xs py-1 rounded text-red-600 border border-red-100 transition-colors">Remover Capa</button>
                                    </div>
                                </>
                            )}
                         </div>
                         
                         <div className="border-t border-slate-200 my-2"></div>
                         
                         <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">Outros</h4>
                         <button onClick={toggleArchive} className="w-full text-left bg-slate-200 hover:bg-slate-300 px-3 py-1.5 rounded text-sm text-slate-700 font-medium flex items-center gap-2 transition-colors">
                            <Archive size={16}/> {task.archived ? 'Desarquivar' : 'Arquivar'}
                         </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
