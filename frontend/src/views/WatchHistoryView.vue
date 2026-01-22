<template>
  <div class="card">
    <h1 class="section-title">Watch History</h1>
    <table class="table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Type</th>
          <th>Last Position</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in history" :key="item.media_id">
          <td>{{ item.title }}</td>
          <td>{{ item.type }}</td>
          <td>{{ formatTime(item.position_seconds) }}</td>
          <td><RouterLink :to="`/player/${item.media_id}`">Open</RouterLink></td>
        </tr>
      </tbody>
    </table>
    <div v-if="!history.length" class="notice">No watch history yet.</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { apiGet } from '../utils/api';

const history = ref([]);

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

async function loadHistory() {
  history.value = await apiGet('/api/media/me/watch-history');
}

onMounted(loadHistory);
</script>
