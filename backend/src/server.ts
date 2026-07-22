import { createApp } from './app';
import { env } from './config/env';

const app = createApp();

const server = app.listen(env.PORT, () => {
  console.log(`${env.APP_NAME} listening on http://localhost:${env.PORT}`);
  console.log(`Health: http://localhost:${env.PORT}/api/v1/health`);
});

function shutdown(signal: string) {
  console.log(`${signal} received — shutting down`);
  server.close(() => process.exit(0));
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
