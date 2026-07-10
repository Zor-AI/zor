// ponytail: one function loads template, builds prompt. agent does the rest.
import { existsSync, readFileSync, readdirSync } from 'fs';
import { join } from 'path';

const SPECIFY_DIR = join(process.cwd(), '.specify');
const TEMPLATES_DIR = join(SPECIFY_DIR, 'templates');
const MEMORY_DIR = join(SPECIFY_DIR, 'memory');
const SPECS_DIR = join(process.cwd(), 'specs');

function readFileSafe(path: string): string {
  try { return readFileSync(path, 'utf8'); } catch { return ''; }
}

function getNextFeatureNum(): string {
  if (!existsSync(SPECS_DIR)) return '001';
  const dirs = readdirSync(SPECS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory() && /^\d{3}-/.test(d.name))
    .map(d => parseInt(d.name.slice(0, 3)))
    .filter(n => !isNaN(n));
  const max = dirs.length > 0 ? Math.max(...dirs) : 0;
  return String(max + 1).padStart(3, '0');
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
}

function buildFeatureDir(name: string): { num: string; dir: string } {
  const num = getNextFeatureNum();
  const slug = slugify(name || 'feature');
  return { num, dir: join(SPECS_DIR, `${num}-${slug}`) };
}

export const SPECKIT_PROMPTS: Record<string, (input: string) => string> = {
  constitution: (input) => `You are creating project governing principles for Spec-Driven Development.

1. Read .specify/memory/constitution.md if it exists. If it does, UPDATE it with the new principles below.
2. If it doesn't exist, CREATE it.
3. The principles guide all subsequent spec, plan, and implementation work.

Write a constitution in .specify/memory/constitution.md covering:
- Code quality standards
- Testing requirements  
- Architecture constraints
- Performance requirements
- Development workflow

User request: ${input || 'Create default principles for code quality, testing, and maintainability.'}

After writing, display the constitution contents.`,

  specify: (input) => {
    const specTemplate = readFileSafe(join(TEMPLATES_DIR, 'spec-template.md'));
    const constitution = readFileSafe(join(MEMORY_DIR, 'constitution.md'));
    const feature = buildFeatureDir(input);
    return `You are creating a feature specification following Spec-Driven Development.

${
  constitution ? `Read .specify/memory/constitution.md for project principles:\n\n---\n${constitution}\n---\n\n` : ''
}Read the spec template at .specify/templates/spec-template.md and follow it exactly.

Create specification directory: specs/${feature.num}-<slug>/
Write the specification to: specs/${feature.num}-<slug>/spec.md

FEATURE DESCRIPTION: ${input || 'No description provided. Ask the user to describe the feature.'}

Follow these rules:
1. Use the EXACT template structure from .specify/templates/spec-template.md
2. Create a new feature branch: ${feature.num}-<slug-based-on-feature>
3. Extract a short slug from the feature description
4. Mark status as "Draft"
5. Include at least P1 and P2 prioritized user stories
6. Each user story must be independently testable
7. Use Given/When/Then acceptance scenarios
8. Include functional requirements (FR-001+)
9. Include measurable success criteria
10. Identify edge cases
11. Append user description to spec

After writing the spec, display a summary of the feature number, branch name, and key user stories.`},

  clarify: (input) => {
    const specs = existsSync(SPECS_DIR) ? readdirSync(SPECS_DIR) : [];
    return `You are clarifying a feature specification.

1. Find the latest spec in specs/ directory (${specs.filter(d => /^\d{3}-/.test(d)).join(', ') || 'none found'})
2. Read the spec.md
3. For each underspecified area (marked NEEDS CLARIFICATION or ambiguous), ask the user ONE question at a time
4. Record answers in the spec's Clarifications section

${input ? `\nAdditional context: ${input}` : ''}

Ask clarifying questions. Work through them sequentially. Update the spec with each answer.`},

  plan: (input) => {
    const specTemplate = readFileSafe(join(TEMPLATES_DIR, 'plan-template.md'));
    const constitution = readFileSafe(join(MEMORY_DIR, 'constitution.md'));
    const specs = existsSync(SPECS_DIR) ? readdirSync(SPECS_DIR) : [];
    return `You are creating a technical implementation plan following Spec-Driven Development.

${
  constitution ? `Read .specify/memory/constitution.md for project principles. Follow them.\n\n` : ''
}1. Find the latest spec in specs/ directory: ${specs.filter(d => /^\d{3}-/.test(d)).join(', ') || 'none found'}
2. Read the spec.md completely
3. Read .specify/templates/plan-template.md for the plan structure
4. Fill out ALL sections of the plan template:

Phase 0 - Research (write to specs/<feature>/research.md):
- Research each technology choice
- Identify version constraints and alternatives
- Document findings

Phase 1 - Design (write to specs/<feature>/data-model.md and specs/<feature>/contracts/):
- Data model design (entities, relationships)
- API contracts (if applicable)
- Create specs/<feature>/quickstart.md

Phase 2 - Plan (write to specs/<feature>/plan.md):
- Technical context: language, dependencies, storage, testing, platform
- Project structure (both docs and source code layout)
- Constitution check against .specify/memory/constitution.md

Tech stack preferences: ${input || '(none specified — infer from existing project)'}

After completing all phases, display a summary of the architecture decisions.`},

  tasks: (input) => {
    const specs = existsSync(SPECS_DIR) ? readdirSync(SPECS_DIR) : [];
    return `You are generating an implementation task list following Spec-Driven Development.

1. Find the latest spec in specs/ directory: ${specs.filter(d => /^\d{3}-/.test(d)).join(', ') || 'none found'}
2. Read these files: spec.md, plan.md, data-model.md, research.md, quickstart.md
3. Read .specify/templates/tasks-template.md for structure
4. Generate tasks.md in specs/<feature>/tasks.md

Rules:
- Tasks organized by user story (from spec.md)
- Use format: [ID] [P?] [Story] Description
- [P] marks parallel-executable tasks (different files, no deps)
- Dependencies respected within each phase
- Each phase has a checkpoint for validation

${input ? `\nAdditional requirements: ${input}` : ''}

After writing tasks.md, display a task count summary per phase.`},

  implement: (input) => {
    const specs = existsSync(SPECS_DIR) ? readdirSync(SPECS_DIR) : [];
    return `You are implementing a feature following Spec-Driven Development.

1. Find the latest spec in specs/ directory: ${specs.filter(d => /^\d{3}-/.test(d)).join(', ') || 'none found'}
2. Read ALL prerequisite files: constitution.md, spec.md, plan.md, tasks.md
3. Execute tasks in order from tasks.md
4. Follow these rules:
   - Respect task dependencies (non-[P] tasks execute sequentially)
   - [P] tasks can run in parallel
   - Validate each checkpoint before moving to next phase
   - Write tests BEFORE implementation (if tests are in the plan)
   - Commit after each logical group of completed tasks

${input ? `\nImplementation notes: ${input}` : ''}

Start by reading tasks.md and executing Phase 1 tasks. Report progress after each completed phase.`},

  converge: (input) => {
    const specs = existsSync(SPECS_DIR) ? readdirSync(SPECS_DIR) : [];
    return `You are auditing a feature implementation against its spec.

1. Find the latest spec in specs/ directory: ${specs.filter(d => /^\d{3}-/.test(d)).join(', ') || 'none found'}
2. Read ALL files: constitution.md, spec.md, plan.md, tasks.md
3. Audit the codebase against the spec:
   - Which acceptance scenarios pass?
   - Which functional requirements are met?
   - Which tasks are complete vs pending?
4. For anything incomplete:
   - Append new tasks to tasks.md
   - Mark original tasks as completed or blocked
5. Report convergence status: % complete, remaining work, blockers

${input ? `\nFocus areas: ${input}` : ''}

Start by reading the spec and auditing the actual code. Report findings.`},
};
