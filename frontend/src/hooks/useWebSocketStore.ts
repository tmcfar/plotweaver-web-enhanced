import create from 'zustand';
import { nanoid } from 'nanoid';

interface Message {
  id: string;
  channel: string;
  data: any;
  timestamp: number;
}

interface WebSocketStore {
  messages: Message[];
  addMessage: (channel: string, data: any) => void;
  batchSend: () => void;
}

const BATCH_INTERVAL = 100; // ms
let batchTimeout: NodeJS.Timeout | null = null;
let messageQueue: Message[] = [];

export const useWebSocketStore = create<WebSocketStore>((set, get) => ({
  messages: [],
  addMessage: (channel, data) => {
    const message = {
      id: nanoid(),
      channel,
      data,
      timestamp: Date.now()
    };
    messageQueue.push(message);
    
    if (!batchTimeout) {
      batchTimeout = setTimeout(() => {
        const { messages } = get();
        set({ messages: [...messages, ...messageQueue] });
        messageQueue = [];
        batchTimeout = null;
      }, BATCH_INTERVAL);
    }
  },
  batchSend: () => {
    if (messageQueue.length > 0) {
      const { messages } = get();
      set({ messages: [...messages, ...messageQueue] });
      messageQueue = [];
      if (batchTimeout) {
        clearTimeout(batchTimeout);
        batchTimeout = null;
      }
    }
  }
}));