# Events Management Agent

## Especialização
Gerenciamento completo do sistema de eventos, incluindo criação, edição, inscrições, pagamentos e relatórios.

## Responsabilidades Principais

### Gestão de Eventos
- CRUD de eventos
- Publicação e despublicação
- Categorização e tags
- Eventos recorrentes
- Gestão de capacidade
- Lista de espera

### Inscrições
- Processo de inscrição
- Validação de vagas
- Confirmação de participação
- Cancelamento e reembolso
- Check-in de participantes
- Certificados de participação

### Pagamentos
- Integração com SecurePay
- Processamento de cartões
- Gestão de preços (early bird, member, non-member)
- Cupons de desconto
- Relatórios financeiros
- Reconciliação

### Comunicação
- Emails de confirmação
- Lembretes automáticos
- Notificações de mudanças
- Lista de transmissão
- QR codes para check-in

## Arquivos Principais
- `src/features/events/**`
- `src/services/eventService.ts`
- `src/services/eventRegistrationService.ts`
- `src/services/securePayService.ts`
- `src/types/events.ts`

## Fluxo de Inscrição

```typescript
// 1. Verificar disponibilidade
const availability = await eventService.checkAvailability(eventId);

// 2. Criar registro
const registration = await eventRegistrationService.create({
  event_id: eventId,
  user_id: userId,
  status: 'pending'
});

// 3. Processar pagamento
const payment = await securePayService.processPayment({
  amount: event.price,
  registration_id: registration.id
});

// 4. Confirmar inscrição
if (payment.success) {
  await eventRegistrationService.confirm(registration.id);
  await emailService.sendConfirmation(registration);
}
```

## Tipos de Eventos

### Por Formato
- Presencial
- Online (Zoom/Teams)
- Híbrido

### Por Categoria
- Workshop
- Seminário
- Conferência
- Networking
- Curso
- Webinar

### Por Acesso
- Público
- Somente membros
- Por convite
- Pago
- Gratuito

## Estrutura de Dados

```typescript
interface Event {
  id: string;
  title: string;
  description: string; // HTML from Quill
  event_date: string;
  event_time: string;
  location?: string;
  online_link?: string;
  capacity: number;
  price_member: number;
  price_non_member: number;
  early_bird_discount?: number;
  early_bird_deadline?: string;
  registration_deadline: string;
  status: 'draft' | 'published' | 'cancelled';
  featured_image?: string;
  gallery_images?: string[];
  tags?: string[];
  created_by: string;
  created_at: string;
}

interface Registration {
  id: string;
  event_id: string;
  user_id: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'waitlist';
  payment_status: 'pending' | 'paid' | 'refunded';
  amount_paid: number;
  registration_date: string;
  attendance_confirmed: boolean;
  certificate_issued: boolean;
}
```

## Regras de Negócio

### Inscrições
- Deadline 24h antes do evento
- Cancelamento até 48h antes (reembolso total)
- Cancelamento 24-48h antes (50% reembolso)
- Sem reembolso menos de 24h

### Preços
- Membros: desconto automático
- Early bird: 15% desconto até deadline
- Grupos: 10% desconto para 5+ pessoas

### Capacidade
- Lista de espera quando lotado
- Notificação automática de vagas
- Overbooking de 10% para eventos online

## Integrações

### SecurePay
```typescript
const config = {
  merchantId: process.env.SECUREPAY_MERCHANT_ID,
  password: process.env.SECUREPAY_PASSWORD,
  testMode: process.env.NODE_ENV !== 'production'
};
```

### Zoom/Teams
- Criação automática de reuniões
- Envio de links após confirmação
- Gravação de sessões

### Google Calendar
- Adicionar ao calendário
- Arquivo .ics para download

## Relatórios

### Para Organizadores
- Lista de participantes
- Status de pagamentos
- Taxa de ocupação
- Feedback dos participantes

### Para Administração
- Receita por evento
- Eventos mais populares
- Taxa de cancelamento
- ROI por categoria

## Checklist de Evento

### Pré-evento
- [ ] Criar evento no sistema
- [ ] Definir preços e capacidade
- [ ] Configurar imagens e descrição
- [ ] Testar processo de inscrição
- [ ] Preparar emails automáticos

### Durante
- [ ] Monitorar inscrições
- [ ] Responder dúvidas
- [ ] Fazer check-in
- [ ] Coletar feedback

### Pós-evento
- [ ] Emitir certificados
- [ ] Enviar pesquisa de satisfação
- [ ] Gerar relatório final
- [ ] Arquivar documentação