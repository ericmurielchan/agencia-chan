
import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { KanbanBoard } from './components/KanbanBoard';
import { CRMModule } from './components/crm/CRMModule';
import { Financials } from './components/Financials';
import { ClientPortal } from './components/ClientPortal';
import { ProductivityDashboard } from './components/ProductivityDashboard';
import { TeamManagement } from './components/TeamManagement';
import { DashboardOverview } from './components/DashboardOverview';
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
import { 
  testSupabaseConnection, 
  fetchUsers, 
  fetchTasks, 
  fetchClients, 
  seedDatabase, 
  fetchLeads, 
  fetchFinancialTransactions, 
  fetchBankAccounts,
  fetchSystemSettings,
  updateSystemSettings,
  saveUser,
  fetchSquads,
  fetchCreditCards,
  saveCreditCard,
  deleteCreditCard,
  saveTask,
  deleteTask,
  saveLead,
  deleteLead,
  saveClient,
  deleteClient,
  saveFinancialTransaction,
  deleteFinancialTransaction,
  saveStockItem,
  deleteStockItem,
  saveAsset,
  deleteAsset,
  saveCashSession,
  saveCashMovement,
  fetchCashSessions,
  fetchCashMovements,
  fetchStockItems,
  fetchAssets,
  fetchRequisitions,
  saveRequisition,
  mapRequisition,
  subscribeToRequisitions,
  fetchAgencyServices,
  saveAgencyService,
  fetchNotifications,
  saveNotification,
  mapNotification,
  subscribeToNotifications,
  fetchApprovalBatches,
  saveApprovalBatch,
  updateApprovalBatchStatus,
  addApprovalItemToBatch,
  deleteApprovalBatch,
  fetchGoals,
  fetchPipelineStages,
  fetchLossReasons,
  fetchCardInvoices,
  saveProductivityGoal,
  deleteSquad,
  saveSquad,
  deleteAgencyService,
  fetchFinancialCategories,
  saveFinancialCategory,
  deleteUser,
  saveBankAccount,
  mapUser,
  mapUserId,
  mapSquad,
  subscribeToUsers,
  subscribeToSquads
} from './services/supabaseService';
import { initialUsers, initialTasks, initialLeads, initialBankAccounts, initialCreditCards, initialFinancialTransactions, initialCardInvoices, initialSquads, initialTaskColumns, initialCrmColumns, initialClients, initialNotifications, initialServices, initialRequisitions, initialLossReasons, initialGoals, initialApprovalBatches, initialStock, initialAssets, initialCashSessions, initialCashMovements, initialCategories } from './utils/mockData';
import { Task, User, Lead, BankAccount, CreditCard, FinancialTransaction, CardInvoice, Role, Squad, ColumnConfig, Client, Notification, SystemModule, AgencyService, Requisition, SystemSettings, LeadTask, ConfirmOptions, LossReason, PipelineStage, ProductivityGoal, ApprovalBatch, StockItem, Asset, CashRegisterSession, CashMovement, FinancialCategory } from './types';
import { Users, Settings, Bell, Check, Gift, AlertTriangle, Info, Clock, CheckCircle, Shield, Trash2, Archive, Eye, DollarSign, Briefcase, Menu, X as XIcon } from 'lucide-react';

const ROLE_LABELS: Record<Role, string> = {
    'ADMIN': 'Administrador',
    'MANAGER': 'Gerente',
    'FINANCE': 'Financeiro',
    'EMPLOYEE': 'Colaborador',
    'COMMERCIAL': 'Comercial',
    'CLIENT': 'Cliente',
    'FREELANCER': 'Freelancer'
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('currentUser');
    const lastActivity = localStorage.getItem('lastActivity');
    if (savedUser && lastActivity) {
      if (Date.now() - Number(lastActivity) < 3600000) {
        // Sessão válida (menos de 1 hora de inatividade)
        try {
          const parsed = JSON.parse(savedUser);
          return parsed;
        } catch (e) {
          return null;
        }
      } else {
        // Expirou por inatividade
        localStorage.removeItem('currentUser');
        localStorage.removeItem('lastActivity');
        localStorage.removeItem('currentView');
      }
    }
    return null;
  });

  const currentUserRef = useRef(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const [currentView, setCurrentView] = useState(() => {
    return localStorage.getItem('currentView') || 'dashboard';
  });

  // Salvar currentView no localStorage sempre que mudar
  useEffect(() => {
    if (currentView) {
      localStorage.setItem('currentView', currentView);
    }
  }, [currentView]);

  // Guard de views protegidas por cargo para segurança robusta
  useEffect(() => {
    if (!currentUser) return;
    
    const role = currentUser.role;
    
    if (role === 'CLIENT') {
      const allowed = ['client-portal', 'help', 'settings', 'privacy'];
      if (!allowed.includes(currentView)) {
        setCurrentView('client-portal');
      }
    } else if (role === 'COMMERCIAL') {
      const allowed = ['crm', 'clients', 'catalog', 'requisitions', 'help', 'settings', 'privacy', 'dashboard'];
      if (!allowed.includes(currentView)) {
        setCurrentView('dashboard');
      }
    } else if (role === 'EMPLOYEE' || role === 'FREELANCER') {
      const restricted = ['finance', 'stock', 'assets', 'system-admin'];
      if (restricted.includes(currentView)) {
        setCurrentView('dashboard');
      }
    }
  }, [currentView, currentUser]);

  // Monitorar atividade do usuário e atualizar timestamp para controle de inatividade
  useEffect(() => {
    if (!currentUser) return;

    const updateActivity = () => {
      localStorage.setItem('lastActivity', Date.now().toString());
    };

    let lastUpdate = 0;
    const handleActivity = () => {
      const now = Date.now();
      if (now - lastUpdate > 5000) { // Throttle de 5s para performance
        updateActivity();
        lastUpdate = now;
      }
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);
    window.addEventListener('click', handleActivity);
    window.addEventListener('touchstart', handleActivity);

    // Verifica a cada 30 segundos se estourou o limite de 1 hora de inatividade
    const checkInterval = setInterval(() => {
      const lastActivity = localStorage.getItem('lastActivity');
      if (lastActivity && Date.now() - Number(lastActivity) > 3600000) {
        handleLogout();
      }
    }, 30000);

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
      clearInterval(checkInterval);
    };
  }, [currentUser]);
  
  const [sidebarOpen, setSidebarOpen] = useState(() => {
    const saved = localStorage.getItem('sidebarOpen');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [sidebarCompact, setSidebarCompact] = useState(() => {
    const saved = localStorage.getItem('sidebarCompact');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [isInitializing, setIsInitializing] = useState(true);

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
      try {
        const connection = await testSupabaseConnection();
        if (connection.success) {
          console.log('Carregando dados reais do Supabase...');
          
          // Lote 1: Essenciais
          let dbUsers = await fetchUsers();
          const [settingsData, clientsData, squadsData] = await Promise.all([
            fetchSystemSettings(), fetchClients(), fetchSquads()
          ]);
          
          if (dbUsers.length === 0) {
            console.log('Semeando usuários iniciais no Supabase...');
            await Promise.all(initialUsers.map(u => saveUser(u)));
            dbUsers = await fetchUsers();
          }

          // Garantir que o usuário atual logado não foi excluído. Se foi, efetuar logout.
          const savedUser = localStorage.getItem('currentUser');
          if (savedUser) {
            try {
              const parsedUser = JSON.parse(savedUser);
              if (parsedUser && !dbUsers.some(u => u.id === parsedUser.id)) {
                console.warn('Usuário autenticado não existe mais no banco de dados. Efetuando logout automático.');
                localStorage.removeItem('currentUser');
                setCurrentUser(null);
              }
            } catch (e) {
              console.error('Erro ao verificar status do usuário atual:', e);
            }
          }
          
          setUsers(dbUsers as any);
          if (settingsData) setSystemSettings(settingsData);
          setClients(clientsData as any);
          if (squadsData.length > 0) setSquads(squadsData as any);

          // Lote 2: Operacional
          const [tasksData, leadsData, financialData, bankData, cardsData, categoriesData, crmColumnsData, lossReasonsData, invoicesData] = await Promise.all([
            fetchTasks(), fetchLeads(), fetchFinancialTransactions(), fetchBankAccounts(), fetchCreditCards(), fetchFinancialCategories(), fetchPipelineStages(), fetchLossReasons(), fetchCardInvoices()
          ]);

          setTasks(tasksData as any);
          setLeads(leadsData as any);
          setFinancialTransactions(financialData as any);
          setBankAccounts(bankData as any);
          if (cardsData.length > 0) setCreditCards(cardsData as any);
          if (categoriesData.length > 0) setCategories(categoriesData as any);
          if (crmColumnsData.length > 0) setCrmColumns(crmColumnsData as any);
          if (lossReasonsData.length > 0) setLossReasons(lossReasonsData as any);
          if (invoicesData.length > 0) setCardInvoices(invoicesData as any);

          // Lote 3: Restante
          const [stockData, assetsData, cashSessionsData, cashMovementsData, requisitionsData, servicesData, notificationsData, batchesData, goalsData] = await Promise.all([
            fetchStockItems(), fetchAssets(), fetchCashSessions(), fetchCashMovements(), fetchRequisitions(), fetchAgencyServices(), fetchNotifications(), fetchApprovalBatches(), fetchGoals()
          ]);
          
          setStock(stockData as any);
          setAssets(assetsData as any);
          setCashSessions(cashSessionsData as any);
          setCashMovements(cashMovementsData as any);
          setRequisitions(requisitionsData as any);
          if (servicesData && servicesData.length > 0) {
              setServices(servicesData as any);
          } else {
              setServices(initialServices);
          }
          setNotifications(notificationsData as any);
          setApprovalBatches(batchesData as any);
          setGoals(goalsData as any);
        } else {
          console.warn('Conexão com Supabase falhou, usando dados mock.');
        }
      } catch (err) {
        console.error('Erro crítico na inicialização do Supabase:', err);
      } finally {
        setIsInitializing(false);
      }
    };
    initSupabase();
  }, []);

  // Real-time notifications
  useEffect(() => {
    const subscription = subscribeToNotifications((payload) => {
      console.log('Nova mudança na notificação:', payload);
      
      if (payload.eventType === 'INSERT') {
        const newNotif = mapNotification(payload.new);
        setNotifications(prev => {
          if (prev.some(n => n.id === newNotif.id)) return prev;
          return [newNotif, ...prev];
        });
      } else if (payload.eventType === 'UPDATE') {
        const updatedNotif = mapNotification(payload.new);
        setNotifications(prev => prev.map(n => n.id === updatedNotif.id ? updatedNotif : n));
      } else if (payload.eventType === 'DELETE') {
        setNotifications(prev => prev.filter(n => n.id !== payload.old.id));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Real-time requisitions
  useEffect(() => {
    const subscription = subscribeToRequisitions((payload) => {
      console.log('Nova mudança na requisição:', payload);
      
      if (payload.eventType === 'INSERT') {
        const newReq = mapRequisition(payload.new);
        setRequisitions(prev => {
          if (prev.some(r => r.id === newReq.id)) return prev;
          return [...prev, newReq];
        });
      } else if (payload.eventType === 'UPDATE') {
        const updatedReq = mapRequisition(payload.new);
        setRequisitions(prev => prev.map(r => r.id === updatedReq.id ? updatedReq : r));
      } else if (payload.eventType === 'DELETE') {
        setRequisitions(prev => prev.filter(r => r.id !== payload.old.id));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Real-time users
  useEffect(() => {
    const subscription = subscribeToUsers((payload) => {
      console.log('Realtime: mudança no colaborador:', payload);
      
      if (payload.eventType === 'INSERT') {
        const newUser = mapUser(payload.new);
        setUsers(prev => {
          if (prev.some(u => u.id === newUser.id)) return prev;
          return [...prev, newUser];
        });
      } else if (payload.eventType === 'UPDATE') {
        const updatedUser = mapUser(payload.new);
        setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      } else if (payload.eventType === 'DELETE') {
        const deletedId = payload.old.id;
        setUsers(prev => prev.filter(u => u.id !== deletedId && mapUserId(u.id) !== deletedId));

        // Se o usuário logado atualmente é o que foi deletado, deslogar imediatamente em tempo real
        const currentActive = currentUserRef.current;
        if (currentActive) {
          const currentActiveMappedId = mapUserId(currentActive.id) || currentActive.id;
          if (currentActive.id === deletedId || currentActiveMappedId === deletedId) {
            console.warn('O usuário ativo foi deletado via tempo real. Efetuando logout automático...');
            localStorage.removeItem('currentUser');
            setCurrentUser(null);
          }
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Real-time squads
  useEffect(() => {
    const subscription = subscribeToSquads((payload) => {
      console.log('Realtime: mudança na squad:', payload);
      
      if (payload.eventType === 'INSERT') {
        const newSquad = mapSquad(payload.new);
        setSquads(prev => {
          if (prev.some(s => s.id === newSquad.id)) return prev;
          return [...prev, newSquad];
        });
      } else if (payload.eventType === 'UPDATE') {
        const updatedSquad = mapSquad(payload.new);
        setSquads(prev => prev.map(s => s.id === updatedSquad.id ? updatedSquad : s));
      } else if (payload.eventType === 'DELETE') {
        setSquads(prev => prev.filter(s => s.id !== payload.old.id));
      }
    });

    return () => {
      subscription.unsubscribe();
    };
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
      const options = confirmOptions;
      setConfirmOptions(null);
      if (result && options?.onConfirm) {
          options.onConfirm();
      }
      if (confirmResolveRef.current) confirmResolveRef.current(result);
  };

  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(initialBankAccounts);
  const [creditCards, setCreditCards] = useState<CreditCard[]>(initialCreditCards);
  const [financialTransactions, setFinancialTransactions] = useState<FinancialTransaction[]>(initialFinancialTransactions);
  const [categories, setCategories] = useState<FinancialCategory[]>(initialCategories);
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
  const [stock, setStock] = useState<StockItem[]>(initialStock);
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [cashSessions, setCashSessions] = useState<CashRegisterSession[]>(initialCashSessions);
  const [cashMovements, setCashMovements] = useState<CashMovement[]>(initialCashMovements);
  const [goals, setGoals] = useState<ProductivityGoal[]>(initialGoals);
  const [approvalBatches, setApprovalBatches] = useState<ApprovalBatch[]>(initialApprovalBatches);
  const [leadSources, setLeadSources] = useState<string[]>(['Instagram', 'Linkedin', 'Google Ads', 'Indicação', 'Site']);
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
      agencyName: 'Agência Chan',
      logo: '',
      favicon: '',
      primaryColor: '#db2777',
      sidebarColor: '#0f172a'
  });

  // Guard against restricted views for various roles
  useEffect(() => {
    if (!currentUser) return;

    if (currentUser.role === 'COMMERCIAL') {
      const restrictedViews = [
        'dashboard', 'kanban', 'productivity', 'teams', 
        'approvals', 'finance', 'stock', 'assets', 'system-admin'
      ];
      if (restrictedViews.includes(currentView)) {
        setCurrentView('crm');
      }
    } else if (currentUser.role === 'EMPLOYEE' || currentUser.role === 'FREELANCER') {
      const restrictedViews = [
        'finance', 'stock', 'assets', 'system-admin'
      ];
      if (restrictedViews.includes(currentView)) {
        setCurrentView('dashboard');
      }
    }
  }, [currentUser, currentView]);

  // Apply Favicon and Title
  useEffect(() => {
    document.title = systemSettings.agencyName;
    
    const link: HTMLLinkElement = document.querySelector("link[rel*='icon']") || document.createElement('link');
    link.type = 'image/x-icon';
    link.rel = 'shortcut icon';
    link.href = systemSettings.favicon || '/favicon.ico';
    document.getElementsByTagName('head')[0].appendChild(link);
  }, [systemSettings.favicon, systemSettings.agencyName]);

  const [showNotifications, setShowNotifications] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);
  const [taskColumns, setTaskColumns] = useState<ColumnConfig[]>(initialTaskColumns);
  const [crmColumns, setCrmColumns] = useState<PipelineStage[]>(initialCrmColumns as any);
  const [lossReasons, setLossReasons] = useState<LossReason[]>(initialLossReasons);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogin = async (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    localStorage.setItem('lastActivity', Date.now().toString());
    
    try {
      await saveUser(user);
      const dbUsers = await fetchUsers();
      if (dbUsers && dbUsers.length > 0) {
        setUsers(dbUsers as any);
      }
    } catch (err) {
      console.error('Erro ao sincronizar login com o Supabase:', err);
    }
    
    if (user.role === 'CLIENT') setCurrentView('client-portal');
    else if (user.role === 'COMMERCIAL') setCurrentView('crm');
    else {
        setCurrentView('dashboard');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('lastActivity');
    localStorage.removeItem('currentView');
    setCurrentView('dashboard');
  };

  const handleNotificationClick = async (notif: Notification) => {
    // Mark as read
    const updatedNotif = { ...notif, status: 'READ' as const };
    setNotifications(prev => prev.map(n => n.id === notif.id ? updatedNotif : n));
    await saveNotification(updatedNotif);

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

  const markAllAsRead = async () => {
    const userUnread = notifications.filter(n => 
      n.status === 'UNREAD' && 
      (n.targetUserId === currentUser.id || (!n.targetUserId && (!n.targetRole || n.targetRole === currentUser.role)))
    );
    
    setNotifications(prev => prev.map(n => {
      const isMine = n.targetUserId === currentUser.id || (!n.targetUserId && (!n.targetRole || n.targetRole === currentUser.role));
      return (n.status === 'UNREAD' && isMine) ? { ...n, status: 'READ' } : n;
    }));
    
    // Persistir no Supabase
    await Promise.all(userUnread.map(n => saveNotification({ ...n, status: 'READ' })));
  };

  const addNotification = async (data: Omit<Notification, 'id' | 'timestamp' | 'status'> & { id?: string }) => {
    const now = Date.now();
    const newNotif: Notification = {
        ...data,
        id: data.id || `notif-${now}-${Math.random().toString(36).substr(2, 5)}`,
        timestamp: now,
        status: 'UNREAD'
    };
    
    setNotifications(prev => {
        if (prev.some(n => n.id === newNotif.id)) return prev;
        return [newNotif, ...prev];
    });
    await saveNotification(newNotif);
  };

  if (isInitializing) {
    return (
      <div className="fixed inset-0 bg-slate-950 flex flex-col items-center justify-center text-slate-200 z-[99999]" id="app-initializer">
        <div className="flex flex-col items-center gap-4 max-w-sm text-center px-4">
          <div className="w-16 h-16 relative flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-slate-800 border-t-pink-600 animate-spin" />
            <span className="text-xl font-black text-pink-500">OS</span>
          </div>
          <div className="space-y-2 mt-4">
            <h1 className="text-xl font-extrabold tracking-tight text-white">{systemSettings.agencyName || 'Agência Chan'}</h1>
            <p className="text-xs text-pink-500/80 font-bold tracking-wider uppercase font-mono animate-pulse">Sincronizando com Supabase...</p>
            <p className="text-xs text-slate-400 font-mono">Carregando módulos da agência...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser) {
      if (currentView === 'privacy') return <PrivacyPolicy onBack={() => setCurrentView('login')} agencyName={systemSettings.agencyName} />;
      if (currentView === 'help') return <div className="p-4 md:p-8"><HelpCenter currentUser={{id:'g', name:'G', email:'', role:'EMPLOYEE', avatar:''}} /></div>;
      return <Login onLogin={handleLogin} users={users} systemSettings={systemSettings} onNavigate={setCurrentView} />;
  }

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
                                    {(notifications.length > 0 && currentUser.preferences?.systemNotifications !== false) ? (
                                        <div className="divide-y divide-slate-50">
                                            {notifications
                                                .filter(filterNotification)
                                                .sort((a, b) => b.timestamp - a.timestamp)
                                                .map(notif => (
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
                            <p className="text-[8px] md:text-[10px] text-slate-400 uppercase font-black mt-1 tracking-wider">{ROLE_LABELS[currentUser.role] || currentUser.role}</p>
                        </div>
                        <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-2xl overflow-hidden border-2 border-slate-50 bg-slate-100 shrink-0 flex items-center justify-center">
                          {currentUser.avatar && currentUser.avatar.length > 5 ? (
                            <img src={currentUser.avatar} alt="Perfil" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-pink-50 text-pink-500 font-bold text-xs uppercase">
                              {currentUser.name.charAt(0)}
                            </div>
                          )}
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
                addNotification={addNotification}
                onNotificationClick={handleNotificationClick}
                onMarkAllAsRead={markAllAsRead}
                sidebarOpen={sidebarOpen}
                sidebarCompact={sidebarCompact}
                isMobile={isMobile}
                clients={clients}
                selectedTaskId={selectedTaskId}
                onClearSelectedTask={() => setSelectedTaskId(null)}
                initialFilter={kanbanFilter}
                onClearFilter={() => setKanbanFilter(null)}
                squads={squads}
                onNavigate={(view, refId) => {
                  setCurrentView(view);
                  if (view === 'kanban' && refId) setSelectedTaskId(refId);
                  if (view === 'crm' && refId) setSelectedLeadId(refId);
                  if (view === 'finance' && refId) setSelectedTransactionId(refId);
                }}
                onSaveTask={async (task) => {
                    const isNew = !tasks.find(t => t.id === task.id);
                    const result = await saveTask(task);
                    if (result.success) {
                        setTasks(prev => {
                            const exists = prev.some(t => t.id === task.id);
                            if (exists) return prev.map(t => t.id === task.id ? task : t);
                            return [...prev, task];
                        });

                        // Emit notification if assigned to someone else
                        if (task.assigneeIds && task.assigneeIds.length > 0) {
                            task.assigneeIds.forEach(assigneeId => {
                                if (assigneeId !== currentUser.id) {
                                    addNotification({
                                        title: isNew ? 'Nova Tarefa Atribuída' : 'Tarefa Atualizada',
                                        message: `Você foi atribuído à tarefa: ${task.title}`,
                                        type: 'INFO',
                                        priority: 'MEDIUM',
                                        originModule: 'KANBAN',
                                        targetUserId: assigneeId,
                                        navToView: 'kanban',
                                        metadata: { referenceId: task.id, module: 'tasks' }
                                    });
                                }
                            });
                        }
                    }
                }}
                onDeleteTask={async (id) => {
                    const result = await deleteTask(id);
                    if (result.success) {
                        setTasks(prev => prev.filter(t => t.id !== id));
                    }
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
                currentUser={currentUser!}
                clients={clients}
                setClients={setClients}
                notifications={notifications}
                addNotification={addNotification}
                openConfirm={openConfirm}
                selectedLeadId={selectedLeadId}
                onClearSelectedLead={() => setSelectedLeadId(null)}
                squads={squads}
                onNavigate={(view, refId) => {
                  setCurrentView(view);
                  if (view === 'kanban' && refId) setSelectedTaskId(refId);
                  if (view === 'crm' && refId) setSelectedLeadId(refId);
                  if (view === 'finance' && refId) setSelectedTransactionId(refId);
                }}
                onSaveLead={async (lead) => {
                    const result = await saveLead(lead);
                    if (result.success) {
                        setLeads(prev => {
                            const exists = prev.some(l => l.id === lead.id);
                            if (exists) return prev.map(l => l.id === lead.id ? lead : l);
                            return [...prev, lead];
                        });
                    } else {
                        const errorDetails = result.error ? (result.error.message || JSON.stringify(result.error)) : 'Desconhecido';
                        throw new Error(`Erro no banco de dados: ${errorDetails}`);
                    }
                }}
                onDeleteLead={async (id) => {
                    const result = await deleteLead(id);
                    if (result.success) {
                        setLeads(prev => prev.filter(l => l.id !== id));
                    }
                }}
                bankAccounts={bankAccounts}
                categories={categories}
                onSaveTransaction={async (t) => {
                    const res = await saveFinancialTransaction(t);
                    if (res.success) {
                        setFinancialTransactions(prev => [t as FinancialTransaction, ...prev.filter(x => x.id !== t.id)]);
                        if (t.status === 'PAID' && t.bankAccountId) {
                            setBankAccounts(prev => {
                                const matched = prev.find(acc => acc.id === t.bankAccountId);
                                if (matched) {
                                    const updatedBalance = t.type === 'INCOME' 
                                        ? matched.balance + t.amount 
                                        : matched.balance - t.amount;
                                    const updatedAcc = { ...matched, balance: updatedBalance };
                                    saveBankAccount(updatedAcc).catch(err => {
                                        console.error('Erro ao atualizar saldo da conta bancaria:', err);
                                    });
                                    return prev.map(acc => acc.id === t.bankAccountId ? updatedAcc : acc);
                                }
                                return prev;
                            });
                        }
                    } else {
                        const errorDetails = res.error ? (res.error.message || JSON.stringify(res.error)) : 'Desconhecido';
                        throw new Error(`Erro no banco de dados ao salvar transação: ${errorDetails}`);
                    }
                }}
              />
            )}
            {currentView === 'requisitions' && (
              <Requisitions 
                requisitions={requisitions} 
                setRequisitions={setRequisitions} 
                currentUser={currentUser} 
                users={users} 
                addNotification={addNotification} 
                openConfirm={openConfirm}
                setTransactions={setFinancialTransactions} 
                clients={clients} 
                onSaveRequisition={async (req) => {
                    const result = await saveRequisition(req);
                    if (result.success) {
                        setRequisitions(prev => {
                            const exists = prev.some(r => r.id === req.id);
                            if (exists) return prev.map(r => r.id === req.id ? req as Requisition : r);
                            return [...prev, req as Requisition];
                        });
                    } else {
                        alert('Erro ao salvar solicitação no banco de dados: ' + (result.error?.message || result.error || 'Erro desconhecido'));
                    }
                }}
              />
            )}
            {(currentView === 'finance' || currentView === 'stock' || currentView === 'assets') && (
              <Financials 
                bankAccounts={bankAccounts}
                setBankAccounts={setBankAccounts}
                creditCards={creditCards}
                setCreditCards={setCreditCards}
                transactions={financialTransactions}
                setTransactions={setFinancialTransactions}
                cardInvoices={cardInvoices}
                setCardInvoices={setCardInvoices}
                stock={stock}
                setStock={setStock}
                assets={assets}
                setAssets={setAssets}
                cashSessions={cashSessions}
                setCashSessions={setCashSessions}
                cashMovements={cashMovements}
                setCashMovements={setCashMovements}
                currentUser={currentUser!} 
                users={users} 
                onSaveUser={async (user) => {
                    if (currentUser?.role === 'EMPLOYEE' || currentUser?.role === 'FREELANCER' || currentUser?.role === 'CLIENT') {
                        alert('Erro: Você não tem permissão para editar dados de colaboradores.');
                        return;
                    }
                    const result = await saveUser(user);
                    if (result.success) {
                        setUsers(prev => {
                            const exists = prev.some(u => u.id === user.id);
                            if (exists) return prev.map(u => u.id === user.id ? user as User : u);
                            return [...prev, user as User];
                        });
                    } else {
                        alert('Erro ao salvar dados do colaborador: ' + (result.error?.message || result.error || 'Erro desconhecido'));
                    }
                }}
                clients={clients}
                squads={squads}
                leads={leads}
                categories={categories}
                setCategories={setCategories}
                openConfirm={openConfirm}
                selectedTransactionId={selectedTransactionId}
                onClearSelectedTransaction={() => setSelectedTransactionId(null)}
                selectedInvoiceId={selectedInvoiceId}
                onClearSelectedInvoice={() => setSelectedInvoiceId(null)}
                onSaveTransaction={async (t) => {
                    const result = await saveFinancialTransaction(t);
                    if (result.success) {
                        setFinancialTransactions(prev => {
                            const exists = prev.some(item => item.id === t.id);
                            if (exists) return prev.map(item => item.id === t.id ? t : item);
                            return [t, ...prev];
                        });
                    }
                }}
                onDeleteTransaction={async (id) => {
                    const result = await deleteFinancialTransaction(id);
                    if (result.success) {
                        setFinancialTransactions(prev => prev.filter(t => t.id !== id));
                    }
                }}
                onSaveStockItem={async (item) => {
                    const result = await saveStockItem(item);
                    if (result.success) {
                        setStock(prev => {
                            const exists = prev.some(s => s.id === item.id);
                            if (exists) return prev.map(s => s.id === item.id ? item as StockItem : s);
                            return [...prev, item as StockItem];
                        });
                    }
                }}
                onDeleteStockItem={async (id) => {
                    const result = await deleteStockItem(id);
                    if (result.success) {
                        setStock(prev => prev.filter(s => s.id !== id));
                    }
                }}
                onSaveAsset={async (asset) => {
                    const result = await saveAsset(asset);
                    if (result.success) {
                        setAssets(prev => {
                            const exists = prev.some(a => a.id === asset.id);
                            if (exists) return prev.map(a => a.id === asset.id ? asset as Asset : a);
                            return [...prev, asset as Asset];
                        });
                    }
                }}
                onDeleteAsset={async (id) => {
                    const result = await deleteAsset(id);
                    if (result.success) {
                        setAssets(prev => prev.filter(a => a.id !== id));
                    }
                }}
                onSaveCashSession={async (session) => {
                    const result = await saveCashSession(session);
                    if (result.success) {
                        setCashSessions(prev => {
                            const exists = prev.some(s => s.id === session.id);
                            if (exists) return prev.map(s => s.id === session.id ? session as CashRegisterSession : s);
                            return [session as CashRegisterSession, ...prev];
                        });
                    }
                }}
                onSaveCashMovement={async (movement) => {
                    const result = await saveCashMovement(movement);
                    if (result.success) {
                        setCashMovements(prev => [...prev, movement as CashMovement]);
                    }
                }}
                initialTab={currentView === 'stock' ? 'STOCK' : currentView === 'assets' ? 'ASSETS' : 'DASHBOARD'}
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
                addNotification={addNotification} 
                onNavigate={setCurrentView} 
                setSelectedBatchId={setSelectedApprovalBatchId}
              />
            )}
            {currentView === 'productivity' && (
              <ProductivityDashboard 
                tasks={tasks} 
                setTasks={setTasks} 
                users={users} 
                squads={squads} 
                clients={clients} 
                currentUser={currentUser} 
                addNotification={addNotification} 
                goals={goals} 
                setGoals={setGoals} 
                onNavigate={(view, filter) => {
                  setCurrentView(view);
                  if (view === 'kanban' && filter) setKanbanFilter(filter);
                }}
                onSaveGoal={async (goal) => {
                    const result = await saveProductivityGoal(goal);
                    if (result.success) {
                        setGoals(prev => {
                            const exists = prev.some(g => g.id === goal.id);
                            if (exists) return prev.map(g => g.id === goal.id ? goal : g);
                            return [...prev, goal];
                        });
                    }
                }}
              />
            )}
            {currentView === 'catalog' && (
              <ServiceCatalog 
                services={services} 
                setServices={setServices} 
                currentUser={currentUser} 
                openConfirm={openConfirm} 
                onSaveService={async (service) => {
                    // Update state locally first for instant feedback & functional completeness
                    const savedService = { ...service };
                    setServices(prev => {
                        const exists = prev.some(s => s.id === savedService.id);
                        if (exists) return prev.map(s => s.id === savedService.id ? savedService : s);
                        return [...prev, savedService];
                    });
                    
                    const result = await saveAgencyService(savedService);
                    if (!result.success) {
                        console.error('Erro ao sincronizar serviço com o banco:', result.error);
                    } else if (result.serviceId && result.serviceId !== savedService.id) {
                        // Se o id foi redefinido no banco, sincroniza no estado
                        setServices(prev => prev.map(s => s.id === savedService.id ? { ...savedService, id: result.serviceId } : s));
                    }
                }}
                onDeleteService={async (id) => {
                    // Delete locally first for instant feedback
                    setServices(prev => prev.filter(s => s.id !== id));
                    
                    const result = await deleteAgencyService(id);
                    if (!result.success) {
                        console.error('Erro ao excluir serviço do banco:', result.error);
                    }
                }}
              />
            )}
            {currentView === 'teams' && (
              <TeamManagement 
                users={users} 
                setUsers={setUsers} 
                squads={squads} 
                setSquads={setSquads} 
                tasks={tasks}
                setTasks={setTasks}
                leads={leads}
                setLeads={setLeads}
                clients={clients}
                setClients={setClients}
                openConfirm={openConfirm} 
                currentUserRole={currentUser?.role}
                currentUserId={currentUser?.id}
                onSaveUser={async (user) => {
                    if (currentUser?.role === 'EMPLOYEE' || currentUser?.role === 'FREELANCER' || currentUser?.role === 'CLIENT') {
                        alert('Erro: Você não tem permissão para salvar colaboradores.');
                        return;
                    }
                    const result = await saveUser(user);
                    if (result.success) {
                        setUsers(prev => {
                            const exists = prev.some(u => u.id === user.id);
                            if (exists) return prev.map(u => u.id === user.id ? user as User : u);
                            return [...prev, user as User];
                        });
                    }
                }}
                onDeleteUser={async (id) => {
                    if (currentUser?.role === 'EMPLOYEE' || currentUser?.role === 'FREELANCER' || currentUser?.role === 'CLIENT') {
                        alert('Erro: Você não tem permissão para excluir colaboradores.');
                        return;
                    }
                    
                    const mappedId = mapUserId(id) || id;

                    // Deslogar o usuário atual ANTES de prosseguir com a exclusão, caso ele esteja logado na mesma janela,
                    // garantindo que nenhuma requisição ou sincronização automática posterior recrie ou interfira na exclusão.
                    if (currentUser && (currentUser.id === id || currentUser.id === mappedId)) {
                        console.warn('O usuário atual está sendo excluído. Efetuando logout preventivo automático...');
                        localStorage.removeItem('currentUser');
                        setCurrentUser(null);
                    }
                    
                    // 1. Clean up user from any squads they belong to in DB and local state
                    const userSquads = squads.filter(s => s.members?.includes(id) || s.members?.includes(mappedId));
                    for (const squad of userSquads) {
                        const updatedMembers = (squad.members || []).filter(mId => mId !== id && mId !== mappedId);
                        const updatedSquad = { ...squad, members: updatedMembers };
                        await saveSquad(updatedSquad);
                        setSquads(prev => prev.map(s => s.id === squad.id ? updatedSquad : s));
                    }

                    // 2. Clear user from local user state and execute DB deletion
                    setUsers(prev => prev.filter(u => u.id !== id && u.id !== mappedId));
                    const result = await deleteUser(id);
                    if (!result.success) {
                        console.error('Erro ao excluir colaborador no banco:', result.error);
                        alert('Erro ao excluir do banco de dados: ' + (result.error?.message || result.error || 'Erro desconhecido'));
                    }
                }}
                onSaveSquad={async (squad) => {
                    const result = await saveSquad(squad);
                    if (result.success) {
                        setSquads(prev => {
                            const exists = prev.some(s => s.id === squad.id);
                            if (exists) return prev.map(s => s.id === squad.id ? squad as Squad : s);
                            return [...prev, squad as Squad];
                        });
                    }
                }}
                onDeleteSquad={async (id) => {
                    const result = await deleteSquad(id);
                    if (result.success) {
                        setSquads(prev => prev.filter(s => s.id !== id));
                        // Dissociar localmente para manter a interface sincronizada
                        setUsers(prev => prev.map(u => u.squad === id ? { ...u, squad: undefined } : u));
                        setClients(prev => prev.map(c => c.squadId === id ? { ...c, squadId: undefined } : c));
                        setTasks(prev => prev.map(t => t.squadId === id ? { ...t, squadId: undefined } : t));
                    }
                }}
              />
            )}
            {currentView === 'clients' && (
              <ClientManagement 
                clients={clients} 
                setClients={setClients} 
                squads={squads} 
                services={services} 
                users={users} 
                setUsers={setUsers} 
                openConfirm={openConfirm} 
                tasks={tasks} 
                requisitions={requisitions} 
                currentUser={currentUser} 
                onSaveClient={async (client) => {
                    const result = await saveClient(client);
                    if (result.success) {
                        setClients(prev => {
                            const exists = prev.some(c => c.id === client.id);
                            if (exists) return prev.map(c => c.id === client.id ? client as Client : c);
                            return [...prev, client as Client];
                        });
                    }
                }}
                onDeleteClient={async (id) => {
                    const result = await deleteClient(id);
                    if (result.success) {
                        setClients(prev => prev.filter(c => c.id !== id));
                    }
                }}
              />
            )}
            {currentView === 'system-admin' && (
              <SystemAdmin 
                settings={systemSettings} 
                currentUserRole={currentUser?.role}
                onUpdateSettings={async (newSettings) => {
                  setSystemSettings(newSettings);
                  await updateSystemSettings(newSettings);
                }} 
              />
            )}
            {currentView === 'approvals' && (
              <Approvals 
                currentUser={currentUser} 
                users={users} 
                clients={clients} 
                batches={approvalBatches}
                setBatches={setApprovalBatches}
                addNotification={addNotification}
                squads={squads}
                selectedBatchId={selectedApprovalBatchId}
                setSelectedBatchId={setSelectedApprovalBatchId}
                selectedItemId={selectedApprovalItemId}
                setSelectedItemId={setSelectedApprovalItemId}
                openConfirm={openConfirm}
                onSaveBatch={async (batch) => {
                    const result = await saveApprovalBatch(batch);
                    if (result.success) {
                        setApprovalBatches(prev => {
                            const existingBatch = prev.find(b => b.id === batch.id);
                            if (existingBatch) {
                                return prev.map(b => b.id === batch.id ? { ...b, ...batch } as ApprovalBatch : b);
                            }
                            return [...prev, batch as ApprovalBatch];
                        });
                    }
                }}
                onDeleteBatch={async (id) => {
                    const result = await deleteApprovalBatch(id);
                    if (result.success) {
                        setApprovalBatches(prev => prev.filter(b => b.id !== id));
                    }
                }}
                onUpdateStatus={async (id, status) => {
                    const result = await updateApprovalBatchStatus(id, status);
                    if (result.success) {
                        setApprovalBatches(prev => prev.map(b => b.id === id ? { ...b, status, updatedAt: Date.now() } : b));
                    }
                }}
                onAddItem={async (batchId, items) => {
                    const result = await addApprovalItemToBatch(batchId, items);
                    if (result.success) {
                        setApprovalBatches(prev => prev.map(b => b.id === batchId ? { ...b, items, updatedAt: Date.now() } : b));
                    }
                }}
              />
            )}
            {currentView === 'help' && <HelpCenter currentUser={currentUser} />}
            {currentView === 'settings' && (
              <ProfileSettings 
                currentUser={currentUser} 
                onUpdateUser={async (u) => { 
                  setUsers(users.map(us => us.id === u.id ? u : us)); 
                  setCurrentUser(u); 
                  await saveUser(u);
                }} 
              />
            )}
        </div>
      </main>

      {confirmOptions && <ConfirmDialog options={confirmOptions} onConfirm={() => handleConfirmAction(true)} onCancel={() => handleConfirmAction(false)} />}
    </div>
  );
};

export default App;
