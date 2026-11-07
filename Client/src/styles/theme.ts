/** Shared semantic values mirrored by the CSS custom properties in workspace.css. */
export const theme = {
  colors: {
    canvas: '#f8f9f7', rail: '#f1f4f1', surface: '#ffffff', ink: '#172826',
    muted: '#53635f', border: '#dce5df', accent: '#176b63',
    accentHover: '#0d554e', accentSoft: '#e5f3ef', focus: '#258f83', error: '#9d3c39',
  },
  fonts: {
    sans: 'ui-sans-serif, system-ui, sans-serif',
    heading: 'Outfit, ui-sans-serif, system-ui, sans-serif',
  },
  spacing: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px' },
  borderRadius: { control: '8px', row: '9px', message: '11px', composer: '17px' },
} as const;
