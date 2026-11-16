import Database from 'better-sqlite3'
import { join } from 'path'
import { existsSync, mkdirSync } from 'fs'

// Carpeta local para almacenar la base de datos sqlite en el servidor local
const carpetaDatos = join(process.cwd(), 'datos_sistema')
if (!existsSync(carpetaDatos)) {
  mkdirSync(carpetaDatos, { recursive: true })
}

const rutaBaseDatos = join(carpetaDatos, 'colegio.db')
export const baseDatos = new Database(rutaBaseDatos)

// Habilitar claves foraneas y modo WAL para alta concurrencia
baseDatos.pragma('journal_mode = WAL')
baseDatos.pragma('foreign_keys = ON')

// Inicializacion de tablas
export function inicializarEsquemaBaseDatos() {
  baseDatos.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      correo TEXT NOT NULL,
      rol TEXT NOT NULL,
      materia_asignada TEXT,
      secciones_asignadas TEXT
    );

    CREATE TABLE IF NOT EXISTS secciones (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      nivel TEXT NOT NULL,
      docente_guia_id TEXT
    );

    CREATE TABLE IF NOT EXISTS modulos (
      id TEXT PRIMARY KEY,
      nombre TEXT NOT NULL,
      numero INTEGER NOT NULL,
      lapso INTEGER NOT NULL,
      tipo_evaluacion TEXT NOT NULL DEFAULT 'REGULAR',
      ponderacion_porcentaje REAL NOT NULL DEFAULT 50.0,
      activo INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS estudiantes (
      id TEXT PRIMARY KEY,
      numero_lista INTEGER NOT NULL,
      cedula TEXT NOT NULL,
      nombres TEXT NOT NULL,
      apellidos TEXT NOT NULL,
      seccion_id TEXT NOT NULL,
      FOREIGN KEY (seccion_id) REFERENCES secciones (id)
    );

    CREATE TABLE IF NOT EXISTS incidencias (
      id TEXT PRIMARY KEY,
      estudiante_id TEXT NOT NULL,
      modulo_id TEXT NOT NULL,
      seccion_id TEXT NOT NULL,
      tipo_apartado TEXT NOT NULL,
      puntos_descontados REAL NOT NULL,
      motivo TEXT NOT NULL,
      fecha TEXT NOT NULL,
      creado_por_usuario_id TEXT NOT NULL,
      es_falta_muy_grave INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (estudiante_id) REFERENCES estudiantes (id),
      FOREIGN KEY (modulo_id) REFERENCES modulos (id),
      FOREIGN KEY (seccion_id) REFERENCES secciones (id)
    );

    CREATE TABLE IF NOT EXISTS configuraciones_indicadores (
      id TEXT PRIMARY KEY,
      seccion_id TEXT NOT NULL,
      modulo_id TEXT NOT NULL,
      indicador_a_nombre TEXT NOT NULL DEFAULT 'Prueba Escrita',
      indicador_a_maximo REAL NOT NULL DEFAULT 4,
      indicador_b_nombre TEXT NOT NULL DEFAULT 'Taller Grupal',
      indicador_b_maximo REAL NOT NULL DEFAULT 3,
      indicador_c_nombre TEXT NOT NULL DEFAULT 'Exposicion',
      indicador_c_maximo REAL NOT NULL DEFAULT 3,
      indicador_d_nombre TEXT NOT NULL DEFAULT 'Trabajo de Investigacion',
      indicador_d_maximo REAL NOT NULL DEFAULT 3,
      indicador_e_nombre TEXT NOT NULL DEFAULT 'Cuaderno / Portafolio',
      indicador_e_maximo REAL NOT NULL DEFAULT 3,
      UNIQUE(seccion_id, modulo_id)
    );

    CREATE TABLE IF NOT EXISTS notas (
      id TEXT PRIMARY KEY,
      estudiante_id TEXT NOT NULL,
      modulo_id TEXT NOT NULL,
      seccion_id TEXT NOT NULL,
      nota_a REAL NOT NULL DEFAULT 0,
      nota_b REAL NOT NULL DEFAULT 0,
      nota_c REAL NOT NULL DEFAULT 0,
      nota_d REAL NOT NULL DEFAULT 0,
      nota_e REAL NOT NULL DEFAULT 0,
      UNIQUE(estudiante_id, modulo_id),
      FOREIGN KEY (estudiante_id) REFERENCES estudiantes (id)
    );

    CREATE TABLE IF NOT EXISTS controles_diarios (
      id TEXT PRIMARY KEY,
      seccion_id TEXT NOT NULL,
      fecha TEXT NOT NULL,
      temas_dados TEXT NOT NULL,
      descripcion_clase TEXT NOT NULL,
      tarea_asignada TEXT NOT NULL,
      docente_id TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS eventos_calendario (
      id TEXT PRIMARY KEY,
      titulo TEXT NOT NULL,
      descripcion TEXT NOT NULL,
      fecha TEXT NOT NULL,
      tipo TEXT NOT NULL,
      seccion_id TEXT,
      creado_por_usuario_id TEXT NOT NULL,
      bloqueado_para_docentes INTEGER NOT NULL DEFAULT 0
    );
  `)

  // Actualizaciones de esquema seguras (migraciones)
  try {
    baseDatos.exec(`ALTER TABLE modulos ADD COLUMN tipo_evaluacion TEXT NOT NULL DEFAULT 'REGULAR';`)
  } catch {}
  try {
    baseDatos.exec(`ALTER TABLE modulos ADD COLUMN ponderacion_porcentaje REAL NOT NULL DEFAULT 50.0;`)
  } catch {}

  sembrarDatosIniciales()
}

// Carga de datos semilla (seed) para pruebas inmediatas
function sembrarDatosIniciales() {
  const conteoUsuarios = baseDatos.prepare('SELECT COUNT(*) as total FROM usuarios').get() as { total: number }
  if (conteoUsuarios.total > 0) {
    return
  }

  // 1. Usuarios con los 4 roles
  const insertarUsuario = baseDatos.prepare(`
    INSERT INTO usuarios (id, nombre, correo, rol, materia_asignada, secciones_asignadas)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  insertarUsuario.run(
    'usr-docente-1',
    'Prof. Carlos Mendoza',
    'carlos.mendoza@colegio.edu',
    'DOCENTE',
    'Matemáticas y Física',
    JSON.stringify(['sec-primaria-6a', 'sec-media-3a', 'sec-media-5a'])
  )

  insertarUsuario.run(
    'usr-coord-primaria',
    'Lic. Maria Fernandez (Coord. Primaria)',
    'maria.fernandez@colegio.edu',
    'COORDINADORA_PRIMARIA',
    'Coordinación Académica Primaria',
    JSON.stringify(['sec-primaria-6a'])
  )

  insertarUsuario.run(
    'usr-coord-media-baja',
    'Prof. Roberto Gomez (Coord. Media Baja)',
    'roberto.gomez@colegio.edu',
    'COORDINADORA_MEDIA_BAJA',
    'Coordinación 1º a 3º Año',
    JSON.stringify(['sec-media-3a'])
  )

  insertarUsuario.run(
    'usr-coord-media-alta',
    'Dra. Patricia Salazar (Coord. Media Alta)',
    'patricia.salazar@colegio.edu',
    'COORDINADORA_MEDIA_ALTA',
    'Coordinación 4º y 5º Año',
    JSON.stringify(['sec-media-5a'])
  )

  // 2. Secciones
  const insertarSeccion = baseDatos.prepare(`
    INSERT INTO secciones (id, nombre, nivel, docente_guia_id)
    VALUES (?, ?, ?, ?)
  `)

  insertarSeccion.run('sec-primaria-6a', '6to Grado Sección A', 'PRIMARIA', 'usr-docente-1')
  insertarSeccion.run('sec-media-3a', '3er Año Sección A', 'MEDIA_BAJA', 'usr-docente-1')
  insertarSeccion.run('sec-media-5a', '5to Año Sección A', 'MEDIA_ALTA', 'usr-docente-1')

  // 3. Modulos
  const insertarModulo = baseDatos.prepare(`
    INSERT INTO modulos (id, nombre, numero, lapso, tipo_evaluacion, ponderacion_porcentaje, activo)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  insertarModulo.run('mod-1', 'Módulo 1 - Lapso I', 1, 1, 'REGULAR', 50.0, 1)
  insertarModulo.run('mod-2', 'Módulo 2 - Lapso I', 2, 1, 'REGULAR', 50.0, 0)
  insertarModulo.run('mod-3', 'Módulo 1 - Lapso II', 1, 2, 'REGULAR', 50.0, 0)

  // 4. Estudiantes realistas (15 estudiantes ordenados por lista en 3er Año A)
  const insertarEstudiante = baseDatos.prepare(`
    INSERT INTO estudiantes (id, numero_lista, cedula, nombres, apellidos, seccion_id)
    VALUES (?, ?, ?, ?, ?, ?)
  `)

  const listaEstudiantesMedia = [
    { num: 1, ci: '31.204.111', nom: 'Alejandro José', ape: 'Alvarado Briceño' },
    { num: 2, ci: '31.455.892', nom: 'Beatriz Elena', ape: 'Castillo Mora' },
    { num: 3, ci: '31.890.312', nom: 'César Augusto', ape: 'Delgado Rivas' },
    { num: 4, ci: '32.012.784', nom: 'Daniela Sofia', ape: 'Escalona Silva' },
    { num: 5, ci: '32.145.980', nom: 'Eduardo Andrés', ape: 'Falcón Paredes' },
    { num: 6, ci: '32.330.129', nom: 'Gabriela Valentina', ape: 'García Montero' },
    { num: 7, ci: '32.489.001', nom: 'Héctor Manuel', ape: 'Herrera Zambrano' },
    { num: 8, ci: '32.551.442', nom: 'Isabella Rosa', ape: 'Infante Méndez' },
    { num: 9, ci: '32.610.778', nom: 'Jesús Alberto', ape: 'López Quintero' },
    { num: 10, ci: '32.744.512', nom: 'Karla Andrea', ape: 'Marín Vargas' },
    { num: 11, ci: '32.890.111', nom: 'Luis Fernando', ape: 'Noriega Rondón' },
    { num: 12, ci: '32.955.334', nom: 'Mariana Coromoto', ape: 'Ortiz Blanco' },
    { num: 13, ci: '33.001.298', nom: 'Nicolás Javier', ape: 'Pérez Contreras' },
    { num: 14, ci: '33.120.445', nom: 'Paula Cristina', ape: 'Rojas Salazar' },
    { num: 15, ci: '33.250.601', nom: 'Ricardo Daniel', ape: 'Vásquez Márquez' },
  ]

  for (const est of listaEstudiantesMedia) {
    insertarEstudiante.run(
      `est-mb-${est.num}`,
      est.num,
      est.ci,
      est.nom,
      est.ape,
      'sec-media-3a'
    )
  }

  // Estudiantes para Primaria (6to Grado A)
  const listaPrimaria = [
    { num: 1, ci: '34.101.001', nom: 'Andrés Felipe', ape: 'Aguilar Toro' },
    { num: 2, ci: '34.202.002', nom: 'Camila Valeria', ape: 'Bermúdez Gil' },
    { num: 3, ci: '34.303.003', nom: 'Diego Alejandro', ape: 'Cabrera Romero' },
    { num: 4, ci: '34.404.004', nom: 'Fabiana Victoria', ape: 'Díaz Navarro' },
    { num: 5, ci: '34.505.005', nom: 'Gabriel Enrique', ape: 'Esteves Morales' }
  ]
  for (const est of listaPrimaria) {
    insertarEstudiante.run(`est-pri-${est.num}`, est.num, est.ci, est.nom, est.ape, 'sec-primaria-6a')
  }

  // Estudiantes para Media Alta (5to Año A)
  const listaMediaAlta = [
    { num: 1, ci: '29.901.101', nom: 'Ana Carolina', ape: 'Acosta Rangel' },
    { num: 2, ci: '29.902.202', nom: 'Bernardo José', ape: 'Borges Vivas' },
    { num: 3, ci: '29.903.303', nom: 'Claudia Marcela', ape: 'Chirinos Peña' },
    { num: 4, ci: '29.904.404', nom: 'David Santiago', ape: 'Duque Salcedo' },
    { num: 5, ci: '29.905.505', nom: 'Elena Teresa', ape: 'Espinoza Godoy' }
  ]
  for (const est of listaMediaAlta) {
    insertarEstudiante.run(`est-ma-${est.num}`, est.num, est.ci, est.nom, est.ape, 'sec-media-5a')
  }

  // 5. Configuracion de Indicadores por defecto (Suma A+B+C+D+E = 16 pts + 4 Convivir = 20 pts)
  const insertarConfiguracion = baseDatos.prepare(`
    INSERT INTO configuraciones_indicadores 
    (id, seccion_id, modulo_id, indicador_a_nombre, indicador_a_maximo, indicador_b_nombre, indicador_b_maximo, indicador_c_nombre, indicador_c_maximo, indicador_d_nombre, indicador_d_maximo, indicador_e_nombre, indicador_e_maximo)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  insertarConfiguracion.run(
    'cfg-sec-media-3a-mod-1',
    'sec-media-3a',
    'mod-1',
    'Evaluación Parcial Escrita', 4.0,
    'Resolución de Guía en Clase', 3.0,
    'Intervención en Pizarra', 3.0,
    'Práctica de Laboratorio', 3.0,
    'Cuaderno de Trabajo', 3.0
  )

  insertarConfiguracion.run(
    'cfg-sec-media-3a-mod-2',
    'sec-media-3a',
    'mod-2',
    'Prueba Sumativa', 5.0,
    'Taller en Parejas', 3.0,
    'Exposición Oral', 3.0,
    'Actividades en Clase', 3.0,
    'Revisión Cuaderno', 2.0
  )

  // 6. Algunas incidencias de ejemplo para probar el motor de Convivir y autogenerador
  const insertarIncidencia = baseDatos.prepare(`
    INSERT INTO incidencias (id, estudiante_id, modulo_id, seccion_id, tipo_apartado, puntos_descontados, motivo, fecha, creado_por_usuario_id, es_falta_muy_grave)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  insertarIncidencia.run(
    'inc-1',
    'est-mb-1',
    'mod-1',
    'sec-media-3a',
    'PRESENTACION',
    0.5,
    'Sin distintivo de la institución y calzado inadecuado',
    '2026-10-14',
    'usr-docente-1',
    0
  )

  insertarIncidencia.run(
    'inc-2',
    'est-mb-2',
    'mod-1',
    'sec-media-3a',
    'CONDUCTA',
    0.5,
    'Uso de teléfono móvil durante explicación',
    '2026-10-18',
    'usr-docente-1',
    0
  )

  insertarIncidencia.run(
    'inc-3',
    'est-mb-3',
    'mod-1',
    'sec-media-3a',
    'PRESENTACION',
    0.5,
    'Camisa por fuera e insignia deteriorada',
    '2026-10-19',
    'usr-docente-1',
    0
  )
  insertarIncidencia.run(
    'inc-4',
    'est-mb-3',
    'mod-1',
    'sec-media-3a',
    'CONDUCTA',
    0.5,
    'Interrupción constante y juego en el aula',
    '2026-10-21',
    'usr-docente-1',
    0
  )

  // 7. Notas pre-cargadas para los primeros estudiantes de 3er Año
  const insertarNota = baseDatos.prepare(`
    INSERT INTO notas (id, estudiante_id, modulo_id, seccion_id, nota_a, nota_b, nota_c, nota_d, nota_e)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  insertarNota.run('not-1', 'est-mb-1', 'mod-1', 'sec-media-3a', 3.5, 3.0, 2.5, 3.0, 3.0)
  insertarNota.run('not-2', 'est-mb-2', 'mod-1', 'sec-media-3a', 4.0, 2.5, 3.0, 2.8, 2.9)
  insertarNota.run('not-3', 'est-mb-3', 'mod-1', 'sec-media-3a', 2.0, 2.0, 1.5, 2.0, 2.5)

  insertarNota.run('not-mod2-1', 'est-mb-1', 'mod-2', 'sec-media-3a', 4.5, 3.0, 3.0, 2.5, 2.0)
  insertarNota.run('not-mod2-2', 'est-mb-2', 'mod-2', 'sec-media-3a', 3.5, 2.0, 2.5, 2.5, 2.0)

  // 8. Controles diarios iniciales
  const insertarControlDiario = baseDatos.prepare(`
    INSERT INTO controles_diarios (id, seccion_id, fecha, temas_dados, descripcion_clase, tarea_asignada, docente_id)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)

  insertarControlDiario.run(
    'dia-1',
    'sec-media-3a',
    '2026-10-20',
    'Ecuaciones de segundo grado y fórmula general',
    'Se explicó la deducción del discriminante con ejemplos en pizarra. Participación activa de la mitad del grupo.',
    'Ejercicios 1 al 10 de la guía de estudio página 45.',
    'usr-docente-1'
  )

  insertarControlDiario.run(
    'dia-2',
    'sec-media-3a',
    '2026-10-22',
    'Resolución de problemas de factorización',
    'Trabajo en parejas resolviendo trinomios cuadrados perfectos y productos notables.',
    'Entregar reporte grupal el próximo lunes a primera hora.',
    'usr-docente-1'
  )

  // 9. Eventos de calendario iniciales
  const insertarEvento = baseDatos.prepare(`
    INSERT INTO eventos_calendario (id, titulo, descripcion, fecha, tipo, seccion_id, creado_por_usuario_id, bloqueado_para_docentes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `)

  insertarEvento.run(
    'eve-1',
    'Examen Parcial de Álgebra',
    'Evaluación escrita individual sobre ecuaciones cuadráticas',
    '2026-11-16',
    'EVALUACION_DOCENTE',
    'sec-media-3a',
    'usr-docente-1',
    0
  )

  insertarEvento.run(
    'eve-2',
    'Cierre y Entrega de Planillas Módulo 1 a Control de Estudios',
    'Fecha límite improrrogable para entrega de notas en secretaría',
    '2026-11-20',
    'ENTREGA_NOTAS_COORDINACION',
    null,
    'usr-coord-media-baja',
    1
  )
}

// Inicializar de inmediato al importar el modulo en el servidor
inicializarEsquemaBaseDatos()
