# 📋 PLANO DE TESTE COMPLETO - Sistema CPD

**Data:** 30/01/2025
**Objetivo:** Testar funcionalidades de CPD (inserção manual, registro automático em eventos, e atualização da barra de progresso)

## 🎯 ESCOPO DOS TESTES

### Funcionalidades a testar:
1. ✅ **Inserção Manual de Atividade CPD**
   - Criar atividade externa manualmente
   - Verificar campos obrigatórios
   - Upload de evidência
   - Cálculo de pontos

2. ✅ **Registro Automático via Evento**
   - Participar de um evento EA
   - Verificar criação automática de atividade CPD
   - Verificar status (deve ser auto-aprovado)
   - Verificar pontos atribuídos

3. ✅ **Atualização da Barra de Progresso**
   - Verificar meta anual
   - Verificar pontos acumulados
   - Verificar porcentagem de conclusão
   - Verificar atualização em tempo real

4. ✅ **Aprovação de Atividades**
   - Atividades de eventos EA: auto-aprovação
   - Atividades externas: aprovação manual admin

## 📝 CASOS DE TESTE

### TESTE 1: Inserção Manual de Atividade CPD Externa

**Pré-requisitos:**
- Usuário logado como membro regular
- Acesso à página "My CPD"

**Passos:**
1. Navegar para `/cpd/my-activities`
2. Clicar em "Add CPD Activity"
3. Preencher formulário:
   - Title: "External Workshop - React Advanced Patterns"
   - Activity Type: "External Workshop"
   - Date: Data atual
   - Hours: 3
   - Description: "Advanced React patterns workshop"
   - Provider: "Tech Conference 2025"
   - Evidence: Upload de certificado (opcional)
4. Clicar em "Submit for Approval"

**Resultados Esperados:**
- ✅ Atividade criada com sucesso
- ✅ Status: "pending" (aguardando aprovação)
- ✅ Pontos calculados: 3 pontos (1 ponto por hora)
- ✅ Notificação de sucesso exibida
- ✅ Atividade aparece na lista com badge "Pending"
- ⚠️ Barra de progresso NÃO atualiza (atividade pendente)

---

### TESTE 2: Registro Automático via Participação em Evento

**Pré-requisitos:**
- Usuário logado como membro
- Evento EA existente com CPD points configurados

**Passos:**
1. Navegar para `/events`
2. Encontrar evento com CPD points (ex: "Annual Conference 2025")
3. Clicar em "Register"
4. Confirmar registro
5. Admin marca presença do membro no evento
6. Navegar para `/cpd/my-activities`

**Resultados Esperados:**
- ✅ Atividade CPD criada automaticamente
- ✅ Title: Nome do evento
- ✅ Activity Type: "EA Event"
- ✅ Status: "approved" (auto-aprovado)
- ✅ Points: Conforme configurado no evento
- ✅ Source: "ea_event"
- ✅ Barra de progresso ATUALIZA automaticamente
- ✅ Notificação enviada ao membro

---

### TESTE 3: Barra de Progresso e Meta Anual

**Pré-requisitos:**
- Usuário com atividades CPD aprovadas
- Meta anual configurada (padrão: 20 pontos)

**Passos:**
1. Navegar para `/cpd/my-activities`
2. Verificar card de progresso no topo
3. Observar componentes:
   - Pontos totais aprovados
   - Meta anual
   - Porcentagem de conclusão
   - Barra visual
4. Adicionar nova atividade e aprovar (como admin)
5. Recarregar página do membro

**Resultados Esperados:**
- ✅ Card mostra "X / 20 points" (X = pontos aprovados)
- ✅ Porcentagem calculada corretamente: (X / 20) * 100%
- ✅ Barra visual preenchida proporcionalmente
- ✅ Cor da barra:
  - Verde: >= 100%
  - Amarelo: >= 50%
  - Vermelho: < 50%
- ✅ Após aprovação, barra atualiza instantaneamente

---

### TESTE 4: Aprovação de Atividades por Admin

**Pré-requisitos:**
- Usuário logado como Admin ou SuperAdmin
- Atividades pendentes de aprovação

**Passos:**
1. Navegar para `/admin/cpd`
2. Filtrar por "Pending"
3. Selecionar atividade externa
4. Clicar em "Approve"
5. Confirmar aprovação
6. Verificar na lista do membro

**Resultados Esperados:**
- ✅ Status muda para "approved"
- ✅ Badge muda de amarelo para verde
- ✅ Pontos são contabilizados
- ✅ Barra de progresso do membro atualiza
- ✅ Notificação enviada ao membro

---

## 🔍 CHECKLIST DE VALIDAÇÃO

### Dashboard CPD do Membro (`/cpd/my-activities`)
- [ ] Card de progresso visível no topo
- [ ] Mostra pontos totais aprovados / meta
- [ ] Barra de progresso visual funcionando
- [ ] Porcentagem correta
- [ ] Lista de atividades carregando
- [ ] Filtros funcionando (All, Approved, Pending, Rejected)
- [ ] Botão "Add CPD Activity" visível
- [ ] Botão "View Evidence" funciona para atividades com evidência

### Formulário de Nova Atividade
- [ ] Todos os campos disponíveis
- [ ] Validação de campos obrigatórios
- [ ] Date picker funcionando
- [ ] Cálculo automático de pontos (1 ponto = 1 hora)
- [ ] Upload de evidência funcionando
- [ ] Submit cria atividade com status "pending"

### Admin CPD Management (`/admin/cpd`)
- [ ] Lista todas as atividades de todos os membros
- [ ] Filtros funcionando (All, Pending, Approved, Rejected)
- [ ] Busca por nome do membro funcionando
- [ ] Botões de ação visíveis (Approve, Reject, Delete)
- [ ] Aprovação muda status e atualiza pontos
- [ ] Bulk operations funcionando (superAdmin)

### Integração com Eventos
- [ ] Eventos com CPD points configurados
- [ ] Registro em evento funcionando
- [ ] Após marcar presença, CPD criado automaticamente
- [ ] Status da atividade CPD é "approved"
- [ ] Pontos correspondem ao evento
- [ ] Barra de progresso atualiza

### Notificações
- [ ] Notificação ao criar atividade manual
- [ ] Notificação ao aprovar atividade
- [ ] Notificação ao rejeitar atividade
- [ ] Notificação ao receber pontos de evento

## 🧪 EXECUÇÃO DOS TESTES

### TESTE PRÁTICO 1: Criar Atividade Manual
**Status:** ⏳ Aguardando execução

**Como testar:**
1. Login como membro regular
2. Ir para My CPD
3. Criar nova atividade externa
4. Verificar criação e status pendente

---

### TESTE PRÁTICO 2: Atividade de Evento
**Status:** ⏳ Aguardando execução

**Como testar:**
1. Verificar se existe evento com CPD points
2. Registrar membro no evento
3. Admin marca presença
4. Verificar criação automática de CPD

---

### TESTE PRÁTICO 3: Barra de Progresso
**Status:** ⏳ Aguardando execução

**Como testar:**
1. Verificar pontos iniciais
2. Aprovar uma atividade pendente
3. Verificar atualização da barra
4. Conferir cálculo de porcentagem

---

### TESTE PRÁTICO 4: Aprovação Admin
**Status:** ⏳ Aguardando execução

**Como testar:**
1. Login como admin
2. Ir para Admin CPD
3. Aprovar atividade pendente
4. Verificar mudança de status

## 📊 RELATÓRIO DE TESTES

### Resultados Esperados:
- ✅ Todas as funcionalidades testadas
- ✅ Inserção manual funcionando
- ✅ Registro automático via evento funcionando
- ✅ Barra de progresso atualizando corretamente
- ✅ Aprovação de atividades funcionando

### Bugs Encontrados:
_(A ser preenchido durante os testes)_

### Melhorias Sugeridas:
_(A ser preenchido durante os testes)_

---

**Pronto para executar os testes? Aguardo sua confirmação para iniciar!**