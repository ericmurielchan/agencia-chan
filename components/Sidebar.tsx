
import React from 'react';
import { 
  LayoutDashboard, Kanban, Users, DollarSign, Briefcase, LogOut, 
  PieChart, BarChart2, Shield, HeartHandshake, ShoppingBag, 
  ShoppingCart, Settings, HelpCircle, ChevronLeft, ChevronRight, X,
  CheckCircle2
} from 'lucide-react';
import { Role, RolePermissions, SystemSettings } from '../types';

interface SidebarProps {
  currentView: string;
  setView: (view: string) => void;
  currentUserRole: Role;
  permissions: RolePermissions;
  logout: () => void;
  systemSettings: SystemSettings;
  isOpen: boolean;
  onToggle: () => void;
  isCompact: boolean;
  onToggleCompact: () => void;
  isMobile: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentView, 
  setView, 
  currentUserRole, 
  permissions, 
  logout, 
  systemSettings,
  isOpen,
  onToggle,
  isCompact,
  onToggleCompact,
  isMobile
}) => {
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
    { id: 'approvals', label: 'Aprovações', icon: CheckCircle2 },
    { id: 'finance', label: 'Financeiro', icon: DollarSign },
    { id: 'permissions', label: 'Acessos (Admin)', icon: Shield },
    { id: 'system-admin', label: 'Config. Sistema', icon: Settings },
    { id: 'help', label: 'Central de Ajuda', icon: HelpCircle },
  ];

  const allowedModules = permissions[currentUserRole] || [];

  return (
    <div 
        className={`fixed left-0 top-0 h-screen z-[10000] transition-all duration-300 ease-in-out border-r border-slate-800 flex flex-col
          ${!isOpen ? '-translate-x-full' : 'translate-x-0'}
          ${isCompact ? 'w-20' : 'w-64'}
        `}
        style={{ backgroundColor: systemSettings.sidebarColor || '#0f172a' }}
    >
      {/* SIDEBAR TOGGLE BUTTON (CHEVRON) - Hidden on Mobile */}
      {!isMobile && (
        <button 
          onClick={onToggle}
          aria-label={isOpen ? "Ocultar menu lateral" : "Mostrar menu lateral"}
          title={isOpen ? "Ocultar menu lateral" : "Mostrar menu lateral"}
          className={`fixed top-10 w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center shadow-lg hover:scale-110 transition-all z-[10001] text-slate-800
            ${isOpen ? (isCompact ? 'left-[64px]' : 'left-[240px]') : 'left-4'}
          `}
        >
          {isOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
        </button>
      )}

      {/* Header / Logo */}
      <div className={`p-6 flex items-center transition-all duration-300 ${isCompact ? 'justify-center p-4' : 'gap-3'}`}>
        {systemSettings.logo ? (
            <img src={systemSettings.logo} alt="Logo" className="w-8 h-8 object-contain rounded bg-white p-0.5 shrink-0" />
        ) : (
            <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shrink-0"
                style={{ backgroundColor: systemSettings.primaryColor }}
            >
                {systemSettings.agencyName.charAt(0)}
            </div>
        )}
        {!isCompact && (
          <span className="text-lg font-bold text-white tracking-tight truncate animate-pop" title={systemSettings.agencyName}>
              {systemSettings.agencyName}
          </span>
        )}
        
        {isMobile && isOpen && (
          <button 
            onClick={onToggle}
            className="ml-auto text-white/60 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1.5 mt-4 overflow-y-auto hide-scrollbar">
        {menuItems.map((item) => {
           const isAllowed = allowedModules.includes(item.id) || item.id === 'help';
           if (!isAllowed) return null;

           const active = currentView === item.id;
           
           return (
            <button
              key={item.id}
              onClick={() => {
                  setView(item.id);
                  if (isMobile && !isCompact) onToggle();
              }}
              title={isCompact ? item.label : ""}
              className={`w-full flex items-center rounded-xl transition-all duration-300 group
                ${isCompact ? 'justify-center py-3' : 'px-4 py-2.5 gap-3'}
                ${active 
                  ? 'text-white shadow-lg shadow-pink-500/20' 
                  : 'text-slate-400 hover:bg-white/5 hover:text-slate-100'}
              `}
              style={active ? { backgroundColor: systemSettings.primaryColor } : {}}
            >
              <item.icon size={18} className={`shrink-0 transition-transform duration-300 ${active ? 'scale-110' : 'group-hover:scale-110'}`} />
              {!isCompact && (
                <span className={`font-semibold truncate text-[13px] tracking-tight ${active ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}>
                  {item.label}
                </span>
              )}
              {active && !isCompact && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer / Logout */}
      <div className={`p-4 border-t border-white/10 ${isCompact ? 'flex flex-col items-center gap-4' : 'space-y-4'}`}>
        {!isMobile && (
          <button 
            onClick={onToggleCompact}
            className={`w-full flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 transition-all hover:text-slate-200 group
              ${isCompact ? 'p-3' : 'px-4 py-3 gap-3'}
            `}
            title={isCompact ? "Expandir Menu" : "Recolher Menu"}
          >
            {isCompact ? <ChevronRight size={18} className="group-hover:translate-x-0.5 transition-transform" /> : (
              <>
                <ChevronLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-[10px] font-black uppercase tracking-widest">Recolher Menu</span>
              </>
            )}
          </button>
        )}

        <button 
          onClick={logout} 
          title={isCompact ? "Sair" : ""}
          className={`flex items-center text-red-400 hover:text-white w-full hover:bg-red-500 rounded-2xl transition-all group shadow-sm hover:shadow-lg hover:shadow-red-500/20
            ${isCompact ? 'justify-center p-3' : 'px-5 py-3.5 gap-4'}
          `}
        >
          <LogOut size={20} className="shrink-0 group-hover:scale-110 transition-transform" />
          {!isCompact && <span className="text-xs font-black uppercase tracking-widest">Sair do Sistema</span>}
        </button>
      </div>
    </div>
  );
};
