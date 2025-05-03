<template>
  <div class="card main-form">
    <h3>Tournament Setup</h3>
    <FloatLabel variant="on">
        <InputText id="on_label" v-model="settings.title" style="width:100%;" />
        <label for="on_label">Title</label>
    </FloatLabel>
    <FloatLabel variant="on">
        <InputText id="on_label" v-model="settings.starting" style="width:100%;" />
        <label for="on_label">Starting Stack</label>
    </FloatLabel>
    <h4>Chips</h4>
    <div class="chip-rack">
      <template v-for="chip in settings.chips">
        <div class="chip" v-if="chip.visible">
          <PokerChip style="cursor: pointer;" :chip-value="chip.value" :primary-colour="chip.primarycolour" :secondary-colour="chip.secondarycolour" @click="toggleChipEditMenu(chip)"></PokerChip>
        </div>
      </template>
      <div class="add-chip">
        <i class="pi pi-plus"></i>
      </div>
    </div>
    <Dialog v-model:visible="showChipEditMenu" modal header="Edit Chip" :style="{ width: '25rem' }" :breakpoints="{ '1199px': '75vw', '575px': '90vw' }">
      <div class="dialog-inner">
        <FloatLabel variant="on">
          <InputNumber id="on_label" v-model="selectedChip.value" style="width:100%;" />
          <label for="on_label">Value</label>
        </FloatLabel>
        <label for="p-colour">Primary Colour</label>
        <ColorPicker id="p-colour" inputId="cp-hex" format="hex" v-model="selectedChip.primarycolour" />
        <label for="s-colour">Secondary Colour</label>
        <ColorPicker id="s-colour" inputId="cp-hex" format="hex" v-model="selectedChip.secondarycolour" />
      </div>
      <div class="btn-rack flex justify-end gap-2">
        <Button type="button" label="Cancel" severity="secondary" @click="toggleChipEditMenu"></Button>
        <Button type="button" label="Save" @click="saveChipOptions"></Button>
      </div>
  </Dialog>
  </div>
</template>

<style lang="css" scoped>
  .chip-rack {
    display: flex;
    gap: 10px;
  }

  .add-chip {
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: #cdcdcd;
    color: #8c8b8b;
    line-height: 50px;
    font-size: 25px;
    border: 5px solid rgb(177, 177, 177);
    border-radius: 50%;
    min-width: 50px;
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
</style>

<script>
definePageMeta({
  title: 'Configure Tournament'
})

export default {
  data() {
    return {
      showChipEditMenu: false,
      selectedChip: null,
      settings: {
        title: "Poker Tournament",
        starting: 30000,
        chips: [
            {
              id: 0,
              value: 100,
              primarycolour: "#ff6633",
              secondarycolour: "#fff",
              style: "round",
              visible: true
            },
            {
              id: 1,
              value: 500,
              primarycolour: "#2c3541",
              secondarycolour: "#fff",
              style: "round",
              visible: true
            },
            {
              id: 2,
              value: 1000,
              primarycolour: "#ff6633",
              secondarycolour: "#fff",
              style: "round",
              visible: true
            },
            {
              id: 3,
              value: 5000,
              primarycolour: "#ff6633",
              secondarycolour: "#fff",
              style: "round",
              visible: true
            },
            {
              id: 4,
              value: 10000,
              primarycolour: "#ff6633",
              secondarycolour: "#fff",
              style: "round",
              visible: true
            },
        ],
        blinds: [
          {
            level: 0,
            blinds: [100, 200],
            length: 30,
          },
          {
            level: 1,
            blinds: [200, 400],
            length: 15,
          },
          {
            level: 2,
            blinds: [300, 600],
            length: 15,
          },
          {
            level: 3,
            blinds: [400, 800],
            length: 15,
          },
          {
            level: 4,
            blinds: [500, 1000],
            length: 15,
          },
          {
            level: 5,
            blinds: [600, 1200],
            length: 15,
          },
          {
            level: 6,
            blinds: [800, 1600],
            length: 15,
          },
          {
            level: 7,
            blinds: [1000, 2000],
            length: 15,
          },
          {
            level: 8,
            blinds: [1500, 3000],
            length: 15,
          },
          {
            level: 9,
            blinds: [2000, 4000],
            length: 15,
          },
          {
            level: 10,
            blinds: [3000, 6000],
            length: 15,
          },
        ],
        money: {
          buyIn: 10,
          placesPaid: 2,
          split: [60, 40]
        },
        seating: {
          tables: 1,
          seats: 6
        }
      }
    }
  },
  methods: {
    toggleChipEditMenu(chip) {
      this.showChipEditMenu = !this.showChipEditMenu;
      if (this.showChipEditMenu) {
        this.selectedChip = chip;
      } else {
        this.selectedChip = null;
      }
    },
    saveChipOptions() {
      this.showChipEditMenu = false;
      this.selectedChip.primarycolour = '#' + this.selectedChip.primarycolour;
      this.selectedChip.secondarycolour = '#' + this.selectedChip.secondarycolour;

      this.settings.chips[this.selectedChip.id] = this.selectedChip;
      // this.selectedChip = null;
    }
  }
}
</script>