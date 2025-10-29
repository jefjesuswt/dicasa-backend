import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { InjectModel } from '@nestjs/mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Model } from 'mongoose';

import { Property } from './entities/property.entity';
import { User } from '../users/entities/user.entity';
import { StorageService } from '../storage/storage.service';
import { plainToInstance } from 'class-transformer';
import { LocationService } from 'src/location/location.service';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectModel(Property.name) private readonly propertyModel: Model<Property>,
    private readonly storageService: StorageService,
    private readonly locationService: LocationService,
  ) {}

  async uploadImages(
    files: Array<Express.Multer.File>,
    agent: User,
  ): Promise<string[]> {
    const uploadPromises: Promise<string>[] = [];

    for (const file of files) {
      const extension = file.originalname.split('.').pop();
      const filename = `${uuidv4()}.${extension}`;

      const key = `properties/${agent._id}/${filename}`;

      uploadPromises.push(this.storageService.uploadFile(file, key));
    }

    const urls = await Promise.all(uploadPromises);
    return urls;
  }

  async create(
    createPropertyDto: CreatePropertyDto,
    agent: User,
  ): Promise<Property> {
    this.validateLocation(createPropertyDto.address);
    const newProperty = new this.propertyModel({
      ...createPropertyDto,
      agent: agent._id,
    });

    const savedProperty = await newProperty.save();

    await savedProperty.populate({
      path: 'agent',
      select: '-password',
    });

    return plainToInstance(Property, savedProperty.toObject());
  }

  async update(id: string, updatePropertyDto: UpdatePropertyDto) {
    if (updatePropertyDto.address) {
      // Asumimos que si 'address' viene, trae 'city' y 'state'
      this.validateLocation(updatePropertyDto.address);
    }

    const updatedProperty = await this.propertyModel
      .findByIdAndUpdate(id, updatePropertyDto, { new: true })
      .populate({ path: 'agent', select: '-password' })
      .exec();

    if (!updatedProperty) {
      throw new NotFoundException(`Propiedad con ID '${id}' no encontrada.`);
    }
    return plainToInstance(Property, updatedProperty.toObject());
  }

  async findAll(): Promise<Property[]> {
    const properties = await this.propertyModel
      .find()
      .populate('agent')
      .sort({ createdAt: -1 })
      .exec();

    return properties.map((prop) => plainToInstance(Property, prop.toObject()));
  }

  async findOne(id: string): Promise<Property> {
    const property = await this.propertyModel
      .findById(id)
      .populate('agent')
      .exec();

    if (!property) {
      throw new NotFoundException(`Propiedad con ID '${id}' no encontrada.`);
    }

    return plainToInstance(Property, property.toObject());
  }

  async remove(id: string): Promise<{ message: string }> {
    const property = await this.propertyModel.findById(id);

    if (!property) {
      throw new NotFoundException(`Propiedad con ID '${id}' no encontrada.`);
    }

    await this.propertyModel.findByIdAndDelete(id);

    if (property.images && property.images.length > 0) {
      const deletePromises = property.images.map((imageUrl) =>
        this.storageService.deleteFile(imageUrl),
      );
      await Promise.all(deletePromises);
    }

    return { message: `Propiedad con ID '${id}' eliminada exitosamente.` };
  }

  // LOCATION
  //
  private validateLocation(address: { state: string; city: string }): void {
    const { state, city } = address;

    if (!this.locationService.isValidState(state)) {
      throw new BadRequestException(`El estado '${state}' no es válido.`);
    }

    if (!this.locationService.isValidCity(state, city)) {
      throw new BadRequestException(
        `La ciudad '${city}' no es válida para el estado '${state}'.`,
      );
    }
  }
}
