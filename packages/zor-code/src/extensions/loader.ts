import { readFileSync, existsSync, readdirSync } from 'fs';
import { join, resolve } from 'path';
import { homedir } from 'os';
import { ExtensionManifest, ExtensionContribution } from './manifest';

function expandPath(p: string): string {
  if (p.startsWith('~/')) return resolve(homedir(), p.slice(2));
  return resolve(p);
}

export interface ExtensionModule {
  manifest: ExtensionManifest;
  exports: Record<string, any>;
}

export interface LoadedExtension {
  manifest: ExtensionManifest;
  path: string;
  activate: (context: any) => Promise<void> | void;
  deactivate?: () => Promise<void> | void;
}

export function loadExtensions(extensionsDir: string): LoadedExtension[] {
  const dir = expandPath(extensionsDir);
  if (!existsSync(dir)) return [];

  const extensions: LoadedExtension[] = [];

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const extPath = join(dir, entry.name);
    try {
      const ext = loadExtension(extPath);
      if (ext) extensions.push(ext);
    } catch (e: any) {
      console.error(`Failed to load extension ${entry.name}:`, e.message);
    }
  }

  return extensions;
}

function loadExtension(extPath: string): LoadedExtension | null {
  const manifestPath = join(extPath, 'manifest.json');
  if (!existsSync(manifestPath)) return null;

  const manifestContent = readFileSync(manifestPath, 'utf8');
  const manifest = JSON.parse(manifestContent) as any;

  const mainPath = manifest.main ? join(extPath, manifest.main) : join(extPath, 'index.js');
  if (!existsSync(mainPath)) return null;

  let exports: Record<string, any>;
  try {
    const module = require(mainPath);
    exports = module.default || module;
  } catch (e: any) {
    console.error(`Failed to load extension module ${extPath}:`, e.message);
    return null;
  }

  if (typeof exports.activate !== 'function') {
    console.error(`Extension ${manifest.name} missing activate function`);
    return null;
  }

  return {
    manifest,
    path: extPath,
    activate: exports.activate,
    deactivate: exports.deactivate,
  };
}

export function mergeContributions(
  builtIn: ExtensionContribution | undefined,
  extensions: LoadedExtension[]
): ExtensionContribution {
  const built = builtIn || {};
  const merged: ExtensionContribution = {
    tools: [...(built.tools || [])],
    commands: [...(built.commands || [])],
    overlays: [...(built.overlays || [])],
    themes: [...(built.themes || [])],
    keybindings: [...(built.keybindings || [])],
    skills: [...(built.skills || [])],
    providers: [...(built.providers || [])],
  };

  for (const ext of extensions) {
    const c = ext.manifest.contributes;
    if (!c) continue;
    if (c.tools) merged.tools!.push(...c.tools);
    if (c.commands) merged.commands!.push(...c.commands);
    if (c.overlays) merged.overlays!.push(...c.overlays);
    if (c.themes) merged.themes!.push(...c.themes);
    if (c.keybindings) merged.keybindings!.push(...c.keybindings);
    if (c.skills) merged.skills!.push(...c.skills);
    if (c.providers) merged.providers!.push(...c.providers);
  }

  return merged;
}