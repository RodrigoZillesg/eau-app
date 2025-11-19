# Solução Definitiva - SSH sem Senha (Passwordless)

**Problema:** SSH pede senha a cada comando, mesmo tendo configurado chave pública ontem.

**Causa Raiz:** SSH agent não está mantendo a chave carregada entre sessões ou chave não está configurada corretamente.

---

## 🎯 SOLUÇÃO RÁPIDA (Recomendada)

### Opção 1: Script Automático Windows (MAIS FÁCIL)

**Execute este comando:**
```batch
.\scripts\setup-ssh-passwordless.bat
```

**O que o script faz:**
1. ✅ Verifica se OpenSSH está instalado
2. ✅ Cria chave SSH nova (ou usa existente)
3. ✅ Copia chave pública para servidor (você digita senha 1x)
4. ✅ Configura SSH config automaticamente
5. ✅ Testa conexão sem senha

**Depois disso, SSH funcionará sem pedir senha!**

---

### Opção 2: Script Bash (Git Bash/WSL)

Se preferir usar Git Bash ou WSL:
```bash
bash scripts/setup-ssh-key.sh
```

---

## 🔧 SOLUÇÃO MANUAL (Se scripts não funcionarem)

### Passo 1: Verificar OpenSSH Instalado

**Windows 10/11:**
```powershell
# Verificar se está instalado
Get-WindowsCapability -Online | Where-Object Name -like 'OpenSSH.Client*'

# Se não estiver instalado:
Add-WindowsCapability -Online -Name OpenSSH.Client~~~~0.0.1.0
```

**Ou via GUI:**
1. Configurações → Aplicativos → Recursos Opcionais
2. Procurar "OpenSSH Client"
3. Instalar

---

### Passo 2: Criar Nova Chave SSH

```bash
# Criar chave (SEM senha, para não pedir toda hora)
ssh-keygen -t rsa -b 4096 -f ~/.ssh/eau_server_rsa -N "" -C "eau-server"
```

**IMPORTANTE:** `-N ""` cria chave **sem senha de proteção**, permitindo uso automático.

---

### Passo 3: Copiar Chave para Servidor

**Opção A: Usando ssh-copy-id (Git Bash/WSL)**
```bash
ssh-copy-id -i ~/.ssh/eau_server_rsa.pub root@91.108.104.122
# Digite a senha: Y#n9nah@=E@6ws8m!F/q
```

**Opção B: Manualmente (PowerShell/CMD)**
```powershell
# Ler conteúdo da chave pública
type %USERPROFILE%\.ssh\eau_server_rsa.pub | ssh root@91.108.104.122 "mkdir -p ~/.ssh && cat >> ~/.ssh/authorized_keys && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys"

# Digite a senha: Y#n9nah@=E@6ws8m!F/q
```

---

### Passo 4: Configurar SSH Config

**Criar/editar arquivo:** `%USERPROFILE%\.ssh\config` (Windows) ou `~/.ssh/config` (Linux/Mac)

**Adicionar:**
```
Host eau-server
    HostName 91.108.104.122
    User root
    IdentityFile ~/.ssh/eau_server_rsa
    IdentitiesOnly yes

Host 91.108.104.122
    User root
    IdentityFile ~/.ssh/eau_server_rsa
    IdentitiesOnly yes
```

**Salvar arquivo.**

---

### Passo 5: Testar Conexão

```bash
# Testar
ssh root@91.108.104.122 "echo 'SSH funcionando!'"

# Ou usando alias
ssh eau-server "echo 'SSH funcionando!'"
```

**Se NÃO pedir senha → ✅ Sucesso!**

**Se ainda pedir senha → Ir para Troubleshooting abaixo**

---

## 🐛 TROUBLESHOOTING

### Problema 1: SSH ainda pede senha

**Causa:** Permissões incorretas no servidor

**Solução:**
```bash
ssh root@91.108.104.122
# Digite senha pela última vez

# No servidor, executar:
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
chown -R root:root ~/.ssh

# Sair e testar novamente
exit
ssh root@91.108.104.122 "echo 'Test'"
```

---

### Problema 2: "Permission denied (publickey)"

**Causa:** Servidor não está aceitando autenticação por chave

**Solução:**
```bash
# No servidor, editar config SSH
ssh root@91.108.104.122
nano /etc/ssh/sshd_config

# Verificar/adicionar estas linhas:
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys

# Salvar (Ctrl+O, Enter, Ctrl+X)
# Reiniciar SSH
systemctl restart sshd

# Testar novamente
```

---

### Problema 3: Chave não está sendo usada

**Causa:** SSH não está encontrando a chave

**Solução 1: Especificar chave explicitamente**
```bash
ssh -i ~/.ssh/eau_server_rsa root@91.108.104.122
```

**Solução 2: Adicionar ao SSH agent**
```bash
# Iniciar ssh-agent
eval "$(ssh-agent -s)"

# Adicionar chave
ssh-add ~/.ssh/eau_server_rsa

# Testar
ssh root@91.108.104.122
```

---

### Problema 4: "Agent admitted failure to sign"

**Causa:** SSH agent não está rodando ou chave não está carregada

**Solução Windows:**
```powershell
# Iniciar serviço SSH Agent
Get-Service ssh-agent | Set-Service -StartupType Automatic
Start-Service ssh-agent

# Adicionar chave
ssh-add %USERPROFILE%\.ssh\eau_server_rsa
```

**Solução Linux/Mac/Git Bash:**
```bash
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/eau_server_rsa
```

---

### Problema 5: Claude Code ainda pede senha

**Causa:** Claude Code não está usando SSH config ou agent

**Solução A: Usar arquivo de configuração SSH explícito**

Verificar se arquivo `~/.ssh/config` tem as configurações corretas (Passo 4).

**Solução B: Criar alias no shell**

Adicionar ao `~/.bashrc` ou `~/.zshrc`:
```bash
alias ssh-eau='ssh -i ~/.ssh/eau_server_rsa root@91.108.104.122'
```

**Solução C: Usar SSHPASS (última opção, menos segura)**

⚠️ **Não recomendado para produção, mas funcional para desenvolvimento:**

```bash
# Instalar sshpass (Git Bash pode não ter)
# Windows: baixar de https://github.com/kevinburke/sshpass/releases

# Uso
sshpass -p 'Y#n9nah@=E@6ws8m!F/q' ssh root@91.108.104.122 "comando"
```

---

## 🔐 SEGURANÇA

### Chave SSH sem Senha de Proteção

**Prós:**
- ✅ SSH automático sem interação
- ✅ Scripts podem executar comandos
- ✅ Claude Code pode trabalhar autonomamente

**Contras:**
- ⚠️ Se alguém roubar seu computador, tem acesso ao servidor
- ⚠️ Chave não protegida por senha adicional

**Mitigação:**
- 🔒 Manter computador protegido com senha
- 🔒 Backup da chave em local seguro
- 🔒 Permissões corretas no arquivo de chave: `chmod 600 ~/.ssh/eau_server_rsa`

### Alternativa: SSH Key com Senha + SSH Agent

Se quiser mais segurança:
```bash
# Criar chave COM senha
ssh-keygen -t rsa -b 4096 -f ~/.ssh/eau_server_rsa
# Digite uma senha forte quando pedir

# Adicionar ao SSH agent (digite senha 1x por sessão)
ssh-add ~/.ssh/eau_server_rsa

# Após isso, SSH não pede senha até reiniciar computador
```

---

## 📊 VERIFICAÇÃO FINAL

Execute estes comandos para verificar tudo:

```bash
# 1. Verificar chave existe
ls -la ~/.ssh/eau_server_rsa

# 2. Verificar permissões (deve ser 600)
stat -c %a ~/.ssh/eau_server_rsa  # Linux
# Ou
ls -l ~/.ssh/eau_server_rsa  # Mac/Git Bash

# 3. Verificar config SSH
cat ~/.ssh/config | grep -A 5 "eau-server"

# 4. Testar conexão
ssh -v root@91.108.104.122 "echo 'SUCCESS'" 2>&1 | grep -i "authentication\|success"

# Se vir: "Authenticated to 91.108.104.122" e "SUCCESS" → ✅ Funcionando!
```

---

## 🚀 APÓS CONFIGURAR

**Comandos que funcionarão sem pedir senha:**
```bash
# SSH direto
ssh root@91.108.104.122

# Via alias
ssh eau-server

# Executar comando remoto
ssh root@91.108.104.122 "ls -la"

# SCP (copiar arquivos)
scp arquivo.txt root@91.108.104.122:/tmp/

# Claude Code poderá executar
# (automaticamente sem interação sua)
```

---

## ✅ RESUMO EXECUTIVO

**Para resolver de uma vez por todas:**

1. **Execute:** `.\scripts\setup-ssh-passwordless.bat` (Windows)
2. **Digite senha** quando pedir (ÚLTIMA VEZ)
3. **Teste:** `ssh root@91.108.104.122 "echo OK"`
4. **Se não pedir senha** → ✅ Resolvido!

**Se ainda pedir senha:**
- Verificar permissões no servidor (Passo Troubleshooting 1)
- Verificar SSH config (Passo 4)
- Adicionar chave ao SSH agent (Troubleshooting 3)

---

**Depois disso, Claude Code poderá trabalhar 100% autonomamente sem te pedir senha! 🎉**
