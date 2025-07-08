'use client';

import { ServiceWorkerRegistration } from '@/components/optimized/ServiceWorkerRegistration';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import { ConflictResolver } from '@/components/sync/ConflictResolver';
import { Toaster } from '@/components/ui/toaster';

export function ClientProviders() {
  return (
    <>
      <ServiceWorkerRegistration />
      <Toaster />
      <OfflineIndicator />
      <ConflictResolver />
    </>
  );
}
