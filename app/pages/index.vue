
<template>
  <div class="play-grid">
    <Toast />
    <ConfirmDialog :style="{ width: '25rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }"></ConfirmDialog>
    <div class="timer">{{ formatTime(timer) }}</div>
    <div class="blinds" v-if="currentLevel">{{ currentLevel.blinds[0] + ' / ' + currentLevel.blinds[1] }}</div>
    <div class="current-level" v-if="currentLevel">{{ 'Level ' + currentLevel.level }}</div>
    <div class="btn-rack level-section">
      <div class="pi pi-user-plus" @click="addPlayer"></div>
      <div class="pi pi-angle-double-left" @click="prevLevel"></div>
      <div class="pi pi-pause-circle" v-if="play" @click="play = false"></div>
      <div class="pi pi-play-circle" v-if="!play" @click="play = true"></div>
      <div class="pi pi-refresh" v-if="!play" @click="confirmReset"></div>
      <div class="pi pi-angle-double-right" @click="nextLevel"></div>
      <div class="pi pi-user-minus" title="Knockout Player" @click="knockoutPlayer"></div>
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
        currentLevel: null,
        tournament: null,
        players: []
      }
    },
    async mounted() {
      const { user, clear: clearSession } = useUserSession();

      const tournamentStore = useTournamentDataStore();
      await tournamentStore.fetchData();
      this.tournament = tournamentStore.data;
      this.initLevel();
    },
    methods: {
      initLevel() {
        if (localStorage.getItem("currentLevel")) {
          this.currentLevel = JSON.parse(localStorage.getItem("currentLevel"));
        } else {
          this.currentLevel = this.tournament.blinds[0];
        }

        if (localStorage.getItem("timer")) {
          this.timer = localStorage.getItem("timer");
        } else {
          this.timer = this.minutesToSeconds(this.currentLevel.level_length);
        }

        this.interval = setInterval(() => {
          if (this.timer === 0) {
            clearInterval(this.interval);                
          } else {
            if (this.play) {
              this.timer--;
              localStorage.setItem("timer", this.timer);
            }
          }             
        }, 1000);

        localStorage.setItem("currentLevel", JSON.stringify(this.currentLevel));
      },
      nextLevel() {
        this.currentLevel = this.tournament.blinds.find(blind => blind.level == this.currentLevel.level + 1);
        localStorage.setItem("currentLevel", JSON.stringify(this.currentLevel));
        localStorage.removeItem("timer");
        clearInterval(this.interval);
        this.initLevel();
      },
      prevLevel() {
        this.currentLevel = this.tournament.blinds.find(blind => blind.level == this.currentLevel.level - 1);
        localStorage.setItem("currentLevel", JSON.stringify(this.currentLevel));
        localStorage.removeItem("timer");
        clearInterval(this.interval);
        this.initLevel();
      },
      minutesToSeconds(minutes: number) {
        return minutes * 60;
      },
      formatTime(seconds: number) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        const paddedMins = String(mins).padStart(2, '0');
        const paddedSecs = String(secs).padStart(2, '0');
        return `${paddedMins}:${paddedSecs}`;
      },
      resetTournament() {
        localStorage.removeItem("currentLevel");
        localStorage.removeItem("timer");
        clearInterval(this.interval);
        this.initLevel();
      },
      resetLevel() {
        localStorage.removeItem("timer");
        clearInterval(this.interval);
        this.initLevel();
      },
      confirmReset() {
          this.$confirm.require({
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
              accept: () => {
                  this.resetTournament();
                  // this.$toast.add({ severity: 'info', summary: 'Tournament Reset', detail: 'You have reset the tournament', life: 3000 });
              },
              reject: () => {
                  this.resetLevel();
                  // this.$toast.add({ severity: 'error', summary: 'Level Reset', detail: 'You have reset this level', life: 3000 });
              }
          });
      },
      addPlayer() {
        this.players.push(this.players.length);
      },
      knockoutPlayer() {
      }
    }
  };
</script>