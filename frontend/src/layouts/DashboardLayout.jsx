import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar, { Logo } from '../components/Navbar';
import { Toaster } from '../components/Toast';
import { onActivity } from '../services/api';

/** Thin gradient bar at the very top while any request is running. */
const TopProgress = () => {
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    let t;
    return onActivity((n) => {
      clearTimeout(t);
      // tiny delay so super-fast requests don't flicker
      if (n > 0) t = setTimeout(() => setBusy(true), 120);
      else setBusy(false);
    });
  }, []);
  return (
    <div className={`fixed inset-x-0 top-0 z-[70] h-0.5 overflow-hidden transition-opacity ${busy ? 'opacity-100' : 'opacity-0'}`}>
      <div className="h-full w-1/3 animate-bar-slide bg-gradient-to-r from-transparent via-cyan-300 to-violet-400" />
    </div>
  );
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
};

const DashboardLayout = () => (
  <div className="flex min-h-screen flex-col overflow-x-clip">
    <TopProgress />
    <ScrollToTop />
    <Navbar />
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
      <Outlet />
    </main>
    <footer className="border-t border-white/[0.06]">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-8 sm:flex-row sm:px-6">
        <Logo />
        <p className="font-mono text-xs text-slate-500">
          Vision-guided · human-following · luggage assistant — &copy; {new Date().getFullYear()}
        </p>
      </div>
    </footer>
    <Toaster />
  </div>
);

export default DashboardLayout;
