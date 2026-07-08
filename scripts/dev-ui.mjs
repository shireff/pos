#!/usr/bin/env node
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const frontendUrl = 'http://localhost:5173';
const backendUrl = 'http://localhost:3001';
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const processes = [];

function log(prefix, message) {
  const lines = String(message).split(/\r?\n/).filter(Boolean);
  for (const line of lines) {
    process.stdout.write(`[${prefix}] ${line}\n`);
  }
}

function runProcess(name, args) {
  const child = spawn(npmCommand, args, {
    cwd: repoRoot,
    env: { ...process.env, FORCE_COLOR: 'true' },
    shell: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  processes.push(child);
  child.stdout.on('data', (data) => log(name, data));
  child.stderr.on('data', (data) => log(name, data));

  child.on('exit', (code, signal) => {
    if (signal) {
      log(name, `stopped with signal ${signal}`);
      return;
    }
    log(name, `exited with code ${code}`);
  });

  return child;
}

function openBrowser(url) {
  try {
    if (process.platform === 'win32') {
      spawn('cmd', ['/c', 'start', '', url], { stdio: 'ignore', detached: true });
    } else if (process.platform === 'darwin') {
      spawn('open', [url], { stdio: 'ignore', detached: true });
    } else {
      spawn('xdg-open', [url], { stdio: 'ignore', detached: true });
    }
  } catch (error) {
    log('browser', `could not open automatically: ${error?.message ?? error}`);
  }
}

function shutdown() {
  for (const child of processes) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

console.log('Starting backend and desktop UI...');
console.log(`Frontend URL: ${frontendUrl}`);
console.log(`Backend URL: ${backendUrl}`);

runProcess('backend', ['run', 'dev:backend']);
runProcess('frontend', ['run', 'dev:desktop']);
openBrowser(frontendUrl);

setTimeout(() => {
  console.log('Both services are starting. Press Ctrl+C to stop.');
}, 1500);
