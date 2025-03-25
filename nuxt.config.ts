// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  vite: {
    server: {
      allowedHosts: ["7d23-98-156-225-149.ngrok-free.app"],
    },
    optimizeDeps: {
      exclude: [
        "@aws-amplify/backend",
        "@aws-amplify/backend-cli",
        "@aws-amplify/backend-auth",
        "@aws-amplify/backend-data",
        "@aws-amplify/backend-storage",
        "@aws-amplify/backend-function",
      ],
    },
    build: {
      rollupOptions: {
        external: [
          "@aws-amplify/backend",
          "@aws-amplify/backend-cli",
          "@aws-amplify/backend-auth",
          "@aws-amplify/backend-data",
          "@aws-amplify/backend-storage",
          "@aws-amplify/backend-function",
        ],
      },
    },
  },
  css: ["~/assets/css/main.css"],
  app: {
    head: {
      title: "Feedr - Get to the Recipe",
      meta: [
        {
          name: "impact-site-verification",
          content: "721e4d03-55c1-4d38-b766-5a438281f01b",
        },
        {
          name: "description",
          content:
            "Clean, structured recipes with just ingredients and steps. Extract recipes from URLs or images.",
        },
        {
          name: "og:title",
          content: "Feedr - Get to the Recipe",
        },
        {
          name: "og:description",
          content:
            "Clean, structured recipes with just ingredients and steps. Extract recipes from URLs or images.",
        },
        {
          name: "og:image",
          content: "https://feedr.app/web-app-manifest-512x512.png",
        },
        {
          name: "og:url",
          content: "https://feedr.app",
        },
        {
          name: "og:type",
          content: "website",
        },
        {
          name: "twitter:card",
          content: "summary_large_image",
        },
        {
          name: "twitter:title",
          content: "Feedr - Get to the Recipe",
        },
        {
          name: "twitter:description",
          content:
            "Clean, structured recipes with just ingredients and steps. Extract recipes from URLs or images.",
        },
        {
          name: "twitter:image",
          content: "https://feedr.app/web-app-manifest-512x512.png",
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
        {
          rel: "canonical",
          href: "https://feedr.app",
        },
      ],
      htmlAttrs: {
        lang: "en",
      },
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
    strategy: "prefix_except_default",
    defaultLocale: "en",
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
  future: {
    compatibilityVersion: 4,
  },

  compatibilityDate: "2024-07-11",

  typescript: {
    typeCheck: true,
  },
});
