# Processo de Criação de Eventos - Documentação Completa

## Resumo
Este documento detalha o processo completo de criação de eventos no sistema EAU (English Australia), incluindo a estrutura de dados, métodos de criação e resolução de problemas encontrados.

## 1. Estrutura da Tabela de Eventos

### Campos Principais (Banco de Dados)
A tabela `events` no Supabase possui os seguintes campos principais:

#### Informações Básicas
- `id` (UUID) - Identificador único
- `title` (VARCHAR 255) - Título do evento
- `slug` (VARCHAR 255) - URL amigável
- `description` (TEXT) - Descrição completa em HTML
- `short_description` (VARCHAR 500) - Descrição curta para cards
- `image_url` (TEXT) - Imagem de capa

#### Datas e Horários
- `start_date` (TIMESTAMP WITH TIME ZONE) - Data/hora de início
- `end_date` (TIMESTAMP WITH TIME ZONE) - Data/hora de término
- `timezone` (VARCHAR 50) - Fuso horário (padrão: 'Australia/Sydney')

#### Localização
- `location_type` (VARCHAR 20) - Tipo: 'physical', 'virtual', ou 'hybrid'
- `venue_name` (VARCHAR 255) - Nome do local
- `address_line1` (VARCHAR 255) - Endereço linha 1
- `address_line2` (VARCHAR 255) - Endereço linha 2
- `city` (VARCHAR 100) - Cidade
- `state` (VARCHAR 100) - Estado
- `postal_code` (VARCHAR 20) - CEP
- `country` (VARCHAR 100) - País (padrão: 'Australia')
- `virtual_link` (TEXT) - Link para eventos online
- `location_instructions` (TEXT) - Instruções de localização

#### Capacidade e Preços
- `capacity` (INTEGER) - Capacidade máxima
- `member_price_cents` (INTEGER) - Preço para membros (em centavos)
- `non_member_price_cents` (INTEGER) - Preço para não-membros (em centavos)
- `early_bird_price_cents` (INTEGER) - Preço promocional
- `early_bird_end_date` (TIMESTAMP) - Data limite para preço promocional

#### CPD (Desenvolvimento Profissional Contínuo)
- `cpd_points` (DECIMAL 4,2) - Pontos CPD
- `cpd_category` (VARCHAR 100) - Categoria CPD

#### Status e Visibilidade
- `status` (VARCHAR 20) - 'draft', 'published', 'cancelled', ou 'completed'
- `visibility` (VARCHAR 20) - 'public', 'members', ou 'private'
- `featured` (BOOLEAN) - Evento em destaque

#### Configurações Adicionais
- `allow_guests` (BOOLEAN) - Permite convidados
- `max_guests_per_registration` (INTEGER) - Máximo de convidados por registro
- `requires_approval` (BOOLEAN) - Requer aprovação
- `show_attendee_list` (BOOLEAN) - Mostrar lista de participantes
- `tags` (TEXT[]) - Array de tags

## 2. Métodos de Criação de Eventos

### Método 1: Interface Web (Admin Panel)
**Status**: ❌ Com problemas na versão atual

**Localização**: `/admin/events` > Botão "Create New Event"

**Problemas Identificados**:
1. Erros 401/406 do Supabase ao salvar
2. Modal não fecha após tentativa de criação
3. Incompatibilidade entre campos do formulário e estrutura do banco

### Método 2: Script Node.js (Recomendado)
**Status**: ✅ Funcionando perfeitamente

**Arquivo**: `create-events-fixed.js`

**Passos**:
1. Instalar dependências: `npm install @supabase/supabase-js`
2. Executar script: `node create-events-fixed.js`

**Vantagens**:
- Acesso direto ao banco via Service Role Key
- Controle total sobre os dados
- Validação simplificada
- Ideal para criação em lote

### Método 3: SQL Direto
**Status**: ✅ Possível via Supabase Studio

**Acesso**: Supabase Dashboard > SQL Editor

## 3. Eventos Criados para Teste

### Evento 1: Business English Workshop
- **ID**: 03f038a4-04e9-47f8-ac01-b09c87e1e304
- **Data**: 15/02/2025
- **Local**: Sydney Business Center
- **Formato**: Presencial
- **Capacidade**: 30 pessoas
- **Preços**: Membros $350 | Não-membros $450
- **CPD**: 8 pontos

### Evento 2: IELTS Preparation Masterclass
- **ID**: 050182c7-ed17-4ff2-b75e-e2ddeef13633
- **Data**: 01-02/03/2025
- **Local**: Melbourne Education Hub + Online
- **Formato**: Híbrido
- **Capacidade**: 50 pessoas
- **Preços**: Membros $550 | Não-membros $650
- **CPD**: 16 pontos

### Evento 3: Digital Teaching Tools & Technology
- **ID**: 35cc880e-c368-4fe7-9d82-a942b246d51c
- **Data**: 20/02/2025
- **Local**: Online (Microsoft Teams)
- **Formato**: Virtual
- **Capacidade**: 100 pessoas
- **Preços**: Membros $150 | Não-membros $200
- **CPD**: 3 pontos

## 4. Mapeamento do Processo de Registro

### Fluxo de Registro de Participantes
1. **Visualização**: `/events` - Lista de eventos disponíveis
2. **Detalhes**: `/events/{slug}` - Página do evento
3. **Registro**: Clique em "Register Now"
4. **Formulário**: Preenchimento de dados pessoais
5. **Pagamento**: Processamento via SecurePay (modo teste)
6. **Confirmação**: Email de confirmação enviado

### Sistema de Notificações por Email

#### Servidor SMTP Local
- **Porta**: 3001
- **Comando**: `cd email-server && npm start`
- **Endpoint**: `http://localhost:3001/api/send-email`

#### Templates de Email Disponíveis
1. **Confirmação de Registro**: Enviado imediatamente após registro
2. **Lembrete de Evento**: Enviado X dias antes do evento
3. **Certificado de Participação**: Enviado após conclusão

## 5. Troubleshooting

### Problema: Modal não fecha ao criar evento via UI
**Causa**: Incompatibilidade entre campos do formulário e estrutura do banco
**Solução**: Usar script Node.js para criação

### Problema: Erro 401 Unauthorized
**Causa**: Sessão expirada ou token inválido
**Solução**: Re-autenticar ou usar Service Role Key

### Problema: Campos não encontrados no schema
**Causa**: Diferença entre modelo TypeScript e estrutura real do banco
**Solução**: Verificar estrutura em `database/events_schema.sql`

## 6. Scripts Úteis

### Criar Eventos de Teste
```bash
node create-events-fixed.js
```

### Verificar Eventos Criados
```javascript
// No console do navegador
const { data } = await supabase.from('events').select('*');
console.table(data);
```

### Limpar Eventos de Teste
```sql
-- No Supabase SQL Editor
DELETE FROM events WHERE title LIKE '%Test%';
```

## 7. Próximos Passos

1. **Testar Sistema de Emails**:
   - Registrar-se em um evento
   - Verificar recebimento de confirmação
   - Testar lembretes automáticos

2. **Corrigir Formulário de Criação**:
   - Atualizar `EventFormModal.tsx` para usar campos corretos
   - Remover campos obsoletos (category, cancellation_deadline)
   - Adicionar campos faltantes (slug, location_type, etc.)

3. **Implementar Validações**:
   - Validar datas (início < fim)
   - Validar preços (membros <= não-membros)
   - Validar capacidade (> 0)

## 8. Arquivos Relevantes

- **Frontend**:
  - `/src/features/events/components/EventFormModal.tsx` - Formulário de criação
  - `/src/services/eventService.ts` - Serviço de comunicação com backend
  - `/src/pages/EventsPage.tsx` - Listagem de eventos

- **Backend**:
  - `/database/events_schema.sql` - Estrutura completa do banco
  - `/create-events-fixed.js` - Script de criação funcional

- **Email**:
  - `/email-server/server.js` - Servidor SMTP local
  - `/src/services/emailService.ts` - Serviço de email do frontend

## Conclusão

O sistema de eventos está funcional e pronto para testes de notificações por email. Os 3 eventos criados cobrem diferentes cenários (presencial, híbrido, virtual) e podem ser usados para validar todo o fluxo de registro e notificações.

**Data de Documentação**: 20/08/2025
**Autor**: Sistema Automatizado
**Versão**: 1.0.0