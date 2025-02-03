<script>
useHead({
  title: "Feedr",
});
</script>

<template>
  <div>
    <NuxtPwaManifest />
    <NuxtLoadingIndicator />

    <Header />

    <UMain>
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </UMain>

    <AppFooter />

    <UNotifications />
    <UModals />
  </div>
</template>
