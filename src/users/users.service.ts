import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Model } from 'mongoose';

import * as argon2 from 'argon2';
import { v4 as uuidv4 } from 'uuid';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User } from './entities/user.entity';
import { plainToInstance } from 'class-transformer';
import { Cron, CronExpression } from '@nestjs/schedule';
import { StorageService } from '../storage/storage.service';
import { UpdateMyInfoDto } from './dto/update-my-info.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    private storageService: StorageService,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, phoneNumber, password } = createUserDto;

    const existingUser = await this.userModel.findOne({
      $or: [{ email }, { phoneNumber }],
    });
    if (existingUser) {
      if (existingUser.email === email) {
        throw new BadRequestException(
          `User with email '${email}' already exists.`,
        );
      }
      if (existingUser.phoneNumber === phoneNumber) {
        throw new BadRequestException(
          `User with phone number '${phoneNumber}' already exists.`,
        );
      }
    }

    const hashedPassword = await argon2.hash(password);

    try {
      const user = new this.userModel({
        ...createUserDto,
        password: hashedPassword,
      });

      await user.save();

      const { password: _, ...result } = plainToInstance(User, user.toObject());
      return result as User;
    } catch (error) {
      if (error.code === 11000 && error.keyValue) {
        const duplicatedKey = Object.keys(error.keyValue)[0];
        const duplicatedValue = error.keyValue[duplicatedKey];
        throw new BadRequestException(
          `User with ${duplicatedKey} '${duplicatedValue}' already exists.`,
        );
      }
      console.error('Error creating user:', error);
      throw new InternalServerErrorException('Error creating user.');
    }
  }

  async findAll(): Promise<User[]> {
    const users = await this.userModel.find();
    return users.map((user) => plainToInstance(User, user.toObject()));
  }

  async findOneByEmail(email: string, selectPassword = false) {
    const query = this.userModel
      .findOne({ email })
      .select('+passwordResetToken +passwordResetExpires');

    if (selectPassword) {
      query.select('+password');
    }

    const user = await query.exec();

    return user;
  }

  async findOneByPhoneNumber(phoneNumber: string) {
    const user = await this.userModel.findOne({ phoneNumber });
    if (!user) {
      throw new BadRequestException(
        `User with phone number ${phoneNumber} does not exist`,
      );
    }
    return user;
  }

  async findOneById(id: string): Promise<User> {
    const user = await this.userModel.findById(id);
    if (!user) {
      throw new BadRequestException(`User with id ${id} does not exist`);
    }
    const { password: _, ...result } = plainToInstance(User, user.toObject());
    return result as User;
  }

  async updatePassword(id: string, newPasswordHash: string) {
    const user = await this.userModel.findByIdAndUpdate(id, {
      password: newPasswordHash,
      $unset: {
        passwordResetToken: 1,
        passwordResetExpires: 1,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }

  async setPasswordResetToken(id: string, hashedCode: string, expires: Date) {
    return this.userModel.findByIdAndUpdate(id, {
      passwordResetToken: hashedCode,
      passwordResetExpires: expires,
    });
  }

  async markEmailAsVerified(id: string) {
    const user = await this.userModel.findByIdAndUpdate(
      id,
      { isEmailVerified: true },
      { new: true },
    );
    if (!user) {
      throw new BadRequestException('User not found');
    }
    return user;
  }

  async updateMyInfo(
    id: string,
    updateMyInfoDto: UpdateMyInfoDto,
  ): Promise<User> {
    const { name, phoneNumber } = updateMyInfoDto;

    if (phoneNumber) {
      const existingUser = await this.userModel.findOne({
        phoneNumber: phoneNumber,
        _id: { $ne: id },
      });
      if (existingUser) {
        throw new BadRequestException(
          `El número de teléfono '${phoneNumber}' ya está en uso.`,
        );
      }
    }

    const updatedUser = await this.userModel.findByIdAndUpdate(
      id,
      {
        name: name,
        phoneNumber: phoneNumber,
      },
      { new: true },
    );

    if (!updatedUser) {
      throw new NotFoundException(`Usuario con ID '${id}' no encontrado.`);
    }

    return plainToInstance(User, updatedUser.toObject());
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    if (updateUserDto.email || updateUserDto.phoneNumber) {
      const existingUser = await this.userModel.findOne({
        $or: [
          ...(updateUserDto.email ? [{ email: updateUserDto.email }] : []),
          ...(updateUserDto.phoneNumber
            ? [{ phoneNumber: updateUserDto.phoneNumber }]
            : []),
        ],
        _id: { $ne: id },
      });
      if (existingUser) {
        if (existingUser.email === updateUserDto.email) {
          throw new BadRequestException(
            `Email '${updateUserDto.email}' is already in use.`,
          );
        }
        if (existingUser.phoneNumber === updateUserDto.phoneNumber) {
          throw new BadRequestException(
            `Phone number '${updateUserDto.phoneNumber}' is already in use.`,
          );
        }
      }
    }

    const updatedUser = await this.userModel.findByIdAndUpdate(
      id,
      updateUserDto,
      {
        new: true,
      },
    );

    if (!updatedUser) {
      throw new NotFoundException(`User with ID '${id}' not found.`);
    }

    const { password: _, ...result } = plainToInstance(
      User,
      updatedUser.toObject(),
    );
    return result as User;
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.userModel.findByIdAndDelete(id);

    if (!result) {
      throw new NotFoundException(`User with ID '${id}' not found.`); // Usa NotFoundException
    }

    return { message: `User with ID '${id}' successfully deleted.` };
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleUnverifiedUserCleanup() {
    this.logger.log('Running unverified user cleanup task...');

    // 1. Calcula la fecha límite (ej. usuarios no verificados de hace más de 7 días)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7); // Resta 7 días

    try {
      const result = await this.userModel.deleteMany({
        isEmailVerified: false,
        createdAt: { $lt: cutoffDate },
      });

      if (result.deletedCount > 0) {
        this.logger.log(
          `Deleted ${result.deletedCount} unverified users older than 7 days.`,
        );
      } else {
        this.logger.log('No old unverified users found to delete.');
      }
    } catch (error) {
      this.logger.error('Error during unverified user cleanup:', error);
    }
  }

  async updateProfilePicture(
    userId: string,
    file: Express.Multer.File,
  ): Promise<User> {
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new NotFoundException(`User with ID '${userId}' not found.`);
    }

    // 1. (Opcional) Borrar la imagen antigua si existe
    const oldImageUrl = user.profileImageUrl;
    if (oldImageUrl) {
      await this.storageService.deleteFile(oldImageUrl);
    }

    // 2. Definir la lógica de negocio (path y nombre)
    // (Usando la recomendación de nombre de archivo seguro)
    const extension = file.originalname.split('.').pop();
    const filename = `${uuidv4()}.${extension}`;
    const key = `profile-pictures/${userId}/${filename}`; // Key completa

    // 3. Subir el nuevo archivo usando el servicio genérico
    const imageUrl = await this.storageService.uploadFile(file, key);

    // 4. Actualizar el documento del usuario
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { profileImageUrl: imageUrl },
      { new: true }, // Return the updated document
    );

    if (!updatedUser) {
      throw new InternalServerErrorException(
        'Failed to update user profile picture.',
      );
    }

    return plainToInstance(User, updatedUser.toObject());
  }
}
