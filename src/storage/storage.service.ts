import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private s3Client: S3Client;
  private bucketName: string;
  private publicUrlBase: string;

  constructor(private readonly configService: ConfigService) {
    const accountId = configService.getOrThrow<string>('CLOUDFLARE_ACCOUNT_ID');
    this.bucketName = configService.getOrThrow<string>('R2_BUCKET_NAME');
    this.publicUrlBase = configService.getOrThrow<string>('R2_PUBLIC_URL');

    this.s3Client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: configService.getOrThrow<string>(
          'CLOUDFLARE_ACCESS_KEY_ID',
        ),
        secretAccessKey: configService.getOrThrow<string>(
          'CLOUDFLARE_SECRET_ACCESS_KEY',
        ),
      },
    });
  }

  async uploadFile(file: Express.Multer.File, key: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    try {
      await this.s3Client.send(command);

      // 💡 CORRECCIÓN: La URL pública es directa
      const publicUrl = `${this.publicUrlBase}/${key}`;

      this.logger.log(`Successfully uploaded ${key} to ${this.bucketName}`);
      return publicUrl;
    } catch (error) {
      this.logger.error(
        `Failed to upload ${key} to ${this.bucketName}`,
        error.stack,
      );
      throw new InternalServerErrorException('Could not upload file.');
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    if (!fileUrl || !fileUrl.startsWith(this.publicUrlBase)) {
      this.logger.warn(
        `Invalid or non-R2 URL provided for deletion: ${fileUrl}`,
      );
      return;
    }

    // Extract the Key (path) from the public URL
    const key = fileUrl.substring(this.publicUrlBase.length + 1); // +1 for the '/'

    if (!key) {
      this.logger.warn(`Could not extract key from URL: ${fileUrl}`);
      return;
    }

    const command = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    try {
      await this.s3Client.send(command);
      this.logger.log(`Successfully deleted ${key} from ${this.bucketName}`);
    } catch (error) {
      this.logger.error(
        `Failed to delete ${key} from ${this.bucketName}`,
        error.stack,
      );
    }
  }

  // Getter needed for UsersService to extract file path
  getBucketName(): string {
    return this.bucketName;
  }
  getPublicUrlBase(): string {
    return this.publicUrlBase;
  }
}
