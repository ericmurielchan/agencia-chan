
import React, { useState, useEffect } from 'react';
import { Modal } from '../Modal';
import { Lead, User, PipelineStage, LossReason, LeadTask, LeadHistory, Client } from '../../types';
import { 
    X, Save, Trash2, Plus, CheckCircle2, XCircle, 
    Calendar, Phone, Mail, MessageSquare, User as UserIcon,
    DollarSign, Tag, Clock, AlertCircle, History,
    TrendingUp, Star, Briefcase, Globe, FileText
} from 'lucide-react';

interface LeadModalProps {
    lead: Partial<Lead>;
    onClose: () => void;
    onSave: (lead: Lead) => void;
    onDelete?: (id: string) => void;
    users: User[];
    stages: PipelineStage[];
    lossReasons: LossReason[];
    currentUser: User;
}

export const LeadModal: React.FC<LeadModalProps> = ({ 
    lead, onClose, onSave, onDelete, users, stages, lossReasons, currentUser 
}) => {
    const [formData, setFormData] = useState<Partial<Lead>>({
        status: 'OPEN',
        priority: 'MEDIUM',
        temperature: 'WARM',
        tasks: [],
        history: [],
        stageId: stages[0]?.id || 'NEW',
        value: 0,
        responsibleId: currentUser.id,
        rating: 0,
        source: 'Direto',
        ...lead
    });

    const [activeTab, setActiveTab] = useState<'DETAILS' | 'TASKS' | 'HISTORY'>('DETAILS');
    const [showLossModal, setShowLossModal] = useState(false);
    const [selectedLossReason, setSelectedLossReason] = useState('');
    const [newTask, setNewTask] = useState<Partial<LeadTask>>({ text: '', type: 'TASK' });
    const [errors, setErrors] = useState<string[]>([]);

    const handleSave = () => {
        const newErrors: string[] = [];
        if (!formData.company) newErrors.push('Empresa é obrigatória');
        if (!formData.name) newErrors.push('Nome do contato é obrigatório');
        if (!formData.email) newErrors.push('E-mail é obrigatório');
        
        if (newErrors.length > 0) {
            setErrors(newErrors);
            setActiveTab('DETAILS');
            return;
        }
        
        const finalLead: Lead = {
            ...formData,
            id: formData.id || Date.now().toString(),
            email: formData.email || '',
            lastContact: formData.lastContact || new Date().toISOString(),
            createdAt: formData.createdAt || Date.now(),
            updatedAt: Date.now(),
            history: [
                ...(formData.history || []),
                {
                    id: Date.now().toString(),
                    userId: currentUser.id,
                    action: formData.id ? 'Lead atualizado' : 'Lead criado',
                    timestamp: Date.now()
                }
            ]
        } as Lead;

        onSave(finalLead);
    };

    const handleStatusChange = (status: 'WON' | 'LOST') => {
        if (status === 'LOST') {
            setShowLossModal(true);
        } else {
            setFormData({ ...formData, status: 'WON', stageId: 'WON' });
        }
    };

    const confirmLoss = () => {
        if (!selectedLossReason) return;
        setFormData({ ...formData, status: 'LOST', lossReasonId: selectedLossReason, stageId: 'LOST' });
        setShowLossModal(false);
    };

    const addTask = () => {
        if (!newTask.text) return;
        const task: LeadTask = {
            id: Date.now().toString(),
            text: newTask.text,
            type: newTask.type || 'TASK',
            completed: false,
            dueDate: newTask.dueDate,
            createdAt: Date.now()
        };
        setFormData({ ...formData, tasks: [...(formData.tasks || []), task] });
        setNewTask({ text: '', type: 'TASK' });
    };

    const toggleTask = (taskId: string) => {
        setFormData({
            ...formData,
            tasks: formData.tasks?.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
        });
    };

    return (
        <Modal 
            isOpen={true} 
            onClose={onClose} 
            maxWidth="896px" 
            hideHeader={true} 
            noPadding={true} 
            scrollable={false}
        >
            <div className="flex flex-col flex-1 min-h-0">
                {/* MODAL HEADER */}
                <div className="p-5 sm:p-8 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-start sm:items-center bg-slate-50/50 shrink-0 gap-4">
                    <div className="flex-1 w-full">
                        <div className="flex items-center justify-between sm:justify-start gap-3 mb-2">
                            <div className="flex items-center gap-2">
                                <div className="p-1.5 sm:p-2 bg-indigo-100 text-indigo-600 rounded-lg sm:rounded-xl">
                                    <Briefcase size={16} className="sm:w-5 sm:h-5" />
                                </div>
                                <span className="text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Negócio / Prospect</span>
                            </div>
                            <button onClick={onClose} className="sm:hidden p-2 text-slate-300 hover:bg-slate-100 rounded-full transition-colors"><X size={20}/></button>
                        </div>
                        <input 
                            className={`font-black text-xl sm:text-3xl bg-transparent outline-none w-full text-slate-800 placeholder:text-slate-200 tracking-tight transition-all ${errors.includes('Empresa é obrigatória') ? 'placeholder:text-red-300' : ''}`}
                            placeholder="Nome da Empresa *"
                            value={formData.company || ''}
                            onChange={e => {
                                setFormData({...formData, company: e.target.value});
                                if (errors.includes('Empresa é obrigatória')) setErrors(prev => prev.filter(err => err !== 'Empresa é obrigatória'));
                            }}
                            autoFocus
                        />
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto no-scrollbar pb-1 sm:pb-0">
                        {formData.status === 'OPEN' && (
                            <>
                                <button 
                                    onClick={() => handleStatusChange('WON')}
                                    className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                                >
                                    <CheckCircle2 size={14} className="sm:w-4 sm:h-4" /> Ganho
                                </button>
                                <button 
                                    onClick={() => handleStatusChange('LOST')}
                                    className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all flex items-center justify-center gap-2 whitespace-nowrap"
                                >
                                    <XCircle size={14} className="sm:w-4 sm:h-4" /> Perdido
                                </button>
                            </>
                        )}
                        {formData.status === 'WON' && (
                            <span className="flex-1 sm:flex-none px-4 py-2 bg-emerald-500 text-white rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 whitespace-nowrap">
                                <CheckCircle2 size={14} className="sm:w-4 sm:h-4" /> Negócio Ganho
                            </span>
                        )}
                        {formData.status === 'LOST' && (
                            <span className="flex-1 sm:flex-none px-4 py-2 bg-red-500 text-white rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 whitespace-nowrap">
                                <XCircle size={14} className="sm:w-4 sm:h-4" /> Negócio Perdido
                            </span>
                        )}
                        <button onClick={onClose} className="hidden sm:block p-2 text-slate-300 hover:bg-slate-100 rounded-full transition-colors ml-2"><X size={24}/></button>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row flex-1 overflow-hidden">
                    {/* SIDEBAR TABS / MOBILE TABS */}
                    <div className="w-full sm:w-48 bg-slate-50 border-b sm:border-b-0 sm:border-r border-slate-100 p-3 sm:p-6 flex sm:flex-col gap-2 shrink-0 overflow-x-auto no-scrollbar">
                        <button 
                            onClick={() => setActiveTab('DETAILS')} 
                            className={`flex-1 sm:w-full text-left px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center sm:justify-start gap-2 sm:gap-3 whitespace-nowrap ${activeTab === 'DETAILS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:bg-white/50'}`}
                        >
                            <FileText size={14} className="sm:w-4 sm:h-4" /> Detalhes
                        </button>
                        <button 
                            onClick={() => setActiveTab('TASKS')} 
                            className={`flex-1 sm:w-full text-left px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center sm:justify-start gap-2 sm:gap-3 whitespace-nowrap ${activeTab === 'TASKS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:bg-white/50'}`}
                        >
                            <CheckCircle2 size={14} className="sm:w-4 sm:h-4" /> Tarefas
                            {formData.tasks?.filter(t => !t.completed).length ? (
                                <span className="ml-1 sm:ml-auto bg-indigo-100 text-indigo-600 px-1.5 py-0.5 rounded-full text-[8px]">{formData.tasks.filter(t => !t.completed).length}</span>
                            ) : null}
                        </button>
                        <button 
                            onClick={() => setActiveTab('HISTORY')} 
                            className={`flex-1 sm:w-full text-left px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center sm:justify-start gap-2 sm:gap-3 whitespace-nowrap ${activeTab === 'HISTORY' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:bg-white/50'}`}
                        >
                            <History size={14} className="sm:w-4 sm:h-4" /> Histórico
                        </button>
                    </div>

                    {/* CONTENT AREA */}
                    <div className="flex-1 p-5 sm:p-8 overflow-y-auto custom-scrollbar min-h-0">
                        {activeTab === 'DETAILS' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Responsável</label>
                                        <select 
                                            className="w-full bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-500 rounded-2xl p-3.5 text-sm font-bold outline-none transition-all"
                                            value={formData.responsibleId || ''}
                                            onChange={e => setFormData({...formData, responsibleId: e.target.value})}
                                        >
                                            <option value="">Selecione um responsável</option>
                                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={`text-[10px] font-black uppercase tracking-widest mb-2 block ${errors.includes('Nome do contato é obrigatório') ? 'text-red-500' : 'text-slate-400'}`}>Contato Principal *</label>
                                        <div className="relative">
                                            <UserIcon size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 ${errors.includes('Nome do contato é obrigatório') ? 'text-red-400' : 'text-slate-400'}`} />
                                            <input 
                                                className={`w-full bg-slate-50 border rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold outline-none transition-all ${errors.includes('Nome do contato é obrigatório') ? 'border-red-200 bg-red-50/30 focus:border-red-500' : 'border-transparent focus:bg-white focus:border-indigo-500'}`} 
                                                placeholder="Nome do Contato *" 
                                                value={formData.name || ''} 
                                                onChange={e => {
                                                    setFormData({...formData, name: e.target.value});
                                                    if (errors.includes('Nome do contato é obrigatório')) setErrors(prev => prev.filter(err => err !== 'Nome do contato é obrigatório'));
                                                }} 
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className={`text-[10px] font-black uppercase tracking-widest mb-2 block ${errors.includes('E-mail é obrigatório') ? 'text-red-500' : 'text-slate-400'}`}>E-mail *</label>
                                            <div className="relative">
                                                <Mail size={16} className={`absolute left-4 top-1/2 -translate-y-1/2 ${errors.includes('E-mail é obrigatório') ? 'text-red-400' : 'text-slate-400'}`} />
                                                <input 
                                                    className={`w-full bg-slate-50 border rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold outline-none transition-all ${errors.includes('E-mail é obrigatório') ? 'border-red-200 bg-red-50/30 focus:border-red-500' : 'border-transparent focus:bg-white focus:border-indigo-500'}`} 
                                                    placeholder="email@empresa.com *" 
                                                    value={formData.email || ''} 
                                                    onChange={e => {
                                                        setFormData({...formData, email: e.target.value});
                                                        if (errors.includes('E-mail é obrigatório')) setErrors(prev => prev.filter(err => err !== 'E-mail é obrigatório'));
                                                    }} 
                                                />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Telefone</label>
                                            <div className="relative">
                                                <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                                <input className="w-full bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-500 rounded-2xl pl-12 pr-4 py-3.5 text-sm font-bold outline-none transition-all" placeholder="(00) 00000-0000" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: e.target.value})} />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Valor Estimado (R$)</label>
                                        <div className="relative">
                                            <DollarSign size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input 
                                                className="w-full bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-500 rounded-2xl pl-12 pr-4 py-3.5 text-xl font-black outline-none transition-all text-indigo-600" 
                                                type="number" 
                                                placeholder="0.00" 
                                                value={formData.value || ''} 
                                                onChange={e => setFormData({...formData, value: parseFloat(e.target.value)})} 
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Origem</label>
                                            <select className="w-full bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-500 rounded-2xl p-3.5 text-sm font-bold outline-none transition-all" value={formData.source || ''} onChange={e => setFormData({...formData, source: e.target.value})}>
                                                <option value="">Selecione</option>
                                                <option value="Instagram">Instagram</option>
                                                <option value="Linkedin">Linkedin</option>
                                                <option value="Google Ads">Google Ads</option>
                                                <option value="Indicação">Indicação</option>
                                                <option value="Site">Site</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Temperatura</label>
                                            <div className="flex gap-2">
                                                {(['COLD', 'WARM', 'HOT'] as const).map(temp => (
                                                    <button 
                                                        key={temp}
                                                        onClick={() => setFormData({...formData, temperature: temp})}
                                                        className={`flex-1 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${formData.temperature === temp ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-slate-400 border-slate-100 hover:border-indigo-200'}`}
                                                    >
                                                        {temp === 'COLD' ? 'Frio' : temp === 'WARM' ? 'Morno' : 'Quente'}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Notas Internas</label>
                                        <textarea 
                                            className="w-full bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-500 rounded-2xl p-4 text-sm font-medium outline-none transition-all min-h-[100px] resize-none" 
                                            placeholder="Observações importantes sobre a negociação..." 
                                            value={formData.notes || ''} 
                                            onChange={e => setFormData({...formData, notes: e.target.value})}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'TASKS' && (
                            <div className="space-y-6">
                                <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Nova Tarefa</h4>
                                    <div className="flex gap-3">
                                        <input 
                                            className="flex-1 bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 transition-all" 
                                            placeholder="O que precisa ser feito?" 
                                            value={newTask.text}
                                            onChange={e => setNewTask({...newTask, text: e.target.value})}
                                        />
                                        <input 
                                            type="date"
                                            className="bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold outline-none focus:border-indigo-500 transition-all" 
                                            value={newTask.dueDate}
                                            onChange={e => setNewTask({...newTask, dueDate: e.target.value})}
                                        />
                                        <button 
                                            onClick={addTask}
                                            className="bg-indigo-600 text-white p-3 rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    {formData.tasks?.map(task => (
                                        <div key={task.id} className={`flex items-center gap-4 p-5 rounded-[24px] border transition-all ${task.completed ? 'bg-slate-50 border-slate-100 opacity-60' : 'bg-white border-slate-100 shadow-sm hover:shadow-md'}`}>
                                            <button 
                                                onClick={() => toggleTask(task.id)}
                                                className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${task.completed ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 hover:border-indigo-500'}`}
                                            >
                                                {task.completed && <CheckCircle2 size={14} />}
                                            </button>
                                            <div className="flex-1">
                                                <p className={`text-sm font-bold ${task.completed ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{task.text}</p>
                                                {task.dueDate && (
                                                    <div className="flex items-center gap-1.5 mt-1 text-[10px] font-bold text-slate-400">
                                                        <Calendar size={12} />
                                                        {new Date(task.dueDate).toLocaleDateString()}
                                                    </div>
                                                )}
                                            </div>
                                            <button className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                    {(!formData.tasks || formData.tasks.length === 0) && (
                                        <div className="text-center py-12">
                                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                                <CheckCircle2 size={32} />
                                            </div>
                                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Nenhuma tarefa pendente</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'HISTORY' && (
                            <div className="space-y-6">
                                {formData.history?.sort((a,b) => b.timestamp - a.timestamp).map(item => (
                                    <div key={item.id} className="flex gap-4 relative pb-6 last:pb-0">
                                        <div className="absolute left-4 top-8 bottom-0 w-px bg-slate-100 last:hidden" />
                                        <div className="w-8 h-8 rounded-full bg-indigo-50 border-4 border-white shadow-sm flex items-center justify-center text-indigo-600 shrink-0 z-10">
                                            <Clock size={12} />
                                        </div>
                                        <div className="flex-1 pt-1">
                                            <div className="flex justify-between items-start">
                                                <p className="text-sm font-bold text-slate-800">{item.action}</p>
                                                <span className="text-[10px] font-bold text-slate-400">{new Date(item.timestamp).toLocaleString()}</span>
                                            </div>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Por: {users.find(u => u.id === item.userId)?.name || 'Sistema'}</p>
                                            {item.details && <p className="text-xs text-slate-500 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100">{item.details}</p>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* MODAL FOOTER */}
                <div className="p-5 sm:p-8 border-t border-slate-50 flex flex-col sm:flex-row justify-between items-center bg-slate-50/50 shrink-0 gap-4">
                    <div className="flex flex-col w-full sm:w-auto">
                        {onDelete && formData.id && (
                            <button 
                                onClick={() => onDelete(formData.id!)}
                                className="text-red-500 hover:text-red-600 text-[9px] sm:text-[10px] font-black uppercase tracking-widest flex items-center gap-2 mb-1"
                            >
                                <Trash2 size={14} className="sm:w-4 sm:h-4" /> Excluir Lead
                            </button>
                        )}
                        {errors.length > 0 && (
                            <div className="flex items-center gap-2 text-red-500 text-[8px] sm:text-[9px] font-bold uppercase animate-in slide-in-from-left-2">
                                <AlertCircle size={12} />
                                {errors[0]}
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2 sm:gap-3 w-full sm:w-auto">
                        <button onClick={onClose} className="flex-1 sm:flex-none px-4 sm:px-6 py-2 sm:py-3 text-slate-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:text-slate-600 transition-colors">Cancelar</button>
                        <button 
                            onClick={handleSave} 
                            className="flex-2 sm:flex-none px-5 sm:px-8 py-2 sm:py-3 rounded-lg sm:rounded-2xl bg-indigo-600 text-white font-black text-[9px] sm:text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 transform active:scale-95"
                        >
                            <Save size={16} className="sm:w-4 sm:h-4" /> Salvar Alterações
                        </button>
                    </div>
                </div>
            </div>

            {/* LOSS REASON MODAL */}
            {showLossModal && (
                <Modal 
                    isOpen={showLossModal} 
                    onClose={() => setShowLossModal(false)}
                    hideHeader={true}
                    maxWidth="448px"
                >
                    <div className="text-center">
                        <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                            <XCircle size={40} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">Negócio Perdido</h3>
                        <p className="text-slate-400 text-sm font-medium mb-8">Para fins estatísticos, por favor selecione o principal motivo da perda deste negócio.</p>
                        
                        <div className="space-y-3 mb-8">
                            {lossReasons.filter(r => r.isActive).map(reason => (
                                <button 
                                    key={reason.id}
                                    onClick={() => setSelectedLossReason(reason.id)}
                                    className={`w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center justify-between ${selectedLossReason === reason.id ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-indigo-200'}`}
                                >
                                    <span className={`text-sm font-bold ${selectedLossReason === reason.id ? 'text-indigo-600' : 'text-slate-600'}`}>{reason.label}</span>
                                    {selectedLossReason === reason.id && <CheckCircle2 size={18} className="text-indigo-600" />}
                                </button>
                            ))}
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => setShowLossModal(false)} className="flex-1 py-4 text-slate-400 text-[10px] font-black uppercase tracking-widest">Voltar</button>
                            <button 
                                onClick={confirmLoss}
                                disabled={!selectedLossReason}
                                className="flex-2 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-600/20 hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Confirmar Perda
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </Modal>
    );
};
