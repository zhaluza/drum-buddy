<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from "vue";
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

// Add beat presets
const beatPresets = {
  basic: [
    [
      true,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
    ],
    [
      false,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
    ],
    [
      true,
      false,
      true,
      false,
      true,
      false,
      true,
      false,
      true,
      false,
      true,
      false,
      true,
      false,
      true,
      false,
    ],
  ],
  synthwave: [
    [
      true,
      true,
      false,
      false,
      false,
      false,
      true,
      false,
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ],
    [
      false,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
    ],
    [
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
    ],
  ],
  funk: [
    [
      true,
      false,
      false,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      false,
      false,
    ],
    [
      false,
      false,
      false,
      false,
      true,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      true,
      false,
      false,
      true,
    ],
    [
      true,
      false,
      true,
      true,
      true,
      false,
      true,
      true,
      true,
      false,
      true,
      true,
      true,
      false,
      true,
      false,
    ],
  ],
};

// Add a ref for the current preset
const currentPreset = ref<keyof typeof beatPresets>("basic");

// Function to apply a beat preset
const applyBeatPreset = (preset: keyof typeof beatPresets) => {
  sequencerGrid.value = JSON.parse(JSON.stringify(beatPresets[preset]));
  currentPreset.value = preset;
};

// Add a new function to reset the sequencer
const resetSequencer = () => {
  sequencerGrid.value = Array(3)
    .fill(null)
    .map(() => Array(16).fill(false));
  currentPreset.value = null;
};

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

  // Apply the basic beat preset on page load
  applyBeatPreset("basic");
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
  <div class="container mx-auto p-4 bg-blue-100">
    <h1 class="text-4xl font-bold mb-6 text-blue-800">Drum Sequencer</h1>

    <div class="mb-6 flex space-x-4">
      <button
        @click="togglePlay"
        class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-lg font-semibold transition duration-300"
      >
        {{ isPlaying ? "Stop" : "Play" }}
      </button>
      <button
        @click="resetSequencer"
        class="bg-blue-400 hover:bg-blue-500 text-white px-6 py-2 rounded-lg text-lg font-semibold transition duration-300"
      >
        Reset
      </button>
    </div>

    <div class="mb-6 flex items-center">
      <label class="block mr-4 w-24 text-blue-700"> Tempo: {{ tempo }} </label>
      <input
        type="range"
        v-model="tempo"
        min="60"
        max="200"
        @input="updateTempo"
        class="w-48"
      />
    </div>

    <div class="mb-6 flex items-center">
      <label class="block mr-4 w-24 text-blue-700">
        Volume: {{ volume }}
      </label>
      <input
        type="range"
        v-model="volume"
        min="-40"
        max="0"
        step="0.1"
        @input="updateVolume"
        class="w-48"
      />
    </div>

    <!-- Beat preset buttons -->
    <div class="mb-6">
      <button
        v-for="preset in Object.keys(beatPresets)"
        :key="preset"
        @click="applyBeatPreset(preset as keyof typeof beatPresets)"
        class="px-4 py-2 rounded-lg mr-2 text-white font-semibold transition duration-300"
        :class="{
          'bg-blue-500 hover:bg-blue-600': preset !== currentPreset,
          'bg-blue-700': preset === currentPreset,
        }"
      >
        {{ preset.charAt(0).toUpperCase() + preset.slice(1) }} Beat
      </button>
    </div>

    <div class="sequencer-grid bg-white p-4 rounded-lg shadow-md">
      <div
        v-for="(row, rowIndex) in sequencerGrid"
        :key="rowIndex"
        class="flex mb-2"
      >
        <div class="w-20 font-bold text-blue-700">
          {{ ["Kick", "Snare", "Hi-hat"][rowIndex] }}
        </div>
        <div
          v-for="(cell, colIndex) in row"
          :key="colIndex"
          @click="toggleCell(rowIndex, colIndex)"
          class="w-8 h-8 border border-indigo-300 cursor-pointer transition duration-150"
          :class="{
            'bg-indigo-500': cell,
            'hover:bg-indigo-200': !cell,
            'border-r-2 border-r-indigo-400': (colIndex + 1) % 4 === 0,
          }"
        ></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Add any additional styles here */
</style>
