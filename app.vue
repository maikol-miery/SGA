<script setup lang="ts">
import { onMounted } from 'vue'
import { useEscuelaStore } from '~/stores/useEscuelaStore'

const tienda = useEscuelaStore()

onMounted(async () => {
  await tienda.inicializarSistema()
})
</script>

<template>
  <div class="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
    <NuxtPage />
  </div>
</template>

<style>
/* Estilos globales y personalización de barras de scroll para modo hoja de cálculo */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}
::-webkit-scrollbar-track {
  background: #f1f5f9;
}
::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 4px;
}
::-webkit-scrollbar-thumb:hover {
  background: #94a3b8;
}
</style>
