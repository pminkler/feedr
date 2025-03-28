<template>
  <Header />

  <UMain class="relative">
    <!-- Stripe-inspired background - only covers top portion -->
    <div class="hero-gradient-bg absolute top-0 left-0 w-full">
      <!-- Floating elements with faster, more dynamic movement -->
      <div class="shape absolute w-[450px] h-[450px] top-[-80px] left-[5%]" style="animation: flow 18s ease-in-out infinite"></div>
      <div class="shape absolute w-[350px] h-[350px] top-[100px] left-[60%]" style="animation: flow-alt 15s ease-in-out infinite"></div>
      <div class="shape absolute w-[400px] h-[400px] top-[30px] left-[25%]" style="animation: flow 20s ease-in-out infinite 2s"></div>
      <div class="shape absolute w-[300px] h-[300px] top-[150px] left-[75%]" style="animation: flow-alt 17s ease-in-out infinite 3s"></div>
      <div class="shape absolute w-[320px] h-[320px] top-[90px] left-[10%]" style="animation: flow 22s ease-in-out infinite 5s"></div>
      <div class="shape absolute w-[380px] h-[380px] top-[-50px] left-[45%]" style="animation: flow-diag 19s ease-in-out infinite 1s"></div>
      <div class="shape absolute w-[280px] h-[280px] top-[180px] left-[35%]" style="animation: flow-diag 14s ease-in-out infinite 4s"></div>
    </div>
    <div class="hero-gradient-mesh absolute top-0 left-0 w-full"></div>
    
    <UContainer class="relative z-10">
      <UPage>
        <UPageBody>
          <slot />
        </UPageBody>
      </UPage>
    </UContainer>
  </UMain>
  <AppFooter />
</template>

<script lang="ts" setup></script>
