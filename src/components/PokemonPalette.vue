<template>
  <aside class="pokemon-palette" id="pokemon-palette" popover>
    <h3>Palette:</h3>
    <div style="margin-bottom: 12px">
      <input v-model="searchName" type="text" placeholder="Enter Pokémon name" @keyup.enter="updatePokemonName()" />
      <button @click="updatePokemonName">Search</button>
    </div>
    <div style="margin-bottom: 12px">
      <button @click="testBasePokemon">Test Base Pokémon</button>
    </div>
    <div style="display: flex; gap: 8px">
      <div
        v-for="(color, i) in palette"
        :key="i"
        :style="{
          width: '50px',
          height: '50px',
          border: '1px solid #333',
          backgroundColor: color,
        }"
        :title="color"
      ></div>
    </div>
  </aside>
</template>

<script lang="ts" setup>
import { ref } from "vue"

const props = defineProps<{
  pokemonName: string
}>()

const palette = ref<string[]>([])
const searchName = ref(props.pokemonName)

function rgbToHexNibble(r: number, g: number, b: number): string {
  // Convert each channel to two hex digits by splitting into two nibbles, as in original algorithm
  function toHexNibble(n: number): string {
    const high = (n >> 4) & 0xf
    const low = n & 0xf
    return high.toString(16) + low.toString(16)
  }
  return "#" + toHexNibble(r) + toHexNibble(g) + toHexNibble(b)
}

function areThoseColorsSimilar(hex1: string, hex2: string): boolean {
  // Compare two hex colors by converting to RGB and checking if difference in each channel <= 5
  function hexToRgb(hex: string) {
    const r = parseInt(hex.substr(1, 2), 16)
    const g = parseInt(hex.substr(3, 2), 16)
    const b = parseInt(hex.substr(5, 2), 16)
    return { r, g, b }
  }
  const c1 = hexToRgb(hex1)
  const c2 = hexToRgb(hex2)
  return Math.abs(c1.r - c2.r) <= 5 && Math.abs(c1.g - c2.g) <= 5 && Math.abs(c1.b - c2.b) <= 5
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.substr(1, 2), 16)
  const g = parseInt(hex.substr(3, 2), 16)
  const b = parseInt(hex.substr(5, 2), 16)
  return { r, g, b }
}

function rgbToHsl(r: number, g: number, b: number) {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0,
    s = 0,
    l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0)
        break
      case g:
        h = (b - r) / d + 2
        break
      case b:
        h = (r - g) / d + 4
        break
    }
    h /= 6
  }

  return { h: h * 360, s, l: l * 100 }
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100

  const c = (1 - Math.abs(2 * l - 1)) * s
  const hh = h / 60
  const x = c * (1 - Math.abs((hh % 2) - 1))
  let r = 0,
    g = 0,
    b = 0

  if (hh >= 0 && hh < 1) {
    r = c
    g = x
    b = 0
  } else if (hh >= 1 && hh < 2) {
    r = x
    g = c
    b = 0
  } else if (hh >= 2 && hh < 3) {
    r = 0
    g = c
    b = x
  } else if (hh >= 3 && hh < 4) {
    r = 0
    g = x
    b = c
  } else if (hh >= 4 && hh < 5) {
    r = x
    g = 0
    b = c
  } else if (hh >= 5 && hh < 6) {
    r = c
    g = 0
    b = x
  }

  const m = l - c / 2
  const r255 = Math.round((r + m) * 255)
  const g255 = Math.round((g + m) * 255)
  const b255 = Math.round((b + m) * 255)

  function toHex(n: number): string {
    const hex = n.toString(16)
    return hex.length === 1 ? "0" + hex : hex
  }

  return `#${toHex(r255)}${toHex(g255)}${toHex(b255)}`
}

function hueDistance(hue1: number, hue2: number): number {
  const d = Math.abs(hue1 - hue2)
  return d > 180 ? 360 - d : d
}

function brightnessDistance(l1: number, l2: number): number {
  return Math.abs(l1 - l2)
}

function fetchPalette(name: string) {
  console.log("Fetching palette for Pokémon:", name)
  fetch(`https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to fetch data for Pokémon: ${name}`)
      }
      return response.json()
    })
    .then((data) => {
      const spriteUrl = data.sprites?.front_default
      if (!spriteUrl) {
        throw new Error("Sprite URL not found for the Pokémon")
      }

      const img = new Image()
      img.crossOrigin = "Anonymous"
      img.src = spriteUrl

      img.onload = () => {
        const canvas = document.createElement("canvas")
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext("2d")

        if (ctx) {
          ctx.drawImage(img, 0, 0)
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const pixels = imageData.data

          // Build frequency map of hex colors
          const colorFrequency = new Map<string, number>()

          for (let i = 0; i < pixels.length; i += 4) {
            const alpha = pixels[i + 3]
            if (alpha === 0) continue

            const r = pixels[i]
            const g = pixels[i + 1]
            const b = pixels[i + 2]

            // Convert to hex using nibble splitting approach
            const hex = rgbToHexNibble(r, g, b)

            const count = colorFrequency.get(hex) || 0
            colorFrequency.set(hex, count + 1)
          }

          // Comprehensive background color list (all dark and light backgrounds from original repo)
          const backgroundColors = [
            // Light backgrounds
            "#f8f8f8",
            "#f9f9f9",
            "#fafafa",
            "#fbfbfb",
            "#fcfcfc",
            "#fdfdfd",
            "#fefefe",
            "#ffffff",
            "#e8e8e8",
            "#e9e9e9",
            "#ededed",
            "#eeeeee",
            "#efefef",
            "#f0f0f0",
            "#f1f1f1",
            "#f2f2f2",
            "#f3f3f3",
            "#f4f4f4",
            "#f5f5f5",
            "#f6f6f6",
            "#f7f7f7",
            // Dark backgrounds
            "#000000",
            "#010101",
            "#080808",
            "#101010",
            "#181818",
            "#202020",
            "#282828",
            "#303030",
            "#383838",
            "#404040",
            "#484848",
            "#505050",
            "#585858",
            "#606060",
            "#686868",
            "#707070",
            "#787878",
            "#808080",
            "#888888",
            "#909090",
            "#989898",
            "#a0a0a0",
            "#a8a8a8",
            "#b0b0b0",
            "#b8b8b8",
            "#c0c0c0",
            "#c8c8c8",
            "#d0d0d0",
            "#d8d8d8",
            "#e0e0e0",
            "#e8e8e8",
            "#f0f0f0",
          ]
          backgroundColors.forEach((bg) => colorFrequency.delete(bg))

          // Sort colors by frequency descending
          const sortedColors = [...colorFrequency.entries()].sort((a, b) => b[1] - a[1])

          // Filter out muddy colors, with stricter filtering for yellows
          function isMuddy(hex: string): boolean {
            const { h, s, l } = rgbToHsl(...Object.values(hexToRgb(hex)))
            if (h >= 40 && h <= 65) {
              return s < 0.3 && l >= 30 && l <= 80
            }
            return s < 0.15 && l >= 30 && l <= 70
          }

          const filteredColors = sortedColors.filter(([hex]) => !isMuddy(hex))

          // Deduplication helper: check if color is similar to any in list
          function isSimilarToAny(color: string, list: string[]): boolean {
            for (const c of list) {
              if (areThoseColorsSimilar(color, c)) return true
            }
            return false
          }

          // Primary color = most frequent color
          const primaryColor = filteredColors.length > 0 ? filteredColors[0][0] : "#000000"
          const primaryHsl = rgbToHsl(...Object.values(hexToRgb(primaryColor)))

          // Secondary color = among top 10 colors, find one with 20-60° hue difference from primary and similar brightness, and not too similar in RGB
          let secondaryColor = null
          for (let i = 1; i < Math.min(10, filteredColors.length); i++) {
            const candidate = filteredColors[i][0]
            if (candidate === primaryColor) continue
            if (isSimilarToAny(candidate, [primaryColor])) continue
            const candidateHsl = rgbToHsl(...Object.values(hexToRgb(candidate)))
            const hueDiff = hueDistance(candidateHsl.h, primaryHsl.h)
            const brightDiff = brightnessDistance(candidateHsl.l, primaryHsl.l)
            if (hueDiff >= 20 && hueDiff <= 60 && brightDiff <= 10) {
              secondaryColor = candidate
              break
            }
          }
          // fallback if not found
          if (!secondaryColor) {
            for (let i = 1; i < filteredColors.length; i++) {
              const candidate = filteredColors[i][0]
              if (candidate === primaryColor) continue
              if (isSimilarToAny(candidate, [primaryColor])) continue
              secondaryColor = candidate
              break
            }
          }

          // Accent color = among top 20 colors, find one with ≥90° hue difference or ≥50 brightness difference from primary, higher saturation, and not too similar to primary or secondary
          let accentColor = ""
          for (let i = 1; i < Math.min(20, filteredColors.length); i++) {
            const candidate = filteredColors[i][0]
            if (candidate === primaryColor || candidate === secondaryColor) continue
            if (isSimilarToAny(candidate, [primaryColor, secondaryColor].filter(Boolean) as string[])) continue
            const candidateHsl = rgbToHsl(...Object.values(hexToRgb(candidate)))
            const hueDiff = hueDistance(candidateHsl.h, primaryHsl.h)
            const brightDiff = brightnessDistance(candidateHsl.l, primaryHsl.l)
            if ((hueDiff >= 90 || brightDiff >= 50) && candidateHsl.s > primaryHsl.s) {
              accentColor = candidate
              break
            }
          }
          // fallback if not found
          if (!accentColor) {
            for (let i = 1; i < filteredColors.length; i++) {
              const candidate = filteredColors[i][0]
              if (candidate === primaryColor || candidate === secondaryColor) continue
              if (isSimilarToAny(candidate, [primaryColor, secondaryColor].filter(Boolean) as string[])) continue
              accentColor = candidate
              break
            }
          }

          // Adjust accentColor hue and saturation if needed
          if (accentColor) {
            const { r, g, b } = hexToRgb(accentColor)
            const accentHsl = rgbToHsl(r, g, b)
            // Only transform gold colors if they are "dirty"
            // Dirty gold: hue between 40 and 55, saturation less than 0.5, lightness less than 55
            if (accentHsl.h >= 40 && accentHsl.h <= 55 && accentHsl.s < 0.65 && accentHsl.l < 55) {
              const newHue = accentHsl.h
              const newSaturation = Math.min(accentHsl.s * 1.3, 1)
              const newLightness = Math.min(accentHsl.l + 20, 85)
              accentColor = hslToHex(newHue, newSaturation * 100, newLightness)
            }
          }

          // Final palette array
          const paletteColors: string[] = [primaryColor]
          if (secondaryColor) paletteColors.push(secondaryColor)
          if (accentColor) paletteColors.push(accentColor)

          // Fill with black if fewer than 3 colors
          while (paletteColors.length < 3) {
            paletteColors.push("#000000")
          }

          palette.value = paletteColors.slice(0, 3)

          // Set CSS custom properties for the first three colors
          palette.value.slice(0, 3).forEach((color, idx) => {
            document.documentElement.style.setProperty(`--color${idx + 1}`, color)
          })
        }
      }

      img.onerror = () => {
        console.error("Failed to load sprite image:", spriteUrl)
      }
    })
    .catch((error) => {
      console.error(error)
      palette.value = []
    })
}

function updatePokemonName() {
  console.log("Updating Pokémon name:", searchName.value)
  if (searchName.value && searchName.value.trim() !== "") {
    fetchPalette(searchName.value.trim())
  }
}
// Test function for base Pokémon
function testBasePokemon() {
  const names = ["umbreon", "ditto", "charmander", "kecleon"]
  names.forEach((name) => {
    fetchPalette(name)
    console.log(`Triggered fetchPalette for: ${name}`)
  })
}
</script>
