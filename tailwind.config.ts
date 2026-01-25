import type { Config } from "tailwindcss";

export default {
  theme: {
    extend: {
      colors: {
        primary: {
          main: "var(--color-primary-main)",
          sub: "var(--color-primary-sub)",
          active: "var(--color-primary-active)",
          disabled: "var(--color-primary-disabled)",
        },
        text: {
          title: "var(--color-text-title)",
          body: "var(--color-text-body)",
          "caption-strong": "var(--color-text-caption-strong)",
          caption: "var(--color-text-caption)",
          "hint-main": "var(--color-text-hint-main)",
          "hint-sub": "var(--color-text-hint-sub)",
        },
        bg: {
          normal: "var(--color-bg-normal)",
          sub: "var(--color-bg-sub)",
          toast: "var(--color-bg-toast)",
          "bottom-sheet": "var(--color-bg-bottom-sheet)",
        },
      },
      borderRadius: {
        light: "var(--radius-light)",
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        round: "var(--radius-round)",
      },
      boxShadow: {
        light: "var(--shadow-light)",
        "blur-strong": "var(--shadow-blur-strong)",
        "blur-basic": "var(--shadow-blur-basic)",
      },
      height: {
        "app-header": "var(--app-header-height)",
        "app-footer": "var(--app-footer-height)",
      },
      animation: {
        "star-movement-bottom": "star-movement-bottom linear infinite",
        "star-movement-top": "star-movement-top linear infinite",
      },
      keyframes: {
        "star-movement-bottom": {
          "0%": { transform: "translate(0%, 0%)", opacity: "1" },
          "100%": { transform: "translate(-100%, 0%)", opacity: "0" },
        },
        "star-movement-top": {
          "0%": { transform: "translate(0%, 0%)", opacity: "1" },
          "100%": { transform: "translate(100%, 0%)", opacity: "0" },
        },
      },
    },
  },
} satisfies Config;
