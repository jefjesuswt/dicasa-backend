import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { LocationService } from './location.service';
import { AuthGuard } from 'src/auth/guards/auth.guard';

@Controller('location')
@UseGuards(AuthGuard)
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get('/states')
  getStates() {
    return this.locationService.getStates();
  }

  @Get('/cities/:stateName')
  getCities(@Param('stateName') state: string) {
    return this.locationService.getCities(state);
  }
}
