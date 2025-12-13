
import React, { useState, useEffect, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { KanbanBoard } from './components/KanbanBoard';
import { CRM } from './components/CRM';
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
import { HelpCenter } from './components/HelpCenter';
import { PrivacyPolicy } from './components/PrivacyPolicy';
import { Login } from './components/Login';
import { initialUsers, initialTasks, initialLeads, initialFinancialRecords, initialSquads, initialTaskColumns, initialCrmColumns, initialAssets, initialRolePermissions, initialClients, initialNotifications, initialServices, initialRequisitions } from './utils/mockData';
import { Task, User, Lead, FinancialRecord, Role, Squad, ColumnConfig, Asset, RolePermissions, Client, Notification, AgencyService, Requisition, SystemSettings } from './types';
import { Users, Settings, Bell, Check, Gift, AlertTriangle, Info, Clock, CheckCircle, Shield } from 'lucide-react';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  
  // State Management
  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [transactions, setTransactions] = useState<FinancialRecord[]>(initialFinancialRecords);
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [squads, setSquads] = useState<Squad[]>(initialSquads);
  const [clients, setClients] = useState<Client[]>(initialClients);
  const [services, setServices] = useState<AgencyService[]>(initialServices);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [requisitions, setRequisitions] = useState<Requisition[]>(initialRequisitions);
  
  // NEW: System Settings State
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
      agencyName: 'Agência Chan',
      logo: '',
      primaryColor: '#db2777', // Default Pink
      sidebarColor: '#0f172a' // Default Slate 900
  });

  const [showNotifications, setShowNotifications] = useState(false);
  
  // Refs
  const notificationRef = useRef<HTMLDivElement>(null);
  
  // Config States
  const [taskColumns, setTaskColumns] = useState<ColumnConfig[]>(initialTaskColumns);
  const [crmColumns, setCrmColumns] = useState<ColumnConfig[]>(initialCrmColumns);
  const [rolePermissions, setRolePermissions] = useState<RolePermissions>(initialRolePermissions);

  // Click Outside Handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Check for notifications logic (omitted for brevity, assume same as before)
  useEffect(() => {
      const todayDate = new Date();
      todayDate.setHours(0,0,0,0);
      const todayStr = todayDate.toISOString().split('T')[0];
      
      clients.forEach(c => {
          c.contacts.forEach(contact => {
              if (contact.birthDate === todayStr) {
                  const id = `bday-${c.id}-${contact.email}`;
                  if(!notifications.find(n => n.id === id)) {
                      setNotifications(prev => [...prev, {
                          id,
                          title: 'Aniversariante do Dia',
                          message: `Hoje é aniversário de ${contact.name} (${c.name})`,
                          type: 'Birthday',
                          read: false,
                          timestamp: Date.now(),
                          navToView: 'clients'
                      }]);
                  }
              }
          });
      });
  }, [clients, notifications]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'CLIENT') {
        setCurrentView('client-portal');
    } else {
        const allowed = rolePermissions[user.role] || [];
        if (allowed.includes('dashboard')) {
            setCurrentView('dashboard');
        } else if (allowed.length > 0) {
            setCurrentView(allowed[0]);
        } else {
            setCurrentView('dashboard'); 
        }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setCurrentView('dashboard');
  };

  const handleUpdateUser = (updatedUser: User) => {
      setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
      setCurrentUser(updatedUser);
  };

  const handleNotificationClick = (notif: Notification) => {
      setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
      
      if (notif.navToView) {
          const allowedModules = rolePermissions[currentUser?.role || 'EMPLOYEE'] || [];
          if (allowedModules.includes(notif.navToView) || (currentUser?.role === 'CLIENT' && notif.navToView === 'requisitions')) {
              setCurrentView(notif.navToView);
          }
      }
      setShowNotifications(false);
  };

  const markAllAsRead = () => {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const getNotificationIcon = (type: string) => {
      switch (type) {
          case 'Birthday': return <Gift size={18} className="text-purple-500" />;
          case 'WARNING': return <AlertTriangle size={18} className="text-red-500" />;
          case 'SUCCESS': return <CheckCircle size={18} className="text-emerald-500" />;
          default: return <Info size={18} className="text-blue-500" />;
      }
  };

  // --- PUBLIC NAVIGATION LOGIC ---
  if (!currentUser) {
      if (currentView === 'privacy') {
          return <PrivacyPolicy onBack={() => setCurrentView('login')} agencyName={systemSettings.agencyName} />;
      }
      if (currentView === 'help') {
          // Dummy Guest User for Help Center visualization
          const guestUser: User = { id: 'guest', name: 'Visitante', email: '', role: 'EMPLOYEE', avatar: '', hasSystemAccess: false };
          return (
              <div className="min-h-screen bg-slate-50 p-8">
                  <div className="mb-4">
                      <button onClick={() => setCurrentView('login')} className="text-slate-500 hover:text-slate-800 font-medium text-sm">← Voltar para Login</button>
                  </div>
                  <HelpCenter currentUser={guestUser} />
              </div>
          );
      }
      
      return <Login onLogin={handleLogin} users={users} systemSettings={systemSettings} onNavigate={setCurrentView} />;
  }

  const renderContent = () => {
    if (currentView === 'settings') {
        return <ProfileSettings currentUser={currentUser} onUpdateUser={handleUpdateUser} />;
    }
    if (currentView === 'help') {
        return <HelpCenter currentUser={currentUser} />;
    }
    if (currentView === 'privacy') {
        return <PrivacyPolicy onBack={() => setCurrentView('dashboard')} agencyName={systemSettings.agencyName} />;
    }

    const allowedModules = rolePermissions[currentUser.role] || [];
    const globalViews = ['dashboard', 'client-portal', 'help', 'privacy'];

    if (!globalViews.includes(currentView) && !allowedModules.includes(currentView)) {
        return <div className="p-8 text-center text-slate-500">Acesso não autorizado a este módulo.</div>;
    }

    switch (currentView) {
      case 'dashboard':
        return <DashboardOverview tasks={tasks} leads={leads} finance={transactions} users={users} />;
      case 'kanban':
        return <KanbanBoard 
            tasks={tasks} setTasks={setTasks} 
            users={users} currentUser={currentUser} 
            columns={taskColumns} setColumns={setTaskColumns}
        />;
      case 'crm':
        return <CRM 
            leads={leads} setLeads={setLeads}
            columns={crmColumns} setColumns={setCrmColumns}
        />;
      case 'requisitions':
        return <Requisitions 
            requisitions={requisitions}
            setRequisitions={setRequisitions}
            currentUser={currentUser}
            users={users}
            setNotifications={setNotifications}
            setTransactions={setTransactions}
        />;
      case 'finance':
        return <Financials 
            transactions={transactions} 
            setTransactions={setTransactions} 
            assets={assets}
            setAssets={setAssets}
            currentUser={currentUser}
            users={users}
            setNotifications={setNotifications}
        />;
      case 'client-portal':
        return <ClientPortal 
            tasks={tasks} 
            setTasks={setTasks} 
            currentUser={currentUser} 
            users={users}
            clients={clients}
            squads={squads}
            setNotifications={setNotifications}
            setRequisitions={setRequisitions}
            onNavigate={setCurrentView}
        />;
      case 'productivity':
        return <ProductivityDashboard 
            tasks={tasks} 
            setTasks={setTasks}
            users={users} 
            squads={squads} 
            clients={clients}
            currentUser={currentUser} 
        />;
      case 'teams':
        return <TeamManagement users={users} setUsers={setUsers} squads={squads} setSquads={setSquads} />;
      case 'permissions':
        return <PermissionsManager permissions={rolePermissions} setPermissions={setRolePermissions} />;
      case 'clients':
        return <ClientManagement clients={clients} setClients={setClients} squads={squads} services={services} users={users} setUsers={setUsers} />;
      case 'catalog':
        return <ServiceCatalog services={services} setServices={setServices} />;
      case 'system-admin':
        return <SystemAdmin settings={systemSettings} onUpdateSettings={setSystemSettings} />;
      default:
        return <div>Selecione uma opção</div>;
    }
  };

  const myNotifications = notifications.filter(n => !n.targetUserId || n.targetUserId === currentUser.id).sort((a,b) => b.timestamp - a.timestamp);
  const unreadCount = myNotifications.filter(n => !n.read).length;

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${currentUser.preferences?.theme === 'dark' ? 'bg-slate-900 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
      <Sidebar 
        currentView={currentView} 
        setView={setCurrentView} 
        currentUserRole={currentUser.role}
        permissions={rolePermissions}
        logout={handleLogout}
        systemSettings={systemSettings}
      />
      
      <main className="ml-64 flex-1 flex flex-col p-8 min-h-screen">
        <div className="flex justify-end items-center mb-8 gap-4 relative shrink-0">
            <div className="relative" ref={notificationRef}>
                <button 
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="p-2 rounded-full border transition-all relative"
                    style={showNotifications ? { backgroundColor: `${systemSettings.primaryColor}20`, borderColor: systemSettings.primaryColor, color: systemSettings.primaryColor } : { backgroundColor: 'white', borderColor: '#e2e8f0', color: '#64748b' }}
                >
                    <Bell size={20} />
                    {unreadCount > 0 && (
                        <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
                    )}
                </button>
                
                {showNotifications && (
                    <div className="absolute right-0 top-full mt-3 w-96 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 overflow-hidden z-[60] animate-pop origin-top-right">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 flex justify-between items-center backdrop-blur-sm">
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-white">Notificações</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400">{unreadCount} não lidas</p>
                            </div>
                            {unreadCount > 0 && (
                                <button 
                                    onClick={markAllAsRead} 
                                    className="text-xs font-medium hover:bg-slate-100 px-2 py-1 rounded transition-colors flex items-center gap-1"
                                    style={{ color: systemSettings.primaryColor }}
                                >
                                    <Check size={12}/> Marcar todas lidas
                                </button>
                            )}
                        </div>
                        <div className="max-h-80 overflow-y-auto custom-scrollbar">
                            {myNotifications.length === 0 && (
                                <div className="p-8 text-center flex flex-col items-center gap-2">
                                    <Bell size={24} className="text-slate-300"/>
                                    <p className="text-sm text-slate-400">Nenhuma notificação por enquanto.</p>
                                </div>
                            )}
                            {myNotifications.map(notif => (
                                <div 
                                    key={notif.id} 
                                    onClick={() => handleNotificationClick(notif)}
                                    className={`p-4 border-b border-slate-50 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors group relative ${!notif.read ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}
                                >
                                    {!notif.read && (
                                        <span className="absolute left-0 top-0 bottom-0 w-1" style={{ backgroundColor: systemSettings.primaryColor }}></span>
                                    )}
                                    <div className="flex gap-3">
                                        <div className={`mt-1 p-2 rounded-full h-fit shrink-0 ${!notif.read ? 'bg-white shadow-sm' : 'bg-slate-100 dark:bg-slate-700'}`}>
                                            {getNotificationIcon(notif.type)}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start mb-1">
                                                <p className={`text-sm ${!notif.read ? 'font-bold text-slate-800 dark:text-slate-100' : 'font-medium text-slate-600 dark:text-slate-400'}`}>
                                                    {notif.title}
                                                </p>
                                                <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                                                    {new Date(notif.timestamp).toLocaleDateString() === new Date().toLocaleDateString() 
                                                        ? new Date(notif.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                                                        : new Date(notif.timestamp).toLocaleDateString([], {day: '2-digit', month: '2-digit'})
                                                    }
                                                </span>
                                            </div>
                                            <p className={`text-xs leading-relaxed ${!notif.read ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 dark:text-slate-500'}`}>
                                                {notif.message}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div 
                className={`flex items-center gap-3 bg-white dark:bg-slate-800 px-4 py-2 rounded-full shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md transition-shadow cursor-pointer ${currentView === 'settings' ? 'ring-2' : ''}`}
                style={currentView === 'settings' ? { borderColor: systemSettings.primaryColor, ringColor: systemSettings.primaryColor } : {}}
                onClick={() => setCurrentView('settings')}
            >
                <div className="text-right hidden md:block">
                    <p className="text-sm font-bold text-slate-800 dark:text-white">{currentUser.name}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        {currentUser.role === 'ADMIN' ? 'CEO / Admin' : 
                         currentUser.role === 'FINANCE' ? 'Financeiro' : currentUser.role}
                    </p>
                </div>
                <img src={currentUser.avatar} alt="Perfil" className="w-10 h-10 rounded-full border-2 border-slate-100 dark:border-slate-700" />
                <Settings size={16} className="text-slate-400 ml-2" />
            </div>
        </div>

        <div className="flex-1">
            {renderContent()}
        </div>

        <footer className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 text-center text-xs text-slate-400">
            <p className="mb-2">
                &copy; {new Date().getFullYear()} {systemSettings.agencyName}. Todos os direitos reservados.
            </p>
            <div className="flex justify-center gap-4">
                <button 
                    onClick={() => setCurrentView('privacy')}
                    className="hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex items-center gap-1"
                >
                    <Shield size={10}/> Políticas de Privacidade
                </button>
            </div>
        </footer>
      </main>
    </div>
  );
};

export default App;
