import { readFileSync, readdirSync, existsSync } from 'fs';
import { join, resolve } from 'path';
import { homedir } from 'os';

export interface Skill {
  name: string;
  description: string;
  args: string[];
  content: string;
  filePath: string;
}

function expandPath(p: string): string {
  if (p.startsWith('~/')) return resolve(homedir(), p.slice(2));
  return resolve(p);
}

function parseSkillFile(content: string, filePath: string): Skill | null {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
  let description = '';
  let args: string[] = [];
  let body = content;

  if (frontmatterMatch) {
    const fm = frontmatterMatch[1];
    const descMatch = fm.match(/description:\s*['"]([^'"]+)['"]/);
    const argsMatch = fm.match(/args:\s*\[([^\]]+)\]/);
    if (descMatch) description = descMatch[1];
    if (argsMatch) {
      args = argsMatch[1].split(',').map(s => s.trim().replace(/['"]/g, ''));
    }
    body = content.slice(frontmatterMatch[0].length).trim();
  }

  const name = filePath.split('/').pop()?.replace(/\.md$/, '') || 'unnamed';
  return { name, description, args, content: body, filePath };
}

export function loadSkills(skillsDir: string): Skill[] {
  const dir = expandPath(skillsDir);
  if (!existsSync(dir)) return [];

  const files = readdirSync(dir).filter(f => f.endsWith('.md'));
  const skills: Skill[] = [];

  for (const file of files) {
    try {
      const content = readFileSync(join(dir, file), 'utf8');
      const skill = parseSkillFile(content, file);
      if (skill) skills.push(skill);
    } catch {
      // Ignore unreadable files
    }
  }

  return skills;
}

export function expandSkill(skill: Skill, providedArgs: Record<string, string>): string {
  let result = skill.content;
  for (const arg of skill.args) {
    const value = providedArgs[arg] || `{{${arg}}}`;
    result = result.replace(new RegExp(`\\{\\{${arg}\\}\\}`, 'g'), value);
  }
  return result;
}

export function listSkillNames(skillsDir: string): string[] {
  return loadSkills(skillsDir).map(s => s.name);
}

export function getSkill(skillsDir: string, name: string): Skill | undefined {
  return loadSkills(skillsDir).find(s => s.name.toLowerCase() === name.toLowerCase());
}