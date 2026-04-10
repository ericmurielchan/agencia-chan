
import React, { useState, useMemo, useEffect } from 'react';
import { Lead, PipelineStage, User, ConfirmOptions, LossReason, Client, Notification } from '../../types';
import { 
    LayoutDashboard, Kanban, List, FileText, Settings, 
    Plus, Search, Filter, Download, Bell, 
    TrendingUp, Target, Users, DollarSign,
    ChevronRight, MoreVertical, Star, CheckCircle2,
    XCircle, AlertCircle, Clock, Calendar
} from 'lucide-react';
import { CRMDashboard } from './CRMDashboard';
import { CRMPipeline } from './CRMPipeline';
import { LeadModal } from './LeadModal';

interface CRMModuleProps {
    leads: Lead[];
    setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
    stages: PipelineStage[];
    setStages: React.Dispatch<React.SetStateAction<PipelineStage[]>>;
    lossReasons: LossReason[];
    setLossReasons: React.Dispatch<React.SetStateAction<LossReason[]>>;
    users: User[];
    currentUser: User;
    clients: Client[];
    setClients: React.Dispatch<React.SetStateAction<Client[]>>;
    notifications: Notification[];
    setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
    openConfirm: (options: ConfirmOptions) => Promise<boolean>;
    selectedLeadId?: string | null;
    onClearSelectedLead?: () => void;
    onSaveLead?: (lead: Lead) => void;
    onDeleteLead?: (id: string) => void;
    onSaveClient?: (client: Client) => void;
    onSaveNotification?: (notif: Notification) => void;
}

export const CRMModule: React.FC<CRMModuleProps> = ({ 
    leads, setLeads, stages, setStages, lossReasons, setLossReasons, 
    users, currentUser, clients, setClients, notifications, setNotifications, openConfirm,
    selectedLeadId, onClearSelectedLead, onSaveLead, onDeleteLead, onSaveClient, onSaveNotification
}) => {
    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'PIPELINE' | 'LIST' | 'REPORTS'>('PIPELINE');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLead, setEditingLead] = useState<Partial<Lead> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [pipelineSearchTerm, setPipelineSearchTerm] = useState('');

    const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER';

    useEffect(() => {
        if (selectedLeadId) {
            const lead = leads.find(l => l.id === selectedLeadId);
            if (lead) {
                setEditingLead(lead);
                setIsModalOpen(true);
            }
            if (onClearSelectedLead) onClearSelectedLead();
        }
    }, [selectedLeadId, leads, onClearSelectedLead]);

    // Intelligent Notifications Simulation
    useEffect(() => {
        const checkTasks = () => {
            const now = Date.now();
            const oneHour = 3600000;
            const oneDay = 86400000;

            leads.forEach(lead => {
                if (lead.responsibleId === currentUser.id) {
                    lead.tasks.forEach(task => {
                        if (!task.completed && task.dueDate) {
                            const dueDate = new Date(task.dueDate).getTime();
                            const diff = dueDate - now;

                            // Task Overdue
                            if (diff < 0 && !notifications.find(n => n.id === `overdue_${task.id}`)) {
                                const overdueNotif: Notification = {
                                    id: `overdue_${task.id}`,
                                    title: 'Tarefa Atrasada',
                                    message: `Tarefa atrasada: ${task.text} (Lead: ${lead.company})`,
                                    type: 'ALERT',
                                    priority: 'HIGH',
                                    status: 'UNREAD',
                                    originModule: 'CRM',
                                    timestamp: Date.now(),
                                    targetUserId: currentUser.id,
                                    navToView: 'crm'
                                };
                                setNotifications(prev => [overdueNotif, ...prev]);
                                if (onSaveNotification) onSaveNotification(overdueNotif);
                            }
                            // Task in 1 hour
                            else if (diff > 0 && diff < oneHour && !notifications.find(n => n.id === `soon_${task.id}`)) {
                                const soonNotif: Notification = {
                                    id: `soon_${task.id}`,
                                    title: 'Tarefa em Breve',
                                    message: `Tarefa em 1h: ${task.text} (Lead: ${lead.company})`,
                                    type: 'INFO',
                                    priority: 'MEDIUM',
                                    status: 'UNREAD',
                                    originModule: 'CRM',
                                    timestamp: Date.now(),
                                    targetUserId: currentUser.id,
                                    navToView: 'crm'
                                };
                                setNotifications(prev => [soonNotif, ...prev]);
                                if (onSaveNotification) onSaveNotification(soonNotif);
                            }
                        }
                    });

                    // Lead without contact for 3 days
                    const lastContact = lead.lastContact ? new Date(lead.lastContact).getTime() : lead.createdAt;
                    if (now - lastContact > oneDay * 3 && lead.status === 'OPEN' && !notifications.find(n => n.id === `nocontact_${lead.id}`)) {
                        const noContactNotif: Notification = {
                            id: `nocontact_${lead.id}`,
                            title: 'Lead sem Contato',
                            message: `Lead sem contato há mais de 3 dias: ${lead.company}`,
                            type: 'WARNING',
                            priority: 'MEDIUM',
                            status: 'UNREAD',
                            originModule: 'CRM',
                            timestamp: Date.now(),
                            targetUserId: currentUser.id,
                            navToView: 'crm'
                        };
                        setNotifications(prev => [noContactNotif, ...prev]);
                    }
                }
            });
        };

        checkTasks();
        const interval = setInterval(checkTasks, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [leads, currentUser, notifications, setNotifications]);

    // Access Control Logic
    const visibleLeads = useMemo(() => {
        if (currentUser.role === 'ADMIN' || currentUser.role === 'MANAGER') return leads;
        if (currentUser.role === 'EMPLOYEE') return leads.filter(l => l.responsibleId === currentUser.id);
        if (currentUser.role === 'FREELANCER') return leads.filter(l => l.responsibleId === currentUser.id);
        return [];
    }, [leads, currentUser]);

    const handleSaveLead = (lead: Lead) => {
        const isNew = !leads.find(l => l.id === lead.id);
        
        if (isNew) {
            setLeads(prev => [...prev, lead]);
            if (onSaveLead) onSaveLead(lead);
            
            // Notify responsible if assigned
            if (lead.responsibleId && lead.responsibleId !== currentUser.id) {
                const newNotification: Notification = {
                    id: Date.now().toString(),
                    title: 'Novo Lead Atribuído',
                    message: `Você foi atribuído como responsável pelo lead ${lead.company}.`,
                    type: 'INFO',
                    priority: 'MEDIUM',
                    status: 'UNREAD',
                    originModule: 'CRM',
                    timestamp: Date.now(),
                    targetUserId: lead.responsibleId,
                    navToView: 'crm'
                };
                setNotifications(prev => [newNotification, ...prev]);
                if (onSaveNotification) onSaveNotification(newNotification);
            }
        } else {
            setLeads(prev => prev.map(l => l.id === lead.id ? lead : l));
            if (onSaveLead) onSaveLead(lead);
        }

        // Check if WON to create Client
        if (lead.status === 'WON') {
            const clientExists = clients.find(c => c.id === `client_${lead.id}`);
            if (!clientExists) {
                const newClient: Client = {
                    id: `client_${lead.id}`,
                    name: lead.company,
                    status: 'ACTIVE',
                    entryDate: new Date().toISOString().split('T')[0],
                    responsibleId: lead.responsibleId,
                    contact: {
                        name: lead.name,
                        email: lead.email,
                        phone: lead.phone || '',
                        whatsapp: lead.phone || ''
                    },
                    contacts: [
                        { name: lead.name, email: lead.email, phone: lead.phone || '', role: 'Principal' }
                    ],
                    isRecurring: false,
                    level: 'BASIC',
                    tags: lead.tags || [],
                    internalNotes: `Cliente originado do CRM. Notas: ${lead.notes || ''}`
                };
                setClients(prev => [...prev, newClient]);
                if (onSaveClient) onSaveClient(newClient);
                
                // Notify Admin/Finance
                const winNotification: Notification = {
                    id: Date.now().toString() + '_win',
                    title: 'Novo Negócio Fechado!',
                    message: `O lead ${lead.company} foi marcado como GANHO. Cliente pré-cadastrado.`,
                    type: 'SUCCESS',
                    priority: 'HIGH',
                    status: 'UNREAD',
                    originModule: 'CRM',
                    timestamp: Date.now(),
                    targetRole: 'ADMIN',
                    navToView: 'clients'
                };
                setNotifications(prev => [winNotification, ...prev]);
                if (onSaveNotification) onSaveNotification(winNotification);
            }
        }

        setIsModalOpen(false);
        setEditingLead(null);
    };

    const handleDeleteLead = async (id: string) => {
        const confirmed = await openConfirm({
            title: 'Excluir Lead',
            description: 'Tem certeza que deseja excluir este lead? Esta ação não pode ser desfeita.',
            confirmText: 'Excluir',
            variant: 'danger'
        });

        if (confirmed) {
            setLeads(prev => prev.filter(l => l.id !== id));
            if (onDeleteLead) onDeleteLead(id);
            setIsModalOpen(false);
            setEditingLead(null);
        }
    };

    const exportCSV = () => {
        const headers = ['Empresa', 'Contato', 'Valor', 'Etapa', 'Status', 'Responsável', 'Origem', 'Criado Em'];
        const rows = visibleLeads.map(l => [
            l.company,
            l.name,
            l.value,
            stages.find(s => s.id === l.stageId)?.label || l.stageId,
            l.status,
            users.find(u => u.id === l.responsibleId)?.name || 'N/A',
            l.source || 'N/A',
            new Date(l.createdAt).toLocaleDateString()
        ]);

        const csvContent = "data:text/csv;charset=utf-8," 
            + headers.join(",") + "\n" 
            + rows.map(e => e.join(",")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `crm_leads_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="h-full flex flex-col overflow-hidden bg-slate-50/30">
            {/* FIXED CRM HEADER & ACTION BAR */}
            <div className="shrink-0 bg-white border-b border-slate-200 px-3 py-2 sm:px-8 sm:py-4 z-10 shadow-sm">
                <div className="flex flex-col gap-3 sm:gap-6">
                    {/* TOP ROW: TABS & GLOBAL ACTIONS */}
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4">
                        <div className="flex bg-slate-100 p-1 rounded-xl sm:rounded-2xl border border-slate-200 overflow-x-auto no-scrollbar max-w-full shrink-0">
                            <button 
                                onClick={() => setActiveTab('DASHBOARD')}
                                className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'DASHBOARD' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <LayoutDashboard size={14} /> <span className="hidden xs:inline">Dashboard</span>
                            </button>
                            <button 
                                onClick={() => setActiveTab('PIPELINE')}
                                className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'PIPELINE' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <Kanban size={14} /> <span className="hidden xs:inline">Pipeline</span>
                            </button>
                            <button 
                                onClick={() => setActiveTab('LIST')}
                                className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'LIST' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <List size={14} /> <span className="hidden xs:inline">Lista</span>
                            </button>
                            <button 
                                onClick={() => setActiveTab('REPORTS')}
                                className={`px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === 'REPORTS' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                <FileText size={14} /> <span className="hidden xs:inline">Relatórios</span>
                            </button>
                        </div>

                        <div className="flex items-center gap-2 sm:gap-3 justify-between sm:justify-end">
                            <button 
                                onClick={exportCSV}
                                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 transition-all shadow-sm flex items-center justify-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest"
                            >
                                <Download size={14} className="sm:w-4 sm:h-4" /> <span className="inline">Exportar</span>
                            </button>
                            <button 
                                onClick={() => { setEditingLead({ stageId: stages[0]?.id }); setIsModalOpen(true); }}
                                className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white px-4 sm:px-5 py-2 rounded-xl flex items-center justify-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20 transition-all"
                            >
                                <Plus size={14} className="sm:w-4 sm:h-4" strokeWidth={3} /> <span className="inline">Novo Lead</span>
                            </button>
                        </div>
                    </div>

                    {/* BOTTOM ROW: SEARCH & FILTERS (CONTEXTUAL) */}
                    {(activeTab === 'PIPELINE' || activeTab === 'LIST') && (
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-2 sm:gap-4 flex-1 w-full sm:max-w-2xl">
                                <div className="relative flex-1">
                                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                    <input 
                                        type="text" 
                                        placeholder={activeTab === 'PIPELINE' ? "Buscar no pipeline..." : "Buscar leads..."}
                                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] sm:text-xs font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all"
                                        value={activeTab === 'PIPELINE' ? pipelineSearchTerm : searchTerm}
                                        onChange={e => activeTab === 'PIPELINE' ? setPipelineSearchTerm(e.target.value) : setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-all shadow-sm flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                                    <Filter size={14} /> <span className="hidden sm:inline">Filtros</span>
                                </button>
                            </div>

                            {activeTab === 'PIPELINE' && (
                                <button 
                                    onClick={() => { setEditingLead({ stageId: stages[0]?.id }); setIsModalOpen(true); }}
                                    className="bg-slate-800 hover:bg-slate-900 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl flex items-center gap-2 text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-lg transition-all justify-center"
                                >
                                    <Plus size={14} className="sm:w-4 sm:h-4" strokeWidth={3} /> <span className="inline">Novo Negócio</span>
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'DASHBOARD' && (
                    <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-4 sm:p-8">
                        <CRMDashboard leads={visibleLeads} users={users} lossReasons={lossReasons} />
                    </div>
                )}
                {activeTab === 'PIPELINE' && (
                    <div className="absolute inset-0 p-4 sm:p-8 overflow-hidden">
                        <CRMPipeline 
                            leads={visibleLeads} 
                            setLeads={setLeads} 
                            stages={stages} 
                            users={users}
                            currentUser={currentUser}
                            onEditLead={(l) => { setEditingLead(l); setIsModalOpen(true); }}
                            onNewLead={(stageId) => { setEditingLead({ stageId }); setIsModalOpen(true); }}
                            onWinLead={(l) => handleSaveLead({...l, status: 'WON'})}
                            onLoseLead={(l) => { setEditingLead(l); setIsModalOpen(true); }}
                            externalSearchTerm={pipelineSearchTerm}
                        />
                    </div>
                )}
                {activeTab === 'LIST' && (
                    <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-4 sm:p-8">
                        <div className="bg-white rounded-[24px] sm:rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
                            <div className="p-4 sm:p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                                <h3 className="text-xs sm:text-sm font-black text-slate-800 uppercase tracking-tight">Lista de Leads</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse min-w-[800px]">
                                    <thead>
                                        <tr className="bg-slate-50/50">
                                            <th className="px-4 sm:px-6 py-4 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Empresa</th>
                                            <th className="px-4 sm:px-6 py-4 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Contato</th>
                                            <th className="px-4 sm:px-6 py-4 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Valor</th>
                                            <th className="px-4 sm:px-6 py-4 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Etapa</th>
                                            <th className="px-4 sm:px-6 py-4 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Responsável</th>
                                            <th className="px-4 sm:px-6 py-4 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                            <th className="px-4 sm:px-6 py-4 text-[9px] sm:text-[10px] font-black text-slate-400 uppercase tracking-widest">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {visibleLeads.filter(l => l.company.toLowerCase().includes(searchTerm.toLowerCase()) || l.name.toLowerCase().includes(searchTerm.toLowerCase())).map(lead => (
                                            <tr key={lead.id} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="px-4 sm:px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">
                                                            {lead.company.charAt(0)}
                                                        </div>
                                                        <span className="text-xs sm:text-sm font-bold text-slate-800">{lead.company}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4">
                                                    <div className="flex flex-col">
                                                        <span className="text-[11px] sm:text-xs font-bold text-slate-600">{lead.name}</span>
                                                        <span className="text-[9px] sm:text-[10px] text-slate-400">{lead.email}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4">
                                                    <span className="text-xs sm:text-sm font-black text-slate-800">R$ {lead.value.toLocaleString()}</span>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4">
                                                    <span className="px-2 sm:px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                                                        {stages.find(s => s.id === lead.stageId)?.label || lead.stageId}
                                                    </span>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-100 overflow-hidden">
                                                            <img src={users.find(u => u.id === lead.responsibleId)?.avatar} alt="" className="w-full h-full object-cover" />
                                                        </div>
                                                        <span className="text-[11px] sm:text-xs font-bold text-slate-600">{users.find(u => u.id === lead.responsibleId)?.name || 'N/A'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4">
                                                    {lead.status === 'WON' && <span className="px-2 sm:px-3 py-1 bg-emerald-100 text-emerald-600 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Ganho</span>}
                                                    {lead.status === 'LOST' && <span className="px-2 sm:px-3 py-1 bg-red-100 text-red-600 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Perdido</span>}
                                                    {lead.status === 'OPEN' && <span className="px-2 sm:px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest">Aberto</span>}
                                                </td>
                                                <td className="px-4 sm:px-6 py-4">
                                                    <button 
                                                        onClick={() => { setEditingLead(lead); setIsModalOpen(true); }}
                                                        className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                                                    >
                                                        <ChevronRight size={18} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'REPORTS' && (
                    <div className="absolute inset-0 overflow-y-auto custom-scrollbar p-4 sm:p-8">
                        <div className="p-6 sm:p-12 text-center bg-white rounded-[24px] sm:rounded-[40px] border border-slate-100 shadow-sm">
                            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <FileText size={32} className="sm:w-10 sm:h-10" />
                            </div>
                            <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight mb-2">Relatórios Estratégicos</h3>
                            <p className="text-slate-400 text-[11px] sm:text-sm font-medium mb-8 max-w-md mx-auto">Gere relatórios detalhados de performance da equipe, conversão por etapa e motivos de perda.</p>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
                                <button onClick={exportCSV} className="p-4 sm:p-6 bg-slate-50 rounded-2xl sm:rounded-3xl border border-slate-100 hover:border-indigo-200 transition-all group text-left">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm mb-4 group-hover:scale-110 transition-transform">
                                        <Download size={18} className="sm:w-5 sm:h-5" />
                                    </div>
                                    <h4 className="text-[10px] sm:text-xs font-black text-slate-800 uppercase tracking-widest mb-1">Exportar Leads</h4>
                                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase">Formato CSV</p>
                                </button>
                                <button className="p-4 sm:p-6 bg-slate-50 rounded-2xl sm:rounded-3xl border border-slate-100 hover:border-indigo-200 transition-all group text-left">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm mb-4 group-hover:scale-110 transition-transform">
                                        <TrendingUp size={18} className="sm:w-5 sm:h-5" />
                                    </div>
                                    <h4 className="text-[10px] sm:text-xs font-black text-slate-800 uppercase tracking-widest mb-1">Performance Time</h4>
                                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase">Conversão individual</p>
                                </button>
                                <button className="p-4 sm:p-6 bg-slate-50 rounded-2xl sm:rounded-3xl border border-slate-100 hover:border-indigo-200 transition-all group text-left">
                                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-xl flex items-center justify-center text-indigo-600 shadow-sm mb-4 group-hover:scale-110 transition-transform">
                                        <AlertCircle size={18} className="sm:w-5 sm:h-5" />
                                    </div>
                                    <h4 className="text-[10px] sm:text-xs font-black text-slate-800 uppercase tracking-widest mb-1">Motivos de Perda</h4>
                                    <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase">Análise de churn</p>
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* LEAD MODAL */}
            {isModalOpen && editingLead && (
                <LeadModal 
                    lead={editingLead}
                    onClose={() => { setIsModalOpen(false); setEditingLead(null); }}
                    onSave={handleSaveLead}
                    onDelete={handleDeleteLead}
                    users={users}
                    stages={stages}
                    lossReasons={lossReasons}
                    currentUser={currentUser}
                />
            )}
        </div>
    );
};
