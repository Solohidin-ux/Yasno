export const palettes = {
  light: {
    paper: '#f3efe6',
    surface: '#fffdf8',
    ink: '#1c1915',
    muted: '#6f675c',
    line: '#e4d9c8',
    accent: '#1f6b4a',
    danger: '#c2412d',
    auto: '#1d5c96',
    dangerSoft: '#fde8e4',
    autoSoft: '#e4f0fa',
    edge: '#8a8175',
  },
  dark: {
    paper: '#12110e',
    surface: '#1d1b17',
    ink: '#f4efe6',
    muted: '#b3aa9e',
    line: '#343028',
    accent: '#3dba8b',
    danger: '#f0715e',
    auto: '#7eb6e8',
    dangerSoft: '#3a221c',
    autoSoft: '#172838',
    edge: '#9a9186',
  },
} as const

export type Palette = {
  [Key in keyof (typeof palettes)['light']]: string
}
