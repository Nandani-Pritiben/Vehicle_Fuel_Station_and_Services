import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors(); // restrict to your frontend URL in production
  const rawPort = process.env.PORT ?? '3000';
  const port = Number(rawPort);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    console.warn(`[WARN] Invalid PORT "${rawPort}" in .env; falling back to 3000.`);
    await app.listen(3000);
    console.log(`API running on http://localhost:3000/api`);
    return;
  }
  await app.listen(port);
  console.log(`API running on http://localhost:${port}/api`);
}
bootstrap();
