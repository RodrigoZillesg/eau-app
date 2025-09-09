-- =====================================================
-- GARANTIR EXCLUSÕES EM CASCATA PARA LIMPEZA DE DADOS
-- =====================================================

-- 1. Verificar e adicionar CASCADE DELETE para CPD Activities
ALTER TABLE cpd_activities
DROP CONSTRAINT IF EXISTS cpd_activities_member_id_fkey;

ALTER TABLE cpd_activities
ADD CONSTRAINT cpd_activities_member_id_fkey 
FOREIGN KEY (member_id) 
REFERENCES members(id) 
ON DELETE CASCADE;

-- 2. Verificar e adicionar CASCADE DELETE para Member Roles
ALTER TABLE member_roles
DROP CONSTRAINT IF EXISTS member_roles_member_id_fkey;

ALTER TABLE member_roles
ADD CONSTRAINT member_roles_member_id_fkey 
FOREIGN KEY (member_id) 
REFERENCES members(id) 
ON DELETE CASCADE;

-- 3. Verificar e adicionar CASCADE DELETE para Member Duplicates
ALTER TABLE member_duplicates
DROP CONSTRAINT IF EXISTS member_duplicates_member1_id_fkey;

ALTER TABLE member_duplicates
ADD CONSTRAINT member_duplicates_member1_id_fkey 
FOREIGN KEY (member1_id) 
REFERENCES members(id) 
ON DELETE CASCADE;

ALTER TABLE member_duplicates
DROP CONSTRAINT IF EXISTS member_duplicates_member2_id_fkey;

ALTER TABLE member_duplicates
ADD CONSTRAINT member_duplicates_member2_id_fkey 
FOREIGN KEY (member2_id) 
REFERENCES members(id) 
ON DELETE CASCADE;

-- 4. Verificar e adicionar CASCADE DELETE para Member Merge History
ALTER TABLE member_merge_history
DROP CONSTRAINT IF EXISTS member_merge_history_kept_member_id_fkey;

ALTER TABLE member_merge_history
ADD CONSTRAINT member_merge_history_kept_member_id_fkey 
FOREIGN KEY (kept_member_id) 
REFERENCES members(id) 
ON DELETE SET NULL; -- SET NULL porque queremos manter o histórico

-- 5. Event Registrations - precisa ser baseado em user_id, não member_id
-- Não mexemos aqui porque já está configurado corretamente

-- 6. Criar função para limpar dados órfãos
CREATE OR REPLACE FUNCTION clean_orphaned_data()
RETURNS void AS $$
BEGIN
    -- Limpar atividades CPD sem membros
    DELETE FROM cpd_activities 
    WHERE member_id IS NULL 
    OR member_id NOT IN (SELECT id FROM members);
    
    -- Limpar duplicatas órfãs
    DELETE FROM member_duplicates 
    WHERE member1_id NOT IN (SELECT id FROM members)
    OR member2_id NOT IN (SELECT id FROM members);
    
    -- Limpar roles órfãos
    DELETE FROM member_roles 
    WHERE member_id NOT IN (SELECT id FROM members);
    
    RAISE NOTICE 'Orphaned data cleaned successfully';
END;
$$ LANGUAGE plpgsql;

-- 7. Criar função auxiliar para exclusão em massa (com proteção para usuário atual)
CREATE OR REPLACE FUNCTION bulk_delete_members(
    member_ids UUID[],
    current_user_member_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Remove o ID do usuário atual da lista para prevenir auto-exclusão
    member_ids := array_remove(member_ids, current_user_member_id);
    
    -- Deletar membros (cascade cuidará dos relacionamentos)
    DELETE FROM members 
    WHERE id = ANY(member_ids)
    AND id != current_user_member_id; -- Proteção extra
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 8. Criar função para limpar TODOS os membros exceto o atual
CREATE OR REPLACE FUNCTION delete_all_members_except(
    current_user_member_id UUID
)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Deletar todos os membros exceto o do usuário atual
    DELETE FROM members 
    WHERE id != current_user_member_id;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Limpar event_registrations órfãs (opcional, baseado em user_id)
    DELETE FROM event_registrations 
    WHERE user_id NOT IN (
        SELECT user_id FROM members WHERE user_id IS NOT NULL
    );
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Criar índices para melhorar performance de exclusão
CREATE INDEX IF NOT EXISTS idx_cpd_activities_member_id 
ON cpd_activities(member_id);

CREATE INDEX IF NOT EXISTS idx_member_roles_member_id 
ON member_roles(member_id);

-- 10. Verificar constraints atuais
SELECT 
    tc.table_name, 
    tc.constraint_name, 
    tc.constraint_type,
    rc.update_rule,
    rc.delete_rule
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.referential_constraints rc 
    ON tc.constraint_name = rc.constraint_name
WHERE tc.table_name IN (
    'cpd_activities', 
    'member_roles', 
    'member_duplicates', 
    'member_merge_history'
)
AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name;

-- Mensagem de conclusão
SELECT 'CASCADE DELETE configurado com sucesso! Exclusões em massa agora são seguras.' as message;