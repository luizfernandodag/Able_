import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HourlyAverage } from './entity/hourly-average.entity';
import { FinnhubService } from './finnhub/finnhub.service';
import { RealtimeGateway } from './realtime.gateway';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const DB_TYPE = process.env.DB_TYPE || 'sqlite';
        return {
          type: DB_TYPE,
          database: DB_TYPE === 'sqlite' ? (process.env.SQLITE_FILE || 'data/hourly.sqlite') : process.env.DB_NAME,
          host: process.env.DB_HOST,
          port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : undefined,
          username: process.env.DB_USER,
          password: process.env.DB_PASS,
          synchronize: process.env.TYPEORM_SYNC === 'true',
          entities: [HourlyAverage],
        };
      },
    }),
    TypeOrmModule.forFeature([HourlyAverage]),
  ],
  providers: [FinnhubService, RealtimeGateway],
})
export class AppModule {}
