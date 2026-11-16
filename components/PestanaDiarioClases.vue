<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEscuelaStore } from '~/stores/useEscuelaStore'
import { BookOpen, Calendar, Send, History, CheckCircle, FileText } from 'lucide-vue-next'

const tienda = useEscuelaStore()

const hoy = new Date().toISOString().split('T')[0]

// Campos del diario de clases requeridos
const fechaClase = ref(hoy)
const temasDados = ref('')
const descripcionClase = ref('')
const tareaAsignada = ref('')

const mensajeExito = ref(false)

const controlesSeccionActual = computed(() => {
  return tienda.controlesDiarios
    .filter(c => c.seccion_id === tienda.seccionActivaId)
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
})

const guardarDiario = () => {
  if (!temasDados.value.trim() || !descripcionClase.value.trim()) {
    alert('Por favor complete al menos los Temas Dados y la Descripción de la jornada.')
    return
  }

  tienda.registrarControlDiario({
    fecha: fechaClase.value,
    temas_dados: temasDados.value,
    descripcion_clase: descripcionClase.value,
    tarea_asignada: tareaAsignada.value
  })

  // Limpiar formulario y mostrar feedback
  temasDados.value = ''
  descripcionClase.value = ''
  tareaAsignada.value = ''
  mensajeExito.value = true
  setTimeout(() => {
    mensajeExito.value = false
  }, 3000)
}
</script>

<template>
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Columna Izquierda: Formulario Rápido de Registro -->
    <div class="lg:col-span-1 bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
      <div class="flex items-center gap-2 border-b border-slate-100 pb-3">
        <div class="p-2 rounded-xl bg-blue-100 text-blue-700">
          <BookOpen class="w-5 h-5" />
        </div>
        <div>
          <h2 class="font-bold text-slate-900 text-base">Control Diario de Clases</h2>
          <p class="text-xs text-slate-500">Sección: {{ tienda.seccionActual?.nombre }}</p>
        </div>
      </div>

      <div v-if="mensajeExito" class="p-3 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs flex items-center gap-2 animate-in fade-in">
        <CheckCircle class="w-4 h-4 text-emerald-600 shrink-0" />
        <span>Diario registrado y respaldado en la cola local.</span>
      </div>

      <!-- Campo Fecha -->
      <div class="space-y-1">
        <label class="text-xs font-semibold text-slate-700 flex items-center gap-1">
          <Calendar class="w-3.5 h-3.5 text-slate-400" /> Fecha de la Clase:
        </label>
        <input 
          v-model="fechaClase"
          type="date"
          class="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <!-- Campo Temas Dados -->
      <div class="space-y-1">
        <label class="text-xs font-semibold text-slate-700">
          Temas Dados / Contenidos Abordados:
        </label>
        <input 
          v-model="temasDados"
          type="text"
          placeholder="Ej: Factorización y productos notables"
          class="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <!-- Campo Descripción de la Jornada -->
      <div class="space-y-1">
        <label class="text-xs font-semibold text-slate-700">
          Descripción de la Jornada (desarrollo de la clase):
        </label>
        <textarea 
          v-model="descripcionClase"
          rows="4"
          placeholder="Ej: Se realizaron ejercicios prácticos en la pizarra con participación activa de los alumnos..."
          class="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>
      </div>

      <!-- Campo Tarea Asignada -->
      <div class="space-y-1">
        <label class="text-xs font-semibold text-slate-700">
          Tarea / Actividad Asignada para el Hogar:
        </label>
        <textarea 
          v-model="tareaAsignada"
          rows="2"
          placeholder="Ej: Resolver ejercicios 5 al 12 de la guía de estudio para el próximo martes..."
          class="w-full p-2.5 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>
      </div>

      <!-- Botón Registrar -->
      <button
        @click="guardarDiario"
        class="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-xs"
      >
        <Send class="w-4 h-4" />
        <span>Guardar Registro Diario</span>
      </button>
    </div>

    <!-- Columna Derecha: Historial Cronológico de Clases -->
    <div class="lg:col-span-2 space-y-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <History class="w-5 h-5 text-slate-500" />
          <h3 class="font-bold text-slate-900 text-base">Historial Cronológico de Clases Impartidas</h3>
        </div>
        <span class="text-xs text-slate-500 font-semibold">
          Total: {{ controlesSeccionActual.length }} registros
        </span>
      </div>

      <div v-if="controlesSeccionActual.length === 0" class="bg-white rounded-2xl p-8 border border-slate-200 text-center text-slate-400">
        <FileText class="w-12 h-12 mx-auto mb-2 opacity-40 text-slate-400" />
        <p class="text-sm font-semibold">No hay registros diarios para esta sección todavía.</p>
        <p class="text-xs mt-1">Usa el formulario lateral para registrar la primera jornada de clase.</p>
      </div>

      <div class="space-y-3">
        <div 
          v-for="control in controlesSeccionActual" 
          :key="control.id"
          class="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs space-y-3 transition hover:border-slate-300"
        >
          <div class="flex items-center justify-between border-b border-slate-100 pb-2">
            <span class="px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-bold text-xs font-mono">
              {{ control.fecha }}
            </span>
            <span class="text-[11px] text-slate-400">
              Registrado por: Docente
            </span>
          </div>

          <div>
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Temas Dados</span>
            <h4 class="font-bold text-slate-900 text-sm mt-0.5">{{ control.temas_dados }}</h4>
          </div>

          <div>
            <span class="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Desarrollo de la Clase</span>
            <p class="text-xs text-slate-600 mt-0.5 leading-relaxed">{{ control.descripcion_clase }}</p>
          </div>

          <div v-if="control.tarea_asignada" class="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-xs">
            <span class="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Tarea Asignada:</span>
            <p class="text-amber-900 font-medium mt-0.5">{{ control.tarea_asignada }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
