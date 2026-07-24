/**
 * GAME-MANIA — PM2 process file (production, no Docker)
 * Single-site: storefront (+ /admin) + API only.
 * Usage on VPS: pm2 start deploy/pm2/ecosystem.config.js --env production
 */
module.exports = {
  apps: [
    {
      name: 'gamemania-api',
      cwd: './backend',
      script: 'dist/server.js',
      instances: 1,
      exec_mode: 'fork',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
      },
      max_memory_restart: '512M',
      error_file: '../logs/api-error.log',
      out_file: '../logs/api-out.log',
      merge_logs: true,
    },
    {
      name: 'gamemania-frontend',
      cwd: './frontend',
      script: 'node_modules/next/dist/bin/next',
      args: 'start --port 3000',
      instances: 1,
      exec_mode: 'fork',
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      max_memory_restart: '768M',
      error_file: '../logs/frontend-error.log',
      out_file: '../logs/frontend-out.log',
      merge_logs: true,
    },
  ],
};
