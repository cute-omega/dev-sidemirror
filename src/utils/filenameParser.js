const OS_PATTERNS = [
  { pattern: /linux/i, os: 'linux' },
  { pattern: /windows|win\d*/i, os: 'windows' },
  { pattern: /macos|mac|darwin|osx/i, os: 'macos' },
]

const ARCH_PATTERNS = [
  { pattern: /x64|amd64/i, arch: 'x64' },
  { pattern: /arm64|aarch64/i, arch: 'arm64' },
  { pattern: /universal|all/i, arch: 'universal' },
]

export function parseFilename(filename) {
  let os = null
  let arch = null

  for (const { pattern, os: detectedOs } of OS_PATTERNS) {
    if (pattern.test(filename)) {
      os = detectedOs
      break
    }
  }

  for (const { pattern, arch: detectedArch } of ARCH_PATTERNS) {
    if (pattern.test(filename)) {
      arch = detectedArch
      break
    }
  }

  return { os, arch }
}

export function getFileExtension(filename) {
  const match = filename.match(/\.(tar\.gz|tgz|zip|dmg|deb|rpm|msi|exe|AppImage|flatpak)$/i)
  return match ? match[0] : ''
}

export function getOSIcon(os) {
  switch (os) {
    case 'linux':
      return '🐧'
    case 'windows':
      return '🪟'
    case 'macos':
      return '🍎'
    default:
      return '📦'
  }
}

export function getOSLabel(os) {
  switch (os) {
    case 'linux':
      return 'Linux'
    case 'windows':
      return 'Windows'
    case 'macos':
      return 'macOS'
    default:
      return 'Unknown'
  }
}

export function getArchLabel(arch) {
  switch (arch) {
    case 'x64':
      return 'x64'
    case 'arm64':
      return 'ARM64'
    case 'universal':
      return 'Universal'
    default:
      return ''
  }
}
