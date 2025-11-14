# USER TYPE TESTING PLAN - PHASE 5
## Plano de Testes Completo e Sistemático

**Data:** 04/11/2025
**Fase:** 5 de 7 - Complete Testing
**Status:** ⏳ EM EXECUÇÃO

---

## 🎯 OBJETIVO DA FASE 5

Validar que as correções implementadas na Fase 4 funcionam corretamente:
1. ✅ Detecção automática via CSV
2. ✅ Validação de permissões no formulário manual
3. ✅ Logging e debugging
4. ✅ Distribuição correta de user_types

---

## 📊 BASELINE (Estado Antes dos Testes)

### Query Executada:
```sql
SELECT
  user_type,
  COUNT(*) as total,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM members
GROUP BY user_type
ORDER BY total DESC;
```

### Resultado BASELINE:
| User Type | Total | Percentage | Status |
|-----------|-------|------------|--------|
| member | 6,056 | 99.98% | ❌ INCORRETO |
| super_admin | 1 | 0.02% | ✅ OK |
| institution_admin | 0 | 0.00% | ❌ FALTANDO ~129 |
| admin | 0 | 0.00% | ⚠️ Pode ser correto |

**Total de membros:** 6,057

---

## 🧪 SUITE DE TESTES

### TESTE 1: CSV Sample - Detecção de Institution Admins ⚡ PRIORITÁRIO

**Objetivo:** Validar que a nova lógica detecta institution_admins corretamente

**Arquivo:** `import/Members With Membership and Companies - First 50 - MembershipMemberandCompany.csv`

**Pré-requisitos:**
- ✅ CSV file existe
- ✅ Servidor dev rodando (porta 5180)
- ✅ Usuário logado como super_admin (dev@platty.tech)

**Passos:**
1. Navegar para `/admin/import-system`
2. Clicar no input de arquivo
3. Selecionar CSV: "Members With Membership and Companies - First 50..."
4. Aguardar parsing do arquivo
5. Clicar em botão "Import"
6. Observar console logs durante import
7. Aguardar conclusão (progress bar 100%)
8. Verificar summary statistics no console

**Resultado Esperado - Console Logs:**
```
✅ Institution Admin detected: [email] (UserId: [X] matches Primary Contact)
✅ Institution Admin detected: [email] (UserId: [Y] matches Primary Contact)
ℹ️ Member with groups [...]: [email] → user_type: member

📊 IMPORT SUMMARY:
   Institutions: 10-15
   Total Members: 50

   User Type Distribution:
   ✅ Super Admins: 0
   ✅ System Admins: 0
   ✅ Institution Admins: 1-3
   ✅ Members: 47-49
```

**Validação SQL (após import):**
```sql
-- Ver novos membros criados (últimos 50)
SELECT
  email,
  user_type,
  institution_id,
  created_at
FROM members
ORDER BY created_at DESC
LIMIT 50;

-- Contar distribuição dos novos
SELECT
  user_type,
  COUNT(*) as total
FROM members
WHERE created_at > NOW() - INTERVAL '5 minutes'
GROUP BY user_type;
```

**Critérios de Sucesso:**
- [ ] ✅ Console mostra detecção de institution_admins
- [ ] ✅ Pelo menos 1-3 institution_admins criados
- [ ] ✅ 47-49 members criados
- [ ] ✅ Summary statistics correto
- [ ] ✅ Nenhum erro no console
- [ ] ✅ Import completa com sucesso

**Se Falhar:**
- 🔍 Verificar nomes exatos das colunas no CSV
- 🔍 Verificar se campos "User ID" e "Primary Contact's User ID" existem
- 🔍 Adicionar logs extras para debug
- 🔍 Testar com CSV manual de 3-5 linhas

---

### TESTE 2: Validação de Campos CSV

**Objetivo:** Confirmar que CSV tem campos necessários

**Passos:**
1. Abrir CSV no Excel ou editor de texto
2. Verificar header (primeira linha)
3. Confirmar colunas necessárias existem

**Colunas CRÍTICAS:**
- [ ] ✅ "User ID" ou "UserId"
- [ ] ✅ "Primary Contact's User ID" ou variação
- [ ] ✅ "Member Groups"
- [ ] ✅ "Member First Name"
- [ ] ✅ "Member Last Name"
- [ ] ✅ "Member Email Address" ou "Member Email"

**Se Colunas Faltarem:**
- Ajustar mapeamento em CompleteImportPageFixed.tsx linhas 132-134
- Adicionar alternativas de nomes de colunas

---

### TESTE 3: Criar CSV de Teste Controlado

**Objetivo:** Testar com dados conhecidos para validação 100% precisa

**Criar arquivo:** `import/test_user_types_5_records.csv`

**Conteúdo:**
```csv
User ID,Member First Name,Member Last Name,Member Email Address,Member Groups,Primary Contact's User ID,Company Name,Status
90001,Super,Admin,super.test@example.com,"Super Admin,Members",90002,Test Institution 1,Active
90002,System,Admin,system.test@example.com,"Admin,Members",90002,Test Institution 1,Active
90003,Institution,Admin,institution.test@example.com,"Members",90003,Test Institution 1,Active
90004,Regular,Member1,member1.test@example.com,"Members",90003,Test Institution 1,Active
90005,Regular,Member2,member2.test@example.com,"Members",90003,Test Institution 1,Active
```

**Resultado Esperado:**
- super.test@example.com → `super_admin`
- system.test@example.com → `admin`
- institution.test@example.com → `institution_admin` (UserId 90003 == Primary Contact 90003)
- member1.test@example.com → `member`
- member2.test@example.com → `member`

**Validação SQL:**
```sql
SELECT
  email,
  user_type
FROM members
WHERE email LIKE '%test@example.com'
ORDER BY
  CASE user_type
    WHEN 'super_admin' THEN 1
    WHEN 'admin' THEN 2
    WHEN 'institution_admin' THEN 3
    WHEN 'member' THEN 4
  END;
```

**Critérios de Sucesso:**
- [ ] ✅ 1 super_admin criado
- [ ] ✅ 1 admin criado
- [ ] ✅ 1 institution_admin criado
- [ ] ✅ 2 members criados
- [ ] ✅ 100% de precisão na detecção

---

### TESTE 4: Formulário Manual - Permissões de Super Admin

**Objetivo:** Validar que super_admin pode criar todos os tipos

**Pré-requisitos:**
- Login como super_admin (dev@platty.tech)

**Passos:**
1. Navegar para `/admin/members`
2. Clicar em "Add New Member" ou "Create Member"
3. Verificar dropdown "User Type"
4. Confirmar opções disponíveis:
   - [ ] ✅ Member (Regular User)
   - [ ] ✅ Institution Admin
   - [ ] ✅ System Admin
   - [ ] ✅ Super Admin
5. Criar teste: Membro com user_type = 'institution_admin'
6. Salvar
7. Verificar que foi salvo corretamente

**Validação SQL:**
```sql
SELECT email, user_type
FROM members
WHERE email = '[email do teste]';
```

**Critérios de Sucesso:**
- [ ] ✅ Dropdown mostra 4 opções
- [ ] ✅ Permite selecionar qualquer tipo
- [ ] ✅ Salva corretamente no banco
- [ ] ✅ Sem erros de validação

---

### TESTE 5: Formulário Manual - Permissões de System Admin

**Objetivo:** Validar que admin NÃO pode criar super_admin

**Pré-requisitos:**
- Criar um usuário admin de teste
- Login como esse admin

**Passos:**
1. Criar admin de teste (como super_admin):
   ```sql
   -- Criar via SQL para teste
   UPDATE members
   SET user_type = 'admin'
   WHERE email = '[algum email de teste]';
   ```
2. Logout e login como esse admin
3. Navegar para `/admin/members`
4. Clicar em "Add New Member"
5. Verificar dropdown "User Type"
6. Confirmar opções disponíveis:
   - [ ] ✅ Member (Regular User)
   - [ ] ✅ Institution Admin
   - [ ] ✅ System Admin
   - [ ] ❌ Super Admin (NÃO deve aparecer)
7. Tentar criar institution_admin
8. Verificar que salva com sucesso

**Critérios de Sucesso:**
- [ ] ✅ Dropdown mostra apenas 3 opções (sem super_admin)
- [ ] ✅ Permite criar admin, institution_admin, member
- [ ] ✅ Salva corretamente
- [ ] ✅ Validação funciona

---

### TESTE 6: Formulário Manual - Permissões de Institution Admin

**Objetivo:** Validar que institution_admin só pode criar members

**Pré-requisitos:**
- Criar institution_admin de teste
- Login como esse institution_admin

**Passos:**
1. Criar institution_admin de teste (como super_admin):
   ```sql
   UPDATE members
   SET user_type = 'institution_admin'
   WHERE email = '[algum email de teste]';
   ```
2. Logout e login como institution_admin
3. Navegar para `/admin/members`
4. Clicar em "Add New Member"
5. Verificar dropdown "User Type"
6. Confirmar opções disponíveis:
   - [ ] ✅ Member (Regular User) APENAS
   - [ ] ❌ Institution Admin (NÃO deve aparecer)
   - [ ] ❌ System Admin (NÃO deve aparecer)
   - [ ] ❌ Super Admin (NÃO deve aparecer)
7. Criar member
8. Verificar que salva com sucesso

**Critérios de Sucesso:**
- [ ] ✅ Dropdown mostra apenas 1 opção (member)
- [ ] ✅ Permite criar apenas members
- [ ] ✅ Salva corretamente
- [ ] ✅ Não consegue criar outros tipos

---

### TESTE 7: Full Import - Distribuição Final

**Objetivo:** Importar CSV completo e validar distribuição final

**⚠️ IMPORTANTE:** Executar APENAS se Testes 1-6 passarem

**Pré-requisitos:**
- ✅ Teste 1 passou (CSV sample)
- ✅ Teste 3 passou (CSV controlado)
- ✅ Backup do banco de dados criado

**Arquivo:** `import/Members With Membership and Companies - MembershipMemberandCompany.csv`

**Passos:**
1. **BACKUP PRIMEIRO:**
   ```bash
   # Via Supabase Studio ou pg_dump
   pg_dump -h [host] -U postgres -d postgres > backup_before_full_import.sql
   ```
2. **Opcional:** Limpar membros de teste
   ```sql
   DELETE FROM members
   WHERE email LIKE '%test@example.com'
   OR created_at > NOW() - INTERVAL '1 hour';
   ```
3. Navegar para `/admin/import-system`
4. Selecionar CSV completo (~6000 registros)
5. Clicar "Import"
6. Aguardar conclusão (pode levar 5-15 minutos)
7. Observar console logs e summary

**Validação SQL Final:**
```sql
-- 1. Distribuição geral
SELECT
  user_type,
  COUNT(*) as total,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM members
GROUP BY user_type
ORDER BY total DESC;

-- 2. Instituições com admins
SELECT
  i.name,
  COUNT(m.id) as admin_count
FROM institutions i
LEFT JOIN members m ON m.institution_id = i.id AND m.user_type = 'institution_admin'
WHERE i.id IN (SELECT DISTINCT institution_id FROM members WHERE institution_id IS NOT NULL)
GROUP BY i.id, i.name
HAVING COUNT(m.id) > 0
ORDER BY admin_count DESC;

-- 3. Instituições SEM admins (problema!)
SELECT
  i.name,
  (SELECT COUNT(*) FROM members WHERE institution_id = i.id) as total_members
FROM institutions i
WHERE i.id IN (SELECT DISTINCT institution_id FROM members WHERE institution_id IS NOT NULL)
AND NOT EXISTS (
  SELECT 1 FROM members
  WHERE institution_id = i.id
  AND user_type = 'institution_admin'
)
ORDER BY total_members DESC
LIMIT 20;
```

**Resultado Esperado:**
| User Type | Total | Percentage | Status |
|-----------|-------|------------|--------|
| member | ~5,920 | ~97.7% | ✅ |
| institution_admin | ~129 | ~2.1% | ✅ |
| super_admin | 1 | 0.02% | ✅ |
| admin | 0-5 | ~0-0.1% | ✅ |

**Critérios de Sucesso:**
- [ ] ✅ ~129 institution_admins (1 por instituição)
- [ ] ✅ ~2% do total são institution_admins
- [ ] ✅ 95%+ das instituições têm admin
- [ ] ✅ Nenhuma instituição tem >1 admin
- [ ] ✅ Super admin preservado
- [ ] ✅ Console logs mostram detecção correta

**Se Falhar:**
- 🔄 Restaurar backup
- 🔍 Analisar console logs
- 🔍 Identificar padrões de falha
- 🔧 Ajustar código
- 🔄 Re-testar com CSV sample

---

## 📋 CHECKLIST DE EXECUÇÃO

### Preparação:
- [ ] ✅ Servidor dev rodando (porta 5180)
- [ ] ✅ Login como super_admin (dev@platty.tech)
- [ ] ✅ Console do navegador aberto (F12)
- [ ] ✅ CSV files disponíveis
- [ ] ✅ Backup do banco criado

### Execução Sequencial:
1. [ ] ✅ Teste 1: CSV Sample (50 registros)
2. [ ] ✅ Teste 2: Validação de campos CSV
3. [ ] ✅ Teste 3: CSV controlado (5 registros)
4. [ ] ✅ Teste 4: Formulário - Super Admin
5. [ ] ✅ Teste 5: Formulário - System Admin
6. [ ] ✅ Teste 6: Formulário - Institution Admin
7. [ ] ⏸️ Teste 7: Full Import (APENAS se 1-6 passarem)

### Pós-Testes:
- [ ] ✅ Documentar resultados
- [ ] ✅ Screenshots de evidências
- [ ] ✅ Salvar console logs
- [ ] ✅ Validar queries SQL
- [ ] ✅ Criar relatório final

---

## 🚨 TROUBLESHOOTING

### Problema: Nenhum institution_admin detectado no Teste 1

**Possíveis Causas:**
1. Colunas CSV com nomes diferentes
2. Campos vazios/null
3. Parsing incorreto

**Debug Steps:**
```javascript
// Adicionar no console durante import:
console.log('CSV Columns:', Object.keys(records[0]))
console.log('Sample Record:', records[0])
console.log('User ID:', records[0]['User ID'] || records[0]['UserId'])
console.log('Primary Contact:', records[0]["Primary Contact's User ID"])
```

**Solução:**
- Verificar nomes exatos das colunas
- Ajustar mapeamento se necessário
- Re-executar teste

---

### Problema: Todos viram 'member' no Teste 3

**Causa:** Lógica de detecção não está executando

**Debug Steps:**
```javascript
// Verificar se código está sendo executado:
console.log('🔍 User Type Detection Running')
console.log('Member Groups Array:', memberGroupsArray)
console.log('UserId vs Primary Contact:', userId, primaryContactUserId)
```

**Solução:**
- Verificar se arquivo foi salvo corretamente
- Rebuild da aplicação (Ctrl+C, npm run dev)
- Clear cache do navegador (Ctrl+Shift+R)

---

### Problema: Formulário não mostra opções corretas

**Causa:** Permissões/roles não carregadas corretamente

**Debug Steps:**
```javascript
// No componente MemberForm:
console.log('Current Roles:', roles)
console.log('Available Types:', getAvailableUserTypes())
```

**Solução:**
- Verificar que login está correto
- Verificar que roles estão sendo carregadas
- Logout/Login novamente

---

## 📊 MÉTRICAS DE SUCESSO FINAL

### Teste 1-6 (Individuais):
- **Taxa de Sucesso Mínima:** 100% (todos devem passar)
- **Tempo Estimado:** 1-2 horas
- **Bloqueante:** Sim (se falhar, não fazer Teste 7)

### Teste 7 (Full Import):
- **Taxa de Sucesso Esperada:** 95-100%
- **Tempo Estimado:** 15-30 minutos
- **Critério:** ~129 institution_admins criados (~2%)

### Overall:
- **Precisão de Detecção:** ≥95%
- **False Positives:** <1%
- **False Negatives:** <5%
- **Instituições sem Admin:** <10 (de ~129)

---

## 📚 DOCUMENTOS RELACIONADOS

1. **USER_TYPE_BUSINESS_RULES.md** - Regras de negócio
2. **USER_TYPE_IMPLEMENTATION_PHASE4.md** - Implementação
3. **USER_TYPE_DATA_ANALYSIS.md** - Análise de dados
4. **USER_TYPE_TEST_PLAN_PHASE5.md** - Este documento

---

## ✅ PRÓXIMA FASE

**Após Fase 5 (Testes):**
- **FASE 6:** Documentação Final e Cleanup
  - Atualizar CLAUDE.md
  - Atualizar DATABASE_SCHEMA.md
  - Deletar arquivos obsoletos
  - Criar guia de uso

**Após Fase 6:**
- **FASE 7:** Validação Final
  - Checklist completo
  - Sign-off do usuário
  - Projeto concluído

---

**STATUS:** ⏳ PRONTO PARA EXECUÇÃO
**PRÓXIMO PASSO:** Executar Teste 1 (CSV Sample)
