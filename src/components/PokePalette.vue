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
    <img
      v-if="spriteUrl"
      :src="spriteUrl"
      ref="spriteImg"
      crossorigin="anonymous"
      :alt="pokemonName.trim() ? `Sprite of ${pokemonName.trim()}` : 'Pokemon Sprite'"
    />
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
import { ref, watch, onMounted, onUnmounted, nextTick } from "vue"
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
  console.log("Running extractColors!")
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
        root.style.removeProperty(`--color-${i}-text`)
      }
    } else {
      colors.value.forEach((color, idx) => {
        root.style.setProperty(`--color-${idx + 1}`, color)
        // Calculate luminance to determine text color
        const rgb = palette[idx]
        const r = rgb[0] / 255
        const g = rgb[1] / 255
        const b = rgb[2] / 255
        const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
        const textColor = luminance > 0.5 ? "var(--grey)" : "var(--offwhite)"
        root.style.setProperty(`--color-${idx + 1}-text`, textColor)
      })
      // Remove any extra custom properties from previous palettes
      for (let i = colors.value.length + 1; i <= 6; i++) {
        root.style.removeProperty(`--color-${i}`)
        root.style.removeProperty(`--color-${i}-text`)
      }
    }
    emit("colors-extracted", colors.value)
    // Save colors and pokemonName to localStorage
    localStorage.setItem("savedPalette", JSON.stringify(colors.value))
    localStorage.setItem("savedPokemonName", pokemonName.value)
    // Save expiry timestamp 24 hours in the future
    const expiryTimestamp = Date.now() + 24 * 60 * 60 * 1000
    localStorage.setItem("savedPaletteExpires", expiryTimestamp.toString())
  } catch (error) {
    console.error("Error extracting colors:", error)
    colors.value = []
    // Clear CSS custom properties if error
    const root = document.documentElement
    for (let i = 1; i <= 6; i++) {
      root.style.removeProperty(`--color-${i}`)
      root.style.removeProperty(`--color-${i}-text`)
    }
    emit("colors-extracted", [])
    // Remove saved palette from localStorage
    localStorage.removeItem("savedPalette")
    localStorage.removeItem("savedPokemonName")
    localStorage.removeItem("savedPaletteExpires")
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

  // Load saved palette and pokemonName from localStorage
  const savedPalette = localStorage.getItem("savedPalette")
  const savedName = localStorage.getItem("savedPokemonName")
  const savedExpires = localStorage.getItem("savedPaletteExpires")
  const now = Date.now()
  if (savedExpires && now > Number(savedExpires)) {
    // Expired, clear localStorage keys
    localStorage.removeItem("savedPalette")
    localStorage.removeItem("savedPokemonName")
    localStorage.removeItem("savedPaletteExpires")
  } else if (savedPalette) {
    try {
      const palette = JSON.parse(savedPalette)
      colors.value = palette
      const root = document.documentElement
      palette.forEach((color, idx) => {
        root.style.setProperty(`--color-${idx + 1}`, color)
        // Calculate luminance to determine text color
        const rgb = color.match(/\d+/g).map(Number)
        const r = rgb[0] / 255
        const g = rgb[1] / 255
        const b = rgb[2] / 255
        const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b
        const textColor = luminance > 0.5 ? "var(--grey)" : "var(--offwhite)"
        root.style.setProperty(`--color-${idx + 1}-text`, textColor)
      })
      // Remove any extra custom properties from previous palettes
      for (let i = palette.length + 1; i <= 6; i++) {
        root.style.removeProperty(`--color-${i}`)
        root.style.removeProperty(`--color-${i}-text`)
      }
      if (savedName) {
        pokemonName.value = savedName
      }
    } catch {
      // If parsing fails, clear localStorage keys
      localStorage.removeItem("savedPalette")
      localStorage.removeItem("savedPokemonName")
      localStorage.removeItem("savedPaletteExpires")
    }
  }

  if (spriteImg.value?.complete) {
    extractColors()
  } else {
    spriteImg.value?.addEventListener("load", onImageLoad)
  }
})

onUnmounted(() => {
  spriteImg.value?.removeEventListener("load", onImageLoad)
})

watch(spriteUrl, async (newUrl) => {
  await nextTick()
  if (!spriteImg.value) return
  spriteImg.value.removeEventListener("load", onImageLoad)
  if (spriteImg.value.complete && spriteImg.value.naturalWidth) {
    extractColors()
  } else {
    spriteImg.value.addEventListener("load", onImageLoad)
  }
})
</script>
