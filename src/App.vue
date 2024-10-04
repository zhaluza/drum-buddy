<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import * as Tone from "tone";
import kick from "./assets/kick.wav";
import snare from "./assets/snare.wav";
import hihat from "./assets/hihat.wav";

// Define the drum types
type DrumType = "kick" | "snare" | "hihat";

// Create a 2D array to represent the sequencer grid
const sequencerGrid = ref<boolean[][]>(
  Array(3)
    .fill(null)
    .map(() => Array(16).fill(false))
);

// Create refs for tempo and volume
const tempo = ref(120);
const volume = ref(-10);

// Create a ref for the current playing state
const isPlaying = ref(false);
const isLoaded = ref(false);

// Create Tone.js players for each drum sound
const players = {
  kick: new Tone.Player(kick).toDestination(),
  snare: new Tone.Player(snare).toDestination(),
  hihat: new Tone.Player(hihat).toDestination(),
};

// Create a Tone.js sequence
let sequence: Tone.Sequence<DrumType>;

onMounted(async () => {
  // Load audio files
  await Tone.loaded();
  await Promise.all([
    players.kick.load(kick),
    players.snare.load(snare),
    players.hihat.load(hihat),
  ]);

  isLoaded.value = true;

  // Initialize the sequence
  sequence = new Tone.Sequence<DrumType>(
    (time, step) => {
      sequencerGrid.value.forEach((row, index) => {
        if (row[step]) {
          const drumType = ["kick", "snare", "hihat"][index] as DrumType;
          players[drumType].start(time);
        }
      });
    },
    Array(16)
      .fill(0)
      .map((_, i) => i),
    "16n"
  );
});

onUnmounted(() => {
  // Clean up Tone.js resources
  sequence?.dispose();
  Object.values(players).forEach((player) => player.dispose());
});

// Function to toggle a cell in the sequencer grid
const toggleCell = (row: number, col: number) => {
  sequencerGrid.value[row][col] = !sequencerGrid.value[row][col];
};

// Function to start/stop the sequence
const togglePlay = async () => {
  if (!isLoaded.value) return;

  if (isPlaying.value) {
    await Tone.Transport.stop();
    sequence.stop();
  } else {
    await Tone.start();
    Tone.Transport.bpm.value = tempo.value;
    sequence.start(0);
    Tone.Transport.start();
  }
  isPlaying.value = !isPlaying.value;
};

// Function to update tempo
const updateTempo = () => {
  Tone.Transport.bpm.value = tempo.value;
};

// Function to update volume
const updateVolume = () => {
  Tone.Destination.volume.value = volume.value;
};
</script>

<template>
  <div class="container mx-auto p-4">
    <h1 class="text-3xl font-bold mb-4">Drum Sequencer</h1>

    <div class="mb-4">
      <button
        @click="togglePlay"
        class="bg-blue-500 text-white px-4 py-2 rounded"
      >
        {{ isPlaying ? "Stop" : "Play" }}
      </button>
    </div>

    <div class="mb-4">
      <label class="block">
        Tempo: {{ tempo }} BPM
        <input
          type="range"
          v-model="tempo"
          min="60"
          max="200"
          @input="updateTempo"
          class="w-full"
        />
      </label>
    </div>

    <div class="mb-4">
      <label class="block">
        Volume: {{ volume }} dB
        <input
          type="range"
          v-model="volume"
          min="-40"
          max="0"
          step="0.1"
          @input="updateVolume"
          class="w-full"
        />
      </label>
    </div>

    <div class="sequencer-grid">
      <div
        v-for="(row, rowIndex) in sequencerGrid"
        :key="rowIndex"
        class="flex mb-2"
      >
        <div class="w-20 font-bold">
          {{ ["Kick", "Snare", "Hi-hat"][rowIndex] }}
        </div>
        <div
          v-for="(cell, colIndex) in row"
          :key="colIndex"
          @click="toggleCell(rowIndex, colIndex)"
          class="w-8 h-8 border border-gray-300 cursor-pointer"
          :class="{ 'bg-blue-500': cell }"
        ></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add any additional styles here */
</style>
