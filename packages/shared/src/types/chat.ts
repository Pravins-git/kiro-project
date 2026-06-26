export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  messages: ChatMessage[];
  status: 'active' | 'completed';
  startedAt: string;
  updatedAt: string;
}

export interface ChatRequest {
  message: string;
  sessionId?: string; // Optional: If starting a new chat, omit this
}

export interface ChatResponse {
  message: ChatMessage;
  sessionId: string;
  isComplete?: boolean;
}
