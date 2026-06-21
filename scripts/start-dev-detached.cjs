const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

function buildWindowsEnv() {
  const env = {};
  const pathValues = [];

  for (const [key, value] of Object.entries(process.env)) {
    if (key.toLowerCase() === 'path') {
      if (value) pathValues.push(value);
      continue;
    }

    env[key] = value;
  }

  env.Path = [...new Set(pathValues.join(';').split(';').filter(Boolean))].join(';');
  return env;
}

const root = path.resolve(__dirname, '..');
const out = fs.openSync(path.join(root, 'wordpilot-server.log'), 'a');
const err = fs.openSync(path.join(root, 'wordpilot-server.err.log'), 'a');

const child = spawn('cmd.exe', ['/d', '/s', '/c', 'npm.cmd run dev:server'], {
  cwd: root,
  env: buildWindowsEnv(),
  detached: true,
  stdio: ['ignore', out, err],
  shell: false,
});

child.unref();
console.log(`WordPilot dev server started in background with PID ${child.pid}.`);
