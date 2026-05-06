import chalk from 'chalk';
import { existsSync, mkdirSync, symlinkSync, rmSync } from 'fs';
import * as readline from 'readline';
import * as path from 'path';
import axios from 'axios';
import { getSkillTargetDir } from '../utils/paths.js';
import { CATALOG_URL } from '../utils/constants.js';
import { getCatalog } from './skills.js';
import type { SkillEntry, PluginMetadata } from '../types.js';

function matches(query: string, ...fields: string[]): boolean {
  const q = query.toLowerCase();
  return fields.some((f) => f.toLowerCase().includes(q));
}

export async function searchCommand(
  query: string,
  options: {
    skillsOnly?: boolean;
    pluginsOnly?: boolean;
    surface?: string;
    json?: boolean;
  },
): Promise<void> {
  const surface = (options.surface ?? 'project') as Parameters<typeof getSkillTargetDir>[0];

  // --- Skills ---
  let skillResults: SkillEntry[] = [];
  if (!options.pluginsOnly) {
    skillResults = getCatalog().filter((s) => matches(query, s.name, s.description, s.category));
  }

  // --- Plugins (from remote catalog, best-effort) ---
  let pluginResults: PluginMetadata[] = [];
  if (!options.skillsOnly) {
    try {
      const resp = await axios.get<{ plugins: PluginMetadata[] }>(CATALOG_URL, {
        timeout: 5000,
      });
      pluginResults = (resp.data.plugins ?? []).filter((p) =>
        matches(query, p.name, p.description, p.category ?? ''),
      );
    } catch {
      // offline — skip plugin results silently
    }
  }

  if (options.json) {
    console.log(JSON.stringify({ skills: skillResults, plugins: pluginResults }, null, 2));
    return;
  }

  if (skillResults.length === 0 && pluginResults.length === 0) {
    console.log(chalk.yellow(`No results for "${query}"`));
    return;
  }

  let targetDir: string | null = null;
  try {
    targetDir = getSkillTargetDir(surface);
  } catch {
    try {
      targetDir = getSkillTargetDir('claude');
    } catch {
      // couldn't determine target dir
    }
  }

  console.log(chalk.bold(`\nSearch: "${query}"\n`));

  // Build a flat numbered list for interactive selection
  const numbered: Array<{ type: 'skill' | 'plugin'; entry: SkillEntry | PluginMetadata }> = [];

  if (skillResults.length > 0) {
    console.log(
      chalk.bold(`Skills (${skillResults.length} match${skillResults.length === 1 ? '' : 'es'})`),
    );
    for (const skill of skillResults) {
      numbered.push({ type: 'skill', entry: skill });
      const idx = numbered.length;
      const installed = targetDir ? existsSync(path.join(targetDir, skill.name)) : false;
      const status = installed ? chalk.green('✓') : chalk.gray('·');
      const cat = chalk.cyan(`[${skill.category}]`);
      const desc =
        skill.description.length > 50 ? skill.description.slice(0, 47) + '…' : skill.description;
      console.log(
        `  ${String(idx).padStart(2)}  ${status}  ${cat.padEnd(30)} ${skill.name.padEnd(28)} ${chalk.gray(desc)}`,
      );
    }
    console.log('');
  }

  if (pluginResults.length > 0) {
    console.log(
      chalk.bold(
        `Plugins (${pluginResults.length} match${pluginResults.length === 1 ? '' : 'es'})`,
      ),
    );
    for (const plugin of pluginResults) {
      numbered.push({ type: 'plugin', entry: plugin });
      const idx = numbered.length;
      const desc =
        plugin.description.length > 55 ? plugin.description.slice(0, 52) + '…' : plugin.description;
      console.log(`  ${String(idx).padStart(2)}  ·  ${plugin.name.padEnd(40)} ${chalk.gray(desc)}`);
    }
    console.log('');
  }

  // Interactive install prompt — skills only, TTY only
  const skillNums = numbered.map((n, i) => (n.type === 'skill' ? i + 1 : null)).filter(Boolean);
  if (!process.stdout.isTTY || skillNums.length === 0) {
    if (skillResults.length > 0) {
      console.log(
        chalk.gray(`Install: ccpi skills install <name> --surface ${options.surface ?? 'project'}`),
      );
    }
    return;
  }

  await new Promise<void>((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(
      chalk.bold('Install skills? ') +
        chalk.gray('(numbers comma-separated, e.g. 1,3 — or q to skip): '),
      (answer) => {
        rl.close();
        if (!answer || answer.trim().toLowerCase() === 'q') {
          resolve();
          return;
        }

        const indices = answer
          .split(',')
          .map((s) => parseInt(s.trim(), 10) - 1)
          .filter((i) => !isNaN(i) && i >= 0 && i < numbered.length);

        const toInstall = indices
          .filter((i) => numbered[i].type === 'skill')
          .map((i) => numbered[i].entry as SkillEntry);

        if (toInstall.length === 0) {
          resolve();
          return;
        }

        const installSurface = (options.surface ?? 'project') as Parameters<
          typeof getSkillTargetDir
        >[0];
        let installDir: string;
        try {
          installDir = getSkillTargetDir(installSurface);
        } catch {
          console.log(chalk.red('Could not determine install directory.'));
          resolve();
          return;
        }

        mkdirSync(installDir, { recursive: true });
        console.log('');

        for (const skill of toInstall) {
          const target = path.join(installDir, skill.name);
          rmSync(target, { recursive: true, force: true });
          symlinkSync(skill.dir, target, process.platform === 'win32' ? 'junction' : 'dir');
          console.log(`${chalk.green('✓')} ${skill.name} → ${target}`);
        }

        console.log(chalk.gray('\nSkills are immediately available via Claude Code hot-reload.'));
        resolve();
      },
    );
  });
}
