import { defineStore } from 'pinia'

export const useTournamentDataStore = defineStore('tournamentData', {
  state: () => ({
    // The signed-in user's tournament row (not an array), or null until loaded.
    data: null as any,
    loading: false,
    error: null as string | null
  }),
  actions: {
    async fetchData() {
      this.loading = true
      this.error = null
      try {
        this.data = await $fetch('/api/tournament')
      } catch (err: any) {
        this.data = null
        this.error = err?.data?.statusMessage || err?.statusMessage || err?.message || 'Could not load tournament'
      } finally {
        this.loading = false
      }
    }
  }
})
