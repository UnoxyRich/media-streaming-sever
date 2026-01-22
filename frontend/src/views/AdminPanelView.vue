<template>
  <div class="grid" style="align-items: start;">
    <div class="card">
      <h1 class="section-title">Admin Panel</h1>
      <div v-if="stats" class="notice">
        Users: {{ stats.users }} | Active: {{ stats.active_users }} | Media: {{ stats.media }} | Streams: {{ stats.streams }}
      </div>
    </div>

    <div class="card">
      <h2 class="section-title">Create User</h2>
      <form class="form" @submit.prevent="createUser">
        <label>Username<input v-model="newUser.username" required /></label>
        <label>Password<input v-model="newUser.password" type="password" required /></label>
        <label>Role
          <select v-model="newUser.role">
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
        </label>
        <button class="primary" type="submit">Create</button>
      </form>
    </div>

    <div class="card">
      <h2 class="section-title">User Management</h2>
      <table class="table">
        <thead>
          <tr>
            <th>Username</th>
            <th>Role</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="user in users" :key="user.id">
            <td>{{ user.username }}</td>
            <td>{{ user.role }}</td>
            <td>{{ user.is_active ? 'Active' : 'Disabled' }}</td>
            <td>
              <button type="button" @click="toggleUser(user)">
                {{ user.is_active ? 'Disable' : 'Enable' }}
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <div class="card">
      <h2 class="section-title">Add Media</h2>
      <form class="form" @submit.prevent="createMedia">
        <label>Title<input v-model="newMedia.title" required /></label>
        <label>Description<textarea v-model="newMedia.description"></textarea></label>
        <label>Category
          <select v-model="newMedia.category">
            <option value="movie">Movie</option>
            <option value="anime">Anime</option>
            <option value="tv">TV</option>
          </select>
        </label>
        <label>Type
          <select v-model="newMedia.type">
            <option value="movie">Movie</option>
            <option value="show">Show</option>
            <option value="season">Season</option>
            <option value="episode">Episode</option>
          </select>
        </label>
        <label>Parent ID<input v-model.number="newMedia.parent_id" type="number" /></label>
        <label>Year<input v-model.number="newMedia.year" type="number" /></label>
        <label>Sort Index<input v-model.number="newMedia.sort_index" type="number" /></label>
        <button class="primary" type="submit">Add Media</button>
      </form>
    </div>

    <div class="card">
      <h2 class="section-title">Attach Stream</h2>
      <form class="form" @submit.prevent="createStream">
        <label>Media ID<input v-model.number="newStream.media_id" type="number" required /></label>
        <label>Source URL<input v-model="newStream.source_url" required /></label>
        <label>Format
          <select v-model="newStream.format">
            <option value="hls">HLS</option>
            <option value="dash">DASH</option>
            <option value="mp4">MP4</option>
          </select>
        </label>
        <label>Quality Label<input v-model="newStream.quality_label" /></label>
        <label>Resolution<input v-model="newStream.resolution" /></label>
        <label>Language<input v-model="newStream.language" /></label>
        <button class="primary" type="submit">Attach Stream</button>
      </form>
    </div>

    <div class="card">
      <h2 class="section-title">Attach Subtitle</h2>
      <form class="form" @submit.prevent="createSubtitle">
        <label>Media ID<input v-model.number="newSubtitle.media_id" type="number" required /></label>
        <label>Source URL<input v-model="newSubtitle.source_url" required /></label>
        <label>Format
          <select v-model="newSubtitle.format">
            <option value="vtt">WebVTT</option>
            <option value="srt">SRT</option>
            <option value="ass">ASS</option>
          </select>
        </label>
        <label>Label<input v-model="newSubtitle.label" required /></label>
        <label>Language<input v-model="newSubtitle.language" /></label>
        <label>
          Default
          <select v-model="newSubtitle.is_default">
            <option :value="false">No</option>
            <option :value="true">Yes</option>
          </select>
        </label>
        <button class="primary" type="submit">Attach Subtitle</button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import { apiGet, apiPost, apiPatch } from '../utils/api';

const stats = ref(null);
const users = ref([]);

const newUser = reactive({ username: '', password: '', role: 'user' });
const newMedia = reactive({
  title: '',
  description: '',
  category: 'movie',
  type: 'movie',
  parent_id: null,
  year: null,
  sort_index: null
});
const newStream = reactive({
  media_id: null,
  source_url: '',
  format: 'hls',
  quality_label: '',
  resolution: '',
  language: ''
});
const newSubtitle = reactive({
  media_id: null,
  source_url: '',
  format: 'vtt',
  label: '',
  language: '',
  is_default: false
});

async function load() {
  stats.value = await apiGet('/api/stats');
  users.value = await apiGet('/api/users');
}

async function createUser() {
  await apiPost('/api/users', newUser);
  newUser.username = '';
  newUser.password = '';
  newUser.role = 'user';
  await load();
}

async function toggleUser(user) {
  await apiPatch(`/api/users/${user.id}`, { is_active: !user.is_active });
  await load();
}

async function createMedia() {
  await apiPost('/api/media', newMedia);
  newMedia.title = '';
  newMedia.description = '';
  newMedia.category = 'movie';
  newMedia.type = 'movie';
  newMedia.parent_id = null;
  newMedia.year = null;
  newMedia.sort_index = null;
  await load();
}

async function createStream() {
  const payload = { ...newStream };
  await apiPost(`/api/media/${payload.media_id}/streams`, payload);
  newStream.media_id = null;
  newStream.source_url = '';
  newStream.format = 'hls';
  newStream.quality_label = '';
  newStream.resolution = '';
  newStream.language = '';
  await load();
}

async function createSubtitle() {
  const payload = { ...newSubtitle };
  await apiPost(`/api/media/${payload.media_id}/subtitles`, payload);
  newSubtitle.media_id = null;
  newSubtitle.source_url = '';
  newSubtitle.format = 'vtt';
  newSubtitle.label = '';
  newSubtitle.language = '';
  newSubtitle.is_default = false;
  await load();
}

onMounted(load);
</script>
