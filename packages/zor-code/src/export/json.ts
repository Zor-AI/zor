import type { SessionData } from '../session/manager';

export interface ExportData {
  version: string;
  exportedAt: string;
  session: SessionData;
  messages: Array<{
    role: string;
    content: string;
    timestamp?: string;
    toolName?: string;
    toolCallId?: string;
    stopReason?: string;
    errorMessage?: string;
  }>;
  config: {
    model: string;
    effort: string;
    permissions: string;
    sandbox: boolean;
    theme: string;
  };
  stats: {
    messageCount: number;
    tokenEstimate: number;
    duration?: number;
  };
}

export function serializeSession(session: SessionData, config: any, agentState: any): ExportData {
  const msgs = agentState?.messages || [];
  const messages = msgs.map((m: any) => ({
    role: m.role || (m.type === 'user' ? 'user' : m.type === 'assistant' ? 'assistant' : 'tool'),
    content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content),
    timestamp: m.timestamp?.toISOString(),
    toolName: m.toolName,
    toolCallId: m.toolCallId,
    stopReason: m.stopReason,
    errorMessage: m.errorMessage,
  }));

  return {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    session,
    messages,
    config: {
      model: config.model,
      effort: config.effort,
      permissions: config.permissions,
      sandbox: config.sandbox,
      theme: config.theme,
    },
    stats: {
      messageCount: messages.length,
      tokenEstimate: countTokens(JSON.stringify(messages)),
    },
  };
}

function countTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export function toJson(data: ExportData, pretty = true): string {
  return JSON.stringify(data, null, pretty ? 2 : 0);
}