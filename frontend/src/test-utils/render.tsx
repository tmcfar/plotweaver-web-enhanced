import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@/components/design-system/theme-provider'

// Create a custom render function that includes all providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialTheme?: 'light' | 'dark' | 'system'
}

// Mock router context for Next.js App Router
const MockRouterContext = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

// Create test query client with shorter default times for tests
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  })

const AllTheProviders = ({ 
  children,
  theme = 'light'
}: { 
  children: React.ReactNode
  theme?: 'light' | 'dark' | 'system'
}) => {
  const queryClient = createTestQueryClient()
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme={theme}
        enableSystem={false}
        disableTransitionOnChange
      >
        <MockRouterContext>
          {children}
        </MockRouterContext>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

const customRender = (
  ui: ReactElement,
  options?: CustomRenderOptions,
) => {
  const { initialTheme = 'light', ...renderOptions } = options || {}
  
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllTheProviders theme={initialTheme}>{children}</AllTheProviders>
  )
  
  return {
    user: userEvent.setup(),
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
  }
}

// Re-export everything
export * from '@testing-library/react'
export { customRender as render, userEvent }

// Export utility functions for common test scenarios
export const waitForLoadingToFinish = () =>
  screen.findByText((content, element) => {
    return element?.tagName.toLowerCase() !== 'script' && content !== ''
  })

// Type-safe mock functions
export const createMockRouter = () => ({
  push: jest.fn(),
  replace: jest.fn(),
  prefetch: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  refresh: jest.fn(),
  pathname: '/',
  route: '/',
  query: {},
  asPath: '/',
})

// Helper to create mock Zustand store for testing
export const createMockStore = <T extends Record<string, any>>(
  initialState: T
) => {
  const store = {
    getState: () => initialState,
    setState: jest.fn((partial) => {
      Object.assign(initialState, 
        typeof partial === 'function' ? partial(initialState) : partial
      )
    }),
    subscribe: jest.fn(() => jest.fn()),
    destroy: jest.fn(),
  }
  return store
}

// Import screen separately to avoid issues
import { screen } from '@testing-library/react'