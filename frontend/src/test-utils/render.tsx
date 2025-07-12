import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from '@/components/design-system/theme-provider'
import { StoreProvider } from '@/components/providers/StoreProvider'
import { useStore, StoreState } from '@/lib/store/createStore'
import { createMockStore } from './store-helpers'

// Create a custom render function that includes all providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialTheme?: 'light' | 'dark' | 'system'
  initialStoreState?: Partial<StoreState>
  withStoreProvider?: boolean
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

// Store-aware wrapper that initializes store before rendering
const TestStoreWrapper = ({ 
  children, 
  initialState 
}: { 
  children: React.ReactNode
  initialState?: Partial<StoreState>
}) => {
  // Initialize store with complete state before any subscriptions
  React.useEffect(() => {
    const completeState = createMockStore(initialState);
    useStore.setState(completeState, true); // Replace entire state
  }, [initialState]);

  return <>{children}</>;
};

const AllTheProviders = ({ 
  children,
  theme = 'light',
  initialStoreState,
  withStoreProvider = false
}: { 
  children: React.ReactNode
  theme?: 'light' | 'dark' | 'system'
  initialStoreState?: Partial<StoreState>
  withStoreProvider?: boolean
}) => {
  const queryClient = createTestQueryClient()
  
  const content = (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme={theme}
        enableSystem={false}
        disableTransitionOnChange
      >
        <MockRouterContext>
          {withStoreProvider ? (
            <TestStoreWrapper initialState={initialStoreState}>
              <StoreProvider>
                {children}
              </StoreProvider>
            </TestStoreWrapper>
          ) : (
            <TestStoreWrapper initialState={initialStoreState}>
              {children}
            </TestStoreWrapper>
          )}
        </MockRouterContext>
      </ThemeProvider>
    </QueryClientProvider>
  );

  return content;
}

const customRender = (
  ui: ReactElement,
  options?: CustomRenderOptions,
) => {
  const { 
    initialTheme = 'light', 
    initialStoreState,
    withStoreProvider = false,
    ...renderOptions 
  } = options || {}
  
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllTheProviders 
      theme={initialTheme}
      initialStoreState={initialStoreState}
      withStoreProvider={withStoreProvider}
    >
      {children}
    </AllTheProviders>
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

// Convenience functions for store-aware rendering
export const renderWithStore = (
  ui: ReactElement,
  options?: CustomRenderOptions & { storeState?: Partial<StoreState> }
) => {
  return customRender(ui, {
    ...options,
    initialStoreState: options?.storeState,
    withStoreProvider: false
  });
};

export const renderWithStoreProvider = (
  ui: ReactElement,
  options?: CustomRenderOptions & { storeState?: Partial<StoreState> }
) => {
  return customRender(ui, {
    ...options,
    initialStoreState: options?.storeState,
    withStoreProvider: true
  });
};

// Import screen separately to avoid issues
import { screen } from '@testing-library/react'

// Re-export store helpers for convenience
export { createMockStore, createMockZustandStore, resetStoreForTesting } from './store-helpers'