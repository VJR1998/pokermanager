<template>
  <div v-if="loadError" class="state-msg">
    <p>{{ loadError }}</p>
    <Button label="Try again" icon="pi pi-refresh" @click="load" />
  </div>
  <div v-else-if="!tournament" class="state-msg">Loading tournament…</div>

  <div v-else class="card main-form">
    <div class="setup-header">
      <h3>Tournament Setup</h3>
      <div class="save-status" :class="saveState" role="status" aria-live="polite">
        <template v-if="saveState === 'dirty'">Unsaved changes…</template>
        <template v-else-if="saveState === 'saving'">Saving…</template>
        <template v-else-if="saveState === 'saved'"><i class="pi pi-check"></i> All changes saved</template>
        <template v-else-if="saveState === 'error'">
          <i class="pi pi-exclamation-triangle"></i> Save failed: {{ saveError }}
          <Button label="Retry" size="small" severity="danger" text @click="saveNow" />
        </template>
      </div>
    </div>

    <!-- DETAILS -->
    <FloatLabel variant="on">
        <InputText id="title" v-model="tournament.title" maxlength="100" style="width:100%;" />
        <label for="title">Title</label>
    </FloatLabel>
    <FloatLabel variant="on">
        <Textarea id="description" v-model="tournament.description" rows="5" cols="30" maxlength="2000" style="resize: none; width: 100%;" />
        <label for="description">Description</label>
    </FloatLabel>
    <FloatLabel variant="on">
        <InputNumber v-model="tournament.starting_stack" input-id="starting" :min="0" :use-grouping="false" fluid />
        <label for="starting">Starting Stack</label>
    </FloatLabel>

    <!-- CHIPS -->
    <h4>Chips</h4>
    <div class="chip-rack">
      <template v-for="(chip, idx) in tournament.chipset" :key="chip.id">
        <div v-if="chip.visible" class="chip">
          <PokerChip style="cursor: pointer;" :chip-value="chip.value" :primary-colour="chip.primarycolour" :secondary-colour="chip.secondarycolour" @click="openChipEdit(idx)"></PokerChip>
        </div>
      </template>
      <div class="add-item" @click="addChip">
        <i class="pi pi-plus"></i>
      </div>
    </div>

    <!-- BLINDS -->
    <h4>Blinds Schedule</h4>
    <template v-for="(level, idx) in tournament.blinds" :key="idx">
      <div class="btn-rack">
        <label style="width: 15%;">{{ idx + 1 }}</label>
        <InputNumber v-model="level.blinds[0]" :min="0" show-buttons button-layout="horizontal" :step="50" fluid>
            <template #incrementicon>
                <span class="pi pi-plus" />
            </template>
            <template #decrementicon>
                <span class="pi pi-minus" />
            </template>
        </InputNumber>
        <InputNumber v-model="level.blinds[1]" :min="0" show-buttons button-layout="horizontal" :step="50" fluid>
            <template #incrementicon>
                <span class="pi pi-plus" />
            </template>
            <template #decrementicon>
                <span class="pi pi-minus" />
            </template>
        </InputNumber>
        <span class="edit-blind pi pi-pen-to-square" title="Edit level" @click="openBlindEdit(idx)"></span>
      </div>
    </template>
    <div class="add-container">
      <div class="add-item" @click="addBlind">
        <i class="pi pi-plus"></i>
      </div>
    </div>

    <!-- MONEY -->
    <h4>Money & Prizes</h4>
    <label for="currency">Currency</label>
    <Select v-model="tournament.currency" input-id="currency" :options="currencyOptions" option-label="label" option-value="code" fluid />

    <label for="buyin">Buy-in</label>
    <InputNumber v-model="buyIn" input-id="buyin" mode="currency" :currency="tournament.currency" :locale="locale" :min="0" placeholder="Buy-in" fluid />

    <label for="places">Places Paid</label>
    <InputNumber v-model="tournament.money.placesPaid" input-id="places" :min="1" :max="50" show-buttons button-layout="horizontal" :step="1" fluid>
        <template #incrementicon>
            <span class="pi pi-plus" />
        </template>
        <template #decrementicon>
            <span class="pi pi-minus" />
        </template>
    </InputNumber>

    <label>Split</label>
    <template v-for="(place, idx) in tournament.money.split" :key="idx">
      <div class="btn-rack">
        <div class="split-place">{{ ordinal(idx + 1) }}</div>
        <InputNumber v-model="tournament.money.split[idx]" :min="0" :max="100" show-buttons button-layout="horizontal" :step="1" suffix="%" fluid>
            <template #incrementicon>
                <span class="pi pi-plus" />
            </template>
            <template #decrementicon>
                <span class="pi pi-minus" />
            </template>
        </InputNumber>
      </div>
    </template>
    <small class="split-total" :class="{ 'split-bad': splitTotal !== 100 }">
      Total: {{ splitTotal }}%<span v-if="splitTotal !== 100"> — payouts should add up to 100%</span>
    </small>

    <!-- SEATING -->
    <h4>Seating</h4>
    <div class="btn-rack">
      <ToggleSwitch v-model="tournament.seating.enabled" input-id="seating_enabled" />
      <label for="seating_enabled">Enable Seating</label>
    </div>
    <div class="btn-rack" :disabled="!tournament.seating.enabled">
      <label style="width:70%;">Seats (Per Table)</label>
      <InputNumber v-model="tournament.seating.seats" :min="2" :max="12" show-buttons button-layout="horizontal" :step="1" fluid>
          <template #incrementicon>
              <span class="pi pi-plus" />
          </template>
          <template #decrementicon>
              <span class="pi pi-minus" />
          </template>
      </InputNumber>
    </div>

    <Dialog v-model:visible="showBlindEditMenu" modal header="Edit Blind Level" :style="{ width: '25rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
      <template v-if="selectedBlind">
        <div class="dialog-inner">
          <label for="smallblind">Small Blind</label>
          <InputNumber v-model="selectedBlind.blinds[0]" input-id="smallblind" :min="0" style="margin-bottom: 10px;" show-buttons button-layout="horizontal" :step="50" fluid>
              <template #incrementicon>
                  <span class="pi pi-plus" />
              </template>
              <template #decrementicon>
                  <span class="pi pi-minus" />
              </template>
          </InputNumber>
          <label for="bigblind">Big Blind</label>
          <InputNumber v-model="selectedBlind.blinds[1]" input-id="bigblind" :min="0" style="margin-bottom: 10px;" show-buttons button-layout="horizontal" :step="50" fluid>
              <template #incrementicon>
                  <span class="pi pi-plus" />
              </template>
              <template #decrementicon>
                  <span class="pi pi-minus" />
              </template>
          </InputNumber>
          <label for="level-length">Level Length</label>
          <InputNumber v-model="selectedBlind.level_length" input-id="level-length" :min="1" :max="600" suffix=" minutes" show-buttons button-layout="horizontal" :step="5" fluid>
              <template #incrementicon>
                  <span class="pi pi-plus" />
              </template>
              <template #decrementicon>
                  <span class="pi pi-minus" />
              </template>
          </InputNumber>
        </div>
        <div class="btn-rack flex justify-end gap-2">
          <Button type="button" label="Save" @click="saveBlindOptions"></Button>
          <Button type="button" label="Cancel" severity="secondary" @click="showBlindEditMenu = false"></Button>
          <Button type="button" label="Remove" severity="danger" :disabled="tournament.blinds.length <= 1" @click="removeBlind"></Button>
        </div>
      </template>
    </Dialog>

    <Dialog v-model:visible="showChipEditMenu" modal header="Edit Chip" :style="{ width: '25rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
      <template v-if="selectedChip">
        <div class="dialog-inner">
          <FloatLabel variant="on">
            <InputNumber v-model="selectedChip.value" input-id="on_label" :min="1" style="width:100%;" />
            <label for="on_label">Value</label>
          </FloatLabel>
          <label for="p-colour">Colour</label>
          <ColorPicker v-model="selectedChip.primarycolour" input-id="cp-hex" format="hex" />
        </div>
        <div class="btn-rack flex justify-end gap-2">
          <Button type="button" label="Save" @click="saveChipOptions"></Button>
          <Button type="button" label="Cancel" severity="secondary" @click="showChipEditMenu = false"></Button>
          <Button type="button" label="Remove" severity="danger" @click="removeChip"></Button>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  title: 'Configure Tournament',
  layout: 'default',
})

type SaveState = 'idle' | 'dirty' | 'saving' | 'saved' | 'error'

const store = useTournamentDataStore()

const tournament = ref<any>(null)
const loadError = ref('')
const saveState = ref<SaveState>('idle')
const saveError = ref('')

const showChipEditMenu = ref(false)
const showBlindEditMenu = ref(false)
const selectedChip = ref<any>(null)
const selectedChipIndex = ref(-1)
const selectedBlind = ref<any>(null)
const selectedBlindIndex = ref(-1)

let ready = false
let saving = false
let pendingSave = false
let debounceTimer: ReturnType<typeof setTimeout> | null = null

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v))
}

/** One leading '#', or the fallback if the value is not a hex colour. */
function hex(colour: unknown, fallback = '#ffffff'): string {
  const body = String(colour ?? '').replace(/^#+/, '')
  return /^[0-9a-fA-F]{3,8}$/.test(body) ? '#' + body : fallback
}

const locale = import.meta.client ? navigator.language : 'en-GB'

const currencyOptions = computed(() => {
  const options = CURRENCIES.map(c => ({ code: c.code, label: `${c.code} – ${c.name}` }))
  const current = tournament.value?.currency
  // Keep an unlisted code (set elsewhere) selectable instead of silently resetting it.
  if (current && !options.some(o => o.code === current)) options.push({ code: current, label: current })
  return options
})

// The buy-in is stored in minor units (pence); the input works in pounds / dollars / ...
const buyIn = computed<number>({
  get: () => toMajor(tournament.value?.money?.buyInMinor, tournament.value?.currency ?? DEFAULT_CURRENCY),
  set: (value) => { tournament.value.money.buyInMinor = toMinor(value, tournament.value.currency) }
})

const splitTotal = computed(() =>
  (tournament.value?.money?.split ?? []).reduce((sum: number, n: unknown) => sum + (Number(n) || 0), 0)
)

// ---------- loading ----------
async function load() {
  ready = false
  loadError.value = ''
  await store.fetchData()
  if (!store.data) {
    loadError.value = store.error || 'Could not load tournament'
    return
  }
  const t = clone(store.data)
  t.currency = t.currency || DEFAULT_CURRENCY
  t.money = { placesPaid: 3, split: [], ...t.money }
  if (t.money.buyInMinor == null) t.money.buyInMinor = toMinor(t.money.buyIn ?? 0, t.currency) // pre-minor-unit rows
  delete t.money.buyIn
  // Self-heal data written by the old editor (duplicate '#', gaps in level numbers).
  const seenIds = new Set<number>()
  let nextId = Math.max(-1, ...(t.chipset ?? []).map((c: any) => Number(c.id) || 0)) + 1
  t.chipset = (t.chipset ?? []).map((c: any) => {
    let id = Number(c.id)
    if (!Number.isInteger(id) || seenIds.has(id)) id = nextId++
    seenIds.add(id)
    return {
      ...c,
      id,
      primarycolour: hex(c.primarycolour, '#ff6633'),
      secondarycolour: hex(c.secondarycolour)
    }
  })
  t.blinds = (t.blinds ?? []).map((b: any, i: number) => ({ ...b, level: i }))
  tournament.value = t
  await nextTick()
  ready = true
  saveState.value = 'idle'
}

onMounted(load)

// ---------- auto-save ----------
function toPayload() {
  const t = clone(tournament.value)
  t.starting_stack = Number(t.starting_stack) || 0
  t.money.buyInMinor = Math.max(0, Math.round(Number(t.money.buyInMinor) || 0))
  t.money.split = t.money.split.map((n: unknown) => Number(n) || 0)
  t.blinds = t.blinds.map((b: any, i: number) => ({
    level: i,
    blinds: [Number(b.blinds[0]) || 0, Number(b.blinds[1]) || 0],
    level_length: Math.max(1, Number(b.level_length) || 1)
  }))
  t.chipset = t.chipset.map((c: any) => ({
    ...c,
    value: Math.max(1, Number(c.value) || 1),
    primarycolour: hex(c.primarycolour, '#ff6633'),
    secondarycolour: hex(c.secondarycolour)
  }))
  return t
}

async function saveNow() {
  if (!tournament.value) return
  if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null }
  if (saving) { pendingSave = true; return }

  saving = true
  saveState.value = 'saving'
  try {
    await $fetch('/api/savetournament', { method: 'POST', body: toPayload() })
    saveState.value = pendingSave ? 'dirty' : 'saved'
  } catch (err: any) {
    saveState.value = 'error'
    saveError.value = err?.data?.statusMessage || err?.statusMessage || err?.message || 'Unknown error'
  } finally {
    saving = false
    if (pendingSave) {
      pendingSave = false
      await saveNow()
    }
  }
}

watch(tournament, () => {
  if (!ready) return
  saveState.value = 'dirty'
  if (debounceTimer) clearTimeout(debounceTimer)
  debounceTimer = setTimeout(saveNow, 1000)
}, { deep: true })

// Switching currency keeps the same face value (10.00 GBP -> 10.00 USD), not the same number of minor units.
watch(() => tournament.value?.currency, (next, prev) => {
  if (!ready || !prev || !next || next === prev) return
  tournament.value.money.buyInMinor = toMinor(toMajor(tournament.value.money.buyInMinor, prev), next)
})

// Keep the payout list the same length as "places paid".
watch(() => tournament.value?.money?.placesPaid, (places) => {
  if (!ready || !Number.isInteger(places) || places < 1) return
  const split = tournament.value.money.split
  while (split.length < places) split.push(0)
  while (split.length > places) split.pop()
})

function warnBeforeLeaving(e: BeforeUnloadEvent) {
  if (saveState.value === 'dirty' || saveState.value === 'saving') {
    e.preventDefault()
    e.returnValue = ''
  }
}

onMounted(() => window.addEventListener('beforeunload', warnBeforeLeaving))
onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', warnBeforeLeaving)
  if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null }
  // Leaving the page with unsaved edits: flush them now.
  if (saveState.value === 'dirty') void saveNow()
})

// ---------- helpers ----------
function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

// ---------- chips ----------
function addChip() {
  const id = Math.max(-1, ...tournament.value.chipset.map((c: any) => Number(c.id) || 0)) + 1
  tournament.value.chipset.push({
    id,
    value: 100,
    primarycolour: "#ff6633",
    secondarycolour: "#ffffff",
    style: "round",
    visible: true
  })
}

function openChipEdit(index: number) {
  selectedChipIndex.value = index
  selectedChip.value = clone(tournament.value.chipset[index])
  showChipEditMenu.value = true
}

function saveChipOptions() {
  if (selectedChip.value && selectedChipIndex.value >= 0) {
    const chip = selectedChip.value
    chip.primarycolour = hex(chip.primarycolour, '#ff6633')
    chip.secondarycolour = hex(chip.secondarycolour)
    tournament.value.chipset[selectedChipIndex.value] = chip
  }
  showChipEditMenu.value = false
}

function removeChip() {
  if (selectedChipIndex.value >= 0) tournament.value.chipset.splice(selectedChipIndex.value, 1)
  showChipEditMenu.value = false
}

// ---------- blinds ----------
function renumberBlinds() {
  tournament.value.blinds.forEach((b: any, i: number) => { b.level = i })
}

function addBlind() {
  const blinds = tournament.value.blinds
  const last = blinds[blinds.length - 1] ?? { blinds: [100, 200], level_length: 20 }
  blinds.push({
    level: blinds.length,
    blinds: [last.blinds[0], last.blinds[1]],
    level_length: last.level_length
  })
}

function openBlindEdit(index: number) {
  selectedBlindIndex.value = index
  selectedBlind.value = clone(tournament.value.blinds[index])
  showBlindEditMenu.value = true
}

function saveBlindOptions() {
  if (selectedBlind.value && selectedBlindIndex.value >= 0) {
    tournament.value.blinds[selectedBlindIndex.value] = { ...selectedBlind.value, level: selectedBlindIndex.value }
  }
  showBlindEditMenu.value = false
}

function removeBlind() {
  if (tournament.value.blinds.length > 1 && selectedBlindIndex.value >= 0) {
    tournament.value.blinds.splice(selectedBlindIndex.value, 1)
    renumberBlinds()
  }
  showBlindEditMenu.value = false
}
</script>

<style lang="css" scoped>
  .chip-rack {
    display: flex;
    overflow: scroll;
    gap: 10px;
  }

  .add-container {
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .add-item {
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: transparent;
    color: #8c8b8b;
    line-height: 50px;
    font-size: 25px;
    border: 5px solid #414141;
    border-radius: 50%;
    min-width: 50px;
    width: 50px;
    height: 50px;
    cursor: pointer;
  }

  .dialog-inner {
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 10px 0;
    margin-bottom: 10px;
  }

  .split-place {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 40px;
  }

  .edit-blind {
    cursor: pointer;
  }

  .setup-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
  }

  .save-status {
    font-size: 14px;
    color: #8c8b8b;
  }

  .save-status.saved { color: #1ba673; }
  .save-status.error { color: #e5484d; }

  .split-total { color: #1ba673; }
  .split-total.split-bad { color: #e5484d; }

  .state-msg {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    margin-top: 40px;
  }
</style>
