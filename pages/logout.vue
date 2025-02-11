<script setup lang="ts">
import { signOut } from "aws-amplify/auth";

const router = useRouter();
const localePath = useLocalePath();

// Log out the user and redirect to /home
await signOut({ global: true });
await router.push(localePath("index"));
</script>

<template></template>
