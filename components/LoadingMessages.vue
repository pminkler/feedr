<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n({ useScope: 'local' });

// Loading messages array
const loadingMessages = {
  en: [
    'Cooking up some recipes...',
    'Stirring the digital pot...',
    'Preheating the AI oven...',
    'Chopping digital ingredients...',
    'Simmering your request...',
    'Whipping up something tasty...',
    'Adding a pinch of magic...',
    'Gathering the freshest data...',
  ],
  fr: [
    'Préparation des recettes...',
    'Remuage du pot numérique...',
    'Préchauffage du four IA...',
    'Découpage des ingrédients numériques...',
    'Mijotage de votre demande...',
    'Préparation de quelque chose de savoureux...',
    "Ajout d'une pincée de magie...",
    'Collecte des données les plus fraîches...',
  ],
  es: [
    'Cocinando algunas recetas...',
    'Revolviendo la olla digital...',
    'Precalentando el horno de IA...',
    'Picando ingredientes digitales...',
    'Cocinando a fuego lento su solicitud...',
    'Preparando algo sabroso...',
    'Añadiendo una pizca de magia...',
    'Recopilando los datos más frescos...',
  ],
};

// Get a random loading message
const getRandomMessage = () => {
  const locale = t('$locale') || 'en';
  const messages = loadingMessages[locale] || loadingMessages.en;
  const randomIndex = Math.floor(Math.random() * messages.length);
  return messages[randomIndex];
};

// Initialize with a random loading message
const message = ref(getRandomMessage());

let messageInterval: ReturnType<typeof setInterval>;

// Updates the message every 5 seconds, ensuring a new one is chosen
const updateMessage = () => {
  let newMessage;
  do {
    newMessage = getRandomMessage();
  } while (newMessage === message.value); // Ensure uniqueness

  message.value = newMessage;
};

onMounted(() => {
  messageInterval = setInterval(updateMessage, 5000);
});

onUnmounted(() => {
  clearInterval(messageInterval);
});
</script>

<template>
  <div class="flex justify-center items-center">
    <p class="text-lg font-semibold text-(--ui-text-muted) animate-pulse">
      {{ message }}
    </p>
  </div>
</template>

<i18n lang="json">
{
  "en": {
    "loading": "Loading..."
  },
  "fr": {
    "loading": "Chargement..."
  },
  "es": {
    "loading": "Cargando..."
  }
}
</i18n>
