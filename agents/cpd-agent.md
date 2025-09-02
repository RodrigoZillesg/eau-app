# CPD (Continuous Professional Development) Agent

## Especialização
Gerenciamento do sistema de desenvolvimento profissional contínuo, incluindo atividades, categorias, pontos, relatórios e certificações.

## Responsabilidades Principais

### Gestão de Atividades CPD
- Registro de atividades de desenvolvimento
- Categorização por tipo
- Cálculo de pontos/horas
- Upload de evidências
- Aprovação e validação

### Categorias e Tipos
- Cursos e workshops
- Conferências e seminários
- Leitura profissional
- Mentoria e coaching
- Projetos e pesquisa
- Voluntariado profissional

### Tracking e Relatórios
- Dashboard de progresso
- Metas anuais
- Histórico de atividades
- Relatórios para certificação
- Exportação de dados

### Certificação
- Geração de certificados
- Validação de horas
- Requisitos mínimos
- Períodos de avaliação
- Renovação profissional

## Arquivos Principais
- `src/features/cpd/**`
- `src/features/cpd/cpdService.ts`
- `src/features/cpd/types/cpd.types.ts`
- `src/features/cpd/pages/CPDPage.tsx`
- `src/features/cpd/pages/CPDReviewPage.tsx`
- `src/features/cpd/pages/CPDSettingsPage.tsx`

## Estrutura de Dados

```typescript
interface CPDActivity {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  description: string;
  provider: string;
  activity_date: string;
  hours: number;
  points: number;
  evidence_url?: string;
  certificate_url?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  reviewer_id?: string;
  review_notes?: string;
  created_at: string;
  updated_at: string;
}

interface CPDCategory {
  id: string;
  name: string;
  description: string;
  points_per_hour: number;
  max_points_per_year: number;
  min_points_required: number;
  evidence_required: boolean;
  auto_approve: boolean;
  color: string;
  icon: string;
}

interface CPDGoal {
  id: string;
  user_id: string;
  year: number;
  target_points: number;
  target_hours: number;
  achieved_points: number;
  achieved_hours: number;
  status: 'in_progress' | 'completed' | 'expired';
}
```

## Regras de Negócio

### Cálculo de Pontos
```typescript
// Fórmula base
points = hours * category.points_per_hour;

// Limites
if (points > category.max_points_per_year) {
  points = category.max_points_per_year;
}

// Bônus por evidência
if (hasEvidence) {
  points *= 1.1; // 10% extra
}
```

### Requisitos Anuais
- Mínimo: 20 horas/ano
- Recomendado: 40 horas/ano
- Máximo contável: 100 horas/ano
- Diversidade: mínimo 3 categorias diferentes

### Processo de Aprovação
1. **Auto-aprovação**: Atividades < 2 horas
2. **Revisão simples**: 2-8 horas
3. **Revisão completa**: > 8 horas ou com certificação

## Fluxo de Trabalho

```typescript
// 1. Adicionar atividade
const activity = await cpdService.addActivity({
  category_id: 'workshop',
  title: 'React Advanced Patterns',
  hours: 8,
  activity_date: '2024-01-15',
  evidence_url: 'certificate.pdf'
});

// 2. Calcular pontos
const points = await cpdService.calculatePoints(activity);

// 3. Submeter para aprovação
await cpdService.submitForReview(activity.id);

// 4. Processo de revisão (admin)
await cpdService.reviewActivity(activity.id, {
  status: 'approved',
  reviewer_notes: 'Evidence verified'
});

// 5. Atualizar progresso
await cpdService.updateUserProgress(user_id);
```

## Dashboard e Métricas

### Widgets Principais
- Progresso anual (gráfico circular)
- Horas por categoria (gráfico de barras)
- Atividades recentes (lista)
- Próximas metas (cards)
- Ranking de usuários (leaderboard)

### KPIs
- Taxa de conclusão de metas
- Média de horas por membro
- Categorias mais populares
- Tempo médio de aprovação
- Taxa de rejeição

## Importação e Exportação

### Importação em Massa
```typescript
// CSV format
"Date","Title","Category","Hours","Provider"
"2024-01-15","Workshop React","Technical","8","EAU"
```

### Exportação
- PDF: Relatório completo formatado
- Excel: Dados tabulares
- JSON: Para integração
- Certificado: PDF com QR code

## Integrações

### Com Eventos
- Auto-registro de participação
- Cálculo automático de horas
- Link com certificados de evento

### Com Perfil
- Badges e achievements
- Nível de expertise
- Histórico profissional

## Gamificação

### Badges
- 🏆 First Activity
- 📚 Bookworm (50h leitura)
- 👨‍🏫 Mentor (20h mentoria)
- 🎯 Goal Crusher (meta anual)
- 🌟 CPD Champion (top 10%)

### Níveis
1. Iniciante: 0-20 pontos
2. Intermediário: 21-50 pontos
3. Avançado: 51-100 pontos
4. Expert: 101-200 pontos
5. Master: 200+ pontos

## Validação e Auditoria

### Evidências Aceitas
- Certificados oficiais
- Fotos de participação
- Materiais produzidos
- Declarações de presença
- Links para conteúdo online

### Red Flags
- Múltiplas atividades no mesmo dia
- Horas excessivas (>12h/dia)
- Evidências duplicadas
- Datas futuras
- Providers não verificados

## Notificações

### Para Usuários
- Lembrete mensal de registro
- Meta trimestral
- Aprovação/rejeição de atividade
- Expiração de prazo

### Para Admins
- Atividades pendentes de revisão
- Anomalias detectadas
- Relatórios mensais