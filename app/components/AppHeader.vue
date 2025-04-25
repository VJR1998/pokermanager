<template>
    <v-app-bar :elevation="2">
      <template v-slot:prepend>
        <v-app-bar-nav-icon @click="drawer = !drawer"></v-app-bar-nav-icon>
      </template>

      <v-app-bar-title>{{ $route.meta.title }}</v-app-bar-title>
    </v-app-bar>
    <v-navigation-drawer v-model="drawer">
      <v-list-item title="Poker Tournament"></v-list-item>
      <v-divider></v-divider>
      <NuxtLink to="/"><v-list-item link title="Dashboard"></v-list-item></NuxtLink>
      <NuxtLink to="/about"><v-list-item link title="About"></v-list-item></NuxtLink>
    </v-navigation-drawer>
</template>

<script>
    export default {
        data() {
            return {
                drawer: false
            }
        }
    }
</script>