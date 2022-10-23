export function getAssetURL(id) {
  if (!id) return null
  return `${import.meta.env.PUBLIC_DIRECTUS_URL}/assets/${id}`
}

export function getAssetData(id) {
  if (!id) return null
  return `${import.meta.env.PUBLIC_DIRECTUS_URL}/files/${id}`
}
