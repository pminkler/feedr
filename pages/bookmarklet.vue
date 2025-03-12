<script setup lang="ts">
import { useI18n } from "vue-i18n";
import type { LayoutKey } from "#build/types/layouts";

definePageMeta({
  layout: "single-page" as LayoutKey,
});

const { t } = useI18n();

const currentHost = window.location.hostname;
const currentPort = window.location.port ? ":" + window.location.port : "";
const currentProtocol = window.location.protocol;
const myAppURL = `${currentProtocol}//${currentHost}${currentPort}/`;

const bookmarkletCode = `javascript:(function() {
  var currentURL = encodeURIComponent(window.location.href);
  window.location.href = '${myAppURL}?url=' + currentURL;
})();`;

const encodedBookmarklet = encodeURI(bookmarkletCode);

function selectText(event: Event) {
  (event.target as HTMLInputElement).select();
}
</script>

<template>
  <UCard class="mx-auto w-fit flex flex-col items-center">
    <h1 class="text-2xl font-bold text-center">{{ t("bookmarklet.title") }}</h1>
    <p class="mt-2 text-center">{{ t("bookmarklet.description") }}</p>
    <div class="bookmarklet-area mt-6 flex flex-col items-center">
      <a :href="encodedBookmarklet" draggable="true">
        <UButton color="primary" variant="solid">
          {{ t("bookmarklet.dragMe") }}
        </UButton>
      </a>

      <p class="instructions mt-1 text-sm text-(--ui-text-muted) text-center">
        {{ t("bookmarklet.instructions") }}
      </p>
    </div>

    <p class="mt-8 text-center">{{ t("bookmarklet.or") }}</p>
    <UTextarea
      readonly
      :rows="4"
      cols="60"
      @click="selectText"
      :model-value="bookmarkletCode"
      class="mt-4 text-center"
    />
    <p class="instructions mt-1 text-sm text-(--ui-text-muted) text-center">
      {{ t("bookmarklet.copyInstructions") }}
    </p>
  </UCard>
</template>

<style scoped></style>
