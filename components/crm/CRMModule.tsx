
import React, { useState, useMemo, useEffect } from 'react';
import { Lead, PipelineStage, User, ConfirmOptions, LossReason, Client, Notification, BankAccount, FinancialCategory, FinancialTransaction } from '../../types';
import { 
    LayoutDashboard, Kanban, List, FileText, Settings, 
    Plus, Search, Filter, Download, Bell, 
    TrendingUp, Target, Users, DollarSign,
    ChevronRight, MoreVertical, Star, CheckCircle2,
    XCircle, AlertCircle, Clock, Calendar, Shield, HelpCircle, Save
} from 'lucide-react';
import { CRMDashboard } from './CRMDashboard';
import { CRMPipeline } from './CRMPipeline';
import { LeadModal } from './LeadModal';
import { Modal } from '../Modal';
import { saveClient, saveFinancialTransaction } from '../../services/supabaseService';

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
    addNotification: (data: any) => Promise<void>;
    openConfirm: (options: ConfirmOptions) => Promise<boolean>;
    selectedLeadId?: string | null;
    onClearSelectedLead?: () => void;
    onSaveLead?: (lead: Lead) => Promise<void>;
    onDeleteLead?: (id: string) => Promise<void>;
    bankAccounts?: BankAccount[];
    categories?: FinancialCategory[];
    onSaveTransaction?: (transaction: FinancialTransaction) => Promise<void>;
}

export const CRMModule: React.FC<CRMModuleProps> = ({ 
    leads, setLeads, stages, setStages, lossReasons, setLossReasons, 
    users, currentUser, clients, setClients, notifications, addNotification, openConfirm,
    selectedLeadId, onClearSelectedLead, onSaveLead, onDeleteLead,
    bankAccounts = [], categories = [], onSaveTransaction
}) => {
    const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'PIPELINE' | 'LIST' | 'REPORTS'>('PIPELINE');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLead, setEditingLead] = useState<Partial<Lead> | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [pipelineSearchTerm, setPipelineSearchTerm] = useState('');

    // Conversion states
    const [conversionLead, setConversionLead] = useState<Lead | null>(null);
    const [createClient, setCreateClient] = useState(true);
    const [isRecurring, setIsRecurring] = useState(false);
    const [contractValue, setContractValue] = useState(0);
    const [contractStartDate, setContractStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [clientLevel, setClientLevel] = useState<'BASIC' | 'INTERMEDIATE' | 'ADVANCED'>('BASIC');
    
    const [createFinance, setCreateFinance] = useState(true);
    const [financeDescription, setFinanceDescription] = useState('');
    const [financeAmount, setFinanceAmount] = useState(0);
    const [financeDate, setFinanceDate] = useState(new Date().toISOString().split('T')[0]);
    const [financeStatus, setFinanceStatus] = useState<'PENDING' | 'COMPLETED'>('PENDING');
    const [selectedBankAccount, setSelectedBankAccount] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');
    const [isConverting, setIsConverting] = useState(false);
    const [conversionError, setConversionError] = useState<string | null>(null);

    useEffect(() => {
        if (conversionLead) {
            setCreateClient(true);
            setIsRecurring(false);
            setContractValue(conversionLead.value || 0);
            setContractStartDate(new Date().toISOString().split('T')[0]);
            setClientLevel('BASIC');
            
            setCreateFinance((conversionLead.value || 0) > 0);
            setFinanceDescription(`Fechamento CRM - ${conversionLead.company || conversionLead.name}`);
            setFinanceAmount(conversionLead.value || 0);
            setFinanceDate(new Date().toISOString().split('T')[0]);
            setFinanceStatus('PENDING');
            
            if (bankAccounts && bankAccounts.length > 0) {
                setSelectedBankAccount(bankAccounts[0].id);
            } else {
                setSelectedBankAccount('');
            }
            
            if (categories && categories.length > 0) {
                const incomeCat = categories.find(c => c.type === 'INCOME' || c.type === 'BOTH');
                setSelectedCategory(incomeCat ? incomeCat.id : categories[0].id);
            } else {
                setSelectedCategory('');
            }
            setConversionError(null);
        }
    }, [conversionLead, bankAccounts, categories]);

    const handleExecuteConversion = async () => {
        if (!conversionLead) return;
        setIsConverting(true);
        setConversionError(null);
        
        try {
            let clientData: Client | null = null;
            
            // 1. Create and Save Client
            if (createClient) {
                const clientId = `client_${conversionLead.id}`;
                clientData = {
                    id: clientId,
                    name: conversionLead.company || conversionLead.name,
                    status: 'ACTIVE',
                    entryDate: contractStartDate,
                    responsibleId: conversionLead.responsibleId,
                    contact: {
                        name: conversionLead.name,
                        email: conversionLead.email || '',
                        phone: conversionLead.phone || '',
                        whatsapp: conversionLead.phone || ''
                    },
                    contacts: [
                        { name: conversionLead.name, email: conversionLead.email || '', phone: conversionLead.phone || '', role: 'Principal' }
                    ],
                    isRecurring: isRecurring,
                    level: clientLevel,
                    tags: conversionLead.tags || [],
                    internalNotes: `Cliente originado do CRM por conversão direta. Notas: ${conversionLead.notes || ''}`
                } as Client;
                
                if (isRecurring) {
                    clientData.monthlyValue = contractValue;
                    clientData.contractStartDate = contractStartDate;
                }
                
                const clientRes = await saveClient(clientData);
                if (!clientRes.success) {
                    throw new Error(clientRes.error?.message || 'Falha ao salvar cliente no banco de dados.');
                }
                
                setClients(prev => {
                    const exists = prev.find(c => c.id === clientId);
                    if (exists) return prev.map(c => c.id === clientId ? clientData! : c);
                    return [...prev, clientData!];
                });
            }
            
            // 2. Create and Save Financial Transaction
            if (createFinance) {
                const transactionId = `txn_${Date.now()}`;
                const newTxn: FinancialTransaction = {
                    id: transactionId,
                    description: financeDescription,
                    amount: financeAmount,
                    type: 'INCOME',
                    date: financeDate,
                    status: financeStatus,
                    categoryId: selectedCategory || null,
                    bankAccountId: selectedBankAccount || null,
                    clientId: clientData ? clientData.id : null,
                    responsibleId: conversionLead.responsibleId || currentUser.id,
                    createdAt: Date.now()
                } as any;
                
                if (onSaveTransaction) {
                    await onSaveTransaction(newTxn);
                } else {
                    const financeRes = await saveFinancialTransaction(newTxn);
                    if (!financeRes.success) {
                        throw new Error(financeRes.error?.message || 'Falha ao salvar transação financeira no banco de dados.');
                    }
                }
            }
            
            // 3. Notify success
            addNotification({
                title: 'Conversão Realizada! 🚀',
                message: `Lead ${conversionLead.company || conversionLead.name} convertido com sucesso!`,
                type: 'SUCCESS',
                priority: 'HIGH',
                originModule: 'CRM',
                targetUserId: currentUser.id,
                navToView: 'clients',
                metadata: { referenceId: conversionLead.id, module: 'leads' }
            });
            
            // Close conversion modal
            setConversionLead(null);
        } catch (error: any) {
            console.error('Erro na conversão direta:', error);
            setConversionError(error.message || 'Erro inesperado ao realizar conversão.');
        } finally {
            setIsConverting(false);
        }
    };

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
                                addNotification({
                                    id: `overdue_${task.id}`,
                                    title: 'Tarefa Atrasada',
                                    message: `Tarefa atrasada: ${task.text} (Lead: ${lead.company})`,
                                    type: 'ALERT',
                                    priority: 'HIGH',
                                    originModule: 'CRM',
                                    targetUserId: currentUser.id,
                                    navToView: 'crm',
                                    metadata: { referenceId: lead.id, taskId: task.id, module: 'leads' }
                                });
                            }
                            // Task in 1 hour
                            else if (diff > 0 && diff < oneHour && !notifications.find(n => n.id === `soon_${task.id}`)) {
                                addNotification({
                                    id: `soon_${task.id}`,
                                    title: 'Tarefa em Breve',
                                    message: `Tarefa em 1h: ${task.text} (Lead: ${lead.company})`,
                                    type: 'INFO',
                                    priority: 'MEDIUM',
                                    originModule: 'CRM',
                                    targetUserId: currentUser.id,
                                    navToView: 'crm',
                                    metadata: { referenceId: lead.id, taskId: task.id, module: 'leads' }
                                });
                            }
                        }
                    });

                    // Lead without contact for 3 days
                    const lastContact = lead.lastContact ? new Date(lead.lastContact).getTime() : lead.createdAt;
                    if (now - lastContact > oneDay * 3 && lead.status === 'OPEN' && !notifications.find(n => n.id === `nocontact_${lead.id}`)) {
                        addNotification({
                            id: `nocontact_${lead.id}`,
                            title: 'Lead sem Contato',
                            message: `Lead sem contato há mais de 3 dias: ${lead.company}`,
                            type: 'WARNING',
                            priority: 'MEDIUM',
                            originModule: 'CRM',
                            targetUserId: currentUser.id,
                            navToView: 'crm',
                            metadata: { referenceId: lead.id, module: 'leads' }
                        });
                    }
                }
            });
        };

        checkTasks();
        const interval = setInterval(checkTasks, 60000); // Check every minute
        return () => clearInterval(interval);
    }, [leads, currentUser, notifications, addNotification]);

    // Access Control Logic
    const visibleLeads = useMemo(() => {
        if (currentUser.role === 'ADMIN') return leads;
        
        if (currentUser.role === 'MANAGER') {
            // Manager sees all leads from their team/squad members
            return leads.filter(l => {
                const isResponsible = l.responsibleId === currentUser.id;
                const isCreator = l.createdBy === currentUser.id;
                const responsibleUser = users.find(u => u.id === l.responsibleId);
                const isInMySquad = responsibleUser?.squad === currentUser.squad && currentUser.squad !== '';
                
                return isResponsible || isCreator || isInMySquad;
            });
        }

        if (currentUser.role === 'EMPLOYEE' || currentUser.role === 'COMMERCIAL' || currentUser.role === 'FREELANCER') {
            // Commercial/Employee sees only leads they are responsible for OR that they created
            return leads.filter(l => l.responsibleId === currentUser.id || l.createdBy === currentUser.id);
        }
        
        return [];
    }, [leads, currentUser, users]);

    const handleSaveLead = async (lead: Lead) => {
        const isNew = !leads.find(l => l.id === lead.id);
        
        if (onSaveLead) {
            await onSaveLead(lead);
        } else {
            if (isNew) {
                setLeads(prev => [...prev, lead]);
            } else {
                setLeads(prev => prev.map(l => l.id === lead.id ? lead : l));
            }
        }

        if (isNew) {
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
                addNotification({
                    title: 'Novo Lead',
                    message: `Um novo lead foi cadastrado: ${lead.company}`,
                    type: 'INFO',
                    priority: 'MEDIUM',
                    originModule: 'CRM',
                    targetUserId: lead.responsibleId,
                    navToView: 'crm',
                    metadata: { referenceId: lead.id, module: 'leads' }
                });
            }
        } else {
            setLeads(prev => prev.map(l => l.id === lead.id ? lead : l));
        }

        // Check if WON to open the Direct Conversion Wizard
        if (lead.status === 'WON') {
            const previousLead = leads.find(l => l.id === lead.id);
            const becameWon = !previousLead || previousLead.status !== 'WON';
            if (becameWon) {
                setConversionLead(lead);
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
            if (onDeleteLead) {
                await onDeleteLead(id);
            } else {
                setLeads(prev => prev.filter(l => l.id !== id));
            }
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
                            onSaveLead={onSaveLead}
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
                                                    <span className="text-xs sm:text-sm font-black text-slate-800">R$ {(lead.value || 0).toLocaleString()}</span>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4">
                                                    <span className="px-2 sm:px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest">
                                                        {stages.find(s => s.id === lead.stageId)?.label || lead.stageId}
                                                    </span>
                                                </td>
                                                <td className="px-4 sm:px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-slate-100 overflow-hidden">
                                                            <img src={users.find(u => u.id === lead.responsibleId)?.avatar || 'https://via.placeholder.com/150'} alt="" className="w-full h-full object-cover" />
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

            {/* DIRECT CONVERSION WIZARD MODAL */}
            {conversionLead && (
                <Modal
                    isOpen={!!conversionLead}
                    onClose={() => setConversionLead(null)}
                    title="Conversão de Lead em Cliente / Contrato"
                    maxWidth="600px"
                >
                    <div className="p-1 text-slate-800 space-y-6">
                        {/* Heading summary */}
                        <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100 flex items-start gap-4 animate-in fade-in duration-300">
                            <div className="p-3 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/10 shrink-0">
                                <DollarSign size={20} />
                            </div>
                            <div>
                                <h4 className="text-xs font-black uppercase text-indigo-900 tracking-wider">Negócio Fechado com Sucesso! 🎉</h4>
                                <p className="text-xs text-indigo-700/80 font-semibold mt-0.5">
                                    O lead <strong className="text-indigo-900 font-extrabold">{conversionLead.company || conversionLead.name}</strong> com valor previsto de <strong className="text-indigo-900 font-extrabold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(conversionLead.value || 0)}</strong> foi marcado como Ganho. Escolha as ações de conversão direta abaixo.
                                </p>
                            </div>
                        </div>

                        {conversionError && (
                            <div className="bg-red-50 text-red-700 p-3.5 rounded-2xl border border-red-100 flex items-center gap-3 text-xs font-bold uppercase tracking-wide">
                                <AlertCircle size={16} className="shrink-0" />
                                <span>{conversionError}</span>
                            </div>
                        )}

                        <div className="space-y-5">
                            {/* ACTION 1: CREATE CLIENT / CONTRACT */}
                            <div className="border border-slate-100 rounded-2xl p-5 space-y-4 hover:border-slate-200 transition-all">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="chkClient"
                                            checked={createClient}
                                            onChange={(e) => setCreateClient(e.target.checked)}
                                            className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                        />
                                        <label htmlFor="chkClient" className="text-xs font-black uppercase tracking-wider text-slate-700 cursor-pointer flex items-center gap-1.5 select-none">
                                            <Users size={14} className="text-slate-400" /> Converter em Cliente
                                        </label>
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">Automático</span>
                                </div>

                                {createClient && (
                                    <div className="pl-6 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 animate-in fade-in duration-200">
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Nome / Empresa</label>
                                            <input
                                                type="text"
                                                className="w-full bg-slate-50 border border-transparent rounded-xl p-3 text-xs font-bold outline-none"
                                                value={conversionLead.company || conversionLead.name}
                                                disabled
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Contato Principal</label>
                                            <input
                                                type="text"
                                                className="w-full bg-slate-50 border border-transparent rounded-xl p-3 text-xs font-bold outline-none"
                                                value={conversionLead.name}
                                                disabled
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Plano / Nível</label>
                                            <select
                                                className="w-full bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-500 rounded-xl p-3 text-xs font-bold outline-none transition-all"
                                                value={clientLevel}
                                                onChange={(e) => setClientLevel(e.target.value as any)}
                                            >
                                                <option value="BASIC">Básico (BASIC)</option>
                                                <option value="INTERMEDIATE">Intermediário (INTERMEDIATE)</option>
                                                <option value="ADVANCED">Avançado (ADVANCED)</option>
                                            </select>
                                        </div>

                                        <div className="sm:col-span-2 pt-2 border-t border-slate-50">
                                            <div className="flex items-center gap-2 mb-3">
                                                <input
                                                    type="checkbox"
                                                    id="chkRecurring"
                                                    checked={isRecurring}
                                                    onChange={(e) => setIsRecurring(e.target.checked)}
                                                    className="w-3.5 h-3.5 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                                />
                                                <label htmlFor="chkRecurring" className="text-[10px] font-black uppercase tracking-wider text-slate-600 cursor-pointer select-none">
                                                    Este será um contrato de receita recorrente (Contrato Mensal)
                                                </label>
                                            </div>

                                            {isRecurring && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-top-1 duration-200">
                                                    <div>
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Valor Mensal (R$)</label>
                                                        <input
                                                            type="number"
                                                            className="w-full bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-500 rounded-xl p-3 text-xs font-bold outline-none transition-all"
                                                            value={contractValue}
                                                            onChange={(e) => setContractValue(Number(e.target.value))}
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Data Inicial do Contrato</label>
                                                        <input
                                                            type="date"
                                                            className="w-full bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-500 rounded-xl p-3 text-xs font-bold outline-none transition-all"
                                                            value={contractStartDate}
                                                            onChange={(e) => setContractStartDate(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* ACTION 2: FINANCE MODULE ENTRY */}
                            <div className="border border-slate-100 rounded-2xl p-5 space-y-4 hover:border-slate-200 transition-all">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="chkFinance"
                                        checked={createFinance}
                                        onChange={(e) => setCreateFinance(e.target.checked)}
                                        className="w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500"
                                    />
                                    <label htmlFor="chkFinance" className="text-xs font-black uppercase tracking-wider text-slate-700 cursor-pointer flex items-center gap-1.5 select-none">
                                        <DollarSign size={14} className="text-slate-400" /> Registrar Entrada Financeira (Módulo Financeiro)
                                    </label>
                                </div>

                                {createFinance && (
                                    <div className="pl-6 grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1 animate-in fade-in duration-200">
                                        <div className="sm:col-span-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Descrição do Lançamento</label>
                                            <input
                                                type="text"
                                                className="w-full bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-500 rounded-xl p-3 text-xs font-bold outline-none transition-all"
                                                value={financeDescription}
                                                onChange={(e) => setFinanceDescription(e.target.value)}
                                                placeholder="Lançamento financeiro..."
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Valor do Lançamento (R$)</label>
                                            <input
                                                type="number"
                                                className="w-full bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-500 rounded-xl p-3 text-xs font-bold outline-none transition-all"
                                                value={financeAmount}
                                                onChange={(e) => setFinanceAmount(Number(e.target.value))}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Data do Pagamento/Vencimento</label>
                                            <input
                                                type="date"
                                                className="w-full bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-500 rounded-xl p-3 text-xs font-bold outline-none transition-all"
                                                value={financeDate}
                                                onChange={(e) => setFinanceDate(e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Status da Entrada</label>
                                            <select
                                                className="w-full bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-500 rounded-xl p-3 text-xs font-bold outline-none transition-all"
                                                value={financeStatus}
                                                onChange={(e) => setFinanceStatus(e.target.value as any)}
                                            >
                                                <option value="PENDING">A Receber (Não Pago)</option>
                                                <option value="COMPLETED">Recebido (Liquidado)</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Conta de Destino / Caixa</label>
                                            <select
                                                className="w-full bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-500 rounded-xl p-3 text-xs font-bold outline-none transition-all"
                                                value={selectedBankAccount}
                                                onChange={(e) => setSelectedBankAccount(e.target.value)}
                                            >
                                                <option value="">Nenhuma Conta Integrada</option>
                                                {bankAccounts.map(account => (
                                                    <option key={account.id} value={account.id}>
                                                        {account.name} (Saldo: {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(account.balance)})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="sm:col-span-2">
                                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Categoria Financeira</label>
                                            <select
                                                className="w-full bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-500 rounded-xl p-3 text-xs font-bold outline-none transition-all"
                                                value={selectedCategory}
                                                onChange={(e) => setSelectedCategory(e.target.value)}
                                            >
                                                <option value="">Sem Categoria</option>
                                                {categories.filter(c => c.type === 'INCOME' || c.type === 'BOTH').map(category => (
                                                    <option key={category.id} value={category.id}>
                                                        {category.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Modal Footer actions */}
                        <div className="pt-4 border-t border-slate-50 flex gap-3 justify-end">
                            <button
                                onClick={() => setConversionLead(null)}
                                className="px-5 py-2.5 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-600 transition-colors"
                            >
                                Descartar Conversão
                            </button>
                            <button
                                onClick={handleExecuteConversion}
                                disabled={isConverting || (!createClient && !createFinance)}
                                className="px-7 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[10px] sm:text-xs uppercase tracking-widest shadow-xl shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isConverting ? (
                                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0"></div>
                                ) : (
                                    <Save size={16} className="shrink-0" />
                                )}
                                {isConverting ? 'Convertendo...' : 'Confirmar Conversão'}
                            </button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};
