/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      // ------------------------------------------------------------------
      // Design Token System — hex palette for light / dark
      // All tokens are CSS variables (defined in src/index.css) so a single
      // utility (e.g. bg-main, text-primary) automatically switches with
      // `class="dark"` on <html>.
      //
      // LIGHT (:root)                              DARK (.dark)
      // ─────────────────────────────────────────   ─────────────────────────
      // Base Layout (Canvas)
      //   --bg-main               #F8FAFC           #020617  slate-50 / slate-950
      //   --bg-page               #FFFFFF           #0F172A  white / slate-900
      // Elevated Elements
      //   --bg-surface            #FFFFFF           #1E293B  white / slate-800
      //   --bg-surface-elevated   #FFFFFF           #334155  white / slate-700
      //   --bg-surface-overlay    #FFFFFF           #475569  white / slate-600 (tooltip)
      // Interaction States
      //   --action-accent         #4F46E5           #6366F1  indigo-600 / indigo-500
      //   --action-accent-hover   #4338CA           #818CF8  indigo-700 / indigo-400
      //   --action-accent-active  #3730A3           #4F46E5  indigo-800 / indigo-600
      //   --action-text           #FFFFFF           #FFFFFF
      //   --action-disabled       #E2E8F0           #334155  slate-200 / slate-700
      // Semantic System
      //   --success-main          #16A34A           #22C55E  green-600 / green-500
      //   --success-bg            #F0FDF4           #132E1F  green-50 / dark green 950
      //   --warning-main          #D97706           #F59E0B  amber-600 / amber-500
      //   --warning-bg            #FFFBEB           #2A1F0A  amber-50 / dark amber
      //   --error-main            #DC2626           #EF4444  red-600 / red-500
      //   --error-bg              #FEF2F2           #2A1215  red-50 / dark red
      //   --info-main             #2563EB           #3B82F6  blue-600 / blue-500
      //   --info-bg               #EFF6FF           #0F1E38  blue-50 / dark blue
      // Information Architecture (Typography)
      //   --text-primary          #0F172A           #F8FAFC  slate-900 / slate-50
      //   --text-secondary        #475569           #CBD5E1  slate-600 / slate-300
      //   --text-3rd              #94A3B8           #94A3B8  slate-400 (both)
      //   --text-disabled         #CBD5E1           #64748B  slate-300 / slate-500
      // Framing & Separators
      //   --border-subtle         #E2E8F0           #334155  slate-200 / slate-700
      //   --border-strong         #CBD5E1           #475569  slate-300 / slate-600
      // ------------------------------------------------------------------

      colors: {
        // Flat keys — usable as bg-bg-main, text-bg-main, border-bg-main etc.
        // These are the raw CSS-variable tokens. Prefer the ergonomic aliases
        // below (backgroundColor / textColor / borderColor) for clean classes:
        //   bg-main, bg-surface-elevated, text-primary, border-subtle, etc.
        'bg-main': 'var(--bg-main)',
        'bg-page': 'var(--bg-page)',
        'bg-surface': 'var(--bg-surface)',
        'bg-surface-elevated': 'var(--bg-surface-elevated)',
        'bg-surface-overlay': 'var(--bg-surface-overlay)',

        'action-accent': 'var(--action-accent)',
        'action-accent-hover': 'var(--action-accent-hover)',
        'action-accent-active': 'var(--action-accent-active)',
        'action-text': 'var(--action-text)',
        'action-disabled': 'var(--action-disabled)',

        'success-main': 'var(--success-main)',
        'success-bg': 'var(--success-bg)',
        'warning-main': 'var(--warning-main)',
        'warning-bg': 'var(--warning-bg)',
        'error-main': 'var(--error-main)',
        'error-bg': 'var(--error-bg)',
        'info-main': 'var(--info-main)',
        'info-bg': 'var(--info-bg)',

        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-3rd': 'var(--text-3rd)',
        'text-disabled': 'var(--text-disabled)',

        'border-subtle': 'var(--border-subtle)',
        'border-strong': 'var(--border-strong)',

        // Grouped / namespaced aliases — usable as bg-bg-main, text-text-primary etc.
        bg: {
          main: 'var(--bg-main)',
          page: 'var(--bg-page)',
          surface: 'var(--bg-surface)',
          'surface-elevated': 'var(--bg-surface-elevated)',
          'surface-overlay': 'var(--bg-surface-overlay)',
        },
        action: {
          accent: 'var(--action-accent)',
          'accent-hover': 'var(--action-accent-hover)',
          'accent-active': 'var(--action-accent-active)',
          text: 'var(--action-text)',
          disabled: 'var(--action-disabled)',
        },
        success: {
          main: 'var(--success-main)',
          bg: 'var(--success-bg)',
        },
        warning: {
          main: 'var(--warning-main)',
          bg: 'var(--warning-bg)',
        },
        error: {
          main: 'var(--error-main)',
          bg: 'var(--error-bg)',
        },
        info: {
          main: 'var(--info-main)',
          bg: 'var(--info-bg)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          '3rd': 'var(--text-3rd)',
          disabled: 'var(--text-disabled)',
        },
        border: {
          subtle: 'var(--border-subtle)',
          strong: 'var(--border-strong)',
        },
      },
      // Ergonomic aliases so you can write `bg-main` instead of `bg-bg-main`,
      // `text-primary` instead of `text-text-primary`, `border-subtle` etc.
      backgroundColor: {
        'main': 'var(--bg-main)',
        'page': 'var(--bg-page)',
        'surface': 'var(--bg-surface)',
        'surface-elevated': 'var(--bg-surface-elevated)',
        'surface-overlay': 'var(--bg-surface-overlay)',
        'action-accent': 'var(--action-accent)',
        'action-accent-hover': 'var(--action-accent-hover)',
        'action-accent-active': 'var(--action-accent-active)',
        'action-disabled': 'var(--action-disabled)',
        'success-bg': 'var(--success-bg)',
        'warning-bg': 'var(--warning-bg)',
        'error-bg': 'var(--error-bg)',
        'info-bg': 'var(--info-bg)',
      },
      textColor: {
        'primary': 'var(--text-primary)',
        'secondary': 'var(--text-secondary)',
        '3rd': 'var(--text-3rd)',
        'disabled': 'var(--text-disabled)',
        'action': 'var(--action-text)',
        'success-main': 'var(--success-main)',
        'warning-main': 'var(--warning-main)',
        'error-main': 'var(--error-main)',
        'info-main': 'var(--info-main)',
      },
      borderColor: {
        'subtle': 'var(--border-subtle)',
        'strong': 'var(--border-strong)',
        'success-main': 'var(--success-main)',
        'warning-main': 'var(--warning-main)',
        'error-main': 'var(--error-main)',
        'info-main': 'var(--info-main)',
      },
      ringColor: {
        'subtle': 'var(--border-subtle)',
        'strong': 'var(--border-strong)',
        'accent': 'var(--action-accent)',
      },
    },
  },
  plugins: [],
}
