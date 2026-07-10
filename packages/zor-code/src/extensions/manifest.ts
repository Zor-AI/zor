import { Type, type Static } from '@sinclair/typebox';

export const ExtensionManifestSchema = Type.Object({
  name: Type.String({ minLength: 1 }),
  version: Type.String({ pattern: '^\\d+\\.\\d+\\.\\d+$' }),
  description: Type.Optional(Type.String()),
  author: Type.Optional(Type.String()),
  license: Type.Optional(Type.String()),
  repository: Type.Optional(Type.String()),
  keywords: Type.Optional(Type.Array(Type.String())),
  engines: Type.Optional(Type.Object({
    zor: Type.Optional(Type.String()),
  })),
  contributes: Type.Optional(Type.Object({
    tools: Type.Optional(Type.Array(Type.Object({
      name: Type.String(),
      description: Type.String(),
      schema: Type.Any(),
      execute: Type.String(),
    }))),
    commands: Type.Optional(Type.Array(Type.Object({
      name: Type.String(),
      label: Type.String(),
      description: Type.String(),
      schema: Type.Any(),
      execute: Type.String(),
    }))),
    overlays: Type.Optional(Type.Array(Type.Object({
      id: Type.String(),
      position: Type.Union([Type.Literal('left'), Type.Literal('center'), Type.Literal('right')]),
      component: Type.String(),
      props: Type.Optional(Type.Record(Type.String(), Type.Any())),
    }))),
    themes: Type.Optional(Type.Array(Type.Object({
      name: Type.String(),
      palette: Type.Record(Type.String(), Type.String()),
    }))),
    keybindings: Type.Optional(Type.Array(Type.Object({
      action: Type.String(),
      keys: Type.Union([Type.String(), Type.Array(Type.String())]),
    }))),
    skills: Type.Optional(Type.Array(Type.Object({
      name: Type.String(),
      description: Type.String(),
      args: Type.Optional(Type.Array(Type.String())),
      template: Type.String(),
    }))),
    providers: Type.Optional(Type.Array(Type.Object({
      id: Type.String(),
      name: Type.String(),
      api: Type.String(),
      baseUrl: Type.String(),
      envKey: Type.String(),
      models: Type.Array(Type.Object({
        id: Type.String(),
        name: Type.String(),
        contextWindow: Type.Optional(Type.Number()),
        maxTokens: Type.Optional(Type.Number()),
        supportsThinking: Type.Optional(Type.Boolean()),
        supportsVision: Type.Optional(Type.Boolean()),
        pricing: Type.Optional(Type.Object({
          input: Type.Number(),
          output: Type.Number(),
        })),
      })),
    }))),
  })),
});

export type ExtensionManifest = Static<typeof ExtensionManifestSchema>;
export type ExtensionContribution = ExtensionManifest['contributes'];

export interface ExtensionContext {
  manifest: ExtensionManifest;
  path: string;
  registerTool: (tool: any) => void;
  registerCommand: (command: any) => void;
  registerOverlay: (overlay: any) => void;
  registerTheme: (theme: any) => void;
  registerKeybinding: (keybinding: any) => void;
  registerSkill: (skill: any) => void;
  registerProvider: (provider: any) => void;
  onEvent: (event: string, handler: (...args: any[]) => void) => void;
}