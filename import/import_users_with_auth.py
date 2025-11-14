"""
Script para importar usuários com criação de contas de autenticação
Usa a Service Role Key para ter permissões administrativas

IMPORTANTE: 
1. Instale as dependências: pip install supabase pandas
2. Configure as variáveis abaixo com suas credenciais
3. Execute: python import_users_with_auth.py
"""

import csv
import json
from supabase import create_client, Client
import pandas as pd
from typing import List, Dict
import sys

# ============================================
# CONFIGURE SUAS CREDENCIAIS AQUI
# ============================================
SUPABASE_URL = "https://english-australia-eau-supabase.lkobs5.easypanel.host"
SUPABASE_SERVICE_ROLE_KEY = "YOUR_SERVICE_ROLE_KEY_HERE"  # ⚠️ NUNCA commite isso!

# Arquivo CSV para importar
CSV_FILE = "UserPDlist.csv"

# Criar senhas temporárias?
CREATE_AUTH_ACCOUNTS = True

# Senha temporária padrão (será: Eau2025!{user_id})
PASSWORD_PREFIX = "Eau2025!"

# ============================================
# NÃO MODIFIQUE ABAIXO DESTA LINHA
# ============================================

def create_supabase_client() -> Client:
    """Cria cliente Supabase com Service Role (admin)"""
    if SUPABASE_SERVICE_ROLE_KEY == "YOUR_SERVICE_ROLE_KEY_HERE":
        print("❌ ERRO: Configure a SUPABASE_SERVICE_ROLE_KEY no script!")
        print("   Vá em Settings → API no painel do Supabase")
        print("   Copie a 'service_role' key (não a 'anon' key)")
        sys.exit(1)
    
    return create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

def read_csv_file(filename: str) -> List[Dict]:
    """Lê o arquivo CSV e retorna lista de usuários"""
    users = []
    try:
        with open(filename, 'r', encoding='utf-8') as file:
            reader = csv.DictReader(file)
            for row in reader:
                users.append({
                    'userId': row.get('User Id', '').strip(),
                    'firstName': row.get('First Name', '').strip(),
                    'lastName': row.get('Last Name', '').strip(),
                    'email': row.get('Email', '').strip().lower(),
                    'activities': row.get('Activities', '0').strip(),
                    'points': row.get('Points', '0.00').strip(),
                    'goalStatus': row.get('Goal Status', '0 / 0').strip()
                })
        print(f"✅ Lidos {len(users)} usuários do CSV")
        return users
    except FileNotFoundError:
        print(f"❌ Arquivo {filename} não encontrado!")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Erro ao ler CSV: {e}")
        sys.exit(1)

def check_existing_member(supabase: Client, email: str) -> bool:
    """Verifica se o membro já existe"""
    try:
        result = supabase.table('members').select('id').eq('email', email).execute()
        return len(result.data) > 0
    except:
        return False

def create_auth_user(supabase: Client, user: Dict, password: str) -> str:
    """Cria conta de autenticação para o usuário"""
    try:
        # Criar usuário com auto-confirmação
        result = supabase.auth.admin.create_user({
            'email': user['email'],
            'password': password,
            'email_confirm': True,
            'user_metadata': {
                'first_name': user['firstName'],
                'last_name': user['lastName'],
                'legacy_user_id': user['userId']
            }
        })
        
        if result and result.user:
            return result.user.id
        return None
    except Exception as e:
        print(f"   ⚠️ Erro ao criar auth para {user['email']}: {e}")
        return None

def create_member_record(supabase: Client, user: Dict, auth_user_id: str = None) -> bool:
    """Cria registro do membro na tabela members"""
    try:
        # Parse goal status
        goal_parts = user['goalStatus'].split('/')
        goal_achieved = float(goal_parts[0].strip() if goal_parts[0] else '0')
        goal_target = float(goal_parts[1].strip() if len(goal_parts) > 1 else '0')
        
        # Dados do membro
        member_data = {
            'legacy_user_id': int(user['userId']) if user['userId'] else None,
            'first_name': user['firstName'],
            'last_name': user['lastName'],
            'display_name': f"{user['firstName']} {user['lastName']}",
            'email': user['email'],
            'cpd_activities_count': int(user['activities']) if user['activities'] else 0,
            'cpd_points_total': float(user['points']) if user['points'] else 0,
            'cpd_goal_achieved': goal_achieved,
            'cpd_goal_target': goal_target,
            'membership_status': 'active',
            'membership_type': 'standard',
            'receive_newsletters': True,
            'receive_event_notifications': True
        }
        
        # Adicionar user_id se foi criada conta de auth
        if auth_user_id:
            member_data['user_id'] = auth_user_id
        
        result = supabase.table('members').insert(member_data).execute()
        return True
    except Exception as e:
        print(f"   ❌ Erro ao criar membro {user['email']}: {e}")
        return False

def import_users():
    """Função principal de importação"""
    print("\n" + "="*60)
    print("IMPORTADOR DE USUÁRIOS COM AUTENTICAÇÃO")
    print("="*60 + "\n")
    
    # Criar cliente Supabase
    print("🔄 Conectando ao Supabase...")
    supabase = create_supabase_client()
    print("✅ Conectado!\n")
    
    # Ler arquivo CSV
    print(f"📂 Lendo arquivo {CSV_FILE}...")
    users = read_csv_file(CSV_FILE)
    
    # Confirmar importação
    print(f"\n⚠️  Pronto para importar {len(users)} usuários")
    print(f"   Criar contas de autenticação: {'SIM' if CREATE_AUTH_ACCOUNTS else 'NÃO'}")
    
    response = input("\nDeseja continuar? (s/n): ")
    if response.lower() != 's':
        print("❌ Importação cancelada")
        return
    
    # Estatísticas
    stats = {
        'total': len(users),
        'successful': 0,
        'failed': 0,
        'existing': 0,
        'auth_created': 0
    }
    
    # Processar usuários
    print("\n🚀 Iniciando importação...\n")
    
    for i, user in enumerate(users, 1):
        print(f"[{i}/{len(users)}] Processando {user['email']}...")
        
        # Verificar se já existe
        if check_existing_member(supabase, user['email']):
            print(f"   ⏭️  Já existe - pulando")
            stats['existing'] += 1
            continue
        
        auth_user_id = None
        
        # Criar conta de autenticação se solicitado
        if CREATE_AUTH_ACCOUNTS:
            password = f"{PASSWORD_PREFIX}{user['userId']}"
            auth_user_id = create_auth_user(supabase, user, password)
            if auth_user_id:
                print(f"   ✅ Auth criada (senha: {password})")
                stats['auth_created'] += 1
            else:
                print(f"   ⚠️ Auth falhou, criando apenas membro")
        
        # Criar registro do membro
        if create_member_record(supabase, user, auth_user_id):
            print(f"   ✅ Membro criado com sucesso")
            stats['successful'] += 1
        else:
            print(f"   ❌ Falha ao criar membro")
            stats['failed'] += 1
        
        # Progresso a cada 10 usuários
        if i % 10 == 0:
            print(f"\n   📊 Progresso: {i}/{len(users)} processados")
            print(f"      Sucesso: {stats['successful']}, Falhas: {stats['failed']}, Existentes: {stats['existing']}\n")
    
    # Relatório final
    print("\n" + "="*60)
    print("📊 RELATÓRIO FINAL")
    print("="*60)
    print(f"Total de usuários:      {stats['total']}")
    print(f"✅ Importados com sucesso: {stats['successful']}")
    print(f"🔐 Contas auth criadas:    {stats['auth_created']}")
    print(f"⏭️  Já existentes:         {stats['existing']}")
    print(f"❌ Falhas:                {stats['failed']}")
    print("="*60 + "\n")
    
    if CREATE_AUTH_ACCOUNTS and stats['auth_created'] > 0:
        print("💡 IMPORTANTE:")
        print(f"   - Senhas temporárias seguem o padrão: {PASSWORD_PREFIX}[UserID]")
        print("   - Os usuários NÃO receberão email de confirmação")
        print("   - Oriente os usuários a trocar a senha no primeiro acesso")

if __name__ == "__main__":
    try:
        import_users()
    except KeyboardInterrupt:
        print("\n\n❌ Importação interrompida pelo usuário")
    except Exception as e:
        print(f"\n❌ Erro fatal: {e}")
        import traceback
        traceback.print_exc()