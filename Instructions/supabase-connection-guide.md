
# 🧠 Supabase MCP Connection Guide

Este documento fornece todas as informações necessárias para que um modelo de IA (ou aplicação backend) se conecte ao seu banco de dados Supabase auto-hospedado, utilizando as credenciais corretas e os pontos de acesso apropriados.

---

## 🔑 Autenticação

### Anon Key (Chave pública)
Utilize esta chave para operações públicas e acesso anônimo:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE
```

### Service Role Key (Chave privada)
**Atenção:** uso restrito para serviços de backend com permissões elevadas.

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q
```

---

## 🌐 Endpoints

- **Public URL / API Proxy (Kong)**  
  `http://localhost:8000`

- **Site URL**  
  `http://localhost:3000`

---

## 🛢️ Banco de Dados (PostgreSQL)

- **Host:** `db`
- **Porta:** `5432`
- **Usuário:** `postgres`
- **Senha:** `your-super-secret-and-long-postgres-password`
- **Banco:** `postgres`

---

## 🔐 JWT & Segurança

- **JWT Secret:**  
  `your-super-secret-jwt-token-with-at-least-32-characters-long`

- **JWT Expiry:** `3600`

- **SECRET_KEY_BASE:**  
  `UpNVntn3cDxHJpq99YMc1T1AQgQpc8kfYTuRgBiYa15BLrx8etQoXz3gZv1/u2oq`

- **VAULT_ENC_KEY:**  
  `your-encryption-key-32-chars-min`

---

## 📥 SMTP (Envio de Emails)

- **SMTP Host:** `supabase-mail`
- **Porta:** `2500`
- **Usuário:** `fake_mail_user`
- **Senha:** `fake_mail_password`
- **Sender Name:** `fake_sender`
- **Admin Email:** `admin@example.com`

---

## 📚 Schemas disponíveis via PostgREST

- `public`
- `storage`
- `graphql_public`

---

## 🔄 Pool de Conexões (Supavisor)

- **Transaction Proxy Port:** `6543`
- **Pool Size Padrão:** `20`
- **Máximo de Clientes:** `100`
- **Tenant ID:** `your-tenant-id`

---

## ✅ Dashboard (Studio)

- **Usuário:** `rrzillesg`
- **Senha:** `pkWwMiebGUCQXXrVFvCWp`
- **Porta Studio:** `3000`
- **Organização Padrão:** `Default Organization`
- **Projeto Padrão:** `Default Project`

---

## 🧠 Integração com IA

- **Editor SQL com OpenAI:**  
  Chave ausente (`OPENAI_API_KEY=`)

---

## 🚫 Cadastros

- **Email Signup:** `true`
- **Email AutoConfirm:** `false`
- **Phone Signup:** `true`
- **Phone AutoConfirm:** `true`
- **Signup Desabilitado:** `false`
- **Usuários Anônimos Habilitados:** `false`

---

## 📦 Extras

- **WebP detection para imagens:** `true`
- **Verificação de JWT nas funções:** `false`
- **DOCKER_SOCKET_LOCATION:** `/var/run/docker.sock`

---

## 📈 Logflare

- **API Key:** `your-super-secret-and-long-logflare-key`
- **Backend API Key:** `your-super-secret-and-long-logflare-key`

---

## 📘 Notas Finais

- Ao mover para produção, **troque imediatamente todas as chaves sensíveis**.
- Para acesso externo ao banco, exponha a porta 5432 com segurança (VPN ou IP whitelisting).
- Para autenticação e chamadas da API via IA, use a `ANON_KEY` ou `SERVICE_ROLE_KEY` conforme a permissão necessária.
