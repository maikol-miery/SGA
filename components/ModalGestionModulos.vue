<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEscuelaStore } from '~/stores/useEscuelaStore'
import { 
  CalendarRange, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Percent, 
  Layers, 
  Tag, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-vue-next'
import type { TipoEvaluacionModulo, Modulo } from '~/types/sistema'

const props = defineProps<{
  abierto: boolean
}>()

const emit = defineEmits<{
  (e: 'cerrar'): void
}>()

const tienda = useEscuelaStore()

// Formulario reactivo
const idEditando = ref<string | null>(null)
const lapsoSeleccionado = ref(1)
const numeroModulo = ref(1)
const nombreModulo = ref('')
const tipoEvaluacion = ref<TipoEvaluacionModulo>('REGULAR')
const ponderacionPorcentaje = ref(50)

// Tipos de evaluación disponibles
const tiposEvaluacion: { valor: TipoEvaluacionModulo; etiqueta: string; color: string }[] = [
  { valor: 'REGULAR', etiqueta: 'Evaluación Regular / Ordinaria', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  { valor: 'RECUPERACION', etiqueta: 'Módulo de Recuperación', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  { valor: 'NIVELACION', etiqueta: 'Nivelación Académica', color: 'bg-purple-100 text-purple-800 border-purple-200' },
  { valor: 'PROYECTO', etiqueta: 'Proyecto Socioproductivo / Científico', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' }
]

const limpiarFormulario = () => {
  idEditando.value = null
  const modulosDelLapso = tienda.modulos.filter(m => m.lapso === lapsoSeleccionado.value)
  numeroModulo.value = modulosDelLapso.length + 1
  nombreModulo.value = `Módulo ${numeroModulo.value} - Lapso ${lapsoSeleccionado.value}`
  tipoEvaluacion.value = 'REGULAR'
  ponderacionPorcentaje.value = 50
}

const alCambiarLapso = () => {
  if (!idEditando.value) {
    limpiarFormulario()
  }
}

const iniciarEdicion = (mod: Modulo) => {
  idEditando.value = mod.id
  lapsoSeleccionado.value = mod.lapso
  numeroModulo.value = mod.numero
  nombreModulo.value = mod.nombre
  tipoEvaluacion.value = mod.tipo_evaluacion || 'REGULAR'
  ponderacionPorcentaje.value = mod.ponderacion_porcentaje || 50
}

const sumaPonderacionLapso = computed(() => {
  return tienda.modulos
    .filter(m => m.lapso === lapsoSeleccionado.value)
    .reduce((acc, m) => acc + (Number(m.ponderacion_porcentaje) || 0), 0)
})

const guardar = () => {
  if (!nombreModulo.value.trim()) {
    alert('Por favor ingrese un nombre para el módulo')
    return
  }

  tienda.guardarModulo({
    id: idEditando.value || undefined,
    lapso: lapsoSeleccionado.value,
    numero: numeroModulo.value,
    nombre: nombreModulo.value,
    tipo_evaluacion: tipoEvaluacion.value,
    ponderacion_porcentaje: ponderacionPorcentaje.value,
    activo: true
  })

  limpiarFormulario()
}
</script>

<template>
  <div 
    v-if="abierto" 
    class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in"
  >
    <div class="bg-white rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
      
      <!-- Cabecera del Modal -->
      <div class="flex items-center justify-between border-b border-slate-100 pb-3">
        <div class="flex items-center gap-2">
          <div class="p-2 rounded-xl bg-blue-100 text-blue-700">
            <CalendarRange class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-base font-bold text-slate-900 leading-tight">
              Gestión de Lapsos y Módulos de Evaluación
            </h3>
            <p class="text-xs text-slate-500">
              Crea nuevos módulos, asigna su lapso, tipo de evaluación y ponderación porcentual.
            </p>
          </div>
        </div>
        <button 
          @click="emit('cerrar')"
          class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
        >
          <X class="w-5 h-5" />
        </button>
      </div>

      <!-- Formulario para Crear / Editar Módulo -->
      <div class="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-3">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-slate-800">
            {{ idEditando ? 'Editar Parámetros del Módulo' : 'Crear Nuevo Módulo al Sistema' }}
          </span>
          <button 
            v-if="idEditando" 
            @click="limpiarFormulario" 
            class="text-[11px] text-blue-600 hover:underline font-semibold"
          >
            Cancelar Edición
          </button>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <!-- Lapso Escolar -->
          <div class="space-y-1">
            <label class="text-[11px] font-semibold text-slate-600">Lapso Académico:</label>
            <select 
              v-model.number="lapsoSeleccionado"
              class="w-full p-2 text-xs rounded-xl bg-white border border-slate-300 font-semibold"
              @change="alCambiarLapso"
            >
              <option :value="1">I Lapso / Momento</option>
              <option :value="2">II Lapso / Momento</option>
              <option :value="3">III Lapso / Momento</option>
            </select>
          </div>

          <!-- Número de Módulo dentro del lapso -->
          <div class="space-y-1">
            <label class="text-[11px] font-semibold text-slate-600">Número de Módulo:</label>
            <input 
              v-model.number="numeroModulo" 
              type="number" min="1" max="10"
              class="w-full p-2 text-xs rounded-xl bg-white border border-slate-300 font-semibold"
            />
          </div>

          <!-- Ponderación Porcentual -->
          <div class="space-y-1">
            <label class="text-[11px] font-semibold text-slate-600 flex items-center gap-1">
              <Percent class="w-3 h-3 text-slate-400" /> Ponderación Lapso (%):
            </label>
            <input 
              v-model.number="ponderacionPorcentaje" 
              type="number" min="1" max="100" step="5"
              class="w-full p-2 text-xs rounded-xl bg-white border border-slate-300 font-semibold text-center"
            />
          </div>
        </div>

        <!-- Nombre del Módulo -->
        <div class="space-y-1">
          <label class="text-[11px] font-semibold text-slate-600">Nombre Oficial del Módulo:</label>
          <input 
            v-model="nombreModulo" 
            type="text" 
            placeholder="Ej: Módulo 1 - I Lapso (Álgebra Inicial)"
            class="w-full p-2 text-xs rounded-xl bg-white border border-slate-300 font-semibold"
          />
        </div>

        <!-- Tipo de Evaluación -->
        <div class="space-y-1">
          <label class="text-[11px] font-semibold text-slate-600">Tipo de Evaluación:</label>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label 
              v-for="tipo in tiposEvaluacion" 
              :key="tipo.valor"
              class="flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer transition select-none"
              :class="tipoEvaluacion === tipo.valor ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold' : 'bg-white border-slate-200 text-slate-700'"
            >
              <input 
                type="radio" 
                :value="tipo.valor" 
                v-model="tipoEvaluacion"
                class="accent-blue-600"
              />
              <span>{{ tipo.etiqueta }}</span>
            </label>
          </div>
        </div>

        <!-- Botón Guardar -->
        <div class="flex justify-end pt-1">
          <button 
            @click="guardar"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <component :is="idEditando ? Check : Plus" class="w-4 h-4" />
            <span>{{ idEditando ? 'Actualizar Módulo' : 'Agregar Módulo' }}</span>
          </button>
        </div>
      </div>

      <!-- Listado de Módulos Existentes por Lapso -->
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <h4 class="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Módulos del Lapso {{ lapsoSeleccionado }}
          </h4>
          <span 
            class="text-[11px] font-bold px-2 py-0.5 rounded-full border"
            :class="sumaPonderacionLapso === 100 ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-amber-50 text-amber-800 border-amber-300'"
          >
            Suma del Lapso: {{ sumaPonderacionLapso }}% / 100%
          </span>
        </div>

        <div class="space-y-2">
          <div 
            v-for="mod in tienda.modulos.filter(m => m.lapso === lapsoSeleccionado)" 
            :key="mod.id"
            class="p-3 bg-white border rounded-xl flex items-center justify-between gap-3 shadow-2xs hover:border-blue-300 transition"
            :class="mod.id === tienda.moduloActivoId ? 'ring-2 ring-blue-500 border-blue-400' : 'border-slate-200'"
          >
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-slate-900 text-xs">{{ mod.nombre }}</span>
                <span 
                  class="px-2 py-0.2 rounded text-[9px] font-bold border"
                  :class="tiposEvaluacion.find(t => t.valor === mod.tipo_evaluacion)?.color || 'bg-gray-100 text-gray-800'"
                >
                  {{ mod.tipo_evaluacion }}
                </span>
                <span class="text-[11px] font-black text-slate-600">
                  ({{ mod.ponderacion_porcentaje }}%)
                </span>
              </div>
              <span v-if="mod.id === tienda.moduloActivoId" class="text-[10px] text-blue-600 font-bold block mt-0.5">
                • Módulo actualmente activo en pantalla
              </span>
            </div>

            <div class="flex items-center gap-1.5 shrink-0">
              <button 
                @click="tienda.cambiarModulo(mod.id)"
                class="px-2 py-1 text-[11px] font-bold rounded-lg border hover:bg-slate-50 transition"
                :class="mod.id === tienda.moduloActivoId ? 'bg-blue-600 text-white border-blue-600' : 'text-slate-700 border-slate-300'"
              >
                {{ mod.id === tienda.moduloActivoId ? 'Activo' : 'Seleccionar' }}
              </button>

              <button 
                @click="iniciarEdicion(mod)"
                class="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                title="Editar módulo"
              >
                <Edit3 class="w-4 h-4" />
              </button>

              <button 
                @click="tienda.eliminarModulo(mod.id)"
                class="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                title="Eliminar módulo"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Pie del Modal -->
      <div class="flex justify-end pt-2 border-t border-slate-100">
        <button 
          @click="emit('cerrar')"
          class="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
        >
          Cerrar Administrador
        </button>
      </div>

    </div>
  </div>
</template>
