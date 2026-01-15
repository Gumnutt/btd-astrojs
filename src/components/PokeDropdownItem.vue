<template>
  <li>
    <img v-if="spriteUrl" :src="spriteUrl" alt="Pokémon sprite" />
    {{ name }}
  </li>
</template>

<script setup>
import { ref, watch, onMounted, onUnmounted, nextTick } from "vue"

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
})

const pokemonData = ref(null)
const spriteUrl = ref("")
const emit = defineEmits(["pokemon-data-fetched"])

const fetchPokemonData = async (name) => {
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${name.toLowerCase()}`)
    if (!response.ok) throw new Error("Network response was not ok")
    return await response.json()
  } catch (error) {
    console.error("Error fetching Pokémon data:", error)
    return null
  }
}

// Fetch the Pokémon data when the component is mounted
onMounted(async () => {
  const data = await fetchPokemonData(props.name)
  if (data) {
    pokemonData.value = data
    spriteUrl.value = data.sprites.front_default || ""
    emit("pokemon-data-fetched", pokemonData.value)
  } else {
    console.error("Failed to fetch Pokémon data for:", props.name)
  }
})
</script>
