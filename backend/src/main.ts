import { NestFactory } from '@nestjs/core';
import { WsAdapter } from '@nestjs/platform-ws';
import * as dotenv from 'dotenv';
import { AppModule } from './app.module';
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new WsAdapter(app)); 
  // app.enableShutdownHooks();
    app.enableCors({
    origin: 'http://localhost:5173',
  }); 
  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`Backend listening on ${port}`);
}
bootstrap().catch(err => { console.error(err); process.exit(1); });
