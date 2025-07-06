import { create } from 'zustand';

export type LockLevel = 'soft' | 'hard' | 'frozen';

export interface Lock {
  id: string;
  level: LockLevel;
  owner?: string;
  expiresAt?: Date;
}

interface LockStore {
  locks: Record<string, Lock>;
  setLock: (fileId: string, lock: Lock) => void;
  removeLock: (fileId: string) => void;
  clearLocks: () => void;
}

export const useLockStore = create<LockStore>((set) => ({
  locks: {},
  setLock: (fileId, lock) =>
    set((state) => ({
      locks: { ...state.locks, [fileId]: lock },
    })),
  removeLock: (fileId) =>
    set((state) => {
      const newLocks = { ...state.locks };
      delete newLocks[fileId];
      return { locks: newLocks };
    }),
  clearLocks: () => set({ locks: {} }),
}));
