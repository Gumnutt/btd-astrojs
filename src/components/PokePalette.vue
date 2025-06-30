<template>
  <aside class="pokemon-palette" id="pokemon-palette" popover>
    <div style="position: relative">
      <input
        v-model="pokemonName"
        @input="onPokemonInput"
        :disabled="isLoading"
        placeholder="Enter Pokémon name"
        @focus="showDropdown = true"
        @blur="onInputBlur"
        autocomplete="off"
        @keyup.enter="pokemonName.trim() && selectPokemon(pokemonName.trim())"
      />
      <ul v-if="showDropdown || filteredPokemonNames.length > 0" class="autocomplete-dropdown">
        <li v-for="(name, idx) in filteredPokemonNames" :key="name" @mousedown.prevent="selectPokemon(name)" @mouseenter="highlightedIdx = idx">
          {{ name }}
        </li>
      </ul>
    </div>
    <div v-if="isLoading">Loading...</div>
    <div v-if="errorMessage" style="color: red; margin-top: 5px">{{ errorMessage }}</div>
    <img :src="spriteUrl" ref="spriteImg" crossorigin="anonymous" :alt="pokemonName.trim() ? `Sprite of ${pokemonName.trim()}` : 'Pokemon Sprite'" />
    <div class="color-swatches" style="margin-top: 10px">
      <div v-for="(color, index) in colors" :key="index" style="display: inline-block; margin-right: 10px; text-align: center">
        <div
          :style="{
            backgroundColor: color,
            width: '40px',
            height: '40px',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }"
        ></div>
        <div style="font-size: 10px; margin-top: 2px; color: #333">{{ color }}</div>
      </div>
    </div>
  </aside>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted } from "vue"
import ColorThief from "colorthief"

import speciesData from "../utils/species.json"

const emit = defineEmits(["colors-extracted"])

const spriteImg = ref(null)
const colors = ref([])
const pokemonName = ref("")
const pokemonNames = ref([])
const filteredPokemonNames = ref([])
const showDropdown = ref(false)
const highlightedIdx = ref(-1)
const spriteUrl = ref("")
const errorMessage = ref("")
const isLoading = ref(false)
let lastFetchedName = ""

const extractColors = () => {
  if (!spriteImg.value?.naturalWidth) return
  try {
    const colorThief = new ColorThief()
    const palette = colorThief.getPalette(spriteImg.value, 3)
    colors.value = palette.map((rgb) => `rgb(${rgb.join(",")})`)
    // Set CSS custom properties for each color
    const root = document.documentElement
    // First, clear any previous color custom properties if colors are empty
    if (!colors.value.length) {
      for (let i = 1; i <= 6; i++) {
        root.style.removeProperty(`--color-${i}`)
      }
    } else {
      colors.value.forEach((color, idx) => {
        root.style.setProperty(`--color-${idx + 1}`, color)
      })
      // Remove any extra custom properties from previous palettes
      for (let i = colors.value.length + 1; i <= 6; i++) {
        root.style.removeProperty(`--color-${i}`)
      }
    }
    emit("colors-extracted", colors.value)
  } catch (error) {
    console.error("Error extracting colors:", error)
    colors.value = []
    // Clear CSS custom properties if error
    const root = document.documentElement
    for (let i = 1; i <= 6; i++) {
      root.style.removeProperty(`--color-${i}`)
    }
    emit("colors-extracted", [])
  }
}

const fetchSprite = async (name) => {
  const trimmedName = (name ?? pokemonName.value).trim()
  if (!trimmedName) {
    spriteUrl.value = ""
    colors.value = []
    errorMessage.value = ""
    isLoading.value = false
    return
  }
  if (!(trimmedName.toLowerCase() in speciesData)) {
    errorMessage.value = "Pokémon not found"
    spriteUrl.value = ""
    colors.value = []
    lastFetchedName = ""
    isLoading.value = false
    throw new Error("Pokémon not found in species data")
  }
  if (trimmedName.toLowerCase() === lastFetchedName) {
    return
  }
  isLoading.value = true
  errorMessage.value = ""
  try {
    // console.log(`Fetching sprite for: ${speciesData[trimmedName]}`)
    const id = speciesData[trimmedName.toLowerCase()]
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`)
    if (!response.ok) {
      throw new Error("Pokémon not found")
    }
    const data = await response.json()
    spriteUrl.value = data.sprites.front_default || ""
    lastFetchedName = trimmedName.toLowerCase()
  } catch (error) {
    console.error(error)
    spriteUrl.value = ""
    colors.value = []
    errorMessage.value = "Pokémon not found"
    lastFetchedName = ""
  } finally {
    isLoading.value = false
  }
}

const onImageLoad = () => {
  extractColors()
}

const onPokemonInput = (e) => {
  const input = pokemonName.value.trim().toLowerCase()
  if (!input) {
    filteredPokemonNames.value = []
    showDropdown.value = false
    highlightedIdx.value = -1
    return
  }
  filteredPokemonNames.value = pokemonNames.value.filter((name) => name.toLowerCase().includes(input)).slice(0, 12)
  showDropdown.value = filteredPokemonNames.value.length > 0
  highlightedIdx.value = -1
}

const selectPokemon = (name) => {
  pokemonName.value = name
  showDropdown.value = false
  filteredPokemonNames.value = []
  highlightedIdx.value = -1
  fetchSprite(name)
}

const onInputBlur = () => {
  // Delay hiding the dropdown so click can register
  setTimeout(() => {
    showDropdown.value = false
    highlightedIdx.value = -1
  }, 100)
}

onMounted(async () => {
  // Populate pokemonNames from provided JSON keys
  pokemonNames.value = Object.keys(speciesData)

  if (spriteImg.value?.complete) {
    extractColors()
  } else {
    spriteImg.value?.addEventListener("load", onImageLoad)
  }
})

onUnmounted(() => {
  spriteImg.value?.removeEventListener("load", onImageLoad)
})

watch(spriteUrl, (newUrl) => {
  if (!spriteImg.value) return
  spriteImg.value.src = newUrl
  spriteImg.value.removeEventListener("load", onImageLoad)
  if (spriteImg.value.complete && spriteImg.value.naturalWidth) {
    extractColors()
  } else {
    spriteImg.value.addEventListener("load", onImageLoad)
  }
})
</script>
