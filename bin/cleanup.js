#!/usr/bin/env node

const path = require('path');
const readline = require('readline');
const { Command } = require('commander');
const { run, formatBytes } = require('../lib/scanner');

const program = new Command();

program
  .name('cleanup')
  .description('Scan a directory tree and delete matching folders (e.g. node_modules)')
  .version('1.0.0')
  .requiredOption('-d, --dir <path>', 'root directory to scan')
  .option('-t, --target-dir <name>', 'folder name to find/delete', 'node_modules')
  .option('-l, --level <number>', 'max depth to scan (root = level 1)', '3')
  .option('--dry-run', 'list matches without deleting anything', false)
  .option('-y, --yes', 'skip the confirmation prompt', false)
  .parse(process.argv);

const opts = program.opts();

function confirm(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(/^y(es)?$/i.test(answer.trim()));
    });
  });
}

async function main() {
  const rootDir = path.resolve(opts.dir);
  const level = parseInt(opts.level, 10);

  if (Number.isNaN(level) || level < 1) {
    console.error(`Invalid --level "${opts.level}". Must be a positive integer.`);
    process.exit(1);
  }

  console.log(
    `Scanning "${rootDir}" up to ${level} level(s) deep for "${opts.targetDir}"...${
      opts.dryRun ? ' (dry run)' : ''
    }\n`
  );

  // First pass: always dry-run to show what would happen and get a count.
  const preview = run({
    dir: rootDir,
    targetDir: opts.targetDir,
    level,
    dryRun: true,
    onMatch: (matchPath, size) => {
      console.log(`Found: ${matchPath} (${formatBytes(size)})`);
    },
    onError: (errPath, err) => {
      console.error(`Warning: could not read ${errPath}: ${err.message}`);
    },
  });

  if (preview.count === 0) {
    console.log('\nNo matching folders found.');
    return;
  }

  console.log(
    `\n${preview.count} folder(s) found, totaling ${formatBytes(preview.bytes)}.`
  );

  if (opts.dryRun) {
    console.log('Dry run complete. Nothing was deleted.');
    return;
  }

  if (!opts.yes) {
    const ok = await confirm(`\nDelete ${preview.count} folder(s)? [y/N] `);
    if (!ok) {
      console.log('Aborted. Nothing was deleted.');
      return;
    }
  }

  console.log('');
  const result = run({
    dir: rootDir,
    targetDir: opts.targetDir,
    level,
    dryRun: false,
    onMatch: (matchPath, size) => {
      console.log(`Deleted: ${matchPath} (${formatBytes(size)})`);
    },
    onError: (errPath, err) => {
      console.error(`Warning: failed on ${errPath}: ${err.message}`);
    },
  });

  console.log(
    `\nDone. ${result.count} folder(s) deleted, freeing ${formatBytes(result.bytes)}.`
  );
}

main();
