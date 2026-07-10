import { describe, it, expect } from 'vitest';

const SKIP_REASON = 'Set NVIDIA_API_KEY + ZOR_LIVE_TEST=1 to run live provider tests';

function haveLiveEnv(): boolean {
  return process.env.ZOR_LIVE_TEST === '1' && !!process.env.NVIDIA_API_KEY;
}

describe('Live Provider (NVIDIA NIM free tier)', () => {
  it.skipIf(!haveLiveEnv() || process.env.CI)(
    'smoke test: agent prompt returns response',
    async () => {
      const { createZorAgent } = await import('../../agent/create');
      const config = {
        model: 'nvidia/nvidia/nemotron-3-super-120b-a12b',
        effort: 'low' as const,
        permissions: 'auto' as const,
        session: { dir: './.zor/sessions', compactThreshold: 160000 },
        mcp: { servers: [] },
      };
      const { agent, resolved } = await createZorAgent(config);
      expect(resolved.provider.id).toBe('nvidia');

      let responseText = '';
      agent.subscribe((event: any) => {
        if (event.type === 'message_update' && event.assistantMessageEvent?.type === 'text_delta') {
          responseText += event.assistantMessageEvent.delta;
        }
      });

      await agent.prompt('Reply with exactly: OK');
      expect(responseText.length).toBeGreaterThan(0);
    },
    60000,
  );

  it.skipIf(!haveLiveEnv() || process.env.CI)(
    'pipe mode returns response',
    async () => {
      const { createZorAgent } = await import('../../agent/create');
      const config = {
        model: 'nvidia/nvidia/nemotron-3-super-120b-a12b',
        effort: 'low' as const,
        permissions: 'auto' as const,
        session: { dir: './.zor/sessions', compactThreshold: 160000 },
        mcp: { servers: [] },
      };
      const { agent } = await createZorAgent(config);
      let text = '';
      agent.subscribe((event: any) => {
        if (event.type === 'message_update' && event.assistantMessageEvent?.type === 'text_delta') {
          text += event.assistantMessageEvent.delta;
        }
      });

      await agent.prompt('Say hello');
      expect(text.length).toBeGreaterThan(0);
    },
    60000,
  );
});
