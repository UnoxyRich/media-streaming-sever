<template>
  <div class="card" style="max-width: 360px; margin: 80px auto;">
    <h1 class="section-title">Sign in</h1>
    <form class="form" @submit.prevent="handleLogin">
      <label>
        Username
        <input v-model="form.username" autocomplete="username" required />
      </label>
      <label>
        Password
        <input v-model="form.password" type="password" autocomplete="current-password" required />
      </label>
      <button class="primary" type="submit" :disabled="loading">Sign in</button>
      <div v-if="error" class="notice">{{ error }}</div>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import authStore from '../store/auth';
import { apiPost } from '../utils/api';

const router = useRouter();
const form = reactive({ username: '', password: '' });
const loading = ref(false);
const error = ref('');

async function handleLogin() {
  error.value = '';
  loading.value = true;
  try {
    const user = await apiPost('/api/auth/login', form);
    authStore.state.user = user;
    router.push('/');
  } catch (err) {
    error.value = err.message || 'Login failed';
  } finally {
    loading.value = false;
  }
}
</script>
