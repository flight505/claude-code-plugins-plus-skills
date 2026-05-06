import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs-extra';
import { existsSync } from 'fs';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export type SkillSurface = 'claude' | 'antigravity' | 'gemini' | 'cursor' | 'project';

const SURFACE_SKILL_DIRS: Record<Exclude<SkillSurface, 'project'>, string> = {
  claude: path.join(os.homedir(), '.claude', 'skills'),
  antigravity: path.join(os.homedir(), '.gemini', 'antigravity', 'skills'),
  gemini: path.join(os.homedir(), '.gemini', 'skills'),
  cursor: path.join(os.homedir(), '.cursor', 'skills'),
};

export function getSkillTargetDir(surface: SkillSurface): string {
  if (surface === 'project') {
    try {
      const root = execSync('git rev-parse --show-toplevel', { encoding: 'utf8' }).trim();
      return path.join(root, '.claude', 'skills');
    } catch {
      throw new Error('Not inside a git repository. Use --surface claude for global install.');
    }
  }
  return SURFACE_SKILL_DIRS[surface];
}

export function getSkillSourceDir(): string {
  // compiled to dist/utils/paths.js → ../../../../skills/21-toolkit = repo root/skills/21-toolkit
  return path.resolve(__dirname, '../../../../skills/21-toolkit');
}

export interface ClaudePaths {
  configDir: string;
  pluginsDir: string;
  marketplacesDir: string;
  projectPluginDir?: string;
}

/**
 * Detect Claude Code installation paths across platforms
 * Supports Linux, macOS, and Windows
 */
export async function detectClaudePaths(): Promise<ClaudePaths> {
  const homeDir = os.homedir();
  const platform = os.platform();

  let configDir: string;

  // Detect global Claude config directory
  if (platform === 'win32') {
    configDir = path.join(homeDir, 'AppData', 'Roaming', 'Claude');
  } else {
    // Linux and macOS
    configDir = path.join(homeDir, '.claude');
  }

  // Verify config directory exists
  if (!(await fs.pathExists(configDir))) {
    throw new Error(
      `Claude Code config directory not found at ${configDir}. ` +
        'Please ensure Claude Code is installed and has been run at least once.',
    );
  }

  const pluginsDir = path.join(configDir, 'plugins');
  const marketplacesDir = path.join(configDir, 'marketplaces');

  // Ensure directories exist
  await fs.ensureDir(pluginsDir);
  await fs.ensureDir(marketplacesDir);

  // Check for project-local plugin directory (.claude-plugin/)
  let projectPluginDir: string | undefined;
  const cwd = process.cwd();
  const localPluginDir = path.join(cwd, '.claude-plugin');

  if (await fs.pathExists(localPluginDir)) {
    projectPluginDir = localPluginDir;
  }

  return {
    configDir,
    pluginsDir,
    marketplacesDir,
    projectPluginDir,
  };
}

/**
 * Get the marketplace catalog path for claude-code-plugins-plus
 */
export function getMarketplaceCatalogPath(paths: ClaudePaths): string {
  return path.join(
    paths.marketplacesDir,
    'claude-code-plugins-plus',
    '.claude-plugin',
    'marketplace.json',
  );
}

/**
 * Check if the marketplace catalog is installed
 */
export async function isMarketplaceInstalled(paths: ClaudePaths): Promise<boolean> {
  const catalogPath = getMarketplaceCatalogPath(paths);
  return await fs.pathExists(catalogPath);
}

/** Path to ccpi's own symlink registry. */
export function getCcpiLinksPath(pluginsDir: string): string {
  return path.join(pluginsDir, 'ccpi-links.json');
}

/** Absolute path for a versioned plugin in the Claude Code plugin cache. */
export function getPluginCachePath(
  pluginsDir: string,
  marketplaceSlug: string,
  pluginName: string,
  version: string,
): string {
  return path.join(pluginsDir, 'cache', marketplaceSlug, pluginName, version);
}

/**
 * Walk up from startDir until a directory containing `.git/` is found.
 * Returns null if no git root is found.
 */
export function findGitRoot(startDir: string): string | null {
  let dir = startDir;
  while (true) {
    if (existsSync(path.join(dir, '.git'))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}
