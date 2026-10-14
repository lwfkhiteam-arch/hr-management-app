module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: { DEFAULT: "#1E293B", 700: "#334155" },
        accent: { DEFAULT: "#2563EB", 50: "#EFF6FF" },
        success: "#10B981", warning: "#F59E0B", danger: "#EF4444",
        surface: "#F8FAFC", line: "#E2E8F0",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ['"Plus Jakarta Sans"', "Inter", "sans-serif"],
      },
      borderRadius: { card: "12px" },
    },
  },
};
