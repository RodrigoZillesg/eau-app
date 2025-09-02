# Administration Agent

## Especialização
Gerenciamento administrativo completo do sistema, incluindo usuários, configurações, importações, relatórios e manutenção.

## Responsabilidades Principais

### Gestão de Usuários
- CRUD de membros
- Atribuição de roles
- Ativação/desativação de contas
- Reset de senhas
- Auditoria de acessos
- Permissões granulares

### Importação de Dados
- Importação em massa de usuários
- Importação de atividades CPD
- Validação de dados
- Tratamento de duplicatas
- Logs de importação
- Rollback em caso de erro

### Configurações do Sistema
- Parâmetros globais
- Configurações de email
- Integrações de terceiros
- Customização de interface
- Backup e restore

### Relatórios e Analytics
- Dashboard administrativo
- Métricas de uso
- Relatórios financeiros
- Auditoria de sistema
- Exportação de dados

## Arquivos Principais
- `src/features/admin/**`
- `src/features/admin/pages/MembersPage.tsx`
- `src/features/admin/pages/UserImportPage.tsx`
- `src/features/admin/pages/ActivityImportPage.tsx`
- `src/features/admin/pages/CompleteImportPage.tsx`
- `src/features/admin/components/AdminDashboard.tsx`

## Funcionalidades Administrativas

### Gestão de Membros
```typescript
// Estrutura de permissões
interface MemberPermissions {
  // Básicas
  canLogin: boolean;
  canViewProfile: boolean;
  canEditOwnProfile: boolean;
  
  // Eventos
  canViewEvents: boolean;
  canRegisterEvents: boolean;
  canCreateEvents: boolean;
  canManageAllEvents: boolean;
  
  // CPD
  canViewCPD: boolean;
  canAddCPD: boolean;
  canApproveCPD: boolean;
  
  // Admin
  canViewMembers: boolean;
  canEditMembers: boolean;
  canImportData: boolean;
  canExportData: boolean;
  canViewReports: boolean;
  canEditSettings: boolean;
}
```

### Importação em Massa

#### Formato CSV Usuários
```csv
email,first_name,last_name,role,member_since
john@example.com,John,Doe,member,2024-01-01
jane@example.com,Jane,Smith,admin,2023-06-15
```

#### Processo de Importação
```typescript
// 1. Upload e parsing
const file = await uploadFile(csvFile);
const data = await parseCSV(file);

// 2. Validação
const validation = await validateImportData(data);
if (validation.errors.length > 0) {
  return showValidationErrors(validation.errors);
}

// 3. Preview
const preview = await generateImportPreview(data);
await showPreviewModal(preview);

// 4. Processamento
const result = await processImport(data, {
  skipDuplicates: true,
  sendWelcomeEmail: true,
  createProfiles: true
});

// 5. Relatório
showImportReport(result);
```

## Dashboard Administrativo

### Widgets
```typescript
interface AdminDashboard {
  // Estatísticas gerais
  totalMembers: number;
  activeMembers: number;
  newMembersThisMonth: number;
  
  // Eventos
  upcomingEvents: number;
  totalRegistrations: number;
  revenueThisMonth: number;
  
  // CPD
  pendingApprovals: number;
  averageCPDHours: number;
  
  // Sistema
  lastBackup: Date;
  systemHealth: 'healthy' | 'warning' | 'error';
  storageUsed: number;
  emailsSentToday: number;
}
```

### Métricas e KPIs
- Taxa de crescimento de membros
- Engajamento médio
- Taxa de renovação
- Receita por membro
- Custo de aquisição
- Lifetime value

## Configurações do Sistema

### Email Settings
```typescript
interface EmailConfig {
  provider: 'smtp' | 'sendgrid' | 'emailjs';
  smtp?: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    password: string;
  };
  emailjs?: {
    serviceId: string;
    templateId: string;
    publicKey: string;
  };
  fromEmail: string;
  fromName: string;
  replyTo: string;
}
```

### Backup e Manutenção
```bash
# Backup automático diário
0 2 * * * npm run backup:database

# Limpeza de logs mensalmente
0 3 1 * * npm run cleanup:logs

# Otimização de storage
0 4 * * 0 npm run optimize:storage
```

## Roles e Permissões

### Níveis de Acesso
1. **Super Admin**: Acesso total
2. **Admin**: Gestão de usuários e conteúdo
3. **Moderator**: Aprovação de conteúdo
4. **Member**: Acesso básico
5. **Guest**: Somente visualização

### Matriz de Permissões
| Recurso | Super Admin | Admin | Moderator | Member | Guest |
|---------|------------|-------|-----------|--------|-------|
| Settings | ✅ | ❌ | ❌ | ❌ | ❌ |
| Users | ✅ | ✅ | ❌ | ❌ | ❌ |
| Events | ✅ | ✅ | ✅ | View | View |
| CPD | ✅ | ✅ | Approve | Own | ❌ |
| Reports | ✅ | ✅ | Limited | Own | ❌ |

## Auditoria e Logs

### Eventos Auditados
- Login/logout
- Mudanças de senha
- Alteração de roles
- Importações de dados
- Exportações
- Deletions
- Configurações alteradas

### Estrutura de Log
```typescript
interface AuditLog {
  id: string;
  timestamp: Date;
  user_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  old_value?: any;
  new_value?: any;
  ip_address: string;
  user_agent: string;
  success: boolean;
  error_message?: string;
}
```

## Troubleshooting Comum

### Importação
- **Encoding issues**: Usar UTF-8
- **Duplicatas**: Configurar skip ou merge
- **Validação falha**: Verificar formato de dados
- **Timeout**: Dividir em lotes menores

### Performance
- **Dashboard lento**: Implementar cache
- **Queries pesadas**: Adicionar índices
- **Export grande**: Usar streaming
- **Muitos usuários**: Paginação

## Scripts Administrativos

```bash
# Reset de senha em massa
npm run admin:reset-passwords

# Limpeza de dados antigos
npm run admin:cleanup --days=365

# Validação de integridade
npm run admin:validate-data

# Exportação completa
npm run admin:export --format=json --output=backup.json

# Migração de dados
npm run admin:migrate --from=v1 --to=v2
```

## Segurança Administrativa

### Boas Práticas
- 2FA obrigatório para admins
- Logs de todas as ações
- Backup antes de operações críticas
- Princípio do menor privilégio
- Revisão periódica de acessos
- Segregação de ambientes
- Criptografia de dados sensíveis