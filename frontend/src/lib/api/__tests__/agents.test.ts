import { AgentClient } from '../agents';
import { lockService } from '../locks';

// Mock the lock service
jest.mock('../locks', () => ({
  lockService: {
    checkLockConflicts: jest.fn()
  }
}));

// Mock the lock conflict dialog
jest.mock('../../constants/dialogConfig', () => ({
  LOCK_CONFLICT_DIALOG_CONFIG: {
    showDialog: jest.fn()
  }
}));

// Set a shorter timeout for faster tests
jest.setTimeout(5000);

describe('AgentClient', () => {
  let client: AgentClient;
  let mockFetch: jest.Mock;
  let mockEventSource: {
    onmessage: ((event: MessageEvent) => void) | null;
    onerror: ((event: Event) => void) | null;
    close: jest.Mock;
  };

  beforeEach(() => {
    client = new AgentClient();

    // Mock fetch
    mockFetch = jest.fn();
    (globalThis as unknown as { fetch: jest.Mock }).fetch = mockFetch;

    // Mock EventSource
    mockEventSource = {
      onmessage: null,
      onerror: null,
      close: jest.fn()
    };
    (globalThis as unknown as { EventSource: jest.Mock }).EventSource = jest.fn(() => mockEventSource);

    // Mock lock service
    (lockService.checkLockConflicts as jest.Mock).mockResolvedValue([]);
  });

  it('executes agent without conflicts', async () => {
    const jobId = 'test-job';
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ jobId })
    });

    const resultPromise = client.executeAgent('test-agent', { data: 'test' });

    // Wait for EventSource to be created
    await new Promise(resolve => setTimeout(resolve, 10));

    // Simulate successful completion
    if (mockEventSource.onmessage) {
      mockEventSource.onmessage({
        data: JSON.stringify({
          status: 'completed',
          result: { success: true }
        })
      } as MessageEvent);
    }

    const result = await resultPromise;
    expect(result.result).toEqual({ success: true });
  });

  it('handles lock conflicts', async () => {
    const conflicts = [
      {
        componentId: 'file-1',
        componentType: 'file',
        lockLevel: 'frozen' as const,
        lockedBy: 'user-1',
        expiresAt: new Date().toISOString()
      }
    ];

    (lockService.checkLockConflicts as jest.Mock).mockResolvedValue(conflicts);

    // Import and setup the mock for the dialog config
    const { LOCK_CONFLICT_DIALOG_CONFIG } = require('../../constants/dialogConfig');
    (LOCK_CONFLICT_DIALOG_CONFIG.showDialog as jest.Mock).mockImplementation(({ onCancel }: { onCancel: () => void }) => {
      onCancel();
    });

    const result = await client.executeAgent('test-agent', { data: 'test' });
    expect(result.cancelled).toBe(true);
  });

  it('handles agent errors', async () => {
    const jobId = 'test-job';
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ jobId })
    });

    const resultPromise = client.executeAgent('test-agent', { data: 'test' });

    // Wait for EventSource to be created
    await new Promise(resolve => setTimeout(resolve, 10));

    // Simulate error
    if (mockEventSource.onmessage) {
      mockEventSource.onmessage({
        data: JSON.stringify({
          status: 'error',
          error: 'Test error'
        })
      } as MessageEvent);
    }

    await expect(resultPromise).rejects.toThrow('Test error');
  });
});

