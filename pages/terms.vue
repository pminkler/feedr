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
    <h1 class="text-3xl font-bold mb-4">Terms of Service</h1>
    <p class="mb-4">
      Last updated:
      <span class="font-semibold">{{ updatedDateInLocalTime }}</span>
    </p>

    <p class="mb-4">
      Welcome to <span class="font-semibold">Feedr</span>. By using our service,
      you agree to the following terms. If you do not agree, please do not use
      Feedr.
    </p>

    <h2 class="text-2xl font-semibold mt-6 mb-2">1. Service Description</h2>
    <p class="mb-4">
      Feedr allows users to submit publicly accessible URLs containing recipes.
      We extract and process the page content using automated tools and AI, then
      display the reformatted recipe back to the user.
      <span class="font-semibold">We store extracted recipe data</span>
      for future retrieval but do not retain other page content beyond what is
      necessary to process recipes.
    </p>

    <h2 class="text-2xl font-semibold mt-6 mb-2">2. User Responsibilities</h2>
    <p class="mb-4">By using Feedr, you confirm that:</p>
    <ul class="list-disc list-inside mb-4">
      <li>
        You have the legal right to access and process the URLs you submit.
      </li>
      <li>You will not use Feedr for any unlawful or unauthorized purposes.</li>
      <li>You will not attempt to disrupt, exploit, or abuse our service.</li>
    </ul>

    <h2 class="text-2xl font-semibold mt-6 mb-2">3. Stored Data</h2>
    <p class="mb-4">
      While we do not log submitted URLs, we store extracted recipe data for
      future access. Recipes may be available for a limited time before
      automatic deletion.
    </p>

    <h2 class="text-2xl font-semibold mt-6 mb-2">4. Ownership & Copyright</h2>
    <p class="mb-4">
      Feedr does not claim ownership over any third-party content processed
      through the service. All rights to original recipes and website content
      remain with their respective owners.
    </p>

    <h2 class="text-2xl font-semibold mt-6 mb-2">5. Third-Party Content</h2>
    <p class="mb-4">
      Feedr processes content from third-party websites. We are not responsible
      for the accuracy, legality, or availability of this content. If you
      believe content has been improperly processed, please contact the original
      content provider.
    </p>

    <h2 class="text-2xl font-semibold mt-6 mb-2">6. No Warranties</h2>
    <p class="mb-4">
      Feedr is provided "as is" without any warranties, express or implied. We
      do not guarantee:
    </p>
    <ul class="list-disc list-inside mb-4">
      <li>The accuracy or reliability of extracted recipes.</li>
      <li>Continuous, uninterrupted service availability.</li>
      <li>That results will meet specific dietary or cooking needs.</li>
    </ul>

    <h2 class="text-2xl font-semibold mt-6 mb-2">7. Limitation of Liability</h2>
    <p class="mb-4">
      Feedr and its developers shall not be liable for any damages resulting
      from:
    </p>
    <ul class="list-disc list-inside mb-4">
      <li>Inaccurate or incorrect recipe instructions.</li>
      <li>Use of AI-generated content.</li>
      <li>Loss of data, service disruptions, or errors.</li>
    </ul>

    <h2 class="text-2xl font-semibold mt-6 mb-2">8. Service Modifications</h2>
    <p class="mb-4">
      We reserve the right to modify, suspend, or discontinue Feedr at any time
      without prior notice.
    </p>

    <h2 class="text-2xl font-semibold mt-6 mb-2">9. Changes to These Terms</h2>
    <p class="mb-4">
      We may update these Terms from time to time. Continued use of Feedr
      constitutes acceptance of any revised terms.
    </p>

    <p class="text-sm mt-6">
      © {{ new Date().getFullYear() }} Feedr. All rights reserved.
    </p>
  </div>
</template>

<style module scoped></style>
