import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggingInterceptor } from './libs/interceptor/Logging.interceptor';

async function bootstrap() {
	const app = await NestFactory.create(AppModule); // AppModule => EXPRESS + NESTJS
	app.useGlobalPipes(new ValidationPipe()); // integrate global validation
	app.useGlobalInterceptors(new LoggingInterceptor()); // integrate global interceptor
	await app.listen(process.env.PORT_API ?? 3000); // portga listen qildryapmz
}
bootstrap();
