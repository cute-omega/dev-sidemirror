import { describe, it, expect } from 'vitest'
import { parseFilename, getOSIcon, getOSLabel, getArchLabel } from '../utils/filenameParser'

describe('parseFilename', () => {
  it('parses linux x64 filename', () => {
    const result = parseFilename('app-1.0.0-linux-x64.tar.gz')
    expect(result.os).toBe('linux')
    expect(result.arch).toBe('x64')
  })

  it('parses windows amd64 filename', () => {
    const result = parseFilename('app-1.0.0-windows-amd64.zip')
    expect(result.os).toBe('windows')
    expect(result.arch).toBe('x64')
  })

  it('parses macos arm64 filename', () => {
    const result = parseFilename('app-1.0.0-macos-arm64.dmg')
    expect(result.os).toBe('macos')
    expect(result.arch).toBe('arm64')
  })

  it('parses macos aarch64 filename', () => {
    const result = parseFilename('app-1.0.0-macos-aarch64.dmg')
    expect(result.os).toBe('macos')
    expect(result.arch).toBe('arm64')
  })

  it('parses linux arm64 filename', () => {
    const result = parseFilename('app-1.0.0-linux-arm64.tar.gz')
    expect(result.os).toBe('linux')
    expect(result.arch).toBe('arm64')
  })

  it('returns null for unknown os', () => {
    const result = parseFilename('app-1.0.0.tar.gz')
    expect(result.os).toBeNull()
    expect(result.arch).toBeNull()
  })
})

describe('getOSIcon', () => {
  it('returns penguin for linux', () => {
    expect(getOSIcon('linux')).toBe('🐧')
  })

  it('returns windows for windows', () => {
    expect(getOSIcon('windows')).toBe('🪟')
  })

  it('returns apple for macos', () => {
    expect(getOSIcon('macos')).toBe('🍎')
  })

  it('returns package for unknown', () => {
    expect(getOSIcon(null)).toBe('📦')
  })
})

describe('getOSLabel', () => {
  it('returns Linux', () => {
    expect(getOSLabel('linux')).toBe('Linux')
  })

  it('returns Windows', () => {
    expect(getOSLabel('windows')).toBe('Windows')
  })

  it('returns macOS', () => {
    expect(getOSLabel('macos')).toBe('macOS')
  })
})

describe('getArchLabel', () => {
  it('returns x64', () => {
    expect(getArchLabel('x64')).toBe('x64')
  })

  it('returns ARM64', () => {
    expect(getArchLabel('arm64')).toBe('ARM64')
  })

  it('returns Universal', () => {
    expect(getArchLabel('universal')).toBe('Universal')
  })
})
