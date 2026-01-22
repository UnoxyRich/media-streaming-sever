<template>
  <div class="card">
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <h1 class="section-title">{{ media?.title || 'Media' }}</h1>
      <button type="button" @click="toggleWatchLater" v-if="media">
        {{ watchLater ? 'Remove Watch Later' : 'Add Watch Later' }}
      </button>
    </div>
    <p v-if="media?.description">{{ media.description }}</p>
    <div style="display: flex; gap: 12px; flex-wrap: wrap;">
      <span class="badge">{{ media?.category }}</span>
      <span class="badge">{{ media?.type }}</span>
      <span v-if="media?.year" class="badge">{{ media.year }}</span>
    </div>

    <div style="margin-top: 16px;">
      <RouterLink v-if="canPlay" :to="`/player/${media.id}`">Open Player</RouterLink>
    </div>
  </div>

  <div v-if="children.length" class="card" style="margin-top: 16px;">
    <h2 class="section-title">Contents</h2>
    <ul>
      <li v-for="child in children" :key="child.id" style="margin-bottom: 8px;">
        <RouterLink :to="`/media/${child.id}`">{{ child.title }}</RouterLink>
        <span class="badge" style="margin-left: 8px;">{{ child.type }}</span>
      </li>
    </ul>
  </div>

  <div v-if="watchHistory" class="card" style="margin-top: 16px;">
    <h2 class="section-title">Resume</h2>
    <div>Last position: {{ formatTime(watchHistory.position_seconds) }}</div>
    <RouterLink :to="`/player/${media.id}`">Resume playback</RouterLink>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, RouterLink } from 'vue-router';
import { apiGet, apiPost, apiDelete } from '../utils/api';

const route = useRoute();
const media = ref(null);
const children = ref([]);
const watchLater = ref(false);
const watchHistory = ref(null);

const canPlay = computed(() => ['movie', 'episode'].includes(media.value?.type));

function formatTime(seconds) {
  const total = Number(seconds || 0);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = Math.floor(total % 60);
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

async function fetchMedia() {
  const id = route.params.id;
  media.value = await apiGet(`/api/media/${id}`);
  children.value = await apiGet(`/api/media?parent_id=${id}`);
  const watchLaterItems = await apiGet('/api/media/me/watch-later');
  watchLater.value = watchLaterItems.some((item) => String(item.media_id) === String(id));
  const historyItems = await apiGet('/api/media/me/watch-history');
  watchHistory.value = historyItems.find((item) => String(item.media_id) === String(id));
}

async function toggleWatchLater() {
  if (!media.value) return;
  if (watchLater.value) {
    await apiDelete(`/api/media/${media.value.id}/watch-later`);
    watchLater.value = false;
  } else {
    await apiPost(`/api/media/${media.value.id}/watch-later`);
    watchLater.value = true;
  }
}

onMounted(fetchMedia);
</script>
