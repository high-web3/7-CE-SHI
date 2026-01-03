import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                border: "var(--border)",
                card: "var(--card)",
                success: "#10B981", // Green for Buy/Low Squeeze
                danger: "#EF4444", // Red for Sell/High Squeeze
                primary: "#3B82F6", // Blue for neutral/info
            },
        },
    },
    plugins: [],
};
export default config;
