/** @type {import('tailwindcss').Config} */
const defaultTheme = require("tailwindcss/defaultTheme");
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter Variable", "Inter", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        'font-primary': '#0c3245',
        'dark-blue': '#0f2733',
        'dark-blue-200': '#0f4661',
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
              content: "none", // Removes the backtick before
            },
            "code::after": {
                content: "none", // Removes the backtick after
            },
            "code": {
              backgroundColor: "#e4e2e2",  // Light gray background
              padding: "2px 4px",
              borderRadius: "4px",
              fontWeight: "400",
            },
          },
        },
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
