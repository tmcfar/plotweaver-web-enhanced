import { lazy } from 'react';

export const TiptapEditor = lazy(() => import('./TiptapEditor').then(mod => ({ default: mod.TiptapEditor })));
export const MonacoEditor = lazy(() => import('./MonacoEditor').then(mod => ({ default: mod.MonacoEditor })));