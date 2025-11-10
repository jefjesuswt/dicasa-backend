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
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { AuthGuard } from '../auth/guards/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { StorageService } from '../storage/storage.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { User } from './entities/user.entity';
import { UpdateMyInfoDto } from './dto/update-my-info.dto';
import { ParseMongoIdPipe } from '../common/pipes/parse-mongo-id.pipe';
import { ChangePasswordDto } from '../auth/dto/changePassword.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { ActiveUser } from '../auth/decorators/active-user.decorator';

@UseGuards(AuthGuard)
@Controller('users')
export class UsersController {
  authService: any;
  constructor(
    private readonly storageService: StorageService,
    private readonly usersService: UsersService,
  ) {}

  @Post('/create')
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  create(@Body() createUserDto: CreateUserDto, @ActiveUser() user: User) {
    return this.usersService.create(createUserDto, user._id);
  }

  @Put('/me/picture')
  @UseInterceptors(FileInterceptor('profileImage'))
  @UseInterceptors(ClassSerializerInterceptor)
  async uploadProfilePicture(
    @Request() req: any,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB limit
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
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  findAll(@Query() queryDto: QueryUserDto) {
    return this.usersService.findAll(queryDto);
  }

  @Get('/:id')
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPERADMIN')
  findOne(@Param('id', ParseMongoIdPipe) id: string) {
    return this.usersService.findOneById(id);
  }

  @Patch('/me')
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
  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN')
  update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @ActiveUser() user: User,
  ) {
    return this.usersService.updateUser(id, user._id, updateUserDto);
  }

  @Delete('/superadmin/:id')
  @UseInterceptors(ClassSerializerInterceptor)
  @UseGuards(RolesGuard)
  @Roles('SUPERADMIN')
  remove(@Param('id') id: string, @ActiveUser() user: User) {
    return this.usersService.remove(id, user._id);
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @Request() req: Request,
    @Body() changePasswordDto: ChangePasswordDto,
  ) {
    const user = req['user'];
    return this.usersService.changePassword(user.email, changePasswordDto);
  }
}
