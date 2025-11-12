import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Backend listening on ${port}`);
}
bootstrap().catch(err => { console.error(err); process.exit(1); });
