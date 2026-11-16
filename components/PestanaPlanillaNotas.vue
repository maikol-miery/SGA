<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useEscuelaStore } from '~/stores/useEscuelaStore'
import { 
  Keyboard, 
  Settings2, 
  Copy, 
  Check, 
  Lock, 
  AlertTriangle, 
  ChevronUp, 
  ChevronDown, 
  Save, 
  Sparkles,
  Info,
  Download,
  FileSpreadsheet,
  FileText
} from 'lucide-vue-next'
import { 
  exportarModuloExcel, 
  exportarModuloPDF, 
  exportarLapsoExcel, 
  exportarLapsoPDF,
  type FilaNotaEstudianteExportacion,
  type FilaResumenLapsoExportacion
} from '~/utils/exportaciones'

const tienda = useEscuelaStore()

// Estados para configuración de leyenda / indicadores
const mostrarConfigurador = ref(false)
const formularioConfiguracion = ref({ ...tienda.configuracionSeccionModulo })

// Estado de copia al portapapeles
const idEstudianteCopiado = ref<string | null>(null)

// Sincronizar configurador al cambiar sección o módulo
const cargarConfiguracionActual = () => {
  formularioConfiguracion.value = { ...tienda.configuracionSeccionModulo }
}

const sumaPonderacionFormulario = computed(() => {
  const f = formularioConfiguracion.value
  return (
    Number(f.indicador_a_maximo || 0) +
    Number(f.indicador_b_maximo || 0) +
    Number(f.indicador_c_maximo || 0) +
    Number(f.indicador_d_maximo || 0) +
    Number(f.indicador_e_maximo || 0) +
    4.0
  )
})

const esSumaFormularioValida = computed(() => {
  return Math.abs(sumaPonderacionFormulario.value - 20.0) < 0.01
})

const guardarLeyendaIndicadores = () => {
  if (!esSumaFormularioValida.value) {
    alert(`La suma total debe ser exactamente 20 puntos. Actualmente suma: ${sumaPonderacionFormulario.value.toFixed(1)} pts`)
    return
  }
  tienda.guardarConfiguracionIndicadores(formularioConfiguracion.value)
  mostrarConfigurador.value = false
}

// Modo Transcripcion Rapida
const estudianteActivoTranscripcion = computed(() => {
  const lista = tienda.estudiantesSeccionActual
  if (lista.length === 0) return null
  return lista[tienda.indiceEstudianteTranscripcion] || lista[0]
})

const avanzarEstudiante = () => {
  if (tienda.indiceEstudianteTranscripcion < tienda.estudiantesSeccionActual.length - 1) {
    tienda.indiceEstudianteTranscripcion++
  }
}

const retrocederEstudiante = () => {
  if (tienda.indiceEstudianteTranscripcion > 0) {
    tienda.indiceEstudianteTranscripcion--
  }
}

const copiarObservacionPortapapeles = async (estudianteId: string, texto: string) => {
  try {
    await navigator.clipboard.writeText(texto)
    idEstudianteCopiado.value = estudianteId
    setTimeout(() => {
      idEstudianteCopiado.value = null
    }, 2000)
  } catch (err) {
    console.error('Error al copiar:', err)
  }
}

// Exportación a Excel y PDF
const expandirMenuExportar = ref(false)

const obtenerFilasModuloExportacion = (): FilaNotaEstudianteExportacion[] => {
  return tienda.estudiantesSeccionActual.map(est => {
    const nota = tienda.obtenerNotaEstudiante(est.id)
    const convivir = tienda.obtenerEstadoConvivirEstudiante(est.id)
    const def = tienda.calcularDefinitivaEstudiante(est.id)
    return {
      numero_lista: est.numero_lista,
      cedula: est.cedula,
      nombre_completo: `${est.apellidos}, ${est.nombres}`,
      nota_a: nota.nota_a,
      nota_b: nota.nota_b,
      nota_c: nota.nota_c,
      nota_d: nota.nota_d,
      nota_e: nota.nota_e,
      convivir: convivir.total_convivir,
      definitiva: def,
      observacion: convivir.observacion_generada
    }
  })
}

const obtenerFilasLapsoExportacion = (lapsoNum: number): FilaResumenLapsoExportacion[] => {
  return tienda.estudiantesSeccionActual.map(est => {
    const res = tienda.calcularDefinitivaLapsoEstudiante(est.id, lapsoNum)
    return {
      numero_lista: est.numero_lista,
      cedula: est.cedula,
      nombre_completo: `${est.apellidos}, ${est.nombres}`,
      notas_modulos: res.modulos_detalle,
      definitiva_lapso: res.definitiva_lapso,
      estado_aprobacion: res.definitiva_lapso >= 10 ? 'Aprobado' : 'Reprobado'
    }
  })
}

const exportarModuloActualExcel = () => {
  if (!tienda.seccionActual || !tienda.moduloActual) return
  exportarModuloExcel(
    tienda.seccionActual,
    tienda.moduloActual,
    tienda.configuracionSeccionModulo,
    obtenerFilasModuloExportacion()
  )
  expandirMenuExportar.value = false
}

const exportarModuloActualPDF = () => {
  if (!tienda.seccionActual || !tienda.moduloActual) return
  exportarModuloPDF(
    tienda.seccionActual,
    tienda.moduloActual,
    tienda.configuracionSeccionModulo,
    obtenerFilasModuloExportacion()
  )
  expandirMenuExportar.value = false
}

const exportarLapsoActualExcel = () => {
  if (!tienda.seccionActual || !tienda.moduloActual) return
  const lapsoNum = tienda.moduloActual.lapso
  exportarLapsoExcel(
    tienda.seccionActual,
    lapsoNum,
    tienda.modulosLapsoActivo,
    obtenerFilasLapsoExportacion(lapsoNum)
  )
  expandirMenuExportar.value = false
}

const exportarLapsoActualPDF = () => {
  if (!tienda.seccionActual || !tienda.moduloActual) return
  const lapsoNum = tienda.moduloActual.lapso
  exportarLapsoPDF(
    tienda.seccionActual,
    lapsoNum,
    tienda.modulosLapsoActivo,
    obtenerFilasLapsoExportacion(lapsoNum)
  )
  expandirMenuExportar.value = false
}

// Navegacion con teclado para el Modo Transcripcion
const manejarTeclas = (evento: KeyboardEvent) => {
  if (!tienda.modoTranscripcion) return
  if (evento.key === 'ArrowDown' || (evento.key === 'Enter' && !evento.shiftKey)) {
    avanzarEstudiante()
  } else if (evento.key === 'ArrowUp') {
    retrocederEstudiante()
  }
}

onMounted(() => {
  window.addEventListener('keydown', manejarTeclas)
})

onUnmounted(() => {
  window.removeEventListener('keydown', manejarTeclas)
})
</script>

<template>
  <div class="space-y-6">
    <!-- Barra Superior de Acciones de la Planilla -->
    <div class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-slate-900 leading-tight">Planilla de Calificaciones (Escala 1 al 20)</h2>
        <p class="text-xs sm:text-sm text-slate-500">
          Columnas A - E (indicadores configurables) + Columna F (Convivir fijo 4 pts) = 20 pts.
        </p>
      </div>

      <div class="flex items-center gap-2.5 flex-wrap">
        <!-- Indicador de Ponderación Actual -->
        <div 
          class="px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border"
          :class="tienda.esSumaPonderacionValida ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-red-50 text-red-800 border-red-300 animate-pulse'"
        >
          <component :is="tienda.esSumaPonderacionValida ? Check : AlertTriangle" class="w-4 h-4" />
          <span>Suma: {{ tienda.sumaPonderacionActual.toFixed(1) }} / 20.0 pts</span>
        </div>

        <!-- Botón Configurar Leyenda de Indicadores -->
        <button
          @click="mostrarConfigurador = !mostrarConfigurador; cargarConfiguracionActual()"
          class="px-3 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
        >
          <Settings2 class="w-4 h-4 text-slate-500" />
          <span>Leyenda de Indicadores</span>
        </button>

        <!-- Menú Desplegable Exportar PDF y Excel -->
        <div class="relative">
          <button
            @click="expandirMenuExportar = !expandirMenuExportar"
            class="px-3 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1.5 transition shadow-2xs"
          >
            <Download class="w-4 h-4 text-emerald-700" />
            <span>Exportar Calificaciones</span>
            <ChevronDown class="w-3.5 h-3.5 text-emerald-700" />
          </button>

          <!-- Dropdown Opciones de Exportación -->
          <div 
            v-if="expandirMenuExportar"
            class="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95"
          >
            <div class="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
              Exportar Módulo Actual
            </div>
            <button
              @click="exportarModuloActualExcel"
              class="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-slate-50 text-slate-700 font-semibold"
            >
              <FileSpreadsheet class="w-4 h-4 text-emerald-600" />
              <span>Módulo Actual en Excel (.xlsx)</span>
            </button>
            <button
              @click="exportarModuloActualPDF"
              class="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-slate-50 text-slate-700 font-semibold"
            >
              <FileText class="w-4 h-4 text-red-600" />
              <span>Planilla Módulo Actual en PDF</span>
            </button>

            <div class="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-y border-slate-100 mt-1">
              Exportar Lapso Consolidado (Lapso {{ tienda.moduloActual?.lapso }})
            </div>
            <button
              @click="exportarLapsoActualExcel"
              class="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-slate-50 text-slate-700 font-semibold"
            >
              <FileSpreadsheet class="w-4 h-4 text-emerald-600" />
              <span>Lapso Completo en Excel (.xlsx)</span>
            </button>
            <button
              @click="exportarLapsoActualPDF"
              class="w-full text-left px-3 py-2 text-xs flex items-center gap-2 hover:bg-slate-50 text-slate-700 font-semibold"
            >
              <FileText class="w-4 h-4 text-red-600" />
              <span>Resumen Lapso Completo en PDF</span>
            </button>
          </div>
        </div>

        <!-- Botón Activar Modo Transcripción -->
        <button
          @click="tienda.modoTranscripcion = !tienda.modoTranscripcion"
          class="px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shadow-xs"
          :class="tienda.modoTranscripcion 
            ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-amber-500/20' 
            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-500/20'"
        >
          <Keyboard class="w-4 h-4" />
          <span>{{ tienda.modoTranscripcion ? 'Cerrar Transcripción' : 'Modo Transcripción Rápida' }}</span>
        </button>
      </div>
    </div>

    <!-- Panel de Configuración de la Leyenda de Indicadores (Modal / Acordeón) -->
    <div 
      v-if="mostrarConfigurador" 
      class="bg-white rounded-2xl p-5 border border-blue-200 ring-2 ring-blue-500/20 shadow-md animate-in fade-in"
    >
      <div class="flex items-center justify-between pb-3 border-b border-slate-100">
        <div class="flex items-center gap-2">
          <Settings2 class="w-5 h-5 text-blue-600" />
          <h3 class="font-bold text-slate-900 text-sm">Ponderación y Leyenda de Indicadores (A - E)</h3>
        </div>
        <span 
          class="text-xs font-bold px-2 py-0.5 rounded"
          :class="esSumaFormularioValida ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'"
        >
          Total: {{ sumaPonderacionFormulario.toFixed(1) }} / 20.0 pts
        </span>
      </div>

      <!-- Formulario Grid con las 5 Letras -->
      <div class="grid grid-cols-1 md:grid-cols-5 gap-3 mt-4">
        <!-- Indicador A -->
        <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-bold text-blue-700 text-xs">Indicador A</span>
            <input 
              v-model.number="formularioConfiguracion.indicador_a_maximo"
              type="number" step="0.5" min="0" max="20"
              class="w-16 p-1 text-center font-bold text-xs bg-white border border-slate-300 rounded"
            />
          </div>
          <input 
            v-model="formularioConfiguracion.indicador_a_nombre"
            type="text" placeholder="Ej: Prueba Parcial"
            class="w-full p-1.5 text-xs bg-white border border-slate-300 rounded"
          />
        </div>

        <!-- Indicador B -->
        <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-bold text-blue-700 text-xs">Indicador B</span>
            <input 
              v-model.number="formularioConfiguracion.indicador_b_maximo"
              type="number" step="0.5" min="0" max="20"
              class="w-16 p-1 text-center font-bold text-xs bg-white border border-slate-300 rounded"
            />
          </div>
          <input 
            v-model="formularioConfiguracion.indicador_b_nombre"
            type="text" placeholder="Ej: Taller en Clase"
            class="w-full p-1.5 text-xs bg-white border border-slate-300 rounded"
          />
        </div>

        <!-- Indicador C -->
        <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-bold text-blue-700 text-xs">Indicador C</span>
            <input 
              v-model.number="formularioConfiguracion.indicador_c_maximo"
              type="number" step="0.5" min="0" max="20"
              class="w-16 p-1 text-center font-bold text-xs bg-white border border-slate-300 rounded"
            />
          </div>
          <input 
            v-model="formularioConfiguracion.indicador_c_nombre"
            type="text" placeholder="Ej: Exposición"
            class="w-full p-1.5 text-xs bg-white border border-slate-300 rounded"
          />
        </div>

        <!-- Indicador D -->
        <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-bold text-blue-700 text-xs">Indicador D</span>
            <input 
              v-model.number="formularioConfiguracion.indicador_d_maximo"
              type="number" step="0.5" min="0" max="20"
              class="w-16 p-1 text-center font-bold text-xs bg-white border border-slate-300 rounded"
            />
          </div>
          <input 
            v-model="formularioConfiguracion.indicador_d_nombre"
            type="text" placeholder="Ej: Guía de Ejercicios"
            class="w-full p-1.5 text-xs bg-white border border-slate-300 rounded"
          />
        </div>

        <!-- Indicador E -->
        <div class="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div class="flex items-center justify-between">
            <span class="font-bold text-blue-700 text-xs">Indicador E</span>
            <input 
              v-model.number="formularioConfiguracion.indicador_e_maximo"
              type="number" step="0.5" min="0" max="20"
              class="w-16 p-1 text-center font-bold text-xs bg-white border border-slate-300 rounded"
            />
          </div>
          <input 
            v-model="formularioConfiguracion.indicador_e_nombre"
            type="text" placeholder="Ej: Portafolio / Cuaderno"
            class="w-full p-1.5 text-xs bg-white border border-slate-300 rounded"
          />
        </div>
      </div>

      <!-- Apartado Fijo F: Convivir -->
      <div class="mt-4 p-3 rounded-xl bg-blue-50/50 border border-blue-200 flex items-center justify-between text-xs">
        <div class="flex items-center gap-2">
          <Lock class="w-4 h-4 text-blue-700" />
          <span class="font-bold text-blue-900">Indicador F (Fijo): Convivir</span>
          <span class="text-slate-500">— 4.0 Puntos Institucionales Fijos (Presentación y Conducta)</span>
        </div>
        <span class="font-extrabold text-blue-800 text-sm">4.0 pts</span>
      </div>

      <div class="flex items-center justify-end gap-2 mt-4">
        <button 
          @click="mostrarConfigurador = false"
          class="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
        >
          Cancelar
        </button>
        <button 
          @click="guardarLeyendaIndicadores"
          :disabled="!esSumaFormularioValida"
          class="px-4 py-1.5 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          <Save class="w-3.5 h-3.5" />
          Guardar Ponderación
        </button>
      </div>
    </div>

    <!-- MODO TRANSCRIPCIÓN RÁPIDA (VISTA COMPACTA DE ALTO CONTRASTE PARA CARGA AL PORTAL WEB) -->
    <div 
      v-if="tienda.modoTranscripcion && estudianteActivoTranscripcion" 
      class="bg-slate-900 text-white rounded-2xl p-5 border-2 border-amber-500 shadow-2xl space-y-4 animate-in zoom-in-98"
    >
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div class="flex items-center gap-2">
          <div class="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider">
            Modo Transcripción Activo
          </div>
          <span class="text-xs text-slate-400 font-mono">
            Usa las flechas [↑] [↓] o [Enter] para navegar entre estudiantes
          </span>
        </div>
        <div class="flex items-center gap-1">
          <button 
            @click="retrocederEstudiante"
            :disabled="tienda.indiceEstudianteTranscripcion === 0"
            class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30"
          >
            <ChevronUp class="w-4 h-4" />
          </button>
          <span class="text-xs font-mono font-bold px-2">
            {{ tienda.indiceEstudianteTranscripcion + 1 }} / {{ tienda.estudiantesSeccionActual.length }}
          </span>
          <button 
            @click="avanzarEstudiante"
            :disabled="tienda.indiceEstudianteTranscripcion === tienda.estudiantesSeccionActual.length - 1"
            class="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-30"
          >
            <ChevronDown class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- Ficha de Datos del Estudiante Seleccionado -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 items-center bg-slate-800/80 p-4 rounded-xl border border-slate-700">
        <div>
          <span class="text-[10px] uppercase font-bold text-amber-400 tracking-wider">Estudiante Actual</span>
          <div class="text-lg font-bold text-white leading-tight">
            #{{ estudianteActivoTranscripcion.numero_lista }} - {{ estudianteActivoTranscripcion.apellidos }}, {{ estudianteActivoTranscripcion.nombres }}
          </div>
          <span class="text-xs text-slate-400 font-mono">Cédula: {{ estudianteActivoTranscripcion.cedula }}</span>
        </div>

        <!-- Celdas de Calificaciones en Alto Contraste -->
        <div class="flex items-center justify-center gap-2 flex-wrap">
          <div class="text-center px-2 py-1 bg-slate-900 rounded-lg border border-slate-700">
            <span class="text-[9px] text-slate-400 block font-bold">A</span>
            <span class="text-sm font-black text-amber-300">{{ tienda.obtenerNotaEstudiante(estudianteActivoTranscripcion.id).nota_a }}</span>
          </div>
          <div class="text-center px-2 py-1 bg-slate-900 rounded-lg border border-slate-700">
            <span class="text-[9px] text-slate-400 block font-bold">B</span>
            <span class="text-sm font-black text-amber-300">{{ tienda.obtenerNotaEstudiante(estudianteActivoTranscripcion.id).nota_b }}</span>
          </div>
          <div class="text-center px-2 py-1 bg-slate-900 rounded-lg border border-slate-700">
            <span class="text-[9px] text-slate-400 block font-bold">C</span>
            <span class="text-sm font-black text-amber-300">{{ tienda.obtenerNotaEstudiante(estudianteActivoTranscripcion.id).nota_c }}</span>
          </div>
          <div class="text-center px-2 py-1 bg-slate-900 rounded-lg border border-slate-700">
            <span class="text-[9px] text-slate-400 block font-bold">D</span>
            <span class="text-sm font-black text-amber-300">{{ tienda.obtenerNotaEstudiante(estudianteActivoTranscripcion.id).nota_d }}</span>
          </div>
          <div class="text-center px-2 py-1 bg-slate-900 rounded-lg border border-slate-700">
            <span class="text-[9px] text-slate-400 block font-bold">E</span>
            <span class="text-sm font-black text-amber-300">{{ tienda.obtenerNotaEstudiante(estudianteActivoTranscripcion.id).nota_e }}</span>
          </div>
          <div class="text-center px-2 py-1 bg-blue-950 rounded-lg border border-blue-700">
            <span class="text-[9px] text-blue-300 block font-bold">F (Convivir)</span>
            <span class="text-sm font-black text-cyan-300">
              {{ tienda.obtenerEstadoConvivirEstudiante(estudianteActivoTranscripcion.id).total_convivir.toFixed(1) }}
            </span>
          </div>
        </div>

        <!-- Definitiva Final -->
        <div class="text-right">
          <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Definitiva (1 al 20)</span>
          <div class="text-3xl font-black text-emerald-400">
            {{ tienda.calcularDefinitivaEstudiante(estudianteActivoTranscripcion.id).toFixed(1) }}
          </div>
        </div>
      </div>

      <!-- Observación con Botón de Copiar al Portapapeles en 1 Clic -->
      <div class="p-3 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-between gap-3">
        <div class="text-xs">
          <span class="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">Observación para el Sistema Web:</span>
          <p class="text-slate-200 italic mt-0.5 font-mono text-[11px]">
            {{ tienda.obtenerEstadoConvivirEstudiante(estudianteActivoTranscripcion.id).observacion_generada }}
          </p>
        </div>
        <button
          @click="copiarObservacionPortapapeles(estudianteActivoTranscripcion.id, tienda.obtenerEstadoConvivirEstudiante(estudianteActivoTranscripcion.id).observacion_generada)"
          class="shrink-0 px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
          :class="idEstudianteCopiado === estudianteActivoTranscripcion.id ? 'bg-emerald-600 text-white' : 'bg-slate-700 hover:bg-slate-600 text-slate-100'"
        >
          <component :is="idEstudianteCopiado === estudianteActivoTranscripcion.id ? Check : Copy" class="w-4 h-4" />
          <span>{{ idEstudianteCopiado === estudianteActivoTranscripcion.id ? '¡Copiado!' : 'Copiar Observación' }}</span>
        </button>
      </div>
    </div>

    <!-- TABLA MATRICIAL TIPO HOJA DE CÁLCULO (EXCEL / DESKTOP SPREADSHEET) -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-200 text-slate-600">
              <th class="py-3 px-3 font-bold w-12 text-center">Nº</th>
              <th class="py-3 px-4 font-bold min-w-[200px]">Apellidos y Nombres</th>
              <th class="py-3 px-2 font-bold text-center w-20">
                <div>A</div>
                <div class="text-[10px] text-slate-400 font-normal">({{ tienda.configuracionSeccionModulo.indicador_a_maximo }} pts)</div>
              </th>
              <th class="py-3 px-2 font-bold text-center w-20">
                <div>B</div>
                <div class="text-[10px] text-slate-400 font-normal">({{ tienda.configuracionSeccionModulo.indicador_b_maximo }} pts)</div>
              </th>
              <th class="py-3 px-2 font-bold text-center w-20">
                <div>C</div>
                <div class="text-[10px] text-slate-400 font-normal">({{ tienda.configuracionSeccionModulo.indicador_c_maximo }} pts)</div>
              </th>
              <th class="py-3 px-2 font-bold text-center w-20">
                <div>D</div>
                <div class="text-[10px] text-slate-400 font-normal">({{ tienda.configuracionSeccionModulo.indicador_d_maximo }} pts)</div>
              </th>
              <th class="py-3 px-2 font-bold text-center w-20">
                <div>E</div>
                <div class="text-[10px] text-slate-400 font-normal">({{ tienda.configuracionSeccionModulo.indicador_e_maximo }} pts)</div>
              </th>
              <th class="py-3 px-2 font-bold text-center w-24 bg-blue-50/70 text-blue-900 border-x border-blue-100">
                <div class="flex items-center justify-center gap-1">
                  <Lock class="w-3 h-3 text-blue-600" />
                  <span>F (Convivir)</span>
                </div>
                <div class="text-[10px] text-blue-600 font-normal">(4.0 pts)</div>
              </th>
              <th class="py-3 px-3 font-bold text-center w-24 bg-slate-100 text-slate-900">
                <div>Definitiva</div>
                <div class="text-[10px] text-slate-500 font-normal">(1 - 20)</div>
              </th>
              <th class="py-3 px-4 font-bold min-w-[260px]">Observación Autogenerada</th>
            </tr>
          </thead>

          <tbody class="divide-y divide-slate-100">
            <tr 
              v-for="(estudiante, idx) in tienda.estudiantesSeccionActual" 
              :key="estudiante.id"
              class="hover:bg-slate-50/80 transition"
              :class="tienda.modoTranscripcion && tienda.indiceEstudianteTranscripcion === idx ? 'bg-amber-50 ring-2 ring-amber-400' : ''"
              @click="tienda.indiceEstudianteTranscripcion = idx"
            >
              <!-- Numero de Lista -->
              <td class="py-2 px-3 text-center font-bold text-slate-500">
                {{ estudiante.numero_lista }}
              </td>

              <!-- Nombre y Cedula -->
              <td class="py-2 px-4">
                <div class="font-bold text-slate-800">{{ estudiante.apellidos }}, {{ estudiante.nombres }}</div>
                <div class="text-[10px] text-slate-400 font-mono">{{ estudiante.cedula }}</div>
              </td>

              <!-- Input Nota A -->
              <td class="p-1 text-center">
                <input 
                  type="number" step="0.25" min="0" :max="tienda.configuracionSeccionModulo.indicador_a_maximo"
                  :value="tienda.obtenerNotaEstudiante(estudiante.id).nota_a"
                  @change="tienda.actualizarNotaEstudiante(estudiante.id, 'nota_a', ($event.target as HTMLInputElement).valueAsNumber)"
                  class="w-16 p-1.5 text-center font-semibold border rounded border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </td>

              <!-- Input Nota B -->
              <td class="p-1 text-center">
                <input 
                  type="number" step="0.25" min="0" :max="tienda.configuracionSeccionModulo.indicador_b_maximo"
                  :value="tienda.obtenerNotaEstudiante(estudiante.id).nota_b"
                  @change="tienda.actualizarNotaEstudiante(estudiante.id, 'nota_b', ($event.target as HTMLInputElement).valueAsNumber)"
                  class="w-16 p-1.5 text-center font-semibold border rounded border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </td>

              <!-- Input Nota C -->
              <td class="p-1 text-center">
                <input 
                  type="number" step="0.25" min="0" :max="tienda.configuracionSeccionModulo.indicador_c_maximo"
                  :value="tienda.obtenerNotaEstudiante(estudiante.id).nota_c"
                  @change="tienda.actualizarNotaEstudiante(estudiante.id, 'nota_c', ($event.target as HTMLInputElement).valueAsNumber)"
                  class="w-16 p-1.5 text-center font-semibold border rounded border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </td>

              <!-- Input Nota D -->
              <td class="p-1 text-center">
                <input 
                  type="number" step="0.25" min="0" :max="tienda.configuracionSeccionModulo.indicador_d_maximo"
                  :value="tienda.obtenerNotaEstudiante(estudiante.id).nota_d"
                  @change="tienda.actualizarNotaEstudiante(estudiante.id, 'nota_d', ($event.target as HTMLInputElement).valueAsNumber)"
                  class="w-16 p-1.5 text-center font-semibold border rounded border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </td>

              <!-- Input Nota E -->
              <td class="p-1 text-center">
                <input 
                  type="number" step="0.25" min="0" :max="tienda.configuracionSeccionModulo.indicador_e_maximo"
                  :value="tienda.obtenerNotaEstudiante(estudiante.id).nota_e"
                  @change="tienda.actualizarNotaEstudiante(estudiante.id, 'nota_e', ($event.target as HTMLInputElement).valueAsNumber)"
                  class="w-16 p-1.5 text-center font-semibold border rounded border-slate-200 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </td>

              <!-- Columna F (Convivir = 4 pts Fijos reactivos, con candado si falta grave) -->
              <td class="py-2 px-2 text-center bg-blue-50/40 border-x border-blue-100 font-bold">
                <span 
                  v-if="tienda.obtenerEstadoConvivirEstudiante(estudiante.id).es_falta_muy_grave"
                  class="inline-flex items-center gap-1 text-red-600 font-extrabold"
                  title="Bloqueado por Falta Muy Grave aplicada por Coordinación"
                >
                  <Lock class="w-3.5 h-3.5" /> 0.0
                </span>
                <span 
                  v-else
                  :class="tienda.obtenerEstadoConvivirEstudiante(estudiante.id).total_convivir < 3.0 ? 'text-amber-700' : 'text-blue-900'"
                >
                  {{ tienda.obtenerEstadoConvivirEstudiante(estudiante.id).total_convivir.toFixed(1) }}
                </span>
              </td>

              <!-- Columna Sumatoria Total / Definitiva -->
              <td class="py-2 px-3 text-center bg-slate-50 font-black text-sm">
                <span 
                  :class="[
                    tienda.calcularDefinitivaEstudiante(estudiante.id) < 10 ? 'text-red-600' :
                    tienda.calcularDefinitivaEstudiante(estudiante.id) < 14 ? 'text-amber-600' : 'text-emerald-700'
                  ]"
                >
                  {{ tienda.calcularDefinitivaEstudiante(estudiante.id).toFixed(1) }}
                </span>
              </td>

              <!-- Observacion Convivir + Boton de Copia -->
              <td class="py-2 px-4">
                <div class="flex items-center justify-between gap-2">
                  <span class="text-[11px] text-slate-600 italic line-clamp-1">
                    {{ tienda.obtenerEstadoConvivirEstudiante(estudiante.id).observacion_generada }}
                  </span>
                  <button
                    @click.stop="copiarObservacionPortapapeles(estudiante.id, tienda.obtenerEstadoConvivirEstudiante(estudiante.id).observacion_generada)"
                    class="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition shrink-0"
                    title="Copiar observación"
                  >
                    <component :is="idEstudianteCopiado === estudiante.id ? Check : Copy" class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Leyenda Informativa en la Parte Inferior -->
    <div class="bg-white rounded-2xl p-4 border border-slate-200 text-xs text-slate-600 space-y-2">
      <div class="flex items-center gap-1.5 font-bold text-slate-800">
        <Info class="w-4 h-4 text-blue-600" />
        <span>Detalle de la Leyenda Actual (Sección: {{ tienda.seccionActual?.nombre }} - Módulo: {{ tienda.moduloActual?.nombre }}):</span>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 text-[11px]">
        <div class="p-2 rounded-lg bg-slate-50 border border-slate-100">
          <span class="font-bold text-slate-800 block">Indicador A ({{ tienda.configuracionSeccionModulo.indicador_a_maximo }} pts):</span>
          {{ tienda.configuracionSeccionModulo.indicador_a_nombre }}
        </div>
        <div class="p-2 rounded-lg bg-slate-50 border border-slate-100">
          <span class="font-bold text-slate-800 block">Indicador B ({{ tienda.configuracionSeccionModulo.indicador_b_maximo }} pts):</span>
          {{ tienda.configuracionSeccionModulo.indicador_b_nombre }}
        </div>
        <div class="p-2 rounded-lg bg-slate-50 border border-slate-100">
          <span class="font-bold text-slate-800 block">Indicador C ({{ tienda.configuracionSeccionModulo.indicador_c_maximo }} pts):</span>
          {{ tienda.configuracionSeccionModulo.indicador_c_nombre }}
        </div>
        <div class="p-2 rounded-lg bg-slate-50 border border-slate-100">
          <span class="font-bold text-slate-800 block">Indicador D ({{ tienda.configuracionSeccionModulo.indicador_d_maximo }} pts):</span>
          {{ tienda.configuracionSeccionModulo.indicador_d_nombre }}
        </div>
        <div class="p-2 rounded-lg bg-slate-50 border border-slate-100">
          <span class="font-bold text-slate-800 block">Indicador E ({{ tienda.configuracionSeccionModulo.indicador_e_maximo }} pts):</span>
          {{ tienda.configuracionSeccionModulo.indicador_e_nombre }}
        </div>
        <div class="p-2 rounded-lg bg-blue-50 border border-blue-100 text-blue-900">
          <span class="font-bold block">Indicador F (4.0 pts):</span>
          Convivir Institucional
        </div>
      </div>
    </div>

  </div>
</template>
