import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

/**
 * Contrast of the code block's language label.
 *
 * This exists because the accessibility suite cannot cover it. That suite
 * crawls every page in dist/ with axe-core's WCAG 2.0/2.1 AA rules and passes,
 * but axe's colour-contrast rule skips ::before and ::after: it cannot resolve
 * a background for generated content, so it reports nothing either way.
 *
 * The label was `--color-muted` on `--tw-prose-pre-bg`. That looked reasonable
 * and was not, because --color-muted flips with the theme while the code block
 * background does not, so light mode painted #5c6773 on #1f2937 at 2.55:1. That
 * is below AA for normal text (4.5:1) and below even the large-text floor (3:1),
 * and it was only ever wrong on half the site, which is why nobody noticed.
 *
 * The values are parsed out of the stylesheet rather than restated here, so
 * editing a colour is what runs this check.
 */

const CSS = readFileSync(new URL('../src/styles/global.css', import.meta.url), 'utf8')

const readToken = (name) => {
  const match = CSS.match(new RegExp(`${name}\\s*:\\s*(#[0-9a-fA-F]{6})`))
  if (!match) throw new Error(`${name} is not defined in global.css`)
  return match[1]
}

const luminance = (hex) => {
  const channels = [1, 3, 5]
    .map((i) => parseInt(hex.substr(i, 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)))

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
}

const contrast = (a, b) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

describe('the code block language label', () => {
  const label = () => readToken('--color-code-label')
  const background = () => readToken('--tw-prose-pre-bg')

  it('clears WCAG AA for normal text against the code block background', () => {
    // 0.6875rem is 11px. Nothing about it qualifies as large text, so the
    // 3:1 allowance does not apply and 4.5:1 is the bar.
    expect(contrast(label(), background())).toBeGreaterThanOrEqual(4.5)
  })

  /**
   * The original bug was not the colour, it was using a token that changes with
   * the theme on a surface that does not. Any theme-specific redefinition of
   * this token reintroduces exactly that, so the token is asserted to be
   * declared once.
   */
  it('uses a token that does not flip with the theme', () => {
    const declarations = CSS.match(/--color-code-label\s*:/g) ?? []

    expect(declarations).toHaveLength(1)
  })

  /**
   * A label that matches the code it labels stops reading as a label. It has to
   * clear AA and still sit clearly below the code text, which is 11.86:1.
   */
  it('stays quieter than the code text it sits above', () => {
    const codeText = readToken('--tw-prose-pre-code')

    expect(contrast(label(), background())).toBeLessThan(contrast(codeText, background()))
  })
})
