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
import { getSkillTargetDir, getSkillSourceDir } from '../utils/paths.js';
import type { SkillSurface } from '../utils/paths.js';

interface SkillEntry {
  name: string;
  description: string;
  dir: string;
}

function readFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return {};
  const result: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    result[line.slice(0, colonIdx).trim()] = line.slice(colonIdx + 1).trim();
  }
  return result;
}

function getCatalog(): SkillEntry[] {
  const sourceDir = getSkillSourceDir();
  if (!existsSync(sourceDir)) return [];

  return readdirSync(sourceDir)
    .filter((name) => !name.startsWith('_') && !name.startsWith('.'))
    .flatMap((name) => {
      const dir = path.join(sourceDir, name);
      if (!statSync(dir).isDirectory()) return [];
      const skillMd = path.join(dir, 'SKILL.md');
      if (!existsSync(skillMd)) return [];
      const fm = readFrontmatter(readFileSync(skillMd, 'utf8'));
      return [{ name: fm['name'] ?? name, description: fm['description'] ?? '', dir }];
    });
}

export const skillsCommand = new Command('skills').description(
  'Install, remove, and list toolkit skills across surfaces',
);

skillsCommand
  .command('list')
  .description('Show available skills and their installation status')
  .option(
    '--surface <surface>',
    'Surface to check (claude|antigravity|gemini|cursor|project)',
    'claude',
  )
  .action((options: { surface: string }) => {
    const surface = options.surface as SkillSurface;
    const catalog = getCatalog();

    if (catalog.length === 0) {
      console.log(
        chalk.yellow('No skills found. Run this from the claude-code-plugins-plus-skills repo.'),
      );
      return;
    }

    let targetDir!: string;
    try {
      targetDir = getSkillTargetDir(surface);
    } catch (e) {
      console.error(chalk.red(e instanceof Error ? e.message : String(e)));
      process.exit(1);
    }

    console.log(chalk.bold(`\nToolkit Skills  (surface: ${surface})`));
    console.log(chalk.gray(`Install dir: ${targetDir}\n`));

    catalog.forEach((skill, i) => {
      const installed = existsSync(path.join(targetDir, skill.name));
      const status = installed ? chalk.green('✓') : chalk.gray('·');
      const num = String(i + 1).padStart(2);
      const desc =
        skill.description.length > 55 ? skill.description.slice(0, 52) + '…' : skill.description;
      console.log(`  ${num}  ${status}  ${skill.name.padEnd(36)}${chalk.gray(desc)}`);
    });

    console.log(chalk.gray(`\nInstall:  ccpi skills install <name> --surface ${surface}`));
    console.log(chalk.gray('Install all: ccpi skills install --all --surface project'));
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
  .action((name: string | undefined, options: { surface: string; all?: boolean }) => {
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
    const toInstall = options.all ? catalog : catalog.filter((s) => s.name === name);

    if (!options.all && toInstall.length === 0) {
      console.error(chalk.red(`Skill "${name}" not found in catalog.`));
      console.log(chalk.gray('Run `ccpi skills list` to see available skills.'));
      process.exit(1);
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
  });

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
