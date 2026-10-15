// https://nuxt.com/docs/api/configuration/nuxt-config
import Aura from '@primeuix/themes/aura';

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  future: {
    compatibilityVersion: 4
  },
  css: ['~/assets/css/main.css', "primeicons/primeicons.css"],
  modules: [
    '@primevue/nuxt-module',
    'nuxt-vue3-google-signin',
    '@pinia/nuxt',
    '@nuxtjs/supabase',
    '@nuxt/eslint',
  ],
  googleSignIn: {
    clientId: process.env.GOOGLE_CLIENT_ID,
  },
  primevue: {
    options: {
        theme: {
            preset: Aura
        }
    }
  },
})
