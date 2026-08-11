import type { Config } from 'tailwindcss';

/**
 * EN Z — Design System
 * Identidad derivada del emblema: nudo celta violeta, grietas de energía,
 * nebulosa púrpura y la "Z" blanca. Modo oscuro nativo.
 *
 * Paleta base recomendada por la skill UI/UX Pro Max (perfil "Gaming / neon purple")
 * y ajustada al negro profundo del logo.
 */
const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/presentation/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      colors: {
        /* --- Superficies (el "vacío" del logo) --- */
        void: {
          DEFAULT: '#06040D',
          900: '#06040D',
          800: '#0B0718',
          700: '#120C22',
          600: '#170F2C',
          500: '#1E1438',
        },
        surface: {
          DEFAULT: '#130D26',
          raised: '#191031',
          high: '#20153F',
          line: '#2C1F52',
          lineSoft: '#211741',
        },

        /* --- Violeta primario (cuerpo del nudo) --- */
        violet: {
          50: '#F5F2FF',
          100: '#EDE7FF',
          200: '#DDD2FF',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
          800: '#5B21B6',
          900: '#4C1D95',
          950: '#2E1065',
        },

        /* --- Arco eléctrico (las grietas de rayo) --- */
        arc: {
          DEFAULT: '#A855F7',
          soft: '#C084FC',
          bright: '#E9D5FF',
          deep: '#7E22CE',
        },

        /* --- Brasa: acción / CTA / urgencia --- */
        ember: {
          DEFAULT: '#F43F5E',
          soft: '#FB7185',
          deep: '#BE123C',
        },

        /* --- Estados semánticos --- */
        ok: { DEFAULT: '#22C55E', soft: '#4ADE80', deep: '#15803D' },
        warn: { DEFAULT: '#F59E0B', soft: '#FBBF24', deep: '#B45309' },
        danger: { DEFAULT: '#EF4444', soft: '#F87171', deep: '#B91C1C' },
        info: { DEFAULT: '#38BDF8', soft: '#7DD3FC', deep: '#0369A1' },

        /* --- Texto --- */
        ink: {
          DEFAULT: '#F4F1FF',
          soft: '#CBC2E8',
          mute: '#9A8FBC',
          faint: '#6B6088',
        },

        /* --- Identidad por espacio/rol (derivadas del violeta) --- */
        role: {
          customer: '#A855F7',
          store: '#F59E0B',
          driver: '#22D3EE',
          admin: '#F43F5E',
        },
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'glow-violet': '0 0 40px -12px rgba(124, 58, 237, 0.75)',
        'glow-arc': '0 0 44px -10px rgba(168, 85, 247, 0.7)',
        'glow-ember': '0 0 40px -12px rgba(244, 63, 94, 0.65)',
        'glow-ok': '0 0 36px -12px rgba(34, 197, 94, 0.6)',
        rune: '0 24px 60px -24px rgba(76, 29, 149, 0.85), 0 0 0 1px rgba(168,139,250,0.08) inset',
        lift: '0 30px 70px -30px rgba(0, 0, 0, 0.9)',
      },
      backgroundImage: {
        'grad-rune': 'linear-gradient(135deg, #7C3AED 0%, #A855F7 45%, #C4B5FD 100%)',
        'grad-ember': 'linear-gradient(135deg, #BE123C 0%, #F43F5E 55%, #FB7185 100%)',
        'grad-void': 'linear-gradient(180deg, #06040D 0%, #0B0718 60%, #06040D 100%)',
        'grad-sheen':
          'linear-gradient(105deg, transparent 20%, rgba(233,213,255,0.35) 42%, transparent 62%)',
      },
      transitionTimingFunction: {
        rune: 'cubic-bezier(0.16, 1, 0.3, 1)',
        snap: 'cubic-bezier(0.22, 1.2, 0.36, 1)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'orbit-slow': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.45', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(1.06)' },
        },
        sheen: {
          '0%': { transform: 'translateX(-120%)' },
          '100%': { transform: 'translateX(220%)' },
        },
        'arc-flicker': {
          '0%, 100%': { opacity: '0.25' },
          '12%': { opacity: '0.9' },
          '18%': { opacity: '0.35' },
          '26%': { opacity: '1' },
          '32%': { opacity: '0.4' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-500px 0' },
          '100%': { backgroundPosition: '500px 0' },
        },
        'rise-fade': {
          '0%': { opacity: '0', transform: 'translateY(14px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        float: 'float 5s ease-in-out infinite',
        'orbit-slow': 'orbit-slow 26s linear infinite',
        'orbit-rev': 'orbit-slow 38s linear infinite reverse',
        'pulse-glow': 'pulse-glow 4.5s ease-in-out infinite',
        sheen: 'sheen 2.4s ease-in-out infinite',
        'arc-flicker': 'arc-flicker 5s ease-in-out infinite',
        shimmer: 'shimmer 1.6s linear infinite',
        'rise-fade': 'rise-fade 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
};

export default config;
