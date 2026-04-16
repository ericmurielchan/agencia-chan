import { supabase } from '../lib/supabaseClient';
import { initialUsers, initialTasks, initialClients, initialLeads, initialSquads, initialCreditCards, initialNotifications, initialApprovalBatches } from '../utils/mockData';
import { 
  User, Task, Lead, Client, SystemSettings, Squad, CreditCard, BankAccount,
  FinancialTransaction, StockItem, Asset, CashRegisterSession, CashMovement,
  Requisition, AgencyService, Notification, ApprovalBatch, ProductivityGoal,
  RolePermissions, ApprovalStatus, ApprovalItem
} from '../types';

/**
 * Mapeia uma squad do Supabase para o formato do App
 */
const mapSquad = (s: any): Squad => ({
  id: s.id,
  name: s.name,
  members: s.members || []
});

/**
 * Mapeia as configurações do sistema do Supabase para o formato do App
 */
const mapSettings = (s: any): SystemSettings => ({
  agencyName: s.agency_name || 'Agência Chan',
  logo: s.logo || '',
  favicon: s.favicon || '',
  primaryColor: s.primary_color || '#db2777',
  sidebarColor: s.sidebar_color || '#0f172a'
});

/**
 * Mapeia um usuário do Supabase para o formato do App
 */
export const mapUser = (u: any): User => ({
  id: u.id,
  name: u.name,
  email: u.email,
  role: u.role,
  avatar: u.avatar,
  squad: u.squad_id,
  clientId: u.client_id,
  hourlyRate: u.hourly_rate,
  salary: u.salary,
  hasSystemAccess: u.has_system_access,
  password: u.password,
  preferences: u.preferences || { theme: 'light', emailNotifications: true, systemNotifications: true, compactMode: false }
});

/**
 * Mapeia uma tarefa do Supabase para o formato do App
 */
const mapTask = (t: any): Task => ({
  id: t.id,
  clientId: t.client_id,
  title: t.title,
  description: t.description || '',
  status: t.status,
  priority: t.priority,
  dueDate: t.due_date,
  estimatedTime: t.estimated_time || 0,
  assigneeIds: t.assignee_ids || [],
  squadId: t.squad_id,
  isTracking: t.is_tracking || false,
  approvalStatus: t.approval_status || 'PENDING',
  archived: t.archived || false,
  createdAt: t.created_at || Date.now(),
  cover: t.cover,
  timeLogs: t.time_logs || [],
  checklists: t.checklists || [],
  comments: t.comments || [],
  history: t.history || []
});

/**
 * Mapeia um lead do Supabase para o formato do App
 */
const mapLead = (l: any): Lead => ({
  id: l.id,
  name: l.name,
  company: l.company || '',
  value: l.value || 0,
  stageId: l.stage_id,
  status: l.status || 'OPEN',
  email: l.email || '',
  phone: l.phone || '',
  priority: l.priority || 'MEDIUM',
  temperature: l.temperature || 'WARM',
  responsibleId: l.responsible_id,
  notes: l.notes || '',
  tags: l.tags || [],
  createdAt: l.created_at || Date.now(),
  updatedAt: l.updated_at || Date.now(),
  lastContact: l.last_contact || new Date().toISOString(),
  history: l.history || [],
  tasks: l.tasks || []
});

/**
 * Mapeia um cliente do Supabase para o formato do App
 */
const mapClient = (c: any): Client => ({
  id: c.id,
  name: c.name,
  legalName: c.legal_name,
  document: c.document,
  status: c.status,
  responsibleId: c.responsible_id,
  squadId: c.squad_id,
  monthlyValue: c.monthly_value,
  isRecurring: c.is_recurring || false,
  level: c.level || 'BASIC',
  summary: c.summary,
  contractUrl: c.contract_url,
  assetsFolderUrl: c.assets_folder_url,
  contact: c.contact_info,
  financialContact: c.financial_contact,
  tags: c.tags || [],
  internalNotes: c.internal_notes,
  classification: c.classification,
  documentationLinks: c.documentation_links || [],
  serviceIds: c.service_ids || [],
  entryDate: c.entry_date,
  contacts: c.contacts || [],
  passwords: c.passwords || [],
  passwordLogs: c.password_logs || [],
  systemAccesses: c.system_accesses || []
});

/**
 * Função para testar a conexão com o Supabase buscando dados da tabela 'users'.
 */
export const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from('users').select('*').limit(1);
    if (error) throw error;
    return { success: true, data };
  } catch (err) {
    console.error('Erro ao conectar com Supabase:', err);
    return { success: false, error: err };
  }
};

/**
 * Busca todos os usuários do banco de dados
 */
export const fetchUsers = async () => {
  const { data, error } = await supabase.from('users').select('id, name, email, role, avatar, squad_id, client_id, hourly_rate, salary, has_system_access, password, preferences');
  if (error) {
    console.error('Erro ao buscar usuários:', error);
    return [];
  }
  return (data || []).map(mapUser);
};

/**
 * Busca todas as tarefas do banco de dados
 */
export const fetchTasks = async () => {
  const { data, error } = await supabase.from('tasks').select('id, client_id, title, description, status, priority, due_date, estimated_time, assignee_ids, squad_id, is_tracking, approval_status, archived, created_at, cover, time_logs, checklists, comments, history');
  if (error) {
    console.error('Erro ao buscar tarefas:', error);
    return [];
  }
  return (data || []).map(mapTask);
};

/**
 * Salva ou atualiza uma tarefa no banco de dados
 */
export const saveTask = async (task: Partial<Task>) => {
  const { error } = await supabase.from('tasks').upsert({
    id: task.id || undefined,
    client_id: task.clientId,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    due_date: task.dueDate ? new Date(task.dueDate).toISOString() : null,
    estimated_time: task.estimatedTime,
    assignee_ids: task.assigneeIds,
    squad_id: task.squadId,
    is_tracking: task.isTracking,
    approval_status: task.approvalStatus,
    archived: task.archived,
    created_at: task.createdAt || Date.now(),
    cover: task.cover,
    cover_type: task.coverType,
    cover_value: task.coverValue,
    time_logs: task.timeLogs,
    checklists: task.checklists,
    comments: task.comments,
    history: task.history
  });

  if (error) {
    console.error('Erro ao salvar tarefa:', error);
    return { success: false, error };
  }
  return { success: true };
};

/**
 * Exclui uma tarefa do banco de dados
 */
export const deleteTask = async (id: string) => {
  const { error } = await supabase.from('tasks').delete().eq('id', id);
  if (error) {
    console.error('Erro ao excluir tarefa:', error);
    return { success: false, error };
  }
  return { success: true };
};

/**
 * Busca todos os clientes do banco de dados
 */
export const fetchClients = async () => {
  const { data, error } = await supabase.from('clients').select('id, name, legal_name, document, status, responsible_id, squad_id, monthly_value, is_recurring, level, summary, contract_url, assets_folder_url, contact_info, financial_contact, tags, internal_notes, classification, documentation_links, service_ids, entry_date, contacts, passwords, password_logs, system_accesses');
  if (error) {
    console.error('Erro ao buscar clientes:', error);
    return [];
  }
  return (data || []).map(mapClient);
};

/**
 * Salva ou atualiza um cliente no banco de dados
 */
export const saveClient = async (client: Partial<Client>) => {
  const { error } = await supabase.from('clients').upsert({
    id: client.id || undefined,
    name: client.name,
    legal_name: client.legalName,
    document: client.document,
    status: client.status,
    responsible_id: client.responsibleId,
    squad_id: client.squadId,
    monthly_value: client.monthlyValue,
    is_recurring: client.isRecurring,
    level: client.level,
    summary: client.summary,
    contract_url: client.contractUrl,
    assets_folder_url: client.assetsFolderUrl,
    contact_info: client.contact,
    financial_contact: client.financialContact,
    tags: client.tags,
    internal_notes: client.internalNotes,
    classification: client.classification,
    documentation_links: client.documentationLinks,
    service_ids: client.serviceIds,
    entry_date: client.entryDate,
    contacts: client.contacts,
    passwords: client.passwords,
    password_logs: client.passwordLogs,
    system_accesses: client.systemAccesses,
    updated_at: Date.now()
  });

  if (error) {
    console.error('Erro ao salvar cliente:', error);
    return { success: false, error };
  }
  return { success: true };
};

/**
 * Exclui um cliente do banco de dados
 */
export const deleteClient = async (id: string) => {
  const { error } = await supabase.from('clients').delete().eq('id', id);
  if (error) {
    console.error('Erro ao excluir cliente:', error);
    return { success: false, error };
  }
  return { success: true };
};

/**
 * Busca todos os leads do banco de dados
 */
export const fetchLeads = async () => {
  const { data, error } = await supabase.from('leads').select('id, name, company, value, stage_id, status, email, phone, priority, temperature, responsible_id, notes, tags, created_at, updated_at, last_contact, history, tasks');
  if (error) {
    console.error('Erro ao buscar leads:', error);
    return [];
  }
  return (data || []).map(mapLead);
};

/**
 * Salva ou atualiza um lead no banco de dados
 */
export const saveLead = async (lead: Partial<Lead>) => {
  const { error } = await supabase.from('leads').upsert({
    id: lead.id || undefined,
    name: lead.name,
    company: lead.company,
    value: lead.value,
    stage_id: lead.stageId,
    status: lead.status,
    loss_reason_id: lead.lossReasonId,
    email: lead.email,
    phone: lead.phone,
    priority: lead.priority,
    temperature: lead.temperature,
    responsible_id: lead.responsibleId,
    notes: lead.notes,
    tags: lead.tags,
    source: lead.source,
    rating: lead.rating,
    tasks: lead.tasks,
    history: lead.history,
    last_contact: lead.lastContact,
    created_at: lead.createdAt || Date.now(),
    updated_at: Date.now()
  });

  if (error) {
    console.error('Erro ao salvar lead:', error);
    return { success: false, error };
  }
  return { success: true };
};

/**
 * Exclui um lead do banco de dados
 */
export const deleteLead = async (id: string) => {
  const { error } = await supabase.from('leads').delete().eq('id', id);
  if (error) {
    console.error('Erro ao excluir lead:', error);
    return { success: false, error };
  }
  return { success: true };
};

/**
 * Busca todas as transações financeiras
 */
export const fetchFinancialTransactions = async () => {
  const { data, error } = await supabase.from('financial_transactions').select('id, description, amount, type, date, status, category_id, bank_account_id, client_id, responsible_id, installments, created_at');
  if (error) {
    console.error('Erro ao buscar transações:', error);
    return [];
  }
  return (data || []).map(t => ({
    id: t.id,
    description: t.description,
    amount: t.amount,
    type: t.type,
    date: t.date,
    status: t.status,
    categoryId: t.category_id,
    bankAccountId: t.bank_account_id,
    clientId: t.client_id,
    responsibleId: t.responsible_id,
    installments: t.installments,
    createdAt: t.created_at || Date.now()
  }));
};

/**
 * Salva ou atualiza uma transação financeira
 */
export const saveFinancialTransaction = async (t: Partial<FinancialTransaction>) => {
  const { error } = await supabase.from('financial_transactions').upsert({
    id: t.id || undefined,
    description: t.description,
    amount: t.amount,
    type: t.type,
    date: t.date,
    status: t.status,
    category_id: t.categoryId,
    bank_account_id: t.bankAccountId,
    client_id: t.clientId,
    responsible_id: t.responsibleId,
    installments: t.installments,
    created_at: t.createdAt || Date.now()
  });

  if (error) {
    console.error('Erro ao salvar transação:', error);
    return { success: false, error };
  }
  return { success: true };
};

/**
 * Exclui uma transação financeira
 */
export const deleteFinancialTransaction = async (id: string) => {
  const { error } = await supabase.from('financial_transactions').delete().eq('id', id);
  if (error) {
    console.error('Erro ao excluir transação:', error);
    return { success: false, error };
  }
  return { success: true };
};

/**
 * Busca as configurações do sistema
 */
export const fetchSystemSettings = async () => {
  const { data, error } = await supabase.from('system_settings').select('*').single();
  if (error) {
    if (error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Erro ao buscar configurações:', error);
    }
    return null;
  }
  return mapSettings(data);
};

/**
 * Atualiza as configurações do sistema
 */
export const updateSystemSettings = async (settings: SystemSettings) => {
  const { error } = await supabase.from('system_settings').upsert({
    id: 1, // Usamos ID fixo 1 para as configurações globais
    agency_name: settings.agencyName,
    logo: settings.logo,
    favicon: settings.favicon,
    primary_color: settings.primaryColor,
    sidebar_color: settings.sidebarColor,
    updated_at: Date.now()
  });
  
  if (error) {
    console.error('Erro ao atualizar configurações:', error);
    return { success: false, error };
  }
  return { success: true };
};

/**
 * Busca todas as contas bancárias
 */
export const fetchBankAccounts = async () => {
  const { data, error } = await supabase.from('bank_accounts').select('*');
  if (error) {
    console.error('Erro ao buscar contas:', error);
    return [];
  }
  return (data || []).map(b => ({
    id: b.id,
    name: b.name,
    type: b.type,
    bankName: b.bank_name,
    balance: b.balance,
    color: b.color,
    status: b.status
  }));
};

/**
 * Salva ou atualiza uma conta bancária
 */
export const saveBankAccount = async (account: Partial<BankAccount>) => {
  const { error } = await supabase.from('bank_accounts').upsert({
    id: account.id || undefined,
    name: account.name,
    type: account.type,
    bank_name: account.bankName,
    balance: account.balance,
    color: account.color,
    status: account.status
  });

  if (error) {
    console.error('Erro ao salvar conta:', error);
    return { success: false, error };
  }
  return { success: true };
};

/**
 * Exclui uma conta bancária
 */
export const deleteBankAccount = async (id: string) => {
  const { error } = await supabase.from('bank_accounts').delete().eq('id', id);
  if (error) {
    console.error('Erro ao excluir conta:', error);
    return { success: false, error };
  }
  return { success: true };
};

/**
 * Busca todos os cartões de crédito
 */
export const fetchCreditCards = async () => {
  const { data, error } = await supabase.from('credit_cards').select('*');
  if (error) {
    console.error('Erro ao buscar cartões:', error);
    return [];
  }
  return (data || []).map(c => ({
    id: c.id,
    name: c.name,
    brand: c.brand,
    limit: c.limit,
    availableLimit: c.available_limit,
    closingDay: c.closing_day,
    dueDate: c.due_day,
    color: c.color,
    status: c.status
  }));
};

/**
 * Salva ou atualiza um cartão de crédito
 */
export const saveCreditCard = async (card: Partial<CreditCard>) => {
  const { error } = await supabase.from('credit_cards').upsert({
    id: card.id || undefined,
    name: card.name,
    brand: card.brand,
    limit: card.limit,
    available_limit: card.availableLimit,
    closing_day: card.closingDay,
    due_day: card.dueDate,
    color: card.color,
    status: card.status
  });

  if (error) {
    console.error('Erro ao salvar cartão:', error);
    return { success: false, error };
  }
  return { success: true };
};

/**
 * Exclui um cartão de crédito
 */
export const deleteCreditCard = async (id: string) => {
  const { error } = await supabase.from('credit_cards').delete().eq('id', id);
  if (error) {
    console.error('Erro ao excluir cartão:', error);
    return { success: false, error };
  }
  return { success: true };
};

/**
 * Busca todas as squads do banco de dados
 */
export const fetchSquads = async () => {
  const { data, error } = await supabase.from('squads').select('*');
  if (error) {
    console.error('Erro ao buscar squads:', error);
    return [];
  }
  return (data || []).map(mapSquad);
};

/**
 * Salva ou atualiza uma squad no banco de dados
 */
export const saveSquad = async (squad: Partial<Squad>) => {
  const { error } = await supabase.from('squads').upsert({
    id: squad.id || undefined,
    name: squad.name,
    members: squad.members
  });

  if (error) {
    console.error('Erro ao salvar squad:', error);
    return { success: false, error };
  }
  return { success: true };
};

/**
 * Exclui uma squad do banco de dados
 */
export const deleteSquad = async (id: string) => {
  const { error } = await supabase.from('squads').delete().eq('id', id);
  if (error) {
    console.error('Erro ao excluir squad:', error);
    return { success: false, error };
  }
  return { success: true };
};

/**
 * Salva ou atualiza um usuário no banco de dados
 */
export const saveUser = async (user: Partial<User>) => {
  const { error } = await supabase.from('users').upsert({
    id: user.id || undefined,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    squad_id: user.squad,
    client_id: user.clientId,
    hourly_rate: user.hourlyRate,
    salary: user.salary,
    has_system_access: user.hasSystemAccess,
    password: user.password // Salva a senha (texto plano por enquanto conforme solicitado)
  });

  if (error) {
    console.error('Erro ao salvar usuário:', error);
    return { success: false, error };
  }
  return { success: true };
};

/**
 * Busca todos os itens de estoque
 */
export const fetchStockItems = async () => {
  const { data, error } = await supabase.from('stock_items').select('*');
  if (error) {
    console.error('Erro ao buscar estoque:', error);
    return [];
  }
  return data || [];
};

/**
 * Salva ou atualiza um item de estoque
 */
export const saveStockItem = async (item: Partial<StockItem>) => {
  const { error } = await supabase.from('stock_items').upsert({
    id: item.id || undefined,
    name: item.name,
    category: item.category,
    quantity: item.quantity,
    min_quantity: item.minQuantity,
    unit: item.unit,
    price: item.price,
    supplier_id: item.supplierId,
    last_restock: item.lastRestock,
    location: item.location
  });

  if (error) {
    console.error('Erro ao salvar item de estoque:', error);
    return { success: false, error };
  }
  return { success: true };
};

/**
 * Exclui um item de estoque
 */
export const deleteStockItem = async (id: string) => {
  const { error } = await supabase.from('stock_items').delete().eq('id', id);
  if (error) {
    console.error('Erro ao excluir item de estoque:', error);
    return { success: false, error };
  }
  return { success: true };
};

/**
 * Busca todos os ativos
 */
export const fetchAssets = async () => {
  const { data, error } = await supabase.from('assets').select('*');
  if (error) {
    console.error('Erro ao buscar ativos:', error);
    return [];
  }
  return (data || []).map(a => ({
    id: a.id,
    name: a.name,
    category: a.category,
    purchaseDate: a.purchase_date,
    purchaseValue: a.purchase_value,
    currentValue: a.current_value,
    status: a.status,
    location: a.location,
    responsibleId: a.responsible_id,
    serialNumber: a.serial_number,
    description: a.description
  }));
};

/**
 * Salva ou atualiza um ativo
 */
export const saveAsset = async (asset: Partial<Asset>) => {
  const { error } = await supabase.from('assets').upsert({
    id: asset.id || undefined,
    name: asset.name,
    category: asset.category,
    purchase_date: asset.purchaseDate,
    purchase_value: asset.purchaseValue,
    current_value: asset.currentValue,
    status: asset.status,
    location: asset.location,
    responsible_id: asset.responsibleId,
    serial_number: asset.serialNumber,
    description: asset.description
  });

  if (error) {
    console.error('Erro ao salvar ativo:', error);
    return { success: false, error };
  }
  return { success: true };
};

/**
 * Exclui um ativo
 */
export const deleteAsset = async (id: string) => {
  const { error } = await supabase.from('assets').delete().eq('id', id);
  if (error) {
    console.error('Erro ao excluir ativo:', error);
    return { success: false, error };
  }
  return { success: true };
};

/**
 * Busca todas as sessões de caixa
 */
export const fetchCashSessions = async () => {
  const { data, error } = await supabase.from('cash_register_sessions').select('*');
  if (error) {
    console.error('Erro ao buscar sessões de caixa:', error);
    return [];
  }
  return (data || []).map(s => ({
    id: s.id,
    openedAt: s.opened_at,
    closedAt: s.closed_at,
    openedBy: s.opened_by,
    closedBy: s.closed_by,
    initialAmount: s.initial_amount,
    finalAmount: s.final_amount,
    expectedAmount: s.expected_amount,
    status: s.status,
    notes: s.notes
  }));
};

/**
 * Salva ou atualiza uma sessão de caixa
 */
export const saveCashSession = async (session: Partial<CashRegisterSession>) => {
  const { error } = await supabase.from('cash_register_sessions').upsert({
    id: session.id || undefined,
    opened_at: session.openedAt,
    closed_at: session.closedAt,
    opened_by: session.openedBy,
    closed_by: session.closedBy,
    initial_amount: session.initialAmount,
    final_amount: session.finalAmount,
    expected_amount: session.expectedAmount,
    status: session.status,
    notes: session.notes
  });

  if (error) {
    console.error('Erro ao salvar sessão de caixa:', error);
    return { success: false, error };
  }
  return { success: true };
};

/**
 * Busca todos os movimentos de caixa
 */
export const fetchCashMovements = async () => {
  const { data, error } = await supabase.from('cash_movements').select('*');
  if (error) {
    console.error('Erro ao buscar movimentos de caixa:', error);
    return [];
  }
  return (data || []).map(m => ({
    id: m.id,
    sessionId: m.session_id,
    type: m.type,
    amount: m.amount,
    description: m.description,
    timestamp: m.timestamp,
    category: m.category
  }));
};

/**
 * Salva ou atualiza um movimento de caixa
 */
export const saveCashMovement = async (movement: Partial<CashMovement>) => {
  const { error } = await supabase.from('cash_movements').upsert({
    id: movement.id || undefined,
    session_id: movement.sessionId,
    type: movement.type,
    amount: movement.amount,
    description: movement.description,
    timestamp: movement.timestamp,
    category: movement.category
  });

  if (error) {
    console.error('Erro ao salvar movimento de caixa:', error);
    return { success: false, error };
  }
  return { success: true };
};

/**
 * Busca todas as requisições
 */
export const fetchRequisitions = async () => {
  const { data, error } = await supabase.from('requisitions').select('id, client_id, requester_id, title, description, estimated_cost, status, date, category, approved_by, approved_at, rejected_by, rejected_at, rejected_reason');
  if (error) {
    console.error('Erro ao buscar requisições:', error);
    return [];
  }
  return (data || []).map(r => ({
    id: r.id,
    clientId: r.client_id,
    requesterId: r.requester_id,
    title: r.title,
    description: r.description,
    estimatedCost: r.estimated_cost,
    status: r.status,
    date: r.date,
    category: r.category,
    approvedBy: r.approved_by,
    approvedAt: r.approved_at,
    rejectedBy: r.rejected_by,
    rejectedAt: r.rejected_at,
    rejectedReason: r.rejected_reason
  }));
};

/**
 * Salva ou atualiza uma requisição
 */
export const saveRequisition = async (req: Partial<Requisition>) => {
  const { error } = await supabase.from('requisitions').upsert({
    id: req.id || undefined,
    client_id: req.clientId,
    requester_id: req.requesterId,
    title: req.title,
    description: req.description,
    estimated_cost: req.estimatedCost,
    status: req.status,
    date: req.date,
    category: req.category,
    approved_by: req.approvedBy,
    approved_at: req.approvedAt,
    rejected_by: req.rejectedBy,
    rejected_at: req.rejectedAt,
    rejected_reason: req.rejectedReason,
    archived: req.archived || false,
    attachments: req.attachments || []
  });

  if (error) {
    console.error('Erro ao salvar requisição:', error);
    return { success: false, error };
  }
  return { success: true };
};

/**
 * Exclui uma requisição
 */
export const deleteRequisition = async (id: string) => {
  const { error } = await supabase.from('requisitions').delete().eq('id', id);
  if (error) {
    console.error('Erro ao excluir requisição:', error);
    return { success: false, error };
  }
  return { success: true };
};

/**
 * Arquiva uma requisição
 */
export const archiveRequisition = async (id: string) => {
  const { error } = await supabase.from('requisitions').update({ archived: true }).eq('id', id);
  if (error) {
    console.error('Erro ao arquivar requisição:', error);
    return { success: false, error };
  }
  return { success: true };
};

/**
 * Limpa itens de aprovação finalizados há mais de 7 dias
 */
export const cleanupExpiredApprovalItems = async () => {
  const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
  
  const { data: batches, error: batchError } = await supabase
    .from('approval_batches')
    .select('id, items')
    .eq('status', 'COMPLETED')
    .lt('updated_at', sevenDaysAgo);

  if (batchError) {
    console.error('Erro ao buscar lotes expirados:', batchError);
    return;
  }

  for (const batch of (batches || [])) {
    const updatedItems = batch.items.map((item: any) => ({
      ...item,
      files: [], 
      expired: true
    }));

    await supabase
      .from('approval_batches')
      .update({ items: updatedItems })
      .eq('id', batch.id);
  }
};

/**
 * Mapeia um serviço da agência do Supabase para o formato do App
 */
const mapAgencyService = (s: any): AgencyService => ({
  id: s.id,
  name: s.name,
  description: s.description || '',
  type: s.type || 'RECURRENT',
  category: s.category || '',
  status: s.status || 'ACTIVE',
  basePrice: s.base_price || 0,
  deliveries: s.deliveries || [],
  taskTemplates: s.task_templates || [],
  tags: s.tags || [],
  observations: s.observations || ''
});

/**
 * Busca todos os serviços da agência
 */
export const fetchAgencyServices = async () => {
  const { data, error } = await supabase.from('agency_services').select('*');
  if (error) {
    console.error('Erro ao buscar serviços:', error);
    return [];
  }
  return (data || []).map(mapAgencyService);
};

/**
 * Salva ou atualiza um serviço da agência
 */
export const saveAgencyService = async (service: Partial<AgencyService>) => {
  const { error } = await supabase.from('agency_services').upsert({
    id: service.id || undefined,
    name: service.name,
    description: service.description,
    type: service.type,
    category: service.category,
    status: service.status,
    base_price: service.basePrice,
    deliveries: service.deliveries,
    task_templates: service.taskTemplates,
    tags: service.tags,
    observations: service.observations,
    updated_at: Date.now()
  });

  if (error) {
    console.error('Erro ao salvar serviço:', error);
    return { success: false, error };
  }
  return { success: true };
};

/**
 * Busca todas as notificações
 */
export const fetchNotifications = async () => {
  const { data, error } = await supabase.from('notifications').select('id, title, message, type, priority, status, origin_module, timestamp, target_user_id, target_role, nav_to_view, action_label, metadata');
  if (error) {
    console.error('Erro ao buscar notificações:', error);
    return [];
  }
  return (data || []).map(n => ({
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type,
    priority: n.priority,
    status: n.status,
    originModule: n.origin_module,
    timestamp: n.timestamp,
    targetUserId: n.target_user_id,
    targetRole: n.target_role,
    navToView: n.nav_to_view,
    actionLabel: n.action_label,
    metadata: n.metadata
  }));
};

/**
 * Salva ou atualiza uma notificação
 */
export const saveNotification = async (notif: Notification) => {
  const { error } = await supabase.from('notifications').upsert({
    id: notif.id,
    title: notif.title,
    message: notif.message,
    type: notif.type,
    priority: notif.priority,
    status: notif.status,
    origin_module: notif.originModule,
    timestamp: notif.timestamp,
    target_user_id: notif.targetUserId,
    target_role: notif.targetRole,
    nav_to_view: notif.navToView,
    action_label: notif.actionLabel,
    metadata: notif.metadata
  });

  if (error) {
    console.error('Erro ao salvar notificação:', error);
    return { success: false, error };
  }
  return { success: true };
};

/**
 * Busca todos os lotes de aprovação
 */
export const fetchApprovalBatches = async () => {
  const { data, error } = await supabase.from('approval_batches').select('id, title, client_id, status, items, created_at, updated_at, archived');
  if (error) {
    console.error('Erro ao buscar lotes de aprovação:', error);
    return [];
  }
  return (data || []).map(b => ({
    id: b.id,
    title: b.title,
    clientId: b.client_id,
    status: b.status,
    items: b.items,
    createdAt: b.created_at,
    updatedAt: b.updated_at,
    archived: b.archived || false
  }));
};

/**
 * Salva ou atualiza um lote de aprovação
 */
export const saveApprovalBatch = async (batch: Partial<ApprovalBatch>) => {
  if (!batch.id) {
    console.error('Tentativa de salvar lote sem ID');
    return { success: false, error: 'ID is required' };
  }

  const dataToSave: any = {
    id: batch.id,
    updated_at: Date.now()
  };

  if (batch.title !== undefined) dataToSave.title = batch.title;
  if (batch.clientId !== undefined) dataToSave.client_id = batch.clientId;
  if (batch.status !== undefined) dataToSave.status = batch.status;
  if (batch.items !== undefined) dataToSave.items = batch.items;
  if (batch.archived !== undefined) dataToSave.archived = batch.archived;
  if (batch.createdAt) dataToSave.created_at = batch.createdAt;

  const { error } = await supabase.from('approval_batches').upsert(dataToSave);

  if (error) {
    console.error('Erro ao salvar lote de aprovação:', error);
    return { success: false, error };
  }
  return { success: true };
};

/**
 * Atualiza apenas o status de um lote de aprovação (evita timeout com JSON grande)
 */
export const updateApprovalBatchStatus = async (id: string, status: ApprovalStatus) => {
  const { error } = await supabase
    .from('approval_batches')
    .update({ status, updated_at: Date.now() })
    .eq('id', id);

  if (error) {
    console.error('Erro ao atualizar status do lote:', error);
    return { success: false, error };
  }
  return { success: true };
};

/**
 * Adiciona um item a um lote existente (tenta otimizar se possível, mas por enquanto apenas encapsula)
 */
export const addApprovalItemToBatch = async (batchId: string, items: ApprovalItem[]) => {
  const { error } = await supabase
    .from('approval_batches')
    .update({ items, updated_at: Date.now() })
    .eq('id', batchId);

  if (error) {
    console.error('Erro ao adicionar item ao lote:', error);
    return { success: false, error };
  }
  return { success: true };
};

/**
 * Exclui permanentemente um lote de aprovação
 */
export const deleteApprovalBatch = async (id: string) => {
  const { error } = await supabase
    .from('approval_batches')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Erro ao excluir lote de aprovação:', error);
    return { success: false, error };
  }
  return { success: true };
};

/**
 * Busca todas as metas de produtividade
 */
export const fetchGoals = async () => {
  const { data, error } = await supabase.from('productivity_goals').select('id, title, type, period, target_value, squad_id, user_id, month, created_at');
  if (error) {
    console.error('Erro ao buscar metas:', error);
    return [];
  }
  return (data || []).map(g => ({
    id: g.id,
    title: g.title,
    type: g.type,
    period: g.period,
    targetValue: g.target_value,
    squadId: g.squad_id,
    userId: g.user_id,
    month: g.month,
    createdAt: g.created_at
  }));
};

/**
 * Salva ou atualiza uma meta de produtividade
 */
export const saveProductivityGoal = async (goal: Partial<ProductivityGoal>) => {
  const { error } = await supabase.from('productivity_goals').upsert({
    id: goal.id || undefined,
    title: goal.title,
    type: goal.type,
    period: goal.period,
    target_value: goal.targetValue,
    squad_id: goal.squadId,
    user_id: goal.userId,
    month: goal.month,
    created_at: goal.createdAt || Date.now()
  });

  if (error) {
    console.error('Erro ao salvar meta:', error);
    return { success: false, error };
  }
  return { success: true };
};

/**
 * Exclui um usuário do banco de dados
 */
export const deleteUser = async (id: string) => {
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) {
    console.error('Erro ao excluir usuário:', error);
    return { success: false, error };
  }
  return { success: true };
};

/**
 * Exclui um serviço da agência
 */
export const deleteAgencyService = async (id: string) => {
  const { error } = await supabase.from('agency_services').delete().eq('id', id);
  if (error) {
    console.error('Erro ao excluir serviço:', error);
    return { success: false, error };
  }
  return { success: true };
};

/**
 * Busca as permissões de papéis
 */
export const fetchRolePermissions = async () => {
  const { data, error } = await supabase.from('role_permissions').select('*').single();
  if (error) {
    if (error.code !== 'PGRST116') {
      console.error('Erro ao buscar permissões:', error);
    }
    return null;
  }
  return data.permissions as RolePermissions;
};

/**
 * Salva as permissões de papéis
 */
export const saveRolePermissions = async (permissions: RolePermissions) => {
  const { error } = await supabase.from('role_permissions').upsert({
    id: 1, // ID fixo para permissões globais
    permissions,
    updated_at: Date.now()
  });

  if (error) {
    console.error('Erro ao salvar permissões:', error);
    return { success: false, error };
  }
  return { success: true };
};

/**
 * Limpa todos os dados de teste do banco de dados, mantendo apenas os usuários.
 */
export const clearDatabase = async () => {
  try {
    console.log('Limpando dados de teste do Supabase...');
    
    // Ordem importa devido às chaves estrangeiras
    await supabase.from('tasks').delete().neq('id', '0');
    await supabase.from('financial_transactions').delete().neq('id', '0');
    await supabase.from('leads').delete().neq('id', '0');
    await supabase.from('clients').delete().neq('id', '0');
    await supabase.from('bank_accounts').delete().neq('id', '0');
    await supabase.from('credit_cards').delete().neq('id', '0');
    await supabase.from('squads').delete().neq('id', '0');
    await supabase.from('notifications').delete().neq('id', '0');
    await supabase.from('approval_batches').delete().neq('id', '0');
    await supabase.from('productivity_goals').delete().neq('id', '0');
    
    // Para usuários, mantemos apenas o seu admin
    await supabase.from('users').delete().neq('email', 'eric.muriel@gmail.com');

    console.log('Banco de dados limpo com sucesso!');
    return { success: true };
  } catch (err) {
    console.error('Erro ao limpar banco:', err);
    return { success: false, error: err };
  }
};

/**
 * Função para migrar os dados iniciais (Mock) para o Supabase.
 * Útil para o primeiro setup.
 */
export const seedDatabase = async () => {
  try {
    console.log('Iniciando migração de dados mock para Supabase...');

    // 1. Migrar Squads
    const { error: squadError } = await supabase.from('squads').upsert(
      initialSquads.map(s => ({ id: s.id, name: s.name, members: s.members }))
    );
    if (squadError) console.error('Erro ao migrar Squads:', squadError);

    // 2. Migrar Usuários
    const { error: userError } = await supabase.from('users').upsert(
      initialUsers.map(u => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        avatar: u.avatar,
        squad_id: u.squad,
        client_id: u.clientId,
        hourly_rate: u.hourlyRate,
        salary: u.salary,
        has_system_access: u.hasSystemAccess,
        password: u.password, // Adicionado para permitir autenticação
        preferences: u.preferences
      }))
    );
    if (userError) console.error('Erro ao migrar Usuários:', userError);

    // 3. Migrar Clientes
    const { error: clientError } = await supabase.from('clients').upsert(
      initialClients.map(c => ({
        id: c.id,
        name: c.name,
        legal_name: c.legalName,
        document: c.document,
        status: c.status,
        responsible_id: c.responsibleId,
        squad_id: c.squadId,
        monthly_value: c.monthlyValue,
        is_recurring: c.isRecurring,
        level: c.level,
        summary: c.summary,
        contract_url: c.contractUrl,
        assets_folder_url: c.assetsFolderUrl,
        contact_info: c.contact,
        financial_contact: c.financialContact,
        tags: c.tags,
        internal_notes: c.internalNotes
      }))
    );
    if (clientError) console.error('Erro ao migrar Clientes:', clientError);

    // 4. Migrar Tarefas
    const { error: taskError } = await supabase.from('tasks').upsert(
      initialTasks.map(t => ({
        id: t.id,
        client_id: t.clientId,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        due_date: t.dueDate ? new Date(t.dueDate).toISOString() : null,
        estimated_time: t.estimatedTime,
        assignee_ids: t.assigneeIds,
        squad_id: t.squadId,
        is_tracking: t.isTracking,
        approval_status: t.approvalStatus,
        archived: t.archived,
        created_at: t.createdAt,
        cover: t.cover
      }))
    );
    if (taskError) console.error('Erro ao migrar Tarefas:', taskError);

    // 5. Migrar Leads
    const { error: leadError } = await supabase.from('leads').upsert(
      initialLeads.map(l => ({
        id: l.id,
        name: l.name,
        company: l.company,
        value: l.value,
        stage_id: l.stageId,
        status: l.status,
        email: l.email,
        phone: l.phone,
        priority: l.priority,
        temperature: l.temperature,
        responsible_id: l.responsibleId,
        notes: l.notes,
        tags: l.tags,
        created_at: l.createdAt,
        updated_at: l.updatedAt
      }))
    );
    if (leadError) console.error('Erro ao migrar Leads:', leadError);

    // 6. Migrar Cartões
    const { error: cardError } = await supabase.from('credit_cards').upsert(
      initialCreditCards.map(c => ({
        id: c.id,
        name: c.name,
        brand: c.brand,
        limit: c.limit,
        available_limit: c.availableLimit,
        closing_day: c.closingDay,
        due_day: c.dueDate,
        color: c.color,
        status: c.status
      }))
    );
    if (cardError) console.error('Erro ao migrar Cartões:', cardError);

    // 7. Migrar Notificações
    const { error: notifError } = await supabase.from('notifications').upsert(
      initialNotifications.map(n => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        priority: n.priority,
        status: n.status,
        origin_module: n.originModule,
        timestamp: n.timestamp,
        target_user_id: n.targetUserId,
        target_role: n.targetRole,
        nav_to_view: n.navToView,
        action_label: n.actionLabel,
        metadata: n.metadata
      }))
    );
    if (notifError) console.error('Erro ao migrar Notificações:', notifError);

    // 8. Migrar Lotes de Aprovação
    const { error: batchError } = await supabase.from('approval_batches').upsert(
      initialApprovalBatches.map(b => ({
        id: b.id,
        title: b.title,
        client_id: b.clientId,
        status: b.status,
        items: b.items,
        created_at: b.createdAt,
        updated_at: b.updatedAt,
        archived: b.archived || false
      }))
    );
    if (batchError) console.error('Erro ao migrar Lotes de Aprovação:', batchError);

    console.log('Migração concluída com sucesso!');
    return { success: true };
  } catch (err) {
    console.error('Erro crítico na migração:', err);
    return { success: false, error: err };
  }
};
