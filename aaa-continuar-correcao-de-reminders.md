# 🔴 CORREÇÃO URGENTE - Sistema de Reminders Não Funciona

## 📅 Data: 22/08/2025
## ⏰ Status: PENDENTE - Reminders NÃO estão sendo criados automaticamente

---

## 🎯 PROBLEMA PRINCIPAL
**Os reminders de eventos NÃO estão sendo criados automaticamente quando um usuário se registra em um evento.**

### Sintomas:
1. ✅ Email de confirmação de inscrição: **FUNCIONA**
2. ❌ Criação automática de reminders: **NÃO FUNCIONA**
3. ❌ Reminders agendados (7 dias, 3 dias, 1 dia, 30 min, ao vivo): **NÃO SÃO CRIADOS**

---

## 🔍 DIAGNÓSTICO ATUAL

### 1. **Erro Principal Identificado**
```javascript
// Console do navegador ao se registrar em evento:
❌ Error creating event_live: 
{
  code: '42501', 
  message: 'new row violates row-level security policy for table "event_reminders"'
}
```

### 2. **Causa Raiz**
A tabela `event_reminders` tem políticas RLS (Row Level Security) que **bloqueiam** usuários autenticados de inserir registros, mesmo sendo seus próprios reminders.

### 3. **Localização do Código**
```
📁 eau-members/src/services/eventRegistrationService.ts
   └── Função: scheduleConfigurableReminders (linha 497)
       └── Problema: linha 552 - INSERT falha por RLS
```

---

## 🛠️ TENTATIVAS DE CORREÇÃO JÁ REALIZADAS

### ✅ 1. **Logs de Debug Adicionados**
- Arquivo: `eventRegistrationService.ts`
- Linhas: 504-539, 566-567
- Status: Logs aparecem, mostram que tenta criar mas falha

### ❌ 2. **Tentativa de Usar Service Role Key**
- Arquivo: `eventRegistrationService.ts`  
- Linhas: 513-517, 552
- **PROBLEMA**: Mesmo com service role, ainda dá erro de RLS
- **SUSPEITA**: Import dinâmico pode não estar funcionando

### ✅ 3. **Correção do Import CPDService**
- Arquivo: `eventRegistrationService.ts`
- Linha: 4-5
- Status: CORRIGIDO - não dá mais erro de `createActivity is not a function`

### ✅ 4. **Correção do Loop Infinito do Quill.js**
- Arquivo: `QuillBulletFix.tsx`
- Linhas: 216-247
- Status: CORRIGIDO - editor não trava mais

---

## 🚨 PRÓXIMOS PASSOS (FAZER AMANHÃ)

### Opção 1: **Desabilitar RLS Completamente** (Mais Rápido)
```sql
-- Executar no Supabase Dashboard > SQL Editor
ALTER TABLE event_reminders DISABLE ROW LEVEL SECURITY;
```

### Opção 2: **Corrigir Políticas RLS** (Mais Seguro)
```sql
-- Remover políticas antigas
DROP POLICY IF EXISTS "Users can insert reminders" ON event_reminders;
DROP POLICY IF EXISTS "Users can view reminders" ON event_reminders;

-- Criar políticas permissivas
CREATE POLICY "Authenticated can insert reminders" 
ON event_reminders FOR INSERT 
TO authenticated 
WITH CHECK (true);

CREATE POLICY "Users can view own reminders" 
ON event_reminders FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Garantir que RLS está habilitado
ALTER TABLE event_reminders ENABLE ROW LEVEL SECURITY;
```

### Opção 3: **Usar Playwright para Teste Automatizado**
```javascript
// Usar MCP Playwright para:
1. Acessar http://localhost:5180
2. Login como admin (rrzillesg@gmail.com / Salmo119:97)
3. Navegar para eventos
4. Registrar em evento de teste
5. Verificar console por erros
6. Executar check-reminders.js
7. Confirmar se reminders foram criados
```

---

## 📋 EVENTOS DE TESTE CRIADOS

### 1. **Final Test Event** (melhor para teste)
- **URL**: http://localhost:5180/events/final-test-reminders-should-work-1755893393343
- **ID**: 06334f0d-4f0c-4354-8bc4-221a91aac964
- **Início**: 22/08/2025, 17:54
- **Reminders esperados**: 30_min_before, event_live

### 2. **Test Event - Reminders Working**
- **URL**: http://localhost:5180/events/test-event-reminders-working-1755892369090
- **ID**: 1528a2a6-3971-42cd-9527-3e05f38f463e

---

## 🧪 COMO TESTAR SE FUNCIONOU

### 1. **Via Console do Navegador**
```javascript
// Após se registrar em evento, procurar por:
✅ "Created 30_min_before reminder"
✅ "Created event_live reminder"

// Se aparecer:
❌ "Error creating [tipo]: new row violates row-level security"
// Então NÃO funcionou
```

### 2. **Via Script de Verificação**
```bash
node check-reminders.js

# Deve mostrar reminders pendentes para o evento registrado
# Se mostrar 0 reminders, não funcionou
```

### 3. **Via Banco de Dados**
```sql
-- No Supabase Dashboard
SELECT * FROM event_reminders 
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;
```

---

## 🔧 ARQUIVOS IMPORTANTES

### Scripts de Teste
- `check-reminders.js` - Verifica reminders no banco
- `create-final-event-test.js` - Cria evento de teste
- `production-reminder-worker.js` - Worker que processa reminders

### Código Principal
- `eau-members/src/services/eventRegistrationService.ts` - Função que cria reminders
- `eau-members/src/components/ui/QuillBulletFix.tsx` - Editor corrigido

### Configuração
- **Supabase URL**: https://english-australia-eau-supabase.lkobs5.easypanel.host
- **Service Role Key**: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q

---

## 📝 COMANDOS ÚTEIS

### Iniciar Ambiente
```bash
# Terminal 1 - Email Server
cd email-server && npm start

# Terminal 2 - Dev Server
cd eau-members && npm run dev

# Terminal 3 - Worker (quando quiser processar reminders)
node production-reminder-worker.js
```

### Verificar Estado
```bash
# Ver reminders pendentes
node check-reminders.js

# Criar evento de teste
node create-final-event-test.js

# Testar envio manual
node create-today-reminders.js
node production-reminder-worker.js
```

---

## ⚠️ IMPORTANTE

### O que FUNCIONA:
- ✅ Sistema de emails (SMTP configurado)
- ✅ Email de confirmação de inscrição
- ✅ Worker de processamento de reminders
- ✅ Templates de email profissionais
- ✅ Countdown na página do evento

### O que NÃO FUNCIONA:
- ❌ **Criação automática de reminders ao se inscrever**
- ❌ Políticas RLS da tabela event_reminders

### Solução Temporária (Manual):
1. Criar reminders manualmente com `create-today-reminders.js`
2. Executar `production-reminder-worker.js` para enviar

---

## 🎯 OBJETIVO FINAL

Quando um usuário se registra em um evento, o sistema deve:
1. ✅ Enviar email de confirmação (já funciona)
2. ❌ Criar automaticamente 5 reminders no banco:
   - 7 dias antes (se no futuro)
   - 3 dias antes (se no futuro)
   - 1 dia antes (se no futuro)
   - 30 minutos antes (se no futuro)
   - Quando evento começa (se no futuro)
3. ❌ Worker processa e envia emails nos horários agendados

**STATUS ATUAL: Passo 2 não funciona por causa do RLS**

---

## 💡 SUGESTÃO PARA AMANHÃ

1. **Usar Playwright MCP** para automatizar todo o processo de teste
2. **Desabilitar RLS temporariamente** para confirmar que é isso
3. **Se funcionar**, criar políticas RLS corretas
4. **Se não funcionar**, investigar se há outro problema

---

**ÚLTIMA ATUALIZAÇÃO**: 22/08/2025 às 17:10
**AUTOR**: Claude (sessão anterior)
**PRIORIDADE**: 🔴 ALTA - Sistema crítico não funcional