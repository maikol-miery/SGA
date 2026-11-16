// Configuracion de Nuxt 3 para la aplicacion de Gestion Academica y Convivir
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: false },
  modules: [
    '@nuxtjs/tailwindcss',
    '@pinia/nuxt'
  ],
  app: {
    head: {
      title: 'Sistema de Gestión Académica y Convivir',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
        { name: 'description', content: 'Planilla de notas, control de incidencias disciplinarias Convivir y diario de clases' },
        { name: 'theme-color', content: '#1e3a8a' }
      ],
      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' }
      ]
    }
  },
  nitro: {
    // Para garantizar soporte con sqlite local
    externals: {
      inline: []
    }
  }
})
