<template>
    <div class="card main-form" v-if="players">
        <h3>Player Database</h3>

        <!-- PlayerS -->
        <h4>Players</h4>
        <template v-for="(player, idx) in players">
            <div class="btn-rack">
                <FloatLabel variant="on" style="width: 100%">
                    <InputText id="title" v-model="player.name" style="width: 100%" />
                    <label for="title">Name</label>
                </FloatLabel>
                <span class="edit-player pi pi-times" @click="removePlayer(player)"></span>
            </div>
        </template>
        <div class="add-container">
            <div class="add-item" @click="addPlayer()">
                <i class="pi pi-plus"></i>
            </div>
        </div>

        <!-- <Dialog v-model:visible="showPlayerEditMenu" modal header="Edit Player Level" :style="{width: '25rem'}"
            :breakpoints="{'1199px': '75vw', '575px': '90vw'}">
            <div class="dialog-inner">
                <label for="smallPlayer">Small Player</label>
                <InputNumber id="smallPlayer" v-model="selectedPlayerLevel.Players[0]" style="margin-bottom: 10px"
                    inputId="horizontal-buttons" showButtons buttonLayout="horizontal" :step="50" fluid>
                    <template #incrementicon>
                        <span class="pi pi-plus" />
                    </template>
                    <template #decrementicon>
                        <span class="pi pi-minus" />
                    </template>
                </InputNumber>
                <label for="bigPlayer">Big Player</label>
                <InputNumber id="bigPlayer" v-model="selectedPlayerLevel.Players[1]" style="margin-bottom: 10px"
                    inputId="horizontal-buttons" showButtons buttonLayout="horizontal" :step="50" fluid>
                    <template #incrementicon>
                        <span class="pi pi-plus" />
                    </template>
                    <template #decrementicon>
                        <span class="pi pi-minus" />
                    </template>
                </InputNumber>
                <label for="level-length">Level Length</label>
                <InputNumber id="level-length" v-model="selectedPlayerLevel.level_length" suffix=" minutes"
                    inputId="horizontal-buttons" showButtons buttonLayout="horizontal" :step="5" fluid>
                    <template #incrementicon>
                        <span class="pi pi-plus" />
                    </template>
                    <template #decrementicon>
                        <span class="pi pi-minus" />
                    </template>
                </InputNumber>
            </div>
            <div class="btn-rack flex justify-end gap-2">
                <Button type="button" label="Save" @click="savePlayer"></Button>
                <Button type="button" label="Cancel" severity="secondary" @click="togglePlayerEditMenu"></Button>
                <Button type="button" label="Remove" severity="danger" @click="removePlayer"></Button>
            </div>
        </Dialog> -->
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

.edit-player {
    cursor: pointer;
}
</style>

<!-- <script setup>
const { data } = await useFetch('/api/tournaments');

let tournament = data.value[0];
console.log(tournament);

</script> -->

<script>
import { reactive, watch } from 'vue';
import { v4 as uuidv4 } from 'uuid';

export default {
    definePageMeta: {
        title: 'Player Database',
        layout: 'default',
    },
    data() {
        return {
            debounceTimer: null,
            showPlayerEditMenu: false,
            selectedPlayer: null,
            players: [
                {
                    id: 0,
                    name: "Vince",
                }
            ]
        }
    },
    mounted() {
        if (localStorage.getItem("players")) {
          this.players = JSON.parse(localStorage.getItem("players"));
        }

        watch(this.players, () => {
            clearTimeout(this.debounceTimer);
            this.debounceTimer = setTimeout(() => {
                this.savePlayerList();
            }, 1000);
        }, { deep: true })
    },
    methods: {
        addPlayer() {
            this.players.push({
                id: uuidv4(),
                name: "",
            });
        },
        removePlayer(player) {
            if (player) this.selectedPlayer = player;
            let index = this.players.findIndex(fplayer => fplayer.id == this.selectedPlayer.id);
            this.players.splice(index, 1);
            this.showPlayerEditMenu = false;
        },
        togglePlayerEditMenu(player) {
            this.showPlayerEditMenu = !this.showPlayerEditMenu;
            if (this.showPlayerEditMenu) {
                this.selectedPlayer = JSON.parse(JSON.stringify(player));
            } else {
                this.selectedPlayer = null;
            }
        },
        savePlayer() {
            this.showPlayerEditMenu = false;
            let index = this.players.findIndex(fplayer => fplayer.id == this.selectedPlayer.id);
            this.players[index] = this.selectedPlayer;
            this.selectedPlayer = null;
        },
        savePlayerList() {
            console.log('Auto-saving form:', this.players);

            localStorage.setItem("players", JSON.stringify(this.players));
        }
    }
}
</script>
