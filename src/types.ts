export type CategoriaType = 'Comida' | 'Transporte' | 'Servicios' | 'Varios';

export interface Transaccion {
  id: string;
  user_id?: string;
  monto: number;
  categoria: CategoriaType;
  concepto: string;
  tipo?: string;
  estado?: 'activo' | 'archivado' | string;
  creado_en: string;
}

export interface PerfilIngreso {
  id?: string;
  user_id?: string;
  ingreso_total: number;
  updated_at?: string;
}
