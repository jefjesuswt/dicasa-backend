import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { InjectModel } from '@nestjs/mongoose';
import { v4 as uuidv4 } from 'uuid';
import { Model } from 'mongoose';

import { Property, PropertyStatus } from './entities/property.entity';
import { User } from '../users/entities/user.entity';
import { StorageService } from '../storage/storage.service';
import { plainToInstance } from 'class-transformer';
import { LocationService } from '../location/location.service';
import { QueryPropertyDto } from './dto/query-property.dto';
import { PaginatedPropertyResponse } from './interaces/paginated-property-response.interface';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

@Injectable()
export class PropertiesService {
  constructor(
    @InjectModel(Property.name) private readonly propertyModel: Model<Property>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly storageService: StorageService,
    private readonly locationService: LocationService,
  ) {}

  private logger = new Logger(PropertiesService.name);

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
    creatorAgent: User,
  ): Promise<Property> {
    this.validateLocation(createPropertyDto.address);
    const newProperty = new this.propertyModel({
      ...createPropertyDto,
      agent: createPropertyDto.agentId || creatorAgent._id,
    });

    const savedProperty = await newProperty.save();

    await savedProperty.populate({
      path: 'agent',
      select: '-password',
    });
    await this.invalidatePropertiesCache();
    return plainToInstance(Property, savedProperty.toObject());
  }

  async update(id: string, updatePropertyDto: UpdatePropertyDto) {
    if (updatePropertyDto.address) {
      this.validateLocation(updatePropertyDto.address);
    }

    const updatedProperty = await this.propertyModel
      .findByIdAndUpdate(
        id,
        {
          ...updatePropertyDto,
          agent: updatePropertyDto.agentId,
        },
        { new: true },
      )
      .populate({ path: 'agent', select: '-password' })
      .exec();

    if (!updatedProperty) {
      throw new NotFoundException(`Propiedad con ID '${id}' no encontrada.`);
    }
    await this.invalidatePropertiesCache();
    return plainToInstance(Property, updatedProperty.toObject());
  }

  async findAll(
    queryDto: QueryPropertyDto,
    agentId?: string,
  ): Promise<PaginatedPropertyResponse> {
    const {
      page = 1,
      limit = 10,
      state,
      city,
      type,
      status,
      minPrice,
      maxPrice,
      bedrooms,
      search,
      featured,
    } = queryDto;

    const filterQuery: any = {};
    const projection: any = {};
    let sortQuery: any = { featured: -1, createdAt: -1 };

    if (agentId) {
      filterQuery.agent = agentId;
    }

    if (state) {
      filterQuery['address.state'] = { $regex: new RegExp(`^${state}$`, 'i') };
    }
    if (city) {
      filterQuery['address.city'] = { $regex: new RegExp(`^${city}$`, 'i') };
    }

    if (type) {
      filterQuery.type = type;
    }
    if (bedrooms) {
      filterQuery.bedrooms = { $gte: bedrooms };
    }

    if (status) {
      filterQuery.status = status;
    } else {
      filterQuery.status = {
        $in: [
          PropertyStatus.SALE,
          PropertyStatus.RENT,
          PropertyStatus.SOLD,
          PropertyStatus.RENTED,
        ],
      };
    }

    if (minPrice !== undefined || maxPrice !== undefined) {
      filterQuery.price = {};
      if (minPrice !== undefined) {
        filterQuery.price.$gte = minPrice;
      }
      if (maxPrice !== undefined) {
        filterQuery.price.$lte = maxPrice;
      }
    }

    if (featured !== undefined) {
      filterQuery.featured = featured;
    }

    if (search) {
      const searchRegex = { $regex: new RegExp(search, 'i') };

      filterQuery.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { 'address.city': searchRegex },
        { 'address.address': searchRegex },
      ];

      sortQuery = { featured: -1, createdAt: -1 };
    }

    const skip = (page - 1) * limit;

    const [properties, total] = await Promise.all([
      this.propertyModel
        .find(filterQuery)
        .populate('agent')
        .sort(sortQuery)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.propertyModel.countDocuments(filterQuery),
    ]);

    const serializedData = properties.map((prop) =>
      plainToInstance(Property, prop.toObject()),
    );

    return {
      data: serializedData,
      total,
      page,
      limit,
    };
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
    await this.invalidatePropertiesCache();
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

  private async invalidatePropertiesCache() {
    this.logger.log('Invalidando TODO el caché de Redis/Valkey...');

    try {
      await this.cacheManager.clear();
      this.logger.log('Caché invalidado exitosamente.');
    } catch (error) {
      this.logger.error('Error al intentar invalidar el caché:', error);
    }
  }
}
