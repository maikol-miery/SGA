import { baseDatos, inicializarEsquemaBaseDatos } from '../utils/bd'
import type { 
  Usuario, 
  Seccion, 
  Modulo, 
  Estudiante, 
  Incidencia, 
  ConfiguracionIndicadores, 
  RegistroNota, 
  ControlDiario, 
  EventoCalendario 
} from '~/types/sistema'

export default defineEventHandler((evento) => {
  inicializarEsquemaBaseDatos()

  const usuarios = baseDatos.prepare('SELECT * FROM usuarios').all() as any[]
  const usuariosFormateados: Usuario[] = usuarios.map(u => ({
    ...u,
    secciones_asignadas: u.secciones_asignadas ? JSON.parse(u.secciones_asignadas) : []
  }))

  const secciones = baseDatos.prepare('SELECT * FROM secciones').all() as Seccion[]
  const modulosBd = baseDatos.prepare('SELECT * FROM modulos ORDER BY lapso ASC, numero ASC').all() as any[]
  const modulos: Modulo[] = modulosBd.map(m => ({
    ...m,
    tipo_evaluacion: m.tipo_evaluacion || 'REGULAR',
    ponderacion_porcentaje: Number(m.ponderacion_porcentaje) || 50.0,
    activo: Boolean(m.activo)
  }))
  const estudiantes = baseDatos.prepare('SELECT * FROM estudiantes ORDER BY seccion_id ASC, numero_lista ASC').all() as Estudiante[]
  
  const incidenciasBd = baseDatos.prepare('SELECT * FROM incidencias ORDER BY fecha DESC').all() as any[]
  const incidencias: Incidencia[] = incidenciasBd.map(inc => ({
    ...inc,
    es_falta_muy_grave: Boolean(inc.es_falta_muy_grave)
  }))

  const configuraciones = baseDatos.prepare('SELECT * FROM configuraciones_indicadores').all() as ConfiguracionIndicadores[]
  const notas = baseDatos.prepare('SELECT * FROM notas').all() as RegistroNota[]
  const controlesDiarios = baseDatos.prepare('SELECT * FROM controles_diarios ORDER BY fecha DESC').all() as ControlDiario[]
  
  const eventosBd = baseDatos.prepare('SELECT * FROM eventos_calendario ORDER BY fecha ASC').all() as any[]
  const eventos: EventoCalendario[] = eventosBd.map(ev => ({
    ...ev,
    bloqueado_para_docentes: Boolean(ev.bloqueado_para_docentes)
  }))

  return {
    exito: true,
    datos: {
      usuarios: usuariosFormateados,
      secciones,
      modulos,
      estudiantes,
      incidencias,
      configuraciones,
      notas,
      controles_diarios: controlesDiarios,
      eventos_calendario: eventos
    }
  }
})
