import type { AgentMessage } from '@earendil-works/pi-agent-core';

function getMessageText(m: AgentMessage): string {
  const msg = m as any;
  if (typeof msg.content === 'string') return msg.content;
  if (Array.isArray(msg.content)) {
    return msg.content.filter((c: any) => c?.type === 'text').map((c: any) => c.text).join('\n');
  }
  if (msg.text) return msg.text;
  if (msg.summary) return msg.summary;
  return '';
}

function estimateTokens(messages: AgentMessage[]): number {
  let total = 0;
  for (const m of messages) { total += getMessageText(m).length / 4; }
  return total * 1.33;
}

export async function compactStrategy(
  messages: AgentMessage[],
  threshold: number,
  summarize?: (texts: string[]) => Promise<string>
): Promise<AgentMessage[]> {
  const tokens = estimateTokens(messages);
  if (tokens < threshold) return messages;

  const KEEP_RAW = 20;
  const keepFresh = messages.slice(-KEEP_RAW);
  if (messages.length <= KEEP_RAW) return messages;

  const oldMessages = messages.slice(0, -KEEP_RAW);
  const oldTexts = oldMessages.map(getMessageText).filter(Boolean);

  let summaryText: string;
  if (summarize) {
    summaryText = await summarize(oldTexts);
  } else {
    summaryText = `[Context compacted: ${oldMessages.length} messages summarized. Continue working.]`;
  }

  const summary: AgentMessage = {
    role: 'user',
    content: summaryText,
    timestamp: Date.now(),
  } as AgentMessage;

  return [summary, ...keepFresh];
}