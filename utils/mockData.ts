
import { Task, User, Lead, FinancialTransaction, BankAccount, CreditCard, CardInvoice, Squad, ColumnConfig, RolePermissions, Client, Notification, AgencyService, Requisition, FinancialCategory, Supplier, LossReason, PipelineStage, ProductivityGoal, ApprovalBatch, StockItem, Asset, CashRegisterSession, CashMovement } from '../types';

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
  },
  { 
      id: 'u7', 
      name: 'João Silva (TechStart)', 
      email: 'joao@techstart.io', 
      role: 'CLIENT', 
      clientId: 'c1',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Joao&backgroundColor=b6e3f4', 
      hasSystemAccess: true, 
      password: '123', 
      preferences: defaultPreferences 
  }
];

export const initialSquads: Squad[] = [
    { id: 'squad-1', name: 'Squad Principal', members: ['u2', 'u4', 'u5', 'u6'] }, 
    { id: 'squad-2', name: 'Squad Performance', members: ['u1'] } 
];

export const initialClients: Client[] = [
    {
        id: 'c1',
        name: 'TechStart S.A.',
        legalName: 'TechStart Tecnologia Ltda',
        document: '12.345.678/0001-90',
        status: 'ACTIVE',
        serviceIds: ['s1', 's2'],
        entryDate: '2023-01-15',
        responsibleId: 'u1',
        squadId: 'squad-2',
        classification: 'A',
        tags: ['SaaS', 'B2B', 'Performance'],
        internalNotes: 'Cliente estratégico focado em crescimento acelerado.',
        contact: {
            name: 'João Silva',
            email: 'joao@techstart.io',
            phone: '1199999999',
            whatsapp: '1199999999'
        },
        financialContact: {
            name: 'Maria Financeiro',
            email: 'financeiro@techstart.io',
            phone: '1188888888'
        },
        passwords: [
            { id: 'p1', platform: 'Google Ads', login: 'admin@techstart.io', password: 'password123', observations: 'Acesso total' }
        ],
        documentationLinks: ['https://drive.google.com/drive/u/0/folders/123'],
        isRecurring: true,
        level: 'ADVANCED',
        summary: 'Startup de SaaS B2B focada em automação. Contrato focado em Inbound e Performance no LinkedIn Ads.',
        contractUrl: '',
        assetsFolderUrl: '',
        monthlyValue: 8500,
        contractStartDate: '2023-01-15',
        contacts: [
            { name: 'João Silva', email: 'joao@techstart.io', phone: '1199999999', role: 'CMO', birthDate: new Date().toISOString().split('T')[0] } 
        ]
    },
    {
        id: 'c2',
        name: 'Vino & Co',
        legalName: 'Vino Importadora Ltda',
        document: '98.765.432/0001-10',
        status: 'ACTIVE',
        serviceIds: ['s1'],
        entryDate: '2023-06-20',
        responsibleId: 'u2',
        squadId: 'squad-1',
        classification: 'B',
        tags: ['E-commerce', 'Vinhos', 'B2C'],
        internalNotes: 'Foco em vendas sazonais e datas comemorativas.',
        contact: {
            name: 'Ricardo Alves',
            email: 'ricardo@vinoco.com.br',
            phone: '1177777777',
            whatsapp: '1177777777'
        },
        financialContact: {
            name: 'Ana Vino',
            email: 'financeiro@vinoco.com.br',
            phone: '1166666666'
        },
        passwords: [],
        documentationLinks: [],
        isRecurring: true,
        level: 'INTERMEDIATE',
        summary: 'E-commerce de vinhos premium.',
        contractUrl: '',
        assetsFolderUrl: '',
        monthlyValue: 4500,
        contractStartDate: '2023-06-20',
        contacts: []
    },
    {
        id: 'c3',
        name: 'Global Logistics',
        legalName: 'Global Logistics Transportes S.A.',
        document: '11.222.333/0001-44',
        status: 'ACTIVE',
        serviceIds: ['s2', 's3'],
        entryDate: '2024-02-01',
        responsibleId: 'u1',
        squadId: 'squad-2',
        classification: 'A',
        tags: ['Logística', 'Transporte', 'B2B'],
        internalNotes: 'Projeto de rebranding e novo site.',
        contact: {
            name: 'Fernanda Lima',
            email: 'fernanda@globallog.com',
            phone: '1155555555',
            whatsapp: '1155555555'
        },
        financialContact: {
            name: 'Carlos Log',
            email: 'carlos@globallog.com',
            phone: '1144444444'
        },
        passwords: [],
        documentationLinks: [],
        isRecurring: false,
        level: 'BASIC',
        summary: 'Empresa de logística internacional.',
        contractUrl: '',
        assetsFolderUrl: '',
        monthlyValue: 12000,
        contractStartDate: '2024-02-01',
        contacts: []
    }
];

export const initialCategories: FinancialCategory[] = [
    { id: 'cat1', name: 'Honorários de Clientes', type: 'INCOME', color: '#10b981' },
    { id: 'cat2', name: 'Infraestrutura / Software', type: 'EXPENSE', color: '#3b82f6' },
    { id: 'cat3', name: 'Marketing & Anúncios', type: 'EXPENSE', color: '#db2777' },
    { id: 'cat4', name: 'Salários & Encargos', type: 'EXPENSE', color: '#8b5cf6' },
    { id: 'cat5', name: 'Impostos', type: 'EXPENSE', color: '#ef4444' },
];

export const initialSuppliers: Supplier[] = [
    { id: 'sup1', name: 'AWS Cloud', legalName: 'Amazon Web Services Inc', category: 'Infraestrutura', email: 'billing@aws.com' },
    { id: 'sup2', name: 'Hostinger', legalName: 'Hostinger Brasil Ltda', category: 'Infraestrutura', email: 'financeiro@hostinger.com.br' },
    { id: 'sup3', name: 'Adobe Creative', legalName: 'Adobe Systems Software', category: 'Software', email: 'adobe-billing@adobe.com' },
];

export const initialBankAccounts: BankAccount[] = [
    { id: 'ba1', name: 'Itaú Principal', type: 'CHECKING', bankName: 'Itaú Unibanco', balance: 45000, color: '#ec6608', status: 'ACTIVE' },
    { id: 'ba2', name: 'Reserva Nubank', type: 'SAVINGS', bankName: 'Nubank', balance: 12500, color: '#8a05be', status: 'ACTIVE' },
    { id: 'ba3', name: 'Caixa Pequeno', type: 'CASH', bankName: 'Dinheiro em Espécie', balance: 850, color: '#10b981', status: 'ACTIVE' }
];

export const initialCreditCards: CreditCard[] = [
    { id: 'cc1', name: 'Visa Platinum Business', brand: 'Visa', limit: 25000, availableLimit: 18450, closingDay: 25, dueDate: 5, color: '#1e3a8a', status: 'ACTIVE' },
    { id: 'cc2', name: 'Mastercard Black', brand: 'Mastercard', limit: 50000, availableLimit: 42000, closingDay: 10, dueDate: 20, color: '#000000', status: 'ACTIVE' }
];

export const initialFinancialTransactions: FinancialTransaction[] = [
    { id: 'ft1', description: 'Mensalidade TechStart', amount: 8500, type: 'INCOME', date: '2024-03-10', status: 'PAID', categoryId: 'cat1', bankAccountId: 'ba1', clientId: 'c1', responsibleId: 'u1', createdAt: Date.now() },
    { id: 'ft2', description: 'Servidores AWS', amount: 450, type: 'EXPENSE', date: '2024-03-20', status: 'PAID', categoryId: 'cat2', creditCardId: 'cc1', responsibleId: 'u3', createdAt: Date.now() },
    { id: 'ft3', description: 'Assinatura Adobe Creative', amount: 220, type: 'EXPENSE', date: '2024-03-22', status: 'PAID', categoryId: 'cat2', creditCardId: 'cc1', responsibleId: 'u3', createdAt: Date.now() },
    { id: 'ft4', description: 'Aluguel Escritório', amount: 4500, type: 'EXPENSE', date: '2024-04-05', status: 'PENDING', categoryId: 'cat5', bankAccountId: 'ba1', responsibleId: 'u3', createdAt: Date.now() }
];

export const initialCardInvoices: CardInvoice[] = [
    { id: 'inv1', creditCardId: 'cc1', month: '2024-03', amount: 6550, status: 'PAID', dueDate: '2024-04-05' },
    { id: 'inv2', creditCardId: 'cc1', month: '2024-04', amount: 1200, status: 'OPEN', dueDate: '2024-05-05' }
];

export const initialServices: AgencyService[] = [
    { 
        id: 's1', 
        name: 'Gestão de Redes Sociais', 
        description: 'Gestão completa de presença digital em Instagram e Facebook.', 
        type: 'RECURRENT',
        category: 'Conteúdo',
        status: 'ACTIVE',
        basePrice: 2500, 
        deliveries: [
            { id: 'd1', description: 'Posts estáticos / Carrossel', quantity: 12, frequency: 'MONTHLY' },
            { id: 'd2', description: 'Stories semanais', quantity: 4, frequency: 'WEEKLY' }
        ],
        taskTemplates: [
            { id: 't1', title: 'Criação de Cronograma Mensal', priority: 'HIGH' },
            { id: 't2', title: 'Design dos Posts - Lote 1', priority: 'MEDIUM' }
        ],
        tags: ['social media', 'conteúdo', 'instagram']
    },
    { 
        id: 's2', 
        name: 'Inbound Marketing', 
        description: 'Estratégia de atração e conversão de leads qualificados.', 
        type: 'RECURRENT',
        category: 'Tráfego',
        status: 'ACTIVE',
        basePrice: 4000, 
        deliveries: [
            { id: 'd3', description: 'Artigos para Blog', quantity: 4, frequency: 'MONTHLY' },
            { id: 'd4', description: 'Email Marketing', quantity: 2, frequency: 'MONTHLY' }
        ],
        taskTemplates: [
            { id: 't3', title: 'Pesquisa de Palavras-chave', priority: 'MEDIUM' },
            { id: 't4', title: 'Redação de Artigos', priority: 'MEDIUM' }
        ],
        tags: ['inbound', 'seo', 'leads']
    },
    { 
        id: 's3', 
        name: 'Landing Page High-End', 
        description: 'Desenvolvimento de página de alta conversão focada em vendas.', 
        type: 'ONEOFF',
        category: 'Design',
        status: 'ACTIVE',
        basePrice: 3500, 
        deliveries: [
            { id: 'd5', description: 'Landing Page Responsiva', quantity: 1, frequency: 'ONEOFF' }
        ],
        taskTemplates: [
            { id: 't5', title: 'Briefing de Design', priority: 'HIGH' },
            { id: 't6', title: 'Desenvolvimento Frontend', priority: 'HIGH' }
        ],
        tags: ['web', 'lp', 'conversão']
    }
];

export const initialNotifications: Notification[] = [
    { 
        id: 'n1', 
        title: 'Bem-vindo', 
        message: 'Sistema atualizado para versão de produção.', 
        type: 'INFO', 
        status: 'UNREAD', 
        priority: 'LOW',
        originModule: 'ADMIN',
        timestamp: Date.now() 
    },
    {
        id: 'n2',
        title: 'Tarefa Pendente',
        message: 'A tarefa "Campanha de Performance - TechStart" precisa de atenção.',
        type: 'WARNING',
        status: 'UNREAD',
        priority: 'HIGH',
        originModule: 'KANBAN',
        timestamp: Date.now() - 3600000,
        navToView: 'kanban',
        actionLabel: 'abrir_card',
        metadata: {
            referenceId: 't-1',
            module: 'tarefas',
            action: 'abrir_card'
        }
    },
    {
        id: 'n3',
        title: 'Novo Lead',
        message: 'Um novo lead "Carlos Oliveira" foi atribuído a você.',
        type: 'SUCCESS',
        status: 'UNREAD',
        priority: 'MEDIUM',
        originModule: 'CRM',
        timestamp: Date.now() - 7200000,
        navToView: 'crm',
        actionLabel: 'abrir_modal',
        metadata: {
            referenceId: 'l1',
            module: 'crm',
            action: 'abrir_modal'
        }
    }
];

export const initialRolePermissions: RolePermissions = {
    'ADMIN': [
        'dashboard', 'kanban', 'productivity', 'teams', 'clients', 'catalog', 
        'crm', 'finance', 'permissions', 'system-admin', 
        'requisitions', 'help', 'approvals', 'stock', 'assets',
        'action:delete', 'action:export', 'action:approve_budget', 'action:manage_users'
    ],
    'MANAGER': [
        'dashboard', 'kanban', 'productivity', 'teams', 'clients', 'catalog', 
        'crm', 'finance', 'requisitions', 'help', 'approvals', 'stock', 'assets',
        'action:approve_budget', 'action:export'
    ],
    'EMPLOYEE': [
        'kanban', 'productivity', 'requisitions', 'help', 'approvals'
    ],
    'FREELANCER': [
        'dashboard', 'kanban', 'crm', 'requisitions', 'help'
    ],
    'FINANCE': [
        'dashboard', 'finance', 'clients', 'requisitions', 'help', 'approvals', 'stock', 'assets',
        'action:approve_budget', 'action:export'
    ],
    'CLIENT': [
        'client-portal', 'help', 'approvals' 
    ]
};

export const initialTaskColumns: ColumnConfig[] = [
  { id: 'BACKLOG', label: 'Backlog', color: 'border-slate-400', order: 0, isArchived: false },
  { id: 'TODO', label: 'A Fazer', color: 'border-blue-400', order: 1, isArchived: false },
  { id: 'IN_PROGRESS', label: 'Em Progresso', color: 'border-indigo-400', order: 2, isArchived: false },
  { id: 'REVIEW', label: 'Revisão', color: 'border-purple-400', order: 3, isArchived: false },
  { id: 'DONE', label: 'Concluído', color: 'border-emerald-400', order: 4, isArchived: false },
];

export const initialCrmColumns: ColumnConfig[] = [
  { id: 'NEW', label: 'Novos Leads', color: 'bg-blue-50 border-blue-200', order: 0, isArchived: false },
  { id: 'QUALIFIED', label: 'Qualificados', color: 'bg-indigo-50 border-indigo-200', order: 1, isArchived: false },
  { id: 'PROPOSAL', label: 'Proposta Enviada', color: 'bg-purple-50 border-purple-200', order: 2, isArchived: false },
  { id: 'NEGOTIATION', label: 'Em Negociação', color: 'bg-orange-50 border-orange-200', order: 3, isArchived: false },
  { id: 'WON', label: 'Fechado Ganho', color: 'bg-emerald-50 border-emerald-200', order: 4, isArchived: false },
  { id: 'LOST', label: 'Perdido', color: 'bg-red-50 border-red-200', order: 5, isArchived: false },
];

export const initialLossReasons: LossReason[] = [
    { id: 'price', label: 'Preço Elevado', isActive: true },
    { id: 'competitor', label: 'Fechou com Concorrente', isActive: true },
    { id: 'no_budget', label: 'Sem Orçamento', isActive: true },
    { id: 'timing', label: 'Timing Errado', isActive: true },
    { id: 'feature_missing', label: 'Falta de Funcionalidade', isActive: true },
];

export const initialLeads: Lead[] = [
    {
        id: 'l1',
        name: 'Carlos Oliveira',
        company: 'Indústria Metalúrgica S.A.',
        value: 15000,
        stageId: 'NEW',
        status: 'OPEN',
        email: 'carlos@metalurgica.com.br',
        phone: '11988887777',
        lastContact: new Date().toISOString(),
        source: 'Google Ads',
        rating: 4,
        responsibleId: 'u1',
        priority: 'HIGH',
        temperature: 'HOT',
        createdAt: Date.now() - 86400000 * 5,
        updatedAt: Date.now(),
        history: [],
        tasks: [
            { id: 'lt1', text: 'Ligar para Carlos', completed: false, dueDate: new Date().toISOString(), type: 'CALL', createdAt: Date.now() }
        ]
    },
    {
        id: 'l2',
        name: 'Ana Souza',
        company: 'Varejo Express',
        value: 8000,
        stageId: 'QUALIFIED',
        status: 'OPEN',
        email: 'ana@varejo.com.br',
        phone: '11977776666',
        lastContact: new Date().toISOString(),
        source: 'Linkedin',
        rating: 3,
        responsibleId: 'u2',
        priority: 'MEDIUM',
        temperature: 'WARM',
        createdAt: Date.now() - 86400000 * 2,
        updatedAt: Date.now(),
        history: [],
        tasks: []
    }
];
export const initialGoals: ProductivityGoal[] = [
    {
        id: 'g1',
        title: 'Meta Global de Produção',
        type: 'PRODUCTION',
        period: 'MONTHLY',
        targetValue: 100,
        month: new Date().toISOString().substring(0, 7),
        createdAt: Date.now()
    },
    {
        id: 'g2',
        title: 'Meta Squad Principal',
        type: 'PRODUCTION',
        period: 'MONTHLY',
        targetValue: 60,
        squadId: 'squad-1',
        month: new Date().toISOString().substring(0, 7),
        createdAt: Date.now()
    }
];

export const initialTasks: Task[] = [
    {
        id: 't-1',
        title: 'Campanha de Performance - TechStart',
        description: 'Configuração de tags e acompanhamento de conversão.',
        status: 'IN_PROGRESS',
        priority: 'HIGH',
        dueDate: new Date().toISOString().split('T')[0], // Hoje
        assigneeIds: ['u1', 'u4', 'u7'],
        clientId: 'c1',
        clientRequest: true,
        squadId: 'squad-2',
        timeLogs: [],
        isTracking: false,
        checklists: [],
        comments: [],
        history: [],
        estimatedTime: 8,
        createdAt: Date.now() - 86400000 * 2
    },
    {
        id: 't-req-1',
        title: 'Novo Post: Promoção de Verão',
        description: '[SOCIAL_MEDIA] Preciso de um post para o Instagram anunciando 20% de desconto.',
        status: 'BACKLOG',
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
        assigneeIds: [],
        clientId: 'c1',
        clientRequest: true,
        squadId: 'squad-2',
        timeLogs: [],
        isTracking: false,
        checklists: [],
        comments: [],
        history: [],
        estimatedTime: 0,
        createdAt: Date.now() - 3600000
    },
    {
        id: 't-2',
        title: 'Design de Landing Page',
        description: 'Criação do layout no Figma.',
        status: 'DONE',
        priority: 'MEDIUM',
        dueDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Ontem
        completedAt: Date.now() - 3600000, // 1 hora atrás
        assigneeIds: ['u5'],
        squadId: 'squad-1',
        timeLogs: [],
        isTracking: false,
        checklists: [],
        comments: [],
        history: [],
        estimatedTime: 12,
        createdAt: Date.now() - 86400000 * 5
    },
    {
        id: 't-3',
        title: 'Revisão de Copywriting',
        description: 'Ajustes nos textos dos anúncios.',
        status: 'TODO',
        priority: 'LOW',
        dueDate: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0], // Anteontem (Atrasada)
        assigneeIds: ['u4'],
        squadId: 'squad-1',
        timeLogs: [],
        isTracking: false,
        checklists: [],
        comments: [],
        history: [],
        estimatedTime: 4,
        createdAt: Date.now() - 86400000 * 3
    }
];
export const initialRequisitions: Requisition[] = [];

export const initialApprovalBatches: ApprovalBatch[] = [
    {
        id: 'b1',
        title: 'Posts Abril - Semana 1',
        clientId: 'c1',
        status: 'SENT',
        createdAt: Date.now() - 86400000 * 2,
        updatedAt: Date.now() - 86400000,
        items: [
            {
                id: 'i1',
                title: 'Post 01 - Lançamento Produto',
                description: 'Post focado no novo recurso de automação.',
                category: 'SOCIAL_MEDIA',
                status: 'PENDING',
                files: ['https://picsum.photos/seed/post1/1080/1080', 'https://picsum.photos/seed/post1b/1080/1080'],
                caption: '🚀 O futuro da automação chegou! Conheça o novo recurso da TechStart que vai revolucionar seu workflow. #TechStart #Inovação #SaaS',
                comments: [
                    { id: 'c1', userId: 'u2', text: 'A legenda está ótima, mas a cor do botão no segundo slide poderia ser mais vibrante.', timestamp: Date.now() - 3600000 }
                ],
                createdAt: Date.now() - 86400000 * 2,
                updatedAt: Date.now() - 3600000
            },
            {
                id: 'i2',
                title: 'Post 02 - Dica Técnica',
                description: 'Dica sobre como otimizar o uso da plataforma.',
                category: 'SOCIAL_MEDIA',
                status: 'APPROVED',
                files: ['https://picsum.photos/seed/post2/1080/1080'],
                caption: '💡 Dica do dia: Use atalhos de teclado para navegar 2x mais rápido. Confira no vídeo! #DicaTech #Produtividade',
                comments: [],
                createdAt: Date.now() - 86400000 * 2,
                updatedAt: Date.now() - 7200000
            }
        ]
    },
    {
        id: 'b2',
        title: 'Identidade Visual - Rebranding',
        clientId: 'c1',
        status: 'OPEN',
        createdAt: Date.now() - 86400000 * 5,
        updatedAt: Date.now() - 86400000 * 2,
        items: [
            {
                id: 'i3',
                title: 'Logo Principal - V1',
                category: 'DESIGN',
                status: 'ADJUSTMENT',
                files: ['https://picsum.photos/seed/logo1/1200/800'],
                comments: [
                    { id: 'c2', userId: 'u1', text: 'Gostei do conceito, mas o ícone parece muito pesado em relação à tipografia.', timestamp: Date.now() - 86400000 * 3 }
                ],
                createdAt: Date.now() - 86400000 * 5,
                updatedAt: Date.now() - 86400000 * 3
            }
        ]
    },
    {
        id: 'b3',
        title: 'Apresentação de Resultados Q1',
        clientId: 'c1',
        status: 'SENT',
        createdAt: Date.now() - 86400000,
        updatedAt: Date.now(),
        items: [
            {
                id: 'i4',
                title: 'Relatório Q1 2024',
                category: 'PDF',
                status: 'PENDING',
                files: ['https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'],
                pages: [
                    { number: 1, status: 'APPROVED', comments: [] },
                    { number: 2, status: 'PENDING', comments: [{ id: 'c3', userId: 'u2', text: 'Os números do gráfico de barras não batem com a tabela abaixo.', timestamp: Date.now(), pageNumber: 2 }] },
                    { number: 3, status: 'PENDING', comments: [] }
                ],
                comments: [],
                createdAt: Date.now() - 86400000,
                updatedAt: Date.now()
            }
        ]
    },
    {
        id: 'b4',
        title: 'Campanha Dia dos Namorados',
        clientId: 'c2',
        status: 'SENT',
        createdAt: Date.now() - 86400000 * 3,
        updatedAt: Date.now() - 86400000,
        items: [
            {
                id: 'i5',
                title: 'Post 01 - Promoção Vinhos Tintos',
                category: 'SOCIAL_MEDIA',
                status: 'PENDING',
                files: ['https://picsum.photos/seed/wine1/1080/1080'],
                caption: '🍷 O presente perfeito para o seu amor está aqui. Aproveite 15% OFF em vinhos selecionados.',
                comments: [],
                createdAt: Date.now() - 86400000 * 3,
                updatedAt: Date.now() - 86400000
            },
            {
                id: 'i6',
                title: 'Post 02 - Kit Especial',
                category: 'SOCIAL_MEDIA',
                status: 'REJECTED',
                files: ['https://picsum.photos/seed/wine2/1080/1080'],
                caption: '🎁 Surpreenda com nosso Kit Especial de Namorados.',
                comments: [
                    { id: 'c4', userId: 'u2', text: 'A foto do kit não está valorizando os produtos. Precisamos de um novo clique.', timestamp: Date.now() - 86400000 * 2 }
                ],
                createdAt: Date.now() - 86400000 * 3,
                updatedAt: Date.now() - 86400000 * 2
            }
        ]
    },
    {
        id: 'b5',
        title: 'Novo Site - Protótipo Home',
        clientId: 'c3',
        status: 'SENT',
        createdAt: Date.now() - 86400000 * 4,
        updatedAt: Date.now() - 86400000 * 2,
        items: [
            {
                id: 'i7',
                title: 'Home Page - Desktop V2',
                category: 'DESIGN',
                status: 'APPROVED',
                files: ['https://picsum.photos/seed/web1/1200/800'],
                comments: [
                    { id: 'c5', userId: 'u1', text: 'Ficou excelente! Pode seguir para o desenvolvimento.', timestamp: Date.now() - 86400000 * 2 }
                ],
                createdAt: Date.now() - 86400000 * 4,
                updatedAt: Date.now() - 86400000 * 2
            }
        ]
    }
];

export const initialStock: StockItem[] = [
    { id: 'st1', name: 'Papel A4', category: 'Escritório', quantity: 50, minQuantity: 10, unit: 'Pacote', price: 25.00, location: 'Almoxarifado' },
    { id: 'st2', name: 'Toner Impressora', category: 'Escritório', quantity: 2, minQuantity: 1, unit: 'Unidade', price: 150.00, location: 'Almoxarifado' },
    { id: 'st3', name: 'Café em Grãos', category: 'Copa', quantity: 5, minQuantity: 2, unit: 'kg', price: 45.00, location: 'Cozinha' }
];

export const initialAssets: Asset[] = [
    { id: 'as1', name: 'MacBook Pro M3', category: 'HARDWARE', purchaseDate: '2024-01-10', purchaseValue: 15000, currentValue: 14000, status: 'ACTIVE', responsibleId: 'u1', serialNumber: 'MBP123456' },
    { id: 'as2', name: 'Cadeira Ergonômica', category: 'FURNITURE', purchaseDate: '2023-05-15', purchaseValue: 1200, currentValue: 900, status: 'ACTIVE', location: 'Escritório Central' },
    { id: 'as3', name: 'Licença Adobe Creative Cloud', category: 'SOFTWARE', purchaseDate: '2024-01-01', purchaseValue: 2500, currentValue: 2500, status: 'ACTIVE' }
];

export const initialCashSessions: CashRegisterSession[] = [];

export const initialCashMovements: CashMovement[] = [];
