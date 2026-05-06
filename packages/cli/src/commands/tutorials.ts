import chalk from 'chalk';
import { readdirSync, existsSync } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// compiled to dist/commands/tutorials.js → ../../../../tutorials = repo root/tutorials
const TUTORIALS_DIR = path.resolve(__dirname, '../../../../tutorials');

interface TutorialEntry {
  num: number;
  section: string;
  file: string;
  title: string;
  absPath: string;
}

function titleFromFilename(filename: string): string {
  // "01-what-is-skill.ipynb" → "What is a Skill?"
  return filename
    .replace(/^\d+-/, '')
    .replace(/\.ipynb$/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function loadTutorials(): TutorialEntry[] {
  if (!existsSync(TUTORIALS_DIR)) return [];

  const entries: TutorialEntry[] = [];
  let num = 1;

  for (const section of readdirSync(TUTORIALS_DIR).sort()) {
    const sectionDir = path.join(TUTORIALS_DIR, section);
    if (!existsSync(sectionDir)) continue;

    const files = readdirSync(sectionDir)
      .filter((f) => f.endsWith('.ipynb'))
      .sort();

    for (const file of files) {
      entries.push({
        num: num++,
        section,
        file,
        title: titleFromFilename(file),
        absPath: path.join(sectionDir, file),
      });
    }
  }

  return entries;
}

export function listTutorials(): void {
  const tutorials = loadTutorials();

  if (tutorials.length === 0) {
    console.log(chalk.yellow('No tutorials found.'));
    console.log(chalk.gray(`Expected at: ${TUTORIALS_DIR}`));
    return;
  }

  const bySection = new Map<string, TutorialEntry[]>();
  for (const t of tutorials) {
    if (!bySection.has(t.section)) bySection.set(t.section, []);
    bySection.get(t.section)!.push(t);
  }

  console.log(chalk.bold('\nTutorials\n'));

  for (const [section, items] of bySection) {
    const label = section.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    console.log(chalk.bold(`  ${label} (${items.length})`));
    for (const t of items) {
      const rel = path.relative(path.resolve(TUTORIALS_DIR, '..'), t.absPath);
      console.log(`    ${String(t.num).padStart(2)}  ${t.title.padEnd(40)} ${chalk.gray(rel)}`);
    }
    console.log('');
  }

  console.log(chalk.gray(`Open: ccpi tutorials open <number>`));
}

export function openTutorial(num: number): void {
  const tutorials = loadTutorials();
  const entry = tutorials.find((t) => t.num === num);

  if (!entry) {
    console.log(
      chalk.red(`Tutorial #${num} not found. Run \`ccpi tutorials\` to list available tutorials.`),
    );
    process.exit(1);
  }

  console.log(chalk.gray(`Opening: ${entry.absPath}`));

  const opener = process.platform === 'darwin' ? 'open' : 'xdg-open';
  try {
    execSync(`${opener} "${entry.absPath}"`, { stdio: 'ignore' });
    console.log(`${chalk.green('✓')} Opened ${chalk.bold(entry.title)}`);
  } catch {
    console.log(chalk.yellow(`Could not open automatically. File path:`));
    console.log(chalk.cyan(entry.absPath));
    console.log(chalk.gray(`Run: jupyter notebook "${entry.absPath}"`));
  }
}
