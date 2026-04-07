import { supabase } from '../lib/supabaseClient';
import { initialUsers, initialTasks, initialClients, initialLeads, initialSquads } from '../utils/mockData';

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
  if (error) console.error('Erro ao buscar usuários:', error);
  return data || [];
};

/**
 * Busca todas as tarefas do banco de dados
 */
export const fetchTasks = async () => {
  const { data, error } = await supabase.from('tasks').select('*');
  if (error) console.error('Erro ao buscar tarefas:', error);
  return data || [];
};

/**
 * Busca todos os clientes do banco de dados
 */
export const fetchClients = async () => {
  const { data, error } = await supabase.from('clients').select('*');
  if (error) console.error('Erro ao buscar clientes:', error);
  return data || [];
};

/**
 * Busca todos os leads do banco de dados
 */
export const fetchLeads = async () => {
  const { data, error } = await supabase.from('leads').select('*');
  if (error) console.error('Erro ao buscar leads:', error);
  return data || [];
};

/**
 * Busca todas as transações financeiras
 */
export const fetchFinancialTransactions = async () => {
  const { data, error } = await supabase.from('financial_transactions').select('*');
  if (error) console.error('Erro ao buscar transações:', error);
  return data || [];
};

/**
 * Busca todas as contas bancárias
 */
export const fetchBankAccounts = async () => {
  const { data, error } = await supabase.from('bank_accounts').select('*');
  if (error) console.error('Erro ao buscar contas:', error);
  return data || [];
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

    console.log('Migração concluída com sucesso!');
    return { success: true };
  } catch (err) {
    console.error('Erro crítico na migração:', err);
    return { success: false, error: err };
  }
};
