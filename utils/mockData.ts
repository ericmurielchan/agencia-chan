
import { Task, User, Lead, FinancialRecord, Squad, ColumnConfig, Asset, RolePermissions, Client, Notification, AgencyService, StockItem, Requisition } from '../types';

const defaultPreferences = {
    theme: 'light' as const,
    emailNotifications: true,
    systemNotifications: true,
    compactMode: false
};

export const initialUsers: User[] = [
  { 
      id: 'u1', 
      name: 'Eric Muriel', 
      email: 'eric.muriel@gmail.com', 
      role: 'ADMIN', 
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Eric&backgroundColor=b6e3f4', 
      hourlyRate: 200, 
      salary: 0, 
      hasSystemAccess: true, 
      password: '123', 
      preferences: defaultPreferences 
  },
  { 
      id: 'u2', 
      name: 'Chan', 
      email: 'eric@chandigital.com.br', 
      role: 'MANAGER', 
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Chan&backgroundColor=c0aede', 
      squad: 'squad-1', 
      hourlyRate: 150, 
      salary: 0, 
      hasSystemAccess: true, 
      password: '123', 
      preferences: defaultPreferences 
  },
  { 
      id: 'u3', 
      name: 'Lais', 
      email: 'financeiro@chandigital.com.br', 
      role: 'FINANCE', 
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lais&backgroundColor=ffdfbf', 
      hourlyRate: 100, 
      salary: 0, 
      hasSystemAccess: true, 
      password: '123', 
      preferences: defaultPreferences 
  },
  { 
      id: 'u4', 
      name: 'Matheus', 
      email: 'matheus@chandigital.com.br', 
      role: 'EMPLOYEE', 
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Matheus&backgroundColor=d1d4f9', 
      squad: 'squad-1', 
      hourlyRate: 60, 
      salary: 0, 
      hasSystemAccess: true, 
      password: '123', 
      preferences: defaultPreferences 
  },
  { 
      id: 'u5', 
      name: 'Thais', 
      email: 'thais@chandigital.com.br', 
      role: 'EMPLOYEE', 
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Thais&backgroundColor=fda4af', 
      squad: 'squad-1', 
      hourlyRate: 60, 
      salary: 0, 
      hasSystemAccess: true, 
      password: '123', 
      preferences: defaultPreferences 
  },
  { 
      id: 'u6', 
      name: 'Scarlet', 
      email: 'scarletfreitas16@gmail.com', 
      role: 'FREELANCER', 
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Scarlet&backgroundColor=e2e8f0', 
      squad: 'squad-1', 
      hourlyRate: 50, 
      hasSystemAccess: true, 
      password: '123', 
      preferences: defaultPreferences 
  }
];

export const initialSquads: Squad[] = [
    { id: 'squad-1', name: 'Squad Principal', members: ['u2', 'u4', 'u5', 'u6'] }, // Chan, Matheus, Thais, Scarlet
    { id: 'squad-2', name: 'Squad Performance', members: ['u1'] } 
];

export const initialClients: Client[] = [
    {
        id: 'c1',
        name: 'TechStart S.A.',
        legalName: 'TechStart Tecnologia Ltda',
        status: 'ACTIVE',
        isRecurring: true,
        level: 'ADVANCED',
        summary: 'Startup de SaaS B2B focada em automação. Contrato focado em Inbound e Performance no LinkedIn Ads.',
        contractUrl: '',
        assetsFolderUrl: '',
        monthlyValue: 8500,
        contractStartDate: '2023-01-15',
        contacts: [
            { name: 'João Silva', email: 'joao@techstart.io', phone: '1199999999', role: 'CMO', birthDate: new Date().toISOString().split('T')[0] } 
        ],
        squadId: 'squad-2',
        serviceIds: ['s2']
    }
];

export const initialServices: AgencyService[] = [
    { id: 's1', name: 'Gestão de Redes Sociais (P)', description: '12 Posts + 4 Stories semanais', basePrice: 2500, active: true },
    { id: 's2', name: 'Inbound Marketing', description: '4 Artigos + 2 Email Mkt + Landing Page', basePrice: 4000, active: true },
    { id: 's3', name: 'Desenvolvimento Web', description: 'Landing Page High-End', basePrice: 3500, active: true }
];

export const initialNotifications: Notification[] = [
    { id: 'n1', title: 'Bem-vindo', message: 'Sistema atualizado para versão de produção.', type: 'INFO', read: false, timestamp: Date.now() }
];

export const initialRolePermissions: RolePermissions = {
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
        'kanban', 'requisitions', 'help'
    ],
    'FINANCE': [
        'dashboard', 'finance', 'clients', 'requisitions', 'help',
        'action:approve_budget', 'action:export'
    ],
    'CLIENT': [
        'client-portal', 'requisitions', 'help'
    ]
};

export const initialTaskColumns: ColumnConfig[] = [
  { id: 'BACKLOG', label: 'Backlog', color: 'border-t-4 border-slate-400' },
  { id: 'TODO', label: 'A Fazer', color: 'border-t-4 border-blue-400' },
  { id: 'IN_PROGRESS', label: 'Em Progresso', color: 'border-t-4 border-indigo-400' },
  { id: 'REVIEW', label: 'Revisão', color: 'border-t-4 border-purple-400' },
  { id: 'DONE', label: 'Concluído', color: 'border-t-4 border-emerald-400' },
];

export const initialCrmColumns: ColumnConfig[] = [
  { id: 'NEW', label: 'Novos Leads', color: 'bg-blue-50 border-blue-200' },
  { id: 'QUALIFIED', label: 'Qualificados', color: 'bg-indigo-50 border-indigo-200' },
  { id: 'PROPOSAL', label: 'Proposta Enviada', color: 'bg-purple-50 border-purple-200' },
  { id: 'NEGOTIATION', label: 'Em Negociação', color: 'bg-orange-50 border-orange-200' },
  { id: 'WON', label: 'Fechado Ganho', color: 'bg-emerald-50 border-emerald-200' },
];

export const initialTasks: Task[] = [];
export const initialLeads: Lead[] = [];
export const initialFinancialRecords: FinancialRecord[] = [];
export const initialAssets: Asset[] = [];
export const initialStock: StockItem[] = [];
export const initialRequisitions: Requisition[] = [];
