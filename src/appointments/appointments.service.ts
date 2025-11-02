import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Appointment } from './entities/appointment.entity';
import { Model } from 'mongoose';
import { Property } from '../properties/entities/property.entity';
import { MailService } from '../mail/mail.service';
import { User, UserRole } from '../users/entities/user.entity';
import { ConfigService } from '@nestjs/config';
import { plainToInstance } from 'class-transformer';
import { UsersService } from '../users/users.service';
import { QueryAppointmentDto } from './dto/query-appointment-dto';
import { PaginatedAppointmentResponse } from './interfaces/paginated-appointment.response.interface';

@Injectable()
export class AppointmentsService {
  private readonly logger = new Logger(AppointmentsService.name);

  constructor(
    @InjectModel(Appointment.name)
    private readonly appointmentModel: Model<Appointment>,

    @InjectModel(Property.name)
    private readonly propertyModel: Model<Property>,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly usersService: UsersService,
  ) {}

  async create(
    createAppointmentDto: CreateAppointmentDto,
  ): Promise<Appointment> {
    const placeholderImage = 'https://URL.de.tu.empresa/placeholder-dicasa.jpg';

    const { propertyId, name, email, phoneNumber, message, appointmentDate } =
      createAppointmentDto;

    this.logger.log(`[DEBUG] Iniciando 'create' para: ${email}`);

    const property = await this.propertyModel
      .findById(propertyId)
      .populate('agent')
      .exec();

    if (!property) {
      this.logger.error(
        `[DEBUG] Propiedad NO encontrada con ID: ${propertyId}`,
      );
      throw new NotFoundException(
        `Propiedad con ID '${propertyId}' no encontrada.`,
      );
    }

    const propertyImage =
      property.images && property.images.length > 0
        ? property.images[0]
        : placeholderImage;

    const agent = property.agent as User;
    if (!agent) {
      this.logger.error(`[DEBUG] Propiedad ${propertyId} no tiene agente.`);
      throw new InternalServerErrorException(
        'La propiedad no tiene un agente asignado.',
      );
    }

    const newAppointmentTime = new Date(appointmentDate);

    const windowInMs = 3599000;

    // Límite inferior: (Hora solicitada) - (59m 59s)
    const lowerLimit = new Date(newAppointmentTime.getTime() - windowInMs);

    // Límite superior: (Hora solicitada) + (59m 59s)
    const upperLimit = new Date(newAppointmentTime.getTime() + windowInMs);

    this.logger.log(
      `Chequeando disponibilidad para agente ${agent._id} entre ${lowerLimit.toISOString()} y ${upperLimit.toISOString()}`,
    );

    const existingAppointment = await this.appointmentModel.findOne({
      agent: agent._id,
      appointmentDate: {
        $gt: lowerLimit, // "Mayor que" 1 hora antes (ej. 1:00:01 PM si se pide a las 2:00 PM)
        $lt: upperLimit, // "Menor que" 1 hora después (ej. 2:59:59 PM si se pide a las 2:00 PM)
      },
    });

    if (existingAppointment) {
      this.logger.warn(
        `Conflicto de cita para agente ${agent._id}. Solicitada: ${newAppointmentTime}. Existente: ${existingAppointment.appointmentDate}`,
      );
      throw new ConflictException(
        `El agente ya tiene una cita programada en un horario que choca con el seleccionado. Por favor, elija otra hora.`,
      );
    }

    this.logger.log(`Horario disponible. Creando cita...`);

    const newAppointment = new this.appointmentModel({
      ...createAppointmentDto,
      appointmentDate: newAppointmentTime,
      property: property._id,
      agent: agent._id,
      status: 'pending',
    });

    this.logger.log(
      `[DEBUG] Documento Creado (en memoria): ${newAppointment._id}`,
    );

    const savedAppointment = await newAppointment.save();

    this.logger.log(
      `[DEBUG] Documento GUARDADO en DB. ID: ${savedAppointment._id}`,
    );

    const propertyUrl = `${this.configService.get(
      'FRONTEND_URL',
    )}/properties/${property._id}`;

    // email de notificación al agente (asesor)
    try {
      await this.mailService.sendEmail(
        agent.email,
        `Nueva solicitud de información para: ${property.title}`,
        'new-appointment-notification',
        {
          agentName: agent.name,
          agentEmail: agent.email,
          agentPhone: agent.phoneNumber,
          clientName: name,
          clientEmail: email,
          clientPhone: phoneNumber,
          message,
          propertyTitle: property.title,
          propertyUrl,
          propertyImage: propertyImage,
          appointmentDateString: newAppointmentTime,
        },
      );
    } catch (error) {
      this.logger.error(
        `Error al enviar email de notificación al agente ${agent.email}`,
        error,
      );
    }

    //email de confirmacion de la cita (cliente)
    try {
      await this.mailService.sendEmail(
        email,
        `Confirmación de tu solicitud - ${property.title}`,
        'new-appointment-confirmation',
        {
          clientName: name,
          propertyTitle: property.title,
          agentName: agent.name,
          agentEmail: agent.email,
          agentPhone: agent.phoneNumber,
          propertyUrl,
          propertyImage: propertyImage,
          appointmentDateString: newAppointmentTime,
        },
      );
    } catch (error) {
      this.logger.error(
        `Error al enviar email de confirmación al cliente ${email}`,
        error,
      );
    }

    this.logger.log(`Nueva cita creada para la propiedad ${property.title}`);

    const populatedDoc = await savedAppointment.populate([
      {
        path: 'agent',
        select: 'name email phoneNumber',
      },
      {
        path: 'property',
        select: 'title price',
      },
    ]);

    return plainToInstance(Appointment, populatedDoc.toObject());
  }

  async findAll(
    queryDto: QueryAppointmentDto,
  ): Promise<PaginatedAppointmentResponse> {
    const { page = 1, limit = 10, search, status } = queryDto;

    const filterQuery: any = {};
    const skip = (page - 1) * limit;

    if (search) {
      const searchRegex = { $regex: new RegExp(search, 'i') };
      filterQuery.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { phoneNumber: searchRegex },
      ];
    }

    if (status) {
      filterQuery.status = status;
    }

    const [appointments, total] = await Promise.all([
      this.appointmentModel
        .find(filterQuery)
        .populate('property', 'title')
        .populate('agent', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.appointmentModel.countDocuments(filterQuery),
    ]);

    const serializedData = plainToInstance(
      Appointment,
      appointments.map((a) => a.toObject()),
    );

    return {
      data: serializedData,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string): Promise<Appointment> {
    const appointment = await this.appointmentModel
      .findById(id)
      .populate('property', 'title price')
      .populate('agent', 'name email phoneNumber')
      .exec();

    if (!appointment) {
      throw new NotFoundException(`Cita con ID '${id}' no encontrada.`);
    }

    return plainToInstance(Appointment, appointment.toObject());
  }

  async findForUser(user: User): Promise<Appointment[]> {
    this.logger.log(
      `[findForUser] Buscando citas para el usuario: ${user.email}`,
    );

    const appointments = await this.appointmentModel
      .find({
        $or: [{ email: user.email }, { phoneNumber: user.phoneNumber }],
      })
      .populate('property', 'title price images status')
      .populate('agent', 'name email phoneNumber')
      .sort({ appointmentDate: -1 })
      .exec();

    if (!appointments) {
      return [];
    }

    return plainToInstance(
      Appointment,
      appointments.map((a) => a.toObject()),
    );
  }

  async update(
    id: string,
    updateAppointmentDto: UpdateAppointmentDto,
  ): Promise<Appointment> {
    const { appointmentDate } = updateAppointmentDto;

    const existingAppointment = await this.appointmentModel.findById(id);

    if (!existingAppointment) {
      throw new NotFoundException(`Cita con ID '${id}' no encontrada.`);
    }

    if (appointmentDate) {
      const newAppointmentTime = new Date(appointmentDate);
      const windowInMs = 3599000;
      const lowerLimit = new Date(newAppointmentTime.getTime() - windowInMs);
      const upperLimit = new Date(newAppointmentTime.getTime() + windowInMs);

      const conflict = await this.appointmentModel.findOne({
        agent: existingAppointment.agent,
        appointmentDate: {
          $gt: lowerLimit,
          $lt: upperLimit,
        },
        _id: { $ne: id },
      });

      if (conflict) {
        throw new ConflictException(
          `El agente ya tiene otra cita en el horario seleccionado.`,
        );
      }
    }

    const updatedAppointment = await this.appointmentModel.findByIdAndUpdate(
      id,
      {
        ...updateAppointmentDto,
        ...(appointmentDate && { appointmentDate: new Date(appointmentDate) }),
      },
      { new: true },
    );

    if (!updatedAppointment) {
      throw new InternalServerErrorException('No se pudo actualizar la cita.');
    }

    const populatedDoc = await updatedAppointment.populate([
      { path: 'agent', select: 'name email phoneNumber' },
      { path: 'property', select: 'title price' },
    ]);

    return plainToInstance(Appointment, populatedDoc.toObject());
  }

  async reassignAgent(
    appointmentId: string,
    newAgentId: string,
  ): Promise<Appointment> {
    this.logger.log(
      `[SUPERADMIN] Iniciando reasignación de agente para cita: ${appointmentId}`,
    );

    // 1. Validar que la cita exista
    const appointment = await this.appointmentModel.findById(appointmentId);
    if (!appointment) {
      throw new NotFoundException(
        `Cita con ID '${appointmentId}' no encontrada.`,
      );
    }

    // 2. Validar que el nuevo agente exista y sea un agente
    let newAgent: User;
    try {
      newAgent = await this.usersService.findOneById(newAgentId);
    } catch (error) {
      throw new BadRequestException(
        `Agente con ID '${newAgentId}' no encontrado.`,
      );
    }

    // 2b. Validar que el usuario sea un agente (ADMIN o SUPERADMIN)
    if (
      !newAgent.roles.includes(UserRole.ADMIN) &&
      !newAgent.roles.includes(UserRole.SUPERADMIN)
    ) {
      throw new BadRequestException(
        `El usuario con ID '${newAgentId}' no es un agente válido.`,
      );
    }

    // 3. (Opcional) Verificar si el agente ya es el mismo
    if (appointment.agent.toString() === newAgentId) {
      this.logger.warn(
        `El agente ${newAgentId} ya está asignado a esta cita. No se requiere acción.`,
      );
      // Devolvemos la cita populada, tal como lo haría findOne
      return this.findOne(appointmentId);
    }

    // 4. ¡CRÍTICO! Verificar conflictos de horario para el *nuevo* agente
    // Reutilizamos la lógica de tu método create()
    const newAppointmentTime = appointment.appointmentDate;
    const windowInMs = 3599000;
    const lowerLimit = new Date(newAppointmentTime.getTime() - windowInMs);
    const upperLimit = new Date(newAppointmentTime.getTime() + windowInMs);

    const conflict = await this.appointmentModel.findOne({
      agent: newAgentId, // <--- Chequear contra el NUEVO agente
      appointmentDate: {
        $gt: lowerLimit,
        $lt: upperLimit,
      },
    });

    if (conflict) {
      this.logger.error(
        `Conflicto de horario para el nuevo agente ${newAgentId} en la fecha ${newAppointmentTime}`,
      );
      throw new ConflictException(
        `El nuevo agente (ID: ${newAgentId}) ya tiene una cita programada en ese horario.`,
      );
    }

    this.logger.log(
      `Cita ${appointmentId} reasignada exitosamente al agente ${newAgentId}.`,
    );

    // 5. Actualizar la cita
    const updatedAppointment = await this.appointmentModel.findByIdAndUpdate(
      appointmentId,
      { agent: newAgentId },
      { new: true },
    );

    if (!updatedAppointment) {
      throw new InternalServerErrorException('No se pudo actualizar la cita.');
    }

    const populatedDoc = await updatedAppointment.populate([
      { path: 'agent', select: 'name email phoneNumber' },
      { path: 'property', select: 'title price' },
    ]);

    return plainToInstance(Appointment, populatedDoc.toObject());
  }

  async remove(id: string): Promise<{ message: string }> {
    const result = await this.appointmentModel.findByIdAndDelete(id);

    if (!result) {
      throw new NotFoundException(`Cita con ID '${id}' no encontrada.`);
    }

    return { message: `Cita con ID '${id}' eliminada exitosamente.` };
  }
}
