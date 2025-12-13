
import React, { useState } from 'react';
import { Client, Squad, ClientContact, AgencyService, User } from '../types';
import { Plus, Edit2, Trash2, Folder, FileText, Calendar, Mail, Phone, ExternalLink, Search, DollarSign, Users, Briefcase, User as UserIcon, Star, Link, Shield, X, Check, ShoppingBag, Key, Lock, AlertCircle } from 'lucide-react';

interface ClientManagementProps {
  clients: Client[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  squads: Squad[];
  services: AgencyService[];
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
}

export const ClientManagement: React.FC<ClientManagementProps> = ({ clients, setClients, squads, services, users, setUsers }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'RECURRING' | 'ONEOFF'>('ALL');
  const [activeTab, setActiveTab] = useState<'GENERAL' | 'CONTRACT' | 'CONTACTS' | 'ACCESS'>('GENERAL');

  const [editingClient, setEditingClient] = useState<Partial<Client>>({ 
      name: '',
      status: 'ACTIVE', 
      contacts: [],
      level: 'BASIC',
      isRecurring: true,
      serviceIds: [],
      squadId: ''
  });

  // Novo estado para criação de acesso na aba ACCESS
  const [newUserLogin, setNewUserLogin] = useState({ name: '', email: '', password: '' });

  // Stats Calculation
  const activeClients = clients.filter(c => c.status === 'ACTIVE');
  const totalMRR = activeClients.reduce((acc, c) => acc + (c.monthlyValue || 0), 0);
  const avgTicket = activeClients.length > 0 ? totalMRR / activeClients.length : 0;

  const handleSave = () => {
      // Validação de Campos Obrigatórios
      if (!editingClient.name || !editingClient.name.trim()) {
          alert("O campo 'Nome do Cliente' é obrigatório.");
          return;
      }

      if (!editingClient.squadId) {
          alert("Por favor, selecione a 'Squad Responsável' na aba Visão Geral.");
          setActiveTab('GENERAL'); // Leva o usuário para a aba correta
          return;
      }
      
      if (editingClient.id) {
          setClients(prev => prev.map(c => c.id === editingClient.id ? { ...c, ...editingClient } as Client : c));
      } else {
          setClients(prev => [...prev, { ...editingClient, id: Date.now().toString() } as Client]);
      }
      setIsModalOpen(false);
      resetForm();
  };

  const resetForm = () => {
      setEditingClient({ 
          name: '',
          status: 'ACTIVE', 
          contacts: [], 
          level: 'BASIC', 
          isRecurring: true, 
          serviceIds: [],
          squadId: ''
      });
      setActiveTab('GENERAL');
      setNewUserLogin({ name: '', email: '', password: '' });
  };

  const handleCreateNew = () => {
      resetForm();
      setIsModalOpen(true);
  };

  const addContact = () => {
      const newContacts = [...(editingClient.contacts || []), { name: '', email: '', phone: '', role: '' }];
      setEditingClient({...editingClient, contacts: newContacts});
  };

  const updateContact = (idx: number, field: keyof ClientContact, value: string) => {
      const newContacts = [...(editingClient.contacts || [])];
      newContacts[idx] = { ...newContacts[idx], [field]: value };
      setEditingClient({...editingClient, contacts: newContacts});
  };

  const removeContact = (idx: number) => {
      const newContacts = editingClient.contacts?.filter((_, i) => i !== idx);
      setEditingClient({...editingClient, contacts: newContacts});
  };
  
  const toggleService = (serviceId: string) => {
      const currentServices = editingClient.serviceIds || [];
      if (currentServices.includes(serviceId)) {
          setEditingClient({...editingClient, serviceIds: currentServices.filter(id => id !== serviceId)});
      } else {
          setEditingClient({...editingClient, serviceIds: [...currentServices, serviceId]});
      }
  };

  // --- Lógica de Usuários do Portal (Aba Access) ---
  const handleAddUserLogin = () => {
      const name = newUserLogin.name.trim();
      const email = newUserLogin.email.trim();
      const password = newUserLogin.password.trim();

      if (!name || !email || !password) {
          alert("Preencha todos os campos para criar o acesso.");
          return;
      }

      const existing = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
          alert("Já existe um usuário com este e-mail.");
          return;
      }

      if (!editingClient.id) {
          alert("Salve o cliente antes de criar acessos.");
          return;
      }

      const newUser: User = {
          id: Date.now().toString(),
          name,
          email,
          role: 'CLIENT',
          clientId: editingClient.id, // VINCULA AO CLIENTE
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${name}`,
          hasSystemAccess: true,
          password
      };

      setUsers(prev => [...prev, newUser]);
      setNewUserLogin({ name: '', email: '', password: '' });
      alert("Usuário criado com sucesso!");
  };

  const handleDeleteUserLogin = (userId: string) => {
      if (confirm("Tem certeza que deseja remover o acesso deste usuário?")) {
          setUsers(prev => prev.filter(u => u.id !== userId));
      }
  };

  const getLevelColor = (level?: string) => {
      switch(level) {
          case 'ADVANCED': return 'bg-purple-100 text-purple-700 border-purple-200';
          case 'INTERMEDIATE': return 'bg-blue-100 text-blue-700 border-blue-200';
          default: return 'bg-slate-100 text-slate-600 border-slate-200';
      }
  };

  const filteredClients = clients.filter(client => {
      const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            client.legalName?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'ALL' || 
                            (filterType === 'RECURRING' && client.isRecurring) || 
                            (filterType === 'ONEOFF' && !client.isRecurring);
      return matchesSearch && matchesFilter;
  });

  // Usuários vinculados ao cliente atual
  const linkedUsers = users.filter(u => u.role === 'CLIENT' && u.clientId === editingClient.id);

  return (
    <div className="space-y-6">
       
       {/* Dashboard Summary */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
           <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
               <div>
                   <p className="text-xs font-bold text-slate-500 uppercase">Receita Recorrente (MRR)</p>
                   <p className="text-2xl font-bold text-slate-800">R$ {totalMRR.toLocaleString()}</p>
               </div>
               <div className="bg-emerald-50 p-3 rounded-full text-emerald-600"><DollarSign size={24}/></div>
           </div>
           <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
               <div>
                   <p className="text-xs font-bold text-slate-500 uppercase">Clientes Ativos</p>
                   <p className="text-2xl font-bold text-slate-800">{activeClients.length}</p>
               </div>
               <div className="bg-blue-50 p-3 rounded-full text-blue-600"><Users size={24}/></div>
           </div>
           <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
               <div>
                   <p className="text-xs font-bold text-slate-500 uppercase">Ticket Médio</p>
                   <p className="text-2xl font-bold text-slate-800">R$ {avgTicket.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
               </div>
               <div className="bg-purple-50 p-3 rounded-full text-purple-600"><Star size={24}/></div>
           </div>
       </div>

       {/* Toolbar */}
       <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
           <div className="flex items-center gap-2 w-full md:w-auto">
               <div className="relative w-full md:w-64">
                   <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                   <input 
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm outline-none focus:border-pink-500"
                        placeholder="Buscar cliente..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                   />
               </div>
               <div className="flex bg-slate-100 p-1 rounded-lg">
                   <button onClick={() => setFilterType('ALL')} className={`px-3 py-1.5 text-xs font-bold rounded ${filterType === 'ALL' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Todos</button>
                   <button onClick={() => setFilterType('RECURRING')} className={`px-3 py-1.5 text-xs font-bold rounded ${filterType === 'RECURRING' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Recorrentes</button>
                   <button onClick={() => setFilterType('ONEOFF')} className={`px-3 py-1.5 text-xs font-bold rounded ${filterType === 'ONEOFF' ? 'bg-white shadow text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}>Pontuais</button>
               </div>
           </div>
           <button onClick={handleCreateNew} className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors shadow-lg shadow-pink-500/20 w-full md:w-auto justify-center">
             <Plus size={18} /> Novo Cliente
           </button>
       </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClients.map(client => {
              const assignedSquad = squads.find(s => s.id === client.squadId);
              // Count Accesses
              const accessCount = users.filter(u => u.clientId === client.id).length;

              return (
                <div key={client.id} className={`bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-md transition-all flex flex-col ${client.status === 'INACTIVE' ? 'opacity-60 border-slate-200' : 'border-slate-200'}`}>
                    <div className="p-4 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
                        <div className="flex items-start gap-3">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${client.isRecurring ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                {client.name.charAt(0)}
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 leading-tight">{client.name}</h3>
                                <p className="text-xs text-slate-500 mt-0.5">{client.legalName}</p>
                            </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getLevelColor(client.level)}`}>
                            {client.level}
                        </span>
                    </div>

                    <div className="p-4 space-y-4 flex-1">
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 flex items-center gap-1"><DollarSign size={14}/> Valor Mensal</span>
                            <span className="font-bold text-slate-800">R$ {client.monthlyValue ? client.monthlyValue.toLocaleString() : '0,00'}</span>
                        </div>
                        
                         {assignedSquad ? (
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 flex items-center gap-1"><Shield size={14}/> Squad</span>
                                <span className="bg-slate-100 px-2 py-0.5 rounded text-xs font-medium text-slate-700">{assignedSquad.name}</span>
                            </div>
                        ) : (
                             <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-500 flex items-center gap-1"><Shield size={14}/> Squad</span>
                                <span className="bg-red-50 px-2 py-0.5 rounded text-xs font-medium text-red-500 border border-red-100 flex items-center gap-1"><AlertCircle size={10}/> Não definida</span>
                            </div>
                        )}

                        <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-500 flex items-center gap-1"><Users size={14}/> Acessos Ativos</span>
                            <span className={`px-2 py-0.5 rounded text-xs font-bold ${accessCount > 0 ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>
                                {accessCount}
                            </span>
                        </div>
                        
                        {/* Contracted Services Tags */}
                        {client.serviceIds && client.serviceIds.length > 0 && (
                            <div>
                                <p className="text-xs font-bold text-slate-400 mb-1 flex items-center gap-1"><ShoppingBag size={10}/> Serviços</p>
                                <div className="flex flex-wrap gap-1">
                                    {client.serviceIds.map(sid => {
                                        const svc = services.find(s => s.id === sid);
                                        return svc ? (
                                            <span key={sid} className="text-[10px] bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded border border-indigo-100">
                                                {svc.name}
                                            </span>
                                        ) : null;
                                    })}
                                </div>
                            </div>
                        )}

                        {client.summary && (
                            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                                <p className="text-xs text-slate-600 italic line-clamp-3">
                                    "{client.summary}"
                                </p>
                            </div>
                        )}

                        <div className="flex gap-2 text-xs pt-2">
                            {client.contractUrl ? (
                                <a href={client.contractUrl} target="_blank" className="flex-1 flex items-center justify-center gap-1 bg-blue-50 text-blue-600 py-1.5 rounded hover:bg-blue-100 transition-colors">
                                    <FileText size={14}/> Contrato
                                </a>
                            ) : (
                                <span className="flex-1 flex items-center justify-center gap-1 bg-slate-50 text-slate-300 py-1.5 rounded cursor-not-allowed"><FileText size={14}/> Sem Contrato</span>
                            )}
                            {client.assetsFolderUrl ? (
                                <a href={client.assetsFolderUrl} target="_blank" className="flex-1 flex items-center justify-center gap-1 bg-amber-50 text-amber-600 py-1.5 rounded hover:bg-amber-100 transition-colors">
                                    <Folder size={14}/> Materiais
                                </a>
                            ) : (
                                <span className="flex-1 flex items-center justify-center gap-1 bg-slate-50 text-slate-300 py-1.5 rounded cursor-not-allowed"><Folder size={14}/> Sem Pasta</span>
                            )}
                        </div>
                    </div>
                    
                    <div className="p-3 border-t border-slate-100 flex justify-between items-center bg-slate-50/50">
                        <div className="flex -space-x-2">
                             {client.contacts.slice(0, 3).map((c, i) => (
                                 <div key={i} className="w-6 h-6 rounded-full bg-slate-200 border border-white flex items-center justify-center text-[10px] text-slate-600" title={c.name}>
                                     {c.name.charAt(0)}
                                 </div>
                             ))}
                             {client.contacts.length === 0 && <span className="text-xs text-slate-400 italic">Sem contatos</span>}
                        </div>
                        <button onClick={() => { setEditingClient(client); setIsModalOpen(true)}} className="text-slate-400 hover:text-blue-600 p-1 hover:bg-white rounded transition-colors"><Edit2 size={16}/></button>
                    </div>
                </div>
              );
          })}
      </div>

      {isModalOpen && (
        <div 
            className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center backdrop-blur-sm p-4"
            onClick={() => setIsModalOpen(false)}
        >
            <div 
                className="bg-white rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-pop"
                onClick={e => e.stopPropagation()}
            >
                <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50">
                    <div className="w-full mr-8">
                        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nome do Cliente <span className="text-red-500">*</span></label>
                        <input 
                            className="text-2xl font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-pink-500 w-full"
                            placeholder="Digite o nome da empresa..."
                            value={editingClient.name || ''}
                            onChange={e => setEditingClient({...editingClient, name: e.target.value})}
                            autoFocus
                        />
                        <div className="flex items-center gap-4 mt-3">
                             <select 
                                className="bg-white border border-slate-300 text-xs rounded px-2 py-1 outline-none"
                                value={editingClient.status}
                                onChange={e => setEditingClient({...editingClient, status: e.target.value as any})}
                             >
                                 <option value="ACTIVE">Ativo</option>
                                 <option value="INACTIVE">Inativo</option>
                                 <option value="CHURNED">Churn (Cancelado)</option>
                             </select>
                             <div className="flex items-center gap-2">
                                <input type="checkbox" id="isRec" checked={editingClient.isRecurring} onChange={e => setEditingClient({...editingClient, isRecurring: e.target.checked})} className="rounded text-pink-600 focus:ring-pink-500" />
                                <label htmlFor="isRec" className="text-sm text-slate-600">Cliente Recorrente</label>
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setIsModalOpen(false)}><X size={24} className="text-slate-400 hover:text-slate-600"/></button>
                </div>

                <div className="flex border-b border-slate-200">
                    <button 
                        onClick={() => setActiveTab('GENERAL')}
                        className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'GENERAL' ? 'border-pink-600 text-pink-600 bg-pink-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Visão Geral
                    </button>
                    <button 
                        onClick={() => setActiveTab('CONTRACT')}
                        className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'CONTRACT' ? 'border-pink-600 text-pink-600 bg-pink-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Contrato & Financeiro
                    </button>
                    <button 
                        onClick={() => setActiveTab('CONTACTS')}
                        className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'CONTACTS' ? 'border-pink-600 text-pink-600 bg-pink-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Contatos ({editingClient.contacts?.length || 0})
                    </button>
                    <button 
                        onClick={() => setActiveTab('ACCESS')}
                        className={`px-6 py-3 text-sm font-medium transition-colors border-b-2 ${activeTab === 'ACCESS' ? 'border-pink-600 text-pink-600 bg-pink-50/50' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    >
                        Acessos do Portal ({linkedUsers.length})
                    </button>
                </div>
                
                <div className="p-8 overflow-y-auto flex-1 bg-slate-50/30">
                    
                    {activeTab === 'GENERAL' && (
                        <div className="space-y-6 max-w-2xl">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Razão Social</label>
                                    <input className="w-full border border-slate-300 rounded-lg p-2.5 text-sm" value={editingClient.legalName || ''} onChange={e => setEditingClient({...editingClient, legalName: e.target.value})} placeholder="Nome Legal da Empresa" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nível de Maturidade</label>
                                    <select className="w-full border border-slate-300 rounded-lg p-2.5 text-sm" value={editingClient.level} onChange={e => setEditingClient({...editingClient, level: e.target.value as any})}>
                                        <option value="BASIC">Básico (Start)</option>
                                        <option value="INTERMEDIATE">Intermediário (Growth)</option>
                                        <option value="ADVANCED">Avançado (Scale)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Squad Responsável <span className="text-red-500">*</span></label>
                                    <select 
                                        className={`w-full border rounded-lg p-2.5 text-sm ${!editingClient.squadId ? 'border-red-300 bg-red-50' : 'border-slate-300'}`}
                                        value={editingClient.squadId || ''}
                                        onChange={e => setEditingClient({...editingClient, squadId: e.target.value})}
                                    >
                                        <option value="">Selecione...</option>
                                        {squads.map(s => (
                                            <option key={s.id} value={s.id}>{s.name}</option>
                                        ))}
                                    </select>
                                    {!editingClient.squadId && <p className="text-[10px] text-red-500 mt-1">Obrigatório para gestão de tarefas</p>}
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Resumo do Cliente</label>
                                    <textarea 
                                        className="w-full border border-slate-300 rounded-lg p-2.5 text-sm h-32 resize-none focus:ring-2 focus:ring-blue-100 outline-none" 
                                        placeholder="Descreva o negócio do cliente, objetivos e informações chave..."
                                        value={editingClient.summary || ''} 
                                        onChange={e => setEditingClient({...editingClient, summary: e.target.value})} 
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'CONTRACT' && (
                        <div className="space-y-6 max-w-2xl">
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor Mensal (R$)</label>
                                    <input 
                                        type="number"
                                        className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-bold text-slate-700"
                                        value={editingClient.monthlyValue || ''}
                                        onChange={e => setEditingClient({...editingClient, monthlyValue: parseFloat(e.target.value)})}
                                        placeholder="0.00"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Início do Contrato</label>
                                    <input 
                                        type="date"
                                        className="w-full border border-slate-300 rounded-lg p-2.5 text-sm"
                                        value={editingClient.contractStartDate || ''}
                                        onChange={e => setEditingClient({...editingClient, contractStartDate: e.target.value})}
                                    />
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Link do Contrato (Drive/Doc)</label>
                                    <div className="flex gap-2">
                                        <input className="w-full border border-slate-300 rounded-lg p-2.5 text-sm" value={editingClient.contractUrl || ''} onChange={e => setEditingClient({...editingClient, contractUrl: e.target.value})} placeholder="https://..." />
                                        {editingClient.contractUrl && (
                                            <a href={editingClient.contractUrl} target="_blank" className="p-2.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-100 hover:bg-blue-100"><ExternalLink size={18}/></a>
                                        )}
                                    </div>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Link Pasta de Materiais</label>
                                    <div className="flex gap-2">
                                        <input className="w-full border border-slate-300 rounded-lg p-2.5 text-sm" value={editingClient.assetsFolderUrl || ''} onChange={e => setEditingClient({...editingClient, assetsFolderUrl: e.target.value})} placeholder="https://..." />
                                        {editingClient.assetsFolderUrl && (
                                            <a href={editingClient.assetsFolderUrl} target="_blank" className="p-2.5 bg-amber-50 text-amber-600 rounded-lg border border-amber-100 hover:bg-amber-100"><Folder size={18}/></a>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            {/* Service Selection */}
                            <div>
                                <h4 className="font-bold text-slate-700 mb-2 border-t pt-4 border-slate-200">Serviços Contratados</h4>
                                <div className="bg-white border border-slate-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                                    {services.length === 0 && <p className="text-xs text-slate-400">Nenhum serviço cadastrado no catálogo.</p>}
                                    {services.map(svc => (
                                        <label key={svc.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded cursor-pointer transition-colors">
                                            <input 
                                                type="checkbox"
                                                className="rounded text-pink-600 focus:ring-pink-500"
                                                checked={editingClient.serviceIds?.includes(svc.id) || false}
                                                onChange={() => toggleService(svc.id)}
                                            />
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-slate-700">{svc.name}</p>
                                                <p className="text-xs text-slate-400 truncate">{svc.description}</p>
                                            </div>
                                            <span className="text-xs font-bold text-slate-600">R$ {svc.basePrice}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'CONTACTS' && (
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-bold text-slate-700">Pessoas Chave</h4>
                                <button onClick={addContact} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors">
                                    <Plus size={16}/> Adicionar Contato
                                </button>
                            </div>
                            
                            {editingClient.contacts?.length === 0 && (
                                <div className="text-center p-8 border-2 border-dashed border-slate-200 rounded-xl text-slate-400">
                                    Nenhum contato cadastrado.
                                </div>
                            )}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {editingClient.contacts?.map((contact, idx) => (
                                    <div key={idx} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm relative group">
                                        <button onClick={() => removeContact(idx)} className="absolute top-2 right-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Trash2 size={16}/>
                                        </button>
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-200">
                                                    {contact.name ? contact.name.charAt(0) : '?'}
                                                </div>
                                                <input 
                                                    className="font-bold text-sm text-slate-800 border-b border-transparent focus:border-blue-300 outline-none w-full"
                                                    placeholder="Nome Completo"
                                                    value={contact.name} 
                                                    onChange={e => updateContact(idx, 'name', e.target.value)} 
                                                />
                                            </div>
                                            <div className="grid grid-cols-1 gap-2">
                                                <input className="border border-slate-200 rounded p-1.5 text-xs w-full" placeholder="Cargo (Ex: CEO)" value={contact.role} onChange={e => updateContact(idx, 'role', e.target.value)} />
                                                <div className="flex items-center gap-2">
                                                    <Mail size={14} className="text-slate-400"/>
                                                    <input className="border border-slate-200 rounded p-1.5 text-xs w-full" placeholder="Email" value={contact.email} onChange={e => updateContact(idx, 'email', e.target.value)} />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Phone size={14} className="text-slate-400"/>
                                                    <input className="border border-slate-200 rounded p-1.5 text-xs w-full" placeholder="Telefone" value={contact.phone} onChange={e => updateContact(idx, 'phone', e.target.value)} />
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} className="text-slate-400"/>
                                                    <input type="date" className="border border-slate-200 rounded p-1.5 text-xs w-full text-slate-500" value={contact.birthDate || ''} onChange={e => updateContact(idx, 'birthDate', e.target.value)} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'ACCESS' && (
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h4 className="font-bold text-slate-700">Acessos do Portal</h4>
                                    <p className="text-xs text-slate-500">Crie logins para que membros da equipe do cliente acessem o portal.</p>
                                </div>
                            </div>
                            
                            {/* Lista de Acessos Existentes */}
                            <div className="space-y-3 mb-8">
                                {linkedUsers.length === 0 && (
                                    <div className="p-4 bg-slate-100 rounded-lg text-center text-sm text-slate-500 border border-slate-200 border-dashed">
                                        Nenhum acesso criado para este cliente.
                                    </div>
                                )}
                                {linkedUsers.map(u => (
                                    <div key={u.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                                        <div className="flex items-center gap-3">
                                            <img src={u.avatar} className="w-10 h-10 rounded-full bg-slate-100" />
                                            <div>
                                                <p className="font-bold text-sm text-slate-800">{u.name}</p>
                                                <p className="text-xs text-slate-500">{u.email}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                <p className="text-[10px] uppercase font-bold text-slate-400">Senha</p>
                                                <p className="text-xs font-mono bg-slate-100 px-1 rounded">{u.password}</p>
                                            </div>
                                            <button 
                                                onClick={() => handleDeleteUserLogin(u.id)}
                                                className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 rounded transition-colors"
                                                title="Remover acesso"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Formulário de Novo Acesso */}
                            {editingClient.id ? (
                                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                                    <h5 className="font-bold text-sm text-slate-700 mb-4 flex items-center gap-2">
                                        <Key size={16} className="text-pink-600"/>
                                        Novo Acesso
                                    </h5>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                        <input 
                                            className="border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-pink-500"
                                            placeholder="Nome do Usuário"
                                            value={newUserLogin.name}
                                            onChange={e => setNewUserLogin({...newUserLogin, name: e.target.value})}
                                        />
                                        <input 
                                            className="border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-pink-500"
                                            placeholder="Email de Login"
                                            value={newUserLogin.email}
                                            onChange={e => setNewUserLogin({...newUserLogin, email: e.target.value})}
                                        />
                                        <div className="flex gap-2">
                                            <input 
                                                className="flex-1 border border-slate-200 rounded-lg p-2 text-sm outline-none focus:border-pink-500"
                                                placeholder="Senha"
                                                value={newUserLogin.password}
                                                onChange={e => setNewUserLogin({...newUserLogin, password: e.target.value})}
                                            />
                                            <button 
                                                type="button"
                                                onClick={handleAddUserLogin}
                                                className="bg-slate-800 text-white px-4 rounded-lg text-sm font-bold hover:bg-slate-900 transition-colors"
                                            >
                                                Criar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-amber-50 text-amber-700 text-sm rounded-lg border border-amber-200 flex items-center gap-2">
                                    <Lock size={16} />
                                    Salve o cliente antes de criar acessos ao portal.
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-white">
                    <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-slate-500 hover:bg-slate-100 rounded-lg font-medium transition-colors">Cancelar</button>
                    <button onClick={handleSave} className="px-8 py-2.5 bg-pink-600 text-white font-bold rounded-lg hover:bg-pink-700 shadow-md shadow-pink-500/20 transition-colors">Salvar Cliente</button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};
