# EasyPanel Interface Map

## Acesso
- URL: http://91.108.104.122:3000/
- User: dev@platty.tech
- Password: F27i486fb3gVyPC

## Estrutura da Interface

### Navegação Principal (Sidebar Esquerda)
- Dashboard
- Actions
- Monitor
- Domains
- Settings

### Página do Projeto (eau-app)
- **Barra Superior de Ações**:
  - Botão "+ Service" - Criar novo serviço
  - Botão "Templates" - Ver templates disponíveis
  - Ícone de menu (três linhas) - Opções adicionais

### Página de Serviço Individual
- **Barra de Ações do Serviço** (ordem dos botões):
  1. Deploy - Fazer deploy do serviço
     - Elemento alternativo: `<button class="chakra-button css-1mk4yg">Implantar</button>`
  2. Stop - Parar serviço
  3. Restart - Reiniciar serviço
  4. Logs - Ver logs do serviço
  5. Terminal - Acessar terminal
  6. Metrics - Ver métricas
  7. Settings - Configurações
  8. Delete (ícone de lixeira) - Deletar serviço
     - Elemento: `<button aria-label="Destroy">`
     - Após clicar, aparece popup de confirmação
     - Digitar nome do serviço no input
     - Clicar em botão "Excluir"

### Abas do Serviço (Menu Lateral)
- Overview - Visão geral
- Source - Configuração da fonte (Git/Docker)
- Deployments - Histórico de deploys
- Environment - Variáveis de ambiente
- Domains - Configuração de domínios
- Redirects - Redirecionamentos
- Security - Configurações de segurança
- Resources - Recursos (CPU/Memória)
- Maintenance - Manutenção

### Configuração de Source (Git)
- **Repository URL**: URL completo do repositório GitHub
- **Branch**: Branch do Git (ex: main, master)
- **Build Path**: Caminho da pasta no repositório (ex: eau-backend/)
- **Docker Compose File**: Caminho do arquivo docker-compose.yml

### Criação de Novo Serviço
1. Clicar em "+ Service"
2. Escolher tipo:
   - App - Aplicação customizada
   - MySQL, MariaDB, Postgres, Mongo, Redis - Bancos de dados
   - Box, Compose, Wordpress - Outros
3. Para App:
   - Preencher nome do serviço
   - Clicar em "Create"
   - Configurar Source (Git)
   - Salvar configurações

## Notas Importantes
- Sempre verificar se as configurações foram salvas (não mostrar erro de validação)
- O botão Deploy precisa ser clicado para fazer o deploy após configurar
- Logs podem ser expandidos clicando em "Expand Logs"
- Para fechar logs expandidos: pressionar ESC ou clicar no X

## Serviços Atuais
- eau-backend: Backend Node.js configurado
- github-desktop: Serviço desnecessário (a ser removido)

---
*Última atualização: 02/09/2025*