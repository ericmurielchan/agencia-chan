
export type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'FREELANCER' | 'CLIENT' | 'FINANCE';

export interface ConfirmOptions {
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'info';
}

export interface SystemSettings {
    agencyName: string;
    logo: string;
    favicon?: string;
    primaryColor: string;
    sidebarColor: string;
}

export interface UserPreferences {
    theme: 'light' | 'dark';
    emailNotifications: boolean;
    systemNotifications: boolean;
    compactMode: boolean;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  avatar: string;
  squad?: string;
  clientId?: string;
  hourlyRate?: number;
  salary?: number;
  birthDate?: string;
  documents?: string[];
  bankDetails?: string;
  admissionDate?: string;
  hasSystemAccess?: boolean;
  password?: string;
  preferences?: UserPreferences;
}

export type TaskStatus = 'BACKLOG' | 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

export interface Comment {
  id: string;
  userId: string;
  text: string;
  timestamp: number;
}

export interface ChecklistItem {
  id: string;
  text: string;
  isCompleted: boolean;
  dueDate?: string;
  assigneeId?: string;
}

export interface HistoryLog {
  id: string;
  action: string;
  userId: string;
  timestamp: number;
}

export interface TimeLog {
  userId: string;
  startTime: number;
  endTime?: number;
  duration: number;
}

export interface TaskCover {
    type: 'COLOR' | 'IMAGE';
    value: string;
}

export interface Task {
  id: string;
  clientId?: string;
  title: string;
  description: string;
  status: string;
  assigneeIds: string[];
  squadId?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: string;
  completedAt?: number;
  estimatedTime: number;
  timeLogs: TimeLog[];
  isTracking: boolean;
  clientRequest?: boolean;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  checklists: ChecklistItem[];
  comments: Comment[];
  history: HistoryLog[];
  archived?: boolean;
  createdAt: number;
  cover?: TaskCover;
  coverType?: 'color' | 'image' | null;
  coverValue?: string | null;
}

export interface LeadTask {
    id: string;
    text: string;
    completed: boolean;
    dueDate?: string;
    time?: string;
    type?: 'CALL' | 'MEETING' | 'EMAIL' | 'TASK';
    createdAt: number;
}

export interface LeadHistory {
    id: string;
    userId: string;
    action: string;
    timestamp: number;
    details?: string;
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  value: number;
  stageId: string;
  status: 'OPEN' | 'WON' | 'LOST';
  lossReasonId?: string;
  email: string;
  phone?: string;
  lastContact: string;
  source?: string;
  rating?: number;
  tasks?: LeadTask[];
  notes?: string;
  responsibleId?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  temperature: 'COLD' | 'WARM' | 'HOT';
  createdAt: number;
  updatedAt: number;
  history: LeadHistory[];
  tags?: string[];
}

export interface LossReason {
    id: string;
    label: string;
    isActive: boolean;
}

export interface PipelineStage {
    id: string;
    label: string;
    color: string;
    order: number;
}

export interface ClientContact {
    name: string;
    email: string;
    phone: string;
    role: string;
    birthDate?: string;
}

export interface PasswordEntry {
    id: string;
    platform: string;
    login: string;
    password: string;
    link?: string;
    observations?: string;
}

export interface PasswordLog {
    id: string;
    userId: string;
    timestamp: number;
    platform: string;
}

export interface SystemAccess {
    id: string;
    username?: string;
    email?: string;
    password?: string;
    label?: string;
}

export interface Client {
    id: string;
    name: string; // Nome / Empresa
    legalName?: string;
    document?: string; // CNPJ/CPF
    status: 'LEAD' | 'ACTIVE' | 'INACTIVE';
    entryDate?: string;
    responsibleId?: string;
    squadId?: string;
    
    contact?: {
        name: string;
        email: string;
        phone: string;
        whatsapp: string;
    };
    
    financialContact?: {
        name: string;
        email: string;
        phone: string;
    };
    
    passwords?: PasswordEntry[];
    passwordLogs?: PasswordLog[];
    
    documentationLinks?: string[];
    
    tags?: string[];
    internalNotes?: string;
    classification?: 'A' | 'B' | 'C';
    
    systemAccesses?: SystemAccess[];
    serviceIds?: string[];

    isRecurring: boolean;
    level: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'; 
    summary?: string; 
    contractUrl?: string;
    assetsFolderUrl?: string;
    contacts: ClientContact[];
    monthlyValue?: number;
    contractStartDate?: string;
}

export interface ServiceDelivery {
    id: string;
    description: string;
    quantity: number;
    frequency: 'WEEKLY' | 'MONTHLY' | 'ONEOFF';
}

export interface TaskTemplate {
    id: string;
    title: string;
    description?: string;
    estimatedTime?: number;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface AgencyService {
    id: string;
    name: string;
    description: string;
    type: 'RECURRENT' | 'ONEOFF';
    category: string;
    status: 'ACTIVE' | 'INACTIVE';
    basePrice: number;
    deliveries: ServiceDelivery[];
    taskTemplates: TaskTemplate[];
    tags: string[];
    observations?: string;
}

export interface FinancialCategory {
    id: string;
    name: string;
    type: 'INCOME' | 'EXPENSE' | 'BOTH';
    color: string;
}

export interface BankAccount {
    id: string;
    name: string;
    type: 'CHECKING' | 'SAVINGS' | 'CASH' | 'INVESTMENT';
    bankName: string;
    balance: number;
    color: string;
    status: 'ACTIVE' | 'INACTIVE';
}

export interface CreditCard {
    id: string;
    name: string;
    brand: string;
    limit: number;
    availableLimit: number;
    closingDay: number;
    dueDate: number;
    color: string;
    status: 'ACTIVE' | 'INACTIVE';
}

export interface FinancialTransaction {
    id: string;
    description: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE';
    date: string;
    status: 'PAID' | 'PENDING';
    categoryId: string;
    bankAccountId?: string;
    creditCardId?: string;
    clientId?: string;
    squadId?: string;
    responsibleId: string;
    installments?: {
        current: number;
        total: number;
        groupId: string;
    };
    recurrenceId?: string;
    createdAt: number;
}

export interface CardInvoice {
    id: string;
    creditCardId: string;
    month: string; // YYYY-MM
    amount: number;
    status: 'OPEN' | 'CLOSED' | 'PAID' | 'OVERDUE';
    dueDate: string;
}

export interface Supplier {
    id: string;
    name: string;
    legalName?: string;
    document?: string;
    email?: string;
    phone?: string;
    bankDetails?: string;
    category?: string;
}

export interface Requisition {
    id: string;
    clientId?: string;
    requesterId: string;
    title: string;
    description: string;
    estimatedCost: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PURCHASED';
    date: string;
    category: string;
    approvedBy?: string;
    approvedAt?: string;
    rejectedBy?: string;
    rejectedAt?: string;
    rejectedReason?: string;
}

export interface Squad {
  id: string;
  name: string;
  members: string[];
}

export interface ColumnConfig {
    id: string;
    label: string;
    color: string;
    order: number;
    wipLimit?: number | null;
    isArchived: boolean;
}

export type NotificationPriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type NotificationStatus = 'UNREAD' | 'READ' | 'ARCHIVED';
export type SystemModule = 'KANBAN' | 'CRM' | 'FINANCE' | 'REQUISITIONS' | 'CLIENTS' | 'ADMIN' | 'HELP' | 'DASHBOARD' | 'APPROVALS' | 'STOCK' | 'ASSETS';

export interface StockItem {
    id: string;
    name: string;
    category: string;
    quantity: number;
    minQuantity: number;
    unit: string;
    price: number;
    supplierId?: string;
    lastRestock?: string;
    location?: string;
}

export interface Asset {
    id: string;
    name: string;
    category: 'HARDWARE' | 'SOFTWARE' | 'FURNITURE' | 'VEHICLE' | 'OTHER';
    purchaseDate: string;
    purchaseValue: number;
    currentValue: number;
    status: 'ACTIVE' | 'MAINTENANCE' | 'DISPOSED';
    location?: string;
    responsibleId?: string;
    serialNumber?: string;
    description?: string;
}

export interface CashRegisterSession {
    id: string;
    openedAt: string;
    closedAt?: string;
    openedBy: string;
    closedBy?: string;
    initialAmount: number;
    finalAmount?: number;
    expectedAmount?: number;
    status: 'OPEN' | 'CLOSED';
    notes?: string;
}

export interface CashMovement {
    id: string;
    sessionId: string;
    type: 'IN' | 'OUT';
    amount: number;
    description: string;
    timestamp: string;
    category: 'SALE' | 'SUPPLY' | 'WITHDRAWAL' | 'EXPENSE' | 'OTHER';
}

export type ApprovalCategory = 'SOCIAL_MEDIA' | 'DESIGN' | 'PDF' | 'TRAFFIC' | 'VIDEO' | 'SHOOTING' | 'OTHERS';
export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'ADJUSTMENT';

export interface ApprovalComment {
    id: string;
    userId: string;
    text: string;
    timestamp: number;
    pageNumber?: number; // For PDF
}

export interface ApprovalItem {
    id: string;
    title: string;
    description?: string;
    category: ApprovalCategory;
    status: ApprovalStatus;
    files: string[]; // URLs
    caption?: string; // For Social Media
    comments: ApprovalComment[];
    pages?: { // For PDF
        number: number;
        status: ApprovalStatus;
        comments: ApprovalComment[];
    }[];
    taskId?: string;
    createdAt: number;
    updatedAt: number;
}

export interface ApprovalBatch {
    id: string;
    title: string;
    clientId: string;
    status: 'OPEN' | 'SENT' | 'COMPLETED';
    items: ApprovalItem[];
    createdAt: number;
    updatedAt: number;
}

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ALERT' | 'Birthday' | 'REJECTED' | 'SECURITY';
    priority: NotificationPriority;
    status: NotificationStatus;
    originModule: SystemModule;
    timestamp: number;
    targetUserId?: string;
    targetRole?: Role;
    navToView?: string;
    actionLabel?: string;
    metadata?: {
        referenceId?: string;
        module?: string;
        action?: string;
        [key: string]: any;
    };
}

export interface ProductivityGoal {
    id: string;
    title: string;
    type: 'PRODUCTION' | 'HOURS';
    period: 'MONTHLY';
    targetValue: number;
    squadId?: string; // If squad goal
    userId?: string;  // If individual goal
    month: string;    // YYYY-MM
    createdAt: number;
}

export type RolePermissions = Record<Role, string[]>;
