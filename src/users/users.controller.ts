import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseGuards,
  Request,
  Put,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { StorageService } from 'src/storage/storage.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from './entities/user.entity';
import { UpdateMyInfoDto } from './dto/update-my-info.dto';

@Controller('users')
export class UsersController {
  constructor(
    private readonly storageService: StorageService,
    private readonly usersService: UsersService,
  ) {}

  @Post('/create')
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Put('/me/picture')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('profileImage')) // Matches frontend field name
  @UseInterceptors(ClassSerializerInterceptor)
  async uploadProfilePicture(
    @Request() req: any,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          // Example: 5MB limit
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }),
          // Example: Allow common image types
          new FileTypeValidator({ fileType: '.(png|jpeg|jpg|webp|gif)' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ): Promise<User> {
    const userId = req.user._id;
    const updatedUser = await this.usersService.updateProfilePicture(
      userId.toString(),
      file,
    );

    return updatedUser;
  }

  @Get()
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  findAll() {
    return this.usersService.findAll();
  }

  @Patch('/me')
  @UseGuards(AuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  async updateMyInfo(
    @Request() req: Request,
    @Body() updateMyInfoDto: UpdateMyInfoDto,
  ): Promise<User> {
    const userId = req['user']._id;
    return this.usersService.updateMyInfo(userId.toString(), updateMyInfoDto);
  }

  @Patch('/superadmin/:id')
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('SUPERADMIN')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateUser(id, updateUserDto);
  }

  @Delete('/superadmin/:id')
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(AuthGuard, RolesGuard)
  @Roles('SUPERADMIN')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
