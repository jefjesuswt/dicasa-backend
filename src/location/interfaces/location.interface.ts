export interface Estado {
  iso_31662: string;
  estado: string;
  capital: string;
  id_estado: number;
  municipios: Municipio[];
  ciudades?: string[];
}

export interface Municipio {
  municipio: string;
  capital: string;
  parroquias: string[];
}
