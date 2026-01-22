<template>
  <div class="app">
    <header class="top-bar">
      <div class="brand">Private Streaming</div>
      <nav v-if="user" class="nav">
        <RouterLink to="/">Library</RouterLink>
        <RouterLink to="/history">Watch History</RouterLink>
        <RouterLink to="/watch-later">Watch Later</RouterLink>
        <RouterLink v-if="user.role === 'admin'" to="/admin">Admin</RouterLink>
        <button type="button" class="link-button" @click="logout">Sign out</button>
      </nav>
    </header>
    <main class="main">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRouter, RouterLink, RouterView } from 'vue-router';
import authStore from './store/auth';
import { apiPost } from './utils/api';

const router = useRouter();
const user = computed(() => authStore.state.user);

async function logout() {
  await apiPost('/api/auth/logout');
  authStore.clearSession();
  router.push('/login');
}
</script>
