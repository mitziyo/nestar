import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);  // AppModule - EXPRESS + NESTJS
  await app.listen(process.env.PORT_API ?? 3000);
}
bootstrap();
