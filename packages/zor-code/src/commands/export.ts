import { Type } from '@sinclair/typebox';
import { AgentTool } from '@earendil-works/pi-agent-core';
import { SessionData } from '../session/manager';
import { join } from 'path';
import { mkdirSync, writeFileSync } from 'fs';
import { homedir } from 'os';
import { serializeSession, toJson } from '../export/json';
import { toHtml } from '../export/html';

interface ExportParams {
  format?: 'json' | 'html' | 'md';
  sessionId?: string;
  output?: string;
}

function tool(t: any): any { return t; }

export const exportTool: AgentTool = tool({
  name: '/export', label: 'export',
  description: 'Export session: /export [json|html|md] [sessionId] [--output <path>]',
  parameters: Type.Object({
    format: Type.Optional(Type.Union([Type.Literal('json'), Type.Literal('html'), Type.Literal('md')])),
    sessionId: Type.Optional(Type.String()),
    output: Type.Optional(Type.String()),
  }),
  execute: async (_id, params, _signal, _onUpdate, ctx: any) => {
    try {
      const { format = 'html', sessionId, output } = params as ExportParams;
      const session = sessionId ? ctx.sessionManager.get(sessionId) : ctx.session;

      if (!session) {
        return { content: [{ type: 'text', text: `Session not found: ${sessionId || 'current'}` }], details: { isError: true } };
      }

      const data = serializeSession(session, ctx.config, ctx.agent.state);
      let content: string;
      let ext = format;

      switch (format) {
        case 'json':
          content = toJson(data);
          break;
        case 'html':
          content = toHtml(data);
          break;
        case 'md':
        default: {
          let md = `# Zor Session Export\n\n**Date:** ${data.exportedAt}\n**Session:** ${data.session.id}\n**Model:** ${data.config.model}\n\n---\n\n`;
          for (const m of data.messages) {
            const c = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
            md += `### ${m.role}\n\n${c}\n\n`;
          }
          content = md;
          ext = 'md';
        }
      }

      let filepath: string;
      if (output) {
        filepath = output;
      } else {
        const exportDir = join(homedir(), '.zor', 'exports');
        mkdirSync(exportDir, { recursive: true });
        const date = new Date().toISOString().split('T')[0];
        const filename = `zor-session-${date}-${session.id.slice(-8)}.${ext}`;
        filepath = join(exportDir, filename);
      }

      writeFileSync(filepath, content, 'utf8');
      return {
        content: [{ type: 'text', text: `Session exported to ${filepath} (${data.messages.length} messages, ${format.toUpperCase()})` }],
        details: { path: filepath, format, messageCount: data.messages.length },
      };
    } catch (e: any) {
      return { content: [{ type: 'text', text: `Export failed: ${e.message}` }], details: { isError: true } };
    }
  },
});