
import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { KanbanBoard } from './components/KanbanBoard';
import { CRMModule } from './components/crm/CRMModule';
import { Financials } from './components/Financials';
import { ClientPortal } from './components/ClientPortal';
import { ProductivityDashboard } from './components/ProductivityDashboard';
import { TeamManagement } from './components/TeamManagement';
import { DashboardOverview } from './components/DashboardOverview';
import { PermissionsManager } from './components/PermissionsManager';
import { ClientManagement } from './components/ClientManagement';
import { ServiceCatalog } from './components/ServiceCatalog';
import { ProfileSettings } from './components/ProfileSettings';
import { Requisitions } from './components/Requisitions';
import { SystemAdmin } from './components/SystemAdmin'; 
import { Approvals } from './components/Approvals';
import { HelpCenter } from './components/HelpCenter';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { Login } from './components/Login';
import { ConfirmDialog } from './components/ConfirmDialog';
import { NotificationService } from './services/notificationService';
import { testSupabaseConnection, fetchUsers, fetchTasks, fetchClients, seedDatabase, fetchLeads, fetchFinancialTransactions, fetchBankAccounts } from './services/supabaseService';
import { initialUsers, initialTasks, initialLeads, initialBankAccounts, initialCreditCards, initialFinancialTransactions, initialCardInvoices, initialSquads, initialTaskColumns, initialCrmColumns, initialRolePermissions, initialClients, initialNotifications, initialServices, initialRequisitions, initialLossReasons, initialGoals, initialApprovalBatches } from './utils/mockData';
import { Task, User, Lead, BankAccount, CreditCard, FinancialTransaction, CardInvoice, Role, Squad, ColumnConfig, RolePermissions, Client, Notification, AgencyService, Requisition, SystemSettings, LeadTask, ConfirmOptions, LossReason, PipelineStage, ProductivityGoal, ApprovalBatch } from './types';
import { Users, Settings, Bell, Check, Gift, AlertTriangle, Info, Clock, CheckCircle, Shield, Trash2, Archive, Eye, DollarSign, Briefcase, Menu, X as XIcon } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [sidebarCompact, setSidebarCompact] = useState(() => {
    const saved = localStorage.getItem('sidebarCompact');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (mobile && sidebarOpen && !sidebarCompact) {
          setSidebarCompact(true);
      }
      // No desktop, garantimos que a sidebar esteja "aberta" (visível), mesmo que compacta
      if (!mobile && !sidebarOpen) {
          setSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [sidebarOpen, sidebarCompact]);

  useEffect(() => {
    localStorage.setItem('sidebarOpen', JSON.stringify(sidebarOpen));
    localStorage.setItem('sidebarCompact', JSON.stringify(sidebarCompact));
  }, [sidebarOpen, sidebarCompact]);

  useEffect(() => {
    const handleToggle = () => toggleSidebar();
    window.addEventListener('toggle-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-sidebar', handleToggle);
  }, [sidebarOpen, sidebarCompact, isMobile]);

  useEffect(() => {
    const initSupabase = async () => {
      const connection = await testSupabaseConnection();
      if (connection.success) {
        const dbUsers = await fetchUsers();
        if (dbUsers.length === 0) {
          console.log('Banco de dados vazio. Realizando migração inicial...');
          await seedDatabase();
          // Recarregar após migração
          const usersData = await fetchUsers();
          const tasksData = await fetchTasks();
          const clientsData = await fetchClients();
          const leadsData = await fetchLeads();
          const financialData = await fetchFinancialTransactions();
          const bankData = await fetchBankAccounts();
          
          if (usersData.length > 0) setUsers(usersData as any);
          if (tasksData.length > 0) setTasks(tasksData as any);
          if (clientsData.length > 0) setClients(clientsData as any);
          if (leadsData.length > 0) setLeads(leadsData as any);
          if (financialData.length > 0) setFinancialTransactions(financialData as any);
          if (bankData.length > 0) setBankAccounts(bankData as any);
        } else {
          console.log('Dados carregados do Supabase com sucesso.');
          const tasksData = await fetchTasks();
          const clientsData = await fetchClients();
          const leadsData = await fetchLeads();
          const financialData = await fetchFinancialTransactions();
          const bankData = await fetchBankAccounts();
          
          setUsers(dbUsers as any);
          setTasks(tasksData as any);
          setClients(clientsData as any);
          setLeads(leadsData as any);
          setFinancialTransactions(financialData as any);
          setBankAccounts(bankData as any);
        }
      }
    };
    initSupabase();
  }, []);

  const toggleSidebar = () => {
      // No desktop, o toggle de "abrir/fechar" a sidebar inteira vira o toggle de compactar
      if (!isMobile) {
          setSidebarCompact(!sidebarCompact);
      } else {
          setSidebarOpen(!sidebarOpen);
      }
  };

  const toggleCompact = () => setSidebarCompact(!sidebarCompact);

  const [confirmOptions, setConfirmOptions] = useState<ConfirmOptions | null>(null);
  const confirmResolveRef = useRef<(value: boolean) => void>(null);

  const openConfirm = (options: ConfirmOptions): Promise<boolean> => {
      return new Promise((resolve) => {
          setConfirmOptions(options);
          confirmResolveRef.current = resolve;
      });
  };

  const handleConfirmAction = (result: boolean) => {
      setConfirmOptions(null);
      if (confirmResolveRef.current) confirmResolveRef.current(result);
  };

  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(initialBankAccounts);
  const [creditCards, setCreditCards] = useState<CreditCard[]>(initialCreditCards);
  const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>(initialFinancialTransactions);
  const [cardInvoices, setCardInvoices] = useState<CardInvoice[]>(initialCardInvoices);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [squads, setSquads] = useState<Squad[]>(initialSquads);
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [services, setServices] = useState<AgencyService[]>(initialServices);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [selectedApprovalBatchId, setSelectedApprovalBatchId] = useState<string | null>(null);
  const [selectedApprovalItemId, setSelectedApprovalItemId] = useState<string | null>(null);
  const [kanbanFilter, setKanbanFilter] = useState<any>(null);
  const [requisitions, setRequisitions] = useState<Requisition[]>(initialRequisitions);
  const [goals, setGoals] = useState<ProductivityGoal[]>(initialGoals);
  const [approvalBatches, setApprovalBatches] = useState<ApprovalBatch[]>(initialApprovalBatches);
  const [leadSources, setLeadSources] = useState<string[]>(['Instagram', 'Linkedin', 'Google Ads', 'Indicação', 'Site']);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
      agencyName: 'Agência Chan',
      logo: '',
      primaryColor: '#db2777',
      sidebarColor: '#0f172a'
  });

  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [taskColumns, setTaskColumns] = useState<ColumnConfig[]>(initialTaskColumns);
  const [crmColumns, setCrmColumns] = useState<PipelineStage[]>(initialCrmColumns as any);
  const [lossReasons, setLossReasons] = useState<LossReason[]>(initialLossReasons);
  const [rolePermissions, setRolePermissions] = useState<RolePermissions>(initialRolePermissions);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'CLIENT') setCurrentView('client-portal');
    else {
        const allowed = rolePermissions[user.role] || [];
        setCurrentView(allowed.includes('dashboard') ? 'dashboard' : (allowed[0] || 'dashboard'));
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('dashboard');
  };

  const handleNotificationClick = (notif: Notification) => {
    // Mark as read
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, status: 'READ' } : n));

    if (notif.navToView) {
        setCurrentView(notif.navToView);
        
        // Contextual actions based on metadata
        if (notif.metadata?.referenceId) {
            if (notif.navToView === 'kanban') {
                setSelectedTaskId(notif.metadata.referenceId);
            } else if (notif.navToView === 'crm') {
                setSelectedLeadId(notif.metadata.referenceId);
            } else if (notif.navToView === 'finance') {
                if (notif.metadata.module === 'financeiro_fatura') {
                    setSelectedInvoiceId(notif.metadata.referenceId);
                } else {
                    setSelectedTransactionId(notif.metadata.referenceId);
                }
            } else if (notif.navToView === 'approvals') {
                if (notif.metadata?.batchId) setSelectedApprovalBatchId(notif.metadata.batchId);
                if (notif.metadata?.itemId) setSelectedApprovalItemId(notif.metadata.itemId);
            }
        }
    }
    setShowNotifications(false);
  };

  const markAllAsRead = () => {
      setNotifications(prev => prev.map(n => n.status === 'UNREAD' ? { ...n, status: 'READ' } : n));
  };

  if (!currentUser) {
      if (currentView === 'privacy') return <PrivacyPolicy onBack={() => setCurrentView('login')} agencyName={systemSettings.agencyName} />;
      if (currentView === 'help') return <div className="p-4 md:p-8"><HelpCenter currentUser={{id:'g', name:'G', email:'', role:'EMPLOYEE', avatar:''}} /></div>;
      return <Login onLogin={handleLogin} users={users} systemSettings={systemSettings} onNavigate={setCurrentView} />;
  }

  const unreadCount = notifications.filter(n => n.status === 'UNREAD' && (!n.targetUserId || n.targetUserId === currentUser.id)).length;

  const getSidebarWidth = () => {
    if (isMobile) return '0px';
    return sidebarCompact ? '80px' : '256px';
  };

  const contentMargin = getSidebarWidth();

  const isKanban = currentView === 'kanban';

  return (
    <div className={`flex h-screen transition-colors duration-300 ${currentUser.preferences?.theme === 'dark' ? 'bg-slate-900 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 z-[9999] animate-pop" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar 
        currentView={currentView} 
        setView={setCurrentView} 
        currentUserRole={currentUser.role} 
        permissions={rolePermissions} 
        logout={handleLogout} 
        systemSettings={systemSettings}
        isOpen={sidebarOpen}
        onToggle={toggleSidebar}
        isCompact={sidebarCompact}
        onToggleCompact={toggleCompact}
        isMobile={isMobile}
      />
      
      <main 
        className={`flex-1 flex flex-col h-full transition-all duration-300 ease-in-out relative ${isKanban ? 'p-0' : 'px-4 py-6'}`}
        style={{ marginLeft: contentMargin }}
      >
        {/* TOP HEADER SECTION */}
        {!isKanban && (
            <div className="sticky top-0 z-40 flex justify-between items-center gap-4 mb-6 md:mb-8">
                <div className="flex items-center gap-3">
                    {isMobile && (
                        <button 
                            onClick={toggleSidebar}
                            className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-sm"
                        >
                            <Menu size={20} />
                        </button>
                    )}
                    <div className="hidden sm:block">
                        <h2 className="text-lg font-black text-slate-800 tracking-tight leading-none">
                            {currentView === 'dashboard' ? 'Dashboard' : 
                             currentView === 'crm' ? 'CRM' :
                             currentView === 'finance' ? 'Financeiro' :
                             currentView === 'teams' ? 'Equipes' : 'Sistema'}
                        </h2>
                    </div>
                </div>

                <div className="flex items-center gap-3 md:gap-4">
                    <div className="relative" ref={notificationRef}>
                        <button 
                          onClick={() => setShowNotifications(!showNotifications)} 
                          className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl border border-slate-200 bg-white shadow-sm flex items-center justify-center transition-all hover:shadow-md hover:border-pink-200 group"
                        >
                            <Bell size={18} className="text-slate-500 group-hover:text-pink-600 transition-colors" />
                            {unreadCount > 0 && (
                                <span className="absolute top-2.5 right-2.5 md:top-3 md:right-3 w-2 md:w-2.5 h-2 md:h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                            )}
                        </button>
                        
                        {showNotifications && (
                            <div className="absolute right-0 top-full mt-3 w-80 md:w-96 bg-white rounded-2xl md:rounded-3xl shadow-2xl border border-slate-100 z-[100] animate-pop origin-top-right overflow-hidden">
                                <div className="p-4 md:p-5 border-b bg-slate-50/50 flex justify-between items-center">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-500">Notificações</h3>
                                    <button onClick={markAllAsRead} className="text-[10px] font-black text-pink-600 hover:text-pink-700 transition-colors">Marcar lidas</button>
                                </div>
                                <div className="max-h-64 md:max-h-96 overflow-y-auto custom-scrollbar">
                                    {notifications.length > 0 ? (
                                        <div className="divide-y divide-slate-50">
                                            {notifications.sort((a, b) => b.timestamp - a.timestamp).map(notif => (
                                                <button 
                                                    key={notif.id} 
                                                    onClick={() => handleNotificationClick(notif)}
                                                    className={`w-full p-4 text-left hover:bg-slate-50 transition-colors flex gap-3 items-start ${notif.status === 'UNREAD' ? 'bg-pink-50/30' : ''}`}
                                                >
                                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                                                        notif.type === 'ALERT' ? 'bg-red-100 text-red-600' :
                                                        notif.type === 'WARNING' ? 'bg-amber-100 text-amber-600' :
                                                        notif.type === 'SUCCESS' ? 'bg-emerald-100 text-emerald-600' :
                                                        'bg-blue-100 text-blue-600'
                                                    }`}>
                                                        <Bell size={14} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex justify-between items-start mb-1">
                                                            <p className={`text-[11px] font-black uppercase tracking-tight truncate ${notif.status === 'UNREAD' ? 'text-slate-900' : 'text-slate-600'}`}>{notif.title}</p>
                                                            <span className="text-[9px] text-slate-400 font-bold ml-2 whitespace-nowrap">
                                                                {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </span>
                                                        </div>
                                                        <p className="text-[11px] text-slate-500 font-medium line-clamp-2 leading-relaxed">{notif.message}</p>
                                                        {notif.navToView && (
                                                            <div className="mt-2 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest text-pink-600">
                                                                <span>Ver detalhes</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="p-10 text-center">
                                            <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-300">
                                                <Bell size={20} />
                                            </div>
                                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Sem novidades</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div 
                      className="bg-white px-3 md:px-6 py-1.5 md:py-2 rounded-xl md:rounded-3xl shadow-sm border border-slate-100 flex items-center gap-2 md:gap-4 cursor-pointer hover:shadow-md transition-all group"
                      onClick={() => setCurrentView('settings')}
                    >
                        <div className="text-right hidden xs:block">
                            <p className="text-xs md:text-sm font-black text-slate-800 leading-none group-hover:text-pink-600 truncate max-w-[80px] md:max-w-none">{currentUser.name}</p>
                            <p className="text-[8px] md:text-[10px] text-slate-400 uppercase font-black mt-1 tracking-wider">{currentUser.role}</p>
                        </div>
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-2xl overflow-hidden border-2 border-slate-50 bg-slate-100 shrink-0">
                          <img src={currentUser.avatar} alt="Perfil" className="w-full h-full object-cover" />
                        </div>
                    </div>
                </div>
            </div>
        )}

        <div className="flex-1 w-full max-w-full flex flex-col overflow-y-auto custom-scrollbar">
            {currentView === 'dashboard' && (
              <DashboardOverview 
                tasks={tasks} 
                leads={leads} 
                finance={financialTransactions} 
                users={users} 
                clients={clients}
                cardInvoices={cardInvoices}
                bankAccounts={bankAccounts}
                creditCards={creditCards}
                currentUser={currentUser}
                setCurrentView={setCurrentView}
                goals={goals}
                squads={squads}
              />
            )}
            {currentView === 'kanban' && (
              <KanbanBoard 
                tasks={tasks} 
                setTasks={setTasks} 
                users={users} 
                currentUser={currentUser} 
                columns={taskColumns} 
                setColumns={setTaskColumns} 
                openConfirm={openConfirm} 
                notifications={notifications} 
                setNotifications={setNotifications}
                sidebarOpen={sidebarOpen}
                sidebarCompact={sidebarCompact}
                isMobile={isMobile}
                clients={clients}
                selectedTaskId={selectedTaskId}
                onClearSelectedTask={() => setSelectedTaskId(null)}
                initialFilter={kanbanFilter}
                onClearFilter={() => setKanbanFilter(null)}
                onNavigate={(view, refId) => {
                  setCurrentView(view);
                  if (view === 'kanban' && refId) setSelectedTaskId(refId);
                  if (view === 'crm' && refId) setSelectedLeadId(refId);
                  if (view === 'finance' && refId) setSelectedTransactionId(refId);
                }}
              />
            )}
            {currentView === 'crm' && (
              <CRMModule 
                leads={leads} 
                setLeads={setLeads} 
                stages={crmColumns as any} 
                setStages={setCrmColumns as any} 
                lossReasons={lossReasons}
                setLossReasons={setLossReasons}
                users={users}
                currentUser={currentUser}
                clients={clients}
                setClients={setClients}
                notifications={notifications}
                setNotifications={setNotifications}
                openConfirm={openConfirm}
                selectedLeadId={selectedLeadId}
                onClearSelectedLead={() => setSelectedLeadId(null)}
                onNavigate={(view, refId) => {
                  setCurrentView(view);
                  if (view === 'kanban' && refId) setSelectedTaskId(refId);
                  if (view === 'crm' && refId) setSelectedLeadId(refId);
                  if (view === 'finance' && refId) setSelectedTransactionId(refId);
                }}
              />
            )}
            {currentView === 'requisitions' && <Requisitions requisitions={requisitions} setRequisitions={setRequisitions} currentUser={currentUser} users={users} setNotifications={setNotifications} setTransactions={setFinancialTransactions} clients={clients} />}
            {currentView === 'finance' && (
              <Financials 
                bankAccounts={bankAccounts}
                setBankAccounts={setBankAccounts}
                creditCards={creditCards}
                setCreditCards={setCreditCards}
                transactions={financialTransactions}
                setTransactions={setFinancialTransactions}
                cardInvoices={cardInvoices}
                setCardInvoices={setCardInvoices}
                currentUser={currentUser} 
                users={users} 
                clients={clients}
                squads={squads}
                openConfirm={openConfirm}
                selectedTransactionId={selectedTransactionId}
                onClearSelectedTransaction={() => setSelectedTransactionId(null)}
                selectedInvoiceId={selectedInvoiceId}
                onClearSelectedInvoice={() => setSelectedInvoiceId(null)}
              />
            )}
            {currentView === 'client-portal' && (
              <ClientPortal 
                tasks={tasks} 
                setTasks={setTasks} 
                currentUser={currentUser} 
                users={users} 
                clients={clients} 
                squads={squads} 
                batches={approvalBatches}
                setNotifications={setNotifications} 
                onNavigate={setCurrentView} 
                setSelectedBatchId={setSelectedApprovalBatchId}
              />
            )}
            {currentView === 'productivity' && (
              <ProductivityDashboard 
                tasks={tasks} 
                setTasks={setTasks} 
                users={users} 
                squads={initialSquads} 
                clients={clients} 
                currentUser={currentUser} 
                setNotifications={setNotifications} 
                goals={goals} 
                setGoals={setGoals} 
                onNavigate={(view, filter) => {
                  setCurrentView(view);
                  if (view === 'kanban' && filter) setKanbanFilter(filter);
                }}
              />
            )}
            {currentView === 'catalog' && <ServiceCatalog services={services} setServices={setServices} currentUser={currentUser} openConfirm={openConfirm} />}
            {currentView === 'teams' && <TeamManagement users={users} setUsers={setUsers} squads={squads} setSquads={setSquads} openConfirm={openConfirm} />}
            {currentView === 'permissions' && <PermissionsManager permissions={rolePermissions} setPermissions={setRolePermissions} openConfirm={openConfirm} />}
            {currentView === 'clients' && <ClientManagement clients={clients} setClients={setClients} squads={initialSquads} services={services} users={users} setUsers={setUsers} openConfirm={openConfirm} tasks={tasks} requisitions={requisitions} currentUser={currentUser} />}
            {currentView === 'system-admin' && <SystemAdmin settings={systemSettings} onUpdateSettings={setSystemSettings} />}
            {currentView === 'approvals' && (
              <Approvals 
                currentUser={currentUser} 
                users={users} 
                clients={clients} 
                batches={approvalBatches}
                setBatches={setApprovalBatches}
                setNotifications={setNotifications}
                squads={squads}
                selectedBatchId={selectedApprovalBatchId}
                setSelectedBatchId={setSelectedApprovalBatchId}
                selectedItemId={selectedApprovalItemId}
                setSelectedItemId={setSelectedApprovalItemId}
              />
            )}
            {currentView === 'help' && <HelpCenter currentUser={currentUser} />}
            {currentView === 'settings' && <ProfileSettings currentUser={currentUser} onUpdateUser={(u) => { setUsers(users.map(us => us.id === u.id ? u : us)); setCurrentUser(u); }} />}
        </div>
      </main>

      {confirmOptions && <ConfirmDialog options={confirmOptions} onConfirm={() => handleConfirmAction(true)} onCancel={() => handleConfirmAction(false)} />}
    </div>
  );
};

export default App;
