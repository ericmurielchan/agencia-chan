-- ==========================================
-- ESTRUTURA DE BANCO DE DADOS - AGÊNCIA CHAN OS
-- ==========================================

-- 1. CONFIGURAÇÕES E CORE
-- ------------------------------------------

CREATE TABLE IF NOT EXISTS public.system_settings (
    id BIGINT PRIMARY KEY DEFAULT 1,
    agency_name TEXT DEFAULT 'Agência Chan',
    logo TEXT,
    favicon TEXT,
    primary_color TEXT DEFAULT '#db2777',
    sidebar_color TEXT DEFAULT '#0f172a',
    updated_at BIGINT DEFAULT extract(epoch from now()) * 1000
);

CREATE TABLE IF NOT EXISTS public.squads (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    members TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL DEFAULT 'EMPLOYEE',
    avatar TEXT,
    squad_id TEXT REFERENCES public.squads(id) ON DELETE SET NULL,
    client_id TEXT,
    hourly_rate NUMERIC DEFAULT 0,
    salary NUMERIC DEFAULT 0,
    has_system_access BOOLEAN DEFAULT FALSE,
    password TEXT,
    preferences JSONB DEFAULT '{"theme": "light", "emailNotifications": true, "systemNotifications": true, "compactMode": false}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role TEXT NOT NULL,
    module TEXT NOT NULL,
    can_read BOOLEAN DEFAULT FALSE,
    can_write BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    UNIQUE(role, module)
);

-- 2. CRM
-- ------------------------------------------

CREATE TABLE IF NOT EXISTS public.pipeline_stages (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    color TEXT,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.loss_reasons (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS public.clients (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    legal_name TEXT,
    document TEXT,
    status TEXT DEFAULT 'ACTIVE',
    responsible_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    squad_id TEXT REFERENCES public.squads(id) ON DELETE SET NULL,
    monthly_value NUMERIC DEFAULT 0,
    is_recurring BOOLEAN DEFAULT FALSE,
    level TEXT DEFAULT 'BASIC',
    summary TEXT,
    contract_url TEXT,
    assets_folder_url TEXT,
    contact_info JSONB,
    financial_contact JSONB,
    tags TEXT[] DEFAULT '{}',
    internal_notes TEXT,
    classification TEXT,
    documentation_links TEXT[] DEFAULT '{}',
    service_ids TEXT[] DEFAULT '{}',
    entry_date DATE,
    contacts JSONB DEFAULT '[]'::jsonb,
    passwords JSONB DEFAULT '[]'::jsonb,
    password_logs JSONB DEFAULT '[]'::jsonb,
    system_accesses JSONB DEFAULT '[]'::jsonb,
    updated_at BIGINT DEFAULT extract(epoch from now()) * 1000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.leads (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    company TEXT,
    value NUMERIC DEFAULT 0,
    stage_id TEXT REFERENCES public.pipeline_stages(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'OPEN',
    loss_reason_id TEXT REFERENCES public.loss_reasons(id) ON DELETE SET NULL,
    email TEXT,
    phone TEXT,
    priority TEXT DEFAULT 'MEDIUM',
    temperature TEXT DEFAULT 'WARM',
    responsible_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    source TEXT,
    rating INTEGER DEFAULT 0,
    tasks JSONB DEFAULT '[]'::jsonb,
    history JSONB DEFAULT '[]'::jsonb,
    last_contact TIMESTAMP WITH TIME ZONE,
    created_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    created_at BIGINT DEFAULT extract(epoch from now()) * 1000,
    updated_at BIGINT DEFAULT extract(epoch from now()) * 1000
);

-- 3. PRODUÇÃO
-- ------------------------------------------

CREATE TABLE IF NOT EXISTS public.tasks (
    id TEXT PRIMARY KEY,
    client_id TEXT REFERENCES public.clients(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'TODO',
    priority TEXT DEFAULT 'MEDIUM',
    due_date TIMESTAMP WITH TIME ZONE,
    estimated_time NUMERIC DEFAULT 0,
    assignee_ids TEXT[] DEFAULT '{}',
    squad_id TEXT REFERENCES public.squads(id) ON DELETE SET NULL,
    is_tracking BOOLEAN DEFAULT FALSE,
    approval_status TEXT DEFAULT 'PENDING',
    archived BOOLEAN DEFAULT FALSE,
    cover JSONB,
    cover_type TEXT,
    cover_value TEXT,
    time_logs JSONB DEFAULT '[]'::jsonb,
    checklists JSONB DEFAULT '[]'::jsonb,
    comments JSONB DEFAULT '[]'::jsonb,
    history JSONB DEFAULT '[]'::jsonb,
    created_at BIGINT DEFAULT extract(epoch from now()) * 1000
);

CREATE TABLE IF NOT EXISTS public.agency_services (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    type TEXT DEFAULT 'RECURRENT',
    category TEXT,
    status TEXT DEFAULT 'ACTIVE',
    base_price NUMERIC DEFAULT 0,
    deliveries JSONB DEFAULT '[]'::jsonb,
    task_templates JSONB DEFAULT '[]'::jsonb,
    tags TEXT[] DEFAULT '{}',
    observations TEXT,
    updated_at BIGINT DEFAULT extract(epoch from now()) * 1000
);

-- 4. FINANCEIRO
-- ------------------------------------------

CREATE TABLE IF NOT EXISTS public.financial_categories (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- INCOME, EXPENSE, BOTH
    color TEXT
);

CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    bank_name TEXT,
    balance NUMERIC DEFAULT 0,
    color TEXT,
    status TEXT DEFAULT 'ACTIVE'
);

CREATE TABLE IF NOT EXISTS public.credit_cards (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    brand TEXT,
    credit_limit NUMERIC DEFAULT 0,
    available_limit NUMERIC DEFAULT 0,
    closing_day INTEGER,
    due_day INTEGER,
    color TEXT,
    status TEXT DEFAULT 'ACTIVE'
);

CREATE TABLE IF NOT EXISTS public.card_invoices (
    id TEXT PRIMARY KEY,
    credit_card_id TEXT REFERENCES public.credit_cards(id) ON DELETE CASCADE,
    month TEXT NOT NULL, -- YYYY-MM
    amount NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'OPEN',
    due_date DATE
);

CREATE TABLE IF NOT EXISTS public.financial_transactions (
    id TEXT PRIMARY KEY,
    description TEXT NOT NULL,
    amount NUMERIC NOT NULL,
    type TEXT NOT NULL, -- INCOME, EXPENSE
    date DATE NOT NULL,
    status TEXT DEFAULT 'PAID',
    category_id TEXT REFERENCES public.financial_categories(id) ON DELETE SET NULL,
    bank_account_id TEXT REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
    credit_card_id TEXT REFERENCES public.credit_cards(id) ON DELETE SET NULL,
    client_id TEXT REFERENCES public.clients(id) ON DELETE SET NULL,
    responsible_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    installments JSONB,
    created_at BIGINT DEFAULT extract(epoch from now()) * 1000
);

-- 5. OPERAÇÕES
-- ------------------------------------------

CREATE TABLE IF NOT EXISTS public.requisitions (
    id TEXT PRIMARY KEY,
    client_id TEXT REFERENCES public.clients(id) ON DELETE SET NULL,
    requester_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    estimated_cost NUMERIC DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'PENDING',
    date DATE,
    category TEXT,
    approved_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    rejected_at TIMESTAMP WITH TIME ZONE,
    rejected_reason TEXT,
    archived BOOLEAN DEFAULT FALSE,
    attachments TEXT[] DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS public.stock_items (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    quantity NUMERIC DEFAULT 0,
    min_quantity NUMERIC DEFAULT 0,
    unit TEXT,
    price NUMERIC DEFAULT 0,
    supplier_id TEXT,
    last_restock TIMESTAMP WITH TIME ZONE,
    location TEXT
);

CREATE TABLE IF NOT EXISTS public.assets (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    purchase_date DATE,
    purchase_value NUMERIC DEFAULT 0,
    current_value NUMERIC DEFAULT 0,
    status TEXT DEFAULT 'ACTIVE',
    location TEXT,
    responsible_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    serial_number TEXT,
    description TEXT
);

CREATE TABLE IF NOT EXISTS public.cash_register_sessions (
    id TEXT PRIMARY KEY,
    opened_at TIMESTAMP WITH TIME ZONE NOT NULL,
    closed_at TIMESTAMP WITH TIME ZONE,
    opened_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    closed_by TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    initial_amount NUMERIC DEFAULT 0,
    final_amount NUMERIC,
    expected_amount NUMERIC,
    status TEXT DEFAULT 'OPEN',
    notes TEXT
);

CREATE TABLE IF NOT EXISTS public.cash_movements (
    id TEXT PRIMARY KEY,
    session_id TEXT REFERENCES public.cash_register_sessions(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- IN, OUT
    amount NUMERIC NOT NULL,
    description TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
    category TEXT
);

-- 6. APROVAÇÕES E ENGAJAMENTO
-- ------------------------------------------

CREATE TABLE IF NOT EXISTS public.approval_batches (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    client_id TEXT REFERENCES public.clients(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'OPEN',
    items JSONB DEFAULT '[]'::jsonb, -- Compatibilidade
    created_at BIGINT DEFAULT extract(epoch from now()) * 1000,
    updated_at BIGINT DEFAULT extract(epoch from now()) * 1000,
    archived BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.approval_items (
    id TEXT PRIMARY KEY,
    batch_id TEXT REFERENCES public.approval_batches(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    category TEXT,
    status TEXT DEFAULT 'PENDING',
    files TEXT[] DEFAULT '{}',
    caption TEXT,
    created_at BIGINT DEFAULT extract(epoch from now()) * 1000,
    updated_at BIGINT DEFAULT extract(epoch from now()) * 1000
);

CREATE TABLE IF NOT EXISTS public.approval_comments (
    id TEXT PRIMARY KEY,
    item_id TEXT REFERENCES public.approval_items(id) ON DELETE CASCADE,
    user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    text TEXT NOT NULL,
    timestamp BIGINT DEFAULT extract(epoch from now()) * 1000,
    page_number INTEGER
);

CREATE TABLE IF NOT EXISTS public.productivity_goals (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    period TEXT DEFAULT 'MONTHLY',
    target_value NUMERIC DEFAULT 0,
    squad_id TEXT REFERENCES public.squads(id) ON DELETE SET NULL,
    user_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
    month TEXT NOT NULL, -- YYYY-MM
    created_at BIGINT DEFAULT extract(epoch from now()) * 1000
);

CREATE TABLE IF NOT EXISTS public.notifications (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    message TEXT,
    type TEXT DEFAULT 'INFO',
    priority TEXT DEFAULT 'LOW',
    status TEXT DEFAULT 'UNREAD',
    origin_module TEXT,
    timestamp BIGINT DEFAULT extract(epoch from now()) * 1000,
    target_user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    target_role TEXT,
    nav_to_view TEXT,
    action_label TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- ==========================================
-- REPARO DE ESTRUTURA (EXECUTE SE TIVER ERROS)
-- ==========================================

DO $$ 
BEGIN
    -- Adicionar page_number em approval_comments se missing
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'approval_comments') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'approval_comments' AND column_name = 'page_number') THEN
            ALTER TABLE public.approval_comments ADD COLUMN page_number INTEGER;
        END IF;
    END IF;

    -- Corrigir coluna 'limit' em credit_cards se existir com nome antigo
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'credit_cards' AND column_name = 'limit') THEN
        ALTER TABLE public.credit_cards RENAME COLUMN "limit" TO credit_limit;
    END IF;
END $$;

-- HABILITAR REALTIME PARA NOTIFICAÇÕES (Ignora erro se já existir)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL;
END $$;
