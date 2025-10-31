# 📋 PLANO DE TESTE COMPLETO - Sistema de Eventos

**Data de Criação:** 30/01/2025
**Objetivo:** Testar todas as funcionalidades do sistema de eventos end-to-end

---

## 🎯 ESCOPO DOS TESTES

### Funcionalidades a Testar:
1. ✅ Cadastro de eventos (Admin/SuperAdmin)
2. ✅ Inscrição de membros com filtro por tipo
3. ✅ Email de confirmação e lembretes automáticos
4. ✅ Email para admin quando nova inscrição
5. ✅ Respeito às configurações SMTP
6. ✅ Acompanhamento de inscritos pelo admin
7. ✅ Ativação do link do evento próximo ao horário
8. ✅ Geração automática de CPD e Certificado pós-evento

---

## 🧪 TESTE 1: CADASTRO DE EVENTO POR ADMIN/SUPERADMIN

### Pré-requisitos:
- [ ] Sistema rodando (frontend + backend)
- [ ] Usuário logado como Admin ou SuperAdmin
- [ ] SMTP configurado em `/admin/smtp-settings`

### Passos:

#### 1.1 Acessar Página de Eventos
```bash
1. Login como SuperAdmin (dev@platty.tech)
2. Acessar http://localhost:5180/events
3. Clicar no botão "Create New Event"
```

**Validação:** ✅ Modal de criação de evento abre

#### 1.2 Preencher Formulário de Evento
```bash
Dados do Evento:
- Title: "Workshop - Advanced Teaching Methods"
- Description: "Workshop sobre métodos avançados de ensino"
- Event Type: "Workshop"
- Location Type: "Virtual"
- Virtual Link: "https://zoom.us/j/123456789"
- Start Date: [Amanhã]
- End Date: [Amanhã + 2 horas]
- Timezone: "Australia/Sydney"
- Capacity: 50
- Registration End Date: [Hoje + 23 horas]

Configurações CPD:
- CPD Points: 2
- CPD Category: "Attend English Australia PD event"

Elegibilidade:
- [ ] All Members
- [x] Member Colleges
- [x] Professional Affiliates
- [ ] Corporate Affiliates
```

**Validação Esperada:**
- ✅ Todos os campos obrigatórios marcados com *
- ✅ Validação de datas (end_date > start_date)
- ✅ Validação de registration_end_date <= start_date
- ✅ Virtual Link obrigatório se location_type = "Virtual"

#### 1.3 Submeter Evento
```bash
1. Clicar em "Create Event"
2. Aguardar confirmação
```

**Validação Esperada:**
- ✅ Notificação de sucesso: "Event created successfully!"
- ✅ Evento aparece na lista de eventos
- ✅ Status inicial: "Upcoming"
- ✅ Registro criado no banco de dados
- ✅ Slug gerado automaticamente

**SQL Validação:**
```sql
SELECT id, title, slug, location_type, virtual_link, cpd_points,
       start_date, end_date, capacity, eligible_member_types
FROM events
WHERE title = 'Workshop - Advanced Teaching Methods'
ORDER BY created_at DESC LIMIT 1;
```

---

## 🧪 TESTE 2: INSCRIÇÃO DE MEMBRO NO EVENTO

### Pré-requisitos:
- [ ] Evento criado (Teste 1)
- [ ] Usuário membro logado (tipo elegível ao evento)
- [ ] Evento com vagas disponíveis

### Cenários a Testar:

#### 2.1 Inscrição de Membro Elegível
```bash
1. Logout do admin
2. Login como membro (tipo: Member College)
3. Acessar http://localhost:5180/events
4. Clicar no evento "Workshop - Advanced Teaching Methods"
5. Verificar elegibilidade exibida
6. Clicar em "Register for Event"
7. Confirmar inscrição no modal
```

**Validação Esperada:**
- ✅ Botão "Register" visível para membros elegíveis
- ✅ Modal de confirmação abre
- ✅ Detalhes do evento exibidos corretamente
- ✅ Após confirmar: "Successfully registered for event!"
- ✅ Botão muda para "Registered" (desabilitado)
- ✅ Email de confirmação enviado
- ✅ Registro criado em `event_registrations`

**SQL Validação:**
```sql
SELECT er.id, er.status, er.attendance_status,
       m.email, m.first_name, m.last_name, m.user_type
FROM event_registrations er
JOIN members m ON er.member_id = m.id
WHERE er.event_id = '[EVENT_ID]'
ORDER BY er.created_at DESC;
```

#### 2.2 Inscrição de Membro Não Elegível
```bash
1. Login como membro (tipo: Corporate Affiliate)
2. Acessar página do evento
3. Verificar que botão "Register" não aparece
```

**Validação Esperada:**
- ✅ Mensagem: "This event is not available for your membership type"
- ✅ Botão "Register" não visível
- ✅ Elegibilidade exibida claramente

#### 2.3 Inscrição em Evento Lotado
```bash
1. Admin: Reduzir capacity do evento para 1
2. Membro 2: Tentar se inscrever
```

**Validação Esperada:**
- ✅ Mensagem: "Event is full"
- ✅ Botão "Register" desabilitado
- ✅ Contador de vagas: "0 / 1 spots available"

#### 2.4 Inscrição Após Deadline
```bash
1. Admin: Alterar registration_end_date para ontem
2. Membro: Tentar se inscrever
```

**Validação Esperada:**
- ✅ Mensagem: "Registration closed"
- ✅ Botão "Register" desabilitado

---

## 🧪 TESTE 3: EMAILS DE CONFIRMAÇÃO E LEMBRETES

### Pré-requisitos:
- [ ] SMTP configurado corretamente
- [ ] Backend rodando (porta 3001)
- [ ] Email server funcionando
- [ ] Membro inscrito no evento (Teste 2)

### 3.1 Email de Confirmação de Inscrição

**Momento do Envio:** Imediatamente após inscrição

**Verificação:**
```bash
1. Após inscrição bem-sucedida (Teste 2.1)
2. Verificar console do backend
3. Verificar email do membro inscrito
4. Acessar http://localhost:3001 (dashboard de emails)
```

**Validação Esperada:**
- ✅ Console mostra: "Email sent successfully"
- ✅ Email recebido na caixa de entrada do membro
- ✅ Subject: "Registration Confirmation - [Event Title]"
- ✅ Email contém:
  - Nome do evento
  - Data e hora
  - Timezone
  - Link virtual (se aplicável)
  - CPD points que serão ganhos
  - Botão "View Event Details"
- ✅ Template HTML responsivo
- ✅ Branding English Australia

**SQL Validação:**
```sql
-- Verificar se email foi registrado (se tiver logging)
SELECT * FROM email_logs
WHERE recipient_email = '[MEMBER_EMAIL]'
AND email_type = 'event_registration_confirmation'
ORDER BY sent_at DESC LIMIT 1;
```

### 3.2 Emails de Lembretes Automáticos

**Configuração de Lembretes:** `/admin/event-reminders`

**Verificar Configuração Atual:**
```bash
1. Login como Admin
2. Acessar http://localhost:5180/admin/event-reminders
3. Verificar timings configurados:
   - 7 days before
   - 3 days before
   - 1 day before
   - 30 minutes before
   - Event is live
```

**Tipos de Lembretes a Testar:**

#### 3.2.1 Lembrete de 7 Dias Antes
```bash
Cenário: Evento marcado para daqui a 7 dias

Validação:
- ✅ Email enviado exatamente 7 dias antes
- ✅ Subject: "[Event Title] - Reminder: Event in 7 days"
- ✅ Contém data/hora do evento
- ✅ Link para detalhes
```

#### 3.2.2 Lembrete de 3 Dias Antes
```bash
Cenário: Evento marcado para daqui a 3 dias

Validação:
- ✅ Email enviado exatamente 3 dias antes
- ✅ Subject: "[Event Title] - Reminder: Event in 3 days"
```

#### 3.2.3 Lembrete de 1 Dia Antes
```bash
Cenário: Evento marcado para amanhã

Validação:
- ✅ Email enviado 24 horas antes
- ✅ Subject: "[Event Title] - Reminder: Event tomorrow"
```

#### 3.2.4 Lembrete de 30 Minutos Antes
```bash
Cenário: Evento começando em 30 minutos

Validação:
- ✅ Email enviado 30 minutos antes
- ✅ Subject: "[Event Title] - Starting in 30 minutes!"
- ✅ Link virtual destacado
- ✅ Botão "Join Now" proeminente
```

#### 3.2.5 Notificação "Event is Live"
```bash
Cenário: Evento começou (hora atual >= start_date)

Validação:
- ✅ Email enviado no momento exato do início
- ✅ Subject: "[Event Title] - Event is now live!"
- ✅ Link virtual em destaque
- ✅ Urgência no texto
```

**Verificação no Backend:**
```bash
# Verificar scheduler rodando
Console do backend deve mostrar:
"Event reminder scheduler started"
"Checking for events requiring reminders..."
```

**SQL Validação:**
```sql
-- Verificar últimos lembretes enviados
SELECT er.member_id, m.email, e.title,
       el.email_type, el.sent_at
FROM email_logs el
JOIN event_registrations er ON er.id = el.registration_id
JOIN events e ON e.id = er.event_id
JOIN members m ON m.id = er.member_id
WHERE el.email_type LIKE '%reminder%'
ORDER BY el.sent_at DESC
LIMIT 10;
```

---

## 🧪 TESTE 4: EMAIL PARA ADMIN QUANDO NOVA INSCRIÇÃO

### Pré-requisitos:
- [ ] SMTP configurado
- [ ] Email do admin configurado no sistema
- [ ] Evento criado

### Passos:

```bash
1. Membro se inscreve no evento (Teste 2.1)
2. Verificar email do admin imediatamente
```

**Validação Esperada:**
- ✅ Admin recebe email de notificação
- ✅ Subject: "New Registration - [Event Title]"
- ✅ Email contém:
  - Nome do evento
  - Nome do membro inscrito
  - Email do membro
  - Tipo de membership
  - Data/hora da inscrição
  - Total de inscritos agora
  - Link para gerenciar evento
- ✅ Template profissional
- ✅ Enviado para todos os admins (se configurado)

**SQL Validação:**
```sql
-- Verificar email enviado ao admin
SELECT * FROM email_logs
WHERE recipient_email = '[ADMIN_EMAIL]'
AND email_type = 'admin_new_registration'
ORDER BY sent_at DESC LIMIT 1;
```

---

## 🧪 TESTE 5: RESPEITO ÀS CONFIGURAÇÕES SMTP

### Pré-requisitos:
- [ ] Acesso à página `/admin/smtp-settings`

### 5.1 Verificar Configuração SMTP

```bash
1. Login como SuperAdmin
2. Acessar http://localhost:5180/admin/smtp-settings
3. Verificar configurações atuais:
   - SMTP Host
   - SMTP Port
   - SMTP User
   - SMTP Password (obscured)
   - From Email
   - From Name
```

**Validação Visual:**
- ✅ Todas as configurações exibidas
- ✅ Senha obscurecida (••••••)
- ✅ Botão "Test Connection" disponível

### 5.2 Testar Conexão SMTP

```bash
1. Na página de SMTP settings
2. Clicar em "Test Connection"
3. Aguardar resposta
```

**Validação Esperada:**
- ✅ Mensagem: "SMTP connection successful!"
- ✅ Email de teste enviado
- ✅ Email recebido na caixa configurada

### 5.3 Verificar Backend Usa Configurações

**Verificação no Código:**
```bash
# Verificar que email service usa useStoredConfig: true
eau-backend/src/services/email.service.ts

Linha esperada:
const response = await axios.post(
  `${EMAIL_SERVER_URL}/send-email`,
  { ...emailData, useStoredConfig: true }
);
```

**Validação:**
- ✅ Backend sempre usa configuração do banco
- ✅ Não hardcoda credenciais SMTP
- ✅ Busca configuração de `smtp_settings` table

### 5.4 Alterar Configuração e Testar

```bash
1. Alterar "From Name" de "English Australia" para "EA Events"
2. Salvar configuração
3. Disparar novo email (ex: nova inscrição)
4. Verificar email recebido
```

**Validação Esperada:**
- ✅ Email recebido com novo "From Name"
- ✅ Mudança aplicada imediatamente
- ✅ Sem necessidade de restart do servidor

---

## 🧪 TESTE 6: ACOMPANHAMENTO DE INSCRITOS PELO ADMIN

### Pré-requisitos:
- [ ] Evento com inscritos (Teste 2)
- [ ] Login como Admin/SuperAdmin

### 6.1 Visualizar Lista de Inscritos

```bash
1. Login como Admin
2. Acessar http://localhost:5180/events
3. Clicar no evento específico
4. Clicar em aba/botão "Registrations" ou "Attendees"
```

**Validação Esperada:**
- ✅ Lista completa de inscritos exibida
- ✅ Informações mostradas:
  - Nome completo
  - Email
  - Tipo de membership
  - Data de inscrição
  - Status (Registered, Attended, Cancelled)
  - Ações disponíveis
- ✅ Contador: "X / Y spots filled"
- ✅ Paginação (se muitos inscritos)

### 6.2 Marcar Presença

```bash
1. Na lista de inscritos
2. Localizar membro específico
3. Clicar em botão "Mark as Attended"
4. Confirmar ação
```

**Validação Esperada:**
- ✅ Status muda para "Attended"
- ✅ Badge verde aparece
- ✅ Notificação: "Attendance marked successfully"
- ✅ CPD e Certificado gerados automaticamente (Teste 8)

**SQL Validação:**
```sql
SELECT er.id, er.attendance_status, er.attended_at,
       e.title, m.email
FROM event_registrations er
JOIN events e ON e.id = er.event_id
JOIN members m ON m.id = er.member_id
WHERE er.attendance_status = 'attended'
ORDER BY er.attended_at DESC
LIMIT 5;
```

### 6.3 Cancelar Inscrição (Admin)

```bash
1. Na lista de inscritos
2. Clicar em "Cancel Registration" para um membro
3. Confirmar
```

**Validação Esperada:**
- ✅ Status muda para "Cancelled"
- ✅ Vaga liberada (contador atualiza)
- ✅ Email de cancelamento enviado ao membro

### 6.4 Export de Inscritos

```bash
1. Na página de inscritos
2. Clicar em "Export to CSV"
3. Verificar arquivo baixado
```

**Validação Esperada:**
- ✅ Arquivo CSV baixado
- ✅ Contém todos os inscritos
- ✅ Colunas: Name, Email, Membership Type, Registration Date, Status

---

## 🧪 TESTE 7: ATIVAÇÃO DO LINK DO EVENTO

### Pré-requisitos:
- [ ] Evento virtual criado
- [ ] Membro inscrito
- [ ] Link virtual configurado no evento

### 7.1 Link Desabilitado Antes do Evento

```bash
Cenário: Evento começa em 2 horas

1. Membro inscrito acessa página do evento
2. Verificar status do link virtual
```

**Validação Esperada:**
- ✅ Link do evento visível mas desabilitado
- ✅ Mensagem: "Event link will be available 30 minutes before start"
- ✅ Timer/countdown exibido
- ✅ Botão cinza/desabilitado

### 7.2 Link Ativo 30 Minutos Antes

```bash
Cenário: Faltam 30 minutos para o evento

Opção A: Alterar start_date do evento para agora + 30 min
Opção B: Alterar hora do sistema (não recomendado)

1. Aguardar ou ajustar tempo
2. Recarregar página do evento
3. Verificar botão do link
```

**Validação Esperada:**
- ✅ Botão "Join Event" ativo
- ✅ Cor destacada (verde/azul)
- ✅ Mensagem: "Event starting soon - Join now!"
- ✅ Ao clicar, link abre em nova aba
- ✅ Link correto (virtual_link do evento)

### 7.3 Link Durante o Evento

```bash
Cenário: Evento em andamento (hora atual entre start_date e end_date)

1. Acessar página do evento
2. Verificar botão
```

**Validação Esperada:**
- ✅ Botão "Join Live Event" ativo e pulsando
- ✅ Badge "LIVE" exibido
- ✅ Mensagem: "Event is live now!"
- ✅ Link funcional

### 7.4 Link Após o Evento

```bash
Cenário: Evento terminou (hora atual > end_date)

1. Acessar página do evento
2. Verificar status
```

**Validação Esperada:**
- ✅ Botão desabilitado
- ✅ Mensagem: "Event has ended"
- ✅ Badge "COMPLETED"
- ✅ Opção de ver certificado (se participou)

**Lógica de Ativação (para referência):**
```typescript
const now = new Date()
const eventStart = new Date(event.start_date)
const eventEnd = new Date(event.end_date)

// 30 minutos antes em milissegundos
const thirtyMinutesBeforeStart = new Date(eventStart.getTime() - 30 * 60 * 1000)

const linkActive = now >= thirtyMinutesBeforeStart && now <= eventEnd
```

---

## 🧪 TESTE 8: GERAÇÃO AUTOMÁTICA DE CPD E CERTIFICADO

### Pré-requisitos:
- [ ] Evento com CPD points configurado (Teste 1)
- [ ] Membro inscrito e marcado como "Attended" (Teste 6.2)
- [ ] Sistema de geração de certificados funcionando

### 8.1 Trigger: Marcar Presença

```bash
1. Admin acessa lista de inscritos
2. Marca membro como "Attended"
3. Sistema deve disparar automaticamente:
   - Geração de certificado PDF
   - Criação de atividade CPD
   - Envio de email com certificado
```

### 8.2 Verificar Atividade CPD Criada

**Validação no Frontend:**
```bash
1. Login como o membro que participou
2. Acessar http://localhost:5180/cpd
3. Verificar lista de atividades
```

**Validação Esperada:**
- ✅ Nova atividade CPD aparece
- ✅ Title: "Event: [Event Title]"
- ✅ Provider: "English Australia"
- ✅ Category: [CPD Category do evento]
- ✅ Points: [CPD Points configurados no evento]
- ✅ Status: "approved" (auto-aprovado)
- ✅ Date: Data do evento
- ✅ Evidence: Link para certificado

**SQL Validação:**
```sql
SELECT ca.id, ca.activity_title, ca.cpd_points,
       ca.status, ca.activity_date, ca.event_id,
       ca.certificate_url, ca.certificate_number
FROM cpd_activities ca
WHERE ca.event_id = '[EVENT_ID]'
AND ca.user_id = '[USER_ID]'
ORDER BY ca.created_at DESC
LIMIT 1;
```

### 8.3 Verificar Certificado Gerado

**Validação no Storage:**
```sql
SELECT c.id, c.event_id, c.member_id, c.certificate_number,
       c.certificate_url, c.issued_date, c.cpd_points
FROM event_certificates c
WHERE c.event_id = '[EVENT_ID]'
AND c.member_id = '[MEMBER_ID]'
ORDER BY c.created_at DESC
LIMIT 1;
```

**Validação Esperada:**
- ✅ Registro criado em `event_certificates`
- ✅ Certificate number único gerado
- ✅ URL do certificado presente
- ✅ CPD points registrados
- ✅ Issued date = data atual

**Verificar PDF:**
```bash
1. Acessar URL do certificado
2. Verificar conteúdo do PDF
```

**Validação do Certificado:**
- ✅ Nome do membro
- ✅ Título do evento
- ✅ Data do evento
- ✅ CPD points ganhos
- ✅ Certificate number único
- ✅ Logo English Australia
- ✅ Formatação profissional

### 8.4 Verificar Email com Certificado

```bash
1. Verificar email do membro
2. Procurar email de congratulações
```

**Validação Esperada:**
- ✅ Subject: "Certificate - [Event Title]"
- ✅ Email contém:
  - Mensagem de congratulações
  - Nome do evento
  - CPD points ganhos
  - Link para download do certificado
  - Botão "Download Certificate"
  - Link para ver CPD activities
- ✅ Template HTML profissional

### 8.5 Verificar Barra de Progresso CPD Atualizada

```bash
1. Login como membro
2. Acessar http://localhost:5180/cpd
3. Verificar cards de estatísticas
```

**Validação Esperada:**
- ✅ Total Points aumentou (+X pontos do evento)
- ✅ 2025 Points aumentou (se evento em 2025)
- ✅ Activities count aumentou (+1)
- ✅ Goal Progress atualizado
- ✅ Barra de progresso reflete novos pontos

### 8.6 Teste de Múltiplos Participantes

```bash
1. Admin marca 5 membros como "Attended"
2. Verificar que para cada um:
   - CPD criado
   - Certificado gerado
   - Email enviado
```

**Validação Esperada:**
- ✅ Todos os processos executados para cada membro
- ✅ Certificate numbers únicos
- ✅ Sem duplicação
- ✅ Sem erros no console

**SQL Validação:**
```sql
-- Verificar que todos têm CPD e certificado
SELECT m.email, m.first_name, m.last_name,
       COUNT(DISTINCT ca.id) as cpd_count,
       COUNT(DISTINCT ec.id) as cert_count
FROM event_registrations er
JOIN members m ON m.id = er.member_id
LEFT JOIN cpd_activities ca ON ca.event_id = er.event_id
                            AND ca.user_id = m.user_id
LEFT JOIN event_certificates ec ON ec.event_id = er.event_id
                                 AND ec.member_id = m.id
WHERE er.event_id = '[EVENT_ID]'
AND er.attendance_status = 'attended'
GROUP BY m.id, m.email, m.first_name, m.last_name;
```

---

## 📊 CHECKLIST GERAL DE VALIDAÇÃO

### Sistema de Eventos

#### Criação de Eventos
- [ ] Admin/SuperAdmin consegue criar evento
- [ ] Todos os campos obrigatórios validados
- [ ] Datas validadas (end > start)
- [ ] Virtual link obrigatório para eventos virtuais
- [ ] CPD points e category configuráveis
- [ ] Elegibilidade por tipo de membro funciona
- [ ] Slug gerado automaticamente
- [ ] Evento aparece na lista

#### Inscrições
- [ ] Membros elegíveis conseguem se inscrever
- [ ] Membros não elegíveis não veem botão
- [ ] Limite de capacidade respeitado
- [ ] Deadline de inscrição respeitado
- [ ] Não permite inscrição duplicada
- [ ] Status correto após inscrição

#### Emails
- [ ] Email de confirmação enviado imediatamente
- [ ] Lembrete 7 dias antes enviado
- [ ] Lembrete 3 dias antes enviado
- [ ] Lembrete 1 dia antes enviado
- [ ] Lembrete 30 minutos antes enviado
- [ ] Notificação "Event is Live" enviada
- [ ] Admin recebe email de nova inscrição
- [ ] Todos os emails usam configuração SMTP do banco
- [ ] Templates HTML profissionais e responsivos

#### Configuração SMTP
- [ ] Configurações salvas no banco
- [ ] Teste de conexão funciona
- [ ] Backend usa sempre configuração do banco
- [ ] Alterações aplicadas sem restart

#### Acompanhamento Admin
- [ ] Lista de inscritos acessível
- [ ] Informações completas exibidas
- [ ] Marcar presença funciona
- [ ] Cancelar inscrição funciona
- [ ] Export CSV funciona
- [ ] Contador de vagas atualiza

#### Link do Evento
- [ ] Desabilitado antes de 30 minutos
- [ ] Ativo 30 minutos antes
- [ ] Ativo durante evento
- [ ] Badge "LIVE" exibido quando ativo
- [ ] Desabilitado após evento terminar
- [ ] Link abre em nova aba

#### Geração Automática CPD/Certificado
- [ ] Trigger ao marcar presença
- [ ] Atividade CPD criada automaticamente
- [ ] Status "approved" automático
- [ ] Pontos corretos
- [ ] Certificado PDF gerado
- [ ] Certificate number único
- [ ] URL armazenada
- [ ] Email com certificado enviado
- [ ] Barra de progresso CPD atualizada
- [ ] Funciona para múltiplos participantes
- [ ] Sem duplicação

---

## 🔍 FERRAMENTAS DE VALIDAÇÃO

### Frontend
```bash
# Servidor de desenvolvimento
cd eau-members && npm run dev
# URL: http://localhost:5180
```

### Backend
```bash
# Servidor backend
cd eau-backend && npm run dev
# URL: http://localhost:3001
# API: http://localhost:3001/api/v1
```

### Email Server Dashboard
```bash
# Dashboard de emails enviados
URL: http://localhost:3001
```

### Database Queries
```bash
# Supabase Studio
https://ypsvoxelitgceclohxfu.supabase.co/

# Ou via MCP
mcp__supabase-novo__execute_sql
```

### Console Logs
```bash
# Backend logs
Verificar terminal do backend para:
- "Email sent successfully"
- "Certificate generated"
- "CPD activity created"
- "Event reminder scheduler running"
```

---

## 🚨 PROBLEMAS CONHECIDOS E SOLUÇÕES

### Problema: Emails não enviados
**Solução:**
1. Verificar SMTP configurado em `/admin/smtp-settings`
2. Testar conexão SMTP
3. Verificar backend rodando (porta 3001)
4. Verificar console do backend para erros

### Problema: Link do evento não ativa
**Solução:**
1. Verificar `start_date` do evento
2. Verificar timezone do evento
3. Verificar hora do servidor
4. Recarregar página

### Problema: CPD não criado após marcar presença
**Solução:**
1. Verificar se evento tem `cpd_points` configurado
2. Verificar console do backend para erros
3. Verificar se membro tem registro em `members` table
4. Verificar se `event_id` está correto

### Problema: Certificado não gerado
**Solução:**
1. Verificar se storage bucket `event-certificates` existe
2. Verificar permissões RLS
3. Verificar console para erro de geração PDF
4. Verificar se certificate number está sendo gerado

---

## 📅 ORDEM DE EXECUÇÃO RECOMENDADA

### Fase 1: Setup (10 minutos)
1. ✅ Verificar SMTP configurado
2. ✅ Iniciar frontend e backend
3. ✅ Verificar email server rodando
4. ✅ Verificar configuração de lembretes

### Fase 2: Testes Básicos (20 minutos)
1. ✅ TESTE 1: Criar evento
2. ✅ TESTE 2.1: Inscrever membro elegível
3. ✅ TESTE 3.1: Verificar email de confirmação
4. ✅ TESTE 4: Verificar email para admin

### Fase 3: Testes de Regras (15 minutos)
1. ✅ TESTE 2.2: Membro não elegível
2. ✅ TESTE 2.3: Evento lotado
3. ✅ TESTE 2.4: Inscrição após deadline
4. ✅ TESTE 5: Configurações SMTP

### Fase 4: Gestão Admin (15 minutos)
1. ✅ TESTE 6.1: Visualizar inscritos
2. ✅ TESTE 6.2: Marcar presença
3. ✅ TESTE 6.3: Cancelar inscrição
4. ✅ TESTE 6.4: Export CSV

### Fase 5: Link e Timing (10 minutos)
1. ✅ TESTE 7.1: Link desabilitado
2. ✅ TESTE 7.2: Link ativo 30 min antes
3. ✅ TESTE 7.3: Link durante evento
4. ✅ TESTE 7.4: Link após evento

### Fase 6: CPD e Certificado (20 minutos)
1. ✅ TESTE 8.2: Verificar CPD criado
2. ✅ TESTE 8.3: Verificar certificado
3. ✅ TESTE 8.4: Verificar email
4. ✅ TESTE 8.5: Verificar barra CPD
5. ✅ TESTE 8.6: Múltiplos participantes

### Fase 7: Lembretes (Tempo variável)
1. ✅ TESTE 3.2: Configurar lembretes
2. ⏳ Aguardar tempos configurados
3. ✅ Verificar emails enviados

**Tempo Total Estimado:** ~2 horas (excluindo tempo de espera de lembretes)

---

## 📝 NOTAS IMPORTANTES

1. **Lembretes Automáticos:** Dependem de scheduler rodando no backend. Verificar logs.

2. **Timezones:** Eventos usam timezone configurado. Importante para links e lembretes.

3. **SMTP:** Sistema sempre usa configuração do banco. Não hardcoda credenciais.

4. **CPD Auto-aprovado:** Atividades de eventos são sempre auto-aprovadas (status = 'approved').

5. **Certificate Numbers:** São únicos e gerados automaticamente. Formato: `CERT-[timestamp]-[random]`.

6. **Storage:** Certificados salvos em bucket `event-certificates` no Supabase Storage.

7. **Performance:** Ao marcar múltiplos participantes, processamento pode levar alguns segundos.

---

**Plano criado por:** Claude Code
**Data:** 30/01/2025 11:30
**Status:** ✅ PRONTO PARA EXECUÇÃO
**Próximo passo:** Executar testes seguindo a ordem recomendada