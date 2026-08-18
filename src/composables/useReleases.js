import { ref, computed } from 'vue'
import { parseFilename } from '@/utils/filenameParser'

export function useReleases() {
  const releases = ref([])
  const loading = ref(false)
  const error = ref(null)

  async function fetchReleases() {
    loading.value = true
    error.value = null
    try {
      const res = await fetch('/api/releases')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      releases.value = data.releases || []
    } catch (e) {
      error.value = e.message
    } finally {
      loading.value = false
    }
  }

  function getRecommendedFile(release, targetOS, targetArch) {
    if (!release?.releaseAssets?.length) return null

    const scored = release.releaseAssets.map((asset) => {
      const parsed = parseFilename(asset.name)
      let score = 0
      if (parsed.os === targetOS) score += 10
      if (parsed.arch === targetArch) score += 5
      if (parsed.os && parsed.arch) score += 1
      return { asset, score, parsed }
    })

    scored.sort((a, b) => b.score - a.score)
    return scored[0]?.score > 0 ? scored[0].asset : null
  }

  const latestStable = computed(() => {
    return releases.value.find((r) => !r.isPrerelease && !r.isDraft) || null
  })

  return {
    releases,
    loading,
    error,
    fetchReleases,
    getRecommendedFile,
    latestStable,
  }
}
