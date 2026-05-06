import { Command } from 'commander';
import {
  readdirSync,
  readFileSync,
  existsSync,
  statSync,
  symlinkSync,
  rmSync,
  mkdirSync,
} from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import { parse as yamlParse } from 'yaml';
import { getSkillTargetDir, getSkillSourceDir } from '../utils/paths.js';
import type { SkillSurface } from '../utils/paths.js';
import type { SkillEntry } from '../types.js';

function readFrontmatter(content: string): Record<string, unknown> {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  try {
    return (yamlParse(match[1]) as Record<string, unknown>) ?? {};
  } catch {
    return {};
  }
}

/** Walk skills/<category>/<skill>/ two levels deep, returning all SKILL.md entries. */
export function getCatalog(): SkillEntry[] {
  const sourceDir = getSkillSourceDir();
  if (!existsSync(sourceDir)) return [];

  const entries: SkillEntry[] = [];

  for (const categoryName of readdirSync(sourceDir).sort()) {
    if (categoryName.startsWith('_') || categoryName.startsWith('.')) continue;
    const categoryDir = path.join(sourceDir, categoryName);
    if (!statSync(categoryDir).isDirectory()) continue;

    for (const skillName of readdirSync(categoryDir).sort()) {
      if (skillName.startsWith('_') || skillName.startsWith('.')) continue;
      const skillDir = path.join(categoryDir, skillName);
      if (!statSync(skillDir).isDirectory()) continue;
      const skillMd = path.join(skillDir, 'SKILL.md');
      if (!existsSync(skillMd)) continue;

      const fm = readFrontmatter(readFileSync(skillMd, 'utf8'));
      const rawDesc = fm['description'] ?? '';
      // Use first line of multi-line block scalar descriptions
      const description =
        typeof rawDesc === 'string' ? rawDesc.split('\n')[0].trim() : String(rawDesc);

      entries.push({
        name: typeof fm['name'] === 'string' ? fm['name'] : skillName,
        description,
        dir: skillDir,
        category: categoryName,
      });
    }
  }
  return entries;
}

export const skillsCommand = new Command('skills').description(
  'Install, remove, and list skills across surfaces',
);

skillsCommand
  .command('list')
  .description('Show available skills and their installation status')
  .option(
    '--surface <surface>',
    'Surface to check (claude|antigravity|gemini|cursor|project)',
    'claude',
  )
  .option('--category <filter>', 'Filter by category name (partial match)')
  .option('--json', 'Output as JSON (machine-readable, for DCI)')
  .action((options: { surface: string; category?: string; json?: boolean }) => {
    const surface = options.surface as SkillSurface;
    let catalog = getCatalog();

    if (catalog.length === 0) {
      console.log(
        chalk.yellow('No skills found. Run this from the claude-code-plugins-plus-skills repo.'),
      );
      return;
    }

    if (options.category) {
      const filter = options.category.toLowerCase();
      catalog = catalog.filter((s) => s.category.toLowerCase().includes(filter));
      if (catalog.length === 0) {
        console.log(chalk.yellow(`No skills found in categories matching "${options.category}"`));
        return;
      }
    }

    let targetDir!: string;
    try {
      targetDir = getSkillTargetDir(surface);
    } catch (e) {
      console.error(chalk.red(e instanceof Error ? e.message : String(e)));
      process.exit(1);
    }

    if (options.json) {
      const out = catalog.map((s) => ({
        name: s.name,
        description: s.description,
        category: s.category,
        installed: existsSync(path.join(targetDir, s.name)),
      }));
      console.log(JSON.stringify(out, null, 2));
      return;
    }

    // Group by category
    const byCategory = new Map<string, SkillEntry[]>();
    for (const skill of catalog) {
      if (!byCategory.has(skill.category)) byCategory.set(skill.category, []);
      byCategory.get(skill.category)!.push(skill);
    }

    const installedCount = catalog.filter((s) => existsSync(path.join(targetDir, s.name))).length;

    console.log(chalk.bold(`\nSkills Catalog  (surface: ${surface})`));
    console.log(chalk.gray(`Install dir: ${targetDir}\n`));

    let globalIdx = 1;
    for (const [category, skills] of byCategory) {
      console.log(chalk.bold(`  ${category} (${skills.length})`));
      for (const skill of skills) {
        const installed = existsSync(path.join(targetDir, skill.name));
        const status = installed ? chalk.green('✓') : chalk.gray('·');
        const num = String(globalIdx++).padStart(3);
        const desc =
          skill.description.length > 55 ? skill.description.slice(0, 52) + '…' : skill.description;
        console.log(`    ${num}  ${status}  ${skill.name.padEnd(34)}${chalk.gray(desc)}`);
      }
      console.log('');
    }

    console.log(
      chalk.gray(
        `${catalog.length} skills across ${byCategory.size} categor${byCategory.size === 1 ? 'y' : 'ies'}. ${installedCount} installed.`,
      ),
    );
    console.log(chalk.gray(`\nInstall:  ccpi skills install <name> --surface ${surface}`));
    console.log(chalk.gray('Search:   ccpi search <query>'));
  });

skillsCommand
  .command('install [name]')
  .description('Symlink a skill into the target surface directory')
  .option(
    '--surface <surface>',
    'Target surface (claude|antigravity|gemini|cursor|project)',
    'claude',
  )
  .option('--all', 'Install all available skills')
  .option('--category <name>', 'Install all skills in a category (partial match)')
  .action(
    (name: string | undefined, options: { surface: string; all?: boolean; category?: string }) => {
      const surface = options.surface as SkillSurface;

      let targetDir!: string;
      try {
        targetDir = getSkillTargetDir(surface);
      } catch (e) {
        console.error(chalk.red(e instanceof Error ? e.message : String(e)));
        process.exit(1);
      }

      mkdirSync(targetDir, { recursive: true });

      const catalog = getCatalog();

      let toInstall: SkillEntry[];
      if (options.all) {
        toInstall = catalog;
      } else if (options.category) {
        const filter = options.category.toLowerCase();
        toInstall = catalog.filter((s) => s.category.toLowerCase().includes(filter));
        if (toInstall.length === 0) {
          console.error(chalk.red(`No skills found in categories matching "${options.category}"`));
          process.exit(1);
        }
      } else {
        toInstall = catalog.filter((s) => s.name === name);
        if (toInstall.length === 0) {
          console.error(chalk.red(`Skill "${name}" not found in catalog.`));
          console.log(chalk.gray('Run `ccpi skills list` to see available skills.'));
          process.exit(1);
        }
      }

      for (const skill of toInstall) {
        const target = path.join(targetDir, skill.name);
        rmSync(target, { recursive: true, force: true });
        const type = process.platform === 'win32' ? 'junction' : 'dir';
        symlinkSync(skill.dir, target, type);
        console.log(`${chalk.green('✓')} ${skill.name}`);
        console.log(chalk.gray(`  → ${target}`));
      }

      console.log(chalk.bold(`\n${toInstall.length} skill(s) installed.`));
      console.log(chalk.gray('Claude Code hot-reloads skills — no restart needed.'));
    },
  );

skillsCommand
  .command('remove <name>')
  .description('Remove a skill from the target surface')
  .option('--surface <surface>', 'Target surface', 'claude')
  .action((name: string, options: { surface: string }) => {
    const surface = options.surface as SkillSurface;

    let targetDir: string;
    try {
      targetDir = getSkillTargetDir(surface);
    } catch (e) {
      console.error(chalk.red(e instanceof Error ? e.message : String(e)));
      process.exit(1);
    }

    const target = path.join(targetDir, name);

    if (!existsSync(target)) {
      console.log(chalk.yellow(`"${name}" is not installed at ${targetDir}`));
      return;
    }

    rmSync(target, { recursive: true, force: true });
    console.log(`${chalk.green('✓')} Removed ${chalk.bold(name)} from ${targetDir}`);
  });
