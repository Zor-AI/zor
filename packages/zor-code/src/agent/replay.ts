import { AgentTool } from '@earendil-works/pi-agent-core';
import { Type } from '@sinclair/typebox';
import { loadConfig } from '../config';
import { SessionManager, SessionData } from '../session/manager';
import { createZorAgent } from './create';

function tool(t: any): any { return t; }

export const replaySession: AgentTool = tool({
  name: '/replay',
  label: 'replay',
  description: 'Replay a session: /replay <sessionId> [--strict]',
  parameters: Type.Object({
    sessionId: Type.String({ description: 'Session ID to replay' }),
    strict: Type.Optional(Type.Boolean({ description: 'Fail on any output difference' })),
  }),
  execute: async (_id, params, _signal, _onUpdate, ctx) => {
    try {
      const { sessionId, strict } = params as Record<string, any>;
      const config = ctx.config;
      const sessionManager = new SessionManager(config.session.dir);
      const session = sessionManager.load(sessionId) || sessionManager.list().find(s => s.id.includes(sessionId));

      if (!session) {
        return { content: [{ type: 'text', text: `Session not found: ${sessionId}` }], details: { isError: true } };
      }

      const { agent } = await createZorAgent(ctx.config, session);
      
      const originalMessages = session.messages || [];
      const replayedMessages = agent.state.messages || [];
      let diffs = 0;
      
      for (let i = 0; i < Math.min(originalMessages.length, replayedMessages.length); i++) {
        const original = originalMessages[i];
        const replayed = replayedMessages[i];
        
        const getContent = (msg: any): string => {
          if (!msg) return '';
          if (typeof msg.content === 'string') return msg.content;
          if (Array.isArray(msg.content)) return msg.content.map((c: any) => c.text || JSON.stringify(c)).join('');
          return JSON.stringify(msg.content);
        };
        
        const origContent = getContent(original);
        const replayContent = getContent(replayed);
        
        if (origContent !== replayContent) {
          diffs++;
          if (strict) {
            return {
              content: [{ type: 'text', text: `Diff at message ${i}:\nOriginal: ${origContent.slice(0, 200)}\nReplayed: ${replayContent.slice(0, 200)}` }],
              details: { isError: true, diffs }
            };
          }
        }
      }

      return {
        content: [{ type: 'text', text: `Replay complete. ${diffs} differences found in ${originalMessages.length} messages.` }],
        details: { diffs, messageCount: originalMessages.length }
      };
    } catch (e: any) {
      return { content: [{ type: 'text', text: `Replay failed: ${e.message}` }], details: { isError: true } };
    }
  },
});