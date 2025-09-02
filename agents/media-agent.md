# Media & Upload Agent

## Especialização
Gerenciamento de mídia, upload de arquivos, processamento de imagens, galerias e otimização de assets.

## Responsabilidades Principais

### Upload de Arquivos
- Upload single e múltiplo
- Drag and drop
- Validação de tipos e tamanhos
- Progress tracking
- Chunked upload para arquivos grandes
- Resume de uploads interrompidos

### Processamento de Imagens
- Resize e crop
- Compressão e otimização
- Geração de thumbnails
- Conversão de formatos
- Watermark
- Lazy loading

### Gestão de Mídia
- Biblioteca de mídia
- Organização por pastas
- Tags e categorização
- Busca e filtros
- Metadados
- Versionamento

### Storage
- Integração com Supabase Storage
- CDN configuration
- Cache policies
- Quota management
- Cleanup de arquivos órfãos

## Arquivos Principais
- `src/services/mediaService.ts`
- `src/components/media/MediaGalleryModal.tsx`
- `src/components/media/ImageUploadWithCrop.tsx`
- `src/components/ui/AvatarUpload.tsx`
- `src/lib/supabase/storage.ts`
- `src/pages/admin/SetupMediaLibrary.tsx`

## Configuração de Storage

### Buckets Supabase
```typescript
// Buckets principais
const buckets = {
  avatars: {
    public: true,
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/webp']
  },
  events: {
    public: true,
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/*', 'application/pdf']
  },
  documents: {
    public: false,
    maxSize: 50 * 1024 * 1024, // 50MB
    allowedTypes: ['application/pdf', 'application/msword']
  },
  media_library: {
    public: true,
    maxSize: 20 * 1024 * 1024, // 20MB
    allowedTypes: ['image/*', 'video/*']
  }
};
```

## Upload de Imagens

### Com Crop
```typescript
import { ImageUploadWithCrop } from '@/components/media/ImageUploadWithCrop';

<ImageUploadWithCrop
  onUpload={(url) => handleImageUpload(url)}
  aspectRatio={16/9}
  maxSize={5 * 1024 * 1024}
  bucket="events"
/>
```

### Avatar Upload
```typescript
import { AvatarUpload } from '@/components/ui/AvatarUpload';

<AvatarUpload
  currentImage={user.avatar_url}
  onUpload={(url) => updateAvatar(url)}
  size="lg"
/>
```

## Processamento de Imagens

### Otimização Automática
```typescript
async function optimizeImage(file: File): Promise<File> {
  // Resize se necessário
  if (file.size > MAX_SIZE) {
    const resized = await resizeImage(file, {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 0.85
    });
    return resized;
  }
  
  // Converter para WebP se suportado
  if (supportsWebP()) {
    return await convertToWebP(file);
  }
  
  return file;
}
```

### Geração de Thumbnails
```typescript
async function generateThumbnail(
  imageUrl: string, 
  size: 'small' | 'medium' | 'large'
): Promise<string> {
  const dimensions = {
    small: { width: 150, height: 150 },
    medium: { width: 300, height: 300 },
    large: { width: 600, height: 600 }
  };
  
  const { width, height } = dimensions[size];
  
  return await supabase.storage
    .from('thumbnails')
    .transform(imageUrl, {
      width,
      height,
      resize: 'cover',
      format: 'webp'
    });
}
```

## Galeria de Mídia

### Modal de Seleção
```typescript
<MediaGalleryModal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  onSelect={(media) => handleMediaSelect(media)}
  allowMultiple={true}
  mediaType="image"
  bucket="media_library"
/>
```

### Estrutura de Dados
```typescript
interface MediaItem {
  id: string;
  url: string;
  thumbnail_url: string;
  filename: string;
  mimetype: string;
  size: number;
  width?: number;
  height?: number;
  alt_text?: string;
  caption?: string;
  tags: string[];
  folder_path: string;
  uploaded_by: string;
  created_at: string;
  metadata?: {
    camera?: string;
    lens?: string;
    iso?: number;
    aperture?: string;
    shutter_speed?: string;
    location?: {
      lat: number;
      lng: number;
    };
  };
}
```

## Integração com Editores

### Quill Editor
```typescript
// Handler para upload no Quill
const imageHandler = async () => {
  const input = document.createElement('input');
  input.setAttribute('type', 'file');
  input.setAttribute('accept', 'image/*');
  input.click();
  
  input.onchange = async () => {
    const file = input.files?.[0];
    if (file) {
      const url = await mediaService.upload(file);
      const range = quill.getSelection();
      quill.insertEmbed(range.index, 'image', url);
    }
  };
};
```

## Performance e Otimização

### Lazy Loading
```typescript
<img
  src={placeholder}
  data-src={actualImage}
  loading="lazy"
  className="lazyload"
  alt={alt}
/>
```

### Progressive Loading
```typescript
// 1. Mostrar blur placeholder
<img src={blurDataURL} />

// 2. Carregar thumbnail
<img src={thumbnailUrl} />

// 3. Carregar imagem completa
<img src={fullImageUrl} />
```

### CDN e Cache
```typescript
// Headers de cache
const cacheHeaders = {
  'Cache-Control': 'public, max-age=31536000, immutable',
  'Vary': 'Accept-Encoding'
};

// URL com CDN
const cdnUrl = `https://cdn.example.com/${bucket}/${path}`;
```

## Validações

### Tipos de Arquivo
```typescript
const allowedTypes = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  documents: ['application/pdf', 'application/msword'],
  videos: ['video/mp4', 'video/webm', 'video/ogg'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg']
};
```

### Limites
```typescript
const limits = {
  avatar: { maxSize: 5 * MB, maxDimension: 2000 },
  event: { maxSize: 10 * MB, maxDimension: 4000 },
  document: { maxSize: 50 * MB },
  video: { maxSize: 100 * MB, maxDuration: 600 } // 10 min
};
```

## Segurança

### Validação de Upload
```typescript
async function validateUpload(file: File): Promise<boolean> {
  // Verificar tipo MIME real
  const realType = await getMimeType(file);
  if (!allowedTypes.includes(realType)) {
    throw new Error('Invalid file type');
  }
  
  // Verificar conteúdo malicioso
  const isSafe = await scanFile(file);
  if (!isSafe) {
    throw new Error('File contains malicious content');
  }
  
  // Verificar tamanho
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large');
  }
  
  return true;
}
```

### Sanitização de Nomes
```typescript
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9.-]/gi, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
}
```

## Limpeza e Manutenção

### Remover Arquivos Órfãos
```typescript
async function cleanupOrphanFiles() {
  // Listar todos os arquivos no storage
  const storageFiles = await supabase.storage
    .from('media_library')
    .list();
  
  // Verificar referências no banco
  const referencedFiles = await supabase
    .from('media_references')
    .select('file_url');
  
  // Remover não referenciados
  const orphans = storageFiles.filter(
    file => !referencedFiles.includes(file.url)
  );
  
  await Promise.all(
    orphans.map(file => 
      supabase.storage
        .from('media_library')
        .remove([file.path])
    )
  );
}
```

## Troubleshooting

### Problemas Comuns
1. **Upload falha**: Verificar tamanho e tipo
2. **Imagem não aparece**: Verificar permissões do bucket
3. **Thumbnail não gera**: Verificar formato suportado
4. **CDN lento**: Verificar cache headers
5. **Storage cheio**: Implementar cleanup routine