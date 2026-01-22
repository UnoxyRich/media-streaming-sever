<template>
  <div>
    <div class="card" style="margin-bottom: 16px;">
      <h1 class="section-title">Library</h1>
      <div class="form" style="grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));">
        <label>
          Category
          <select v-model="filters.category" @change="fetchMedia">
            <option value="movie">Movies</option>
            <option value="anime">Anime</option>
            <option value="tv">TV</option>
          </select>
        </label>
        <label>
          Type
          <select v-model="filters.type" @change="fetchMedia">
            <option value="movie">Movie</option>
            <option value="show">Show</option>
          </select>
        </label>
      </div>
    </div>

    <div class="grid">
      <div v-for="item in media" :key="item.id" class="card">
        <h2 class="section-title" style="font-size: 16px;">{{ item.title }}</h2>
        <div class="notice" v-if="item.description">{{ item.description }}</div>
        <div style="display: flex; justify-content: space-between; margin-top: 12px;">
          <span class="badge">{{ item.type }}</span>
          <RouterLink :to="`/media/${item.id}`">Details</RouterLink>
        </div>
      </div>
    </div>

    <div v-if="!media.length" class="notice" style="margin-top: 16px;">No media found.</div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { apiGet } from '../utils/api';

const media = ref([]);
const filters = reactive({ category: 'movie', type: 'movie' });

async function fetchMedia() {
  media.value = await apiGet(`/api/media?category=${filters.category}&type=${filters.type}`);
}

onMounted(fetchMedia);
</script>
