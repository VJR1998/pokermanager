export default defineNuxtPlugin(async (nuxtApp) => {
    const tournamentDataStore = useTournamentDataStore()
    
    // Only fetch if not already fetched
    if (!tournamentDataStore.data) {
      await tournamentDataStore.fetchData()
    }
  })
  