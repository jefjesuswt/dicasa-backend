import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
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
import { ChangePasswordDto } from '../auth/dto/changePassword.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { PaginatedUserResponse } from './interfaces/paginated-user-response.interface';
import { Property } from '../properties/entities/property.entity';
import { Appointment } from '../appointments/entities/appointment.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    private storageService: StorageService,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Property.name) private propertyModel: Model<Property>,
    @InjectModel(Appointment.name) private appointmentModel: Model<Appointment>,
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

  async findAll(queryDto: QueryUserDto): Promise<PaginatedUserResponse> {
    const { page = 1, limit = 10, search, role, isActive } = queryDto;

    const filterQuery: any = {};

    if (search) {
      const searchRegex = { $regex: new RegExp(search, 'i') };
      filterQuery.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phoneNumber: searchRegex },
      ];
    }

    if (role) {
      filterQuery.roles = role;
    }

    if (isActive !== undefined) {
      filterQuery.isActive = isActive;
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      this.userModel
        .find(filterQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(filterQuery),
    ]);

    const serializedData = users.map((user) =>
      plainToInstance(User, user.toObject()),
    );

    return {
      data: serializedData,
      total,
      page,
      limit,
    };
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
    const propertyCount = await this.propertyModel.countDocuments({
      agent: id,
    });
    if (propertyCount > 0) {
      throw new ConflictException(
        `Este agente no puede ser eliminado. Aún tiene ${propertyCount} propiedad(es) asignada(s). Por favor, reasígnelas primero.`,
      );
    }

    const appointmentCount = await this.appointmentModel.countDocuments({
      agent: id,
      status: { $in: ['pending', 'contacted'] },
    });
    if (appointmentCount > 0) {
      throw new ConflictException(
        `Este agente no puede ser eliminado. Aún tiene ${appointmentCount} cita(s) pendiente(s). Por favor, reasígnelas primero.`,
      );
    }

    const result = await this.userModel.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true },
    );

    if (!result) {
      throw new NotFoundException(`User with ID '${id}' not found.`);
    }

    return { message: `User with ID '${id}' desactivado exitosamente.` };
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleUnverifiedUserCleanup() {
    this.logger.log('Running unverified user cleanup task...');

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

    const oldImageUrl = user.profileImageUrl;
    if (oldImageUrl) {
      await this.storageService.deleteFile(oldImageUrl);
    }

    const extension = file.originalname.split('.').pop();
    const filename = `${uuidv4()}.${extension}`;
    const key = `profile-pictures/${userId}/${filename}`; // Key completa

    const imageUrl = await this.storageService.uploadFile(file, key);

    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { profileImageUrl: imageUrl },
      { new: true },
    );

    if (!updatedUser) {
      throw new InternalServerErrorException(
        'Failed to update user profile picture.',
      );
    }

    return plainToInstance(User, updatedUser.toObject());
  }

  async changePassword(email: string, changePasswordDto: ChangePasswordDto) {
    const { password, newPassword } = changePasswordDto;
    const user = await this.findOneByEmail(email, true);

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado.');
    }

    const isPasswordCorrect = await argon2.verify(user.password, password);
    if (!isPasswordCorrect) {
      throw new UnauthorizedException('Contraseña incorrecta.');
    }

    const newPasswordHash = await argon2.hash(newPassword);
    await this.updatePassword(user._id, newPasswordHash);
    return { message: 'La contraseña se ha restablecido correctamente.' };
  }
}
