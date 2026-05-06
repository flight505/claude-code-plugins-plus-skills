/**
 * Shared types for the ccpi CLI.
 *
 * Types used by more than one command module live here to avoid duplication.
 */

/**
 * Plugin metadata as returned by the marketplace catalog JSON.
 * Both install and upgrade commands consume this shape from the remote catalog.
 */
export interface PluginMetadata {
  name: string;
  version: string;
  description: string;
  author: string;
  category?: string;
}

/**
 * A locally-installed plugin record (from installed_plugins.json).
 * Kept for backwards compat with upgrade.ts / doctor.ts callers.
 */
export interface InstalledPlugin {
  version: string;
  scope?: string;
  installedAt?: string;
}

/** Full record shape that Claude Code writes to installed_plugins.json. */
export interface InstalledPluginRecord {
  scope: string;
  installPath: string;
  version: string;
  installedAt: string;
  lastUpdated: string;
  gitCommitSha?: string;
}

/** Top-level structure of ~/.claude/plugins/installed_plugins.json. */
export interface InstalledPluginsFile {
  version: 2;
  plugins: Record<string, InstalledPluginRecord[]>;
}

/** A single ccpi-managed symlink entry. */
export interface CcpiLink {
  source: string; // absolute path to local plugin dir
  version: string;
  marketplace: string; // marketplace slug used as the key namespace
  cachePath: string; // absolute path of the symlink in the plugin cache
  linkedAt: string; // ISO 8601
}

/** Contents of ~/.claude/plugins/ccpi-links.json. */
export interface CcpiLinksFile {
  version: 1;
  links: Record<string, CcpiLink>; // keyed by plugin name
}

/**
 * A pending upgrade record derived by comparing installed vs catalog versions.
 */
export interface PluginUpdate {
  name: string;
  currentVersion: string;
  latestVersion: string;
  description?: string;
}
