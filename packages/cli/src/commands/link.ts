import chalk from 'chalk';
import { existsSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'fs';
import * as path from 'path';
import type { ClaudePaths } from '../utils/paths.js';
import { getCcpiLinksPath, getPluginCachePath, findGitRoot } from '../utils/paths.js';
import { MARKETPLACE_SLUG } from '../utils/constants.js';
import type {
  CcpiLink,
  CcpiLinksFile,
  InstalledPluginRecord,
  InstalledPluginsFile,
} from '../types.js';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function readLinksFile(linksPath: string): CcpiLinksFile {
  if (!existsSync(linksPath)) {
    return { version: 1, links: {} };
  }
  return JSON.parse(readFileSync(linksPath, 'utf-8')) as CcpiLinksFile;
}

function writeLinksFile(linksPath: string, data: CcpiLinksFile): void {
  writeFileSync(linksPath, JSON.stringify(data, null, 2) + '\n');
}

function upsertInstalledPlugin(
  paths: ClaudePaths,
  pluginKey: string,
  record: InstalledPluginRecord,
): void {
  const filePath = path.join(paths.pluginsDir, 'installed_plugins.json');
  let data: InstalledPluginsFile = { version: 2, plugins: {} };
  if (existsSync(filePath)) {
    data = JSON.parse(readFileSync(filePath, 'utf-8')) as InstalledPluginsFile;
    data.plugins ??= {};
  }
  data.plugins[pluginKey] = [record];
  writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

function removeInstalledPlugin(paths: ClaudePaths, pluginKey: string): void {
  const filePath = path.join(paths.pluginsDir, 'installed_plugins.json');
  if (!existsSync(filePath)) return;
  const data = JSON.parse(readFileSync(filePath, 'utf-8')) as InstalledPluginsFile;
  delete data.plugins[pluginKey];
  writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

function resolveSource(pluginName: string | undefined, sourcePath: string | undefined): string {
  if (sourcePath) {
    const abs = path.resolve(sourcePath);
    if (!existsSync(abs)) {
      throw new Error(`Source path not found: ${abs}`);
    }
    return abs;
  }

  if (!pluginName) {
    throw new Error('Plugin name required. Usage: ccpi link <name> [--source <path>]');
  }

  const gitRoot = findGitRoot(process.cwd());
  if (gitRoot) {
    const catalogPath = path.join(gitRoot, '.claude-plugin', 'marketplace.json');
    if (existsSync(catalogPath)) {
      const catalog = JSON.parse(readFileSync(catalogPath, 'utf-8')) as {
        plugins?: Array<{ name: string; source: string }>;
      };
      const entry = catalog.plugins?.find((p) => p.name === pluginName);
      if (entry?.source) {
        return path.resolve(gitRoot, entry.source);
      }
    }
  }

  throw new Error(
    `Plugin "${pluginName}" not found in local catalog.\n` +
      'Pass --source <path> or run from the repo directory.',
  );
}

// ---------------------------------------------------------------------------
// Public command implementations
// ---------------------------------------------------------------------------

export async function linkPlugin(
  pluginName: string | undefined,
  paths: ClaudePaths,
  options: { source?: string },
): Promise<void> {
  let sourceDir: string;
  try {
    sourceDir = resolveSource(pluginName, options.source);
  } catch (err) {
    console.log(chalk.red((err as Error).message));
    process.exit(1);
  }

  const pluginJsonPath = path.join(sourceDir, '.claude-plugin', 'plugin.json');
  if (!existsSync(pluginJsonPath)) {
    console.log(chalk.red(`No .claude-plugin/plugin.json found at: ${sourceDir}`));
    process.exit(1);
  }

  const pluginJson = JSON.parse(readFileSync(pluginJsonPath, 'utf-8')) as {
    name?: string;
    version?: string;
  };
  const name: string = pluginJson.name ?? path.basename(sourceDir);
  const version: string = pluginJson.version ?? 'local';

  const cachePath = getPluginCachePath(paths.pluginsDir, MARKETPLACE_SLUG, name, version);
  mkdirSync(path.dirname(cachePath), { recursive: true });

  if (existsSync(cachePath)) {
    rmSync(cachePath, { recursive: true, force: true });
  }

  symlinkSync(sourceDir, cachePath, process.platform === 'win32' ? 'junction' : 'dir');

  upsertInstalledPlugin(paths, `${name}@${MARKETPLACE_SLUG}`, {
    scope: 'user',
    installPath: cachePath,
    version,
    installedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
  });

  const linksPath = getCcpiLinksPath(paths.pluginsDir);
  const linksFile = readLinksFile(linksPath);
  linksFile.links[name] = {
    source: sourceDir,
    version,
    marketplace: MARKETPLACE_SLUG,
    cachePath,
    linkedAt: new Date().toISOString(),
  } satisfies CcpiLink;
  writeLinksFile(linksPath, linksFile);

  console.log(`${chalk.green('✓')} ${chalk.bold(name)}@${version} linked`);
  console.log(chalk.gray(`  source: ${sourceDir}`));
  console.log(chalk.gray(`  cache:  ${cachePath}`));
  console.log(chalk.gray('  run /reload-plugins in Claude Code to activate'));
}

export async function unlinkPlugin(pluginName: string, paths: ClaudePaths): Promise<void> {
  const linksPath = getCcpiLinksPath(paths.pluginsDir);
  const linksFile = readLinksFile(linksPath);
  const link = linksFile.links[pluginName];

  if (!link) {
    console.log(
      chalk.yellow(
        `"${pluginName}" is not linked by ccpi. Use /plugin uninstall to remove marketplace-installed plugins.`,
      ),
    );
    return;
  }

  if (existsSync(link.cachePath)) {
    rmSync(link.cachePath, { recursive: true, force: true });
  }

  removeInstalledPlugin(paths, `${pluginName}@${link.marketplace}`);

  delete linksFile.links[pluginName];
  writeLinksFile(linksPath, linksFile);

  console.log(`${chalk.green('✓')} ${chalk.bold(pluginName)} unlinked`);
  console.log(chalk.gray('  run /reload-plugins in Claude Code'));
}

export function listLinks(paths: ClaudePaths): void {
  const linksPath = getCcpiLinksPath(paths.pluginsDir);
  const linksFile = readLinksFile(linksPath);
  const links = Object.entries(linksFile.links);

  if (links.length === 0) {
    console.log(chalk.gray('No plugins linked via ccpi.'));
    return;
  }

  console.log(chalk.bold(`\nccpi-linked plugins (${links.length})\n`));

  for (const [name, link] of links) {
    const symlinkOk = existsSync(link.cachePath);
    const sourceOk = existsSync(link.source);
    const status = symlinkOk && sourceOk ? chalk.green('✓ ok  ') : chalk.red('✗ stale');

    console.log(`  ${status}  ${chalk.bold(name.padEnd(30))} v${link.version}`);
    console.log(chalk.gray(`         source: ${link.source}`));
    if (!sourceOk) console.log(chalk.red('         ↑ source directory missing'));
    if (!symlinkOk) console.log(chalk.red(`         cache symlink missing: ${link.cachePath}`));
  }

  console.log('');
}
