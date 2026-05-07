import chalk from 'chalk';
import { existsSync } from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// compiled to dist/commands/site.js → ../../../../ = repo root
const REPO_ROOT = path.resolve(__dirname, '../../../..');
const BUILD_SCRIPT = path.join(REPO_ROOT, 'scripts', 'build-site.mjs');
const SITE_INDEX = path.join(REPO_ROOT, 'site', 'index.html');

interface SiteOptions {
  buildOnly?: boolean;
  noBuild?: boolean;
}

function buildSite(): void {
  if (!existsSync(BUILD_SCRIPT)) {
    console.error(chalk.red(`Build script not found at ${BUILD_SCRIPT}`));
    console.error(chalk.gray('  ccpi site is only available inside the skill-forge repo.'));
    process.exit(1);
  }
  try {
    execFileSync('node', [BUILD_SCRIPT], { stdio: 'inherit' });
  } catch {
    console.error(chalk.red('Site build failed.'));
    process.exit(1);
  }
}

function openInBrowser(url: string): void {
  const platform = process.platform;
  try {
    if (platform === 'darwin') {
      execFileSync('open', [url], { stdio: 'ignore' });
    } else if (platform === 'win32') {
      execFileSync('cmd', ['/c', 'start', '""', url], { stdio: 'ignore' });
    } else {
      execFileSync('xdg-open', [url], { stdio: 'ignore' });
    }
    console.log(`${chalk.green('✓')} Opened ${chalk.bold('Skill Forge')} in your browser`);
    console.log(chalk.gray(`  ${url}`));
  } catch {
    console.log(chalk.yellow('Could not open browser automatically.'));
    console.log(chalk.gray('  Open this URL manually:'));
    console.log(chalk.cyan(`  ${url}`));
  }
}

export function siteCommand(options: SiteOptions = {}): void {
  if (!options.noBuild) {
    buildSite();
  }

  if (options.buildOnly) {
    console.log(chalk.gray('  (--build-only — not opening browser)'));
    return;
  }

  if (!existsSync(SITE_INDEX)) {
    console.error(chalk.red(`Site not found at ${SITE_INDEX}`));
    console.error(chalk.gray('  Run `ccpi site` to build it.'));
    process.exit(1);
  }

  openInBrowser(`file://${SITE_INDEX}`);
}
