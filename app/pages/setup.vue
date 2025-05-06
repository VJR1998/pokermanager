<template>
  <div class="card main-form" v-if="tournament">
    <h3>Tournament Setup</h3>

    <!-- DETAILS -->
    <FloatLabel variant="on">
        <InputText id="title" v-model="tournament.title" style="width:100%;" />
        <label for="title">Title</label>
    </FloatLabel>
    <FloatLabel variant="on">
        <Textarea id="description" v-model="tournament.description" rows="5" cols="30" style="resize: none; width: 100%;" />
        <label for="description">Description</label>
    </FloatLabel>
    <FloatLabel variant="on">
        <InputText id="starting" v-model="tournament.starting_stack" style="width:100%;" />
        <label for="starting">Starting Stack</label>
    </FloatLabel>

    <!-- CHIPS -->
    <h4>Chips</h4>
    <div class="chip-rack">
      <template v-for="chip in tournament.chipset">
        <div class="chip" v-if="chip.visible">
          <PokerChip style="cursor: pointer;" :chip-value="chip.value" :primary-colour="chip.primarycolour" :secondary-colour="chip.secondarycolour" @click="toggleChipEditMenu(chip)"></PokerChip>
        </div>
      </template>
      <div class="add-item" @click="addChip">
        <i class="pi pi-plus"></i>
      </div>
    </div>

    <!-- BLINDS -->
    <h4>Blinds Schedule</h4>
    <template v-for="(level, idx) in tournament.blinds">
      <div class="btn-rack">
        <label style="width: 15%;">{{ level.level + 1 }}</label>
        <InputNumber id="sb" v-model="tournament.blinds[level.level].blinds[0]" inputId="horizontal-buttons" showButtons buttonLayout="horizontal" :step="50" fluid>
            <template #incrementicon>
                <span class="pi pi-plus" />
            </template>
            <template #decrementicon>
                <span class="pi pi-minus" />
            </template>
        </InputNumber>
        <InputNumber id="bb" v-model="tournament.blinds[level.level].blinds[1]" inputId="horizontal-buttons" showButtons buttonLayout="horizontal" :step="50" fluid>
            <template #incrementicon>
                <span class="pi pi-plus" />
            </template>
            <template #decrementicon>
                <span class="pi pi-minus" />
            </template>
        </InputNumber>
        <span class="edit-blind pi pi-pen-to-square" @click="toggleBlindEditMenu(level)"></span>
      </div>
    </template>
    <div class="add-container">
      <div class="add-item" @click="addBlind">
        <i class="pi pi-plus"></i>
      </div>
    </div>
    
    <!-- MONEY -->
    <h4>Money & Prizes</h4>
    <label for="buyin">Buy-in</label>
    <InputGroup id="buyin">
      <InputGroupAddon>£</InputGroupAddon>
      <InputNumber v-model="tournament.money.buyIn" placeholder="Buy-in" />
      <InputGroupAddon>.00</InputGroupAddon>
    </InputGroup>
    
    <label for="places">Places Paid</label>
    <InputNumber id="places" v-model="tournament.money.placesPaid" inputId="horizontal-buttons" showButtons buttonLayout="horizontal" :step="1" fluid>
        <template #incrementicon>
            <span class="pi pi-plus" @click="addSplit" />
        </template>
        <template #decrementicon>
            <span class="pi pi-minus" @click="removeSplit" />
        </template>
    </InputNumber>

    <label for="split">Split</label>
    <template v-for="(place, idx) in tournament.money.split" :key="tournament.money.split">
      <div class="btn-rack">
        <div class="split-place">{{ ordinal(idx + 1) }}</div>
        <InputNumber id="split" v-model="tournament.money.split[idx]" inputId="horizontal-buttons" showButtons buttonLayout="horizontal" :step="1" suffix="%" fluid>
            <template #incrementicon>
                <span class="pi pi-plus" />
            </template>
            <template #decrementicon>
                <span class="pi pi-minus" />
            </template>
        </InputNumber>
      </div>
    </template>

    <!-- SEATING -->
    <h4>Seating</h4>
    <div class="btn-rack">
      <ToggleSwitch id="seating_enabled" v-model="tournament.seating.enabled" />
      <label for="seating_enabled">Enable Seating</label>
    </div>
    <div class="btn-rack" :disabled="!tournament.seating.enabled">
      <label style="width:70%;">Seats (Per Table)</label>
      <InputNumber id="seats" v-model="tournament.seating.seats" inputId="horizontal-buttons" showButtons buttonLayout="horizontal" :step="1" fluid>
          <template #incrementicon>
              <span class="pi pi-plus" />
          </template>
          <template #decrementicon>
              <span class="pi pi-minus" />
          </template>
      </InputNumber>
    </div>

    <Dialog v-model:visible="showBlindEditMenu" modal header="Edit Blind Level" :style="{ width: '25rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
      <div class="dialog-inner">
        <label for="smallblind">Small Blind</label>
        <InputNumber id="smallblind" v-model="selectedBlindLevel.blinds[0]" style="margin-bottom: 10px;" inputId="horizontal-buttons" showButtons buttonLayout="horizontal" :step="50" fluid>
            <template #incrementicon>
                <span class="pi pi-plus" />
            </template>
            <template #decrementicon>
                <span class="pi pi-minus" />
            </template>
        </InputNumber>
        <label for="bigblind">Big Blind</label>
        <InputNumber id="bigblind" v-model="selectedBlindLevel.blinds[1]" style="margin-bottom: 10px;" inputId="horizontal-buttons" showButtons buttonLayout="horizontal" :step="50" fluid>
            <template #incrementicon>
                <span class="pi pi-plus" />
            </template>
            <template #decrementicon>
                <span class="pi pi-minus" />
            </template>
        </InputNumber>
        <label for="level-length">Level Length</label>
        <InputNumber id="level-length" v-model="selectedBlindLevel.level_length" suffix=" minutes" inputId="horizontal-buttons" showButtons buttonLayout="horizontal" :step="5" fluid>
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
        <Button type="button" label="Cancel" severity="secondary" @click="toggleBlindEditMenu"></Button>
        <Button type="button" label="Remove" severity="danger" @click="removeBlind"></Button>
      </div>
    </Dialog>

    <Dialog v-model:visible="showChipEditMenu" modal header="Edit Chip" :style="{ width: '25rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
      <div class="dialog-inner">
        <FloatLabel variant="on">
          <InputNumber id="on_label" v-model="selectedChip.value" style="width:100%;" />
          <label for="on_label">Value</label>
        </FloatLabel>
        <label for="p-colour">Colour</label>
        <ColorPicker id="p-colour" inputId="cp-hex" format="hex" v-model="selectedChip.primarycolour" />
        <!-- <label for="s-colour">Secondary Colour</label> -->
        <!-- <ColorPicker id="s-colour" inputId="cp-hex" format="hex" v-model="selectedChip.secondarycolour" /> -->
      </div>
      <div class="btn-rack flex justify-end gap-2">
        <Button type="button" label="Save" @click="saveChipOptions"></Button>
        <Button type="button" label="Cancel" severity="secondary" @click="toggleChipEditMenu"></Button>
        <Button type="button" label="Remove" severity="danger" @click="removeChip"></Button>
      </div>
    </Dialog>
  </div>
</template>

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
</style>

<!-- <script setup>
const { data } = await useFetch('/api/tournaments');

let tournament = data.value[0];
console.log(tournament);

</script> -->

<script>
import { reactive, watch } from 'vue'

export default {
  definePageMeta: {
    title: 'Configure Tournament',
    layout: 'default',
    middleware: ['authenticated'],
  },
  data() {
    return {
      showChipEditMenu: false,
      showBlindEditMenu: false,
      loading: false,
      selectedChip: null,
      selectedBlindLevel: null,
      tournament: null,
      debounceTimer: null,
    }
  },
  async mounted() {
    const { user, clear: clearSession } = useUserSession();

    const tournament = useTournamentDataStore();
    this.tournament = reactive(tournament.data);
    console.log(this.tournament);

    watch(this.tournament, () => {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = setTimeout(() => {
        this.saveTournament();
      }, 1000);
    }, { deep: true })
  },
  methods: {
    ordinal(n) {
      const s = ["th", "st", "nd", "rd"],
      v = n % 100;
      return n + (s[(v - 20) % 10] || s[v] || s[0]);
    },
    addChip() {
      let id = this.tournament.chipset.length;
      this.tournament.chipset.push({
        id: id,
        value: 100,
        primarycolour: "#ff6633",
        secondarycolour: "#fff",
        style: "round",
        visible: true
      });
    },
    removeChip() {
      let index = this.tournament.chipset.findIndex(fchip => fchip.id == this.selectedChip.id);
      this.tournament.chipset.splice(index, 1);
      this.showChipEditMenu = false;
    },
    toggleChipEditMenu(chip) {
      this.showChipEditMenu = !this.showChipEditMenu;
      if (this.showChipEditMenu) {
        this.selectedChip = JSON.parse(JSON.stringify(chip));
      } else {
        this.selectedChip = null;
      }
    },
    saveChipOptions() {
      this.showChipEditMenu = false;
      if(!this.selectedChip.primarycolour.startsWith('#')) {
        this.selectedChip.primarycolour = '#' + this.selectedChip.primarycolour;
      }
      this.selectedChip.secondarycolour = '#' + this.selectedChip.secondarycolour;

      this.tournament.chipset[this.selectedChip.id] = this.selectedChip;
      this.selectedChip = null;
    },
    addBlind() {
      this.tournament.blinds.push({
        level: this.tournament.blinds.length,
        blinds: [this.tournament.blinds.slice(-1)[0].blinds[0], this.tournament.blinds.slice(-1)[0].blinds[1]],
        level_length: this.tournament.blinds.slice(-1)[0].level_length
      });
    },
    removeBlind() {
      let index = this.tournament.blinds.findIndex(fblind => fblind.level == this.selectedBlindLevel.level);
      this.tournament.blinds.splice(index, 1);
      this.showBlindEditMenu = false;
    },
    toggleBlindEditMenu(level) {
      this.showBlindEditMenu = !this.showBlindEditMenu;
      if (this.showBlindEditMenu) {
        this.selectedBlindLevel = JSON.parse(JSON.stringify(level));
      } else {
        this.selectedBlindLevel = null;
      }
    },
    saveBlindOptions() {
      this.showBlindEditMenu = false;
      this.tournament.blinds[this.selectedBlindLevel.level] = this.selectedBlindLevel;
      this.selectedBlindLevel = null;
    },
    addSplit() {
      this.tournament.money.split.push(0);
    },
    removeSplit() {
      this.tournament.money.split.pop();
    },
    async saveTournament() {
      console.log('Auto-saving form:', this.tournament);
      // Put your saving logic here: API call, localStorage, etc.
      const res = await $fetch('/api/savetournament', {
        method: 'POST',
        body: this.tournament
      })

      console.log(res);
    }
  }
}
</script>