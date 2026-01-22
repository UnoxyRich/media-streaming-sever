import { createRouter, createWebHistory } from 'vue-router';
import LoginView from './views/LoginView.vue';
import LibraryView from './views/LibraryView.vue';
import MediaDetailView from './views/MediaDetailView.vue';
import PlayerView from './views/PlayerView.vue';
import WatchHistoryView from './views/WatchHistoryView.vue';
import WatchLaterView from './views/WatchLaterView.vue';
import AdminPanelView from './views/AdminPanelView.vue';
import authStore from './store/auth';

const routes = [
  { path: '/login', component: LoginView },
  { path: '/', component: LibraryView, meta: { requiresAuth: true } },
  { path: '/media/:id', component: MediaDetailView, meta: { requiresAuth: true } },
  { path: '/player/:id', component: PlayerView, meta: { requiresAuth: true } },
  { path: '/history', component: WatchHistoryView, meta: { requiresAuth: true } },
  { path: '/watch-later', component: WatchLaterView, meta: { requiresAuth: true } },
  { path: '/admin', component: AdminPanelView, meta: { requiresAuth: true, requiresRole: 'admin' } }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach(async (to, from, next) => {
  if (authStore.state.loading) {
    await authStore.fetchSession();
  }

  if (to.meta.requiresAuth && !authStore.state.user) {
    return next('/login');
  }

  if (to.meta.requiresRole && authStore.state.user?.role !== to.meta.requiresRole) {
    return next('/');
  }

  if (to.path === '/login' && authStore.state.user) {
    return next('/');
  }

  return next();
});

export default router;
