// Definicion de tipos e interfaces en espanol para todo el sistema academico

export type RolUsuario = 
  | 'DOCENTE' 
  | 'COORDINADORA_PRIMARIA' 
  | 'COORDINADORA_MEDIA_BAJA' 
  | 'COORDINADORA_MEDIA_ALTA'

export type NivelEducativo = 'PRIMARIA' | 'MEDIA_BAJA' | 'MEDIA_ALTA'

export interface Usuario {
  id: string
  nombre: string
  correo: string
  rol: RolUsuario
  materia_asignada?: string
  secciones_asignadas?: string[] // IDs de las secciones
}

export interface Seccion {
  id: string
  nombre: string // Ej: "1er Grado A", "3er Ano B", "5to Ano A"
  nivel: NivelEducativo
  docente_guia_id?: string
}

export interface Estudiante {
  id: string
  numero_lista: number
  cedula: string
  nombres: string
  apellidos: string
  seccion_id: string
}

export type TipoEvaluacionModulo = 'REGULAR' | 'RECUPERACION' | 'NIVELACION' | 'PROYECTO'

export interface Modulo {
  id: string
  nombre: string // Ej: "Módulo 1 - Lapso I", "Módulo 2 - Lapso I"
  numero: number
  lapso: number
  tipo_evaluacion: TipoEvaluacionModulo
  ponderacion_porcentaje: number // Porcentaje del lapso (ej: 50%)
  activo: boolean
}

export type TipoApartadoConvivir = 'PRESENTACION' | 'CONDUCTA'

export interface Incidencia {
  id: string
  estudiante_id: string
  modulo_id: string
  seccion_id: string
  tipo_apartado: TipoApartadoConvivir
  puntos_descontados: number // Usualmente 0.5
  motivo: string
  fecha: string // Formato YYYY-MM-DD
  creado_por_usuario_id: string
  es_falta_muy_grave: boolean // Exclusivo de coordinadoras
}

export interface ConfiguracionIndicadores {
  id?: string
  seccion_id: string
  modulo_id: string
  indicador_a_nombre: string
  indicador_a_maximo: number
  indicador_b_nombre: string
  indicador_b_maximo: number
  indicador_c_nombre: string
  indicador_c_maximo: number
  indicador_d_nombre: string
  indicador_d_maximo: number
  indicador_e_nombre: string
  indicador_e_maximo: number
}

export interface RegistroNota {
  id?: string
  estudiante_id: string
  modulo_id: string
  seccion_id: string
  nota_a: number
  nota_b: number
  nota_c: number
  nota_d: number
  nota_e: number
  // El Convivir (letra F) y la definitiva se calculan reactivamente o se persisten
  convivir_calculado?: number
  observacion_autogenerada?: string
  definitiva?: number
}

export interface ControlDiario {
  id: string
  seccion_id: string
  fecha: string
  temas_dados: string
  descripcion_clase: string
  tarea_asignada: string
  docente_id: string
}

export type TipoEventoCalendario = 'EVALUACION_DOCENTE' | 'ENTREGA_NOTAS_COORDINACION'

export interface EventoCalendario {
  id: string
  titulo: string
  descripcion: string
  fecha: string
  tipo: TipoEventoCalendario
  seccion_id?: string
  creado_por_usuario_id: string
  bloqueado_para_docentes: boolean
}

export type TipoAccionOffline = 
  | 'REGISTRAR_INCIDENCIA'
  | 'ELIMINAR_INCIDENCIA'
  | 'APLICAR_FALTA_MUY_GRAVE'
  | 'GUARDAR_NOTAS'
  | 'GUARDAR_CONFIGURACION_INDICADORES'
  | 'GUARDAR_CONTROL_DIARIO'
  | 'GUARDAR_EVENTO_CALENDARIO'
  | 'GUARDAR_MODULO'
  | 'ELIMINAR_MODULO'

export interface AccionOffline {
  id: string
  tipo: TipoAccionOffline
  datos: any
  marca_temporal: number
  intentos: number
}

export interface EstadoCalculadoConvivir {
  puntos_presentacion: number
  puntos_conducta: number
  total_convivir: number
  es_falta_muy_grave: boolean
  observacion_generada: string
  incidencias: Incidencia[]
}
