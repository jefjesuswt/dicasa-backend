import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class ParseMongoIdPipe implements PipeTransform<string, string> {
  transform(value: string, metadata: ArgumentMetadata): string {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(`'${value}' is not a valid MongoID`);
    }
    return value;
  }
}
