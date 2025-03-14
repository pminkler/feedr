// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  vite: {
    server: {
      allowedHosts: ["7d23-98-156-225-149.ngrok-free.app"],
    },
  },
  css: ["~/assets/css/main.css"],
  app: {
    head: {
      meta: [
        {
          name: "impact-site-verification",
          content: "2f7533de-4e65-481d-a968-fce5f60daa38",
        },
      ],
      link: [
        { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
        {
          rel: "apple-touch-icon",
          sizes: "180x180",
          href: "/apple-touch-icon.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "32x32",
          href: "/favicon-32x32.png",
        },
        {
          rel: "icon",
          type: "image/png",
          sizes: "16x16",
          href: "/favicon-16x16.png",
        },
      ],
    },
  },
  typescript: {
    typeCheck: true,
  },
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  devServer: {
    port: 3000,
  },
  modules: [
    "@vite-pwa/nuxt",
    "@nuxt/ui-pro",

    "nuxt-gtag",
    "@nuxtjs/i18n",
    [
      "@nuxtjs/google-fonts",
      {
        families: {
          Nunito: true,
        },
        display: "swap",
      },
    ],
  ],
  ssr: false,
  gtag: {
    id: "G-V6CPTYFL59",
  },
  i18n: {
    strategy: "prefix_and_default",
    vueI18n: "./i18n.config.ts",
    locales: [
      {
        code: "en",
        name: "English",
      },
      {
        code: "es",
        name: "Español",
      },
      {
        code: "fr",
        name: "Français",
      },
    ],
  },
  pwa: {
    registerType: "autoUpdate",
    manifest: {
      name: "Feedr App",
      short_name: "Feedr",
      description: "An app that assists with recipe extraction and sharing.",
      theme_color: "#000000",
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      icons: [
        {
          src: "/web-app-manifest-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "/web-app-manifest-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
    },
    workbox: {
      globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
      runtimeCaching: [
        {
          urlPattern: /\/\?code=.*&state=.*/,
          handler: "NetworkOnly", // Ensure OAuth redirects bypass Workbox
          method: "GET",
        },
      ],
    },
    injectManifest: {
      globPatterns: ["**/*.{js,css,html,png,svg,ico}"],
    },
    devOptions: {
      enabled: false,
      suppressWarnings: false,
      navigateFallback: "/",
      navigateFallbackAllowlist: [/^\/$/],
      type: "module",
    },
    client: {
      installPrompt: true,
    },
  },
});
