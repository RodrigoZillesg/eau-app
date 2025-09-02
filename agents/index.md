# 🤖 EAU React - Agentes Especializados

## Visão Geral

Este diretório contém agentes especializados para o desenvolvimento e manutenção do projeto EAU React. Cada agente é um expert em sua área específica, com conhecimento profundo sobre arquivos, padrões, problemas comuns e soluções.

## Como Usar

1. **Identifique a natureza da tarefa** que precisa ser realizada
2. **Consulte este índice** para encontrar o agente mais apropriado
3. **Leia o arquivo do agente** para entender suas capacidades e responsabilidades
4. **Use o agente** como referência durante o desenvolvimento

## 📋 Lista de Agentes

### 1. 🔐 [Authentication & Authorization Agent](./auth-agent.md)
**Especialidade:** Autenticação, autorização e segurança

**Use para:**
- Implementar ou corrigir login/logout
- Gerenciar sessões e tokens
- Configurar permissões e roles
- Resolver problemas de acesso
- Implementar 2FA ou outras medidas de segurança

**Arquivos principais:** `src/lib/supabase/auth.ts`, `src/stores/authStore.ts`, `src/features/auth/**`

---

### 2. 🗄️ [Database & Supabase Agent](./database-agent.md)
**Especialidade:** Banco de dados, queries e Supabase

**Use para:**
- Criar ou modificar queries
- Configurar conexões com Supabase
- Implementar migrations
- Otimizar performance de banco
- Resolver problemas de conexão
- Configurar real-time subscriptions

**Arquivos principais:** `src/lib/supabase/client.ts`, `src/types/supabase.ts`

---

### 3. 🎨 [UI & Components Agent](./ui-agent.md)
**Especialidade:** Interface, componentes e UX

**Use para:**
- Criar novos componentes
- Corrigir problemas de UI
- Implementar responsividade
- Configurar Tailwind CSS
- Resolver problemas do editor Quill
- Melhorar acessibilidade

**Arquivos principais:** `src/components/ui/**`, `tailwind.config.js`

---

### 4. 📅 [Events Management Agent](./events-agent.md)
**Especialidade:** Sistema de eventos e inscrições

**Use para:**
- Criar/editar funcionalidades de eventos
- Implementar processo de inscrição
- Configurar pagamentos
- Gerar relatórios de eventos
- Resolver problemas de capacidade
- Implementar check-in

**Arquivos principais:** `src/features/events/**`, `src/services/eventService.ts`

---

### 5. 📚 [CPD Agent](./cpd-agent.md)
**Especialidade:** Desenvolvimento profissional contínuo

**Use para:**
- Gerenciar atividades CPD
- Implementar cálculo de pontos
- Criar relatórios de progresso
- Configurar aprovações
- Implementar importação de atividades
- Gerar certificações

**Arquivos principais:** `src/features/cpd/**`, `src/features/cpd/cpdService.ts`

---

### 6. 👥 [Administration Agent](./admin-agent.md)
**Especialidade:** Administração e gestão do sistema

**Use para:**
- Gerenciar usuários
- Importar dados em massa
- Configurar sistema
- Gerar relatórios administrativos
- Implementar auditoria
- Configurar backups

**Arquivos principais:** `src/features/admin/**`

---

### 7. 📸 [Media & Upload Agent](./media-agent.md)
**Especialidade:** Upload e gestão de mídia

**Use para:**
- Implementar upload de arquivos
- Processar imagens
- Configurar galeria de mídia
- Otimizar assets
- Resolver problemas de storage
- Implementar crop de imagens

**Arquivos principais:** `src/services/mediaService.ts`, `src/components/media/**`

---

### 8. 📧 [Email & Notifications Agent](./email-agent.md)
**Especialidade:** Emails e notificações

**Use para:**
- Configurar envio de emails
- Criar templates de email
- Implementar notificações in-app
- Configurar SMTP/EmailJS
- Resolver problemas de entrega
- Implementar newsletters

**Arquivos principais:** `src/services/emailService.ts`, `src/lib/notifications.ts`

---

### 9. ⚡ [Performance & Cache Agent](./performance-agent.md)
**Especialidade:** Performance e otimização

**Use para:**
- Resolver problemas de performance
- Implementar cache
- Otimizar bundle size
- Configurar lazy loading
- Resolver problemas de memória
- Implementar code splitting

**Arquivos principais:** `src/utils/clearCache.ts`, `vite.config.ts`

---

### 10. 🛠️ [Development & Build Agent](./development-agent.md)
**Especialidade:** Ambiente de desenvolvimento e build

**Use para:**
- Configurar ambiente de desenvolvimento
- Resolver problemas de build
- Configurar ESLint/Prettier
- Gerenciar dependências
- Implementar CI/CD
- Resolver problemas de porta/servidor

**Arquivos principais:** `vite.config.ts`, `package.json`, `scripts/restart-server.ps1`

---

## 🎯 Guia Rápido de Escolha

### Por Tipo de Problema

**"Usuário não consegue fazer login"**
→ Authentication Agent

**"Query está muito lenta"**
→ Database Agent + Performance Agent

**"Botão não está aparecendo corretamente"**
→ UI Agent

**"Email não está sendo enviado"**
→ Email Agent

**"Site está lento"**
→ Performance Agent

**"Build está falhando"**
→ Development Agent

**"Preciso importar 1000 usuários"**
→ Administration Agent

**"Upload de imagem não funciona"**
→ Media Agent

**"Evento não aceita inscrições"**
→ Events Agent

**"CPD points não calculam corretamente"**
→ CPD Agent

### Por Área do Sistema

**Frontend/UI**
→ UI Agent, Performance Agent

**Backend/API**
→ Database Agent, Authentication Agent

**Features Específicas**
→ Events Agent, CPD Agent, Admin Agent

**Infraestrutura**
→ Development Agent, Performance Agent

**Comunicação**
→ Email Agent, Media Agent

## 💡 Dicas de Uso

1. **Múltiplos Agentes:** Muitos problemas requerem colaboração entre agentes. Por exemplo, um problema de upload no editor Quill pode envolver UI Agent + Media Agent.

2. **Ordem de Prioridade:** Quando em dúvida, comece pelo agente mais específico para o problema, depois consulte agentes relacionados.

3. **Checklist:** Cada agente tem checklists e troubleshooting guides - use-os!

4. **Padrões:** Sempre siga os padrões estabelecidos por cada agente para manter consistência.

5. **Documentação:** Atualize o agente relevante quando descobrir novas soluções ou padrões.

## 🔄 Manutenção dos Agentes

Os agentes devem ser atualizados quando:
- Novos padrões são estabelecidos
- Problemas recorrentes são identificados
- Novas funcionalidades são adicionadas
- Dependências são atualizadas
- Bugs importantes são resolvidos

## 📝 Template para Novos Agentes

Se precisar criar um novo agente, use este template:

```markdown
# [Nome] Agent

## Especialização
[Descrição breve da área de expertise]

## Responsabilidades Principais
- [Responsabilidade 1]
- [Responsabilidade 2]

## Arquivos Principais
- `path/to/file1.ts`
- `path/to/file2.tsx`

## Padrões e Convenções
[Padrões específicos desta área]

## Problemas Comuns
1. **[Problema]**: [Solução]

## Comandos Úteis
\`\`\`bash
# comandos relevantes
\`\`\`
```

---

**Última atualização:** Janeiro 2025
**Versão:** 1.0.0
**Maintainer:** EAU Development Team