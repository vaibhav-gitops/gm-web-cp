/** @type {import('tailwindcss').Config} */
const defaultTheme = require("tailwindcss/defaultTheme");
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter Variable", "Inter", ...defaultTheme.fontFamily.sans],
      },
      fontWeight: {
        'medium-plus': '500',
      },
      colors: {
        'font-primary': '#0c3245',
        'dark-blue': '#0f2733',
        'dark-blue-200': '#0f4661',
        'custom-blue': '#0A1822',
        'custom-light-gray':'#cbdfec',
        'custom-gray': '#6B8DA1',
        'custom-green': '#7EDBD7',
        'teal-custom': '#00897B',
        'teal-custom-hover': '#00796B',
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
      },
      animation: {
        marquee: "marquee 50s linear infinite",
      },
      keyframes: {
        marquee: {
          from: {
            transform: "translateX(0)",
          },
          to: {
            transform: "translateX(calc(-100% - 2.5rem))",
          },
        },
      },
      typography: {
        DEFAULT: {
          css: {
            "ul": {
              margin: "0",
              padding: "10",
            },
            "ul li": {
              marginBottom: "0.3rem",
              lineHeight: "1.5",
            },
            a: {
              color: '#2563eb',
              textDecoration: "underline",
            },
            "code::before": {
              content: "none",
            },
            "code::after": {
                content: "none",
            },
            "code": {
              backgroundColor: "#e4e2e2",
              padding: "2px 4px",
              borderRadius: "4px",
              fontWeight: "400",
              whiteSpace: "pre",    /* Changed from pre-wrap to pre */
              overflowX: "auto",    /* Added for horizontal scrolling */
              wordWrap: "normal",   /* Changed from break-word to normal */
              overflowWrap: "normal", /* Changed from break-word to normal */
              maxWidth: "100%",     /* Added to ensure container respect */
            },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
