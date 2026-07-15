const fs = require('fs');
const path = require('path');

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`;
}

function getDirSize(dirPath) {
  let size = 0;
  let entries;
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (err) {
    return 0;
  }
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    try {
      if (entry.isDirectory()) {
        size += getDirSize(fullPath);
      } else {
        size += fs.statSync(fullPath).size;
      }
    } catch (err) {
      // skip unreadable files/dirs (permissions, broken symlinks, etc.)
    }
  }
  return size;
}

/**
 * Recursively scans `dirPath` up to `maxLevel` levels deep looking for
 * directories named `targetName`. Matches are reported via `onMatch`
 * (and optionally deleted) but never descended into.
 *
 * @param {string} dirPath      Directory currently being scanned
 * @param {string} targetName   Folder name to look for (e.g. "node_modules")
 * @param {number} maxLevel     Max depth to scan (root counts as level 1)
 * @param {number} depth        Current depth (internal, starts at 1)
 * @param {object} options      { dryRun, onMatch, onError }
 * @param {object} stats        Accumulator { count, bytes, matches: [] }
 */
function scanDir(dirPath, targetName, maxLevel, depth, options, stats) {
  if (depth > maxLevel) return;

  let entries;
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch (err) {
    if (options.onError) options.onError(dirPath, err);
    return;
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const fullPath = path.join(dirPath, entry.name);

    if (entry.name === targetName) {
      const size = getDirSize(fullPath);
      stats.count++;
      stats.bytes += size;
      stats.matches.push({ path: fullPath, size });

      if (options.onMatch) options.onMatch(fullPath, size);

      if (!options.dryRun) {
        try {
          fs.rmSync(fullPath, { recursive: true, force: true });
        } catch (err) {
          if (options.onError) options.onError(fullPath, err);
        }
      }
      // Don't descend into a matched (and possibly deleted) directory
      continue;
    }

    scanDir(fullPath, targetName, maxLevel, depth + 1, options, stats);
  }
}

/**
 * Public entry point.
 *
 * @param {object} config
 * @param {string} config.dir        Root directory to scan
 * @param {string} config.targetDir  Folder name to find/delete (default: "node_modules")
 * @param {number} config.level      Max depth to scan, root = level 1 (default: 3)
 * @param {boolean} config.dryRun    If true, only report matches, don't delete
 * @param {function} config.onMatch  Callback(path, sizeBytes) fired per match
 * @param {function} config.onError  Callback(path, error) fired on read/delete errors
 * @returns {{count: number, bytes: number, matches: Array<{path: string, size: number}>}}
 */
function run(config) {
  const {
    dir = process.cwd(),
    targetDir = 'node_modules',
    level = 3,
    dryRun = false,
    onMatch,
    onError,
  } = config;

  const rootDir = path.resolve(dir);
  const stats = { count: 0, bytes: 0, matches: [] };

  scanDir(rootDir, targetDir, level, 1, { dryRun, onMatch, onError }, stats);

  return stats;
}

module.exports = { run, formatBytes, getDirSize };
