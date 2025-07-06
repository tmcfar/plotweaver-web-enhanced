# PlotWeaver Frontend

A modern, AI-powered novel writing platform built with Next.js 14, TypeScript, and Tailwind CSS.

## 🚀 Features

- **Modern Architecture**: Next.js 14 with App Router and TypeScript
- **Design System**: Comprehensive design tokens with light/dark themes
- **Authentication**: Clerk integration with protected routes
- **UI Components**: shadcn/ui component library with custom variants
- **Responsive Design**: Mobile-first responsive design
- **Performance**: Optimized build with code splitting
- **Accessibility**: WCAG 2.1 AA compliant components

## 🛠 Tech Stack

- **Framework**: Next.js 14
- **Language**: TypeScript
- **Styling**: Tailwind CSS with CSS variables
- **Components**: Radix UI primitives with shadcn/ui
- **Authentication**: Clerk
- **State Management**: Zustand (existing)
- **Icons**: Lucide React + custom icons
- **Deployment**: Vercel-ready

## 📦 Installation

```bash
npm install --legacy-peer-deps
```

## 🚀 Development

```bash
npm run dev     # Start development server
npm run build   # Build for production
npm run start   # Start production server
npm run lint    # Run ESLint
npm run type-check # Run TypeScript compiler
```

## 🎨 Design System

The design system is built with:

- **Tokens**: Colors, typography, spacing, shadows
- **Themes**: Light, dark, and system preference support
- **Components**: Consistent, accessible UI components
- **Icons**: Custom icon set for PlotWeaver
- **Loading States**: Spinners, skeletons, and progress indicators
- **Empty States**: Contextual empty state components

### Usage

```tsx
import { 
  Button, 
  Card, 
  ThemeProvider, 
  useTheme,
  Logo 
} from '@/components/design-system'
```

## 🔐 Authentication

Protected routes are handled by Clerk middleware:

- `/dashboard/*` - Requires authentication
- `/projects/*` - Requires authentication  
- `/settings/*` - Requires authentication

## 📁 Project Structure

```
frontend/
├── app/                    # Next.js 14 App Router
│   ├── (auth)/            # Authentication routes
│   ├── (dashboard)/       # Protected dashboard routes
│   ├── layout.tsx         # Root layout
│   └── page.tsx          # Landing page
├── src/
│   ├── components/
│   │   ├── design-system/ # Design system components
│   │   ├── ui/           # shadcn/ui components
│   │   └── brand/        # Brand components
│   ├── lib/              # Utilities and configurations
│   └── types/            # TypeScript type definitions
├── public/               # Static assets
└── middleware.ts         # Clerk auth middleware
```

## 🎯 Key Components

### Authentication Flow
- Landing page with feature showcase
- Sign-in/Sign-up with Clerk
- Onboarding with writing mode selection
- Protected dashboard

### Design System
- **ThemeProvider**: Context for theme management
- **ThemeToggle**: Light/dark/system theme switcher
- **Icons**: Custom PlotWeaver icon set
- **Loading States**: Various loading indicators
- **Empty States**: Contextual empty state messages

## 📱 Responsive Design

- **Mobile**: 640px+ (read-only view, basic edits)
- **Tablet**: 768px+ (full editing, simplified layout)
- **Desktop**: 1024px+ (complete feature set)
- **Wide**: 1280px+ (optimized for large screens)

## ⚡ Performance

- **First Contentful Paint**: <1.2s target
- **Time to Interactive**: <3.5s target
- **Lighthouse Score**: >90 target
- **Bundle Size**: <200KB initial target

## 🎨 Customization

### Theme Customization

Modify design tokens in `src/components/design-system/tokens.ts`:

```ts
export const designTokens = {
  colors: {
    primary: { /* ... */ },
    // Add custom colors
  },
  // Customize other tokens
}
```

### Component Variants

Add new variants to shadcn/ui components using CVA:

```ts
const buttonVariants = cva(baseClasses, {
  variants: {
    variant: {
      default: "...",
      custom: "...", // Add custom variant
    },
  },
})
```

## 🔄 Environment Variables

Copy `.env.local.example` to `.env.local` and configure:

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...

# API Configuration  
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

## 🧪 Testing

```bash
npm run test        # Run tests
npm run test:e2e    # Run E2E tests with Playwright
npm run test:visual # Run visual regression tests
```

## 📈 Monitoring

- **Error Tracking**: Sentry integration
- **Analytics**: Vercel Analytics
- **Performance**: Web Vitals monitoring

## 🤝 Contributing

1. Follow the existing code patterns
2. Use the design system components
3. Maintain TypeScript strict mode
4. Follow accessibility best practices
5. Test on multiple screen sizes

## 📄 License

This project is part of the PlotWeaver platform.
