export default defineI18nConfig(() => ({
  legacy: false,
  locale: "en",
  messages: {
    en: {
      landing: {
        title: "Get to the Recipe",
        subtitle:
          "Paste a recipe URL for a clean, structured version—just ingredients and steps.",
        inputPlaceholder: "Recipe URL",
        submitButton: "Get Recipe",
      },
      footer: {
        privacyPolicyLink: "Privacy Policy",
        termsOfServiceLink: "Terms of Service",
        contactLink: "Contact",
      },
    },
    fr: {
      landing: {
        title: "Accédez à la recette",
        subtitle:
          "Collez l’URL d’une recette pour obtenir une version claire et structurée — uniquement les ingrédients et les étapes.",
        inputPlaceholder: "URL de la recette",
        submitButton: "Obtenir la recette",
      },
      footer: {
        privacyPolicyLink: "Politique de confidentialité",
        termsOfServiceLink: "Conditions d'utilisation",
        contactLink: "Contact",
      },
    },
    es: {
      landing: {
        title: "Obtén la receta",
        subtitle:
          "Pega una URL de receta para obtener una versión limpia y estructurada—solo los ingredientes y los pasos.",
        inputPlaceholder: "URL de la receta",
        submitButton: "Obtener receta",
      },
      footer: {
        privacyPolicyLink: "Política de privacidad",
        termsOfServiceLink: "Términos del servicio",
        contactLink: "Contacto",
      },
    },
  },
}));
