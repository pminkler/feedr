export default defineI18nConfig(() => ({
  legacy: false,
  locale: "en",
  messages: {
    en: {
      cookingMode: {
        headline: "Cooking Mode",
        close: "Close",
        stepCounter: "Step {current} of {total}",
        recipeComplete: "Recipe Complete!",
        relevantIngredients: "Relevant Ingredients",
      },
      bookmarklet: {
        title: "Bookmarklet",
        description:
          "Drag the button below to your bookmarks bar to easily share pages with this app.",
        dragMe: "Send to Feedr",
        instructions: "Drag this button to your bookmarks bar.",
        or: "Or, copy and paste the code below:",
        copyInstructions:
          "Copy the code below and create a new bookmark. Paste this code into the URL field of the bookmark.",
      },
      recipe: {
        nutritionalInformation: {
          per_serving: "Per Serving",
          title: "Nutritional Information",
          calories: "Calories",
          protein: "Protein",
          fat: "Fat",
          carbs: "Carbohydrates",
        },
        shopping: {
          title: "Grocery Shopping",
          description: "Generate a shopping list from your recipe ingredients.",
          button: "Add to Instacart",
        },
        instacart: {
          button: "Get Recipe Ingredients",
          loading: "Creating recipe page...",
          success: {
            title: "Instacart Link Generated",
            description: "Added {count} ingredients to your Instacart cart.",
          },
          error: {
            title: "Error",
            description: "Failed to generate Instacart link. Please try again.",
          },
          affiliate: {
            disclosure: "I earn a commission from Instacart for qualifying purchases.",
            tooltip: "Click to add ingredients to Instacart and get delivery in as fast as one hour!"
          }
        },
        share: {
          defaultText: "Check out this recipe!",
          successTitle: "Shared",
          successDescription: "Recipe shared successfully.",
          errorTitle: "Share Error",
          errorDescription: "Unable to share the recipe.",
          copiedTitle: "Copied",
          copiedDescription: "Recipe URL copied to clipboard.",
          clipboardErrorTitle: "Clipboard Error",
          clipboardErrorDescription: "Failed to copy the URL.",
        },
        configuration: {
          title: "Configure Recipe",
          divider: {
            scaling: "Scaling",
          },
          scale: {
            scale: "Scale:",
            half: "Half Recipe",
            full: "Full Recipe",
            double: "Double Recipe",
            custom: "{value}× Recipe",
          },
          servings: {
            new: "New Servings:",
            original: "Original serving size: { original }",
          },
          method: {
            label: "Scaling Method:",
            ingredients: "By Ingredients",
            servings: "By Servings",
          },
        },
        error: {
          title: "Error",
          description: "There was a problem getting the recipe.",
          action: "Try Again",
          failedTitle: "Error!",
          failedDescription:
            "There was an error processing your recipe. Please go back and try again.",
          failedAction: "Go Back",
        },
        details: {
          title: "Recipe Details",
          prepTime: "Prep time:",
          cookTime: "Cook time:",
          servings: "Servings:",
        },
        sections: {
          ingredients: "Ingredients",
          steps: "Steps",
        },
        buttons: {
          originalRecipe: "Go to original recipe",
        },
      },
      landing: {
        title: "Get to the Recipe",
        subtitle:
          "Paste a recipe URL, upload a photo, or snap a picture for a clean, structured version—just ingredients and steps.",
        inputPlaceholder: "Recipe URL",
        submitButton: "Get Recipe",
      },
      footer: {
        legal: "Legal",
        privacyPolicyLink: "Privacy Policy",
        termsOfServiceLink: "Terms of Service",
        tools: "Tools",
        installAppLink: "Add to Home Screen",
        appInstalled: "Installed",
        bookmarkletLink: "Bookmarklet",
        contact: "Contact",
        contactLink: "Contact Us",
      },
      contact: {
        form: {
          labels: {
            email: "Email",
            message: "Message",
          },
          placeholders: {
            email: "Enter your email",
            message: "Enter your message",
          },
          button: "Submit Feedback",
        },
        validation: {
          email: {
            invalid: "Invalid email",
            required: "Email is required",
          },
          message: {
            min: "Message must be at least 10 characters",
            required: "Message is required",
          },
        },
        toast: {
          success: {
            title: "Feedback submitted successfully!",
            description: "Thank you for your feedback.",
          },
          failure: {
            title: "Failed to submit feedback.",
            description: "Please try again later.",
          },
        },
      },
      privacyPolicy: {
        title: "Privacy Policy",
        lastUpdated: "Last updated:",
        intro:
          "Welcome to {appName}. Your privacy is important to us. This Privacy Policy explains how we handle and process information when you use our service.",
        section1: {
          title: "1. Information We Process",
          paragraph1:
            "<span class='font-semibold'>{appName} does not collect, store, or share personal data.</span> However, when you submit a URL, we process the page contents in real-time and return the extracted information to you.",
          paragraph2:
            "<span class='font-semibold'>We store the extracted recipe data</span> to allow you to access it later. However, we do not retain other page content or metadata beyond the scope of processing recipes.",
        },
        section2: {
          title: "2. No User Accounts",
          paragraph:
            "{appName} does not require user accounts, logins, or personal information to function.",
        },
        section3: {
          title: "3. Stored Data",
          paragraph:
            "While we do not log submitted URLs, we store extracted recipe data for future retrieval. Recipes may be available for a limited time before automatic deletion.",
        },
        section4: {
          title: "4. Third-Party Websites & Content",
          paragraph:
            "When submitting a URL, you acknowledge that the content belongs to a third-party website. {appName} does not claim ownership of any extracted content, nor do we modify, store, or republish it beyond the scope of user-requested processing. We encourage users to review the privacy policies of third-party sites before submitting URLs.",
        },
        section5: {
          title: "5. Legal Compliance & Fair Use",
          paragraph:
            "{appName} does not intentionally violate copyright laws. However, it is the user’s responsibility to ensure that they have the legal right to process the content they submit. If a content owner believes their material is being improperly processed, they may contact us for resolution.",
        },
        section6: {
          title: "6. No Cookies or Tracking",
          paragraph:
            "{appName} does not use cookies, tracking scripts, analytics, or any other form of persistent data collection.",
        },
        section7: {
          title: "7. Changes to This Policy",
          paragraph:
            "We may update this Privacy Policy from time to time. Any changes will be posted on this page.",
        },
        copyright: "© {year} {appName}. All rights reserved.",
      },
      termsOfService: {
        title: "Terms of Service",
        lastUpdated: "Last updated:",
        intro:
          "Welcome to {appName}. By using our service, you agree to the following terms. If you do not agree, please do not use {appName}.",
        section1: {
          title: "1. Service Description",
          paragraph:
            "{appName} allows users to submit publicly accessible URLs containing recipes. We extract and process the page content using automated tools and AI, then display the reformatted recipe back to the user. <span class='font-semibold'>We store extracted recipe data</span> for future retrieval but do not retain other page content beyond what is necessary to process recipes.",
        },
        section2: {
          title: "2. User Responsibilities",
          paragraph: "By using {appName}, you confirm that:",
          list: [
            "You have the legal right to access and process the URLs you submit.",
            "You will not use {appName} for any unlawful or unauthorized purposes.",
            "You will not attempt to disrupt, exploit, or abuse our service.",
          ],
        },
        section3: {
          title: "3. Stored Data",
          paragraph:
            "While we do not log submitted URLs, we store extracted recipe data for future access. Recipes may be available for a limited time before automatic deletion.",
        },
        section4: {
          title: "4. Ownership & Copyright",
          paragraph:
            "{appName} does not claim ownership over any third-party content processed through the service. All rights to original recipes and website content remain with their respective owners.",
        },
        section5: {
          title: "5. Third-Party Content",
          paragraph:
            "{appName} processes content from third-party websites. We are not responsible for the accuracy, legality, or availability of this content. If you believe content has been improperly processed, please contact the original content provider.",
        },
        section6: {
          title: "6. No Warranties",
          paragraph:
            '{appName} is provided "as is" without any warranties, express or implied. We do not guarantee:',
          list: [
            "The accuracy or reliability of extracted recipes.",
            "Continuous, uninterrupted service availability.",
            "That results will meet specific dietary or cooking needs.",
          ],
        },
        section7: {
          title: "7. Limitation of Liability",
          paragraph:
            "{appName} and its developers shall not be liable for any damages resulting from:",
          list: [
            "Inaccurate or incorrect recipe instructions.",
            "Use of AI-generated content.",
            "Loss of data, service disruptions, or errors.",
          ],
        },
        section8: {
          title: "8. Service Modifications",
          paragraph:
            "We reserve the right to modify, suspend, or discontinue {appName} at any time without prior notice.",
        },
        section9: {
          title: "9. Changes to These Terms",
          paragraph:
            "We may update these Terms from time to time. Continued use of {appName} constitutes acceptance of any revised terms.",
        },
        copyright: "© {year} {appName}. All rights reserved.",
      },
      loadingMessage: () => {
        const messages = [
          "Simmering your recipe...",
          "Kneading the data...",
          "Sautéing the ingredients...",
          "Whisking up some magic...",
          "Preheating the oven...",
          "Baking your results...",
          "Chopping through the numbers...",
          "Marinating the details...",
          "Converting your recipe...",
          "Mixing science and magic...",
          "Unlocking the full potential of your recipe...",
          "Waiting for the dough to rise...",
          "Sprinkling some digital parsley...",
          "Optimizing flavors with AI...",
          "Running on full processor power...",
          "Calculating the perfect bite...",
          "Downloading chef-level wisdom...",
          "Rendering deliciousness...",
          "Still faster than waiting for your pasta to boil...",
          "Good food takes time...",
          "BRB, chasing a rogue spatula...",
          "Waiting for inspiration to strike...",
          "Loading... time to check your fridge for snacks...",
          "Did you hear about the chef who made a great loading screen...",
          "Fermenting the data...",
          "Peeling back the layers...",
          "Firing up the stovetop...",
          "Dicing the details...",
          "Blending in some patience...",
          "Rolling out the results...",
          "Letting the flavors develop...",
          "Testing for doneness...",
          "Slow-cooking the process...",
          "Flipping the script...",
          "Beating the lag like egg whites...",
          "Crisping up the edges...",
          "Straining out the errors...",
          "Adding the finishing touches...",
          "Caramelizing the experience...",
          "Measuring twice, cutting once...",
          "Slicing through the complexity...",
          "Folding in the knowledge...",
          "Mixing up something great...",
          "Proofing the results...",
          "Grilling for perfection...",
          "Dusting off the flour...",
          "Tasting for balance...",
          "Sifting out the fluff...",
          "Garnishing for effect...",
          "Layering the details...",
          "Steeping in the flavors...",
          "Blending the perfect mix...",
          "Cooking up something special...",
          "Toasting the details...",
          "Rolling out the process...",
          "Seasoning the data...",
          "Melting the complexity...",
          "Boiling down the results...",
          "Spreading the goodness...",
          "Fermenting the ideas...",
          "Drizzling some extra magic...",
          "Plating the final touches...",
          "Flipping the bits...",
          "Grating through the data...",
          "Steaming ahead...",
          "Whipping up something great...",
          "Basting the experience...",
          "Charring the details...",
          "Infusing with flavor...",
          "Tempering the system...",
          "Zesting it up...",
          "Grinding through the process...",
          "Caramelizing the experience...",
          "Letting it marinate...",
          "Frothing up the goodness...",
          "Proofing the results...",
          "Blanching the complexity...",
          "Glazing the surface...",
          "Cracking the code...",
          "Garnishing for perfection...",
          "Smashing through obstacles...",
          "Shaking things up...",
          "Stacking the flavors...",
          "Layering the process...",
          "Slow-roasting the outcome...",
          "Stirring things together...",
          "Sweating the details...",
          "Sifting through the data...",
          "Scorching the speed...",
          "Roasting up perfection...",
          "Simmering for best results...",
          "Torching the inefficiencies...",
          "Chopping through the process...",
          "Braising for full effect...",
          "Spicing it up...",
          "Crushing the numbers...",
          "Frying up something good...",
          "Mixing up the magic...",
          "Blowing on the soup...",
          "Letting it rest before serving...",
          "Perfecting the recipe...",
        ];
        return messages[Math.floor(Math.random() * messages.length)];
      },
    },
    fr: {
      cookingMode: {
        headline: "Mode de cuisson",
        close: "Fermer",
        stepCounter: "Étape {current} sur {total}",
        recipeComplete: "Recette terminée!",
        relevantIngredients: "Ingrédients pertinents",
      },
      bookmarklet: {
        title: "Marque-page",
        description:
          "Faites glisser le bouton ci-dessous vers votre barre de favoris pour partager facilement des pages avec cette application.",
        dragMe: "Envoyer à Feedr",
        instructions: "Faites glisser ce bouton vers votre barre de favoris.",
        or: "Ou, copiez et collez le code ci-dessous:",
        copyInstructions:
          "Copiez le code ci-dessous et créez un nouveau favori. Collez ce code dans le champ URL du favori.",
      },
      recipe: {
        nutritionalInformation: {
          per_serving: "Par Portion",
          title: "Information Nutritionnelle",
          calories: "Calories",
          protein: "Protéines",
          fat: "Matières grasses",
          carbs: "Glucides",
        },
        shopping: {
          title: "Courses d'épicerie",
          description: "Générez une liste de courses à partir des ingrédients de votre recette.",
          button: "Ajouter à Instacart",
        },
        instacart: {
          button: "Obtenir les ingrédients de la recette",
          loading: "Création de la page de recette...",
          success: {
            title: "Lien Instacart généré",
            description: "{count} ingrédients ajoutés à votre panier Instacart.",
          },
          error: {
            title: "Erreur",
            description: "Échec de la génération du lien Instacart. Veuillez réessayer.",
          },
          affiliate: {
            disclosure: "Je gagne une commission d'Instacart pour les achats éligibles.",
            tooltip: "Cliquez pour ajouter les ingrédients à Instacart et vous faire livrer en aussi peu qu'une heure !"
          }
        },
        share: {
          defaultText: "Découvrez cette recette !",
          successTitle: "Partagé",
          successDescription: "Recette partagée avec succès.",
          errorTitle: "Erreur de partage",
          errorDescription: "Impossible de partager la recette.",
          copiedTitle: "Copié",
          copiedDescription: "URL de la recette copiée dans le presse-papiers.",
          clipboardErrorTitle: "Erreur du presse-papiers",
          clipboardErrorDescription: "Échec de la copie de l'URL.",
        },
        configuration: {
          title: "Configurer la recette",
          divider: {
            scaling: "Mise à l'échelle",
          },
          scale: {
            scale: "Échelle:",
            half: "Recette à moitié",
            full: "Recette complète",
            double: "Recette double",
            custom: "Recette {value}×",
          },
          servings: {
            new: "Nouvelles portions:",
            original: "Taille de portion originale: { original }",
          },
          method: {
            label: "Méthode de mise à l'échelle:",
            ingredients: "Par ingrédients",
            servings: "Par portions",
          },
        },
        error: {
          title: "Erreur",
          description:
            "Une erreur est survenue lors de la récupération de la recette.",
          action: "Réessayer",
          failedTitle: "Erreur !",
          failedDescription:
            "Une erreur s'est produite lors du traitement de votre recette. Veuillez revenir en arrière et réessayer.",
          failedAction: "Retour",
        },
        details: {
          title: "Détails de la recette",
          prepTime: "Temps de préparation:",
          cookTime: "Temps de cuisson:",
          servings: "Portions:",
        },
        sections: {
          ingredients: "Ingrédients",
          steps: "Étapes",
        },
        buttons: {
          originalRecipe: "Voir la recette originale",
        },
      },
      landing: {
        title: "Accédez à la recette",
        subtitle:
          "Collez une URL de recette, téléchargez une photo ou prenez une image pour une version propre et structurée—juste les ingrédients et les étapes.",
        inputPlaceholder: "URL de la recette",
        submitButton: "Obtenir la recette",
      },
      footer: {
        legal: "Mentions légales",
        privacyPolicyLink: "Politique de confidentialité",
        termsOfServiceLink: "Conditions d'utilisation",
        tools: "Outils",
        installAppLink: "Ajouter à l'écran d'accueil",
        appInstalled: "Installée",
        bookmarkletLink: "Marque-page",
        contact: "Contact",
        contactLink: "Contactez-nous",
      },
      contact: {
        form: {
          labels: {
            email: "Email",
            message: "Message",
          },
          placeholders: {
            email: "Entrez votre email",
            message: "Entrez votre message",
          },
          button: "Envoyer le feedback",
        },
        validation: {
          email: {
            invalid: "Email invalide",
            required: "L'email est requis",
          },
          message: {
            min: "Le message doit contenir au moins 10 caractères",
            required: "Le message est requis",
          },
        },
        toast: {
          success: {
            title: "Feedback envoyé avec succès !",
            description: "Merci pour votre feedback.",
          },
          failure: {
            title: "Échec de l'envoi du feedback.",
            description: "Veuillez réessayer plus tard.",
          },
        },
      },
      privacyPolicy: {
        title: "Politique de confidentialité",
        lastUpdated: "Dernière mise à jour:",
        intro:
          "Bienvenue sur {appName}. Votre vie privée est importante pour nous. Cette Politique de confidentialité explique comment nous gérons et traitons les informations lorsque vous utilisez notre service.",
        section1: {
          title: "1. Informations que nous traitons",
          paragraph1:
            "<span class='font-semibold'>{appName} ne collecte, ne stocke ni ne partage de données personnelles.</span> Cependant, lorsque vous soumettez une URL, nous traitons le contenu de la page en temps réel et vous renvoyons les informations extraites.",
          paragraph2:
            "<span class='font-semibold'>Nous stockons les données de recette extraites</span> afin de vous permettre d'y accéder ultérieurement. Cependant, nous ne conservons pas d'autres contenus ou métadonnées au-delà du traitement des recettes.",
        },
        section2: {
          title: "2. Pas de comptes utilisateurs",
          paragraph:
            "{appName} ne nécessite pas de comptes utilisateurs, de connexions ou d'informations personnelles pour fonctionner.",
        },
        section3: {
          title: "3. Données stockées",
          paragraph:
            "Bien que nous n'enregistrions pas les URL soumises, nous stockons les données de recette extraites pour une consultation ultérieure. Les recettes peuvent être disponibles pendant une durée limitée avant une suppression automatique.",
        },
        section4: {
          title: "4. Sites Web et contenu tiers",
          paragraph:
            "Lorsque vous soumettez une URL, vous reconnaissez que le contenu appartient à un site Web tiers. {appName} ne revendique pas la propriété de tout contenu extrait, ni ne le modifie, ne le stocke, ou ne le republie au-delà du cadre du traitement demandé par l'utilisateur. Nous encourageons les utilisateurs à consulter les politiques de confidentialité des sites tiers avant de soumettre des URL.",
        },
        section5: {
          title: "5. Conformité légale et usage équitable",
          paragraph:
            "{appName} ne viole pas intentionnellement les lois sur le droit d'auteur. Cependant, il incombe à l'utilisateur de s'assurer qu'il dispose du droit légal de traiter le contenu qu'il soumet. Si un propriétaire de contenu estime que son matériel est traité de manière inappropriée, il peut nous contacter pour trouver une solution.",
        },
        section6: {
          title: "6. Pas de cookies ni de suivi",
          paragraph:
            "{appName} n'utilise pas de cookies, de scripts de suivi, d'analyses ou toute autre forme de collecte persistante de données.",
        },
        section7: {
          title: "7. Modifications de cette politique",
          paragraph:
            "Nous pouvons mettre à jour cette Politique de confidentialité de temps à autre. Toute modification sera publiée sur cette page.",
        },
        copyright: "© {year} {appName}. Tous droits réservés.",
      },
      termsOfService: {
        title: "Conditions d'utilisation",
        lastUpdated: "Dernière mise à jour :",
        intro:
          "Bienvenue sur {appName}. En utilisant notre service, vous acceptez les conditions suivantes. Si vous n'êtes pas d'accord, veuillez ne pas utiliser {appName}.",
        section1: {
          title: "1. Description du service",
          paragraph:
            "{appName} permet aux utilisateurs de soumettre des URL accessibles au public contenant des recettes. Nous extrayons et traitons le contenu de la page à l'aide d'outils automatisés et d'IA, puis affichons la recette reformattée à l'utilisateur. <span class='font-semibold'>Nous stockons les données des recettes extraites</span> pour une récupération ultérieure, mais nous ne conservons pas d'autres contenus de page au-delà de ce qui est nécessaire pour traiter les recettes.",
        },
        section2: {
          title: "2. Responsabilités de l'utilisateur",
          paragraph: "En utilisant {appName}, vous confirmez que :",
          list: [
            "Vous avez le droit légal d'accéder et de traiter les URL que vous soumettez.",
            "Vous n'utiliserez pas {appName} à des fins illégales ou non autorisées.",
            "Vous n'essaierez pas de perturber, d'exploiter ou d'abuser de notre service.",
          ],
        },
        section3: {
          title: "3. Données stockées",
          paragraph:
            "Bien que nous n'enregistrions pas les URL soumises, nous stockons les données des recettes extraites pour un accès ultérieur. Les recettes peuvent être disponibles pendant une durée limitée avant une suppression automatique.",
        },
        section4: {
          title: "4. Propriété et droits d'auteur",
          paragraph:
            "{appName} ne revendique pas la propriété de tout contenu tiers traité par le service. Tous les droits sur les recettes originales et le contenu des sites web restent la propriété de leurs détenteurs respectifs.",
        },
        section5: {
          title: "5. Contenu tiers",
          paragraph:
            "{appName} traite le contenu provenant de sites tiers. Nous ne sommes pas responsables de l'exactitude, de la légalité ou de la disponibilité de ce contenu. Si vous estimez qu'un contenu a été traité de manière inappropriée, veuillez contacter le fournisseur de contenu original.",
        },
        section6: {
          title: "6. Absence de garanties",
          paragraph:
            '{appName} est fourni "tel quel" sans aucune garantie, expresse ou implicite. Nous ne garantissons pas :',
          list: [
            "L'exactitude ou la fiabilité des recettes extraites.",
            "La disponibilité continue et ininterrompue du service.",
            "Que les résultats répondront à des besoins diététiques ou culinaires spécifiques.",
          ],
        },
        section7: {
          title: "7. Limitation de responsabilité",
          paragraph:
            "{appName} et ses développeurs ne sauraient être tenus responsables des dommages résultant de :",
          list: [
            "Des instructions de recettes inexactes ou incorrectes.",
            "De l'utilisation de contenu généré par l'IA.",
            "De la perte de données, des interruptions de service ou des erreurs.",
          ],
        },
        section8: {
          title: "8. Modifications du service",
          paragraph:
            "Nous nous réservons le droit de modifier, de suspendre ou d'interrompre {appName} à tout moment sans préavis.",
        },
        section9: {
          title: "9. Modifications de ces conditions",
          paragraph:
            "Nous pouvons mettre à jour ces conditions de temps à autre. L'utilisation continue de {appName} constitue une acceptation de toute condition révisée.",
        },
        copyright: "© {year} {appName}. Tous droits réservés.",
      },
      loadingMessage: () => {
        const messages = [
          "Laissez mijoter votre recette...",
          "Pétrissant les données...",
          "Sautant les ingrédients...",
          "Fouettant un peu de magie...",
          "Préchauffant le four...",
          "Cuisson de vos résultats...",
          "Hachant les chiffres...",
          "Marinant les détails...",
          "Conversion de votre recette...",
          "Mélangeant science et magie...",
          "Déverrouillant le plein potentiel de votre recette...",
          "En attendant que la pâte lève...",
          "Saupoudrant un peu de persil numérique...",
          "Optimisant les saveurs avec l'IA...",
          "Fonctionnant à plein régime...",
          "Calculant la bouchée parfaite...",
          "Téléchargeant la sagesse d’un chef...",
          "Rendant la délicatesse...",
          "Plus rapide que d’attendre que vos pâtes bouillent...",
          "Un bon plat prend du temps...",
          "BRB, en poursuivant une spatule rebelle...",
          "Attendant que l’inspiration frappe...",
          "Chargement... un petit tour au frigo pour les snacks...",
          "Avez-vous entendu parler du chef qui a créé un super écran de chargement...",
          "Fermentant les données...",
          "Décortiquant les couches...",
          "Allumant la cuisinière...",
          "Découpant les détails...",
          "Incorporant un peu de patience...",
          "Déroulant les résultats...",
          "Laissant les saveurs se développer...",
          "Testant la cuisson...",
          "Cuisinant doucement le processus...",
          "Renversant la situation...",
          "Battant le lag comme des blancs d'œufs...",
          "Rendant croustillants les bords...",
          "Filtrant les erreurs...",
          "Ajoutant les touches finales...",
          "Caramélisant l'expérience...",
          "Mesurant deux fois, coupant une fois...",
          "Tranchant la complexité...",
          "Incorporant le savoir...",
          "Mélangeant quelque chose de génial...",
          "Lissant les résultats...",
          "Grillant vers la perfection...",
          "Dépoussiérant la farine...",
          "Goûtant l'équilibre...",
          "Tamisant l'excès...",
          "Décorant pour l'effet...",
          "Superposant les détails...",
          "Infusant les saveurs...",
          "Créant le mélange parfait...",
          "Préparant quelque chose de spécial...",
          "Grillant les détails...",
          "Déroulant le processus...",
          "Assaisonnant les données...",
          "Fondant la complexité...",
          "Réduisant les résultats...",
          "Répartissant la bonté...",
          "Fermentant les idées...",
          "Arrosant d'un peu de magie supplémentaire...",
          "Dressant les touches finales...",
          "Renversant les bits...",
          "Râpant les données...",
          "Avançant à la vapeur...",
          "Fouettant quelque chose de génial...",
          "Badigeonnant l'expérience...",
          "Carbonisant les détails...",
          "Infusant de la saveur...",
          "Tempérant le système...",
          "Zestant le tout...",
          "Broyant le processus...",
          "Caramélisant l'expérience...",
          "Laissant mariner...",
          "Créant une mousse de bonté...",
          "Lissant les résultats...",
          "Blanchissant la complexité...",
          "Glacifiant la surface...",
          "Craquant le code...",
          "Décorant pour la perfection...",
          "Écrasant les obstacles...",
          "Remuant les choses...",
          "Empilant les saveurs...",
          "Superposant le processus...",
          "Rôtissant lentement le résultat...",
          "Mélangeant tout ensemble...",
          "Transpirant les détails...",
          "Tamisant les données...",
          "Brûlant la vitesse...",
          "Rôtissant vers la perfection...",
          "Laisse mijoter pour de meilleurs résultats...",
          "Torchant les inefficacités...",
          "Hachant le processus...",
          "Braisant pour un effet complet...",
          "Relevons les saveurs...",
          "Écrasant les chiffres...",
          "Frayant quelque chose de bon...",
          "Mélangeant la magie...",
          "Refroidissant la soupe...",
          "Laissant reposer avant de servir...",
          "Parfaire la recette...",
        ];
        return messages[Math.floor(Math.random() * messages.length)];
      },
    },
    es: {
      cookingMode: {
        headline: "Modo de cocción",
        close: "Cerrar",
        stepCounter: "Paso {current} de {total}",
        recipeComplete: "¡Receta completada!",
        relevantIngredients: "Ingredientes relevantes",
      },
      bookmarklet: {
        title: "Marcador",
        description:
          "Arrastra el botón de abajo a tu barra de marcadores para compartir fácilmente páginas con esta aplicación.",
        dragMe: "Enviar a Feedr",
        instructions: "Arrastra este botón a tu barra de marcadores.",
        or: "O, copia y pega el código de abajo:",
        copyInstructions:
          "Copia el código de abajo y crea un nuevo marcador. Pega este código en el campo URL del marcador.",
      },
      recipe: {
        nutritionalInformation: {
          per_serving: "Por Porción",
          title: "Información nutricional",
          calories: "Calorías",
          protein: "Proteínas",
          fat: "Grasas",
          carbs: "Carbohidratos",
        },
        shopping: {
          title: "Lista de compras",
          description: "Genera una lista de compras con los ingredientes de tu receta.",
          button: "Añadir a Instacart",
        },
        instacart: {
          button: "Obtener ingredientes de la receta",
          loading: "Creando página de receta...",
          success: {
            title: "Enlace de Instacart generado",
            description: "Se añadieron {count} ingredientes a tu carrito de Instacart.",
          },
          error: {
            title: "Error",
            description: "Error al generar el enlace de Instacart. Por favor, inténtalo de nuevo.",
          },
          affiliate: {
            disclosure: "Gano una comisión de Instacart por compras que califiquen.",
            tooltip: "¡Haz clic para agregar ingredientes a Instacart y recibir la entrega en tan solo una hora!"
          }
        },
        share: {
          defaultText: "¡Mira esta receta!",
          successTitle: "Compartido",
          successDescription: "Receta compartida con éxito.",
          errorTitle: "Error al compartir",
          errorDescription: "No se pudo compartir la receta.",
          copiedTitle: "Copiado",
          copiedDescription: "URL de la receta copiada al portapapeles.",
          clipboardErrorTitle: "Error del portapapeles",
          clipboardErrorDescription: "Error al copiar la URL.",
        },
        configuration: {
          title: "Configurar Receta",
          divider: {
            scaling: "Escalado",
          },
          scale: {
            scale: "Escala:",
            half: "Receta a la mitad",
            full: "Receta completa",
            double: "Receta doble",
            custom: "Receta {value}×",
          },
          servings: {
            new: "Nuevas porciones:",
            original: "Tamaño original de porción: { original }",
          },
          method: {
            label: "Método de escalado:",
            ingredients: "Por ingredientes",
            servings: "Por porciones",
          },
        },
        error: {
          title: "Error",
          description: "Hubo un problema al obtener la receta.",
          action: "Intentar de nuevo",
          failedTitle: "¡Error!",
          failedDescription:
            "Hubo un error al procesar tu receta. Por favor, regresa e inténtalo de nuevo.",
          failedAction: "Regresar",
        },
        details: {
          title: "Detalles de la receta",
          prepTime: "Tiempo de preparación:",
          cookTime: "Tiempo de cocción:",
          servings: "Porciones:",
        },
        sections: {
          ingredients: "Ingredientes",
          steps: "Pasos",
        },
        buttons: {
          originalRecipe: "Ir a la receta original",
        },
      },
      landing: {
        title: "Obtén la receta",
        subtitle:
          "Pega una URL de receta, sube una foto o toma una imagen para obtener una versión limpia y estructurada—solo ingredientes y pasos.",
        inputPlaceholder: "URL de la receta",
        submitButton: "Obtener receta",
      },
      footer: {
        legal: "Legal",
        privacyPolicyLink: "Política de privacidad",
        termsOfServiceLink: "Términos de servicio",
        tools: "Herramientas",
        installAppLink: "Añadir a la pantalla de inicio",
        appInstalled: "Instalada",
        bookmarkletLink: "Marcador",
        contact: "Contacto",
        contactLink: "Contáctenos",
      },
      contact: {
        form: {
          labels: {
            email: "Correo electrónico",
            message: "Mensaje",
          },
          placeholders: {
            email: "Ingrese su correo electrónico",
            message: "Ingresa tu mensaje",
          },
          button: "Enviar feedback",
        },
        validation: {
          email: {
            invalid: "Correo electrónico inválido",
            required: "El correo electrónico es obligatorio",
          },
          message: {
            min: "El mensaje debe tener al menos 10 caracteres",
            required: "El mensaje es obligatorio",
          },
        },
        toast: {
          success: {
            title: "¡Feedback enviado con éxito!",
            description: "Gracias por tu feedback.",
          },
          failure: {
            title: "Error al enviar el feedback.",
            description: "Por favor, inténtalo de nuevo más tarde.",
          },
        },
      },
      privacyPolicy: {
        title: "Política de Privacidad",
        lastUpdated: "Última actualización:",
        intro:
          "Bienvenido a {appName}. Tu privacidad es importante para nosotros. Esta Política de Privacidad explica cómo manejamos y procesamos la información cuando usas nuestro servicio.",
        section1: {
          title: "1. Información que Procesamos",
          paragraph1:
            "<span class='font-semibold'>{appName} no recopila, almacena ni comparte datos personales.</span> Sin embargo, cuando envías una URL, procesamos el contenido de la página en tiempo real y te devolvemos la información extraída.",
          paragraph2:
            "<span class='font-semibold'>Almacenamos los datos de recetas extraídos</span> para permitirte acceder a ellos posteriormente. Sin embargo, no conservamos otro contenido de la página ni metadatos más allá del procesamiento de recetas.",
        },
        section2: {
          title: "2. Sin Cuentas de Usuario",
          paragraph:
            "{appName} no requiere cuentas de usuario, inicios de sesión ni información personal para funcionar.",
        },
        section3: {
          title: "3. Datos Almacenados",
          paragraph:
            "Aunque no registramos las URL enviadas, almacenamos los datos de recetas extraídos para futuras consultas. Las recetas pueden estar disponibles durante un tiempo limitado antes de ser eliminadas automáticamente.",
        },
        section4: {
          title: "4. Sitios Web y Contenido de Terceros",
          paragraph:
            "Al enviar una URL, reconoces que el contenido pertenece a un sitio web de terceros. {appName} no reclama la propiedad de ningún contenido extraído, ni lo modifica, almacena o republica fuera del alcance del procesamiento solicitado por el usuario. Animamos a los usuarios a revisar las políticas de privacidad de los sitios de terceros antes de enviar URL.",
        },
        section5: {
          title: "5. Cumplimiento Legal y Uso Justo",
          paragraph:
            "{appName} no viola intencionalmente las leyes de derechos de autor. Sin embargo, es responsabilidad del usuario asegurarse de tener el derecho legal para procesar el contenido que envía. Si el propietario de un contenido considera que su material se está procesando de manera inadecuada, puede contactarnos para resolver la situación.",
        },
        section6: {
          title: "6. Sin Cookies o Seguimiento",
          paragraph:
            "{appName} no utiliza cookies, scripts de seguimiento, análisis ni ninguna otra forma de recopilación persistente de datos.",
        },
        section7: {
          title: "7. Cambios en Esta Política",
          paragraph:
            "Podemos actualizar esta Política de Privacidad de vez en cuando. Cualquier cambio se publicará en esta página.",
        },
        copyright: "© {year} {appName}. Todos los derechos reservados.",
      },
      termsOfService: {
        title: "Términos de Servicio",
        lastUpdated: "Última actualización:",
        intro:
          "Bienvenido a {appName}. Al utilizar nuestro servicio, aceptas los siguientes términos. Si no estás de acuerdo, por favor no utilices {appName}.",
        section1: {
          title: "1. Descripción del Servicio",
          paragraph:
            "{appName} permite a los usuarios enviar URLs de acceso público que contienen recetas. Extraemos y procesamos el contenido de la página utilizando herramientas automatizadas e IA, y luego mostramos la receta reformateada al usuario. <span class='font-semibold'>Almacenamos los datos de las recetas extraídas</span> para su consulta futura, pero no retenemos otro contenido de la página más allá de lo necesario para procesar las recetas.",
        },
        section2: {
          title: "2. Responsabilidades del Usuario",
          paragraph: "Al utilizar {appName}, confirmas que:",
          list: [
            "Tienes el derecho legal de acceder y procesar las URLs que envías.",
            "No utilizarás {appName} para fines ilegales o no autorizados.",
            "No intentarás interrumpir, explotar o abusar de nuestro servicio.",
          ],
        },
        section3: {
          title: "3. Datos Almacenados",
          paragraph:
            "Aunque no registramos las URLs enviadas, almacenamos los datos de las recetas extraídas para acceso futuro. Las recetas pueden estar disponibles por un tiempo limitado antes de su eliminación automática.",
        },
        section4: {
          title: "4. Propiedad y Derechos de Autor",
          paragraph:
            "{appName} no reclama la propiedad de ningún contenido de terceros procesado a través del servicio. Todos los derechos sobre las recetas originales y el contenido del sitio web pertenecen a sus respectivos dueños.",
        },
        section5: {
          title: "5. Contenido de Terceros",
          paragraph:
            "{appName} procesa contenido de sitios web de terceros. No somos responsables de la precisión, legalidad o disponibilidad de este contenido. Si crees que algún contenido ha sido procesado de manera inadecuada, por favor contacta al proveedor original del contenido.",
        },
        section6: {
          title: "6. Sin Garantías",
          paragraph:
            '{appName} se proporciona "tal cual" sin garantías, expresas o implícitas. No garantizamos:',
          list: [
            "La precisión o fiabilidad de las recetas extraídas.",
            "La disponibilidad continua e ininterrumpida del servicio.",
            "Que los resultados cumplirán con necesidades dietéticas o culinarias específicas.",
          ],
        },
        section7: {
          title: "7. Limitación de Responsabilidad",
          paragraph:
            "{appName} y sus desarrolladores no serán responsables de ningún daño derivado de:",
          list: [
            "Instrucciones de recetas inexactas o incorrectas.",
            "El uso de contenido generado por IA.",
            "La pérdida de datos, interrupciones del servicio o errores.",
          ],
        },
        section8: {
          title: "8. Modificaciones del Servicio",
          paragraph:
            "Nos reservamos el derecho de modificar, suspender o descontinuar {appName} en cualquier momento sin previo aviso.",
        },
        section9: {
          title: "9. Cambios en estos Términos",
          paragraph:
            "Podemos actualizar estos Términos de vez en cuando. El uso continuo de {appName} constituye la aceptación de cualquier término revisado.",
        },
        copyright: "© {year} {appName}. Todos los derechos reservados.",
      },
      loadingMessage: () => {
        const messages = [
          "Cocinando a fuego lento tu receta...",
          "Amasando los datos...",
          "Salteando los ingredientes...",
          "Batido de magia...",
          "Precalentando el horno...",
          "Horneando tus resultados...",
          "Picando los números...",
          "Marinando los detalles...",
          "Convirtiendo tu receta...",
          "Mezclando ciencia y magia...",
          "Desbloqueando el potencial completo de tu receta...",
          "Esperando que la masa repose...",
          "Espolvoreando un poco de perejil digital...",
          "Optimizando sabores con IA...",
          "Funcionando a plena potencia...",
          "Calculando el bocado perfecto...",
          "Descargando la sabiduría de un chef...",
          "Renderizando lo delicioso...",
          "Más rápido que esperar a que hierva la pasta...",
          "La buena comida toma tiempo...",
          "BRB, persiguiendo una espátula rebelde...",
          "Esperando que la inspiración golpee...",
          "Cargando... tiempo para revisar la nevera en busca de snacks...",
          "¿Escuchaste del chef que hizo una gran pantalla de carga?",
          "Fermentando los datos...",
          "Pelando las capas...",
          "Encendiendo la estufa...",
          "Cortando los detalles...",
          "Incorporando un poco de paciencia...",
          "Desplegando los resultados...",
          "Dejando que los sabores se desarrollen...",
          "Probando la cocción...",
          "Cocinando el proceso a fuego lento...",
          "Cambiando el guion...",
          "Venciendo el retardo como claras de huevo...",
          "Dando crujido a los bordes...",
          "Filtrando los errores...",
          "Añadiendo los toques finales...",
          "Caramelizando la experiencia...",
          "Midiendo dos veces, cortando una vez...",
          "Cortando la complejidad...",
          "Incorporando el conocimiento...",
          "Mezclando algo genial...",
          "Demostrando los resultados...",
          "Asando hacia la perfección...",
          "Quitando el polvo a la harina...",
          "Probando el equilibrio...",
          "Cerniendo lo innecesario...",
          "Decorando para el efecto...",
          "Apilando los detalles...",
          "Infundiendo los sabores...",
          "Creando la mezcla perfecta...",
          "Cocinando algo especial...",
          "Tostando los detalles...",
          "Desplegando el proceso...",
          "Sazonando los datos...",
          "Derritiendo la complejidad...",
          "Hirviendo los resultados...",
          "Difundiendo la bondad...",
          "Fermentando las ideas...",
          "Rociando un poco de magia extra...",
          "Emplatando los toques finales...",
          "Cambiando los bits...",
          "Rallando los datos...",
          "Avanzando al vapor...",
          "Batido de algo genial...",
          "Glaseando la experiencia...",
          "Carbonizando los detalles...",
          "Infundiendo sabor...",
          "Templando el sistema...",
          "Rallando la esencia...",
          "Molino en proceso...",
          "Caramelizando la experiencia...",
          "Dejándolo marinar...",
          "Espumando la bondad...",
          "Demostrando los resultados...",
          "Blanqueando la complejidad...",
          "Glaseando la superficie...",
          "Descifrando el código...",
          "Decorando para la perfección...",
          "Aplastando obstáculos...",
          "Agitando las cosas...",
          "Apilando los sabores...",
          "Superponiendo el proceso...",
          "Asando lentamente el resultado...",
          "Reuniendo todo...",
          "Transpirando los detalles...",
          "Cerniendo los datos...",
          "Quemando la velocidad...",
          "Asando hacia la perfección...",
          "Cocinando a fuego lento para mejores resultados...",
          "Eliminando ineficiencias...",
          "Picando el proceso...",
          "Guisando para un efecto completo...",
          "Dándole un toque de sabor...",
          "Aplastando los números...",
          "Freír algo bueno...",
          "Mezclando la magia...",
          "Soplando la sopa...",
          "Dejándolo reposar antes de servir...",
          "Perfeccionando la receta...",
        ];
        return messages[Math.floor(Math.random() * messages.length)];
      },
    },
  },
}));
