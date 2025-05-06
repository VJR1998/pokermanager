// stores/userData.ts
import { defineStore } from 'pinia'

export const useTournamentDataStore = defineStore('tournamentData', {
  state: () => ({
    data: null,
    loading: false,
    error: null
  }),
  actions: {
    async fetchData() {
      this.loading = true;
      try {
        const data = await $fetch('/api/tournament');
        this.data = data;
        this.error = null;
      } catch (err) {
        this.error = err;
      } finally {
        this.loading = false;
      }
    }
  }
})
