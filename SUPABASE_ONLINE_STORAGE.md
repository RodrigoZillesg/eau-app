# Configurar Storage no Supabase ONLINE

## ⚠️ IMPORTANTE: SEMPRE USE O SUPABASE ONLINE

**URL do Supabase Online**: https://english-australia-eau-supabase.lkobs5.easypanel.host

## Como criar o bucket "media" no Supabase Online

### Opção 1: Pelo Dashboard (Mais Fácil)

1. **Acesse o Supabase Dashboard Online**
   - URL: https://english-australia-eau-supabase.lkobs5.easypanel.host
   - Vá para a seção "Storage" no menu lateral

2. **Crie o Bucket**
   - Clique em "New bucket"
   - Nome: `media`
   - Public bucket: ✅ (marque esta opção)
   - Clique em "Create"

3. **Pronto!** O bucket está criado e configurado.

### Opção 2: Via SQL Editor no Dashboard

1. **Acesse o SQL Editor**
   - No dashboard online, vá para "SQL Editor"

2. **Execute este SQL**:
```sql
-- Criar bucket media (público)
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO NOTHING;

-- Configurar políticas de acesso
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "Authenticated Upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'media' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "User Update Own" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'media' 
    AND auth.uid() = owner
  );

CREATE POLICY "User Delete Own" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'media' 
    AND auth.uid() = owner
  );
```

### Opção 3: O App Tenta Criar Automaticamente

O MediaService tentará criar o bucket automaticamente no primeiro upload. Se isso não funcionar, use uma das opções acima.

## Testando

1. Vá para Events → Admin Events
2. Crie ou edite um evento
3. Clique em "Select Image"
4. Faça upload de uma imagem

## Solução de Problemas

### "Bucket not found"
- O bucket não foi criado no Supabase ONLINE
- Use uma das opções acima para criar

### "Permission denied"
- Verifique se está logado como usuário autenticado
- As políticas RLS podem precisar ser ajustadas

### Upload funciona mas não salva metadados
- A tabela media_files é opcional
- O upload ainda funcionará sem ela

## Estrutura do Storage

```
media/
├── [timestamp]-[random].jpg     # Uploads de eventos
├── editor-images/               # Imagens do editor rich text
└── profiles/                    # Futuro: fotos de perfil
```

## Notas Importantes

- **SEMPRE** use o Supabase ONLINE
- **NUNCA** mude para localhost:8000
- O bucket é público para leitura
- Apenas usuários autenticados podem fazer upload
- Limite de 10MB por arquivo
- Aceita apenas imagens (image/*)