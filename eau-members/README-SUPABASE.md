# Configuração do Supabase para o Sistema de Membros

## 1. Executar o Schema SQL no Supabase

Para usar o sistema de gerenciamento de membros, você precisa executar o arquivo SQL no seu banco Supabase:

1. Acesse o Supabase Studio em `http://localhost:3000` (ou o URL do seu projeto)
2. Faça login com as credenciais:
   - **Usuário:** `rrzillesg`
   - **Senha:** `pkWwMiebGUCQXXrVFvCWp`
3. Vá para a seção **SQL Editor**
4. Cole e execute o conteúdo do arquivo `database/schema.sql`

## 2. Estrutura de Tabelas Criadas

### `members`
Tabela principal dos membros com informações pessoais, endereço, status de membership e configurações.

### `member_roles`
Tabela para definir funções dos membros (member, admin, super_admin, moderator, instructor).

### `member_history`
Tabela para rastrear histórico de mudanças nos membros (auditoria).

## 3. Funcionalidades Implementadas

### Componentes Admin:
- **MembersList**: Lista todos os membros com filtros e busca
- **MemberForm**: Formulário para criar/editar membros
- **MemberStats**: Estatísticas dos membros
- **AdminDashboard**: Dashboard principal de administração

### Serviços:
- **MembersService**: Classe com todos os métodos para CRUD de membros

### Rotas:
- `/admin` - Dashboard administrativo
- `/admin/members` - Gerenciamento de membros

## 4. Como Testar

1. **Certifique-se que o Supabase está rodando:**
   ```bash
   # Se você estiver usando Docker Compose
   docker-compose up -d
   ```

2. **Execute o schema SQL** conforme instruções acima

3. **Inicie o projeto React:**
   ```bash
   npm run dev
   ```

4. **Faça login e acesse `/admin`** para ver o painel administrativo

## 5. Permissões

O sistema usa as permissões existentes:
- `ACCESS_ADMIN_DASHBOARD` - Para acessar área administrativa
- Apenas usuários com roles `admin` ou `super_admin` podem gerenciar membros

## 6. Próximos Passos

Depois de testar o sistema de membros, podemos implementar:
1. Sistema de CPDs integrado com membros
2. Sistema de eventos e inscrições
3. Relatórios e dashboards mais avançados
4. Sistema de notificações por email

## 7. Troubleshooting

### Erro de conexão com Supabase:
- Verifique se o Supabase está rodando em `http://localhost:8000`
- Confirme se as credenciais no `.env.local` estão corretas

### Erro de permissões:
- Certifique-se de que executou o schema SQL completo
- Verifique se seu usuário tem as roles adequadas na tabela `member_roles`

### Erros de TypeScript:
- Execute `npm run build` para verificar erros de tipos
- Todos os tipos do Supabase foram atualizados em `src/types/supabase.ts`