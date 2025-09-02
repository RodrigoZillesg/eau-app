# English Australia Members Platform

Sistema de área de membros para gestão de CPDs (Continuing Professional Development) desenvolvido com React, TypeScript e Supabase.

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+
- NPM ou Yarn
- Supabase local (Docker) ou instância cloud

### Instalação

1. Clone o repositório:
```bash
git clone [url-do-repo]
cd eau-members
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env.local
```

Edite o arquivo `.env.local` com suas credenciais do Supabase:
```
VITE_SUPABASE_URL=http://localhost:8000
VITE_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

Acesse http://localhost:5173

## 🏗️ Estrutura do Projeto

```
src/
├── assets/          # Imagens e recursos estáticos
├── components/      # Componentes reutilizáveis
│   ├── ui/         # Componentes base (Button, Input, Card)
│   ├── layout/     # Layouts da aplicação
│   └── shared/     # Componentes compartilhados
├── features/       # Funcionalidades por domínio
│   ├── auth/       # Autenticação e login
│   ├── cpd/        # Gestão de CPDs
│   ├── events/     # Eventos e inscrições
│   ├── dashboard/  # Dashboards
│   └── admin/      # Área administrativa
├── hooks/          # Custom React hooks
├── lib/           # Configurações e utilitários
│   └── supabase/  # Cliente Supabase
├── routes/        # Configuração de rotas
├── stores/        # Estado global (Zustand)
└── types/         # TypeScript types
```

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Estilização**: Tailwind CSS
- **Componentes**: Custom UI components
- **Roteamento**: React Router v6
- **Estado**: Zustand
- **Backend**: Supabase (PostgreSQL + Auth)
- **Formulários**: React Hook Form + Zod

## 👥 Tipos de Usuário

O sistema suporta múltiplos tipos de usuário com permissões específicas:

- **Admin**: Acesso total ao sistema
- **AdminSuper**: Permissões administrativas avançadas
- **Affiliates**: Parceiros afiliados
- **Board Members**: Membros do conselho
- **Consultants & Agents**: Consultores e agentes
- **Member Colleges**: Faculdades membros
- **Members**: Membros regulares
- **Openlearning**: Usuários de aprendizado aberto
- **Public**: Acesso público

## 🔐 Configuração do Banco de Dados

Execute as migrations do Supabase para criar as tabelas necessárias:

```sql
-- Criar tabelas de usuários e perfis
-- Criar tabelas de CPDs
-- Criar tabelas de eventos
-- Configurar RLS (Row Level Security)
```

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Cria a build de produção
- `npm run preview` - Visualiza a build de produção
- `npm run lint` - Executa o linter
- `npm run type-check` - Verifica tipos TypeScript

## 🚦 Status do Projeto

### ✅ Concluído
- Estrutura inicial do projeto
- Sistema de autenticação
- Componentes UI base
- Layout com rainbow gradient
- Configuração do Supabase

### 🚧 Em Desenvolvimento
- Sistema de permissões
- Dashboard de membros
- Gestão de CPDs
- Sistema de eventos

### 📋 Próximos Passos
- Implementar cadastro de CPDs
- Criar área administrativa
- Sistema de notificações
- Relatórios e métricas

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie sua feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto é proprietário da English Australia.