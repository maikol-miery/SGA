import { defineStore } from 'pinia'
import type { 
  Usuario, 
  Seccion, 
  Modulo, 
  Estudiante, 
  Incidencia, 
  ConfiguracionIndicadores, 
  RegistroNota, 
  ControlDiario, 
  EventoCalendario,
  AccionOffline,
  EstadoCalculadoConvivir,
  TipoApartadoConvivir
} from '~/types/sistema'

export const useEscuelaStore = defineStore('escuela', {
  state: () => ({
    // Estado de conexion
    estaEnLinea: true,
    sincronizando: false,
    ultimoErrorSincronizacion: null as string | null,
    colaSincronizacion: [] as AccionOffline[],

    // Usuario y selecciones activas
    usuarioActual: null as Usuario | null,
    seccionActivaId: '',
    moduloActivoId: '',

    // Entidades del sistema
    usuarios: [] as Usuario[],
    secciones: [] as Seccion[],
    modulos: [] as Modulo[],
    estudiantes: [] as Estudiante[],
    incidencias: [] as Incidencia[],
    configuraciones: [] as ConfiguracionIndicadores[],
    notas: [] as RegistroNota[],
    controlesDiarios: [] as ControlDiario[],
    eventosCalendario: [] as EventoCalendario[],

    // UI State
    pestanaActiva: 'convivir' as 'convivir' | 'planilla' | 'diario' | 'calendario',
    modoTranscripcion: false,
    indiceEstudianteTranscripcion: 0
  }),

  getters: {
    seccionActual(state): Seccion | undefined {
      return state.secciones.find(s => s.id === state.seccionActivaId)
    },

    moduloActual(state): Modulo | undefined {
      return state.modulos.find(m => m.id === state.moduloActivoId)
    },

    estudiantesSeccionActual(state): Estudiante[] {
      return state.estudiantes
        .filter(e => e.seccion_id === state.seccionActivaId)
        .sort((a, b) => a.numero_lista - b.numero_lista)
    },

    configuracionSeccionModulo(state): ConfiguracionIndicadores {
      const encontrada = state.configuraciones.find(
        c => c.seccion_id === state.seccionActivaId && c.modulo_id === state.moduloActivoId
      )
      if (encontrada) return encontrada

      return {
        seccion_id: state.seccionActivaId,
        modulo_id: state.moduloActivoId,
        indicador_a_nombre: 'Prueba Escrita',
        indicador_a_maximo: 4.0,
        indicador_b_nombre: 'Taller Grupal',
        indicador_b_maximo: 3.0,
        indicador_c_nombre: 'Exposición',
        indicador_c_maximo: 3.0,
        indicador_d_nombre: 'Investigación',
        indicador_d_maximo: 3.0,
        indicador_e_nombre: 'Cuaderno / Portafolio',
        indicador_e_maximo: 3.0
      }
    },

    esSumaPonderacionValida(): boolean {
      const cfg = this.configuracionSeccionModulo
      const sumaLetras = (
        Number(cfg.indicador_a_maximo || 0) +
        Number(cfg.indicador_b_maximo || 0) +
        Number(cfg.indicador_c_maximo || 0) +
        Number(cfg.indicador_d_maximo || 0) +
        Number(cfg.indicador_e_maximo || 0)
      )
      const convivirFijo = 4.0
      return Math.abs((sumaLetras + convivirFijo) - 20.0) < 0.01
    },

    sumaPonderacionActual(): number {
      const cfg = this.configuracionSeccionModulo
      return (
        Number(cfg.indicador_a_maximo || 0) +
        Number(cfg.indicador_b_maximo || 0) +
        Number(cfg.indicador_c_maximo || 0) +
        Number(cfg.indicador_d_maximo || 0) +
        Number(cfg.indicador_e_maximo || 0) +
        4.0
      )
    },

    puedeAplicarFaltaMuyGrave(state): boolean {
      if (!state.usuarioActual) return false
      const rol = state.usuarioActual.rol
      const seccion = state.secciones.find(s => s.id === state.seccionActivaId)
      if (!seccion) return false

      if (rol === 'COORDINADORA_PRIMARIA' && seccion.nivel === 'PRIMARIA') return true
      if (rol === 'COORDINADORA_MEDIA_BAJA' && seccion.nivel === 'MEDIA_BAJA') return true
      if (rol === 'COORDINADORA_MEDIA_ALTA' && seccion.nivel === 'MEDIA_ALTA') return true
      return false
    },

    lapsosDisponibles(state): number[] {
      const lapsos = state.modulos.map(m => m.lapso)
      return Array.from(new Set(lapsos)).sort((a, b) => a - b)
    },

    modulosLapsoActivo(state): Modulo[] {
      const moduloActual = state.modulos.find(m => m.id === state.moduloActivoId)
      const lapsoActual = moduloActual ? moduloActual.lapso : 1
      return state.modulos
        .filter(m => m.lapso === lapsoActual)
        .sort((a, b) => a.numero - b.numero)
    },

    puedeCrearEventoCoordinacion(state): boolean {
      return Boolean(state.usuarioActual && state.usuarioActual.rol.startsWith('COORDINADORA'))
    }
  },

  actions: {
    // Calculo reactivo del Convivir por estudiante y modulo
    obtenerEstadoConvivirEstudiante(estudianteId: string, moduloId?: string): EstadoCalculadoConvivir {
      const mid = moduloId || this.moduloActivoId
      const listaIncidencias = this.incidencias.filter(
        i => i.estudiante_id === estudianteId && i.modulo_id === mid
      )

      // Verificar si hay falta muy grave aplicada por coordinacion
      const faltaMuyGrave = listaIncidencias.find(i => i.es_falta_muy_grave)
      if (faltaMuyGrave) {
        return {
          puntos_presentacion: 0.0,
          puntos_conducta: 0.0,
          total_convivir: 0.0,
          es_falta_muy_grave: true,
          observacion_generada: `0.0 pts: Sanción por Falta Muy Grave aplicada por Coordinación (${faltaMuyGrave.motivo})`,
          incidencias: listaIncidencias
        }
      }

      let descuentoPresentacion = 0
      let descuentoConducta = 0
      const partesObservacion: string[] = []

      // Se procesan en orden cronologico
      const ordenadas = [...listaIncidencias].sort((a, b) => a.fecha.localeCompare(b.fecha))

      for (const inc of ordenadas) {
        const diaMes = inc.fecha.includes('-') 
          ? inc.fecha.split('-').slice(1).reverse().join('/') 
          : inc.fecha

        if (inc.tipo_apartado === 'PRESENTACION') {
          descuentoPresentacion += inc.puntos_descontados
          partesObservacion.push(`-${inc.puntos_descontados.toFixed(1)} Presentación: ${inc.motivo} (${diaMes})`)
        } else {
          descuentoConducta += inc.puntos_descontados
          partesObservacion.push(`-${inc.puntos_descontados.toFixed(1)} Conducta: ${inc.motivo} (${diaMes})`)
        }
      }

      // 2.0 puntos base para cada apartado; ninguno baja de 0.0
      const puntosPresentacion = Math.max(0.0, 2.0 - descuentoPresentacion)
      const puntosConducta = Math.max(0.0, 2.0 - descuentoConducta)
      const totalConvivir = Number((puntosPresentacion + puntosConducta).toFixed(1))

      const observacion = partesObservacion.length > 0 
        ? partesObservacion.join('; ')
        : 'Excelente desempeño y cumplimiento en presentación y conducta.'

      return {
        puntos_presentacion: puntosPresentacion,
        puntos_conducta: puntosConducta,
        total_convivir: totalConvivir,
        es_falta_muy_grave: false,
        observacion_generada: observacion,
        incidencias: listaIncidencias
      }
    },

    obtenerNotaEstudiante(estudianteId: string, moduloId?: string): RegistroNota {
      const mid = moduloId || this.moduloActivoId
      const encontrada = this.notas.find(
        n => n.estudiante_id === estudianteId && n.modulo_id === mid
      )
      if (encontrada) return encontrada

      return {
        estudiante_id: estudianteId,
        modulo_id: mid,
        seccion_id: this.seccionActivaId,
        nota_a: 0,
        nota_b: 0,
        nota_c: 0,
        nota_d: 0,
        nota_e: 0
      }
    },

    calcularDefinitivaEstudiante(estudianteId: string, moduloId?: string): number {
      const mid = moduloId || this.moduloActivoId
      const nota = this.obtenerNotaEstudiante(estudianteId, mid)
      const convivir = this.obtenerEstadoConvivirEstudiante(estudianteId, mid)
      const suma = (
        Number(nota.nota_a || 0) +
        Number(nota.nota_b || 0) +
        Number(nota.nota_c || 0) +
        Number(nota.nota_d || 0) +
        Number(nota.nota_e || 0) +
        convivir.total_convivir
      )
      return Math.min(20, Math.max(0, Math.round(suma * 10) / 10))
    },

    // Cálculo consolidado de la definitiva de un Lapso completo
    calcularDefinitivaLapsoEstudiante(estudianteId: string, lapsoNumero: number): {
      definitiva_lapso: number
      modulos_detalle: { modulo_nombre: string; definitiva: number; porcentaje: number }[]
    } {
      const modulosDelLapso = this.modulos
        .filter(m => m.lapso === lapsoNumero)
        .sort((a, b) => a.numero - b.numero)

      if (modulosDelLapso.length === 0) {
        return { definitiva_lapso: 0, modulos_detalle: [] }
      }

      let sumaPonderada = 0
      let sumaPorcentajes = 0
      const modulos_detalle: { modulo_nombre: string; definitiva: number; porcentaje: number }[] = []

      for (const mod of modulosDelLapso) {
        const def = this.calcularDefinitivaEstudiante(estudianteId, mod.id)
        const pct = mod.ponderacion_porcentaje || (100 / modulosDelLapso.length)
        sumaPonderada += (def * (pct / 100))
        sumaPorcentajes += pct
        modulos_detalle.push({
          modulo_nombre: mod.nombre,
          definitiva: def,
          porcentaje: pct
        })
      }

      // Normalizar en base al 100%
      const resultadoFinal = sumaPorcentajes > 0 
        ? (sumaPonderada / (sumaPorcentajes / 100))
        : 0

      return {
        definitiva_lapso: Math.min(20, Math.max(0, Math.round(resultadoFinal * 10) / 10)),
        modulos_detalle
      }
    },

    // Gestión de Módulos y Lapsos
    guardarModulo(modulo: Partial<Modulo>) {
      const esNuevo = !modulo.id
      const id = modulo.id || `mod-${Date.now()}`
      const lapso = Number(modulo.lapso) || 1
      const numero = Number(modulo.numero) || (this.modulos.filter(m => m.lapso === lapso).length + 1)
      const nombre = modulo.nombre?.trim() || `Módulo ${numero} - Lapso ${lapso}`
      const tipo_evaluacion = modulo.tipo_evaluacion || 'REGULAR'
      const ponderacion_porcentaje = Number(modulo.ponderacion_porcentaje) || 50.0

      const nuevoModulo: Modulo = {
        id,
        nombre,
        numero,
        lapso,
        tipo_evaluacion,
        ponderacion_porcentaje,
        activo: modulo.activo ?? true
      }

      const indice = this.modulos.findIndex(m => m.id === id)
      if (indice !== -1) {
        this.modulos[indice] = nuevoModulo
      } else {
        this.modulos.push(nuevoModulo)
      }

      // Si no hay módulo activo, seleccionarlo
      if (!this.moduloActivoId) {
        this.moduloActivoId = id
      }

      this.encolarAccionOffline('GUARDAR_MODULO', nuevoModulo)
      this.guardarEnAlmacenamientoLocal()
    },

    eliminarModulo(idModulo: string) {
      if (this.modulos.length <= 1) {
        alert('Debe existir al menos un módulo en el sistema.')
        return
      }

      const indice = this.modulos.findIndex(m => m.id === idModulo)
      if (indice !== -1) {
        this.modulos.splice(indice, 1)
        if (this.moduloActivoId === idModulo) {
          this.moduloActivoId = this.modulos[0].id
        }
        this.encolarAccionOffline('ELIMINAR_MODULO', { id: idModulo })
        this.guardarEnAlmacenamientoLocal()
      }
    },

    // Registrar incidencia de Convivir (-0.5 pts)
    registrarDescuentoConvivir(estudianteId: string, tipo: TipoApartadoConvivir, motivo: string) {
      const estadoActual = this.obtenerEstadoConvivirEstudiante(estudianteId)
      if (estadoActual.es_falta_muy_grave) {
        alert('Este estudiante tiene sanción de Falta Muy Grave por Coordinación. El Convivir está bloqueado en 0.0 pts.')
        return
      }

      if (tipo === 'PRESENTACION' && estadoActual.puntos_presentacion <= 0) {
        alert('El apartado de Presentación Formal ya está en el límite mínimo de 0.0 pts.')
        return
      }
      if (tipo === 'CONDUCTA' && estadoActual.puntos_conducta <= 0) {
        alert('El apartado de Conducta ya está en el límite mínimo de 0.0 pts.')
        return
      }

      const hoy = new Date().toISOString().split('T')[0]
      const nuevaIncidencia: Incidencia = {
        id: `inc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        estudiante_id: estudianteId,
        modulo_id: this.moduloActivoId,
        seccion_id: this.seccionActivaId,
        tipo_apartado: tipo,
        puntos_descontados: 0.5,
        motivo: motivo.trim() || (tipo === 'PRESENTACION' ? 'Descuido en uniforme o presentación' : 'Falta de disciplina en clase'),
        fecha: hoy,
        creado_por_usuario_id: this.usuarioActual?.id || 'usr-anon',
        es_falta_muy_grave: false
      }

      this.incidencias.unshift(nuevaIncidencia)
      this.encolarAccionOffline('REGISTRAR_INCIDENCIA', nuevaIncidencia)
      this.guardarEnAlmacenamientoLocal()
    },

    // Aplicar o remover Falta Muy Grave (Exclusivo Coordinadoras)
    alternarFaltaMuyGrave(estudianteId: string, motivo: string = 'Sanción disciplinaria grave aplicada por Coordinación') {
      if (!this.puedeAplicarFaltaMuyGrave) {
        alert('Permiso denegado: Solo la Coordinadora del nivel correspondiente puede aplicar o anular una Falta Muy Grave.')
        return
      }

      const estado = this.obtenerEstadoConvivirEstudiante(estudianteId)
      if (estado.es_falta_muy_grave) {
        // Remover falta muy grave
        const falta = estado.incidencias.find(i => i.es_falta_muy_grave)
        if (falta) {
          this.eliminarIncidencia(falta.id)
        }
      } else {
        // Aplicar falta muy grave
        const hoy = new Date().toISOString().split('T')[0]
        const nuevaFalta: Incidencia = {
          id: `fmg-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          estudiante_id: estudianteId,
          modulo_id: this.moduloActivoId,
          seccion_id: this.seccionActivaId,
          tipo_apartado: 'CONDUCTA',
          puntos_descontados: 4.0,
          motivo,
          fecha: hoy,
          creado_por_usuario_id: this.usuarioActual?.id || 'coord',
          es_falta_muy_grave: true
        }

        this.incidencias.unshift(nuevaFalta)
        this.encolarAccionOffline('APLICAR_FALTA_MUY_GRAVE', nuevaFalta)
        this.guardarEnAlmacenamientoLocal()
      }
    },

    eliminarIncidencia(idIncidencia: string) {
      const indice = this.incidencias.findIndex(i => i.id === idIncidencia)
      if (indice !== -1) {
        this.incidencias.splice(indice, 1)
        this.encolarAccionOffline('ELIMINAR_INCIDENCIA', { id: idIncidencia })
        this.guardarEnAlmacenamientoLocal()
      }
    },

    // Guardar / actualizar nota de un estudiante
    actualizarNotaEstudiante(
      estudianteId: string, 
      campo: 'nota_a' | 'nota_b' | 'nota_c' | 'nota_d' | 'nota_e', 
      valor: number
    ) {
      const cfg = this.configuracionSeccionModulo
      const maximoPermitido = {
        nota_a: cfg.indicador_a_maximo,
        nota_b: cfg.indicador_b_maximo,
        nota_c: cfg.indicador_c_maximo,
        nota_d: cfg.indicador_d_maximo,
        nota_e: cfg.indicador_e_maximo
      }[campo]

      let valorFinal = Math.max(0, Number(valor) || 0)
      if (valorFinal > maximoPermitido) {
        valorFinal = maximoPermitido
      }

      let nota = this.notas.find(
        n => n.estudiante_id === estudianteId && n.modulo_id === this.moduloActivoId
      )

      if (!nota) {
        nota = {
          id: `nota-${estudianteId}-${this.moduloActivoId}`,
          estudiante_id: estudianteId,
          modulo_id: this.moduloActivoId,
          seccion_id: this.seccionActivaId,
          nota_a: 0,
          nota_b: 0,
          nota_c: 0,
          nota_d: 0,
          nota_e: 0
        }
        this.notas.push(nota)
      }

      nota[campo] = valorFinal
      this.encolarAccionOffline('GUARDAR_NOTAS', [nota])
      this.guardarEnAlmacenamientoLocal()
    },

    // Actualizar ponderacion y leyenda de la planilla
    guardarConfiguracionIndicadores(nuevaConfiguracion: ConfiguracionIndicadores) {
      const indice = this.configuraciones.findIndex(
        c => c.seccion_id === this.seccionActivaId && c.modulo_id === this.moduloActivoId
      )

      const objetoConfiguracion = {
        ...nuevaConfiguracion,
        seccion_id: this.seccionActivaId,
        modulo_id: this.moduloActivoId
      }

      if (indice !== -1) {
        this.configuraciones[indice] = objetoConfiguracion
      } else {
        this.configuraciones.push(objetoConfiguracion)
      }

      this.encolarAccionOffline('GUARDAR_CONFIGURACION_INDICADORES', objetoConfiguracion)
      this.guardarEnAlmacenamientoLocal()
    },

    // Guardar control diario de clases
    registrarControlDiario(datos: { fecha: string; temas_dados: string; descripcion_clase: string; tarea_asignada: string }) {
      const nuevoControl: ControlDiario = {
        id: `cd-${Date.now()}`,
        seccion_id: this.seccionActivaId,
        fecha: datos.fecha,
        temas_dados: datos.temas_dados,
        descripcion_clase: datos.descripcion_clase,
        tarea_asignada: datos.tarea_asignada,
        docente_id: this.usuarioActual?.id || 'docente'
      }

      this.controlesDiarios.unshift(nuevoControl)
      this.encolarAccionOffline('GUARDAR_CONTROL_DIARIO', nuevoControl)
      this.guardarEnAlmacenamientoLocal()
    },

    // Guardar evento de calendario
    registrarEventoCalendario(evento: Omit<EventoCalendario, 'id' | 'creado_por_usuario_id'>) {
      const nuevoEvento: EventoCalendario = {
        ...evento,
        id: `eve-${Date.now()}`,
        creado_por_usuario_id: this.usuarioActual?.id || 'anon'
      }

      this.eventosCalendario.push(nuevoEvento)
      this.encolarAccionOffline('GUARDAR_EVENTO_CALENDARIO', nuevoEvento)
      this.guardarEnAlmacenamientoLocal()
    },

    // Gestion de cola Offline y persistencia local
    encolarAccionOffline(tipo: AccionOffline['tipo'], datos: any) {
      const accion: AccionOffline = {
        id: `acc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        tipo,
        datos,
        marca_temporal: Date.now(),
        intentos: 0
      }
      this.colaSincronizacion.push(accion)

      // Si hay conexion activa, sincronizar en el acto
      if (this.estaEnLinea && !this.sincronizando) {
        this.procesarColaSincronizacion()
      }
    },

    async procesarColaSincronizacion() {
      if (this.colaSincronizacion.length === 0 || this.sincronizando) return
      this.sincronizando = true
      this.ultimoErrorSincronizacion = null

      try {
        const respuesta = await $fetch('/api/sincronizar', {
          method: 'POST',
          body: {
            usuario: this.usuarioActual,
            acciones: this.colaSincronizacion
          }
        })

        if (respuesta && respuesta.exito) {
          this.colaSincronizacion = []
          this.guardarEnAlmacenamientoLocal()
        }
      } catch (error: any) {
        this.ultimoErrorSincronizacion = error?.data?.message || error?.message || 'Error al conectar con el servidor local'
        console.warn('Sincronizacion pendiente para proximo intento:', this.ultimoErrorSincronizacion)
      } finally {
        this.sincronizando = false
      }
    },

    // Carga inicial y persistencia
    guardarEnAlmacenamientoLocal() {
      if (typeof window === 'undefined') return
      try {
        const datosLocales = {
          usuarioActualId: this.usuarioActual?.id,
          seccionActivaId: this.seccionActivaId,
          moduloActivoId: this.moduloActivoId,
          incidencias: this.incidencias,
          configuraciones: this.configuraciones,
          notas: this.notas,
          controlesDiarios: this.controlesDiarios,
          eventosCalendario: this.eventosCalendario,
          colaSincronizacion: this.colaSincronizacion
        }
        localStorage.setItem('SISTEMA_ACADEMICO_DATOS', JSON.stringify(datosLocales))
      } catch (e) {
        console.error('Error al guardar en almacenamiento local:', e)
      }
    },

    async inicializarSistema() {
      if (typeof window !== 'undefined') {
        this.estaEnLinea = navigator.onLine
        window.addEventListener('online', () => {
          this.estaEnLinea = true
          this.procesarColaSincronizacion()
        })
        window.addEventListener('offline', () => {
          this.estaEnLinea = false
        })

        // 1. Cargar desde cache local primero (Offline-First)
        const cache = localStorage.getItem('SISTEMA_ACADEMICO_DATOS')
        if (cache) {
          try {
            const parsed = JSON.parse(cache)
            if (parsed.incidencias) this.incidencias = parsed.incidencias
            if (parsed.configuraciones) this.configuraciones = parsed.configuraciones
            if (parsed.notas) this.notas = parsed.notas
            if (parsed.controlesDiarios) this.controlesDiarios = parsed.controlesDiarios
            if (parsed.eventosCalendario) this.eventosCalendario = parsed.eventosCalendario
            if (parsed.colaSincronizacion) this.colaSincronizacion = parsed.colaSincronizacion
            if (parsed.seccionActivaId) this.seccionActivaId = parsed.seccionActivaId
            if (parsed.moduloActivoId) this.moduloActivoId = parsed.moduloActivoId
          } catch (e) {
            console.error('Error al parsear cache local:', e)
          }
        }
      }

      // 2. Traer datos frescos del servidor
      try {
        const respuesta = await $fetch('/api/datos')
        if (respuesta && respuesta.datos) {
          const d = respuesta.datos
          this.usuarios = d.usuarios || []
          this.secciones = d.secciones || []
          this.modulos = d.modulos || []
          this.estudiantes = d.estudiantes || []

          // Si no hay cambios locales pendientes, tomar del servidor
          if (this.colaSincronizacion.length === 0) {
            this.incidencias = d.incidencias || []
            this.configuraciones = d.configuraciones || []
            this.notas = d.notas || []
            this.controlesDiarios = d.controles_diarios || []
            this.eventosCalendario = d.eventos_calendario || []
          }

          // Establecer selecciones por defecto
          if (!this.usuarioActual && this.usuarios.length > 0) {
            this.usuarioActual = this.usuarios[0] // Docente por defecto
          }
          if (!this.seccionActivaId && this.secciones.length > 0) {
            this.seccionActivaId = this.secciones[1].id // 3er Año A
          }
          if (!this.moduloActivoId && this.modulos.length > 0) {
            this.moduloActivoId = this.modulos[0].id // Modulo 1
          }

          this.guardarEnAlmacenamientoLocal()
        }
      } catch (err) {
        console.warn('Trabajando en modo Offline:', err)
      }
    },

    cambiarUsuario(idUsuario: string) {
      const u = this.usuarios.find(user => user.id === idUsuario)
      if (u) {
        this.usuarioActual = u
        this.guardarEnAlmacenamientoLocal()
      }
    },

    cambiarSeccion(idSeccion: string) {
      this.seccionActivaId = idSeccion
      this.indiceEstudianteTranscripcion = 0
      this.guardarEnAlmacenamientoLocal()
    },

    cambiarModulo(idModulo: string) {
      this.moduloActivoId = idModulo
      this.guardarEnAlmacenamientoLocal()
    }
  }
})
