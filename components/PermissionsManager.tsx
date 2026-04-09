
import React, { useState } from 'react';
import { Role, RolePermissions, ConfirmOptions } from '../types';
import { 
    Shield, Check, X, Lock, Users, LayoutDashboard, Settings, 
    AlertTriangle, Eye, MousePointerClick, RotateCcw,
    FileText, DollarSign, Trash2, Download, CheckCircle2, History, Palette, AlertCircle
} from 'lucide-react';

interface PermissionsManagerProps {
  permissions: RolePermissions;
  setPermissions: React.Dispatch<React.SetStateAction<RolePermissions>>;
  openConfirm: (options: ConfirmOptions) => Promise<boolean>;
}

// 1. DEFINIÇÃO DOS PADRÕES DE FÁBRICA
const DEFAULT_PERMISSIONS: RolePermissions = {
    'ADMIN': [
        'dashboard', 'kanban', 'productivity', 'teams', 'clients', 'catalog', 
        'crm', 'finance', 'permissions', 'system-admin', 
        'requisitions', 'help',
        'action:delete', 'action:export', 'action:approve_budget', 'action:manage_users'
    ],
    'MANAGER': [
        'dashboard', 'kanban', 'productivity', 'teams', 'clients', 'catalog', 
        'crm', 'requisitions', 'help',
        'action:approve_budget'
    ],
    'EMPLOYEE': [
        'kanban', 'productivity', 'requisitions', 'help'
    ],
    'FREELANCER': [
        'dashboard', 'kanban', 'crm', 'requisitions', 'help'
    ],
    'FINANCE': [
        'dashboard', 'finance', 'clients', 'requisitions', 'help',
        'action:approve_budget', 'action:export'
    ],
    'CLIENT': [
        'client-portal', 'help'
    ]
};

const PAGE_MODULES = [
    {
        title: "Operacional & Tático",
        icon: <MousePointerClick size={18} className="text-blue-500"/>,
        modules: [
            { id: 'kanban', label: 'Gestão de Tarefas', desc: 'Acesso ao quadro Kanban' },
            { id: 'crm', label: 'CRM / Vendas', desc: 'Pipeline de oportunidades' },
            { id: 'client-portal', label: 'Portal do Cliente', desc: 'Interface exclusiva do cliente' },
            { id: 'requisitions', label: 'Solicitações', desc: 'Criar pedidos de compra' },
        ]
    },
    {
        title: "Gestão & Estratégia",
        icon: <LayoutDashboard size={18} className="text-purple-500"/>,
        modules: [
            { id: 'dashboard', label: 'Dashboard Geral', desc: 'KPIs globais da agência' },
            { id: 'productivity', label: 'Produtividade', desc: 'Relatórios de time' },
            { id: 'finance', label: 'Financeiro', desc: 'Fluxo de caixa e DRE' },
        ]
    },
    {
        title: "Administração",
        icon: <Settings size={18} className="text-slate-500"/>,
        modules: [
            { id: 'teams', label: 'Equipes & Squads', desc: 'Gestão de usuários' },
            { id: 'clients', label: 'Gestão de Clientes', desc: 'Cadastros e contratos' },
            { id: 'catalog', label: 'Catálogo', desc: 'Produtos e serviços' },
            { id: 'permissions', label: 'Controle de Acessos', desc: 'Esta tela (RBAC)' },
            { id: 'system-admin', label: 'Config. Sistema', desc: 'Branding e Cores' }
        ]
    }
];

const SPECIAL_ACTIONS = [
    { id: 'action:approve_budget', label: 'Aprovar Orçamentos', desc: 'Validar requisições financeiras', icon: <CheckCircle2 size={16} className="text-emerald-600"/>, risk: 'MEDIUM' },
    { id: 'action:export', label: 'Exportar Dados', desc: 'Download de relatórios CSV/PDF', icon: <Download size={16} className="text-blue-600"/>, risk: 'LOW' },
    { id: 'action:manage_users', label: 'Gerir Usuários', desc: 'Criar/Editar logins', icon: <Users size={16} className="text-purple-600"/>, risk: 'HIGH' },
    { id: 'action:delete', label: 'Exclusão Definitiva', desc: 'Deletar registros do sistema', icon: <Trash2 size={16} className="text-red-600"/>, risk: 'CRITICAL' },
];

const ROLES: Role[] = ['ADMIN', 'MANAGER', 'EMPLOYEE', 'FREELANCER', 'FINANCE', 'CLIENT'];

const ROLE_CONFIG: Record<Role, { label: string, color: string }> = {
    'ADMIN': { label: 'CEO / Admin', color: 'bg-slate-800 text-white' },
    'MANAGER': { label: 'Gerente', color: 'bg-purple-100 text-purple-700' },
    'EMPLOYEE': { label: 'Colaborador', color: 'bg-blue-100 text-blue-700' },
    'FREELANCER': { label: 'Comercial', color: 'bg-orange-100 text-orange-700' },
    'FINANCE': { label: 'Financeiro', color: 'bg-emerald-100 text-emerald-700' },
    'CLIENT': { label: 'Cliente', color: 'bg-pink-100 text-pink-700' }
};

export const PermissionsManager: React.FC<PermissionsManagerProps> = ({ permissions, setPermissions, openConfirm }) => {
  const [viewMode, setViewMode] = useState<'MATRIX' | 'ROLES'>('MATRIX');
  const [lastChange, setLastChange] = useState<{msg: string, type: 'info' | 'success'} | null>(null);

  const togglePermission = (role: Role, moduleId: string) => {
      const current = permissions[role] || [];
      const hasPermission = current.includes(moduleId);
      
      let newPermissions;
      if (hasPermission) {
          newPermissions = current.filter(id => id !== moduleId);
      } else {
          newPermissions = [...current, moduleId];
      }

      setPermissions({
          ...permissions,
          [role]: newPermissions
      });

      // Log para UI
      const timestamp = new Date().toLocaleTimeString();
      const action = hasPermission ? 'removido de' : 'adicionado a';
      setLastChange({ msg: `${moduleId} ${action} ${role} às ${timestamp}`, type: 'info' });
  };

  const handleResetDefaults = async () => {
      console.log("DELETE_CLICK");
      const ok = await openConfirm({
          title: "Restaurar Padrões?",
          description: "Todas as permissões personalizadas serão perdidas e o sistema voltará para as configurações de fábrica.",
          variant: "danger",
          confirmText: "Resetar Sistema"
      });

      if (ok) {
          try {
              const factorySettings = JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS));
              setPermissions(factorySettings);
              setLastChange({ msg: 'Sistema restaurado para as definições originais.', type: 'success' });
              console.log("DELETE_SUCCESS");
          } catch (e) {
              console.error("DELETE_ERROR", e);
          }
      }
  };

  return (
    <div className="space-y-6 animate-pop">
      
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                    <Shield size={32}/>
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">
                        Controle de Acessos (RBAC)
                    </h2>
                    <p className="text-slate-500 mt-1 max-w-xl text-sm leading-relaxed">
                        Gerencie quem pode ver e fazer o quê. Defina permissões de visualização (Páginas) e execução (Ações) para cada cargo da agência.
                    </p>
                </div>
              </div>

              {/* Botão de Restaurar Padrões */}
              <div className="flex flex-col items-end gap-2">
                 <button 
                    type="button"
                    onClick={handleResetDefaults}
                    className="group flex items-center gap-2 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 px-4 py-2.5 rounded-lg border border-slate-200 hover:border-red-200 transition-all text-xs font-bold cursor-pointer shadow-sm uppercase tracking-wide"
                    title="Reverter todas as permissões para o padrão original"
                 >
                    <RotateCcw size={14} className="group-hover:-rotate-180 transition-transform duration-500"/> 
                    Restaurar Padrões
                 </button>
                 <span className="text-[10px] text-slate-400">Reverte alterações manuais</span>
              </div>
          </div>
      </div>

      {/* Audit Log Banner */}
      {lastChange && (
          <div className={`border p-3 rounded-lg flex items-center justify-between text-sm animate-pop ${lastChange.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
              <div className="flex items-center gap-2">
                  {lastChange.type === 'success' ? <CheckCircle2 size={18}/> : <History size={18}/>}
                  <span className="font-bold">Sistema Atualizado:</span> {lastChange.msg}
              </div>
              <button onClick={() => setLastChange(null)} className="hover:bg-white/50 p-1 rounded opacity-70 hover:opacity-100"><X size={14}/></button>
          </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-xl px-2">
          <button 
            onClick={() => setViewMode('MATRIX')}
            className={`px-6 py-4 text-sm font-bold flex items-center gap-2 transition-colors border-b-2 ${viewMode === 'MATRIX' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
              <LayoutDashboard size={16}/> Matriz de Navegação
          </button>
          <button 
            onClick={() => setViewMode('ROLES')}
            className={`px-6 py-4 text-sm font-bold flex items-center gap-2 transition-colors border-b-2 ${viewMode === 'ROLES' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
          >
              <Users size={16}/> Visão Detalhada por Cargo
          </button>
      </div>

      {/* --- MATRIX VIEW --- */}
      {viewMode === 'MATRIX' && (
          <div className="space-y-8 animate-pop">
              
              {/* 1. Page Access */}
              <div className="bg-white rounded-b-xl rounded-tr-xl border border-slate-200 shadow-sm overflow-hidden -mt-px">
                  <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                          <Eye size={20} className="text-slate-400"/>
                          <h3 className="font-bold text-slate-800 text-lg">Acesso a Módulos (Visualização)</h3>
                      </div>
                      <span className="text-xs text-slate-400 bg-white px-2 py-1 rounded border border-slate-200">
                          Define quais menus laterais aparecem
                      </span>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white text-slate-500 font-semibold border-b border-slate-100">
                            <tr>
                                <th className="p-4 min-w-[250px] bg-slate-50/50 sticky left-0 z-10 border-r border-slate-100">Módulo do Sistema</th>
                                {ROLES.map(role => (
                                    <th key={role} className="p-4 text-center min-w-[100px]">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${ROLE_CONFIG[role].color}`}>
                                                {ROLE_CONFIG[role].label}
                                            </span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {PAGE_MODULES.map(group => (
                                <React.Fragment key={group.title}>
                                    <tr className="bg-slate-50/30">
                                        <td colSpan={ROLES.length + 1} className="p-2 px-4 text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                                            {group.icon} {group.title}
                                        </td>
                                    </tr>
                                    {group.modules.map(module => (
                                        <tr key={module.id} className="hover:bg-slate-50/80 transition-colors group">
                                            <td className="p-4 sticky left-0 bg-white group-hover:bg-slate-50/80 transition-colors border-r border-slate-100">
                                                <p className="font-bold text-slate-700">{module.label}</p>
                                                <p className="text-xs text-slate-400">{module.desc}</p>
                                            </td>
                                            {ROLES.map(role => {
                                                const isAllowed = permissions[role]?.includes(module.id);
                                                const isAdmin = role === 'ADMIN'; 
                                                
                                                return (
                                                    <td key={role} className="p-4 text-center">
                                                        <button 
                                                            onClick={() => !isAdmin && togglePermission(role, module.id)}
                                                            disabled={isAdmin}
                                                            className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all mx-auto border ${
                                                                isAllowed 
                                                                ? 'bg-emerald-50 border-emerald-500 text-emerald-600 shadow-sm' 
                                                                : 'bg-slate-50 border-slate-200 text-slate-300'
                                                            } ${isAdmin ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110 active:scale-95 cursor-pointer'}`}
                                                            title={isAdmin ? 'Admin tem acesso total' : isAllowed ? 'Remover acesso' : 'Conceder acesso'}
                                                        >
                                                            {isAllowed ? <Check size={16} strokeWidth={3} /> : <X size={16} />}
                                                        </button>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </React.Fragment>
                            ))}
                        </tbody>
                    </table>
                  </div>
              </div>

              {/* 2. Special Actions */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                  <div className="bg-red-50 p-4 border-b border-red-100 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock size={20} className="text-red-500"/>
                        <div>
                            <h3 className="font-bold text-red-800 text-lg">Permissões Sensíveis (Ações)</h3>
                            <p className="text-xs text-red-600">Ações críticas que podem impactar a integridade dos dados.</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs bg-white text-red-600 px-2 py-1 rounded font-bold border border-red-200">
                          <AlertTriangle size={12}/> Área de Risco
                      </div>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-white text-slate-500 font-semibold border-b border-slate-100">
                            <tr>
                                <th className="p-4 min-w-[250px] border-r border-slate-100">Ação Crítica</th>
                                {ROLES.map(role => (
                                    <th key={role} className="p-4 text-center min-w-[100px]">
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${ROLE_CONFIG[role].color}`}>
                                            {ROLE_CONFIG[role].label.split(' ')[0]}
                                        </span>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {SPECIAL_ACTIONS.map(action => (
                                <tr key={action.id} className="hover:bg-red-50/10 transition-colors">
                                    <td className="p-4 border-r border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg bg-white border border-slate-100 shadow-sm`}>
                                                {action.icon}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-700 flex items-center gap-2">
                                                    {action.label}
                                                </p>
                                                <p className="text-xs text-slate-400">{action.desc}</p>
                                            </div>
                                        </div>
                                    </td>
                                    {ROLES.map(role => {
                                        const isAllowed = permissions[role]?.includes(action.id);
                                        const isAdmin = role === 'ADMIN'; 
                                        
                                        return (
                                            <td key={role} className="p-4 text-center">
                                                <div className="relative group/tooltip flex justify-center">
                                                    <label className="relative inline-flex items-center cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            className="sr-only peer" 
                                                            checked={isAllowed}
                                                            disabled={isAdmin}
                                                            onChange={() => togglePermission(role, action.id)}
                                                        />
                                                        <div className={`w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-red-100 rounded-full peer ${isAdmin ? 'opacity-50 cursor-not-allowed' : ''} peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-500`}></div>
                                                    </label>
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                  </div>
              </div>
          </div>
      )}

      {/* --- ROLES VIEW --- */}
      {viewMode === 'ROLES' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pop">
              {ROLES.map(role => {
                  const rolePerms = permissions[role] || [];
                  const isAdmin = role === 'ADMIN';

                  // Group perms
                  const activePages = PAGE_MODULES.flatMap(g => g.modules).filter(m => rolePerms.includes(m.id));
                  const activeActions = SPECIAL_ACTIONS.filter(a => rolePerms.includes(a.id));

                  return (
                      <div key={role} className="bg-white rounded-xl border border-slate-200 shadow-sm flex flex-col overflow-hidden hover:shadow-md transition-shadow">
                          <div className={`p-4 border-b border-slate-100 flex justify-between items-center ${isAdmin ? 'bg-slate-800' : 'bg-slate-50'}`}>
                              <div>
                                  <h3 className={`font-bold ${isAdmin ? 'text-white' : 'text-slate-800'}`}>{ROLE_CONFIG[role].label}</h3>
                                  <p className={`text-xs ${isAdmin ? 'text-slate-400' : 'text-slate-50'}`}>{role}</p>
                              </div>
                              {isAdmin ? <Shield size={20} className="text-pink-500"/> : <Users size={20} className="text-slate-300"/>}
                          </div>

                          <div className="p-5 flex-1 space-y-6">
                              <div>
                                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
                                      <LayoutDashboard size={14}/> Menus Disponíveis
                                  </h4>
                                  <div className="flex flex-wrap gap-2">
                                      {activePages.map(page => (
                                          <span key={page.id} className="text-xs bg-slate-50 text-slate-700 px-2 py-1 rounded border border-slate-200 flex items-center gap-1">
                                              <Check size={10} className="text-emerald-500"/> {page.label}
                                          </span>
                                      ))}
                                      {activePages.length === 0 && <span className="text-xs text-slate-300 italic">Nenhum acesso de menu configurado.</span>}
                                  </div>
                              </div>

                              <div>
                                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2 border-b border-slate-100 pb-2">
                                      <Lock size={14}/> Permissões Especiais
                                  </h4>
                                  <div className="space-y-2">
                                      {activeActions.map(action => (
                                          <div key={action.id} className={`text-xs px-3 py-2 rounded-lg border flex items-center gap-3 font-medium ${
                                              action.risk === 'CRITICAL' ? 'bg-red-50 text-red-700 border-red-100' :
                                              action.risk === 'HIGH' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                              'bg-emerald-50 text-emerald-700 border-emerald-100'
                                          }`}>
                                              {action.icon}
                                              {action.label}
                                          </div>
                                      ))}
                                      {activeActions.length === 0 && <span className="text-xs text-slate-300 italic">Nenhuma ação crítica permitida.</span>}
                                  </div>
                              </div>
                          </div>
                          
                          <div className="bg-slate-50 p-3 text-center border-t border-slate-100">
                              <p className="text-[10px] text-slate-400">ID: {role}</p>
                          </div>
                      </div>
                  );
              })}
          </div>
      )}
      
    </div>
  );
};
