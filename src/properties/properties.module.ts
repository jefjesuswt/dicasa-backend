import { forwardRef, Module } from '@nestjs/common';
import { PropertiesService } from './properties.service';
import { PropertiesController } from './properties.controller';
import { StorageModule } from '../storage/storage.module';
import { MongooseModule } from '@nestjs/mongoose';
import { PropertySchema } from './entities/property.entity';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { LocationModule } from '../location/location.module';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    LocationModule,
    forwardRef(() => UsersModule),
    StorageModule,
    MongooseModule.forFeature([{ name: 'Property', schema: PropertySchema }]),
  ],
  controllers: [PropertiesController],
  providers: [PropertiesService],
  exports: [PropertiesService],
})
export class PropertiesModule {}
