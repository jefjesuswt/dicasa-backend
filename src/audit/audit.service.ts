import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface AuditLogDto {
  userId: string;
  action: string;
  resourceId?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);
  private analyticsApiUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.analyticsApiUrl =
      this.configService.get<string>('ANALYTICS_API_URL') ||
      'http://localhost:3001';
  }

  logAction(log: AuditLogDto): void {
    if (!this.analyticsApiUrl) {
      this.logger.warn('ANALYTICS_API_URL no está configurada. Saltando log.');
      return;
    }

    this.httpService
      .post(`${this.analyticsApiUrl}/analytics/audit`, log)
      .subscribe({
        next: () =>
          this.logger.log(`Audit log enviado: ${log.action} por ${log.userId}`),
        error: (err) =>
          this.logger.error('Error al enviar el audit log', err.message),
      });
  }
}
