import { ref, computed } from 'vue'

export function useUserAgent() {
  const userAgent = ref(navigator.userAgent || '')

  const detectedOS = computed(() => {
    const ua = userAgent.value.toLowerCase()
    if (ua.includes('win')) return 'windows'
    if (ua.includes('mac') || ua.includes('darwin')) return 'macos'
    if (ua.includes('linux')) return 'linux'
    return null
  })

  const detectedArch = computed(() => {
    const ua = userAgent.value.toLowerCase()
    if (ua.includes('arm64') || ua.includes('aarch64')) return 'arm64'
    if (ua.includes('x86_64') || ua.includes('x64') || ua.includes('amd64')) return 'x64'
    return 'x64'
  })

  return {
    userAgent,
    detectedOS,
    detectedArch,
  }
}
