<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { DropdownMenuItem } from '@nuxt/ui';
import { useI18n } from 'vue-i18n';
import { useAuth } from '~/composables/useAuth';
import { fetchUserAttributes } from 'aws-amplify/auth';

const { t } = useI18n();
const localePath = useLocalePath();
const { currentUser } = useAuth();
const colorMode = useColorMode();
const userEmailData = ref('');

const props = defineProps<{
  collapsed?: boolean;
}>();

// Fetch user email on mount
onMounted(async () => {
  try {
    const attributes = await fetchUserAttributes();
    userEmailData.value = attributes.email || '';
  } catch (error) {
    console.error('Error fetching user attributes:', error);
  }
});

// User info
const userEmail = computed(() => {
  return userEmailData.value || currentUser.value?.username || t('userMenu.guest');
});

// Items for the dropdown menu
const items = computed<DropdownMenuItem[][]>(() => [
  [
    {
      type: 'label',
      label: userEmail.value,
      avatar: {
        icon: 'i-heroicons-user-circle',
      },
    },
  ],
  [
    {
      label: t('userMenu.profile'),
      icon: 'i-heroicons-user',
      to: localePath('/profile'),
    },
  ],
  [
    {
      label: t('userMenu.theme'),
      icon: 'i-heroicons-swatch',
      children: [
        {
          label: t('userMenu.light'),
          icon: 'i-heroicons-sun',
          type: 'checkbox',
          checked: colorMode.value === 'light',
          onSelect(e: Event) {
            e.preventDefault();
            colorMode.value = 'light';
          },
        },
        {
          label: t('userMenu.dark'),
          icon: 'i-heroicons-moon',
          type: 'checkbox',
          checked: colorMode.value === 'dark',
          onSelect(e: Event) {
            e.preventDefault();
            colorMode.value = 'dark';
          },
        },
      ],
    },
  ],
  [
    {
      label: t('userMenu.logout'),
      icon: 'i-heroicons-arrow-right-on-rectangle',
      to: localePath('/logout'),
    },
  ],
]);
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{
      content: props.collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)',
    }"
  >
    <UButton
      color="neutral"
      variant="ghost"
      block
      :square="props.collapsed"
      class="data-[state=open]:bg-(--ui-bg-elevated)"
      :label="props.collapsed ? undefined : userEmail"
      :trailing-icon="props.collapsed ? undefined : 'i-heroicons-chevron-down'"
      :ui="{
        trailingIcon: 'text-(--ui-text-dimmed)',
      }"
    >
      <template #leading>
        <UIcon name="i-heroicons-user-circle" class="size-8" />
      </template>
    </UButton>
  </UDropdownMenu>
</template>

<i18n lang="json">
{
  "en": {
    "userMenu": {
      "guest": "Guest",
      "profile": "Profile",
      "theme": "Theme",
      "light": "Light",
      "dark": "Dark",
      "logout": "Log out"
    }
  },
  "fr": {
    "userMenu": {
      "guest": "Invité",
      "profile": "Profil",
      "theme": "Thème",
      "light": "Clair",
      "dark": "Sombre",
      "logout": "Se déconnecter"
    }
  },
  "es": {
    "userMenu": {
      "guest": "Invitado",
      "profile": "Perfil",
      "theme": "Tema",
      "light": "Claro",
      "dark": "Oscuro",
      "logout": "Cerrar sesión"
    }
  }
}
</i18n>
