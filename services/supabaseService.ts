import { supabase } from '../lib/supabaseClient';
import { initialUsers, initialTasks, initialClients, initialLeads, initialSquads, initialCreditCards } from '../utils/mockData';
import { User, Task, Lead, Client, SystemSettings, Squad, CreditCard, BankAccount } from '../types';

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
  const { data, error } = await supabase.from('users').select('*');
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
  const { data, error } = await supabase.from('tasks').select('*');
  if (error) {
    console.error('Erro ao buscar tarefas:', error);
    return [];
  }
  return (data || []).map(mapTask);
};

/**
 * Busca todos os clientes do banco de dados
 */
export const fetchClients = async () => {
  const { data, error } = await supabase.from('clients').select('*');
  if (error) {
    console.error('Erro ao buscar clientes:', error);
    return [];
  }
  return (data || []).map(mapClient);
};

/**
 * Busca todos os leads do banco de dados
 */
export const fetchLeads = async () => {
  const { data, error } = await supabase.from('leads').select('*');
  if (error) {
    console.error('Erro ao buscar leads:', error);
    return [];
  }
  return (data || []).map(mapLead);
};

/**
 * Busca todas as transações financeiras
 */
export const fetchFinancialTransactions = async () => {
  const { data, error } = await supabase.from('financial_transactions').select('*');
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
    creditCardId: t.credit_card_id,
    clientId: t.client_id,
    squadId: t.squad_id,
    responsibleId: t.responsible_id,
    installments: t.installments,
    recurrenceId: t.recurrence_id,
    createdAt: t.created_at || Date.now()
  }));
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
    updated_at: new Date().toISOString()
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

    console.log('Migração concluída com sucesso!');
    return { success: true };
  } catch (err) {
    console.error('Erro crítico na migração:', err);
    return { success: false, error: err };
  }
};
