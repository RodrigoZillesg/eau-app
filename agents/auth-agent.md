# Authentication & Authorization Agent

## Especialização
Gerenciamento completo de autenticação, autorização, permissões e segurança do sistema.

## Responsabilidades Principais

### Autenticação
- Login/logout de usuários
- Registro de novos usuários
- Recuperação de senha
- Gerenciamento de sessões
- Refresh tokens
- Two-factor authentication (2FA)

### Autorização e Permissões
- Sistema de roles (admin, member, guest)
- Controle de acesso baseado em roles (RBAC)
- Guards de rotas
- Verificação de permissões
- Proteção de endpoints

### Segurança
- Validação de tokens JWT
- Prevenção de ataques CSRF/XSS
- Rate limiting
- Sanitização de inputs
- Criptografia de dados sensíveis

## Arquivos Principais
- `src/lib/supabase/auth.ts`
- `src/stores/authStore.ts`
- `src/features/auth/**`
- `src/components/shared/PermissionGuard.tsx`
- `src/components/shared/RoleBasedRoute.tsx`
- `src/hooks/usePermissions.ts`
- `src/hooks/useAuthHealthCheck.ts`
- `src/types/permissions.ts`

## Integrações
- Supabase Auth
- JWT tokens
- Session storage
- Zustand store

## Padrões e Convenções
- Sempre usar o hook `useAuthStore()` para acessar estado de autenticação
- Implementar guards em todas as rotas protegidas
- Logs de auditoria para ações sensíveis
- Tokens devem expirar em 24 horas
- Refresh tokens em 7 dias

## Problemas Comuns
1. **Sessão expirada**: Implementar auto-refresh de tokens
2. **Loop de redirecionamento**: Verificar guards de rotas
3. **Permissões incorretas**: Validar roles no backend e frontend
4. **Cache de autenticação**: Limpar localStorage/sessionStorage quando necessário

## Comandos Úteis
```bash
# Testar fluxo de autenticação
npm run test:auth

# Debug de tokens
localStorage.getItem('supabase.auth.token')

# Limpar cache de autenticação
localStorage.clear()
sessionStorage.clear()
```

## Checklist de Segurança
- [ ] Validação de email antes do registro
- [ ] Senha com mínimo 8 caracteres
- [ ] Rate limiting no login (máx 5 tentativas)
- [ ] Logs de auditoria para login/logout
- [ ] HTTPS em produção
- [ ] Tokens seguros (httpOnly, secure, sameSite)
- [ ] Sanitização de todos os inputs