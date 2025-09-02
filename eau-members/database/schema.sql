-- Schema SQL para o sistema de membros da English Australia
-- Execute este script no seu banco Supabase

-- Criação da tabela de membros
CREATE TABLE IF NOT EXISTS public.members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    -- Informações pessoais
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    
    -- Endereço
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Australia',
    
    -- Status de membro
    membership_status VARCHAR(20) DEFAULT 'active' CHECK (membership_status IN ('active', 'inactive', 'suspended', 'expired')),
    membership_type VARCHAR(50) DEFAULT 'standard' CHECK (membership_type IN ('standard', 'premium', 'student', 'corporate')),
    membership_start_date DATE DEFAULT CURRENT_DATE,
    membership_end_date DATE,
    
    -- Informações profissionais
    profession VARCHAR(100),
    experience_years INTEGER,
    qualifications TEXT,
    
    -- Configurações
    receive_newsletters BOOLEAN DEFAULT true,
    receive_event_notifications BOOLEAN DEFAULT true,
    
    -- Campos de auditoria
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Criação da tabela de roles/funções dos membros
CREATE TABLE IF NOT EXISTS public.member_roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('member', 'admin', 'super_admin', 'moderator', 'instructor')),
    
    UNIQUE(member_id, role)
);

-- Criação da tabela de histórico de membros
CREATE TABLE IF NOT EXISTS public.member_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    
    member_id UUID REFERENCES public.members(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    details JSONB,
    performed_by UUID REFERENCES auth.users(id)
);

-- Triggers para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_members_updated_at BEFORE UPDATE ON public.members
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security)
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.member_history ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para membros
CREATE POLICY "Membros podem ver apenas seus próprios dados" ON public.members
    FOR SELECT USING (auth.uid() = created_by OR auth.uid() IN (
        SELECT m.created_by FROM public.members m 
        JOIN public.member_roles mr ON m.id = mr.member_id 
        WHERE mr.role IN ('admin', 'super_admin') AND m.created_by = auth.uid()
    ));

CREATE POLICY "Admins podem ver todos os membros" ON public.members
    FOR SELECT USING (auth.uid() IN (
        SELECT m.created_by FROM public.members m 
        JOIN public.member_roles mr ON m.id = mr.member_id 
        WHERE mr.role IN ('admin', 'super_admin')
    ));

CREATE POLICY "Admins podem inserir membros" ON public.members
    FOR INSERT WITH CHECK (auth.uid() IN (
        SELECT m.created_by FROM public.members m 
        JOIN public.member_roles mr ON m.id = mr.member_id 
        WHERE mr.role IN ('admin', 'super_admin')
    ));

CREATE POLICY "Admins podem atualizar membros" ON public.members
    FOR UPDATE USING (auth.uid() IN (
        SELECT m.created_by FROM public.members m 
        JOIN public.member_roles mr ON m.id = mr.member_id 
        WHERE mr.role IN ('admin', 'super_admin')
    ));

-- Políticas para roles
CREATE POLICY "Admins podem gerenciar roles" ON public.member_roles
    FOR ALL USING (auth.uid() IN (
        SELECT m.created_by FROM public.members m 
        JOIN public.member_roles mr ON m.id = mr.member_id 
        WHERE mr.role IN ('admin', 'super_admin')
    ));

-- Políticas para histórico
CREATE POLICY "Admins podem ver histórico" ON public.member_history
    FOR SELECT USING (auth.uid() IN (
        SELECT m.created_by FROM public.members m 
        JOIN public.member_roles mr ON m.id = mr.member_id 
        WHERE mr.role IN ('admin', 'super_admin')
    ));

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_members_email ON public.members(email);
CREATE INDEX IF NOT EXISTS idx_members_status ON public.members(membership_status);
CREATE INDEX IF NOT EXISTS idx_members_type ON public.members(membership_type);
CREATE INDEX IF NOT EXISTS idx_member_roles_member_id ON public.member_roles(member_id);
CREATE INDEX IF NOT EXISTS idx_member_roles_role ON public.member_roles(role);
CREATE INDEX IF NOT EXISTS idx_member_history_member_id ON public.member_history(member_id);

-- Inserir um admin padrão (opcional - apenas para teste)
-- Você pode executar isso depois de criar um usuário no auth
-- INSERT INTO public.members (first_name, last_name, email, created_by) 
-- VALUES ('Admin', 'User', 'admin@englishaustralia.com.au', (SELECT id FROM auth.users WHERE email = 'admin@englishaustralia.com.au'));

-- INSERT INTO public.member_roles (member_id, role)
-- VALUES ((SELECT id FROM public.members WHERE email = 'admin@englishaustralia.com.au'), 'super_admin');