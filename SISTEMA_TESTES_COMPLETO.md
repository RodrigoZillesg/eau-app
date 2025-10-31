# 🧪 SISTEMA DE TESTES COMPLETO - EAU Members Platform

**Última Atualização:** 30/01/2025
**Propósito:** Documento master contendo todos os testes e validações do sistema

---

## 📖 ÍNDICE

1. [Como Usar Este Documento](#como-usar-este-documento)
2. [Testes de Autenticação](#testes-de-autenticação)
3. [Testes do Sistema CPD](#testes-do-sistema-cpd)
4. [Testes do Sistema de Eventos](#testes-do-sistema-de-eventos)
5. [Testes de Gerenciamento de Membros](#testes-de-gerenciamento-de-membros)
6. [Testes de Instituições](#testes-de-instituições)
7. [Testes de Permissões e Roles](#testes-de-permissões-e-roles)
8. [Testes de Email e Notificações](#testes-de-email-e-notificações)
9. [Testes de Importação de Dados](#testes-de-importação-de-dados)
10. [Checklist de Teste Rápido](#checklist-de-teste-rápido)

---

## 🎯 COMO USAR ESTE DOCUMENTO

### Para Testes Completos do Sistema
```bash
Comando: "Faça o teste completo do sistema"
Ação: Executar TODOS os testes deste documento sequencialmente
Tempo estimado: 4-6 horas
```

### Para Testes de Funcionalidade Específica
```bash
Comando: "Faça o teste do sistema CPD"
Ação: Executar apenas seção "Testes do Sistema CPD"
Tempo estimado: 30-60 minutos
```

### Para Teste Rápido (Smoke Test)
```bash
Comando: "Faça o teste rápido do sistema"
Ação: Executar "Checklist de Teste Rápido"
Tempo estimado: 15-20 minutos
```

### Quando Adicionar Novos Testes
1. Criar nova seção com número sequencial
2. Seguir estrutura padrão: Pré-requisitos → Passos → Validação
3. Incluir queries SQL para verificação
4. Adicionar ao índice
5. Atualizar data de última atualização

---

## 🔐 TESTES DE AUTENTICAÇÃO

### PRÉ-REQUISITOS
- [ ] Sistema rodando (frontend + backend)
- [ ] Banco de dados populado com usuários de teste
- [ ] Credenciais conhecidas

---

### TESTE 1.1: Login com Credenciais Válidas

**Objetivo:** Verificar que usuário consegue fazer login com email/senha corretos

**Passos:**
```bash
1. Acessar http://localhost:5180/login
2. Inserir email: dev@platty.tech
3. Inserir senha: wSZ72i-M7X[bV)Hdu%Qi0V03hf8f%6
4. Clicar em "Sign In"
```

**Validação Esperada:**
- ✅ Redirecionamento para /dashboard
- ✅ Header mostra email do usuário
- ✅ Menu lateral carregado
- ✅ Token JWT armazenado no sessionStorage
- ✅ Roles carregadas corretamente

**SQL Validação:**
```sql
SELECT id, email, created_at, last_sign_in_at
FROM auth.users
WHERE email = 'dev@platty.tech';
```

---

### TESTE 1.2: Login com Credenciais Inválidas

**Objetivo:** Verificar rejeição de credenciais incorretas

**Passos:**
```bash
1. Acessar http://localhost:5180/login
2. Inserir email: test@example.com
3. Inserir senha: wrongpassword
4. Clicar em "Sign In"
```

**Validação Esperada:**
- ✅ Mensagem de erro: "Invalid login credentials"
- ✅ Permanece na tela de login
- ✅ Campos não são limpos (permite correção)
- ✅ Sem token armazenado

---

### TESTE 1.3: Logout

**Objetivo:** Verificar que logout limpa sessão corretamente

**Passos:**
```bash
1. Estando logado
2. Clicar no menu do usuário (header)
3. Clicar em "Logout"
```

**Validação Esperada:**
- ✅ Redirecionamento para /login
- ✅ sessionStorage limpo
- ✅ Tentativa de acessar /dashboard redireciona para login
- ✅ Token invalidado

---

### TESTE 1.4: Proteção de Rotas

**Objetivo:** Verificar que rotas protegidas não são acessíveis sem autenticação

**Passos:**
```bash
1. Sem estar logado
2. Tentar acessar http://localhost:5180/dashboard
3. Tentar acessar http://localhost:5180/cpd
4. Tentar acessar http://localhost:5180/events
```

**Validação Esperada:**
- ✅ Todas redirecionam para /login
- ✅ Mensagem: "Please sign in to continue"
- ✅ Após login, redireciona para página original tentada

---

### TESTE 1.5: Recuperação de Sessão

**Objetivo:** Verificar que sessão persiste ao recarregar página

**Passos:**
```bash
1. Login com sucesso
2. Navegar para /cpd
3. Pressionar F5 (reload)
4. Aguardar carregamento
```

**Validação Esperada:**
- ✅ Permanece logado
- ✅ Página /cpd carrega normalmente
- ✅ Sem redirecionamento para login
- ✅ Dados do usuário preservados
- ✅ Roles mantidas

---

## 📚 TESTES DO SISTEMA CPD

### PRÉ-REQUISITOS
- [ ] Usuário logado (membro regular)
- [ ] Sistema CPD configurado
- [ ] Categorias CPD disponíveis
- [ ] Meta anual configurada (20 pontos)

---

### TESTE 2.1: Inserção Manual de Atividade CPD

**Objetivo:** Verificar que membro consegue criar atividade CPD manualmente

**Passos:**
```bash
1. Login como membro
2. Acessar http://localhost:5180/cpd
3. Clicar em "Add New Activity"
4. Preencher formulário:
   - Category: "Attend industry PD event"
   - Activity Title: "Workshop - Testing CPD System"
   - Description: "Testing manual CPD activity creation"
   - Provider: "Test Provider Inc"
   - Date: Data atual
   - Duration: 3 hours 0 minutes
5. Clicar em "Add Activity"
```

**Validação Esperada:**
- ✅ Modal abre corretamente
- ✅ Todos os campos disponíveis
- ✅ Campo "Estimated Points" calcula automaticamente (3.0)
- ✅ Notificação: "CPD activity added and automatically approved!"
- ✅ Atividade aparece na lista imediatamente
- ✅ Status: "Approved"
- ✅ Pontos corretos (3.0)

**SQL Validação:**
```sql
SELECT id, activity_title, cpd_points, status, activity_date, user_id
FROM cpd_activities
WHERE activity_title = 'Workshop - Testing CPD System'
ORDER BY created_at DESC
LIMIT 1;
```

**Validação Adicional:**
```sql
-- Verificar que user_id referencia auth.users.id
SELECT ca.id, ca.activity_title, ca.user_id, au.email
FROM cpd_activities ca
JOIN auth.users au ON au.id = ca.user_id
WHERE ca.activity_title = 'Workshop - Testing CPD System';
```

---

### TESTE 2.2: Cálculo Automático de Pontos

**Objetivo:** Verificar que pontos são calculados corretamente baseado em duração

**Passos:**
```bash
1. Acessar formulário de nova atividade
2. Selecionar category: "Attend industry webinar" (1 ponto/hora)
3. Inserir duração: 2 hours 30 minutes
4. Observar campo "Estimated Points"
```

**Validação Esperada:**
- ✅ Pontos calculados: 2.5
- ✅ Cálculo: (2 + 30/60) * 1 = 2.5
- ✅ Atualização em tempo real ao mudar duração
- ✅ Pontos salvos corretamente no banco

**Testes de Categorias Diferentes:**
| Categoria | Pontos/Hora | Duração | Esperado |
|-----------|-------------|---------|----------|
| Read journal article | 0.5 | 2h 0m | 1.0 |
| Present at industry event | 2.0 | 1h 30m | 3.0 |
| Attend EA webinar | 1.0 | 1h 0m | 1.0 |

---

### TESTE 2.3: Visualização de Atividades

**Objetivo:** Verificar que lista de atividades exibe dados corretos

**Passos:**
```bash
1. Acessar http://localhost:5180/cpd
2. Verificar lista de atividades
3. Verificar cada coluna da tabela
```

**Validação Esperada:**
- ✅ Colunas visíveis: Date, Activity, Category, Points, Status, Evidence
- ✅ Datas formatadas: "DD MMM YYYY" (ex: "30 Jan 2025")
- ✅ Atividade mostra título e provider
- ✅ Category exibe nome correto
- ✅ Points mostra valor decimal (ex: "3.0")
- ✅ Status com badge colorido (verde = approved)
- ✅ Evidence mostra "View" se existe, "-" se não

**Validação de Ordenação:**
- ✅ Atividades ordenadas por data (mais recentes primeiro)

---

### TESTE 2.4: Barra de Progresso Anual

**Objetivo:** Verificar cálculo e exibição da barra de progresso

**Passos:**
```bash
1. Acessar http://localhost:5180/cpd
2. Observar card "2025 Annual Progress"
3. Verificar cards de estatísticas
```

**Validação Esperada:**

**Barra de Progresso:**
- ✅ Mostra pontos ganhos no ano selecionado
- ✅ Mostra meta anual (20 pontos)
- ✅ Porcentagem calculada corretamente: (pontos/meta) * 100
- ✅ Barra visual preenchida proporcionalmente
- ✅ Cor da barra:
  - 🟢 Verde se >= 100%
  - 🟡 Amarelo se >= 50% e < 100%
  - 🔴 Vermelho se < 50%
- ✅ Mensagem de congratulações se >= 100%

**Cards de Estatísticas:**
- ✅ **Total Points:** Soma de TODAS atividades aprovadas
- ✅ **2025 Points:** Soma de atividades aprovadas de 2025
- ✅ **Activities:** Contagem total de atividades
- ✅ **Goal Progress:** Porcentagem em relação à meta

**SQL Validação:**
```sql
-- Verificar pontos totais
SELECT SUM(cpd_points) as total_points
FROM cpd_activities
WHERE user_id = '[USER_ID]'
AND status = 'approved';

-- Verificar pontos de 2025
SELECT SUM(cpd_points) as year_points
FROM cpd_activities
WHERE user_id = '[USER_ID]'
AND status = 'approved'
AND EXTRACT(YEAR FROM activity_date) = 2025;

-- Verificar contagem
SELECT COUNT(*) as total_activities
FROM cpd_activities
WHERE user_id = '[USER_ID]';
```

---

### TESTE 2.5: Filtros e Busca

**Objetivo:** Verificar funcionalidade de filtros e busca

**Passos:**
```bash
1. Acessar http://localhost:5180/cpd
2. Testar filtro de status
3. Testar busca por texto
4. Testar filtro de ano
```

**Validação - Filtro de Status:**
```bash
1. Selecionar "Approved"
   - ✅ Mostra apenas atividades aprovadas
2. Selecionar "Rejected"
   - ✅ Mostra apenas rejeitadas (ou vazio)
3. Selecionar "All Status"
   - ✅ Mostra todas as atividades
```

**Validação - Busca:**
```bash
1. Digitar título de atividade
   - ✅ Filtra atividades que contêm texto no título
2. Digitar nome de provider
   - ✅ Filtra por provider
3. Digitar nome de categoria
   - ✅ Filtra por categoria
4. Busca case-insensitive
   - ✅ "workshop" encontra "Workshop"
```

**Validação - Filtro de Ano:**
```bash
1. Selecionar 2025
   - ✅ Mostra apenas atividades de 2025
2. Selecionar 2024
   - ✅ Mostra apenas de 2024
3. Estatísticas atualizam conforme ano
```

---

### TESTE 2.6: Upload de Evidência

**Objetivo:** Verificar upload e visualização de evidência

**Passos:**
```bash
1. Criar nova atividade
2. Fazer upload de arquivo (PDF, JPG, ou PNG)
3. Salvar atividade
4. Verificar coluna "Evidence"
5. Clicar em "View"
```

**Validação Esperada:**
- ✅ Upload aceita PDF, JPG, PNG, DOC, DOCX
- ✅ Limite de 10MB respeitado
- ✅ Arquivo armazenado (base64 ou storage)
- ✅ Botão "View" visível
- ✅ Botão "Download" disponível (se base64)
- ✅ Clicar em "View" abre arquivo em nova aba
- ✅ Download funciona corretamente

---

### TESTE 2.7: Auto-Aprovação de Atividades

**Objetivo:** Verificar que atividades manuais são auto-aprovadas

**Passos:**
```bash
1. Criar nova atividade CPD
2. Submeter
3. Verificar status imediatamente
```

**Validação Esperada:**
- ✅ Status = "approved" imediatamente
- ✅ Sem status "pending"
- ✅ Pontos contabilizados imediatamente
- ✅ Barra de progresso atualiza instantaneamente
- ✅ Notificação: "automatically approved"

---

### TESTE 2.8: Integração CPD com Eventos

**Objetivo:** Verificar criação automática de CPD ao participar de evento

**Passos:**
```bash
1. Admin cria evento com CPD points configurados
2. Membro se inscreve no evento
3. Admin marca membro como "Attended"
4. Membro verifica sua página de CPD
```

**Validação Esperada:**
- ✅ Atividade CPD criada automaticamente
- ✅ Title: "Event: [Event Name]"
- ✅ Provider: "English Australia"
- ✅ Category: [Configurada no evento]
- ✅ Points: [Configurados no evento]
- ✅ Status: "approved" (auto-aprovado)
- ✅ Evidence: Link para certificado do evento
- ✅ Campo event_id preenchido

**SQL Validação:**
```sql
SELECT ca.id, ca.activity_title, ca.cpd_points, ca.event_id,
       ca.certificate_url, ca.status, e.title as event_title
FROM cpd_activities ca
JOIN events e ON e.id = ca.event_id
WHERE ca.user_id = '[USER_ID]'
AND ca.event_id IS NOT NULL
ORDER BY ca.created_at DESC;
```

---

### TESTE 2.9: Edição de Atividade

**Objetivo:** Verificar que membros podem editar suas atividades

**Passos:**
```bash
1. Localizar atividade existente
2. Clicar em "Edit"
3. Alterar campos
4. Salvar
```

**Validação Esperada:**
- ✅ Modal de edição abre com dados preenchidos
- ✅ Permite alterar: título, descrição, provider, duração
- ✅ Não permite alterar: categoria, data (dependendo das regras)
- ✅ Pontos recalculados se duração mudar
- ✅ Notificação: "CPD activity updated successfully!"
- ✅ Mudanças refletidas na lista

---

### TESTE 2.10: Exclusão de Atividade

**Objetivo:** Verificar que membros podem deletar suas atividades

**Passos:**
```bash
1. Localizar atividade
2. Clicar em "Delete"
3. Confirmar exclusão
```

**Validação Esperada:**
- ✅ Modal de confirmação aparece
- ✅ Aviso sobre exclusão permanente
- ✅ Ao confirmar: "CPD activity deleted successfully!"
- ✅ Atividade removida da lista
- ✅ Pontos recalculados automaticamente
- ✅ Barra de progresso atualizada
- ✅ Registro deletado do banco

---

## 🎪 TESTES DO SISTEMA DE EVENTOS

### PRÉ-REQUISITOS
- [ ] SMTP configurado
- [ ] Backend rodando (porta 3001)
- [ ] Email server funcionando
- [ ] Usuários de diferentes tipos de membership

---

### TESTE 3.1: Criação de Evento por Admin

**Objetivo:** Verificar que admin/superadmin consegue criar evento

**Passos:**
```bash
1. Login como Admin (dev@platty.tech)
2. Acessar http://localhost:5180/events
3. Clicar em "Create New Event"
4. Preencher formulário:
   - Title: "Test Event - Workshop"
   - Description: "Testing event creation"
   - Event Type: "Workshop"
   - Location Type: "Virtual"
   - Virtual Link: "https://zoom.us/j/123456789"
   - Start Date: Amanhã 14:00
   - End Date: Amanhã 16:00
   - Timezone: "Australia/Sydney"
   - Capacity: 50
   - Registration End: Hoje 23:59
   - CPD Points: 2
   - CPD Category: "Attend English Australia PD event"
   - Eligible Types: [x] Member Colleges, [x] Professional Affiliates
5. Clicar em "Create Event"
```

**Validação Esperada:**
- ✅ Modal abre corretamente
- ✅ Todos os campos disponíveis
- ✅ Validação de campos obrigatórios (*)
- ✅ Validação: end_date > start_date
- ✅ Validação: registration_end <= start_date
- ✅ Virtual link obrigatório se location_type = "Virtual"
- ✅ Notificação: "Event created successfully!"
- ✅ Evento aparece na lista
- ✅ Slug gerado automaticamente

**SQL Validação:**
```sql
SELECT id, title, slug, location_type, virtual_link,
       start_date, end_date, capacity, cpd_points,
       eligible_member_types, created_at
FROM events
WHERE title = 'Test Event - Workshop'
ORDER BY created_at DESC
LIMIT 1;
```

---

### TESTE 3.2: Inscrição de Membro Elegível

**Objetivo:** Verificar que membro elegível consegue se inscrever

**Passos:**
```bash
1. Logout do admin
2. Login como membro (tipo: Member College)
3. Acessar http://localhost:5180/events
4. Clicar no evento "Test Event - Workshop"
5. Verificar elegibilidade
6. Clicar em "Register for Event"
7. Confirmar no modal
```

**Validação Esperada:**
- ✅ Botão "Register" visível para membro elegível
- ✅ Texto mostra tipos elegíveis
- ✅ Modal de confirmação abre
- ✅ Detalhes do evento corretos
- ✅ Notificação: "Successfully registered for event!"
- ✅ Botão muda para "Registered" (disabled)
- ✅ Email de confirmação enviado
- ✅ Contador de vagas atualiza

**SQL Validação:**
```sql
SELECT er.id, er.status, er.registration_date,
       m.email, m.user_type, e.title
FROM event_registrations er
JOIN members m ON m.id = er.member_id
JOIN events e ON e.id = er.event_id
WHERE e.title = 'Test Event - Workshop'
AND m.email = '[MEMBER_EMAIL]'
ORDER BY er.created_at DESC
LIMIT 1;
```

---

### TESTE 3.3: Rejeição de Membro Não Elegível

**Objetivo:** Verificar que membro não elegível não consegue se inscrever

**Passos:**
```bash
1. Login como membro (tipo: Corporate Affiliate)
   - Evento aceita apenas: Member Colleges, Professional Affiliates
2. Acessar página do evento
3. Tentar se inscrever
```

**Validação Esperada:**
- ✅ Mensagem: "This event is not available for your membership type"
- ✅ Botão "Register" não aparece ou está desabilitado
- ✅ Tipos elegíveis exibidos claramente
- ✅ Impossível fazer inscrição mesmo via API

---

### TESTE 3.4: Evento Lotado

**Objetivo:** Verificar que evento respeita limite de capacidade

**Passos:**
```bash
1. Admin: Criar evento com capacity = 1
2. Membro 1: Inscrever-se (sucesso)
3. Membro 2: Tentar inscrever-se
```

**Validação Esperada:**
- ✅ Membro 1: Inscrição bem-sucedida
- ✅ Contador: "0 / 1 spots available"
- ✅ Membro 2: Mensagem "Event is full"
- ✅ Membro 2: Botão "Register" desabilitado
- ✅ Badge "FULL" exibido no card do evento

---

### TESTE 3.5: Inscrição Após Deadline

**Objetivo:** Verificar que inscrição respeita prazo

**Passos:**
```bash
1. Admin: Criar evento com registration_end = ontem
2. Membro: Tentar se inscrever
```

**Validação Esperada:**
- ✅ Mensagem: "Registration closed"
- ✅ Botão "Register" desabilitado
- ✅ Badge "REGISTRATION CLOSED"
- ✅ Data de encerramento exibida

---

### TESTE 3.6: Email de Confirmação de Inscrição

**Objetivo:** Verificar envio de email de confirmação

**Passos:**
```bash
1. Membro se inscreve no evento (Teste 3.2)
2. Verificar email do membro
3. Verificar console do backend
4. Acessar http://localhost:3001 (dashboard emails)
```

**Validação Esperada:**
- ✅ Console backend: "Email sent successfully"
- ✅ Email recebido pelo membro
- ✅ Subject: "Registration Confirmation - [Event Title]"
- ✅ Email contém:
  - Nome do evento
  - Data e hora (com timezone)
  - Local ou link virtual
  - CPD points que serão ganhos
  - Botão "View Event Details"
  - Instruções de como acessar
- ✅ Template HTML responsivo
- ✅ Logo English Australia
- ✅ From: [Configurado no SMTP]

---

### TESTE 3.7: Email para Admin - Nova Inscrição

**Objetivo:** Verificar que admin recebe notificação de inscrição

**Passos:**
```bash
1. Membro se inscreve no evento
2. Verificar email do admin
```

**Validação Esperada:**
- ✅ Email recebido pelo admin
- ✅ Subject: "New Registration - [Event Title]"
- ✅ Email contém:
  - Nome do evento
  - Nome do membro
  - Email do membro
  - Tipo de membership
  - Data/hora da inscrição
  - Total de inscritos agora
  - Link para gerenciar evento
- ✅ Template profissional

---

### TESTE 3.8: Visualização de Inscritos pelo Admin

**Objetivo:** Verificar que admin vê lista de inscritos

**Passos:**
```bash
1. Login como Admin
2. Acessar http://localhost:5180/events
3. Clicar no evento
4. Clicar em "Attendees" ou "Registrations"
```

**Validação Esperada:**
- ✅ Lista completa de inscritos
- ✅ Colunas visíveis:
  - Nome completo
  - Email
  - Membership type
  - Registration date
  - Status (Registered/Attended/Cancelled)
  - Ações
- ✅ Contador: "X / Y spots filled"
- ✅ Paginação (se > 50 inscritos)
- ✅ Busca funciona
- ✅ Filtro por status funciona

---

### TESTE 3.9: Marcar Presença

**Objetivo:** Verificar marcação de presença por admin

**Passos:**
```bash
1. Admin na lista de inscritos
2. Localizar membro
3. Clicar em "Mark as Attended"
4. Confirmar ação
```

**Validação Esperada:**
- ✅ Modal de confirmação
- ✅ Status muda para "Attended"
- ✅ Badge verde
- ✅ Campo attended_at preenchido
- ✅ Notificação: "Attendance marked successfully"
- ✅ Trigger para CPD e certificado (Teste 3.17)

**SQL Validação:**
```sql
SELECT er.id, er.attendance_status, er.attended_at,
       m.email, e.title
FROM event_registrations er
JOIN members m ON m.id = er.member_id
JOIN events e ON e.id = er.event_id
WHERE er.attendance_status = 'attended'
AND e.title = '[EVENT_TITLE]'
ORDER BY er.attended_at DESC;
```

---

### TESTE 3.10: Cancelamento de Inscrição pelo Admin

**Objetivo:** Verificar que admin pode cancelar inscrição

**Passos:**
```bash
1. Admin na lista de inscritos
2. Clicar em "Cancel Registration"
3. Confirmar
```

**Validação Esperada:**
- ✅ Modal de confirmação
- ✅ Status muda para "Cancelled"
- ✅ Vaga liberada (contador atualiza)
- ✅ Email de cancelamento enviado ao membro
- ✅ Membro não pode mais acessar evento

---

### TESTE 3.11: Export CSV de Inscritos

**Objetivo:** Verificar exportação de lista

**Passos:**
```bash
1. Admin na página de inscritos
2. Clicar em "Export to CSV"
3. Verificar arquivo baixado
```

**Validação Esperada:**
- ✅ Arquivo CSV baixado
- ✅ Nome: "[event-slug]-registrations-[date].csv"
- ✅ Colunas: Name, Email, Membership Type, Registration Date, Status
- ✅ Todos os inscritos incluídos
- ✅ Dados corretos

---

### TESTE 3.12: Link do Evento - Antes de Ativar

**Objetivo:** Verificar que link fica desabilitado até 30 min antes

**Passos:**
```bash
Cenário: Evento começa em 2 horas

1. Login como membro inscrito
2. Acessar página do evento
3. Verificar botão do link virtual
```

**Validação Esperada:**
- ✅ Link visível mas desabilitado (cinza)
- ✅ Mensagem: "Event link will be available 30 minutes before start"
- ✅ Countdown timer exibido
- ✅ Detalhes do evento visíveis
- ✅ Botão não clicável

---

### TESTE 3.13: Link do Evento - 30 Minutos Antes

**Objetivo:** Verificar ativação do link 30 min antes

**Passos:**
```bash
Cenário: Faltam 30 minutos para o evento

Opção 1: Alterar start_date do evento para now + 30 min
Opção 2: Aguardar tempo real

1. Recarregar página do evento
2. Verificar botão
```

**Validação Esperada:**
- ✅ Botão "Join Event" ativo
- ✅ Cor destacada (verde/azul)
- ✅ Mensagem: "Event starting soon - Join now!"
- ✅ Ao clicar, abre link em nova aba
- ✅ URL correta (virtual_link do evento)

---

### TESTE 3.14: Link Durante o Evento

**Objetivo:** Verificar link ativo durante evento

**Passos:**
```bash
Cenário: Hora atual entre start_date e end_date

1. Acessar página do evento
2. Verificar botão
```

**Validação Esperada:**
- ✅ Botão "Join Live Event" ativo
- ✅ Badge "LIVE" pulsando
- ✅ Cor destacada
- ✅ Mensagem: "Event is live now!"
- ✅ Link funcional

---

### TESTE 3.15: Link Após o Evento

**Objetivo:** Verificar desativação após término

**Passos:**
```bash
Cenário: Hora atual > end_date

1. Acessar página do evento
2. Verificar status
```

**Validação Esperada:**
- ✅ Botão desabilitado
- ✅ Badge "COMPLETED"
- ✅ Mensagem: "Event has ended"
- ✅ Se participou: Link para certificado visível
- ✅ Se não participou: Mensagem informativa

---

### TESTE 3.16: Configurações SMTP

**Objetivo:** Verificar que emails usam configuração do banco

**Passos:**
```bash
1. Login como SuperAdmin
2. Acessar http://localhost:5180/admin/smtp-settings
3. Verificar configurações atuais
4. Clicar em "Test Connection"
5. Alterar "From Name"
6. Salvar
7. Disparar novo email (nova inscrição)
8. Verificar email recebido
```

**Validação Esperada:**
- ✅ Configurações exibidas corretamente
- ✅ Senha obscurecida
- ✅ Teste de conexão: "SMTP connection successful!"
- ✅ Email de teste recebido
- ✅ Mudança de "From Name" aplicada imediatamente
- ✅ Próximo email usa novo "From Name"
- ✅ Sem necessidade de restart

**SQL Validação:**
```sql
SELECT id, smtp_host, smtp_port, smtp_user,
       from_email, from_name, updated_at
FROM smtp_settings
ORDER BY updated_at DESC
LIMIT 1;
```

---

### TESTE 3.17: Geração Automática de CPD

**Objetivo:** Verificar criação automática de CPD ao marcar presença

**Passos:**
```bash
1. Admin marca membro como "Attended" (Teste 3.9)
2. Verificar console do backend
3. Login como membro
4. Acessar http://localhost:5180/cpd
5. Verificar lista de atividades
```

**Validação Esperada:**
- ✅ Console: "CPD activity created successfully"
- ✅ Nova atividade CPD aparece
- ✅ Title: "Event: [Event Title]"
- ✅ Provider: "English Australia"
- ✅ Category: [CPD Category do evento]
- ✅ Points: [CPD Points do evento]
- ✅ Status: "approved" (auto-aprovado)
- ✅ Date: Data do evento
- ✅ Event ID preenchido
- ✅ Evidence: Link para certificado

**SQL Validação:**
```sql
SELECT ca.id, ca.activity_title, ca.cpd_points, ca.status,
       ca.event_id, ca.certificate_url, e.title
FROM cpd_activities ca
JOIN events e ON e.id = ca.event_id
WHERE ca.event_id = '[EVENT_ID]'
AND ca.user_id = '[USER_ID]'
ORDER BY ca.created_at DESC
LIMIT 1;
```

---

### TESTE 3.18: Geração Automática de Certificado

**Objetivo:** Verificar criação de certificado PDF

**Passos:**
```bash
1. Admin marca membro como "Attended"
2. Aguardar processamento
3. Verificar banco de dados
4. Acessar URL do certificado
```

**Validação Esperada:**
- ✅ Console: "Certificate generated successfully"
- ✅ Registro em event_certificates criado
- ✅ Certificate number único gerado
- ✅ Certificate URL presente
- ✅ PDF gerado e acessível
- ✅ PDF contém:
  - Nome do membro
  - Título do evento
  - Data do evento
  - CPD points
  - Certificate number
  - Logo English Australia
  - Formatação profissional

**SQL Validação:**
```sql
SELECT ec.id, ec.certificate_number, ec.certificate_url,
       ec.issued_date, ec.cpd_points, m.email, e.title
FROM event_certificates ec
JOIN members m ON m.id = ec.member_id
JOIN events e ON e.id = ec.event_id
WHERE ec.event_id = '[EVENT_ID]'
AND m.email = '[MEMBER_EMAIL]'
ORDER BY ec.created_at DESC
LIMIT 1;
```

---

### TESTE 3.19: Email com Certificado

**Objetivo:** Verificar envio de email com certificado

**Passos:**
```bash
1. Após marcar presença e gerar certificado
2. Verificar email do membro
```

**Validação Esperada:**
- ✅ Email recebido
- ✅ Subject: "Certificate - [Event Title]"
- ✅ Email contém:
  - Mensagem de congratulações
  - Nome do evento
  - CPD points ganhos
  - Link para download do certificado
  - Botão "Download Certificate"
  - Link para página de CPD
  - Certificate number
- ✅ Template HTML profissional

---

### TESTE 3.20: Atualização da Barra CPD Após Evento

**Objetivo:** Verificar que barra de progresso atualiza

**Passos:**
```bash
1. Membro participa de evento (2 CPD points)
2. Admin marca presença
3. Login como membro
4. Acessar http://localhost:5180/cpd
5. Verificar cards de estatísticas
```

**Validação Esperada:**
- ✅ Total Points aumentou (+2)
- ✅ 2025 Points aumentou (+2 se evento em 2025)
- ✅ Activities count aumentou (+1)
- ✅ Goal Progress recalculado
- ✅ Barra visual atualizada
- ✅ Porcentagem correta

---

### TESTE 3.21: Lembretes Automáticos - 7 Dias

**Objetivo:** Verificar envio de lembrete 7 dias antes

**Passos:**
```bash
Cenário: Evento marcado para daqui a 7 dias

1. Criar evento com start_date = now + 7 days
2. Membro se inscreve
3. Verificar backend scheduler
4. Aguardar tempo configurado
5. Verificar email
```

**Validação Esperada:**
- ✅ Console: "Sending 7 days reminder"
- ✅ Email enviado 7 dias antes (exato)
- ✅ Subject: "[Event Title] - Reminder: Event in 7 days"
- ✅ Email contém data/hora do evento
- ✅ Link para detalhes

---

### TESTE 3.22: Lembretes Automáticos - 3 Dias

**Validação Esperada:**
- ✅ Email enviado 3 dias antes
- ✅ Subject: "[Event Title] - Reminder: Event in 3 days"

---

### TESTE 3.23: Lembretes Automáticos - 1 Dia

**Validação Esperada:**
- ✅ Email enviado 24 horas antes
- ✅ Subject: "[Event Title] - Reminder: Event tomorrow"

---

### TESTE 3.24: Lembretes Automáticos - 30 Minutos

**Validação Esperada:**
- ✅ Email enviado 30 minutos antes
- ✅ Subject: "[Event Title] - Starting in 30 minutes!"
- ✅ Link virtual destacado
- ✅ Botão "Join Now" proeminente

---

### TESTE 3.25: Notificação "Event is Live"

**Validação Esperada:**
- ✅ Email enviado no horário de início
- ✅ Subject: "[Event Title] - Event is now live!"
- ✅ Link virtual em destaque
- ✅ Urgência no texto

---

### TESTE 3.26: Múltiplos Participantes

**Objetivo:** Verificar processamento em massa

**Passos:**
```bash
1. Admin marca 10 membros como "Attended" de uma vez
2. Aguardar processamento
3. Verificar que para cada um:
   - CPD criado
   - Certificado gerado
   - Email enviado
```

**Validação Esperada:**
- ✅ Todos os processos executados
- ✅ Certificate numbers únicos
- ✅ Sem duplicação
- ✅ Sem erros
- ✅ Performance aceitável (< 30 segundos para 10)

**SQL Validação:**
```sql
SELECT m.email,
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
GROUP BY m.email
HAVING COUNT(DISTINCT ca.id) = 0 OR COUNT(DISTINCT ec.id) = 0;
-- Se retornar resultados, há membros sem CPD ou certificado
```

---

## 👥 TESTES DE GERENCIAMENTO DE MEMBROS

### PRÉ-REQUISITOS
- [ ] Login como Admin/SuperAdmin
- [ ] Dados de membros no sistema

---

### TESTE 4.1: Visualização de Lista de Membros

**Objetivo:** Verificar listagem de membros

**Passos:**
```bash
1. Login como Admin
2. Acessar http://localhost:5180/admin/members
3. Verificar lista carregada
```

**Validação Esperada:**
- ✅ Lista de membros exibida
- ✅ Colunas: Name, Email, Membership Type, Status, Institution
- ✅ Paginação funcionando (50 por página)
- ✅ Total de membros exibido
- ✅ Loading state apropriado

---

### TESTE 4.2: Busca de Membros

**Objetivo:** Verificar funcionalidade de busca

**Passos:**
```bash
1. Na lista de membros
2. Digitar nome no campo de busca
3. Digitar email
4. Digitar nome parcial
```

**Validação Esperada:**
- ✅ Busca por nome completo funciona
- ✅ Busca por email funciona
- ✅ Busca parcial funciona (ex: "john" encontra "John Smith")
- ✅ Case-insensitive
- ✅ Resultados atualizam em tempo real
- ✅ Contador atualiza

---

### TESTE 4.3: Filtros de Membros

**Objetivo:** Verificar filtros

**Passos:**
```bash
1. Filtrar por Membership Type
2. Filtrar por Status (Active/Inactive)
3. Filtrar por Institution
4. Combinar múltiplos filtros
```

**Validação Esperada:**
- ✅ Filtro por tipo funciona
- ✅ Filtro por status funciona
- ✅ Filtro por instituição funciona
- ✅ Filtros combinam corretamente (AND)
- ✅ Contador atualiza
- ✅ Botão "Clear Filters" disponível

---

### TESTE 4.4: Criação de Membro

**Objetivo:** Verificar criação manual de membro

**Passos:**
```bash
1. Clicar em "Add New Member"
2. Preencher formulário:
   - First Name: "Test"
   - Last Name: "Member"
   - Email: "test.member@example.com"
   - Membership Type: "Member College"
   - Institution: [Selecionar uma]
   - Status: "Active"
3. Clicar em "Create Member"
```

**Validação Esperada:**
- ✅ Modal abre
- ✅ Campos obrigatórios marcados
- ✅ Validação de email
- ✅ Lista de instituições carregada
- ✅ Notificação: "Member created successfully!"
- ✅ Membro aparece na lista
- ✅ Email de boas-vindas enviado (opcional)
- ✅ Credenciais de login criadas

**SQL Validação:**
```sql
SELECT m.id, m.email, m.first_name, m.last_name,
       m.user_type, m.status, m.created_at,
       au.id as auth_user_id
FROM members m
LEFT JOIN auth.users au ON au.id = m.user_id
WHERE m.email = 'test.member@example.com'
ORDER BY m.created_at DESC
LIMIT 1;
```

---

### TESTE 4.5: Edição de Membro

**Objetivo:** Verificar edição de dados

**Passos:**
```bash
1. Localizar membro
2. Clicar em "Edit"
3. Alterar campos (nome, instituição, etc)
4. Salvar
```

**Validação Esperada:**
- ✅ Modal de edição abre com dados preenchidos
- ✅ Permite alterar: nome, email, tipo, instituição, status
- ✅ Validação de email único
- ✅ Notificação: "Member updated successfully!"
- ✅ Mudanças refletidas na lista
- ✅ Histórico de alterações registrado

---

### TESTE 4.6: Desativação de Membro

**Objetivo:** Verificar soft delete

**Passos:**
```bash
1. Localizar membro ativo
2. Clicar em "Deactivate"
3. Confirmar
```

**Validação Esperada:**
- ✅ Modal de confirmação
- ✅ Aviso sobre consequências
- ✅ Status muda para "Inactive"
- ✅ Membro não pode mais fazer login
- ✅ Dados preservados
- ✅ Aparece em filtro "Inactive"

---

### TESTE 4.7: Reativação de Membro

**Objetivo:** Verificar reativação

**Passos:**
```bash
1. Filtrar por "Inactive"
2. Localizar membro
3. Clicar em "Activate"
4. Confirmar
```

**Validação Esperada:**
- ✅ Status muda para "Active"
- ✅ Membro pode fazer login novamente
- ✅ Acesso restaurado
- ✅ Notificação enviada ao membro

---

### TESTE 4.8: Exclusão Permanente

**Objetivo:** Verificar hard delete

**Passos:**
```bash
1. Localizar membro (preferivelmente inativo)
2. Clicar em "Delete"
3. Confirmar exclusão permanente
```

**Validação Esperada:**
- ✅ Modal de confirmação forte
- ✅ Aviso: "This action cannot be undone"
- ✅ Requer confirmação adicional (digitar DELETE ou similar)
- ✅ Membro removido do banco
- ✅ Registros relacionados tratados (cascade ou erro)

---

### TESTE 4.9: Impersonation

**Objetivo:** Verificar que admin pode ver como membro

**Passos:**
```bash
1. Localizar membro
2. Clicar em "View as Member"
3. Navegar pelo sistema
4. Clicar em "Exit Impersonation"
```

**Validação Esperada:**
- ✅ Banner de impersonation visível
- ✅ Banner mostra: "Viewing as [Member Name]"
- ✅ Sistema mostra interface de membro
- ✅ Permissões de membro aplicadas
- ✅ Botão "Exit Impersonation" sempre visível
- ✅ Ao sair, retorna para admin
- ✅ Nenhuma ação permanente durante impersonation

---

### TESTE 4.10: Export de Membros

**Objetivo:** Verificar exportação

**Passos:**
```bash
1. Na lista de membros
2. Aplicar filtros (opcional)
3. Clicar em "Export to CSV"
4. Verificar arquivo baixado
```

**Validação Esperada:**
- ✅ Arquivo CSV baixado
- ✅ Nome: "members-export-[date].csv"
- ✅ Contém membros filtrados ou todos
- ✅ Colunas: Name, Email, Type, Institution, Status, etc
- ✅ Dados corretos
- ✅ Encoding UTF-8

---

### TESTE 4.11: Bulk Operations

**Objetivo:** Verificar operações em massa

**Passos:**
```bash
1. Selecionar múltiplos membros (checkbox)
2. Escolher ação: "Deactivate Selected"
3. Confirmar
```

**Validação Esperada:**
- ✅ Checkbox "Select All" funciona
- ✅ Seleção individual funciona
- ✅ Contador de selecionados
- ✅ Ações em massa disponíveis:
  - Deactivate
  - Change membership type
  - Send email
  - Export selected
- ✅ Modal de confirmação
- ✅ Processamento com progress bar
- ✅ Notificação de sucesso com count

---

## 🏢 TESTES DE INSTITUIÇÕES

### PRÉ-REQUISITOS
- [ ] Login como Admin/SuperAdmin
- [ ] Dados de instituições no sistema

---

### TESTE 5.1: Listagem de Instituições

**Objetivo:** Verificar lista de instituições

**Passos:**
```bash
1. Login como Admin
2. Acessar http://localhost:5180/admin/institutions
3. Verificar lista
```

**Validação Esperada:**
- ✅ Lista de instituições exibida
- ✅ Colunas: Name, ABN, Type, Members Count, Status
- ✅ Paginação
- ✅ Busca funciona

---

### TESTE 5.2: Criação de Instituição

**Objetivo:** Verificar criação

**Passos:**
```bash
1. Clicar em "Add New Institution"
2. Preencher:
   - Name: "Test College"
   - ABN: "12345678901"
   - Type: "Language College"
   - Address
   - Contact details
3. Salvar
```

**Validação Esperada:**
- ✅ Todos os campos disponíveis
- ✅ Validação de ABN (11 dígitos)
- ✅ Criação bem-sucedida
- ✅ Aparece na lista

**SQL Validação:**
```sql
SELECT id, name, abn, institution_type, created_at
FROM institutions
WHERE name = 'Test College'
ORDER BY created_at DESC
LIMIT 1;
```

---

### TESTE 5.3: Visualização de Membros da Instituição

**Objetivo:** Verificar lista de membros

**Passos:**
```bash
1. Clicar em instituição
2. Ver aba "Members"
```

**Validação Esperada:**
- ✅ Lista de membros da instituição
- ✅ Contador correto
- ✅ Detalhes de cada membro

---

### TESTE 5.4: Edição de Instituição

**Objetivo:** Verificar edição

**Passos:**
```bash
1. Clicar em "Edit"
2. Alterar dados
3. Salvar
```

**Validação Esperada:**
- ✅ Edição bem-sucedida
- ✅ Dados atualizados
- ✅ Histórico registrado

---

## 🔐 TESTES DE PERMISSÕES E ROLES

### PRÉ-REQUISITOS
- [ ] Usuários com diferentes roles
- [ ] Sistema de permissões configurado

---

### TESTE 6.1: SuperAdmin - Acesso Total

**Objetivo:** Verificar que SuperAdmin tem acesso a tudo

**Passos:**
```bash
1. Login como SuperAdmin
2. Tentar acessar:
   - /dashboard
   - /admin/members
   - /admin/institutions
   - /admin/smtp-settings
   - /cpd/management
   - /events/management
```

**Validação Esperada:**
- ✅ Acesso a todas as rotas
- ✅ Todas as funcionalidades disponíveis
- ✅ Sem mensagens de "Permission Denied"

---

### TESTE 6.2: Admin - Acesso Limitado

**Objetivo:** Verificar permissões de Admin

**Passos:**
```bash
1. Login como Admin
2. Tentar acessar rotas restritas
```

**Validação Esperada:**
- ✅ Acesso a dashboards
- ✅ Acesso a gerenciamento de membros
- ✅ Acesso a eventos
- ❌ Sem acesso a configurações técnicas
- ❌ Sem acesso a SMTP settings (apenas SuperAdmin)

---

### TESTE 6.3: Institution Admin - Escopo Limitado

**Objetivo:** Verificar que vê apenas sua instituição

**Passos:**
```bash
1. Login como Institution Admin
2. Acessar lista de membros
3. Verificar filtros
```

**Validação Esperada:**
- ✅ Vê apenas membros da sua instituição
- ✅ Não pode acessar outras instituições
- ✅ Pode gerenciar membros da sua instituição
- ❌ Não pode criar novas instituições

---

### TESTE 6.4: Member - Acesso Restrito

**Objetivo:** Verificar que membro vê apenas suas informações

**Passos:**
```bash
1. Login como Member
2. Tentar acessar rotas admin
```

**Validação Esperada:**
- ✅ Acesso a seu dashboard
- ✅ Acesso a seu CPD
- ✅ Acesso a eventos
- ❌ Sem acesso a /admin/*
- ❌ Redirecionamento se tentar acessar rotas restritas

---

### TESTE 6.5: Mudança de Role em Tempo Real

**Objetivo:** Verificar que mudança de role atualiza permissões

**Passos:**
```bash
1. Admin muda role de membro de "Member" para "Admin"
2. Membro faz logout e login novamente
3. Verificar novas permissões
```

**Validação Esperada:**
- ✅ Novas permissões carregadas
- ✅ Acesso a novas funcionalidades
- ✅ Menu atualizado

---

## 📧 TESTES DE EMAIL E NOTIFICAÇÕES

### PRÉ-REQUISITOS
- [ ] SMTP configurado
- [ ] Backend rodando
- [ ] Email server funcionando

---

### TESTE 7.1: Configuração SMTP

**Objetivo:** Verificar configuração

**Teste já coberto em 3.16**

---

### TESTE 7.2: Email de Boas-Vindas

**Objetivo:** Verificar email ao criar novo membro

**Passos:**
```bash
1. Admin cria novo membro
2. Verificar email do membro
```

**Validação Esperada:**
- ✅ Email de boas-vindas enviado
- ✅ Contém credenciais temporárias ou link de setup
- ✅ Template profissional

---

### TESTE 7.3: Email de Reset de Senha

**Objetivo:** Verificar recuperação de senha

**Passos:**
```bash
1. Na tela de login
2. Clicar em "Forgot Password"
3. Inserir email
4. Verificar email recebido
5. Clicar no link
6. Redefinir senha
```

**Validação Esperada:**
- ✅ Email de reset enviado
- ✅ Link temporário (expira em 1 hora)
- ✅ Link funciona
- ✅ Pode redefinir senha
- ✅ Link expira após uso

---

### TESTE 7.4: Notificações em Tempo Real

**Objetivo:** Verificar notificações no sistema

**Passos:**
```bash
1. Admin logado
2. Outro admin cria evento
3. Verificar bell icon no header
```

**Validação Esperada:**
- ✅ Badge de notificação aparece
- ✅ Contador atualiza
- ✅ Clicar mostra lista de notificações
- ✅ Marcar como lida funciona

---

## 📊 TESTES DE IMPORTAÇÃO DE DADOS

### PRÉ-REQUISITOS
- [ ] Login como SuperAdmin
- [ ] Arquivo CSV de teste preparado

---

### TESTE 8.1: Importação de Membros

**Objetivo:** Verificar importação em massa

**Passos:**
```bash
1. Acessar http://localhost:5180/admin/import
2. Selecionar arquivo CSV
3. Mapear colunas
4. Iniciar importação
5. Monitorar progresso
```

**Validação Esperada:**
- ✅ Upload de arquivo funciona
- ✅ Preview dos dados
- ✅ Mapeamento de colunas
- ✅ Validação de dados
- ✅ Progress bar
- ✅ Pause/Resume funciona
- ✅ Log de erros se houver
- ✅ Resumo final: X imported, Y errors

---

### TESTE 8.2: Importação de Atividades CPD

**Objetivo:** Verificar importação de CPD

**Similar ao 8.1 mas para atividades CPD**

---

## ⚡ CHECKLIST DE TESTE RÁPIDO

**Tempo Estimado:** 15-20 minutos
**Objetivo:** Smoke test para garantir funcionalidades críticas

### Autenticação (2 min)
- [ ] Login funciona
- [ ] Logout funciona
- [ ] Rotas protegidas bloqueiam acesso sem auth

### CPD (5 min)
- [ ] Criar atividade manual funciona
- [ ] Pontos calculados corretamente
- [ ] Lista de atividades carrega
- [ ] Barra de progresso mostra dados corretos

### Eventos (5 min)
- [ ] Criar evento funciona
- [ ] Inscrição funciona
- [ ] Email de confirmação enviado
- [ ] Admin vê lista de inscritos

### Membros (3 min)
- [ ] Lista de membros carrega
- [ ] Busca funciona
- [ ] Criar membro funciona

### Emails (2 min)
- [ ] SMTP configurado
- [ ] Teste de conexão funciona
- [ ] Email de teste enviado e recebido

### Performance (3 min)
- [ ] Dashboard carrega em < 2 segundos
- [ ] Lista de eventos carrega em < 3 segundos
- [ ] Sem erros no console
- [ ] Sem memory leaks visíveis

---

## 🔧 FERRAMENTAS E COMANDOS ÚTEIS

### Iniciar Sistema
```bash
# Frontend
cd eau-members && npm run dev
# URL: http://localhost:5180

# Backend
cd eau-backend && npm run dev
# URL: http://localhost:3001

# Email Dashboard
# URL: http://localhost:3001
```

### Queries SQL Úteis

**Verificar usuário:**
```sql
SELECT u.id, u.email, u.created_at,
       m.first_name, m.last_name, m.user_type
FROM auth.users u
LEFT JOIN members m ON m.user_id = u.id
WHERE u.email = '[EMAIL]';
```

**Verificar CPD de usuário:**
```sql
SELECT ca.id, ca.activity_title, ca.cpd_points, ca.status,
       ca.activity_date, ca.created_at
FROM cpd_activities ca
WHERE ca.user_id = '[USER_ID]'
ORDER BY ca.activity_date DESC
LIMIT 10;
```

**Verificar eventos com inscrições:**
```sql
SELECT e.id, e.title, e.start_date,
       COUNT(er.id) as registrations,
       e.capacity
FROM events e
LEFT JOIN event_registrations er ON er.event_id = e.id
GROUP BY e.id, e.title, e.start_date, e.capacity
ORDER BY e.start_date DESC;
```

**Verificar emails enviados:**
```sql
SELECT el.id, el.recipient_email, el.email_type,
       el.sent_at, el.status
FROM email_logs el
ORDER BY el.sent_at DESC
LIMIT 20;
```

---

## 📝 TEMPLATE PARA NOVOS TESTES

Ao adicionar nova funcionalidade, use este template:

```markdown
### TESTE X.Y: [Nome do Teste]

**Objetivo:** [O que estamos testando]

**Passos:**
\`\`\`bash
1. [Passo 1]
2. [Passo 2]
3. [Passo 3]
\`\`\`

**Validação Esperada:**
- ✅ [Resultado esperado 1]
- ✅ [Resultado esperado 2]
- ✅ [Resultado esperado 3]

**SQL Validação:**
\`\`\`sql
SELECT ...
FROM ...
WHERE ...;
\`\`\`

**Notas Adicionais:**
- [Qualquer informação relevante]
```

---

## 🚨 PROBLEMAS CONHECIDOS

### Problema: Emails não enviados
**Sintoma:** Inscrições funcionam mas emails não chegam
**Causa:** SMTP não configurado ou backend não rodando
**Solução:**
1. Verificar `/admin/smtp-settings`
2. Testar conexão SMTP
3. Verificar backend rodando na porta 3001
4. Verificar logs do backend

### Problema: CPD não criado após evento
**Sintoma:** Marcar presença não cria CPD
**Causa:** Event não tem cpd_points configurado
**Solução:**
1. Editar evento
2. Configurar CPD Points e Category
3. Salvar
4. Tentar novamente

### Problema: Link do evento não ativa
**Sintoma:** Link permanece desabilitado mesmo próximo ao horário
**Causa:** Timezone incorreto ou data/hora errada
**Solução:**
1. Verificar timezone do evento
2. Verificar start_date
3. Recarregar página
4. Verificar hora do servidor

### Problema: Barra CPD mostra 0
**Sintoma:** Atividades existem mas barra mostra 0
**Causa:** user_id mismatch (auth.users.id vs members.id)
**Solução:**
1. Verificar que cpd_activities.user_id = auth.users.id
2. Verificar funções de cálculo usando userId correto
3. Ver CORRECOES_APLICADAS.md para detalhes

---

## 📅 MANUTENÇÃO DESTE DOCUMENTO

### Quando Atualizar
- ✅ Ao adicionar nova funcionalidade
- ✅ Ao corrigir bug crítico
- ✅ Ao mudar comportamento esperado
- ✅ Ao descobrir edge case importante

### Como Atualizar
1. Adicionar teste na seção apropriada
2. Seguir template padrão
3. Atualizar índice se necessário
4. Atualizar data no topo
5. Commitar com mensagem clara

### Revisão Periódica
- 📅 Revisar mensalmente
- 📅 Atualizar após cada sprint
- 📅 Validar que testes ainda são relevantes

---

**Documento criado por:** Claude Code
**Data de criação:** 30/01/2025
**Última atualização:** 30/01/2025 11:45
**Versão:** 1.0
**Status:** ✅ ATIVO - Usar como referência para todos os testes

---

**FIM DO DOCUMENTO**