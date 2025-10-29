import { Injectable, NotFoundException } from '@nestjs/common';
import * as venezuelaData from '../data/venezuela.json';
import { Estado } from './interfaces/location.interface';

@Injectable()
export class LocationService {
  private readonly estados: Estado[] = venezuelaData as Estado[];

  isValidState(stateName: string): boolean {
    return this.estados.some((state) => state.estado === stateName);
  }

  isValidCity(stateName: string, cityName: string): boolean {
    const state = this.estados.find((s) => s.estado === stateName);
    if (!state) {
      return false;
    }

    if (state.ciudades && state.ciudades.includes(cityName)) {
      return true;
    }

    const municipios = state.municipios.map((m) => m.municipio);
    if (municipios.includes(cityName)) {
      return true;
    }

    return false;
  }

  getStates() {
    return this.estados.map((state) => ({
      state: state.estado,
    }));
  }

  getCities(stateName: string): string[] {
    const state = this.estados.find((s) => s.estado === stateName);

    if (!state) {
      throw new NotFoundException(
        `El estado '${stateName}' no fue encontrado.`,
      );
    }

    // Usamos 'ciudades' si existe, si no, los 'municipios'
    const cities = (
      state.ciudades || state.municipios.map((m) => m.municipio)
    ).sort();

    return cities;
  }
}
