import { forwardRef, Module } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { StorageModule } from 'src/storage/storage.module';
import { MongooseModule } from '@nestjs/mongoose';
import { PropertySchema } from './entities/property.entity';
import { AuthModule } from 'src/auth/auth.module';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [
    AuthModule,
    UsersModule,
    StorageModule,
    MongooseModule.forFeature([{ name: 'Property', schema: PropertySchema }]),
  ],
  controllers: [PropertiesController],
  providers: [PropertiesService],
})
export class PropertiesModule {}
