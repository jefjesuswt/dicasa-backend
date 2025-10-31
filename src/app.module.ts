import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { MailModule } from './mail/mail.module';
import { MailService } from './mail/mail.service';
import { ScheduleModule } from '@nestjs/schedule';
import { StorageModule } from './storage/storage.module';
import { PropertiesModule } from './properties/properties.module';
import { LocationModule } from './location/location.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis, { Keyv } from '@keyv/redis';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({ envFilePath: '.env', isGlobal: true }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('DATABASE_URI'),
      }),
      inject: [ConfigService],
    }),
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const redisStore = new KeyvRedis({
          url: configService.get<string>('REDIS_URL'),

          socket: {
            connectTimeout: 2000,
            reconnectStrategy: false,
          },
          disableOfflineQueue: true,
        });

        if ((redisStore as any).client) {
          (redisStore as any).client.on('error', (err: any) => {
            console.warn(
              `[Raw Redis Client Error] Error (ignorado): ${err.message}`,
            );
          });
        }
        redisStore.on('error', (err) => {
          console.warn(
            `[KeyvRedis Adapter Error] Error (ignorado): ${err.message}`,
          );
        });
        const keyvInstance = new Keyv({ store: redisStore });
        keyvInstance.on('error', (err) => {
          console.warn(`[Keyv Main Error] Error (ignorado): ${err.message}`);
        });

        return {
          stores: [keyvInstance],
          ttl: 600000,
        };
      },
      isGlobal: true,
    }),
    AuthModule,
    UsersModule,
    MailModule,
    StorageModule,
    PropertiesModule,
    LocationModule,
    AppointmentsModule,
  ],
  controllers: [],
  providers: [MailService],
})
export class AppModule {}
