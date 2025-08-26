/** @type {import('tailwindcss').Config} */

import daisyui from "daisyui";
import typography from "@tailwindcss/typography";

const daisyui_config = {
    themes: ["business", "nord"],
};

export default {
    content: {
        files: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}", "./lib/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
    },
    theme: {
        extend: {},
    },
    plugins: [
        typography,
        daisyui,
        function ({ addComponents }) {
            addComponents({
                ".btn": {
                    height: "2.5rem",
                    "min-height": "min-content",
                    "border-radius": "0.250rem",
                },
            });
        },
    ],
    daisyui: daisyui_config,
};
