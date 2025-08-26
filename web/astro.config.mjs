import { defineConfig, envField } from "astro/config";
import tailwindcss from "@tailwindcss/vite";
import react from "@astrojs/react";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
    // site: `https://${config.DOMAIN_NAME}`,
    output: "static",
    integrations: [react(), sitemap(), mdx()],
    prefetch: {
        prefetchAll: true,
        defaultStrategy: "viewport",
    },
    vite: {
        plugins: [tailwindcss()],
    },
    env: {
        schema: {
            PUBLIC_CDK_AWS_REGION: envField.string({ context: "client", access: "public" }),
            PUBLIC_USER_POOL_ID: envField.string({ context: "client", access: "public" }),
            PUBLIC_APP_CLIENT_ID: envField.string({ context: "client", access: "public" }),
            PUBLIC_BUCKET_NAME: envField.string({ context: "client", access: "public" }),
            PUBLIC_RECAPTCHA_CLIENT_KEY: envField.string({ context: "client", access: "public", default: "" }),
            PUBLIC_GOOGLE_ANALYTICS_ID: envField.string({ context: "client", access: "public", default: "" }),
        },
    },
    server: {
        port: 4321,
    },
});
