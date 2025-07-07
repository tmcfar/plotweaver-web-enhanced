/**
 * Common type definitions to replace 'any' usage across the application
 */

// API Response types
export interface APIResponse<T = unknown> {
    data?: T;
    error?: string;
    message?: string;
    success: boolean;
}

// WebSocket message types
export interface WebSocketMessage<T = unknown> {
    type: string;
    payload: T;
    timestamp: number;
    id?: string;
}

// Component prop types
export interface ComponentProps {
    className?: string;
    children?: React.ReactNode;
}

// Project related types
export interface ProjectData {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    updatedAt: string;
    userId: string;
}

// User types
export interface UserProfile {
    id: string;
    email: string;
    name: string;
    avatar?: string;
    preferences: Record<string, unknown>;
}

// Lock types
export interface LockData {
    id: string;
    componentId: string;
    level: 'soft' | 'hard' | 'frozen';
    userId: string;
    reason?: string;
    createdAt: string;
    expiresAt?: string;
}

// Agent types
export interface AgentData {
    id: string;
    name: string;
    type: string;
    status: 'idle' | 'running' | 'complete' | 'error';
    progress?: number;
    result?: Record<string, unknown>;
}

// Event handler types
export type EventHandler<T = Event> = (event: T) => void;
export type AsyncEventHandler<T = Event> = (event: T) => Promise<void>;

// Form types
export interface FormState<T = Record<string, unknown>> {
    data: T;
    errors: Record<string, string>;
    isSubmitting: boolean;
    isValid: boolean;
}

// Generic callback types
export type Callback<T = void> = () => T;
export type CallbackWithArgs<TArgs extends unknown[], TReturn = void> = (...args: TArgs) => TReturn;

// Hook return types
export interface AsyncState<T> {
    data: T | null;
    loading: boolean;
    error: string | null;
}

// Export utility type helpers
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequireOnly<T, K extends keyof T> = Partial<T> & Required<Pick<T, K>>;
