// Fuente de verdad de los design tokens (compartida por web y mobile).
//
// Cada sección agrupa tokens con su comentario original. El script
// `shared/scripts/generate-tokens.mjs` genera `frontend/src/styles/tokens.css`
// a partir de `tokenSections`, y el resultado debe ser idéntico al archivo
// actual (criterio de aceptación de la Fase 5).

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
      ['--ds-warning', '#f59e0b'],
      ['--ds-danger-bg', 'rgba(213, 22, 57, 0.16)'],
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
      ['--ds-elevation-1', '0px var(--ds-elevation-1-y) var(--ds-elevation-1-blur) 2px var(--ds-wall)'],
      // Partes que React Native necesita por separado (no soporta box-shadow ni spread)
      ['--ds-elevation-1-y', '4px'],
      ['--ds-elevation-1-blur', '8px'],
      ['--ds-elevation-1-opacity', '0.6'],
      ['--ds-elevation-1-android', '8'],
    ],
  },
  {
    comment: 'Espaciado',
    tokens: [
      ['--ds-space-xs', '4px'],
      ['--ds-space-sm', '8px'],
      ['--ds-space-md', '12px'],
      ['--ds-space-lg', '16px'],
      ['--ds-space-xl', '24px'],
      ['--ds-space-xxl', '32px'],
    ],
  },
  {
    comment: 'Bordes y opacidad',
    tokens: [
      ['--ds-radius-sm', '6px'],
      ['--ds-radius-md', '8px'],
      ['--ds-radius-lg', '12px'],
      ['--ds-border-width-sm', '1px'],
      ['--ds-opacity-subtle', '0.8'],
      ['--ds-opacity-muted', '0.7'],
      ['--ds-opacity-disabled', '0.6'],
    ],
  },
  {
    comment: 'Componentes',
    tokens: [
      ['--ds-radius-card', '6px'],
      ['--ds-radius-full', '9999px'],
      ['--ds-size-media-card', '180px'],
      ['--ds-size-mini-media-card', '150px'],
      ['--ds-size-media-card-play', '36px'],
      ['--ds-height-button', '40px'],
      ['--ds-width-card-max', '448px'],
      ['--ds-size-avatar', '32px'],
    ],
  },
]

export function getToken(name) {
  for (const section of tokenSections) {
    for (const entry of section.tokens) {
      if (entry === null) continue // separador de línea en blanco
      const [token, value] = entry
      if (token === name) return value
    }
  }
  return undefined
}