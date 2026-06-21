const { spawn } = require('node:child_process');

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

const child = spawn('cmd.exe', ['/d', '/s', '/c', 'npm.cmd run dev:server'], {
  env: buildWindowsEnv(),
  stdio: 'inherit',
  shell: false,
});

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
