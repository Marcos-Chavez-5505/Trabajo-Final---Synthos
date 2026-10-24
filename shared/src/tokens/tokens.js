// Fuente de verdad de los design tokens (compartida por web y mobile).
//
// Cada secci??n agrupa tokens con su comentario original. El script
// `shared/scripts/generate-tokens.mjs` genera `frontend/src/styles/tokens.css`
// a partir de `tokenSections`, y el resultado debe ser id??ntico al archivo
// actual (criterio de aceptaci??n de la Fase 5).

export const tokenSections = [
  {
    comment: 'Colores',
    tokens: [
      ['--ds-red', '#d51639'],
      ['--ds-salmon', '#c34b61'],
      ['--ds-lighter', '#f4f0f9'],
      ['--ds-pink', '#eb84a5'],
      ['--ds-light', '#c6bed3'],
      ['--ds-shadow', '#453a4a'],
      ['--ds-plaster', '#8e7288'],
      ['--ds-volume', '#373038'],
      ['--ds-wall', '#605468'],
      ['--ds-wall-gradient', 'linear-gradient(180deg, #605468 0%, rgba(96, 84, 104, 0) 100%)'],
      ['--ds-surface', '#1e1e1e'],
      ['--ds-surface-light', '#2a2a2c'],
      ['--ds-lighter-muted', '#f9e5ff'],
      ['--ds-light-muted', '#b0a4b5'],
      ['--ds-fucsia', '#ef2f62'],
      ['--ds-placeholder', '#b0a4b5'],
    ],
  },
  {
    comment: 'Tipografía',
    tokens: [
      ['--ds-font', 'Roboto, sans-serif'],
      ['--ds-weight-regular', '400'],
      ['--ds-weight-medium', '500'],
      ['--ds-weight-bold', '700'],
      ['--ds-size-button', '16px'],
      ['--ds-lh-button', '24px'],
      ['--ds-size-tiny', '10px'],
      ['--ds-lh-tiny', '14px'],
      ['--ds-size-medium', '12px'],
      ['--ds-lh-medium', '18px'],
      ['--ds-size-regluar', '16px'],
      ['--ds-lh-regluar', '24px'],
      ['--ds-size-large', '18px'],
      ['--ds-lh-large', '24px'],
      ['--ds-size-header4', '18px'],
      ['--ds-lh-header4', '24px'],
      ['--ds-size-header3', '24px'],
      ['--ds-lh-header3', '40px'],
      ['--ds-size-header2', '36px'],
      ['--ds-lh-header2', '48px'],
      ['--ds-size-header1', '56px'],
      ['--ds-lh-header1', '64px'],
      null,
      ['--ds-font-logo', "'SynthosLogo', var(--ds-font)"],
    ],
  },
  {
    comment: 'Elevación',
    tokens: [
      ['--ds-elevation-1', '0px 4px 8px 2px var(--ds-wall)'],
    ],
  },
  {
    comment: 'Componentes',
    tokens: [
      ['--ds-radius-card', '6px'],
      ['--ds-size-media-card', '180px'],
      ['--ds-size-mini-media-card', '150px'],
      ['--ds-size-media-card-play', '36px'],
    ],
  },
]

export function getToken(name) {
  for (const section of tokenSections) {
    for (const [token, value] of section.tokens) {
      if (token === name) return value
    }
  }
  return undefined
}