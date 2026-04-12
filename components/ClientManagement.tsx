import React, { useState, useMemo } from 'react';
import { Modal } from './Modal';
import { Client, Squad, AgencyService, User, ConfirmOptions, Task, Requisition, PasswordEntry } from '../types';
import { 
    Plus, Edit2, Trash2, Folder, FileText, Calendar, Mail, Phone, ExternalLink, 
    Search, DollarSign, Users, Briefcase, User as UserIcon, Star, Link, Shield, 
    X, Check, ShoppingBag, Key, Lock, Unlock, AlertCircle, Ban, Power, 
    LayoutDashboard, ClipboardList, History, HardDrive, Eye, EyeOff, 
    MessageSquare, Tag, Building2, Globe, Hash, UserCheck, CreditCard, Info, ListChecks
} from 'lucide-react';

interface ClientManagementProps {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  squads: Squad[];
  services: AgencyService[];
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  openConfirm: (options: ConfirmOptions) => Promise<boolean>;
  tasks: Task[];
  requisitions: Requisition[];
  currentUser: User;
  onSaveClient?: (client: Client) => Promise<void>;
  onDeleteClient?: (id: string) => Promise<void>;
}

export const ClientManagement: React.FC<ClientManagementProps> = ({ 
    clients, setClients, squads, services, users, setUsers, openConfirm, tasks, requisitions, currentUser,
    onSaveClient, onDeleteClient
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingClient, setViewingClient] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'CONTACTS' | 'SERVICES' | 'PASSWORDS' | 'DOCS' | 'INTERNAL'>('GENERAL');
  const [activeViewTab, setActiveViewTab] = useState<'SUMMARY' | 'SERVICES' | 'REQUISITIONS' | 'TASKS' | 'HISTORY' | 'FILES' | 'PASSWORDS'>('SUMMARY');

  const [editingClient, setEditingClient] = useState<Partial<Client>>({});
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const isAdmin = currentUser.role === 'ADMIN';
  const isManager = currentUser.role === 'MANAGER';
  const isFinance = currentUser.role === 'FINANCE';
  const canManageAccess = isAdmin || isManager || isFinance;

  // Filter clients based on role
  const filteredClients = useMemo(() => {
    let base = clients;
    if (currentUser.role === 'EMPLOYEE' || currentUser.role === 'FREELANCER') {
        base = clients.filter(c => c.responsibleId === currentUser.id || squads.find(s => s.id === c.squadId)?.members.includes(currentUser.id));
    }
    return base.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.legalName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [clients, searchTerm, currentUser, squads]);

  const handleSave = async () => {
      if (!editingClient.name?.trim()) {
          alert("Nome/Empresa é obrigatório.");
          return;
      }
      
      const clientToSave = editingClient.id ? { ...clients.find(c => c.id === editingClient.id), ...editingClient } as Client : {
          ...editingClient,
          id: Date.now().toString(),
          status: editingClient.status || 'ACTIVE',
          isRecurring: editingClient.isRecurring || false,
          level: editingClient.level || 'BASIC',
          contacts: editingClient.contacts || [],
          passwords: editingClient.passwords || [],
          passwordLogs: editingClient.passwordLogs || [],
          documentationLinks: editingClient.documentationLinks || [],
          tags: editingClient.tags || [],
          systemAccesses: editingClient.systemAccesses || [],
          entryDate: editingClient.entryDate || new Date().toISOString().split('T')[0]
      } as Client;

      if (onSaveClient) {
          await onSaveClient(clientToSave);
      } else {
          if (editingClient.id) {
              setClients(prev => prev.map(c => c.id === editingClient.id ? clientToSave : c));
          } else {
              setClients(prev => [...prev, clientToSave]);
          }
      }
      setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
      const confirmed = await openConfirm({
          title: 'Excluir Cliente',
          description: 'Tem certeza que deseja excluir este cliente? Esta ação não pode ser desfeita.',
          confirmText: 'Excluir',
          variant: 'danger'
      });

      if (confirmed) {
          if (onDeleteClient) {
              await onDeleteClient(id);
          } else {
              setClients(prev => prev.filter(c => c.id !== id));
          }
          setViewingClient(null);
      }
  };

  const togglePassword = (passwordId: string, platform: string) => {
      if (currentUser.role === 'FREELANCER') return;

      setVisiblePasswords(prev => ({ ...prev, [passwordId]: !prev[passwordId] }));
      
      // Log the view
      if (!visiblePasswords[passwordId] && viewingClient) {
          const log = {
              id: Date.now().toString(),
              userId: currentUser.id,
              timestamp: Date.now(),
              platform
          };
          setClients(prev => prev.map(c => c.id === viewingClient.id ? {
              ...c,
              passwordLogs: [...(c.passwordLogs || []), log]
          } : c));
      }

      // Auto-hide after 30 seconds
      if (!visiblePasswords[passwordId]) {
          setTimeout(() => {
              setVisiblePasswords(prev => ({ ...prev, [passwordId]: false }));
          }, 30000);
      }
  };

  const getClientTasks = (clientId: string) => tasks.filter(t => t.clientId === clientId);
  const getClientRequisitions = (clientId: string) => requisitions.filter(r => r.clientId === clientId);

  return (
    <div className="space-y-6 h-full flex flex-col overflow-hidden">
        {/* HEADER / FILTERS */}
        <div className="flex flex-wrap justify-between items-center bg-white p-4 rounded-2xl border border-slate-200 shadow-sm gap-4 shrink-0">
            <div className="flex items-center gap-4 flex-1 min-w-[300px]">
                <div className="relative flex-1">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                    <input 
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border-transparent focus:bg-white focus:border-pink-200 rounded-xl text-sm font-bold outline-none transition-all" 
                        placeholder="Buscar cliente por nome ou razão social..." 
                        value={searchTerm} 
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>
            <button 
                onClick={() => { 
                    setEditingClient({ status: 'ACTIVE', level: 'BASIC', isRecurring: true, systemAccesses: [] }); 
                    setActiveTab('GENERAL');
                    setIsModalOpen(true); 
                }} 
                className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 text-xs font-black uppercase tracking-widest shadow-lg transition-all active:scale-95"
            >
                <Plus size={18} strokeWidth={3} /> Novo Cliente
            </button>
        </div>

        {/* CLIENT GRID */}
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredClients.map(client => (
                    <div 
                        key={client.id} 
                        onClick={() => { setViewingClient(client); setActiveViewTab('SUMMARY'); }}
                        className="bg-white rounded-[32px] border border-slate-100 shadow-sm hover:shadow-xl hover:border-pink-100 transition-all cursor-pointer group flex flex-col overflow-hidden"
                    >
                        <div className="p-6 flex-1">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                    client.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                    client.status === 'LEAD' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                    'bg-slate-50 text-slate-500 border border-slate-100'
                                }`}>
                                    {client.status}
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setEditingClient({ ...client, systemAccesses: client.systemAccesses || [] }); setActiveTab('GENERAL'); setIsModalOpen(true); }} 
                                        className="p-2 bg-slate-50 hover:bg-indigo-50 text-slate-400 hover:text-indigo-600 rounded-xl transition-all"
                                    >
                                        <Edit2 size={14}/>
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleDelete(client.id); }} 
                                        className="p-2 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-xl transition-all"
                                    >
                                        <Trash2 size={14}/>
                                    </button>
                                </div>
                            </div>
                            
                            <h3 className="font-black text-slate-800 text-lg leading-tight mb-1 group-hover:text-pink-600 transition-colors">{client.name}</h3>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">{client.legalName || 'Razão Social não inf.'}</p>
                            
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <UserCheck size={14} className="text-slate-300"/>
                                    <span className="text-[11px] font-bold">{users.find(u => u.id === client.responsibleId)?.name || 'Sem responsável'}</span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Users size={14} className="text-slate-300"/>
                                    <span className="text-[11px] font-bold">{squads.find(s => s.id === client.squadId)?.name || 'Sem squad'}</span>
                                </div>
                            </div>
                        </div>
                        
                        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center text-[8px] font-black text-slate-500">
                                        {i}
                                    </div>
                                ))}
                            </div>
                            <div className="flex items-center gap-1 text-pink-600 font-black text-xs">
                                <span className="text-[10px] text-slate-400">R$</span>
                                {client.monthlyValue?.toLocaleString() || '0'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* REGISTRATION MODAL */}
        {isModalOpen && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[99999] flex items-center justify-center p-4 transition-all duration-300" onClick={() => setIsModalOpen(false)}>
                <div className="bg-white rounded-[32px] w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-pop border border-slate-100" onClick={e => e.stopPropagation()}>
                    <div className="p-6 border-b border-slate-50 flex justify-between items-center bg-slate-50 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 bg-pink-600 text-white rounded-2xl shadow-lg shadow-pink-200">
                                <Building2 size={20}/>
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter leading-none">
                                    {editingClient.id ? 'Editar Cliente' : 'Novo Cliente'}
                                </h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Preencha os dados do parceiro</p>
                            </div>
                        </div>
                        <button onClick={() => setIsModalOpen(false)} className="p-2 text-slate-300 hover:bg-slate-100 rounded-full transition-colors"><X size={24}/></button>
                    </div>

                    <div className="flex flex-1 overflow-hidden">
                        {/* SIDE TABS */}
                        <div className="w-48 bg-slate-50 border-r border-slate-100 p-4 space-y-2 shrink-0">
                            <button onClick={() => setActiveTab('GENERAL')} className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'GENERAL' ? 'bg-white text-pink-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:bg-white/50'}`}>
                                <Info size={16}/> Dados Gerais
                            </button>
                            <button onClick={() => setActiveTab('CONTACTS')} className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'CONTACTS' ? 'bg-white text-pink-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:bg-white/50'}`}>
                                <Phone size={16}/> Contatos
                            </button>
                            <button onClick={() => setActiveTab('SERVICES')} className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'SERVICES' ? 'bg-white text-pink-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:bg-white/50'}`}>
                                <ShoppingBag size={16}/> Serviços
                            </button>
                            <button onClick={() => setActiveTab('PASSWORDS')} className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'PASSWORDS' ? 'bg-white text-pink-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:bg-white/50'}`}>
                                <Key size={16}/> Senhas
                            </button>
                            <button onClick={() => setActiveTab('DOCS')} className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'DOCS' ? 'bg-white text-pink-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:bg-white/50'}`}>
                                <Folder size={16}/> Docs
                            </button>
                            <button onClick={() => setActiveTab('INTERNAL')} className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${activeTab === 'INTERNAL' ? 'bg-white text-pink-600 shadow-sm ring-1 ring-slate-200' : 'text-slate-400 hover:bg-white/50'}`}>
                                <Shield size={16}/> Acessos / Interno
                            </button>
                        </div>

                        {/* CONTENT AREA */}
                        <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
                            {activeTab === 'GENERAL' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="col-span-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Nome / Empresa</label>
                                            <input className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-pink-200 rounded-2xl p-4 text-sm font-bold outline-none transition-all" placeholder="Ex: Agência Chan OS" value={editingClient.name || ''} onChange={e => setEditingClient({...editingClient, name: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Razão Social</label>
                                            <input className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-pink-200 rounded-2xl p-4 text-sm font-bold outline-none transition-all" placeholder="Razão Social completa" value={editingClient.legalName || ''} onChange={e => setEditingClient({...editingClient, legalName: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">CNPJ / CPF</label>
                                            <input className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-pink-200 rounded-2xl p-4 text-sm font-bold outline-none transition-all" placeholder="00.000.000/0001-00" value={editingClient.document || ''} onChange={e => setEditingClient({...editingClient, document: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Status</label>
                                            <select className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-pink-200 rounded-2xl p-4 text-sm font-bold outline-none transition-all appearance-none" value={editingClient.status} onChange={e => setEditingClient({...editingClient, status: e.target.value as any})}>
                                                <option value="LEAD">Lead</option>
                                                <option value="ACTIVE">Ativo</option>
                                                <option value="INACTIVE">Inativo</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Data de Entrada</label>
                                            <input type="date" className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-pink-200 rounded-2xl p-4 text-sm font-bold outline-none transition-all" value={editingClient.entryDate || ''} onChange={e => setEditingClient({...editingClient, entryDate: e.target.value})} />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Responsável Interno</label>
                                            <select className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-pink-200 rounded-2xl p-4 text-sm font-bold outline-none transition-all appearance-none" value={editingClient.responsibleId || ''} onChange={e => setEditingClient({...editingClient, responsibleId: e.target.value})}>
                                                <option value="">Selecione...</option>
                                                {users.filter(u => u.role !== 'CLIENT').map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Squad</label>
                                            <select className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-pink-200 rounded-2xl p-4 text-sm font-bold outline-none transition-all appearance-none" value={editingClient.squadId || ''} onChange={e => setEditingClient({...editingClient, squadId: e.target.value})}>
                                                <option value="">Selecione...</option>
                                                {squads.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Valor Mensal (Fee)</label>
                                            <div className="relative">
                                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">R$</span>
                                                <input 
                                                    type="number" 
                                                    className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-pink-200 rounded-2xl pl-10 pr-4 py-4 text-sm font-bold outline-none transition-all" 
                                                    placeholder="0,00" 
                                                    value={editingClient.monthlyValue || ''} 
                                                    onChange={e => setEditingClient({...editingClient, monthlyValue: parseFloat(e.target.value)})} 
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {activeTab === 'CONTACTS' && (
                                <div className="space-y-8">
                                    <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100">
                                        <h4 className="text-[10px] font-black text-pink-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><Phone size={14}/> Contato Principal</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2">
                                                <input className="w-full bg-white border-2 border-transparent focus:border-pink-200 rounded-xl p-3 text-sm font-bold outline-none transition-all" placeholder="Nome do Contato" value={editingClient.contact?.name || ''} onChange={e => setEditingClient({...editingClient, contact: {...(editingClient.contact || {name:'', email:'', phone:'', whatsapp:''}), name: e.target.value}})} />
                                            </div>
                                            <input className="w-full bg-white border-2 border-transparent focus:border-pink-200 rounded-xl p-3 text-sm font-bold outline-none transition-all" placeholder="Email" value={editingClient.contact?.email || ''} onChange={e => setEditingClient({...editingClient, contact: {...(editingClient.contact || {name:'', email:'', phone:'', whatsapp:''}), email: e.target.value}})} />
                                            <input className="w-full bg-white border-2 border-transparent focus:border-pink-200 rounded-xl p-3 text-sm font-bold outline-none transition-all" placeholder="Telefone" value={editingClient.contact?.phone || ''} onChange={e => setEditingClient({...editingClient, contact: {...(editingClient.contact || {name:'', email:'', phone:'', whatsapp:''}), phone: e.target.value}})} />
                                        </div>
                                    </div>

                                    <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-100">
                                        <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><CreditCard size={14}/> Contato Financeiro</h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="col-span-2">
                                                <input className="w-full bg-white border-2 border-transparent focus:border-pink-200 rounded-xl p-3 text-sm font-bold outline-none transition-all" placeholder="Nome do Contato Financeiro" value={editingClient.financialContact?.name || ''} onChange={e => setEditingClient({...editingClient, financialContact: {...(editingClient.financialContact || {name:'', email:'', phone:''}), name: e.target.value}})} />
                                            </div>
                                            <input className="w-full bg-white border-2 border-transparent focus:border-pink-200 rounded-xl p-3 text-sm font-bold outline-none transition-all" placeholder="Email Financeiro" value={editingClient.financialContact?.email || ''} onChange={e => setEditingClient({...editingClient, financialContact: {...(editingClient.financialContact || {name:'', email:'', phone:''}), email: e.target.value}})} />
                                            <input className="w-full bg-white border-2 border-transparent focus:border-pink-200 rounded-xl p-3 text-sm font-bold outline-none transition-all" placeholder="Telefone / WhatsApp" value={editingClient.financialContact?.phone || ''} onChange={e => setEditingClient({...editingClient, financialContact: {...(editingClient.financialContact || {name:'', email:'', phone:''}), phone: e.target.value}})} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'SERVICES' && (
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Serviços Contratados</h4>
                                    <div className="grid grid-cols-1 gap-3">
                                        {services.map(service => (
                                            <button
                                                key={service.id}
                                                onClick={() => {
                                                    const currentIds = editingClient.serviceIds || [];
                                                    const newIds = currentIds.includes(service.id)
                                                        ? currentIds.filter(id => id !== service.id)
                                                        : [...currentIds, service.id];
                                                    setEditingClient({ ...editingClient, serviceIds: newIds });
                                                }}
                                                className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                                                    (editingClient.serviceIds || []).includes(service.id)
                                                        ? 'border-pink-200 bg-pink-50/50'
                                                        : 'border-slate-100 hover:border-slate-200'
                                                }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                                        (editingClient.serviceIds || []).includes(service.id) ? 'bg-pink-600 text-white' : 'bg-slate-100 text-slate-400'
                                                    }`}>
                                                        <ShoppingBag size={18} />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-800">{service.name}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{service.category}</p>
                                                    </div>
                                                </div>
                                                {(editingClient.serviceIds || []).includes(service.id) && (
                                                    <div className="w-6 h-6 bg-pink-600 text-white rounded-full flex items-center justify-center">
                                                        <Check size={14} strokeWidth={3} />
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'PASSWORDS' && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Banco de Senhas</h4>
                                        <button 
                                            onClick={() => setEditingClient({...editingClient, passwords: [...(editingClient.passwords || []), { id: Date.now().toString(), platform: '', login: '', password: '', link: '', observations: '' }]})}
                                            className="text-[10px] font-black text-pink-600 uppercase tracking-widest hover:bg-pink-50 px-3 py-1.5 rounded-lg transition-all"
                                        >
                                            + Adicionar Plataforma
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        {(editingClient.passwords || []).map((p, idx) => (
                                            <div key={p.id} className="bg-slate-50 p-6 rounded-[24px] border border-slate-100 relative group">
                                                <button 
                                                    onClick={() => setEditingClient({...editingClient, passwords: editingClient.passwords?.filter(x => x.id !== p.id)})}
                                                    className="absolute top-4 right-4 p-1.5 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                                >
                                                    <Trash2 size={14}/>
                                                </button>
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="col-span-2">
                                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 block ml-1">Plataforma</label>
                                                        <input className="w-full bg-white border-2 border-transparent focus:border-pink-200 rounded-xl p-3 text-sm font-bold outline-none transition-all" placeholder="Ex: Facebook Ads" value={p.platform} onChange={e => {
                                                            const newPass = [...(editingClient.passwords || [])];
                                                            newPass[idx].platform = e.target.value;
                                                            setEditingClient({...editingClient, passwords: newPass});
                                                        }} />
                                                    </div>
                                                    <div>
                                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 block ml-1">Login / Usuário</label>
                                                        <input className="w-full bg-white border-2 border-transparent focus:border-pink-200 rounded-xl p-3 text-sm font-bold outline-none transition-all" placeholder="Login" value={p.login} onChange={e => {
                                                            const newPass = [...(editingClient.passwords || [])];
                                                            newPass[idx].login = e.target.value;
                                                            setEditingClient({...editingClient, passwords: newPass});
                                                        }} />
                                                    </div>
                                                    <div>
                                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 block ml-1">Senha</label>
                                                        <input className="w-full bg-white border-2 border-transparent focus:border-pink-200 rounded-xl p-3 text-sm font-bold outline-none transition-all" placeholder="Senha" value={p.password} onChange={e => {
                                                            const newPass = [...(editingClient.passwords || [])];
                                                            newPass[idx].password = e.target.value;
                                                            setEditingClient({...editingClient, passwords: newPass});
                                                        }} />
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 block ml-1">Link da Plataforma</label>
                                                        <div className="relative">
                                                            <Link size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300"/>
                                                            <input className="w-full bg-white border-2 border-transparent focus:border-pink-200 rounded-xl pl-10 pr-3 py-3 text-sm font-bold outline-none transition-all" placeholder="https://..." value={p.link || ''} onChange={e => {
                                                                const newPass = [...(editingClient.passwords || [])];
                                                                newPass[idx].link = e.target.value;
                                                                setEditingClient({...editingClient, passwords: newPass});
                                                            }} />
                                                        </div>
                                                    </div>
                                                    <div className="col-span-2">
                                                        <label className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1 block ml-1">Observações</label>
                                                        <textarea className="w-full bg-white border-2 border-transparent focus:border-pink-200 rounded-xl p-3 text-sm font-bold outline-none transition-all h-20 resize-none" placeholder="Detalhes adicionais..." value={p.observations || ''} onChange={e => {
                                                            const newPass = [...(editingClient.passwords || [])];
                                                            newPass[idx].observations = e.target.value;
                                                            setEditingClient({...editingClient, passwords: newPass});
                                                        }} />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'DOCS' && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Documentação</h4>
                                        <button 
                                            onClick={() => setEditingClient({...editingClient, documentationLinks: [...(editingClient.documentationLinks || []), '']})}
                                            className="text-[10px] font-black text-pink-600 uppercase tracking-widest hover:bg-pink-50 px-3 py-1.5 rounded-lg transition-all"
                                        >
                                            + Adicionar Link
                                        </button>
                                    </div>
                                    <div className="space-y-3">
                                        {(editingClient.documentationLinks || []).map((link, idx) => (
                                            <div key={idx} className="flex gap-2">
                                                <div className="flex-1 relative">
                                                    <Globe size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"/>
                                                    <input className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-pink-200 rounded-xl pl-11 pr-4 py-3 text-sm font-bold outline-none transition-all" placeholder="Link do Google Drive / Notion / etc" value={link} onChange={e => {
                                                        const newLinks = [...(editingClient.documentationLinks || [])];
                                                        newLinks[idx] = e.target.value;
                                                        setEditingClient({...editingClient, documentationLinks: newLinks});
                                                    }} />
                                                </div>
                                                <button 
                                                    onClick={() => setEditingClient({...editingClient, documentationLinks: editingClient.documentationLinks?.filter((_, i) => i !== idx)})}
                                                    className="p-3 text-slate-300 hover:text-red-500 transition-colors"
                                                >
                                                    <Trash2 size={18}/>
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'INTERNAL' && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Classificação</label>
                                            <div className="flex gap-2">
                                                {['A', 'B', 'C'].map(c => (
                                                    <button 
                                                        key={c}
                                                        onClick={() => setEditingClient({...editingClient, classification: c as any})}
                                                        className={`flex-1 py-3 rounded-xl font-black text-sm transition-all ${editingClient.classification === c ? 'bg-pink-600 text-white shadow-lg shadow-pink-200' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                                    >
                                                        {c}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Tags (Separadas por vírgula)</label>
                                            <input className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-pink-200 rounded-2xl p-4 text-sm font-bold outline-none transition-all" placeholder="SaaS, B2B, High Ticket..." value={editingClient.tags?.join(', ') || ''} onChange={e => setEditingClient({...editingClient, tags: e.target.value.split(',').map(t => t.trim())})} />
                                        </div>
                                        <div className="col-span-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Observações Internas</label>
                                            <textarea className="w-full bg-slate-50 border-2 border-transparent focus:bg-white focus:border-pink-200 rounded-2xl p-4 text-sm font-bold outline-none transition-all h-32 resize-none" placeholder="Notas estratégicas sobre o cliente..." value={editingClient.internalNotes || ''} onChange={e => setEditingClient({...editingClient, internalNotes: e.target.value})} />
                                        </div>
                                    </div>

                                    {canManageAccess && (
                                        <div className="pt-6 border-t border-slate-100">
                                            <div className="flex justify-between items-center mb-2">
                                                <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2"><Shield size={14} className="text-pink-600"/> Acessos ao Sistema</h4>
                                                <button 
                                                    onClick={() => {
                                                        const newAccess = { id: Math.random().toString(36).substring(2, 9), username: '', email: '', password: '', label: '' };
                                                        setEditingClient({
                                                            ...editingClient,
                                                            systemAccesses: [...(editingClient.systemAccesses || []), newAccess]
                                                        });
                                                    }}
                                                    className="text-[10px] font-black text-pink-600 uppercase tracking-widest flex items-center gap-1 hover:text-pink-700 transition-colors"
                                                >
                                                    <Plus size={12} strokeWidth={3}/> Adicionar Acesso
                                                </button>
                                            </div>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-6">Gerencie aqui os usuários que o cliente utilizará para acessar o sistema da agência.</p>
                                            
                                            <div className="space-y-4">
                                                {(editingClient.systemAccesses || []).map((access, index) => (
                                                    <div key={access.id} className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 relative group">
                                                        <button 
                                                            onClick={() => {
                                                                const newAccesses = editingClient.systemAccesses?.filter(a => a.id !== access.id);
                                                                setEditingClient({ ...editingClient, systemAccesses: newAccesses });
                                                            }}
                                                            className="absolute top-4 right-4 p-2 text-slate-300 hover:text-red-500 transition-colors"
                                                        >
                                                            <Trash2 size={14}/>
                                                        </button>
                                                        
                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div className="col-span-2">
                                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block ml-1">Identificação (Ex: Admin, Financeiro...)</label>
                                                                <input 
                                                                    className="w-full bg-white border-2 border-transparent focus:border-pink-200 rounded-xl p-3 text-sm font-bold outline-none transition-all" 
                                                                    placeholder="Nome do Acesso" 
                                                                    value={access.label || ''} 
                                                                    onChange={e => {
                                                                        const newAccesses = [...(editingClient.systemAccesses || [])];
                                                                        newAccesses[index] = { ...access, label: e.target.value };
                                                                        setEditingClient({ ...editingClient, systemAccesses: newAccesses });
                                                                    }} 
                                                                />
                                                            </div>
                                                            <input 
                                                                className="w-full bg-white border-2 border-transparent focus:border-pink-200 rounded-xl p-3 text-sm font-bold outline-none transition-all" 
                                                                placeholder="Usuário / Login" 
                                                                value={access.username || ''} 
                                                                onChange={e => {
                                                                    const newAccesses = [...(editingClient.systemAccesses || [])];
                                                                    newAccesses[index] = { ...access, username: e.target.value };
                                                                    setEditingClient({ ...editingClient, systemAccesses: newAccesses });
                                                                }} 
                                                            />
                                                            <input 
                                                                className="w-full bg-white border-2 border-transparent focus:border-pink-200 rounded-xl p-3 text-sm font-bold outline-none transition-all" 
                                                                placeholder="Email de Acesso" 
                                                                value={access.email || ''} 
                                                                onChange={e => {
                                                                    const newAccesses = [...(editingClient.systemAccesses || [])];
                                                                    newAccesses[index] = { ...access, email: e.target.value };
                                                                    setEditingClient({ ...editingClient, systemAccesses: newAccesses });
                                                                }} 
                                                            />
                                                            <div className="col-span-2">
                                                                <input 
                                                                    className="w-full bg-white border-2 border-transparent focus:border-pink-200 rounded-xl p-3 text-sm font-bold outline-none transition-all" 
                                                                    placeholder="Senha de Acesso" 
                                                                    type="text" 
                                                                    value={access.password || ''} 
                                                                    onChange={e => {
                                                                        const newAccesses = [...(editingClient.systemAccesses || [])];
                                                                        newAccesses[index] = { ...access, password: e.target.value };
                                                                        setEditingClient({ ...editingClient, systemAccesses: newAccesses });
                                                                    }} 
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                                {(editingClient.systemAccesses || []).length === 0 && (
                                                    <div className="p-10 text-center border-2 border-dashed border-slate-100 rounded-[32px]">
                                                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nenhum acesso configurado</p>
                                                    </div>
                                                )}
                                                {(editingClient.systemAccesses || []).length > 0 && (
                                                    <button 
                                                        onClick={() => {
                                                            const newAccess = { id: Math.random().toString(36).substring(2, 9), username: '', email: '', password: '', label: '' };
                                                            setEditingClient({
                                                                ...editingClient,
                                                                systemAccesses: [...(editingClient.systemAccesses || []), newAccess]
                                                            });
                                                        }}
                                                        className="w-full py-4 border-2 border-dashed border-slate-100 rounded-[32px] text-slate-400 hover:border-pink-200 hover:text-pink-600 transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                                                    >
                                                        <Plus size={16}/> Adicionar Outro Acesso
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="p-6 border-t border-slate-50 flex justify-end gap-3 bg-slate-50 shrink-0">
                        <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-slate-400 text-[10px] font-black uppercase tracking-widest hover:text-slate-600 transition-colors">Cancelar</button>
                        <button onClick={handleSave} className="bg-pink-600 hover:bg-pink-700 text-white px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest shadow-lg shadow-pink-200 transition-all active:scale-95 flex items-center gap-2">
                            <Check size={18} strokeWidth={3}/> Salvar Cliente
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* 360 VIEW MODAL */}
        {viewingClient && (
            <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[99999] flex items-center justify-center p-2 md:p-6 transition-all duration-300" onClick={() => setViewingClient(null)}>
                <div className="bg-white rounded-[40px] w-full max-w-6xl h-full max-h-[95vh] flex flex-col shadow-2xl overflow-hidden animate-pop border border-slate-100" onClick={e => e.stopPropagation()}>
                    {/* 360 HEADER */}
                    <div className="p-8 bg-slate-900 text-white shrink-0 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-600/20 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-[28px] flex items-center justify-center text-3xl font-black border border-white/20">
                                    {viewingClient.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-3 mb-1">
                                        <h2 className="text-3xl font-black tracking-tighter">{viewingClient.name}</h2>
                                        <span className="px-3 py-1 bg-pink-600 rounded-full text-[10px] font-black uppercase tracking-widest">Classe {viewingClient.classification || 'C'}</span>
                                    </div>
                                    <p className="text-slate-400 text-sm font-medium flex items-center gap-2">
                                        <Building2 size={14}/> {viewingClient.legalName || 'Razão Social não informada'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <button onClick={() => { 
                                    setViewingClient(null);
                                    setEditingClient({ ...viewingClient, systemAccesses: viewingClient.systemAccesses || [] }); 
                                    setActiveTab('GENERAL'); 
                                    setIsModalOpen(true); 
                                }} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all backdrop-blur-md border border-white/10">Editar Cadastro</button>
                                <button onClick={() => setViewingClient(null)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all backdrop-blur-md border border-white/10"><X size={20}/></button>
                            </div>
                        </div>
                    </div>

                    {/* 360 TABS */}
                    <div className="flex border-b border-slate-100 px-8 bg-white shrink-0 overflow-x-auto hide-scrollbar">
                        {[
                            { id: 'SUMMARY', label: 'Resumo', icon: LayoutDashboard },
                            { id: 'SERVICES', label: 'Serviços', icon: ShoppingBag },
                            { id: 'REQUISITIONS', label: 'Solicitações', icon: ShoppingBag },
                            { id: 'TASKS', label: 'Tarefas', icon: ClipboardList },
                            { id: 'HISTORY', label: 'Histórico', icon: History },
                            { id: 'FILES', label: 'Arquivos', icon: HardDrive },
                            { id: 'PASSWORDS', label: 'Senhas', icon: Key },
                        ].map(tab => (
                            <button 
                                key={tab.id}
                                onClick={() => setActiveViewTab(tab.id as any)}
                                className={`px-6 py-5 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${activeViewTab === tab.id ? 'text-pink-600 border-pink-600' : 'text-slate-400 border-transparent hover:text-slate-600'}`}
                            >
                                <tab.icon size={16}/> {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* 360 CONTENT */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-slate-50/30">
                        {activeViewTab === 'SUMMARY' && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="md:col-span-2 space-y-8">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Contato Principal</p>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-pink-50 text-pink-600 rounded-xl flex items-center justify-center"><UserIcon size={14}/></div>
                                                    <span className="text-sm font-bold text-slate-700">{viewingClient.contact?.name || 'Não inf.'}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><Mail size={14}/></div>
                                                    <span className="text-sm font-bold text-slate-700">{viewingClient.contact?.email || 'Não inf.'}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center"><MessageSquare size={14}/></div>
                                                    <span className="text-sm font-bold text-slate-700">{viewingClient.contact?.whatsapp || 'Não inf.'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Financeiro</p>
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center"><CreditCard size={14}/></div>
                                                    <span className="text-sm font-bold text-slate-700">{viewingClient.financialContact?.name || 'Não inf.'}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-slate-50 text-slate-600 rounded-xl flex items-center justify-center"><DollarSign size={14}/></div>
                                                    <span className="text-sm font-bold text-slate-700">Mensal: R$ {viewingClient.monthlyValue?.toLocaleString() || '0'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Observações Internas</h4>
                                        <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                            {viewingClient.internalNotes || 'Nenhuma observação interna registrada para este cliente.'}
                                        </p>
                                    </div>

                                    {viewingClient.systemAccesses && viewingClient.systemAccesses.length > 0 && (
                                        <div className="bg-white p-8 rounded-[32px] border border-slate-100 shadow-sm">
                                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2"><Shield size={14} className="text-pink-600"/> Acessos ao Sistema</h4>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                {viewingClient.systemAccesses.map(access => (
                                                    <div key={access.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 relative group">
                                                        <p className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{access.label || 'Acesso'}</p>
                                                        <div className="space-y-1">
                                                            <div className="flex justify-between text-[11px]">
                                                                <span className="text-slate-400 font-bold uppercase">Login:</span>
                                                                <span className="text-slate-700 font-black">{access.username || access.email || 'N/A'}</span>
                                                            </div>
                                                            <div className="flex justify-between text-[11px]">
                                                                <span className="text-slate-400 font-bold uppercase">Senha:</span>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-slate-700 font-black font-mono">
                                                                        {visiblePasswords[access.id] ? access.password : '••••••••'}
                                                                    </span>
                                                                    <button 
                                                                        onClick={() => togglePassword(access.id, `Acesso: ${access.label}`)}
                                                                        className="text-slate-300 hover:text-pink-600 transition-colors"
                                                                    >
                                                                        {visiblePasswords[access.id] ? <EyeOff size={12}/> : <Eye size={12}/>}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-8">
                                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Organização</p>
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[11px] font-bold text-slate-400 uppercase">Squad</span>
                                                <span className="text-xs font-black text-slate-800">{squads.find(s => s.id === viewingClient.squadId)?.name || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[11px] font-bold text-slate-400 uppercase">Responsável</span>
                                                <span className="text-xs font-black text-slate-800">{users.find(u => u.id === viewingClient.responsibleId)?.name || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-[11px] font-bold text-slate-400 uppercase">Entrada</span>
                                                <span className="text-xs font-black text-slate-800">{viewingClient.entryDate || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Tags</p>
                                        <div className="flex flex-wrap gap-2">
                                            {(viewingClient.tags || []).map(tag => (
                                                <span key={tag} className="px-3 py-1 bg-slate-50 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest border border-slate-100">{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                         {activeViewTab === 'SERVICES' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {(viewingClient.serviceIds || []).length === 0 ? (
                                    <div className="col-span-full p-20 text-center bg-white rounded-[40px] border border-slate-100">
                                        <ShoppingBag size={48} className="mx-auto text-slate-200 mb-4"/>
                                        <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Nenhum serviço contratado</p>
                                    </div>
                                ) : (
                                    (viewingClient.serviceIds || []).map(sid => {
                                        const service = services.find(s => s.id === sid);
                                        if (!service) return null;
                                        return (
                                            <div key={service.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col group hover:shadow-xl hover:shadow-pink-500/5 transition-all duration-300">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-widest ${
                                                        service.type === 'RECURRENT' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'
                                                    }`}>
                                                        {service.type === 'RECURRENT' ? 'Recorrente' : 'Pontual'}
                                                    </div>
                                                    <div className={`w-2 h-2 rounded-full ${service.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                                                </div>
                                                <h5 className="font-black text-slate-800 text-sm mb-1">{service.name}</h5>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">{service.category}</p>
                                                
                                                <div className="space-y-2 mb-6">
                                                    {service.deliveries.slice(0, 2).map((delivery, i) => (
                                                        <div key={i} className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
                                                            <div className="w-1 h-1 bg-pink-400 rounded-full"></div>
                                                            <span className="truncate">{delivery.quantity}x {delivery.description}</span>
                                                        </div>
                                                    ))}
                                                    {service.deliveries.length > 2 && (
                                                        <p className="text-[9px] text-pink-600 font-black uppercase tracking-widest">+{service.deliveries.length - 2} entregas</p>
                                                    )}
                                                </div>

                                                <div className="mt-auto pt-4 border-t border-slate-50 flex justify-between items-center">
                                                    <div className="flex items-center gap-1 text-slate-700 font-black text-xs">
                                                        <span className="text-[9px] text-slate-400">R$</span>
                                                        {service.basePrice.toLocaleString()}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-pink-600">
                                                        <ListChecks size={12} />
                                                        <span className="text-[10px] font-black">{service.deliveries.length}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        )}

                        {activeViewTab === 'REQUISITIONS' && (
                            <div className="space-y-4">
                                {getClientRequisitions(viewingClient.id).length === 0 ? (
                                    <div className="p-20 text-center">
                                        <ShoppingBag size={48} className="mx-auto text-slate-200 mb-4"/>
                                        <p className="text-slate-400 font-bold uppercase text-xs">Nenhuma solicitação encontrada</p>
                                    </div>
                                ) : (
                                    getClientRequisitions(viewingClient.id).map(req => (
                                        <div key={req.id} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex justify-between items-center">
                                            <div>
                                                <h5 className="font-black text-slate-800 text-sm mb-1">{req.title}</h5>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{req.category} • {req.date}</p>
                                            </div>
                                            <div className="flex items-center gap-6">
                                                <span className="text-sm font-black text-slate-800">R$ {req.estimatedCost.toLocaleString()}</span>
                                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${
                                                    req.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600' :
                                                    req.status === 'REJECTED' ? 'bg-red-50 text-red-600' :
                                                    'bg-amber-50 text-amber-600'
                                                }`}>{req.status}</span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeViewTab === 'TASKS' && (
                            <div className="space-y-4">
                                {getClientTasks(viewingClient.id).length === 0 ? (
                                    <div className="p-20 text-center">
                                        <ClipboardList size={48} className="mx-auto text-slate-200 mb-4"/>
                                        <p className="text-slate-400 font-bold uppercase text-xs">Nenhuma tarefa encontrada</p>
                                    </div>
                                ) : (
                                    getClientTasks(viewingClient.id).map(task => (
                                        <div key={task.id} className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex justify-between items-center">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-2 h-10 rounded-full ${
                                                    task.status === 'DONE' ? 'bg-emerald-500' :
                                                    task.status === 'IN_PROGRESS' ? 'bg-indigo-500' :
                                                    'bg-slate-300'
                                                }`}></div>
                                                <div>
                                                    <h5 className="font-black text-slate-800 text-sm mb-1">{task.title}</h5>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{task.status} • Prazo: {task.dueDate}</p>
                                                </div>
                                            </div>
                                            <div className="flex -space-x-2">
                                                {task.assigneeIds.map(uid => (
                                                    <div key={uid} className="w-8 h-8 rounded-full border-2 border-white bg-slate-200 overflow-hidden" title={users.find(u => u.id === uid)?.name}>
                                                        <img src={users.find(u => u.id === uid)?.avatar} alt="" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {activeViewTab === 'PASSWORDS' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {currentUser.role === 'FREELANCER' ? (
                                    <div className="col-span-2 p-20 text-center bg-red-50 rounded-[32px] border border-red-100">
                                        <Lock size={48} className="mx-auto text-red-200 mb-4"/>
                                        <p className="text-red-600 font-black uppercase text-xs tracking-widest">Acesso Restrito</p>
                                        <p className="text-red-400 text-[10px] font-bold mt-2">Comerciais não possuem permissão para visualizar o banco de senhas.</p>
                                    </div>
                                ) : (
                                    (viewingClient.passwords || []).length === 0 ? (
                                        <div className="col-span-2 p-20 text-center">
                                            <Key size={48} className="mx-auto text-slate-200 mb-4"/>
                                            <p className="text-slate-400 font-bold uppercase text-xs">Nenhuma senha registrada</p>
                                        </div>
                                    ) : (
                                        (viewingClient.passwords || []).map(p => (
                                            <div key={p.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <h5 className="font-black text-slate-800 text-sm uppercase tracking-tighter">{p.platform}</h5>
                                                        {p.link && (
                                                            <a href={p.link} target="_blank" rel="noopener noreferrer" className="text-pink-600 hover:text-pink-700 transition-colors">
                                                                <ExternalLink size={14}/>
                                                            </a>
                                                        )}
                                                    </div>
                                                    <button 
                                                        onClick={() => togglePassword(p.id, p.platform)}
                                                        className={`p-2 rounded-xl transition-all ${visiblePasswords[p.id] ? 'bg-pink-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
                                                    >
                                                        {visiblePasswords[p.id] ? <EyeOff size={16}/> : <Eye size={16}/>}
                                                    </button>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase">Login</span>
                                                        <span className="text-xs font-bold text-slate-700">{p.login}</span>
                                                    </div>
                                                    <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase">Senha</span>
                                                        <span className="text-xs font-black text-slate-700 font-mono">
                                                            {visiblePasswords[p.id] ? p.password : '••••••••••••'}
                                                        </span>
                                                    </div>
                                                </div>
                                                {p.observations && (
                                                    <div className="p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Observações</p>
                                                        <p className="text-[11px] text-slate-600 font-medium leading-relaxed">{p.observations}</p>
                                                    </div>
                                                )}
                                            </div>
                                        ))
                                    )
                                )}
                            </div>
                        )}

                        {activeViewTab === 'FILES' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {(viewingClient.documentationLinks || []).length === 0 ? (
                                    <div className="col-span-2 p-20 text-center">
                                        <HardDrive size={48} className="mx-auto text-slate-200 mb-4"/>
                                        <p className="text-slate-400 font-bold uppercase text-xs">Nenhum diretório vinculado</p>
                                    </div>
                                ) : (
                                    (viewingClient.documentationLinks || []).map((link, idx) => (
                                        <a key={idx} href={link} target="_blank" rel="noopener noreferrer" className="bg-white p-6 rounded-[24px] border border-slate-100 shadow-sm flex items-center justify-between hover:border-pink-200 transition-all group">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><Folder size={20}/></div>
                                                <div>
                                                    <h5 className="font-black text-slate-800 text-sm mb-0.5">Diretório de Arquivos {idx + 1}</h5>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest truncate max-w-[200px]">{link}</p>
                                                </div>
                                            </div>
                                            <ExternalLink size={18} className="text-slate-300 group-hover:text-pink-600 transition-colors"/>
                                        </a>
                                    ))
                                )}
                            </div>
                        )}

                        {activeViewTab === 'HISTORY' && (
                            <div className="space-y-6">
                                {(viewingClient.passwordLogs || []).length === 0 ? (
                                    <div className="p-20 text-center">
                                        <History size={48} className="mx-auto text-slate-200 mb-4"/>
                                        <p className="text-slate-400 font-bold uppercase text-xs">Nenhum log de atividade</p>
                                    </div>
                                ) : (
                                    [...(viewingClient.passwordLogs || [])].reverse().map(log => (
                                        <div key={log.id} className="flex gap-4">
                                            <div className="w-10 h-10 rounded-full border-2 border-white bg-slate-100 overflow-hidden shrink-0">
                                                <img src={users.find(u => u.id === log.userId)?.avatar} alt="" />
                                            </div>
                                            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex-1">
                                                <p className="text-xs text-slate-600">
                                                    <span className="font-black text-slate-800">{users.find(u => u.id === log.userId)?.name}</span> visualizou a senha da plataforma <span className="font-black text-pink-600">{log.platform}</span>
                                                </p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{new Date(log.timestamp).toLocaleString()}</p>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
