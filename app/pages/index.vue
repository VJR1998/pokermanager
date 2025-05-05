
<template>
  <div class="play-grid">
    <div class="timer">{{ formatTime(timer) }}</div>
    <div class="blinds">{{ blinds[0] + ' / ' + blinds[1] }}</div>
    <div class="current-level">{{ 'Level ' + level }}</div>
    <div class="btn-rack level-section">
      <div class="prev-level pi pi-angle-double-left"></div>
      <div class="next-level pi pi-pause-circle" v-if="play" @click="play = false"></div>
      <div class="next-level pi pi-play-circle" v-if="!play" @click="play = true"></div>
      <div class="next-level pi pi-angle-double-right"></div>
    </div>
  </div>
</template>

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
</style>

<script lang="ts">
  export default {
    definePageMeta: {
      title: 'Dashboard',
      layout: 'default',
      middleware: ['authenticated'],
    },
    data() {
      return {
        play: false,
        interval: "",
        timer: 15,
        blinds: [100, 200],
        level: 1,
        tournament: null
      }
    },
    mounted() {
      const { user, clear: clearSession } = useUserSession();

      const tournament = useTournamentDataStore();
      this.tournament = tournament.data;

      this.timer = this.minutesToSeconds(30);
      this.interval = setInterval(() => {
        if (this.timer === 0) {
          clearInterval(this.interval);                
        } else {
          if (this.play) {
            this.timer--;
          }
        }             
      }, 1000);
    },
    methods: {
      minutesToSeconds(minutes: number) {
        return minutes * 60;
      },
      formatTime(seconds: number) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const paddedMins = String(mins).padStart(2, '0');
        const paddedSecs = String(secs).padStart(2, '0');
        return `${paddedMins}:${paddedSecs}`;
      }
    }
  };
</script>