<script setup lang="ts">
import { ref } from 'vue'
import { useEscuelaStore } from '~/stores/useEscuelaStore'
import { 
  ShieldAlert, 
  UserCheck, 
  Sparkles, 
  Lock, 
  Trash2, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  PlusCircle, 
  History 
} from 'lucide-vue-next'
import type { TipoApartadoConvivir, Estudiante } from '~/types/sistema'

const tienda = useEscuelaStore()

// Modales y estados locales
const modalMotivoAbierto = ref(false)
const estudianteSeleccionado = ref<Estudiante | null>(null)
const tipoApartadoSeleccionado = ref<TipoApartadoConvivir>('PRESENTACION')
const motivoPersonalizado = ref('')
const estudianteHistorialExpandido = ref<string | null>(null)

// Motivos comunes predefinidos para agilidad táctil en el aula
const motivosPresentacion = [
  'Incumplimiento del uniforme reglamentario',
  'Sin distintivo / insignia institucional',
  'Calzado o medias no permitidas',
  'Corte o peinado fuera de la normativa'
]

const motivosConducta = [
  'Interrupción repetida durante la clase',
  'Uso indebido de teléfono celular',
  'Falta de respeto a compañeros o docente',
  'Impuntualidad o desorden al ingresar al aula'
]

const abrirModalDescuento = (estudiante: Estudiante, tipo: TipoApartadoConvivir) => {
  estudianteSeleccionado.value = estudiante
  tipoApartadoSeleccionado.value = tipo
  motivoPersonalizado.value = ''
  modalMotivoAbierto.value = true
}

const aplicarDescuentoRapido = (motivo: string) => {
  if (!estudianteSeleccionado.value) return
  tienda.registrarDescuentoConvivir(estudianteSeleccionado.value.id, tipoApartadoSeleccionado.value, motivo)
  modalMotivoAbierto.value = false
}

const alternarHistorial = (estudianteId: string) => {
  if (estudianteHistorialExpandido.value === estudianteId) {
    estudianteHistorialExpandido.value = null
  } else {
    estudianteHistorialExpandido.value = estudianteId
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Encabezado con Reglas del Motor de Convivir -->
    <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
      <div>
        <div class="flex items-center gap-2">
          <span class="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
            Base: 4.0 Puntos Fijos por Módulo
          </span>
          <span class="text-xs text-slate-500 font-medium">
            (2.0 pts Presentación + 2.0 pts Conducta)
          </span>
        </div>
        <h2 class="text-xl font-bold text-slate-900 mt-1">Control Disciplinario e Incidencias</h2>
        <p class="text-xs sm:text-sm text-slate-500">
          Los docentes descuentan de a -0.5 pts por falta. Las coordinadoras del nivel pueden aplicar sanción por Falta Muy Grave (bloquea a 0.0 pts).
        </p>
      </div>

      <!-- Banner de Permisos de Coordinación -->
      <div 
        v-if="tienda.puedeAplicarFaltaMuyGrave"
        class="bg-purple-50 border border-purple-200 rounded-xl p-3 flex items-center gap-3 text-xs text-purple-900"
      >
        <ShieldAlert class="w-5 h-5 text-purple-600 shrink-0" />
        <div>
          <span class="font-bold">Modo Supervisión de Coordinación:</span>
          <p>Tienes privilegios para aplicar y levantar sanciones por <strong>Falta Muy Grave</strong> en esta sección.</p>
        </div>
      </div>
      <div 
        v-else-if="tienda.usuarioActual?.rol.startsWith('COORDINADORA')"
        class="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3 text-xs text-amber-900"
      >
        <AlertCircle class="w-5 h-5 text-amber-600 shrink-0" />
        <div>
          <span class="font-bold">Sección fuera de tu nivel:</span>
          <p>Esta sección pertenece a otro departamento. Tus acciones de falta muy grave están limitadas a tu nivel.</p>
        </div>
      </div>
    </div>

    <!-- Lista de Estudiantes en Tarjetas Táctiles Adaptativas -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div 
        v-for="estudiante in tienda.estudiantesSeccionActual" 
        :key="estudiante.id"
        class="bg-white rounded-2xl border transition-all duration-200 shadow-xs flex flex-col justify-between overflow-hidden"
        :class="[
          tienda.obtenerEstadoConvivirEstudiante(estudiante.id).es_falta_muy_grave 
            ? 'border-red-300 bg-red-50/20 ring-1 ring-red-400' 
            : 'border-slate-200 hover:border-blue-300'
        ]"
      >
        <!-- Cabecera de la Tarjeta del Estudiante -->
        <div class="p-4 border-b border-slate-100 flex items-start justify-between">
          <div class="flex items-center gap-3">
            <span class="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
              #{{ estudiante.numero_lista }}
            </span>
            <div>
              <h3 class="font-bold text-slate-900 text-sm leading-tight">
                {{ estudiante.apellidos }}, {{ estudiante.nombres }}
              </h3>
              <span class="text-[11px] text-slate-500 font-mono">C.I. {{ estudiante.cedula }}</span>
            </div>
          </div>

          <!-- Puntos Totales de Convivir -->
          <div class="text-right">
            <div 
              class="text-lg font-black tracking-tight"
              :class="[
                tienda.obtenerEstadoConvivirEstudiante(estudiante.id).es_falta_muy_grave ? 'text-red-600' :
                tienda.obtenerEstadoConvivirEstudiante(estudiante.id).total_convivir < 3.0 ? 'text-amber-600' : 'text-emerald-600'
              ]"
            >
              <span v-if="tienda.obtenerEstadoConvivirEstudiante(estudiante.id).es_falta_muy_grave" class="inline-flex items-center gap-1">
                <Lock class="w-4 h-4" /> 0.0
              </span>
              <span v-else>
                {{ tienda.obtenerEstadoConvivirEstudiante(estudiante.id).total_convivir.toFixed(1) }} <span class="text-xs font-normal text-slate-400">/ 4.0</span>
              </span>
            </div>
            <div class="text-[10px] uppercase font-bold text-slate-400">Puntaje Convivir</div>
          </div>
        </div>

        <!-- Desglose de Puntos Presentación y Conducta -->
        <div class="p-4 space-y-3">
          <div class="grid grid-cols-2 gap-2 text-center text-xs">
            <!-- Apartado Presentacion -->
            <div class="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex flex-col items-center">
              <span class="text-[11px] font-semibold text-slate-500">Presentación</span>
              <span class="text-base font-bold text-slate-800">
                {{ tienda.obtenerEstadoConvivirEstudiante(estudiante.id).puntos_presentacion.toFixed(1) }} <span class="text-[10px] text-slate-400">/ 2.0</span>
              </span>
              <!-- Boton Descuento Presentacion -->
              <button
                @click="abrirModalDescuento(estudiante, 'PRESENTACION')"
                :disabled="tienda.obtenerEstadoConvivirEstudiante(estudiante.id).es_falta_muy_grave || tienda.obtenerEstadoConvivirEstudiante(estudiante.id).puntos_presentacion <= 0"
                class="mt-2 w-full py-1.5 px-2 bg-white text-rose-600 font-bold text-xs rounded-lg border border-rose-200 hover:bg-rose-50 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
              >
                -0.5 Presentación
              </button>
            </div>

            <!-- Apartado Conducta -->
            <div class="bg-slate-50 rounded-xl p-2.5 border border-slate-100 flex flex-col items-center">
              <span class="text-[11px] font-semibold text-slate-500">Conducta</span>
              <span class="text-base font-bold text-slate-800">
                {{ tienda.obtenerEstadoConvivirEstudiante(estudiante.id).puntos_conducta.toFixed(1) }} <span class="text-[10px] text-slate-400">/ 2.0</span>
              </span>
              <!-- Boton Descuento Conducta -->
              <button
                @click="abrirModalDescuento(estudiante, 'CONDUCTA')"
                :disabled="tienda.obtenerEstadoConvivirEstudiante(estudiante.id).es_falta_muy_grave || tienda.obtenerEstadoConvivirEstudiante(estudiante.id).puntos_conducta <= 0"
                class="mt-2 w-full py-1.5 px-2 bg-white text-amber-700 font-bold text-xs rounded-lg border border-amber-200 hover:bg-amber-50 transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
              >
                -0.5 Conducta
              </button>
            </div>
          </div>

          <!-- Switch o Botón Exclusivo para Coordinadoras: Falta Muy Grave -->
          <div 
            v-if="tienda.puedeAplicarFaltaMuyGrave"
            class="pt-2 border-t border-slate-100 flex items-center justify-between"
          >
            <div class="text-xs">
              <span class="font-bold text-purple-900 block">Sanción de Falta Muy Grave</span>
              <span class="text-[10px] text-slate-500">Bloquea Convivir a 0.0 pts</span>
            </div>
            <button
              @click="tienda.alternarFaltaMuyGrave(estudiante.id)"
              class="px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
              :class="tienda.obtenerEstadoConvivirEstudiante(estudiante.id).es_falta_muy_grave 
                ? 'bg-red-600 text-white hover:bg-red-700' 
                : 'bg-purple-100 text-purple-800 hover:bg-purple-200'"
            >
              <Lock v-if="tienda.obtenerEstadoConvivirEstudiante(estudiante.id).es_falta_muy_grave" class="w-3.5 h-3.5" />
              <span>{{ tienda.obtenerEstadoConvivirEstudiante(estudiante.id).es_falta_muy_grave ? 'Levantar Sanción' : 'Aplicar 0.0' }}</span>
            </button>
          </div>

          <!-- Observación Autogenerada para el Reporte y Planilla -->
          <div class="bg-blue-50/60 rounded-xl p-2.5 border border-blue-100 text-xs text-slate-700">
            <div class="flex items-center gap-1 text-[10px] font-bold text-blue-700 uppercase tracking-wide mb-1">
              <Sparkles class="w-3 h-3 text-blue-600" />
              Observación Oficial Autogenerada
            </div>
            <p class="italic text-[11px] leading-relaxed text-slate-600 line-clamp-2">
              "{{ tienda.obtenerEstadoConvivirEstudiante(estudiante.id).observacion_generada }}"
            </p>
          </div>
        </div>

        <!-- Pie de Tarjeta: Historial de Incidencias -->
        <div class="bg-slate-50/70 p-3 border-t border-slate-100">
          <button 
            @click="alternarHistorial(estudiante.id)"
            class="w-full text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center justify-between"
          >
            <span class="flex items-center gap-1.5">
              <History class="w-3.5 h-3.5 text-slate-400" />
              Historial de Incidencias ({{ tienda.obtenerEstadoConvivirEstudiante(estudiante.id).incidencias.length }})
            </span>
            <component 
              :is="estudianteHistorialExpandido === estudiante.id ? ChevronUp : ChevronDown" 
              class="w-3.5 h-3.5 text-slate-400" 
            />
          </button>

          <!-- Listado Desplegado de Incidencias con Boton Eliminar -->
          <div 
            v-if="estudianteHistorialExpandido === estudiante.id"
            class="mt-3 space-y-2 max-h-48 overflow-y-auto pr-1 animate-in fade-in"
          >
            <div 
              v-if="tienda.obtenerEstadoConvivirEstudiante(estudiante.id).incidencias.length === 0"
              class="text-center py-2 text-[11px] text-slate-400 italic"
            >
              Sin incidencias registradas en este módulo.
            </div>

            <div 
              v-for="inc in tienda.obtenerEstadoConvivirEstudiante(estudiante.id).incidencias"
              :key="inc.id"
              class="p-2 rounded-lg bg-white border border-slate-200 text-xs flex items-start justify-between gap-2 shadow-2xs"
            >
              <div>
                <div class="flex items-center gap-1.5">
                  <span 
                    class="px-1.5 py-0.2 rounded text-[9px] font-bold"
                    :class="inc.es_falta_muy_grave ? 'bg-red-100 text-red-800' : inc.tipo_apartado === 'PRESENTACION' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'"
                  >
                    -{{ inc.puntos_descontados.toFixed(1) }} {{ inc.tipo_apartado }}
                  </span>
                  <span class="text-[10px] text-slate-400 font-mono">{{ inc.fecha }}</span>
                </div>
                <p class="text-slate-700 font-medium text-[11px] mt-1">{{ inc.motivo }}</p>
              </div>

              <!-- Boton Eliminar Incidencia -->
              <button 
                @click="tienda.eliminarIncidencia(inc.id)"
                class="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                title="Eliminar incidencia"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Modal Táctil para Descuento de Convivir -->
    <div 
      v-if="modalMotivoAbierto && estudianteSeleccionado"
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
    >
      <div class="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
        <div>
          <span 
            class="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
            :class="tipoApartadoSeleccionado === 'PRESENTACION' ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800'"
          >
            Descuento -0.5 en {{ tipoApartadoSeleccionado }}
          </span>
          <h3 class="text-base font-bold text-slate-900 mt-1">
            {{ estudianteSeleccionado.apellidos }}, {{ estudianteSeleccionado.nombres }}
          </h3>
          <p class="text-xs text-slate-500">Selecciona un motivo común o escribe uno detallado.</p>
        </div>

        <!-- Motivos Comunes con 1 Clic -->
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-slate-700">Motivos frecuentes:</label>
          <div class="grid grid-cols-1 gap-1.5">
            <button
              v-for="motivo in (tipoApartadoSeleccionado === 'PRESENTACION' ? motivosPresentacion : motivosConducta)"
              :key="motivo"
              @click="aplicarDescuentoRapido(motivo)"
              class="text-left text-xs p-2 rounded-lg bg-slate-50 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 transition font-medium"
            >
              • {{ motivo }}
            </button>
          </div>
        </div>

        <!-- Motivo Personalizado -->
        <div class="space-y-1.5">
          <label class="text-xs font-semibold text-slate-700">O redacta un motivo específico:</label>
          <input 
            v-model="motivoPersonalizado"
            type="text"
            placeholder="Ej: Olvidó la bata de laboratorio / juego brusco en clase"
            class="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
            @keyup.enter="aplicarDescuentoRapido(motivoPersonalizado)"
          />
        </div>

        <!-- Botones de Acción del Modal -->
        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button 
            @click="modalMotivoAbierto = false"
            class="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
          >
            Cancelar
          </button>
          <button 
            @click="aplicarDescuentoRapido(motivoPersonalizado)"
            :disabled="!motivoPersonalizado.trim()"
            class="px-4 py-1.5 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
          >
            Aplicar Descuento
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
