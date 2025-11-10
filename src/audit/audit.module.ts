import { Module } from '@nestjs/common';
import { AuditService } from './audit.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [AuditService],
  exports: [AuditService],
})
export class AuditModule {}
