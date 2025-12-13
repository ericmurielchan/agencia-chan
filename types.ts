
export type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE' | 'FREELANCER' | 'CLIENT' | 'FINANCE';

export interface SystemSettings {
    agencyName: string;
    logo: string; // URL ou Base64
    primaryColor: string; // Hex Code (ex: #db2777)
    sidebarColor: string; // Hex Code (ex: #0f172a)
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
  title: string;
  description: string;
  status: string;
  assigneeIds: string[];
  squadId?: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  dueDate: string;
  estimatedTime: number;
  timeLogs: TimeLog[];
  isTracking: boolean;
  clientRequest?: boolean;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED'; // Novo campo
  checklists: ChecklistItem[];
  comments: Comment[];
  history: HistoryLog[];
  archived?: boolean;
  cover?: TaskCover;
}

export interface LeadTask {
    id: string;
    text: string;
    completed: boolean;
    dueDate?: string;
    type?: 'CALL' | 'MEETING' | 'EMAIL' | 'TASK';
}

export interface Lead {
  id: string;
  name: string;
  company: string;
  value: number;
  stage: string;
  email: string;
  phone?: string;
  lastContact: string;
  source?: string;
  rating?: number;
  tasks?: LeadTask[];
  notes?: string;
}

export interface ClientContact {
    name: string;
    email: string;
    phone: string;
    role: string;
    birthDate?: string;
}

export interface Client {
    id: string;
    name: string;
    legalName?: string;
    status: 'ACTIVE' | 'INACTIVE' | 'CHURNED';
    isRecurring: boolean;
    level: 'BASIC' | 'INTERMEDIATE' | 'ADVANCED'; 
    summary?: string; 
    contractUrl?: string;
    assetsFolderUrl?: string;
    contacts: ClientContact[];
    squadId?: string;
    monthlyValue?: number;
    contractStartDate?: string;
    serviceIds?: string[];
}

export interface AgencyService {
    id: string;
    name: string;
    description: string;
    basePrice: number;
    active: boolean;
}

export interface FinancialRecord {
  id: string;
  description: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED';
  dueDate: string;
  paymentDate?: string;
  category: string;
  entity: string;
  installment?: { // Novo: Suporte a parcelamento
      current: number;
      total: number;
      groupId: string;
  };
}

export interface Asset {
  id: string;
  name: string;
  type: 'SOFTWARE' | 'HARDWARE' | 'OFFICE';
  cost: number;
  purchaseDate: string;
  assignedTo?: string;
  condition?: 'NEW' | 'USED' | 'DAMAGED';
}

export interface StockItem {
    id: string;
    name: string;
    category: 'OFFICE' | 'IT' | 'MARKETING' | 'CLEANING';
    quantity: number;
    minQuantity: number;
    unitPrice: number;
    lastRestock: string;
    deletedAt?: string; // Novo: Data da exclusão (Soft Delete)
    deletionReason?: string; // Novo: Motivo da exclusão
    deletedBy?: string; // Novo: Quem excluiu
}

export interface Requisition {
    id: string;
    requesterId: string;
    title: string;
    description: string;
    estimatedCost: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PURCHASED';
    date: string;
    category: string;
    
    // Audit Fields
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
}

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'INFO' | 'WARNING' | 'SUCCESS' | 'Birthday' | 'REJECTED';
    read: boolean;
    timestamp: number;
    link?: string;
    targetUserId?: string; // Novo: Direcionamento da notificação
    navToView?: string; // Novo: ID da view para navegação (ex: 'kanban', 'crm')
}

export type RolePermissions = Record<Role, string[]>;
