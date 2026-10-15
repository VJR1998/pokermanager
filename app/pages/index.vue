<template>
  <div class="play-grid">
    <ConfirmDialog :style="{ width: '25rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"></ConfirmDialog>

    <div v-if="loadError" class="state-msg">
      <p>{{ loadError }}</p>
      <Button label="Try again" icon="pi pi-refresh" @click="init" />
    </div>
    <div v-else-if="store.loading && !currentLevel" class="state-msg">Loading tournament…</div>
    <div v-else-if="!currentLevel" class="state-msg">
      <p>No blind levels are set up yet.</p>
      <NuxtLink to="/setup">Configure tournament</NuxtLink>
    </div>

    <template v-else>
      <div class="timer" :class="{ finished }">{{ formatTime(remaining) }}</div>
      <div class="blinds">{{ currentLevel.blinds[0] + ' / ' + currentLevel.blinds[1] }}</div>
      <div class="current-level">{{ 'Level ' + (levelIndex + 1) }}</div>
      <div class="btn-rack level-section">
        <div class="pi pi-user-plus" disabled="true" title="Add player (coming soon)"></div>
        <div class="pi pi-angle-double-left" title="Previous level" :disabled="atFirst" @click="goTo(-1)"></div>
        <div v-if="running" class="pi pi-pause-circle" title="Pause" @click="pause"></div>
        <div v-else class="pi pi-play-circle" title="Start" :disabled="finished" @click="play"></div>
        <div v-if="!running" class="pi pi-refresh" title="Reset" @click="confirmReset"></div>
        <div class="pi pi-angle-double-right" title="Next level" :disabled="atLast" @click="goTo(1)"></div>
        <div class="pi pi-user-minus" disabled="true" title="Knock out player (coming soon)"></div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: 'Dashboard',
  layout: 'default',
})

const store = useTournamentDataStore()
const confirm = useConfirm()
const loadError = ref('')

const {
  remaining, levelIndex, currentLevel, running, atFirst, atLast, finished,
  load, play, pause, goTo, resetLevel, resetAll
} = useBlindTimer()

async function init() {
  loadError.value = ''
  await store.fetchData()
  if (!store.data) {
    loadError.value = store.error || 'Could not load tournament'
    return
  }
  load(store.data.id, store.data.blinds)
}

onMounted(init)

function confirmReset() {
  confirm.require({
    message: 'Are you sure you want to reset this level or tournament?',
    header: 'Reset Confirmation',
    icon: 'pi pi-exclamation-triangle',
    rejectProps: {
      label: 'Reset Level',
      severity: 'success'
    },
    acceptProps: {
      label: 'Reset Tournament',
      severity: 'danger'
    },
    accept: resetAll,
    reject: resetLevel
  })
}
</script>

<style lang="css" scoped>
  .play-grid {
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
  }

  .timer {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 80%;
    height: 30%;
    font-size: 80px;
    border-bottom: 2px solid #1ba673
  }

  .timer.finished {
    color: #e5484d;
    border-bottom-color: #e5484d;
  }

  .blinds {
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 70px;
  }

  .current-level {
    font-size: 15px;
    color: #1ba673;
  }

  .level-section {
    display: flex;
    gap: 30px;
    margin-top: 10px;
  }

  .level-section div {
    font-size: 30px;
    cursor: pointer;
  }

  .state-msg {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    margin-top: 40px;
  }
</style>
