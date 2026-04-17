/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Manrope', 'sans-serif'],
      },
      colors: {
        primary: '#0F172A',
        secondary: '#1E293B',
        tertiary: '#10B981',
        neutral: '#F8FAFC',
        credixa: {
          50: "#eff6ff",
          100: "#dbeafe",
          600: "#2563eb",
          900: "#1e3a8a",
        },
      },
    },
  },
  plugins: [],
};

