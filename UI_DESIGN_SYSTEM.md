# UI Design System - EAU React Application
**Last Updated: 2025-09-03**

## 🎨 Design Philosophy
O sistema de design do EAU React é baseado em consistência, acessibilidade e profissionalismo, usando Tailwind CSS com componentes reutilizáveis inspirados no shadcn/ui.

## 📐 Layout & Container System

### Container Width Standards
**CRITICAL: Todas as páginas devem respeitar estas larguras**
```css
/* Container principal - SEMPRE USE ISSO */
max-w-7xl mx-auto px-4 sm:px-6 lg:px-8

/* Variações permitidas por contexto */
- Páginas de conteúdo completo: max-w-7xl (padrão)
- Formulários/Auth: max-w-md
- Content pages (leitura): max-w-4xl
- Modais: max-w-2xl
```

### Layout Components Structure
```tsx
// MainLayout - Estrutura padrão para todas as páginas
<div className="min-h-screen bg-gray-50">
  <nav className="bg-white shadow-sm border-b h-16">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Navbar content */}
    </div>
  </nav>
  <main>
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page content */}
    </div>
  </main>
</div>
```

## 🎨 Color System

### Primary Colors
```javascript
primary: {
  DEFAULT: '#005EB8',  // Azul principal EAU
  50: '#e6f1ff',
  100: '#b3d4ff',
  200: '#80b8ff',
  300: '#4d9bff',
  400: '#1a7eff',
  500: '#005EB8',      // Base
  600: '#004a91',
  700: '#003d7a',
  800: '#002952',
  900: '#001429',
}
```

### Color Usage Guidelines
```css
/* Backgrounds */
bg-gray-50        /* Fundo principal da aplicação */
bg-white          /* Cards, modais, forms */
bg-primary        /* Elementos de destaque, CTAs */

/* Text Colors */
text-gray-900     /* Texto principal */
text-gray-600     /* Texto secundário */
text-gray-500     /* Texto terciário/hints */
text-primary      /* Links e destaques */

/* State Colors */
bg-green-50, text-green-600    /* Sucesso */
bg-red-50, text-red-600        /* Erro */
bg-blue-50, text-blue-600      /* Info */
bg-yellow-50, text-yellow-600  /* Warning */
```

## 🔤 Typography System

### Font Configuration
```css
font-family: 'Inter', system-ui, -apple-system, sans-serif;
```

### Text Hierarchy
```tsx
// Títulos de página
<h1 className="text-2xl font-bold text-gray-900">Page Title</h1>

// Subtítulos de seção
<h2 className="text-lg font-semibold text-gray-900">Section Title</h2>

// Texto normal
<p className="text-sm font-medium text-gray-700">Body text</p>

// Texto secundário
<span className="text-xs text-gray-500">Secondary text</span>

// Labels de formulário
<label className="block text-sm font-medium text-gray-700">Label</label>
```

## 🔘 Button System

### Button Variants
```tsx
// Primary Button (ações principais)
<Button variant="default" className="bg-primary text-white hover:bg-primary/90">
  Save Changes
</Button>

// Secondary Button (ações secundárias)
<Button variant="secondary" className="bg-gray-100 text-gray-900 hover:bg-gray-200">
  Cancel
</Button>

// Outline Button (ações terciárias)
<Button variant="outline" className="border border-gray-300 hover:bg-gray-100">
  Export
</Button>

// Destructive Button (ações perigosas)
<Button variant="destructive" className="bg-red-500 text-white hover:bg-red-600">
  Delete
</Button>

// Ghost Button (ações sutis)
<Button variant="ghost" className="hover:bg-gray-100">
  View More
</Button>
```

### Button Sizes
```tsx
size="sm"      // h-9 px-3
size="default" // h-10 px-4 py-2
size="lg"      // h-11 px-8
size="icon"    // h-10 w-10
```

## 📝 Form Components

### Input Fields
```tsx
<input
  className="flex h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm 
             placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 
             focus-visible:ring-primary focus-visible:border-primary 
             disabled:cursor-not-allowed disabled:opacity-50"
  placeholder="Enter text..."
/>
```

### Select Dropdowns
```tsx
<select className="flex h-11 w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm 
                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
  <option>Option 1</option>
</select>
```

### Switches
```tsx
<Switch className="h-6 w-11 rounded-full bg-gray-200 data-[state=checked]:bg-blue-600">
  <span className="h-4 w-4 rounded-full bg-white transition-transform" />
</Switch>
```

## 📦 Card Components

### Basic Card Structure
```tsx
<Card className="rounded-lg border bg-white shadow-sm">
  <CardHeader className="p-6">
    <CardTitle className="text-lg font-semibold">Card Title</CardTitle>
    <CardDescription className="text-sm text-gray-500">
      Card description text
    </CardDescription>
  </CardHeader>
  <CardContent className="p-6 pt-0">
    {/* Card content */}
  </CardContent>
  <CardFooter className="p-6 pt-0 flex justify-end gap-3">
    <Button variant="outline">Cancel</Button>
    <Button>Save</Button>
  </CardFooter>
</Card>
```

## 📊 Grid & Layout Patterns

### Responsive Grid
```tsx
// Dashboard Grid (3 columns on desktop)
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Grid items */}
</div>

// Form Grid (2 columns on desktop)
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Form fields */}
</div>

// Profile Layout (sidebar + content)
<div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
  <div className="lg:col-span-1">{/* Sidebar */}</div>
  <div className="lg:col-span-3">{/* Content */}</div>
</div>
```

## 🔄 Spacing System

### Standard Spacing
```css
/* Padding */
p-4   /* 1rem - Compact spacing */
p-6   /* 1.5rem - Standard card padding */
p-8   /* 2rem - Large spacing */

/* Margins */
mt-4, mb-4   /* Standard vertical spacing */
my-8          /* Large section spacing */
mx-auto       /* Horizontal centering */

/* Gaps */
gap-3   /* Small gap between elements */
gap-4   /* Standard gap */
gap-6   /* Large gap between sections */
```

## 🎭 Modal & Overlay Patterns

### Modal Structure
```tsx
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
  <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
    <div className="p-6 border-b">
      <h2 className="text-lg font-semibold">Modal Title</h2>
    </div>
    <div className="p-6 overflow-y-auto flex-1">
      {/* Modal content */}
    </div>
    <div className="p-6 border-t flex justify-end gap-3">
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </div>
  </div>
</div>
```

## 🎯 Icon System

### Lucide React Icons
```tsx
import { User, Calendar, MapPin, ChevronRight } from 'lucide-react';

// Standard sizes
<User className="w-4 h-4" />     // Small
<Calendar className="w-5 h-5" />  // Medium
<MapPin className="w-6 h-6" />    // Large
```

## 🌈 Special Features

### Rainbow Gradient
```css
/* Arco-íris da marca EAU */
bg-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500
```

### Loading States
```tsx
// Loading button
<Button disabled className="opacity-50 cursor-not-allowed">
  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
  Loading...
</Button>

// Loading skeleton
<div className="animate-pulse">
  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
</div>
```

## 📱 Responsive Breakpoints

```css
/* Tailwind Breakpoints */
sm: 640px   /* Small devices */
md: 768px   /* Medium devices */
lg: 1024px  /* Large devices */
xl: 1280px  /* Extra large devices */
2xl: 1536px /* 2X large devices */
```

## ✅ Component Checklist

Antes de criar qualquer novo componente ou página:

1. **Layout Container**: Use `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`
2. **Background**: Use `bg-gray-50` para páginas, `bg-white` para cards
3. **Typography**: Siga a hierarquia de texto definida
4. **Buttons**: Use as variantes corretas para cada ação
5. **Forms**: Mantenha altura consistente `h-11` para inputs
6. **Spacing**: Use o sistema de espaçamento padrão
7. **Colors**: Use apenas cores do sistema definido
8. **Icons**: Use Lucide React com tamanhos padrões
9. **Responsive**: Teste em todos os breakpoints
10. **Accessibility**: Inclua aria-labels e focus states

## 🔧 Utility Functions

### Class Merge (cn)
```tsx
import { cn } from '@/lib/utils';

// Uso para merge condicional de classes
<div className={cn(
  "base-classes",
  isActive && "active-classes",
  isDisabled && "disabled-classes"
)} />
```

## 📝 WYSIWYG Editor

Para campos de texto rico, use sempre:
- **Editor**: `QuillBulletFix` component
- **Display**: `QuillContentUltraFixed` component
- **Nunca use**: QuillEditor ou QuillEditorSimple (deprecated)

---

**IMPORTANTE**: Este documento deve ser consultado SEMPRE antes de criar novos componentes ou páginas. A consistência visual é fundamental para a experiência do usuário.