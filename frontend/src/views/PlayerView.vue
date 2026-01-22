<template>
  <div class="player-wrapper">
    <div class="card">
      <h1 class="section-title">{{ media?.title || 'Player' }}</h1>
      <div class="player-container">
        <video ref="videoRef" class="player-video" controls></video>
        <canvas v-show="assEnabled" ref="assCanvas" class="subtitle-overlay"></canvas>
      </div>
      <div class="player-controls" style="margin-top: 12px; flex-wrap: wrap;">
        <label>
          Stream
          <select v-model.number="selectedStreamId" @change="switchStream">
            <option v-for="stream in streams" :key="stream.id" :value="stream.id">
              {{ streamLabel(stream) }}
            </option>
          </select>
        </label>
        <label>
          Quality
          <select v-model="selectedQuality" @change="applyQuality">
            <option value="auto">Auto</option>
            <option v-for="track in qualityTracks" :key="track.id" :value="track.id">
              {{ track.label }}
            </option>
          </select>
        </label>
        <label>
          Subtitles
          <select v-model="selectedSubtitle" @change="applySubtitle">
            <option value="off">Off</option>
            <option v-for="subtitle in subtitles" :key="subtitle.id" :value="String(subtitle.id)">
              {{ subtitle.label }}
            </option>
          </select>
        </label>
      </div>
      <div v-if="notice" class="notice" style="margin-top: 12px;">{{ notice }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRoute } from 'vue-router';
import shaka from 'shaka-player/dist/shaka-player.compiled';
import { apiGet, apiPut } from '../utils/api';

const route = useRoute();
const videoRef = ref(null);
const assCanvas = ref(null);
const media = ref(null);
const streams = ref([]);
const subtitles = ref([]);
const selectedStreamId = ref(null);
const selectedQuality = ref('auto');
const qualityTracks = ref([]);
const selectedSubtitle = ref('off');
const notice = ref('');
const assEnabled = ref(false);

let player;
let saveInterval;
let assRenderer;

function streamLabel(stream) {
  const quality = stream.quality_label || stream.resolution || 'source';
  return `${stream.format.toUpperCase()} - ${quality}`;
}

function resetAssRenderer() {
  if (assRenderer?.dispose) {
    assRenderer.dispose();
  }
  assRenderer = null;
  assEnabled.value = false;
}

async function initPlayer() {
  shaka.polyfill.installAll();
  player = new shaka.Player(videoRef.value);

  player.addEventListener('error', (event) => {
    notice.value = event.detail?.message || 'Playback error';
  });

  await loadMedia();
  setupSaveHistory();
}

async function loadMedia() {
  const id = route.params.id;
  media.value = await apiGet(`/api/media/${id}`);
  streams.value = await apiGet(`/api/media/${id}/streams`);
  subtitles.value = await apiGet(`/api/media/${id}/subtitles`);

  if (!streams.value.length) {
    notice.value = 'No stream sources available.';
    return;
  }

  selectedStreamId.value = streams.value[0].id;
  const defaultSubtitle = subtitles.value.find((item) => item.is_default);
  selectedSubtitle.value = defaultSubtitle ? String(defaultSubtitle.id) : 'off';
  await switchStream();

  const history = await apiGet('/api/media/me/watch-history');
  const entry = history.find((item) => String(item.media_id) === String(id));
  if (entry) {
    videoRef.value.currentTime = entry.position_seconds;
  }
}

async function switchStream() {
  const stream = streams.value.find((item) => item.id === selectedStreamId.value);
  if (!stream) return;

  resetAssRenderer();
  selectedQuality.value = 'auto';
  notice.value = '';

  await player.load(stream.source_url);
  await refreshQualityTracks();
  await applySubtitle();
}

async function refreshQualityTracks() {
  const tracks = player.getVariantTracks().filter((track) => track.type === 'variant');
  qualityTracks.value = tracks.map((track) => ({
    id: track.id,
    label: `${track.height || 0}p ${track.bandwidth ? Math.round(track.bandwidth / 1000) + ' kbps' : ''}`.trim()
  }));
}

async function applyQuality() {
  if (selectedQuality.value === 'auto') {
    player.configure({ abr: { enabled: true } });
    return;
  }
  const track = player.getVariantTracks().find((item) => item.id === Number(selectedQuality.value));
  if (track) {
    player.configure({ abr: { enabled: false } });
    player.selectVariantTrack(track, true);
  }
}

async function applySubtitle() {
  player.setTextTrackVisibility(false);
  resetAssRenderer();

  if (selectedSubtitle.value === 'off') {
    return;
  }

  const subtitle = subtitles.value.find((item) => String(item.id) === selectedSubtitle.value);
  if (!subtitle) return;

  if (subtitle.format === 'ass') {
    await loadAssSubtitle(subtitle.source_url);
    return;
  }

  const mimeType = subtitle.format === 'vtt' ? 'text/vtt' : 'text/srt';
  const track = await player.addTextTrack(
    subtitle.source_url,
    subtitle.language || 'und',
    subtitle.label,
    'subtitle',
    mimeType
  );
  player.selectTextTrack(track);
  player.setTextTrackVisibility(true);
}

async function loadAssSubtitle(url) {
  try {
    const response = await fetch(url);
    const assText = await response.text();
    const { createLibass } = await import('libass-wasm');
    let libass;
    try {
      libass = await createLibass({
        wasmUrl: new URL('libass-wasm.wasm', import.meta.url),
        workerUrl: new URL('libass-wasm.worker.js', import.meta.url)
      });
    } catch (error) {
      libass = await createLibass();
    }

    assRenderer = await libass.create({
      video: videoRef.value,
      canvas: assCanvas.value,
      subtitles: assText
    });

    assEnabled.value = true;
  } catch (error) {
    notice.value = 'ASS subtitles failed to load.';
  }
}

function setupSaveHistory() {
  if (saveInterval) {
    clearInterval(saveInterval);
  }
  saveInterval = setInterval(async () => {
    if (!videoRef.value || videoRef.value.readyState < 2) return;
    const position = Math.floor(videoRef.value.currentTime || 0);
    if (position <= 0) return;
    await apiPut(`/api/media/${route.params.id}/watch-history`, {
      position_seconds: position
    });
  }, 10000);
}

onMounted(() => {
  initPlayer();
});

onBeforeUnmount(() => {
  if (saveInterval) {
    clearInterval(saveInterval);
  }
  resetAssRenderer();
  if (player) {
    player.destroy();
  }
});
</script>
