<script setup lang="ts">
import { reactive, ref, onMounted } from "vue";
import * as yup from "yup";
import { uploadData } from "aws-amplify/storage";
import { useI18n } from "vue-i18n";

// Other composables and helpers
const { gtag } = useGtag();
const toast = useToast();
const localePath = useLocalePath();
const route = useRoute();
const { t, locale } = useI18n({ useScope: "local" });

const state = reactive({
  recipeUrl: route.query.url || "",
});

const submitting = ref(false);

const schema = yup.object().shape({
  recipeUrl: yup
    .string()
    .url(t("landing.invalidUrl"))
    .required(t("landing.urlRequired")),
});

const page = {
  faq: {
    title: t("faq.title"),
    description: t("faq.description"),
    items: [
      {
        label: t("faq.items.0.label"),
        content: t("faq.items.0.content"),
      },
      {
        label: t("faq.items.1.label"),
        content: t("faq.items.1.content"),
      },
      {
        label: t("faq.items.2.label"),
        content: t("faq.items.2.content"),
      },
      {
        label: t("faq.items.3.label"),
        content: t("faq.items.3.content"),
      },
      {
        label: t("faq.items.4.label"),
        content: t("faq.items.4.content"),
      },
      {
        label: t("faq.items.5.label"),
        content: t("faq.items.5.content"),
      },
      {
        label: t("faq.items.6.label"),
        content: t("faq.items.6.content"),
      },
      {
        label: t("faq.items.7.label"),
        content: t("faq.items.7.content"),
      },
      {
        label: t("faq.items.8.label"),
        content: t("faq.items.8.content"),
      },
      {
        label: t("faq.items.9.label"),
        content: t("faq.items.9.content"),
      },
    ],
  },
  features: {
    title: t("landing.features.title"),
    headline: t("landing.features.headline"),
    description: t("landing.features.description"),
    items: [
      {
        title: t("landing.features.items.0.title"),
        description: t("landing.features.items.0.description"),
        icon: "heroicons:document-text",
      },
      {
        title: t("landing.features.items.1.title"),
        description: t("landing.features.items.1.description"),
        icon: "heroicons:eye",
      },
      {
        title: t("landing.features.items.2.title"),
        description: t("landing.features.items.2.description"),
        icon: "heroicons:chart-pie",
      },
      {
        title: t("landing.features.items.3.title"),
        description: t("landing.features.items.3.description"),
        icon: "heroicons:shopping-cart",
      },
      {
        title: t("landing.features.items.4.title"),
        description: t("landing.features.items.4.description"),
        icon: "heroicons:bookmark",
      },
      {
        title: t("landing.features.items.5.title"),
        description: t("landing.features.items.5.description"),
        icon: "heroicons:clock",
      },
    ],
  },
};

const validate = async (state: any): Promise<FormError[]> => {
  try {
    await schema.validate(state, { abortEarly: false });
    return [];
  } catch (validationErrors) {
    return validationErrors.inner.map((error: yup.ValidationError) => ({
      path: error.path,
      message: error.message,
    }));
  }
};

onMounted(() => {
  if (state.recipeUrl) {
    onSubmit({ event: { preventDefault: () => {} } } as any);
  }
});

async function onSubmit(event: FormSubmitEvent<any>) {
  try {
    submitting.value = true;
    gtag("event", "submit_recipe", {
      event_category: "interaction",
      event_label: "Recipe Submission",
      value: state.recipeUrl,
    });

    const recipeStore = useRecipe();

    const { id } =
      (await recipeStore.createRecipe({
        url: state.recipeUrl,
        language: locale.value,
      })) || {};

    console.log("Recipe created with ID:", id);

    if (id) {
      navigateTo(localePath(`/recipes/${id}`));
    }
  } catch (error) {
    toast.add({
      id: "recipe_error",
      title: t("landing.submitErrorTitle"),
      description: t("landing.submitErrorDescription"),
      icon: "i-heroicons-exclamation-circle",
      color: "red",
      timeout: 5000,
    });
  } finally {
    submitting.value = false;
  }
}

// File input logic for browsing images
const fileInput = ref<HTMLInputElement | null>(null);
function browseForImage() {
  fileInput.value?.click();
}

// File input logic for taking a photo (camera capture)
const cameraInput = ref<HTMLInputElement | null>(null);
function takePhoto() {
  cameraInput.value?.click();
}

function handleFileUpload(event: Event) {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    console.log("Selected file:", file);

    // Check that the file is an image (even though the input only accepts images)
    if (!file.type.startsWith("image/")) {
      toast.add({
        id: "invalid_file_type",
        title: t("landing.invalidFileTypeTitle"),
        description: t("landing.invalidFileTypeDescription"),
        icon: "heroicons:exclamation-circle",
        color: "red",
        timeout: 5000,
      });
      return;
    }

    // Generate a UUID and preserve the file extension
    const uuid = crypto.randomUUID();
    let extension = file.name.split(".").pop() || "";
    extension = extension.toLowerCase();

    const fileReader = new FileReader();
    fileReader.readAsArrayBuffer(file);

    fileReader.onload = async (e) => {
      const fileData = e.target?.result;
      if (fileData) {
        try {
          // Upload the file using the UUID and extension
          const filePath = `picture-submissions/${uuid}.${extension}`;
          await uploadData({
            data: fileData,
            path: filePath,
          });
          console.log("File uploaded successfully!");

          toast.add({
            id: "upload_success",
            title: t("landing.uploadSuccessTitle"),
            description: t("landing.uploadSuccessDescription"),
            icon: "heroicons:check-circle",
            color: "green",
            timeout: 5000,
          });

          // Create a new recipe with an empty URL and the image's UUID (including extension)
          const recipeStore = useRecipe();
          const { id } = await recipeStore.createRecipe({
            url: "",
            pictureSubmissionUUID: `${uuid}.${extension}`,
          });
          if (id) {
            navigateTo(localePath(`/recipes/${id}`));
          }
        } catch (uploadError) {
          console.error("Error uploading file:", uploadError);
          toast.add({
            id: "upload_error",
            title: t("landing.uploadErrorTitle"),
            description: t("landing.uploadErrorDescription"),
            icon: "heroicons:exclamation-circle",
            color: "red",
            timeout: 5000,
          });
        }
      }
    };
  }
}
</script>

<template>
  <div>
    <ULandingHero
      :title="t('landing.title')"
      :description="t('landing.subtitle')"
    >
      <template #default>
        <div class="mx-auto w-full md:w-1/2 text-center space-y-4">
          <UForm
            :validate="validate"
            :state="state"
            class="space-y-4"
            @submit="onSubmit"
          >
            <UFormGroup name="recipeUrl">
              <div class="flex items-center">
                <UInput
                  v-model="state.recipeUrl"
                  :placeholder="t('landing.inputPlaceholder')"
                  class="flex-grow"
                />
                <UButton
                  type="button"
                  @click="browseForImage"
                  class="ml-2"
                  icon="heroicons:photo-16-solid"
                  variant="ghost"
                />
                <UButton
                  type="button"
                  @click="takePhoto"
                  class="ml-2"
                  icon="heroicons:camera"
                  variant="ghost"
                />
                <input
                  ref="fileInput"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleFileUpload"
                />
                <input
                  ref="cameraInput"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  class="hidden"
                  @change="handleFileUpload"
                />
              </div>
            </UFormGroup>
            <UButton type="submit" :loading="submitting" block>
              {{ t("landing.submitButton") }}
            </UButton>
          </UForm>
        </div>
      </template>
      <!-- Bottom slot with subtle reassurance text -->
      <template #bottom>
        <p class="text-sm text-gray-500 mt-4 flex items-center justify-center">
          {{ t("landing.freeInfo") }}
        </p>
      </template>
    </ULandingHero>

    <ULandingSection
      :title="page.features.title"
      :description="page.features.description"
      :headline="page.features.headline"
    >
      <UPageGrid
        id="features"
        class="scroll-mt-[calc(var(--header-height)+140px+128px+96px)]"
      >
        <ULandingCard
          v-for="(item, index) in page.features.items"
          :key="index"
          v-bind="item"
        />
      </UPageGrid>
    </ULandingSection>

    <ULandingSection
      id="faq"
      :title="page.faq.title"
      :description="page.faq.description"
      class="scroll-mt-[var(--header-height)]"
    >
      <ULandingFAQ
        multiple
        :items="page.faq.items"
        :ui="{
          button: {
            label: 'font-semibold',
            trailingIcon: {
              base: 'w-6 h-6',
            },
          },
        }"
        class="max-w-4xl mx-auto"
      />
    </ULandingSection>
  </div>
</template>

<style module scoped></style>

<i18n lang="json">
{
  "en": {
    "faq": {
      "title": "Frequently Asked Questions",
      "description": "Learn more about how Feedr works, including how our AI generates your recipes and nutritional information.",
      "items": [
        {
          "label": "How does Feedr work?",
          "content": "Feedr uses advanced AI to extract and generate a clean, structured recipe along with detailed nutritional information from any URL or image."
        },
        {
          "label": "Is Feedr free to use?",
          "content": "Yes, Feedr is completely free. Signing up is only required if you want to bookmark recipes for later reference."
        },
        {
          "label": "How accurate is the nutritional information?",
          "content": "Feedr’s AI analyzes the ingredients to estimate nutritional details, giving you a comprehensive breakdown."
        },
        {
          "label": "Can I upload images of handwritten recipes?",
          "content": "Absolutely. Feedr accepts photos—including handwritten or scanned recipes—and converts them into a clear format."
        },
        {
          "label": "How is my data used?",
          "content": "Your recipe data is processed solely to generate a readable version and nutritional insights. We prioritize your privacy."
        },
        {
          "label": "Do I need to create an account?",
          "content": "No, you can use Feedr without an account. Registration is only required to bookmark recipes."
        },
        {
          "label": "How does the Instacart integration work?",
          "content": "With one click, you can add all the ingredients from a recipe to your Instacart cart for convenient shopping."
        },
        {
          "label": "What if the AI makes a mistake?",
          "content": "Our AI is continuously learning and improving. If you notice any errors, please let us know so we can refine it further."
        },
        {
          "label": "Can I adjust the recipe servings?",
          "content": "Yes, Feedr offers scaling options that allow you to customize the recipe servings to your needs."
        },
        {
          "label": "How is AI used in Feedr?",
          "content": "Feedr leverages AI to generate both the recipe and the nutritional information, ensuring you receive accurate and useful data every time."
        }
      ]
    },
    "landing": {
      "title": "Get to the Recipe",
      "subtitle": "Paste a recipe URL, upload a photo, or snap a picture for a clean, structured version—just ingredients and steps.",
      "inputPlaceholder": "Recipe URL",
      "submitButton": "Get Recipe",
      "invalidUrl": "Invalid URL",
      "urlRequired": "URL is required",
      "submitErrorTitle": "Error!",
      "submitErrorDescription": "Error creating recipe.",
      "invalidFileTypeTitle": "Invalid File Type",
      "invalidFileTypeDescription": "Only image files are allowed.",
      "uploadSuccessTitle": "Upload Successful",
      "uploadSuccessDescription": "Your image was successfully uploaded!",
      "uploadErrorTitle": "Upload Error",
      "uploadErrorDescription": "Failed to upload image.",
      "freeInfo": "Get your recipe for free—no signup required! Sign up only if you want to bookmark recipes.",
      "features": {
        "title": "Why Feedr?",
        "headline": "Unlock the full potential of your recipes",
        "description": "Feedr turns messy recipes into clear, structured guides. Enjoy smart extraction, detailed nutritional insights, and effortless grocery integration.",
        "items": [
          {
            "title": "Effortless Extraction",
            "description": "Submit a recipe via URL or image, and let Feedr handle the rest."
          },
          {
            "title": "Enhanced Readability",
            "description": "Enjoy beautifully formatted recipes that are easy to follow."
          },
          {
            "title": "Comprehensive Nutrition",
            "description": "Get detailed nutritional information with every recipe."
          },
          {
            "title": "Grocery Integration",
            "description": "Add all ingredients to your Instacart cart with one click."
          },
          {
            "title": "Bookmark Recipes",
            "description": "Save your favorite recipes for planning and quick reference."
          },
          {
            "title": "Personalized Experience",
            "description": "Scale recipes and customize servings to perfectly suit your needs."
          }
        ]
      }
    }
  },
  "fr": {
    "faq": {
      "title": "Questions Fréquemment Posées",
      "description": "En savoir plus sur le fonctionnement de Feedr et comment notre IA génère vos recettes et informations nutritionnelles.",
      "items": [
        {
          "label": "Comment fonctionne Feedr ?",
          "content": "Feedr utilise une intelligence artificielle avancée pour extraire et générer une recette claire et structurée ainsi que des informations nutritionnelles détaillées à partir de n'importe quelle URL ou image."
        },
        {
          "label": "Feedr est-il gratuit ?",
          "content": "Oui, Feedr est entièrement gratuit. L'inscription n'est requise que si vous souhaitez enregistrer vos recettes pour une consultation ultérieure."
        },
        {
          "label": "Quelle est la précision des informations nutritionnelles ?",
          "content": "L'IA de Feedr analyse les ingrédients pour estimer les détails nutritionnels, vous fournissant ainsi une répartition complète."
        },
        {
          "label": "Puis-je télécharger des images de recettes manuscrites ?",
          "content": "Absolument. Feedr accepte les photos — y compris les recettes manuscrites ou scannées — et les convertit en un format clair."
        },
        {
          "label": "Comment mes données sont-elles utilisées ?",
          "content": "Vos données de recette sont traitées uniquement pour générer une version lisible et des informations nutritionnelles. Nous accordons la priorité à votre vie privée."
        },
        {
          "label": "Dois-je créer un compte ?",
          "content": "Non, vous pouvez utiliser Feedr sans compte. L'inscription est uniquement nécessaire pour enregistrer des recettes."
        },
        {
          "label": "Comment fonctionne l'intégration avec Instacart ?",
          "content": "D'un simple clic, vous pouvez ajouter tous les ingrédients d'une recette à votre panier Instacart pour faciliter vos courses."
        },
        {
          "label": "Que faire si l'IA se trompe ?",
          "content": "Notre IA apprend et s'améliore continuellement. Si vous remarquez des erreurs, veuillez nous le signaler afin que nous puissions l'affiner davantage."
        },
        {
          "label": "Puis-je ajuster les portions de la recette ?",
          "content": "Oui, Feedr offre des options de mise à l'échelle qui vous permettent d'adapter les portions de la recette selon vos besoins."
        },
        {
          "label": "Comment l'IA est-elle utilisée dans Feedr ?",
          "content": "Feedr exploite l'IA pour générer à la fois la recette et les informations nutritionnelles, vous assurant ainsi des données précises et utiles à chaque fois."
        }
      ]
    },
    "landing": {
      "title": "Accédez à la recette",
      "subtitle": "Collez l'URL d'une recette, téléchargez une photo ou prenez une photo pour obtenir une version propre et structurée – uniquement les ingrédients et les étapes.",
      "inputPlaceholder": "URL de la recette",
      "submitButton": "Obtenez la recette",
      "invalidUrl": "URL invalide",
      "urlRequired": "L'URL est requise",
      "submitErrorTitle": "Erreur !",
      "submitErrorDescription": "Erreur lors de la création de la recette.",
      "invalidFileTypeTitle": "Type de fichier invalide",
      "invalidFileTypeDescription": "Seuls les fichiers image sont autorisés.",
      "uploadSuccessTitle": "Téléchargement réussi",
      "uploadSuccessDescription": "Votre image a été téléchargée avec succès !",
      "uploadErrorTitle": "Erreur de téléchargement",
      "uploadErrorDescription": "Échec du téléchargement de l'image.",
      "freeInfo": "Recevez votre recette gratuitement – aucune inscription n'est requise ! Inscrivez-vous uniquement pour enregistrer vos recettes.",
      "features": {
        "title": "Pourquoi Feedr ?",
        "headline": "Libérez tout le potentiel de vos recettes",
        "description": "Feedr transforme des recettes désordonnées en guides clairs et structurés. Profitez d'une extraction intelligente, d'informations nutritionnelles détaillées et d'une intégration aisée pour vos courses.",
        "items": [
          {
            "title": "Extraction sans effort",
            "description": "Soumettez une recette via une URL ou une image et laissez Feedr faire le reste."
          },
          {
            "title": "Lisibilité améliorée",
            "description": "Profitez de recettes magnifiquement formatées et faciles à suivre."
          },
          {
            "title": "Nutrition complète",
            "description": "Obtenez des informations nutritionnelles détaillées pour chaque recette."
          },
          {
            "title": "Intégration courses",
            "description": "Ajoutez tous les ingrédients à votre panier Instacart en un clic."
          },
          {
            "title": "Recettes en favoris",
            "description": "Enregistrez vos recettes préférées pour une référence rapide et une planification facile."
          },
          {
            "title": "Expérience personnalisée",
            "description": "Ajustez les portions et adaptez les recettes à vos besoins."
          }
        ]
      }
    }
  },
  "es": {
    "faq": {
      "title": "Preguntas Frecuentes",
      "description": "Aprende más sobre cómo funciona Feedr y cómo la IA genera tus recetas e información nutricional.",
      "items": [
        {
          "label": "¿Cómo funciona Feedr?",
          "content": "Feedr utiliza inteligencia artificial avanzada para extraer y generar una receta clara y estructurada, junto con información nutricional detallada, a partir de cualquier URL o imagen."
        },
        {
          "label": "¿Es Feedr gratuito?",
          "content": "Sí, Feedr es completamente gratuito. Solo es necesario registrarse si deseas guardar recetas para consultarlas posteriormente."
        },
        {
          "label": "¿Qué tan precisa es la información nutricional?",
          "content": "La IA de Feedr analiza los ingredientes para estimar los detalles nutricionales, proporcionándote un desglose completo."
        },
        {
          "label": "¿Puedo subir imágenes de recetas escritas a mano?",
          "content": "Claro. Feedr acepta fotos, incluidas recetas escritas a mano o escaneadas, y las convierte en un formato claro."
        },
        {
          "label": "¿Cómo se utilizan mis datos?",
          "content": "Tus datos de recetas se procesan únicamente para generar una versión legible e información nutricional. Respetamos tu privacidad."
        },
        {
          "label": "¿Necesito crear una cuenta?",
          "content": "No, puedes usar Feedr sin una cuenta. El registro solo es necesario para guardar recetas."
        },
        {
          "label": "¿Cómo funciona la integración con Instacart?",
          "content": "Con un solo clic, puedes añadir todos los ingredientes de una receta a tu carrito de Instacart para facilitar tus compras."
        },
        {
          "label": "¿Qué pasa si la IA comete un error?",
          "content": "Nuestra IA está en constante aprendizaje y mejora. Si notas algún error, infórmanos para que podamos ajustarla."
        },
        {
          "label": "¿Puedo ajustar las porciones de la receta?",
          "content": "Sí, Feedr ofrece opciones de escalado que te permiten personalizar las porciones de la receta según tus necesidades."
        },
        {
          "label": "¿Cómo se utiliza la IA en Feedr?",
          "content": "Feedr utiliza inteligencia artificial para generar la receta y la información nutricional, asegurándote datos precisos y útiles en todo momento."
        }
      ]
    },
    "landing": {
      "title": "Obtén la receta",
      "subtitle": "Pega la URL de una receta, sube una foto o toma una imagen para obtener una versión limpia y estructurada: solo ingredientes y pasos.",
      "inputPlaceholder": "URL de la receta",
      "submitButton": "Obtén la receta",
      "invalidUrl": "URL inválida",
      "urlRequired": "La URL es obligatoria",
      "submitErrorTitle": "¡Error!",
      "submitErrorDescription": "Error al crear la receta.",
      "invalidFileTypeTitle": "Tipo de archivo inválido",
      "invalidFileTypeDescription": "Solo se permiten archivos de imagen.",
      "uploadSuccessTitle": "Carga exitosa",
      "uploadSuccessDescription": "¡Tu imagen se ha cargado correctamente!",
      "uploadErrorTitle": "Error de carga",
      "uploadErrorDescription": "Error al cargar la imagen.",
      "freeInfo": "¡Recibe tu receta gratis, sin necesidad de registrarte! Regístrate solo si deseas guardar recetas.",
      "features": {
        "title": "¿Por qué Feedr?",
        "headline": "Desbloquea el máximo potencial de tus recetas",
        "description": "Feedr convierte recetas desordenadas en guías claras y estructuradas. Disfruta de una extracción inteligente, información nutricional detallada e integración sencilla con Instacart.",
        "items": [
          {
            "title": "Extracción sin esfuerzo",
            "description": "Envía una receta mediante URL o imagen y deja que Feedr haga el resto."
          },
          {
            "title": "Mayor legibilidad",
            "description": "Disfruta de recetas bellamente formateadas y fáciles de seguir."
          },
          {
            "title": "Nutrición completa",
            "description": "Obtén información nutricional detallada con cada receta."
          },
          {
            "title": "Integración de compras",
            "description": "Agrega todos los ingredientes a tu carrito de Instacart con un solo clic."
          },
          {
            "title": "Recetas marcadas",
            "description": "Guarda tus recetas favoritas para consultarlas y planificar tus comidas."
          },
          {
            "title": "Experiencia personalizada",
            "description": "Ajusta las recetas y personaliza las porciones según tus necesidades."
          }
        ]
      }
    }
  }
}
</i18n>
