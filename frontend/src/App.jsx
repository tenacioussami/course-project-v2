import { Suspense, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import { PageSkeleton } from './components/Loading';
import { Pages, preloadAllChunks } from './lib/routes';
import { warmUp } from './services/api';
import { prefetch } from './lib/query';

const {
  home: Home, login: Login, register: Register, dashboard: Dashboard, tasks: Tasks,
  members: Members, messages: Messages, surveys: Surveys, overview: ProjectOverview,
  literature: LiteratureReview, equipments: Equipments, paperWork: PaperWork,
  elements: Elements, about: About,
} = Pages;

function App() {
  useEffect(() => {
    warmUp(); // wake the Render backend immediately
    prefetch('/project'); // used by Home, Overview and About
    preloadAllChunks(); // every other page's code, in the background
  }, []);

  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        {/* All sections are publicly viewable. Write actions inside each page
            are still gated by checking `user` / `isAdmin` from AuthContext. */}
        <Route path="/" element={<S><Home /></S>} />
        <Route path="/login" element={<S><Login /></S>} />
        <Route path="/register" element={<S><Register /></S>} />
        <Route path="/about" element={<S><About /></S>} />
        <Route path="/project/overview" element={<S><ProjectOverview /></S>} />
        <Route path="/dashboard" element={<S><Dashboard /></S>} />
        <Route path="/tasks" element={<S><Tasks /></S>} />
        <Route path="/members" element={<S><Members /></S>} />
        <Route path="/messages" element={<S><Messages /></S>} />
        <Route path="/surveys" element={<S><Surveys /></S>} />
        <Route path="/project/literature" element={<S><LiteratureReview /></S>} />
        <Route path="/project/equipments" element={<S><Equipments /></S>} />
        <Route path="/project/paper-work" element={<S><PaperWork /></S>} />
        <Route path="/elements" element={<S><Elements /></S>} />
        <Route path="*" element={<S><Home /></S>} />
      </Route>
    </Routes>
  );
}

const S = ({ children }) => <Suspense fallback={<PageSkeleton />}>{children}</Suspense>;

export default App;
