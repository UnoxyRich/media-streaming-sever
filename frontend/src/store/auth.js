import { reactive } from 'vue';
import { apiGet } from '../utils/api';

const state = reactive({
  user: null,
  loading: true
});

async function fetchSession() {
  state.loading = true;
  try {
    const user = await apiGet('/api/auth/me');
    state.user = user;
  } catch (error) {
    state.user = null;
  } finally {
    state.loading = false;
  }
}

function clearSession() {
  state.user = null;
}

export default {
  state,
  fetchSession,
  clearSession
};
