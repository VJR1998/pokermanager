<template>
    <AppHeader />
    <div class="main-card">
      <NuxtPage />
    </div>
</template>

<script setup>
  const { user, clear: clearSession } = useUserSession();
</script>