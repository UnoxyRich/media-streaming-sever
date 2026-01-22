<template>
  <div class="card">
    <h1 class="section-title">Watch Later</h1>
    <table class="table">
      <thead>
        <tr>
          <th>Title</th>
          <th>Type</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.media_id">
          <td>{{ item.title }}</td>
          <td>{{ item.type }}</td>
          <td>
            <RouterLink :to="`/media/${item.media_id}`">View</RouterLink>
          </td>
        </tr>
      </tbody>
    </table>
    <div v-if="!items.length" class="notice">No watch later items.</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { RouterLink } from 'vue-router';
import { apiGet } from '../utils/api';

const items = ref([]);

async function load() {
  items.value = await apiGet('/api/media/me/watch-later');
}

onMounted(load);
</script>
