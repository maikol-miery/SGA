<script setup lang="ts">
import { ref, computed } from 'vue'
import { useEscuelaStore } from '~/stores/useEscuelaStore'
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  UserCheck, 
  Layers, 
  Calendar as IconoCalendario, 
  CheckCircle2, 
  AlertTriangle,
  Settings
} from 'lucide-vue-next'

const tienda = useEscuelaStore()
const expandirSelectorUsuario = ref(false)
const modalModulosAbierto = ref(false)

const obtenerColorRol = (rol?: string) => {
  switch (rol) {
    case 'DOCENTE': return 'bg-blue-100 text-blue-800 border-blue-300'
    case 'COORDINADORA_PRIMARIA': return 'bg-emerald-100 text-emerald-800 border-emerald-300'
    case 'COORDINADORA_MEDIA_BAJA': return 'bg-purple-100 text-purple-800 border-purple-300'
    case 'COORDINADORA_MEDIA_ALTA': return 'bg-amber-100 text-amber-800 border-amber-300'
    default: return 'bg-gray-100 text-gray-800 border-gray-300'
  }
}
</script>

<template>
  <header class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
    <div class="max-w-7xl mx-auto px-3 sm:px-6 py-2.5">
      <div class="flex flex-wrap items-center justify-between gap-3">
        
        <!-- Logo y Titulo -->
        <div class="flex items-center space-x-3">
          <div class="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
            <span class="text-lg">UE</span>
          </div>
          <div>
            <h1 class="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              Gestión Académica & Convivir
            </h1>
            <p class="text-xs text-slate-500 hidden sm:block">
              Planilla de notas · Registro disciplinario · Offline-First PWA
            </p>
          </div>
        </div>

        <!-- Selectores Centrales: Seccion y Modulo -->
        <div class="flex items-center gap-2 flex-wrap">
          <!-- Selector de Sección -->
          <div class="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
            <Layers class="w-4 h-4 text-slate-500 ml-1.5 mr-1" />
            <select
              :value="tienda.seccionActivaId"
              @change="tienda.cambiarSeccion(($event.target as HTMLSelectElement).value)"
              class="bg-transparent text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer py-1 pr-2"
            >
              <option v-for="sec in tienda.secciones" :key="sec.id" :value="sec.id">
                {{ sec.nombre }} ({{ sec.nivel }})
              </option>
            </select>
          </div>

          <!-- Selector de Módulo -->
          <div class="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
            <IconoCalendario class="w-4 h-4 text-slate-500 ml-1.5 mr-1" />
            <select
              :value="tienda.moduloActivoId"
              @change="tienda.cambiarModulo(($event.target as HTMLSelectElement).value)"
              class="bg-transparent text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none cursor-pointer py-1 pr-2"
            >
              <option v-for="mod in tienda.modulos" :key="mod.id" :value="mod.id">
                {{ mod.nombre }} ({{ mod.tipo_evaluacion }})
              </option>
            </select>
            <!-- Botón abrir configuración de módulos y lapsos -->
            <button
              @click="modalModulosAbierto = true"
              class="p-1 rounded text-slate-500 hover:text-blue-700 hover:bg-slate-200 transition ml-0.5"
              title="Administrar Módulos, Lapsos y Tipos de Evaluación"
            >
              <Settings class="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <!-- Indicador de Red y Selector Rapido de Rol/Usuario -->
        <div class="flex items-center gap-3">
          <!-- Estado Offline / Online -->
          <div 
            class="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
            :class="tienda.estaEnLinea ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-300'"
            :title="tienda.estaEnLinea ? 'Conectado a la red local' : 'Sin conexión a red (Modo Offline)'"
          >
            <component :is="tienda.estaEnLinea ? Wifi : WifiOff" class="w-3.5 h-3.5" />
            <span class="hidden md:inline">{{ tienda.estaEnLinea ? 'En línea' : 'Modo Offline' }}</span>
            <span v-if="tienda.colaSincronizacion.length > 0" class="flex items-center ml-1 text-amber-600 font-bold">
              ({{ tienda.colaSincronizacion.length }})
            </span>
          </div>

          <!-- Boton Sincronizar Cola Manualmente -->
          <button
            v-if="tienda.colaSincronizacion.length > 0"
            @click="tienda.procesarColaSincronizacion()"
            :disabled="tienda.sincronizando"
            class="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-semibold flex items-center gap-1 transition"
            title="Sincronizar cambios pendientes con el servidor local"
          >
            <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': tienda.sincronizando }" />
            <span class="hidden sm:inline">Sincronizar</span>
          </button>

          <!-- Selector Rapido de Rol (Requisito estricto de pruebas) -->
          <div class="relative">
            <button
              @click="expandirSelectorUsuario = !expandirSelectorUsuario"
              class="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs font-semibold shadow-xs transition hover:brightness-95"
              :class="obtenerColorRol(tienda.usuarioActual?.rol)"
            >
              <UserCheck class="w-3.5 h-3.5" />
              <div class="text-left">
                <div class="leading-none">{{ tienda.usuarioActual?.nombre.split(' ')[0] }} {{ tienda.usuarioActual?.nombre.split(' ')[1] }}</div>
                <div class="text-[10px] opacity-80 uppercase tracking-wider font-bold">
                  {{ tienda.usuarioActual?.rol.replace('COORDINADORA_', 'COORD. ') }}
                </div>
              </div>
            </button>

            <!-- Dropdown con los 4 roles -->
            <div 
              v-if="expandirSelectorUsuario" 
              class="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95"
            >
              <div class="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                Cambiar Rol para Pruebas en Vivo
              </div>
              <button
                v-for="u in tienda.usuarios"
                :key="u.id"
                @click="tienda.cambiarUsuario(u.id); expandirSelectorUsuario = false"
                class="w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition border-l-4"
                :class="tienda.usuarioActual?.id === u.id ? 'border-blue-600 bg-blue-50/50' : 'border-transparent'"
              >
                <div>
                  <div class="font-bold text-slate-800">{{ u.nombre }}</div>
                  <div class="text-slate-500 text-[10px]">{{ u.materia_asignada }}</div>
                </div>
                <span 
                  class="px-1.5 py-0.5 rounded text-[9px] font-bold border"
                  :class="obtenerColorRol(u.rol)"
                >
                  {{ u.rol.replace('COORDINADORA_', 'COORD. ') }}
                </span>
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>

    <!-- Modal para administración de Módulos y Lapsos -->
    <ModalGestionModulos 
      :abierto="modalModulosAbierto" 
      @cerrar="modalModulosAbierto = false" 
    />
  </header>
</template>
