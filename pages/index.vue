<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue';
import * as yup from 'yup';
import { useI18n } from 'vue-i18n';
import type { FormError } from '#ui/types';
import { uploadData } from 'aws-amplify/storage';

definePageMeta({
  layout: 'landing',
});

// SEO optimization for the homepage
useSeoMeta({
  title: 'Feedr - Get to the Recipe | Extract, Simplify, and Use',
  ogTitle: 'Feedr - Get to the Recipe | Extract, Simplify, and Use',
  description:
    'Transform recipe URLs and images into clean, structured formats with just ingredients and steps. Get nutritional information and more.',
  ogDescription:
    'Transform recipe URLs and images into clean, structured formats with just ingredients and steps. Get nutritional information and more.',
  ogImage: 'https://feedr.app/web-app-manifest-512x512.png',
  twitterCard: 'summary_large_image',
  keywords:
    'recipe extractor, clean recipes, recipe formatting, nutrition information, recipe app, recipe parser',
});

// Other composables and helpers
const { gtag } = useGtag();
const toast = useToast();
const localePath = useLocalePath();
const route = useRoute();
const { t, locale } = useI18n({ useScope: 'local' });

const state = reactive({
  recipeUrl: Array.isArray(route.query.url) ? route.query.url[0] || '' : route.query.url || '',
});

const submitting = ref(false);

const schema = yup.object().shape({
  recipeUrl: yup.string().url(t('landing.invalidUrl')).required(t('landing.urlRequired')),
});

const page = {
  faq: {
    title: t('faq.title'),
    description: t('faq.description'),
    items: [
      {
        label: t('faq.items.0.label'),
        content: t('faq.items.0.content'),
      },
      {
        label: t('faq.items.1.label'),
        content: t('faq.items.1.content'),
      },
      {
        label: t('faq.items.2.label'),
        content: t('faq.items.2.content'),
      },
      {
        label: t('faq.items.3.label'),
        content: t('faq.items.3.content'),
      },
      {
        label: t('faq.items.4.label'),
        content: t('faq.items.4.content'),
      },
      {
        label: t('faq.items.5.label'),
        content: t('faq.items.5.content'),
      },
      {
        label: t('faq.items.6.label'),
        content: t('faq.items.6.content'),
      },
      {
        label: t('faq.items.7.label'),
        content: t('faq.items.7.content'),
      },
      {
        label: t('faq.items.8.label'),
        content: t('faq.items.8.content'),
      },
      {
        label: t('faq.items.9.label'),
        content: t('faq.items.9.content'),
      },
      {
        label: t('faq.items.10.label'),
        content: t('faq.items.10.content'),
      },
    ],
  },
  features: {
    title: t('landing.features.title'),
    headline: t('landing.features.headline'),
    description: t('landing.features.description'),
    items: [
      {
        title: t('landing.features.items.0.title'),
        description: t('landing.features.items.0.description'),
        icon: 'heroicons:document-text',
      },
      {
        title: t('landing.features.items.1.title'),
        description: t('landing.features.items.1.description'),
        icon: 'heroicons:eye',
      },
      {
        title: t('landing.features.items.2.title'),
        description: t('landing.features.items.2.description'),
        icon: 'heroicons:chart-pie',
      },
      {
        title: t('landing.features.items.3.title'),
        description: t('landing.features.items.3.description'),
        icon: 'heroicons:shopping-cart',
      },
      {
        title: t('landing.features.items.4.title'),
        description: t('landing.features.items.4.description'),
        icon: 'i-heroicons-bookmark',
      },
      {
        title: t('landing.features.items.5.title'),
        description: t('landing.features.items.5.description'),
        icon: 'heroicons:clock',
      },
      {
        title: t('landing.features.items.6.title'),
        description: t('landing.features.items.6.description'),
        icon: 'lucide-lab:mortar-pestle',
      },
      {
        title: t('landing.features.items.7.title'),
        description: t('landing.features.items.7.description'),
        icon: 'heroicons:device-phone-mobile',
      },
    ],
  },
};

const validate = async (state: Record<string, unknown>): Promise<FormError<string>[]> => {
  try {
    await schema.validate(state, { abortEarly: false });
    return [];
  } catch (err) {
    const validationErrors = err as yup.ValidationError;
    return validationErrors.inner.map((err) => ({
      path: err.path || '',
      message: err.message,
    }));
  }
};
onMounted(() => {
  if (state.recipeUrl) {
    onSubmit();
  }
});

async function onSubmit(): Promise<void> {
  try {
    submitting.value = true;
    gtag('event', 'submit_recipe', {
      event_category: 'interaction',
      event_label: 'Recipe Submission',
      value: state.recipeUrl,
    });

    const recipeStore = useRecipe();

    const { id } =
      (await recipeStore.createRecipe({
        url: state.recipeUrl,
        language: locale.value,
      })) || {};

    console.log('Recipe created with ID:', id);

    if (id) {
      navigateTo(localePath(`/recipes/${id}`));
    }
  } catch {
    toast.add({
      id: 'recipe_error',
      title: t('landing.submitErrorTitle'),
      description: t('landing.submitErrorDescription'),
      icon: 'i-heroicons-exclamation-circle',
      color: 'error',
      duration: 5000,
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
    console.log('Selected file:', file);

    // Check that the file is an image (even though the input only accepts images)
    if (!file.type.startsWith('image/')) {
      toast.add({
        id: 'invalid_file_type',
        title: t('landing.invalidFileTypeTitle'),
        description: t('landing.invalidFileTypeDescription'),
        icon: 'heroicons:exclamation-circle',
        color: 'error',
        duration: 5000,
      });
      return;
    }

    // Generate a UUID and preserve the file extension
    const uuid = crypto.randomUUID();
    let extension = file.name.split('.').pop() || '';
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
          console.log('File uploaded successfully!');

          toast.add({
            id: 'upload_success',
            title: t('landing.uploadSuccessTitle'),
            description: t('landing.uploadSuccessDescription'),
            icon: 'heroicons:check-circle',
            color: 'success',
            duration: 5000,
          });

          // Create a new recipe with an empty URL and the image's UUID (including extension)
          const recipeStore = useRecipe();
          const { id } = await recipeStore.createRecipe({
            url: '',
            pictureSubmissionUUID: `${uuid}.${extension}`,
          });
          if (id) {
            navigateTo(localePath(`/recipes/${id}`));
          }
        } catch (uploadError) {
          console.error('Error uploading file:', uploadError);
          toast.add({
            id: 'upload_error',
            title: t('landing.uploadErrorTitle'),
            description: t('landing.uploadErrorDescription'),
            icon: 'heroicons:exclamation-circle',
            color: 'error',
            duration: 5000,
          });
        }
      }
    };
  }
}
</script>

<template>
  <div>
    <UPageHero :title="t('landing.title')" :description="t('landing.subtitle')">
      <template #default>
        <div class="mx-auto w-full md:w-1/2 text-center space-y-4">
          <UForm :validate="validate" :state="state" class="space-y-4" @submit="onSubmit">
            <UFormField name="recipeUrl">
              <div class="flex items-center">
                <UInput
                  v-model="state.recipeUrl"
                  :placeholder="t('landing.inputPlaceholder')"
                  class="grow"
                />
                <UButton
                  type="button"
                  class="ml-2"
                  icon="heroicons:photo-16-solid"
                  variant="ghost"
                  @click="browseForImage"
                />
                <UButton
                  type="button"
                  class="ml-2"
                  icon="heroicons:camera"
                  variant="ghost"
                  @click="takePhoto"
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
            </UFormField>
            <UButton type="submit" :loading="submitting" block>
              {{ t('landing.submitButton') }}
            </UButton>
            <p
              class="text-xs text-(--ui-text-muted) mt-2 flex items-center justify-center opacity-80"
            >
              {{ t('landing.freeInfo') }}
            </p>
          </UForm>
        </div>
      </template>
      <!-- Empty bottom slot -->
      <template #bottom />
    </UPageHero>

    <UPageSection
      :title="page.features.title"
      :description="page.features.description"
      :headline="page.features.headline"
    >
      <div
        id="features"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 scroll-mt-[calc(var(--header-height)+140px+128px+96px)]"
      >
        <UPageFeature
          v-for="(item, index) in page.features.items"
          :key="index"
          :title="item.title"
          :description="item.description"
          :icon="item.icon"
          orientation="vertical"
        />
      </div>
    </UPageSection>

    <UPageSection
      id="faq"
      :title="page.faq.title"
      :description="page.faq.description"
      class="scroll-mt-[var(--header-height)]"
    >
      <UPageAccordion type="multiple" :items="page.faq.items" class="max-w-4xl mx-auto" />
    </UPageSection>
  </div>
</template>

<style module scoped></style>

<i18n lang="json">
{
  "en": {
    "faq": {
      "title": "Frequently Asked Questions",
      "description": "Learn more about how Feedr works, including how our AI processes recipes and generates nutritional information.",
      "items": [
        {
          "label": "How does Feedr work?",
          "content": "Feedr uses advanced AI to extract and generate a clean, structured recipe from any URL, image, or file upload. We provide consistent formatting and detailed nutritional information in an easy-to-read format."
        },
        {
          "label": "Is Feedr free to use?",
          "content": "Yes, Feedr is completely free. You don't need to create an account to use any of our features. Creating an account is optional and only helps retain your data across sessions."
        },
        {
          "label": "How accurate is the nutritional information?",
          "content": "Feedr's AI analyzes the ingredients to calculate calories, protein, fat, and carbs, giving you a comprehensive nutritional breakdown for every recipe."
        },
        {
          "label": "Can I upload images of handwritten recipes?",
          "content": "Absolutely! Feedr accepts photos—including handwritten or scanned recipes—and converts them into a clear, consistent format."
        },
        {
          "label": "How is my data used?",
          "content": "Your recipe data is processed solely to generate a readable version and nutritional insights. We prioritize your privacy."
        },
        {
          "label": "Do I need to create an account?",
          "content": "No, you can use all Feedr features without an account. Creating an account is optional and only helps retain your data across sessions."
        },
        {
          "label": "How does the Instacart integration work?",
          "content": "With a single click, you can add all the ingredients from a recipe to your Instacart basket for easy grocery shopping."
        },
        {
          "label": "What if the AI makes a mistake?",
          "content": "Our AI is continuously learning and improving. If you notice any errors, please let us know so we can refine it further."
        },
        {
          "label": "Can I adjust the recipe servings?",
          "content": "Yes, Feedr offers scaling options that allow you to customize the recipe servings to your needs, automatically adjusting all ingredient quantities."
        },
        {
          "label": "How is AI used in Feedr?",
          "content": "Feedr leverages AI to parse recipes from various sources, provide consistent formatting, and generate accurate nutritional information for every recipe."
        },
        {
          "label": "What is Cooking Mode?",
          "content": "Cooking Mode is a step-by-step guided cooking experience that displays one instruction at a time, along with just the ingredients needed for that step. You can navigate through steps using the arrow keys, making cooking more organized and stress-free."
        }
      ]
    },
    "landing": {
      "title": "Your Recipes, Simplified",
      "subtitle": "Convert any recipe into a clean, consistent format with nutritional information and easy scaling - from any URL, image, or file.",
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
      "freeInfo": "All features are completely free—no signup required! Create an account only if you want to save your data across sessions.",
      "features": {
        "title": "Why Feedr?",
        "headline": "From Any Source to Perfect Format",
        "description": "Feedr transforms recipes from any source into clear, structured guides with detailed nutritional information and flexible scaling options.",
        "items": [
          {
            "title": "Universal Recipe Parser",
            "description": "Submit recipes via URL, image, or file upload - we'll convert them all to a consistent, usable format."
          },
          {
            "title": "Enhanced Readability",
            "description": "Enjoy beautifully formatted recipes that are easy to follow, with clear ingredients and step-by-step instructions."
          },
          {
            "title": "Complete Nutritional Analysis",
            "description": "Get detailed nutritional information (calories, protein, fat, carbs) with every recipe at a glance."
          },
          {
            "title": "Grocery Planning",
            "description": "Organize ingredients for easy grocery shopping with optional Instacart integration for one-click shopping lists."
          },
          {
            "title": "Recipe Saving",
            "description": "Save your processed recipes and access them anytime, from any device, with simple organization features."
          },
          {
            "title": "Flexible Scaling",
            "description": "Easily adjust serving sizes and watch as all ingredients automatically scale to match your specific needs."
          },
          {
            "title": "Cooking Mode",
            "description": "Step-by-step guided cooking experience showing only relevant ingredients for each step as you navigate the recipe."
          },
          {
            "title": "Cross-Device Access",
            "description": "Access your recipes on any device with a responsive interface that adapts perfectly to your screen size."
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
          "label": "Comment fonctionne Feedr ?",
          "content": "Feedr utilise une intelligence artificielle avancée pour extraire et générer une recette claire et structurée ainsi que des informations nutritionnelles détaillées à partir de n'importe quelle URL ou image."
        },
        {
          "label": "Feedr est-il gratuit ?",
          "content": "Oui, Feedr est entièrement gratuit. L'inscription n'est requise que si vous souhaitez enregistrer vos recettes pour une consultation ultérieure."
        },
        {
          "label": "Quelle est la précision des informations nutritionnelles ?",
          "content": "L'IA de Feedr analyse les ingrédients pour estimer les détails nutritionnels, vous fournissant ainsi une répartition complète."
        },
        {
          "label": "Puis-je télécharger des images de recettes manuscrites ?",
          "content": "Absolument. Feedr accepte les photos — y compris les recettes manuscrites ou scannées — et les convertit en un format clair."
        },
        {
          "label": "Comment mes données sont-elles utilisées ?",
          "content": "Vos données de recette sont traitées uniquement pour générer une version lisible et des informations nutritionnelles. Nous accordons la priorité à votre vie privée."
        },
        {
          "label": "Dois-je créer un compte ?",
          "content": "Non, vous pouvez utiliser toutes les fonctionnalités de Feedr sans compte. La création d'un compte est facultative et permet uniquement de conserver vos données entre les sessions."
        },
        {
          "label": "Comment fonctionne l'intégration avec Instacart ?",
          "content": "D'un simple clic, vous pouvez ajouter tous les ingrédients d'une recette à votre panier Instacart pour faciliter vos courses."
        },
        {
          "label": "Que faire si l'IA se trompe ?",
          "content": "Notre IA apprend et s'améliore continuellement. Si vous remarquez des erreurs, veuillez nous le signaler afin que nous puissions l'affiner davantage."
        },
        {
          "label": "Puis-je ajuster les portions de la recette ?",
          "content": "Oui, Feedr offre des options de mise à l'échelle qui vous permettent d'adapter les portions de la recette selon vos besoins."
        },
        {
          "label": "Comment l'IA est-elle utilisée dans Feedr ?",
          "content": "Feedr exploite l'IA pour générer à la fois la recette et les informations nutritionnelles, vous assurant ainsi des données précises et utiles à chaque fois."
        },
        {
          "label": "Qu'est-ce que le Mode Cuisine ?",
          "content": "Le Mode Cuisine est une expérience de cuisine guidée étape par étape qui affiche une instruction à la fois, ainsi que les ingrédients nécessaires pour cette étape. Vous pouvez naviguer entre les étapes à l'aide des touches fléchées, rendant la cuisine plus organisée et sans stress."
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
      "freeInfo": "Toutes les fonctionnalités sont complètement gratuites – aucune inscription n'est requise ! Créez un compte uniquement si vous souhaitez conserver vos données entre les sessions.",
      "features": {
        "title": "Pourquoi Feedr ?",
        "headline": "Libérez tout le potentiel de vos recettes",
        "description": "Feedr transforme des recettes désordonnées en guides clairs et structurés. Profitez d'une extraction intelligente, d'informations nutritionnelles détaillées et d'une intégration aisée pour vos courses.",
        "items": [
          {
            "title": "Extraction sans effort",
            "description": "Soumettez une recette via une URL, une image ou un fichier - nous les convertirons tous dans un format cohérent et utilisable."
          },
          {
            "title": "Lisibilité améliorée",
            "description": "Profitez de recettes magnifiquement formatées avec des instructions claires, des ingrédients bien organisés et des étapes faciles à suivre."
          },
          {
            "title": "Nutrition complète",
            "description": "Obtenez des informations nutritionnelles détaillées (calories, protéines, lipides, glucides) avec chaque recette en un coup d'œil."
          },
          {
            "title": "Planification courses",
            "description": "Organisez vos ingrédients pour faciliter vos courses avec une intégration optionnelle d'Instacart pour des listes d'achats en un clic."
          },
          {
            "title": "Sauvegarde de recettes",
            "description": "Sauvegardez vos recettes transformées et accédez-y à tout moment, avec des fonctionnalités d'organisation simples et efficaces."
          },
          {
            "title": "Expérience personnalisée",
            "description": "Ajustez facilement les portions et regardez tous les ingrédients se mettre automatiquement à l'échelle selon vos besoins spécifiques."
          },
          {
            "title": "Mode Cuisine",
            "description": "Expérience de cuisine guidée étape par étape montrant uniquement les ingrédients pertinents pour chaque étape pendant la préparation."
          },
          {
            "title": "Accès Multi-Appareils",
            "description": "Accédez à vos recettes sur n'importe quel appareil avec une interface réactive qui s'adapte parfaitement à votre écran."
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
          "content": "No, puedes usar todas las funciones de Feedr sin una cuenta. Crear una cuenta es opcional y solo ayuda a conservar tus datos entre sesiones."
        },
        {
          "label": "¿Cómo funciona la integración con Instacart?",
          "content": "Con un solo clic, puedes añadir todos los ingredientes de una receta a tu cesta de Instacart para facilitar la compra de comestibles."
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
        },
        {
          "label": "¿Qué es el Modo Cocina?",
          "content": "El Modo Cocina es una experiencia de cocina guiada paso a paso que muestra una instrucción a la vez, junto con los ingredientes necesarios para ese paso. Puedes navegar por los pasos usando las teclas de flecha, haciendo que cocinar sea más organizado y sin estrés."
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
      "freeInfo": "¡Todas las funciones son completamente gratuitas, sin necesidad de registrarte! Crea una cuenta solo si deseas guardar tus datos entre sesiones.",
      "features": {
        "title": "¿Por qué Feedr?",
        "headline": "Desbloquea el máximo potencial de tus recetas",
        "description": "Feedr convierte recetas desordenadas en guías claras y estructuradas. Disfruta de una extracción inteligente, información nutricional detallada e integración sencilla con Instacart.",
        "items": [
          {
            "title": "Extracción sin esfuerzo",
            "description": "Envía recetas mediante URL, imagen o archivo - convertiremos todos ellos a un formato consistente y utilizable."
          },
          {
            "title": "Mayor legibilidad",
            "description": "Disfruta de recetas bellamente formateadas con instrucciones claras, ingredientes bien organizados y pasos fáciles de seguir."
          },
          {
            "title": "Nutrición completa",
            "description": "Obtén información nutricional detallada (calorías, proteínas, grasas, carbohidratos) con cada receta de un vistazo."
          },
          {
            "title": "Planificación de compras",
            "description": "Organiza ingredientes para facilitar tus compras con integración opcional de Instacart para listas de compras con un solo clic."
          },
          {
            "title": "Guardado de recetas",
            "description": "Guarda tus recetas procesadas y accede a ellas en cualquier momento, con funciones de organización simples y eficientes."
          },
          {
            "title": "Experiencia personalizada",
            "description": "Ajusta fácilmente las porciones y observa cómo todos los ingredientes se escalan automáticamente según tus necesidades específicas."
          },
          {
            "title": "Modo Cocina",
            "description": "Experiencia de cocina guiada paso a paso que muestra solo los ingredientes relevantes para cada paso mientras preparas la receta."
          },
          {
            "title": "Acceso Multi-Dispositivo",
            "description": "Accede a tus recetas en cualquier dispositivo con una interfaz receptiva que se adapta perfectamente al tamaño de tu pantalla."
          }
        ]
      }
    }
  }
}
</i18n>
