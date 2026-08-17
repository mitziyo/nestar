import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule } from '@nestjs/config';
import { GraphQLModule } from '@nestjs/graphql';
import { ApolloDriver } from '@nestjs/apollo';
import { AppResolver } from './app.resolver';
import { ComponentsModule } from './components/components.module';
import { DatabaseModule } from './database/database.module';
import { T } from './libs/types/common';

@Module({
	imports: [
		ConfigModule.forRoot(), // .env uchun
		GraphQLModule.forRoot({
			// Rest  API ni > GraphQL ga
			driver: ApolloDriver,
			playground: true,
			uploads: false,
			autoSchemaFile: true,
			formatError: (error: T) => {
			
				const graphqlFormattedError = {
					code: error?.extensions.code,
					message:
						error?.extensions?.exeption?.response?.message || error?.extensions?.response?.message || error?.message,
				};
				console.log('GRAPHQL GLOBAL ERR:', graphqlFormattedError);
				return graphqlFormattedError;
			},
		}),
		ComponentsModule, // modullarni chaqryapmz
		DatabaseModule, // Database TCP hosil qlyapd
	],
	controllers: [AppController],
	providers: [AppService, AppResolver],
})
export class AppModule {}
