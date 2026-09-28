import { lazy } from 'react';
import { prefetch } from './query';

/*
 * Every page is its own small JS chunk. After the first paint we quietly
 * download ALL of them during idle time, so every later click is instant
 * (no network wait for code). Hovering a nav link also prefetches that
 * page's data.
 */

const loaders = {
  home: () => import('../pages/Home'),
  login: () => import('../pages/Login'),
  register: () => import('../pages/Register'),
  dashboard: () => import('../pages/Dashboard'),
  tasks: () => import('../pages/Tasks'),
  members: () => import('../pages/Members'),
  messages: () => import('../pages/Messages'),
  surveys: () => import('../pages/Surveys'),
  overview: () => import('../pages/ProjectOverview'),
  literature: () => import('../pages/LiteratureReview'),
  equipments: () => import('../pages/Equipments'),
  paperWork: () => import('../pages/PaperWork'),
  elements: () => import('../pages/Elements'),
  about: () => import('../pages/About'),
};

export const Pages = Object.fromEntries(Object.entries(loaders).map(([k, fn]) => [k, lazy(fn)]));

// path → [chunk loader, data to prefetch]
const routeMap = {
  '/': [loaders.home, [['/project'], ['/dashboard']]],
  '/dashboard': [loaders.dashboard, [['/dashboard']]],
  '/tasks': [loaders.tasks, [['/tasks'], ['/members']]],
  '/members': [loaders.members, [['/members']]],
  '/messages': [loaders.messages, [['/messages']]],
  '/surveys': [loaders.surveys, [['/surveys']]],
  '/project/overview': [loaders.overview, [['/project']]],
  '/project/literature': [loaders.literature, [['/literature']]],
  '/project/equipments': [loaders.equipments, [['/equipment']]],
  '/project/paper-work': [loaders.paperWork, [['/papers']]],
  '/elements': [loaders.elements, [['/elements']]],
  '/about': [loaders.about, [['/project']]],
  '/login': [loaders.login, []],
  '/register': [loaders.register, []],
};

/** Call on hover / focus / touchstart of a link. */
export const preloadRoute = (path) => {
  const entry = routeMap[path];
  if (!entry) return;
  const [load, data] = entry;
  load().catch(() => {});
  data.forEach(([url, params]) => prefetch(url, params));
};

/** Download every page chunk in the background once the browser is idle. */
export const preloadAllChunks = () => {
  const run = () => Object.values(loaders).forEach((l) => l().catch(() => {}));
  if ('requestIdleCallback' in window) window.requestIdleCallback(run, { timeout: 2500 });
  else setTimeout(run, 1200);
};

/** Handy props to spread on any <Link>/<NavLink>. */
export const preloadProps = (path) => ({
  onMouseEnter: () => preloadRoute(path),
  onFocus: () => preloadRoute(path),
  onTouchStart: () => preloadRoute(path),
});
