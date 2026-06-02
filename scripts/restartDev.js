#!/usr/bin/env node
/**
 * Stop API (3000) and Vite (5173), then start both in the background.
 * Usage: npm run restart
 */
const { spawn, execSync } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');

function killPort(port) {
  try {
    const pids = execSync(`lsof -ti:${port}`, { encoding: 'utf8' }).trim();
    if (pids) {
      execSync(`kill -9 ${pids.split('\n').join(' ')}`);
      console.log(`Stopped process on port ${port}`);
    }
  } catch {
    /* port free */
  }
}

killPort(3000);
killPort(5173);

console.log('\nStarting API (port 3000)...');
const api = spawn('npm', ['run', 'dev'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
  detached: true,
});

console.log('Starting client (port 5173)...');
const client = spawn('npm', ['run', 'client'], {
  cwd: root,
  stdio: 'inherit',
  shell: true,
  detached: true,
});

api.unref();
client.unref();

console.log('\n✓ Dev servers starting');
console.log('  App:  http://localhost:5173');
console.log('  API:  http://localhost:3000/api/health');
console.log('  Admin PIN: npm run seed:admin:rotate\n');
