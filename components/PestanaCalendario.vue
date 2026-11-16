<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEscuelaStore } from '~/stores/useEscuelaStore'
import { Calendar as IconoCalendario, PlusCircle, Lock, Bookmark, AlertCircle } from 'lucide-vue-next'
import type { TipoEventoCalendario } from '~/types/sistema'

const tienda = useEscuelaStore()

const hoy = new Date().toISOString().split('T')[0]

// Estados del modal para nuevo evento
const modalNuevoEvento = ref(false)
const titulo = ref('')
const descripcion = ref('')
const fecha = ref(hoy)
const tipo = ref<TipoEventoCalendario>('EVALUACION_DOCENTE')

const eventosOrdenados = computed(() => {
  return [...tienda.eventosCalendario].sort((a, b) => a.fecha.localeCompare(b.fecha))
})

const abrirModalCrear = () => {
  titulo.value = ''
  descripcion.value = ''
  fecha.value = hoy
  // Si el usuario es docente, solo puede crear evaluaciones
  if (!tienda.puedeCrearEventoCoordinacion) {
    tipo.value = 'EVALUACION_DOCENTE'
  } else {
    tipo.value = 'ENTREGA_NOTAS_COORDINACION'
  }
  modalNuevoEvento.value = true
}

const guardarEvento = () => {
  if (!titulo.value.trim() || !fecha.value) {
    alert('Por favor ingrese el título y la fecha del evento.')
    return
  }

  const esBloqueado = tipo.value === 'ENTREGA_NOTAS_COORDINACION'

  tienda.registrarEventoCalendario({
    titulo: titulo.value,
    descripcion: descripcion.value,
    fecha: fecha.value,
    tipo: tipo.value,
    seccion_id: tipo.value === 'EVALUACION_DOCENTE' ? tienda.seccionActivaId : undefined,
    bloqueado_para_docentes: esBloqueado
  })

  modalNuevoEvento.value = false
}
</script>

<template>
  <div class="space-y-6">
    <!-- Encabezado del Calendario -->
    <div class="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
      <div>
        <h2 class="text-xl font-bold text-slate-900 leading-tight">Calendario Institucional y de Evaluaciones</h2>
        <p class="text-xs sm:text-sm text-slate-500">
          Evaluaciones de materias (Azul) y fechas límite fijadas por Coordinación (Rojo / Bloqueadas e inmutables).
        </p>
      </div>

      <button
        @click="abrirModalCrear"
        class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 transition shadow-xs"
      >
        <PlusCircle class="w-4 h-4" />
        <span>Agendar Evento / Fecha</span>
      </button>
    </div>

    <!-- Lista de Fechas y Cronograma -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div 
        v-for="evento in eventosOrdenados" 
        :key="evento.id"
        class="rounded-2xl border p-5 flex flex-col justify-between shadow-xs transition"
        :class="[
          evento.tipo === 'ENTREGA_NOTAS_COORDINACION' 
            ? 'bg-red-50/40 border-red-200 ring-1 ring-red-300' 
            : 'bg-white border-blue-200 hover:border-blue-300'
        ]"
      >
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span 
              class="px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1"
              :class="evento.tipo === 'ENTREGA_NOTAS_COORDINACION' 
                ? 'bg-red-100 text-red-800' 
                : 'bg-blue-100 text-blue-800'"
            >
              <Lock v-if="evento.bloqueado_para_docentes" class="w-3 h-3 text-red-600" />
              <span>{{ evento.tipo === 'ENTREGA_NOTAS_COORDINACION' ? 'Entrega de Notas (Coordinación)' : 'Evaluación Docente' }}</span>
            </span>

            <span class="text-xs font-mono font-bold text-slate-600">
              {{ evento.fecha }}
            </span>
          </div>

          <div>
            <h3 class="text-base font-bold text-slate-900 leading-snug">
              {{ evento.titulo }}
            </h3>
            <p class="text-xs text-slate-600 mt-1 leading-relaxed">
              {{ evento.descripcion }}
            </p>
          </div>
        </div>

        <div class="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
          <span v-if="evento.bloqueado_para_docentes" class="text-red-700 font-semibold flex items-center gap-1">
            <Lock class="w-3 h-3" /> Fecha Inmutable (Coordinación)
          </span>
          <span v-else class="text-slate-500">
            Materia / Sección Activa
          </span>
        </div>
      </div>
    </div>

    <!-- Modal para Agregar Evento / Evaluación -->
    <div 
      v-if="modalNuevoEvento"
      class="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in"
    >
      <div class="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
        <div>
          <h3 class="text-base font-bold text-slate-900">Agendar Nuevo Evento en Calendario</h3>
          <p class="text-xs text-slate-500">Planifica evaluaciones o fechas de corte institucional.</p>
        </div>

        <!-- Selector de Tipo de Evento -->
        <div class="space-y-1">
          <label class="text-xs font-semibold text-slate-700">Tipo de Evento:</label>
          <select 
            v-model="tipo"
            class="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
          >
            <option value="EVALUACION_DOCENTE">Evaluación Docente (Color Azul)</option>
            <option 
              value="ENTREGA_NOTAS_COORDINACION" 
              :disabled="!tienda.puedeCrearEventoCoordinacion"
            >
              Entrega de Notas a Departamentos (Color Rojo - Exclusivo Coordinación)
            </option>
          </select>
          <p v-if="!tienda.puedeCrearEventoCoordinacion" class="text-[10px] text-amber-700 italic">
            * Fechas de entrega institucional están restringidas a roles de Coordinación.
          </p>
        </div>

        <!-- Título -->
        <div class="space-y-1">
          <label class="text-xs font-semibold text-slate-700">Título del Evento:</label>
          <input 
            v-model="titulo"
            type="text"
            placeholder="Ej: Prueba Parcial de Matemática o Entrega Planillas Módulo 1"
            class="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <!-- Fecha -->
        <div class="space-y-1">
          <label class="text-xs font-semibold text-slate-700">Fecha:</label>
          <input 
            v-model="fecha"
            type="date"
            class="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <!-- Descripción -->
        <div class="space-y-1">
          <label class="text-xs font-semibold text-slate-700">Descripción o Pautas:</label>
          <textarea 
            v-model="descripcion"
            rows="3"
            placeholder="Ej: Traer calculadora científica y regla. Evaluación individual."
            class="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500"
          ></textarea>
        </div>

        <!-- Botones de Acción -->
        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button 
            @click="modalNuevoEvento = false"
            class="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            Cancelar
          </button>
          <button 
            @click="guardarEvento"
            class="px-4 py-1.5 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 rounded-lg shadow-xs"
          >
            Guardar en Calendario
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
