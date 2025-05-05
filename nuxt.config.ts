// https://nuxt.com/docs/api/configuration/nuxt-config
import Aura from '@primeuix/themes/aura';

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  future: {
    compatibilityVersion: 4
  },
  runtimeConfig: {
    DATABASE_URL: process.env.DATABASE_URL
  },
  css: ['~/assets/css/main.css', "primeicons/primeicons.css"],
  modules: [
    '@primevue/nuxt-module',
    'nuxt-vue3-google-signin',
    'nuxt-auth-utils',
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