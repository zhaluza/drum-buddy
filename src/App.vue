<script setup>
import { ref, onMounted, onUnmounted } from "vue";
import * as Tone from "tone";
import beatPresets from "./beatPresets";
import kick from "./assets/kick.wav";
import snare from "./assets/snare.wav";
import hihat from "./assets/hihat.wav";

const sequencerGrid = ref(
  Array(3)
    .fill(null)
    .map(() => Array(16).fill(false))
);

const tempo = ref(120);
const volume = ref(-10);

const isPlaying = ref(false);
const isLoaded = ref(false);

const players = {
  kick: new Tone.Player(kick).toDestination(),
  snare: new Tone.Player(snare).toDestination(),
  hihat: new Tone.Player(hihat).toDestination(),
};

let sequence;

const currentPreset = ref("basic");

const applyBeatPreset = (preset) => {
  sequencerGrid.value = JSON.parse(JSON.stringify(beatPresets[preset]));
  currentPreset.value = preset;
};

const resetSequencer = () => {
  sequencerGrid.value = Array(3)
    .fill(null)
    .map(() => Array(16).fill(false));
  currentPreset.value = "basic";
};

const isDarkMode = ref(false);

const toggleDarkMode = () => {
  isDarkMode.value = !isDarkMode.value;
  document.documentElement.classList.toggle("dark", isDarkMode.value);
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
  sequence = new Tone.Sequence(
    (time, step) => {
      sequencerGrid.value.forEach((row, index) => {
        if (row[step]) {
          const drumType = ["kick", "snare", "hihat"][index];
          players[drumType].start(time);
        }
      });
    },
    Array(16)
      .fill(null)
      .map((_, i) => i),
    "16n"
  );

  // Apply the basic beat preset on page load
  applyBeatPreset("basic");

  // Check system preference for dark mode
  if (
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    isDarkMode.value = true;
    document.documentElement.classList.add("dark");
  }
});

onUnmounted(() => {
  // Clean up Tone.js resources
  sequence?.dispose();
  Object.values(players).forEach((player) => player.dispose());
});

// Toggle a cell in the sequencer grid
const toggleCell = (row, col) => {
  sequencerGrid.value[row][col] = !sequencerGrid.value[row][col];
};

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

const updateTempo = () => {
  Tone.Transport.bpm.value = tempo.value;
};

const updateVolume = () => {
  Tone.Destination.volume.value = volume.value;
};
</script>

<template>
  <div
    :class="[
      'min-h-screen transition-colors duration-300',
      isDarkMode
        ? 'dark bg-gray-800 text-gray-100'
        : 'bg-gray-100 text-gray-800',
    ]"
  >
    <div class="container mx-auto p-4">
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-4xl font-bold text-blue-500 dark:text-blue-400">
          Drum Buddy
        </h1>
        <button
          @click="toggleDarkMode"
          class="p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            class="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
            />
          </svg>
        </button>
      </div>

      <div class="mb-6 flex space-x-4">
        <button
          @click="togglePlay"
          :class="[
            'px-6 py-2 rounded-lg text-lg font-semibold transition duration-300 text-white',
            isPlaying
              ? 'bg-indigo-500 dark:bg-indigo-600 hover:bg-indigo-600 dark:hover:bg-indigo-500'
              : 'bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500',
          ]"
        >
          {{ isPlaying ? "Stop" : "Play" }}
        </button>
        <button
          @click="resetSequencer"
          class="bg-gray-400 dark:bg-gray-600 hover:bg-gray-500 dark:hover:bg-gray-500 text-white px-6 py-2 rounded-lg text-lg font-semibold transition duration-300"
        >
          Reset
        </button>
      </div>

      <div class="mb-6 flex items-center">
        <label class="block mr-4 w-24"> Tempo: {{ tempo }} </label>
        <input
          type="range"
          v-model="tempo"
          min="60"
          max="200"
          @input="updateTempo"
          class="w-48 accent-blue-500 dark:accent-blue-400"
        />
      </div>

      <div class="mb-6 flex items-center">
        <label class="block mr-4 w-24"> Volume: {{ volume }} </label>
        <input
          type="range"
          v-model="volume"
          min="-40"
          max="0"
          step="0.1"
          @input="updateVolume"
          class="w-48 accent-blue-500 dark:accent-blue-400"
        />
      </div>

      <!-- Beat preset buttons -->
      <div class="mb-6 flex flex-wrap gap-2">
        <button
          v-for="preset in Object.keys(beatPresets)"
          :key="preset"
          @click="applyBeatPreset(preset)"
          :class="[
            'px-4 py-2 rounded-lg text-white font-semibold transition duration-300',
            preset === currentPreset
              ? 'bg-indigo-500 dark:bg-indigo-600'
              : 'bg-blue-500 dark:bg-blue-600 hover:bg-blue-600 dark:hover:bg-blue-500',
          ]"
        >
          {{ preset.charAt(0).toUpperCase() + preset.slice(1) }} Beat
        </button>
      </div>

      <div
        class="sequencer-grid bg-white dark:bg-gray-700 p-4 rounded-lg shadow-md"
      >
        <div
          v-for="(row, rowIndex) in sequencerGrid"
          :key="rowIndex"
          class="flex mb-2"
        >
          <div class="w-20 font-bold text-blue-500 dark:text-blue-400">
            {{ ["Kick", "Snare", "Hi-hat"][rowIndex] }}
          </div>
          <div
            v-for="(cell, colIndex) in row"
            :key="colIndex"
            @click="toggleCell(rowIndex, colIndex)"
            :class="[
              'w-8 h-8 border cursor-pointer transition duration-150',
              cell
                ? 'bg-indigo-500 dark:bg-indigo-600'
                : 'hover:bg-gray-200 dark:hover:bg-gray-600',
              'border-gray-300 dark:border-gray-500',
              (colIndex + 1) % 4 === 0
                ? 'border-r-2 border-r-gray-400 dark:border-r-gray-400'
                : '',
            ]"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>
