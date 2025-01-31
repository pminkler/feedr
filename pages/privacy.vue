<script setup lang="ts">
definePageMeta({
  layout: "single-page",
});

const updatedDateInLocalTime = new Date(
  "2025-01-30T00:00:00Z",
).toLocaleDateString();
</script>

<template>
  <div class="max-w-3xl mx-auto p-6">
    <h1 class="text-3xl font-bold mb-4">Privacy Policy</h1>
    <p class="mb-4">
      Last updated:
      <span class="font-semibold">{{ updatedDateInLocalTime }}</span>
    </p>

    <p class="mb-4">
      Welcome to <span class="font-semibold">Feedr</span>. Your privacy is
      important to us. This Privacy Policy explains how we handle and process
      information when you use our service.
    </p>

    <h2 class="text-2xl font-semibold mt-6 mb-2">1. Information We Process</h2>
    <p class="mb-4">
      <span class="font-semibold"
        >Feedr does not collect, store, or share personal data.</span
      >
      However, when you submit a URL, we process the page contents in real-time
      and return the extracted information to you.
    </p>
    <p class="mb-4">
      <span class="font-semibold">We store the extracted recipe data</span>
      to allow you to access it later. However, we do not retain other page
      content or metadata beyond the scope of processing recipes.
    </p>

    <h2 class="text-2xl font-semibold mt-6 mb-2">2. No User Accounts</h2>
    <p class="mb-4">
      Feedr does not require user accounts, logins, or personal information to
      function.
    </p>

    <h2 class="text-2xl font-semibold mt-6 mb-2">3. Stored Data</h2>
    <p class="mb-4">
      While we do not log submitted URLs, we store extracted recipe data for
      future retrieval. Recipes may be available for a limited time before
      automatic deletion.
    </p>

    <h2 class="text-2xl font-semibold mt-6 mb-2">
      4. Third-Party Websites & Content
    </h2>
    <p class="mb-4">
      When submitting a URL, you acknowledge that the content belongs to a
      third-party website. Feedr does not claim ownership of any extracted
      content, nor do we modify, store, or republish it beyond the scope of
      user-requested processing. We encourage users to review the privacy
      policies of third-party sites before submitting URLs.
    </p>

    <h2 class="text-2xl font-semibold mt-6 mb-2">
      5. Legal Compliance & Fair Use
    </h2>
    <p class="mb-4">
      Feedr does not intentionally violate copyright laws. However, it is the
      user’s responsibility to ensure that they have the legal right to process
      the content they submit. If a content owner believes their material is
      being improperly processed, they may contact us for resolution.
    </p>

    <h2 class="text-2xl font-semibold mt-6 mb-2">6. No Cookies or Tracking</h2>
    <p class="mb-4">
      Feedr does not use cookies, tracking scripts, analytics, or any other form
      of persistent data collection.
    </p>

    <h2 class="text-2xl font-semibold mt-6 mb-2">7. Changes to This Policy</h2>
    <p class="mb-4">
      We may update this Privacy Policy from time to time. Any changes will be
      posted on this page.
    </p>

    <p class="text-sm mt-6">
      © {{ new Date().getFullYear() }} Feedr. All rights reserved.
    </p>
  </div>
</template>

<style module scoped></style>
