
import React from 'react';
import { LayoutDashboard, Kanban, Users, DollarSign, Briefcase, LogOut, PieChart, BarChart2, Shield, HeartHandshake, ShoppingBag, ShoppingCart, Settings, HelpCircle } from 'lucide-react';
import { Role, RolePermissions, SystemSettings } from '../types';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  currentUserRole: Role;
  permissions: RolePermissions;
  logout: () => void;
  systemSettings: SystemSettings;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, setView, currentUserRole, permissions, logout, systemSettings }) => {
  // Define menu items, but availability depends on 'permissions' prop
  const menuItems = [
    { id: 'dashboard', label: 'Visão Geral', icon: LayoutDashboard },
    { id: 'kanban', label: 'Tarefas (Kanban)', icon: Kanban },
    { id: 'productivity', label: 'Produtividade', icon: BarChart2 },
    { id: 'requisitions', label: 'Solicitações', icon: ShoppingCart },
    { id: 'client-portal', label: 'Meus Pedidos', icon: PieChart },
    { id: 'clients', label: 'Gestão de Clientes', icon: HeartHandshake },
    { id: 'catalog', label: 'Produtos & Serviços', icon: ShoppingBag },
    { id: 'teams', label: 'Equipes & Squads', icon: Users },
    { id: 'crm', label: 'CRM / Vendas', icon: Briefcase },
    { id: 'finance', label: 'Financeiro', icon: DollarSign },
    { id: 'permissions', label: 'Acessos (Admin)', icon: Shield },
    { id: 'system-admin', label: 'Config. Sistema', icon: Settings },
    { id: 'help', label: 'Central de Ajuda', icon: HelpCircle }, // Novo Item
  ];

  const allowedModules = permissions[currentUserRole] || [];

  return (
    <div 
        className="w-64 flex flex-col h-screen fixed left-0 top-0 border-r border-slate-800 z-50 text-slate-300 transition-colors duration-300"
        style={{ backgroundColor: systemSettings.sidebarColor || '#0f172a' }} // Default fallback
    >
      <div className="p-6 flex items-center gap-3">
        {systemSettings.logo ? (
            <img src={systemSettings.logo} alt="Logo" className="w-8 h-8 object-contain rounded bg-white p-0.5" />
        ) : (
            <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-lg"
                style={{ backgroundColor: systemSettings.primaryColor }}
            >
                {systemSettings.agencyName.charAt(0)}
            </div>
        )}
        <span className="text-lg font-bold text-white tracking-tight truncate" title={systemSettings.agencyName}>
            {systemSettings.agencyName}
        </span>
      </div>

      <nav className="flex-1 px-4 space-y-2 mt-4 overflow-y-auto">
        {menuItems.map((item) => {
           // Help is always allowed if we want, or controlled by permission. 
           // For now, let's assume if it's in the list it needs permission OR handle exception in Sidebar.
           // However, to follow the pattern, we'll ensure 'help' is added to permissions OR check explicitly.
           // Checking explicitly is safer for "global" items.
           const isAllowed = allowedModules.includes(item.id) || item.id === 'help';

           if (!isAllowed) return null;

           const active = currentView === item.id;
           
           return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                active ? 'text-white shadow-lg' : 'hover:bg-black/20 hover:text-white'
              }`}
              style={active ? { backgroundColor: systemSettings.primaryColor, boxShadow: `0 10px 15px -3px ${systemSettings.primaryColor}40` } : {}}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10">
        <button onClick={logout} className="flex items-center gap-3 px-4 py-3 text-red-400 hover:text-red-300 w-full hover:bg-red-500/10 rounded-lg transition-colors">
          <LogOut size={20} />
          <span>Sair</span>
        </button>
      </div>
    </div>
  );
};
