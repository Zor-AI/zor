import { ExtensionManifest, ExtensionContribution } from './extensions/manifest';
import { loadExtensions, mergeContributions, LoadedExtension } from './extensions/loader';

export interface ToolRegistry {
  register(name: string, tool: any): void;
  get(name: string): any | undefined;
  getAll(): any[];
}

export interface CommandRegistry {
  register(name: string, command: any): void;
  get(name: string): any | undefined;
  getAll(): any[];
}

export interface OverlayRegistry {
  register(id: string, overlay: any): void;
  get(id: string): any | undefined;
  getAll(): any[];
}

export interface ThemeRegistry {
  register(name: string, theme: any): void;
  get(name: string): any | undefined;
  getAll(): any[];
}

export interface SkillRegistry {
  register(name: string, skill: any): void;
  get(name: string): any | undefined;
  getAll(): any[];
}

export interface ProviderRegistry {
  register(id: string, provider: any): void;
  get(id: string): any | undefined;
  getAll(): any[];
}

export interface KeybindingRegistry {
  register(action: string, keys: string | string[]): void;
  get(action: string): string[] | undefined;
  getAll(): Record<string, string[] | undefined>;
}

export interface ExtensionRegistries {
  tools: ToolRegistry;
  commands: CommandRegistry;
  overlays: OverlayRegistry;
  themes: ThemeRegistry;
  skills: SkillRegistry;
  providers: ProviderRegistry;
  keybindings: KeybindingRegistry;
}

function createRegistry<T>(): {
  register: (id: string, item: T) => void;
  get: (id: string) => T | undefined;
  getAll: () => T[];
} {
  const map = new Map<string, T>();
  return {
    register: (id: string, item: T) => map.set(id, item),
    get: (id: string) => map.get(id),
    getAll: () => Array.from(map.values()),
  };
}

export function createRegistries(): ExtensionRegistries {
  const keybindingMap = new Map<string, string[]>();
  
  return {
    tools: createRegistry<any>(),
    commands: createRegistry<any>(),
    overlays: createRegistry<any>(),
    themes: createRegistry<any>(),
    skills: createRegistry<any>(),
    providers: createRegistry<any>(),
    keybindings: {
      register: (action: string, keys: string | string[]) => {
        keybindingMap.set(action, Array.isArray(keys) ? keys : [keys]);
      },
      get: (action: string) => keybindingMap.get(action),
      getAll: () => Object.fromEntries(keybindingMap),
    },
  };
}

export class ExtensionHost {
  private extensions: LoadedExtension[] = [];
  private registries: ExtensionRegistries;
  private builtInContributions: ExtensionContribution;
  private mergedContributions: ExtensionContribution | null = null;

  constructor(builtInContributions: ExtensionContribution) {
    this.builtInContributions = builtInContributions;
    this.registries = createRegistries();
  }

  async loadExtensions(extensionsDir: string): Promise<void> {
    this.extensions = loadExtensions(extensionsDir);
    
    for (const ext of this.extensions) {
      const context = this.createContext(ext);
      await ext.activate(context);
    }

    this.mergedContributions = mergeContributions(this.builtInContributions, this.extensions);
    this.registerAll();
  }

  private createContext(ext: LoadedExtension): any {
    return {
      manifest: ext.manifest,
      path: ext.path,
      registerTool: (tool: any) => this.registries.tools.register(tool.name, tool),
      registerCommand: (command: any) => this.registries.commands.register(command.name, command),
      registerOverlay: (overlay: any) => this.registries.overlays.register(overlay.id, overlay),
      registerTheme: (theme: any) => this.registries.themes.register(theme.name, theme),
      registerKeybinding: (kb: any) => this.registries.keybindings.register(kb.action, kb.keys),
      registerSkill: (skill: any) => this.registries.skills.register(skill.name, skill),
      registerProvider: (provider: any) => this.registries.providers.register(provider.id, provider),
      onEvent: (event: string, handler: Function) => {
        // Event handling could be implemented here
      },
    };
  }

  private registerAll(): void {
    if (!this.mergedContributions) return;
    const c = this.mergedContributions;

    if (c.tools) for (const t of c.tools) this.registries.tools.register(t.name, t);
    if (c.commands) for (const cmd of c.commands) this.registries.commands.register(cmd.name, cmd);
    if (c.overlays) for (const o of c.overlays) this.registries.overlays.register(o.id, o);
    if (c.themes) for (const t of c.themes) this.registries.themes.register(t.name, t);
    if (c.keybindings) for (const k of c.keybindings) this.registries.keybindings.register(k.action, k.keys);
    if (c.skills) for (const s of c.skills) this.registries.skills.register(s.name, s);
    if (c.providers) for (const p of c.providers) this.registries.providers.register(p.id, p);
  }

  getRegistries(): ExtensionRegistries {
    return this.registries;
  }

  getMergedContributions(): ExtensionContribution {
    return this.mergedContributions!;
  }

  async shutdown(): Promise<void> {
    for (const ext of this.extensions) {
      if (ext.deactivate) await ext.deactivate();
    }
  }
}

export async function createExtensionHost(
  builtInContributions: ExtensionContribution,
  extensionsDir: string
): Promise<ExtensionHost> {
  const host = new ExtensionHost(builtInContributions);
  await host.loadExtensions(extensionsDir);
  return host;
}

export { loadExtensions, mergeContributions, LoadedExtension } from './extensions/loader';
export { ExtensionManifest, ExtensionContribution } from './extensions/manifest';