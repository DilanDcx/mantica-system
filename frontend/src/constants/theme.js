// frontend/src/constants/theme.js

export const THEME_COLORS = {
  // Modo Claro Institucional
  light: {
    bgApp: '#F8FAFC',
    bgCard: '#FFFFFF',
    bgCardHover: '#F1F5F9',
    bgSubtle: '#F1F5F9',
    primary: '#20C4BA',
    primaryHover: '#14958D',
    primaryText: '#FFFFFF',
    textMain: '#0F3E48',
    textBody: '#334155',
    textMuted: '#64748B',
    border: '#E2E8F0',
    borderFocus: '#20C4BA',
  },
  // Modo Oscuro Mate (Paleta Navbar: Charcoal / Slate Profundo)
  dark: {
    bgApp: '#0B1320',          // Fondo principal idéntico al Navbar oscuro
    bgCard: '#0F172A',         // Fondo de tarjetas, tablas y modales
    bgCardHover: '#1E293B',    // Hover suave en filas y botones secundarios
    bgSubtle: '#1E293B',       // Cabeceras de tablas e inputs
    primary: '#0D9488',        // Cian/Teal mate apagado
    primaryHover: '#0F766E',   // Estado activo/hover
    primaryText: '#F1F5F9',    // Texto sobre botones primarios
    textMain: '#F1F5F9',       // Títulos y encabezados de alto contraste
    textBody: '#CBD5E1',       // Textos regulares y datos de tablas
    textMuted: '#94A3B8',      // Subtítulos, labels y placeholders legibles
    border: '#1E293B',         // Bordes sutiles sin reflejos
    borderFocus: '#2DD4BF',    // Borde activo en inputs y pestañas
    accentCyan: '#2DD4BF',     // Acento cian mate para estados activos
  },
};