import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { createDataSourceOptions } from './database.config.js';
import { envFilePath, validateEnv, type DatabaseEnv } from './database.env.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath,
      validate: validateEnv,
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<DatabaseEnv, true>) =>
        createDataSourceOptions({
          POSTGRES_HOST: config.get('POSTGRES_HOST', { infer: true }),
          POSTGRES_PORT: config.get('POSTGRES_PORT', { infer: true }),
          POSTGRES_USER: config.get('POSTGRES_USER', { infer: true }),
          POSTGRES_PASSWORD: config.get('POSTGRES_PASSWORD', { infer: true }),
          POSTGRES_DB: config.get('POSTGRES_DB', { infer: true }),
        }),
      dataSourceFactory: async (options) =>
        new DataSource(options!).initialize(),
    }),
  ],
})
export class DatabaseModule {}
