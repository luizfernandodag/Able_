import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { HourlyAverage } from './entity/hourly-average.entity';
import { FinnhubService } from './finnhub/finnhub.service';
import { RealtimeGateway } from './realtime.gateway';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const DB_TYPE = process.env.DB_TYPE || 'sqlite';
        const config: TypeOrmModuleOptions = { // Explicitly define the config as TypeOrmModuleOptions
          type: DB_TYPE as any, // Use type assertion to bypass the strict string literal check
          database: DB_TYPE === 'sqlite' ? (process.env.SQLITE_FILE || 'data/hourly.sqlite') : process.env.DB_NAME,
          host: process.env.DB_HOST,
          port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
          username: process.env.DB_USER,
          password: process.env.DB_PASS,
          synchronize: process.env.TYPEORM_SYNC === 'true',
          entities: [HourlyAverage],
        };
        return config;
      },
    }),
    TypeOrmModule.forFeature([HourlyAverage]),
  ],
  providers: [FinnhubService, RealtimeGateway],
})
export class AppModule {}
