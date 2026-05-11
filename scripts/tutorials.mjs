#!/usr/bin/env node
// List or open tutorial notebooks under <repo>/tutorials/.
// Replaces `ccpi tutorials` / `ccpi tutorials <n>`.
//
// Usage:
//   node scripts/tutorials.mjs            # list
//   node scripts/tutorials.mjs <number>   # open Nth notebook

import { readdirSync, existsSync } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TUTORIALS_DIR = path.resolve(__dirname, '..', 'tutorials');

const C = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
};

function title(filename) {
  return filename
    .replace(/^\d+-/, '')
    .replace(/\.ipynb$/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function load() {
  if (!existsSync(TUTORIALS_DIR)) return [];
  const entries = [];
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
        title: title(file),
        absPath: path.join(sectionDir, file),
      });
    }
  }
  return entries;
}

function list() {
  const tutorials = load();
  if (tutorials.length === 0) {
    console.log(`${C.yellow}No tutorials found.${C.reset}`);
    console.log(`${C.dim}Expected at: ${TUTORIALS_DIR}${C.reset}`);
    return;
  }
  const bySection = new Map();
  for (const t of tutorials) {
    if (!bySection.has(t.section)) bySection.set(t.section, []);
    bySection.get(t.section).push(t);
  }
  console.log(`\n${C.bold}Tutorials${C.reset}\n`);
  for (const [section, items] of bySection) {
    const label = section.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    console.log(`  ${C.bold}${label} (${items.length})${C.reset}`);
    for (const t of items) {
      const rel = path.relative(path.resolve(TUTORIALS_DIR, '..'), t.absPath);
      console.log(
        `    ${String(t.num).padStart(2)}  ${t.title.padEnd(40)} ${C.dim}${rel}${C.reset}`,
      );
    }
    console.log('');
  }
  console.log(`${C.dim}Open: pnpm tutorials <number>${C.reset}`);
}

function open(num) {
  const tutorials = load();
  const entry = tutorials.find((t) => t.num === num);
  if (!entry) {
    console.error(`${C.red}Tutorial #${num} not found. Run \`pnpm tutorials\` to list.${C.reset}`);
    process.exit(1);
  }
  console.log(`${C.dim}Opening: ${entry.absPath}${C.reset}`);
  const opener = process.platform === 'darwin' ? 'open' : 'xdg-open';
  try {
    execFileSync(opener, [entry.absPath], { stdio: 'ignore' });
    console.log(`${C.green}✓${C.reset} Opened ${C.bold}${entry.title}${C.reset}`);
  } catch {
    console.log(`${C.yellow}Could not open automatically.${C.reset} File path:`);
    console.log(`${C.cyan}${entry.absPath}${C.reset}`);
    console.log(`${C.dim}Run: jupyter notebook "${entry.absPath}"${C.reset}`);
  }
}

const arg = process.argv[2];
if (!arg) {
  list();
} else if (/^\d+$/.test(arg)) {
  open(Number(arg));
} else {
  console.error(`Unknown argument: ${arg}\nUsage: pnpm tutorials [number]`);
  process.exit(2);
}
