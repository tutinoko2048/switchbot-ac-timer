const path = require('node:path');

module.exports = {
  apps: [
    {
      name: 'ac-timer',
      cwd: __dirname,
      script: 'src/server/main.ts',
      interpreter: path.join(__dirname, 'node_modules/.bin/nub'),
      // .env は nub が起動時に読み込む
    },
  ],
};
