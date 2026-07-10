import { Type } from '@sinclair/typebox';
import { AgentTool } from '@earendil-works/pi-agent-core';
import { loadSkills, expandSkill, getSkill, listSkillNames } from '../skills';

function tool(t: any): any { return t; }

export const skillTool = tool({
  name: '/skill', label: 'skill',
  description: 'Run skill template: /skill <name> [key=value ...]',
  parameters: Type.Object({
    name: Type.String({ description: 'Skill name' }),
    args: Type.Optional(Type.String({ description: 'Key=value pairs' })),
  }),
  execute: async (_id, params, _signal, _onUpdate, ctx) => {
    try {
      const { name, args = '' } = params as Record<string, any>;
      const skillsDir = ctx.config.skills?.dir || '~/.zor/skills';
      const skill = getSkill(skillsDir, name);

      if (!skill) {
        const available = listSkillNames(skillsDir);
        return {
          content: [{ type: 'text', text: `Unknown skill: ${name}\nAvailable: ${available.join(', ') || 'none'}` }],
          details: { isError: true },
        };
      }

      // Parse key=value args
      const parsedArgs: Record<string, string> = {};
      if (args) {
        for (const part of args.split(' ')) {
          const eq = part.indexOf('=');
          if (eq > 0) {
            parsedArgs[part.slice(0, eq)] = part.slice(eq + 1);
          }
        }
      }

      const expanded = expandSkill(skill, parsedArgs);
      
      // Inject into prompt by adding as a user message
      ctx.agent.prompt(expanded);
      
      return {
        content: [{ type: 'text', text: `Skill "${name}" expanded and sent to agent.` }],
        details: { skill: name, args: parsedArgs },
      };
    } catch (e: any) {
      return { content: [{ type: 'text', text: `Skill error: ${e.message}` }], details: { isError: true } };
    }
  },
});