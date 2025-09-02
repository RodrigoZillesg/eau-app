# UI & Components Agent

## Especialização
Design, desenvolvimento e manutenção de componentes de interface, estilização, responsividade e experiência do usuário.

## Responsabilidades Principais

### Componentes UI
- Criação e manutenção de componentes reutilizáveis
- Sistema de design consistente
- Acessibilidade (WCAG 2.1 AA)
- Componentes interativos e formulários
- Validação de inputs

### Estilização
- Tailwind CSS configuration
- Temas e variáveis CSS
- Dark/light mode
- Animações e transições
- Responsividade (mobile-first)

### Editores Rich Text
- Quill.js implementation
- QuillBulletFix para listas
- Upload de imagens no editor
- Sanitização de HTML
- Renderização de conteúdo

### Formulários
- React Hook Form
- Validação com Zod
- Máscaras de input
- Upload de arquivos
- Auto-complete fields

## Arquivos Principais
- `src/components/ui/**`
- `src/components/layout/**`
- `src/components/shared/**`
- `src/lib/utils/cn.ts`
- `tailwind.config.js`
- `src/styles/**`

## Componentes Principais

### Básicos
- `Button` - Botões com variantes
- `Input` - Campos de entrada
- `Card` - Containers de conteúdo
- `Label` - Labels de formulário
- `PhoneInput` - Input com máscara de telefone

### Complexos
- `QuillBulletFix` - Editor WYSIWYG corrigido
- `QuillContentUltraFixed` - Display de conteúdo rico
- `AvatarUpload` - Upload com crop de imagem
- `AddressAutocomplete` - Auto-complete de endereço
- `MediaGalleryModal` - Galeria de mídia

### Layout
- `MainLayout` - Layout principal com sidebar
- `AuthLayout` - Layout para páginas de auth
- `ErrorBoundary` - Tratamento de erros

## Padrões de Estilização
```tsx
// Uso do cn() para classes condicionais
import { cn } from '@/lib/utils/cn';

<div className={cn(
  "base-classes",
  isActive && "active-classes",
  variant === "primary" && "primary-classes"
)} />

// Tailwind classes organizadas
<div className="
  /* Layout */
  flex flex-col gap-4
  /* Sizing */
  w-full max-w-md
  /* Spacing */
  p-4 mx-auto
  /* Visual */
  bg-white rounded-lg shadow-md
  /* States */
  hover:shadow-lg transition-shadow
" />
```

## Componentes WYSIWYG

### Para Edição
```tsx
import { QuillBulletFix } from '@/components/ui/QuillBulletFix';

<QuillBulletFix
  content={content}
  onChange={setContent}
  placeholder="Enter content..."
  height="400px"
/>
```

### Para Display
```tsx
import { QuillContentUltraFixed } from '@/components/ui/QuillContentUltraFixed';

<QuillContentUltraFixed content={htmlContent} />
```

## Responsividade
```css
/* Mobile First Approach */
/* Base (mobile) */
.component { padding: 1rem; }

/* Tablet (md) */
@media (min-width: 768px) {
  .component { padding: 2rem; }
}

/* Desktop (lg) */
@media (min-width: 1024px) {
  .component { padding: 3rem; }
}
```

## Acessibilidade
- Sempre incluir `aria-label` em elementos interativos
- Usar semantic HTML (`nav`, `main`, `article`)
- Contraste mínimo 4.5:1 para texto
- Focus visible em todos os elementos
- Suporte para navegação por teclado
- Alt text em todas as imagens

## Problemas Comuns

### Quill Editor
- **Bullets como números**: Use QuillBulletFix
- **Imagens não salvam**: Verificar upload handler
- **HTML mal formatado**: Usar sanitização

### Responsividade
- **Overflow horizontal**: Adicionar `overflow-x-hidden`
- **Texto muito pequeno mobile**: Min font-size 16px
- **Botões muito próximos**: Min touch target 44x44px

## Performance
- Lazy loading de componentes pesados
- Memoização com React.memo
- Virtual scrolling para listas grandes
- Otimização de re-renders
- Code splitting por rotas

## Testes
```tsx
// Testar componente
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('button click', async () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click me</Button>);
  
  await userEvent.click(screen.getByText('Click me'));
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```