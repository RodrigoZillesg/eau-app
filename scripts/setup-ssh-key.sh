#!/bin/bash

# Script para Configurar SSH Key Automaticamente
# Elimina necessidade de digitar senha a cada comando SSH

echo "=========================================="
echo "Configuração SSH Key - Acesso Automático"
echo "=========================================="
echo ""

SERVER_IP="91.108.104.122"
SERVER_USER="root"
SSH_KEY_PATH="$HOME/.ssh/eau_server_rsa"

echo "🔑 Verificando chave SSH existente..."

# Se chave já existe, perguntar se quer recriar
if [ -f "$SSH_KEY_PATH" ]; then
    echo "⚠️  Chave SSH já existe em: $SSH_KEY_PATH"
    echo ""
    read -p "Deseja recriar a chave? (s/n): " RECREATE

    if [ "$RECREATE" != "s" ]; then
        echo "✅ Usando chave existente"
    else
        echo "🗑️  Removendo chave antiga..."
        rm -f "$SSH_KEY_PATH" "$SSH_KEY_PATH.pub"
        echo "✅ Chave removida"
    fi
fi

# Criar nova chave se não existir
if [ ! -f "$SSH_KEY_PATH" ]; then
    echo "🔧 Criando nova chave SSH..."
    ssh-keygen -t rsa -b 4096 -f "$SSH_KEY_PATH" -N "" -C "eau-server-access"
    echo "✅ Chave SSH criada com sucesso!"
fi

echo ""
echo "📤 Copiando chave pública para o servidor..."
echo "⚠️  VOCÊ PRECISARÁ DIGITAR A SENHA DO SERVIDOR PELA ÚLTIMA VEZ:"
echo "   Senha: Y#n9nah@=E@6ws8m!F/q"
echo ""

# Copiar chave para servidor
ssh-copy-id -i "$SSH_KEY_PATH.pub" "$SERVER_USER@$SERVER_IP"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Chave pública copiada com sucesso!"
else
    echo ""
    echo "❌ Erro ao copiar chave. Verifique a senha e conexão."
    exit 1
fi

echo ""
echo "🔧 Configurando SSH config para usar a chave automaticamente..."

# Criar ou atualizar ~/.ssh/config
SSH_CONFIG="$HOME/.ssh/config"

# Remover configuração antiga se existir
if [ -f "$SSH_CONFIG" ]; then
    sed -i '/Host eau-server/,/^$/d' "$SSH_CONFIG"
fi

# Adicionar nova configuração
cat >> "$SSH_CONFIG" << EOF

Host eau-server
    HostName $SERVER_IP
    User $SERVER_USER
    IdentityFile $SSH_KEY_PATH
    IdentitiesOnly yes
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null

Host $SERVER_IP
    User $SERVER_USER
    IdentityFile $SSH_KEY_PATH
    IdentitiesOnly yes
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
EOF

echo "✅ SSH config atualizado"

echo ""
echo "🔑 Adicionando chave ao SSH agent..."

# Iniciar ssh-agent se não estiver rodando
eval "$(ssh-agent -s)" > /dev/null 2>&1

# Adicionar chave ao agent
ssh-add "$SSH_KEY_PATH" > /dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "✅ Chave adicionada ao SSH agent"
else
    echo "⚠️  Não foi possível adicionar ao SSH agent (não crítico)"
fi

echo ""
echo "🧪 Testando conexão SSH sem senha..."

# Testar conexão
ssh -o BatchMode=yes -i "$SSH_KEY_PATH" "$SERVER_USER@$SERVER_IP" "echo '✅ SSH funcionando sem senha!'" 2>/dev/null

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✅ CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!"
    echo "=========================================="
    echo ""
    echo "Agora você pode usar SSH sem digitar senha:"
    echo ""
    echo "  ssh root@$SERVER_IP"
    echo "  ssh eau-server  (alias configurado)"
    echo ""
    echo "Claude Code também poderá executar comandos SSH automaticamente!"
else
    echo ""
    echo "⚠️  Teste falhou. Tentando diagnóstico..."
    echo ""
    ssh -v -i "$SSH_KEY_PATH" "$SERVER_USER@$SERVER_IP" "echo 'Test'" 2>&1 | tail -20
fi
