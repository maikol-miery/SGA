<script setup lang="ts">
import { useEscuelaStore } from '~/stores/useEscuelaStore'
import { 
  ShieldAlert, 
  FileSpreadsheet, 
  BookOpen, 
  Calendar as IconoCalendario,
  Sparkles,
  WifiOff
} from 'lucide-vue-next'

const tienda = useEscuelaStore()
</script>

<template>
  <div class="min-h-screen flex flex-col bg-slate-100">
    <!-- Barra Superior -->
    <BarraNavegacionSuperior />

    <!-- Notificación Flotante Si Hay Elementos Offline Pendientes -->
    <div 
      v-if="tienda.colaSincronizacion.length > 0"
      class="bg-amber-500 text-slate-950 font-bold text-xs py-2 px-4 shadow-sm flex items-center justify-between"
    >
      <div class="flex items-center gap-2 max-w-7xl mx-auto w-full">
        <WifiOff class="w-4 h-4 shrink-0" />
        <span>
          Guardado en dispositivo — {{ tienda.colaSincronizacion.length }} cambio(s) pendiente(s) por sincronizar.
        </span>
        <button
          @click="tienda.procesarColaSincronizacion()"
          :disabled="tienda.sincronizando"
          class="ml-auto underline font-black hover:text-white"
        >
          {{ tienda.sincronizando ? 'Sincronizando...' : 'Intentar Sincronizar Ahora' }}
        </button>
      </div>
    </div>

    <!-- Contenedor Principal con Navegación Adaptativa -->
    <div class="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-6 pb-24 md:pb-8 flex flex-col md:flex-row gap-6">
      
      <!-- SIDEBAR EN ESCRITORIO (PC) -->
      <aside class="hidden md:flex flex-col w-64 shrink-0 space-y-2">
        <div class="bg-white rounded-2xl p-3 border border-slate-200 shadow-xs space-y-1">
          <div class="px-3 py-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Módulos del Sistema
          </div>

          <!-- Pestaña 1: Convivir -->
          <button
            @click="tienda.pestanaActiva = 'convivir'"
            class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left"
            :class="tienda.pestanaActiva === 'convivir' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'"
          >
            <ShieldAlert class="w-4 h-4 shrink-0" />
            <div class="flex-1">
              <div>Incidencias / Convivir</div>
              <div class="text-[10px] font-normal opacity-80">4.0 pts institucionales</div>
            </div>
          </button>

          <!-- Pestaña 2: Planilla de Notas -->
          <button
            @click="tienda.pestanaActiva = 'planilla'"
            class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left"
            :class="tienda.pestanaActiva === 'planilla' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'"
          >
            <FileSpreadsheet class="w-4 h-4 shrink-0" />
            <div class="flex-1">
              <div>Planilla de Notas</div>
              <div class="text-[10px] font-normal opacity-80">Escala 1 al 20 + Transcripción</div>
            </div>
          </button>

          <!-- Pestaña 3: Diario de Clases -->
          <button
            @click="tienda.pestanaActiva = 'diario'"
            class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left"
            :class="tienda.pestanaActiva === 'diario' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'"
          >
            <BookOpen class="w-4 h-4 shrink-0" />
            <div class="flex-1">
              <div>Diario de Clases</div>
              <div class="text-[10px] font-normal opacity-80">Temas dados y tareas</div>
            </div>
          </button>

          <!-- Pestaña 4: Calendario -->
          <button
            @click="tienda.pestanaActiva = 'calendario'"
            class="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left"
            :class="tienda.pestanaActiva === 'calendario' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-700 hover:bg-slate-100'"
          >
            <IconoCalendario class="w-4 h-4 shrink-0" />
            <div class="flex-1">
              <div>Calendario</div>
              <div class="text-[10px] font-normal opacity-80">Evaluaciones y cortes</div>
            </div>
          </button>
        </div>

        <!-- Tarjeta Informativa del Rol Activo -->
        <div class="bg-blue-50/70 rounded-2xl p-4 border border-blue-100 text-xs text-blue-900 space-y-1">
          <div class="font-bold flex items-center gap-1.5">
            <Sparkles class="w-3.5 h-3.5 text-blue-600" />
            <span>Perfil Autenticado:</span>
          </div>
          <p class="text-[11px] text-blue-800 font-medium">
            {{ tienda.usuarioActual?.nombre }}
          </p>
          <p class="text-[10px] text-blue-600">
            Rol: <strong>{{ tienda.usuarioActual?.rol }}</strong>
          </p>
        </div>
      </aside>

      <!-- ÁREA DE CONTENIDO CENTRAL -->
      <main class="flex-1 min-w-0">
        <!-- Render condicional según pestaña activa -->
        <PestanaConvivir v-if="tienda.pestanaActiva === 'convivir'" />
        <PestanaPlanillaNotas v-else-if="tienda.pestanaActiva === 'planilla'" />
        <PestanaDiarioClases v-else-if="tienda.pestanaActiva === 'diario'" />
        <PestanaCalendario v-else-if="tienda.pestanaActiva === 'calendario'" />
      </main>

    </div>

    <!-- BOTTOM BAR EN MÓVIL (TÁCTIL PARA EL AULA DE CLASES) -->
    <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 px-2 py-1.5 z-40 shadow-lg flex items-center justify-around">
      <!-- Botón Móvil Convivir -->
      <button
        @click="tienda.pestanaActiva = 'convivir'"
        class="flex flex-col items-center p-1.5 rounded-xl transition text-[10px] font-bold"
        :class="tienda.pestanaActiva === 'convivir' ? 'text-blue-600 bg-blue-50' : 'text-slate-500'"
      >
        <ShieldAlert class="w-5 h-5 mb-0.5" />
        <span>Convivir</span>
      </button>

      <!-- Botón Móvil Planilla -->
      <button
        @click="tienda.pestanaActiva = 'planilla'"
        class="flex flex-col items-center p-1.5 rounded-xl transition text-[10px] font-bold"
        :class="tienda.pestanaActiva === 'planilla' ? 'text-blue-600 bg-blue-50' : 'text-slate-500'"
      >
        <FileSpreadsheet class="w-5 h-5 mb-0.5" />
        <span>Planilla</span>
      </button>

      <!-- Botón Móvil Diario -->
      <button
        @click="tienda.pestanaActiva = 'diario'"
        class="flex flex-col items-center p-1.5 rounded-xl transition text-[10px] font-bold"
        :class="tienda.pestanaActiva === 'diario' ? 'text-blue-600 bg-blue-50' : 'text-slate-500'"
      >
        <BookOpen class="w-5 h-5 mb-0.5" />
        <span>Diario</span>
      </button>

      <!-- Botón Móvil Calendario -->
      <button
        @click="tienda.pestanaActiva = 'calendario'"
        class="flex flex-col items-center p-1.5 rounded-xl transition text-[10px] font-bold"
        :class="tienda.pestanaActiva === 'calendario' ? 'text-blue-600 bg-blue-50' : 'text-slate-500'"
      >
        <IconoCalendario class="w-5 h-5 mb-0.5" />
        <span>Agenda</span>
      </button>
    </nav>
  </div>
</template>
