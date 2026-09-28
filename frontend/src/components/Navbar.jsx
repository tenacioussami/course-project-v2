import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Menu, X, ChevronDown, LogOut, LayoutDashboard, BookOpen, Cpu, FileText, Layers,
  Home, ListChecks, Users, Mail, ClipboardList, Flag, AlignJustify, Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { preloadProps } from '../lib/routes';
import { Avatar } from './ui';

const projectSubmenu = [
  { to: '/project/overview', label: 'Project Overview', desc: 'Goals, method & timeline', icon: Layers },
  { to: '/project/literature', label: 'Literature Review', desc: 'Papers we studied', icon: BookOpen },
  { to: '/project/equipments', label: 'Equipments', desc: 'Hardware inventory', icon: Cpu },
  { to: '/project/paper-work', label: 'Paper Work', desc: 'Drafts & documents', icon: FileText },
];

const links = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/tasks', label: 'Task', icon: ListChecks },
  { to: '/members', label: 'Members', icon: Users },
  { to: '/messages', label: 'Message', icon: Mail },
  { to: '/surveys', label: 'Survey', icon: ClipboardList },
];
const tailLinks = [
  { to: '/elements', label: 'Elements', icon: AlignJustify },
  { to: '/about', label: 'About', icon: Info },
];

const linkCls = ({ isActive }) =>
  `relative flex items-center gap-2 rounded-xl border px-2.5 py-2 text-sm font-medium transition ${
    isActive
      ? 'border-sky-400/50 bg-sky-500/15 text-white shadow-[0_0_24px_-8px_rgba(56,189,248,.7)]'
      : 'border-transparent text-slate-300 hover:text-white hover:bg-white/[0.05]'
  }`;

const NavItem = ({ l }) => (
  <NavLink to={l.to} end={l.to === '/'} className={linkCls} {...preloadProps(l.to)}>
    <l.icon size={16} className="hidden opacity-80 xl:block" /> {l.label}
  </NavLink>
);

export const Logo = () => (
  <Link to="/" {...preloadProps('/')} className="group flex items-center gap-3">
    <span className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-400 to-blue-600 shadow-[0_6px_24px_-6px_rgba(56,132,255,.8)] transition group-hover:scale-105">
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden>
        <rect x="4" y="7" width="16" height="11" rx="3" fill="#05070d" />
        <circle cx="9" cy="12.5" r="1.7" fill="#22d3ee" />
        <circle cx="15" cy="12.5" r="1.7" fill="#22d3ee" />
        <rect x="11" y="3" width="2" height="4" rx="1" fill="#05070d" />
      </svg>
    </span>
    <span className="leading-tight">
      <span className="block font-display text-[17px] font-bold tracking-tight text-white">CourseProjectHub</span>
      <span className="block text-[11px] font-medium text-slate-400">Computer Science</span>
    </span>
  </Link>
);

const Navbar = () => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const closeTimer = useRef();

  // Close menus whenever the route changes
  useEffect(() => {
    setMobileOpen(false);
    setProjectOpen(false);
  }, [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const projectActive = pathname.startsWith('/project');

  return (
    <header
      className={`sticky top-0 z-30 transition-colors duration-300 ${
        scrolled || mobileOpen ? 'border-b border-sky-400/15 bg-ink-950/80 backdrop-blur-xl' : 'border-b border-sky-400/10 bg-ink-950/30 backdrop-blur-md'
      }`}
    >
      <nav className="mx-auto flex h-[68px] max-w-7xl items-center justify-between px-4 sm:px-6">
        <Logo />

        {/* Desktop nav */}
        <div className="ml-6 hidden items-center gap-0.5 lg:flex">
          {links.map((l) => <NavItem key={l.to} l={l} />)}

          <div
            className="relative"
            onMouseEnter={() => { clearTimeout(closeTimer.current); setProjectOpen(true); }}
            onMouseLeave={() => { closeTimer.current = setTimeout(() => setProjectOpen(false), 120); }}
          >
            <button
              onClick={() => setProjectOpen((v) => !v)}
              aria-expanded={projectOpen}
              className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 text-sm font-medium transition ${
                projectActive ? 'border-sky-400/50 bg-sky-500/15 text-white' : 'border-transparent text-slate-300 hover:bg-white/[0.05] hover:text-white'
              }`}
            >
              <Flag size={16} className="hidden opacity-80 xl:block" /> Project <ChevronDown size={14} className={`transition ${projectOpen ? 'rotate-180' : ''}`} />
            </button>
            {projectOpen && (
              <div className="absolute left-1/2 top-full w-80 -translate-x-1/2 pt-2">
                <div className="panel animate-fade-up p-2 shadow-2xl shadow-black/50">
                  {projectSubmenu.map((s) => (
                    <Link
                      key={s.to}
                      to={s.to}
                      {...preloadProps(s.to)}
                      className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-white/[0.06] ${
                        pathname === s.to ? 'bg-white/[0.06]' : ''
                      }`}
                    >
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-400/15 to-violet-500/15 text-cyan-300 ring-1 ring-white/10">
                        <s.icon size={17} />
                      </span>
                      <span>
                        <span className="block text-sm font-semibold text-white">{s.label}</span>
                        <span className="block text-xs text-slate-400">{s.desc}</span>
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {tailLinks.map((l) => <NavItem key={l.to} l={l} />)}
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <>
              <Link to="/dashboard" {...preloadProps('/dashboard')} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] py-1 pl-1 pr-3 text-sm font-semibold text-slate-200 transition hover:border-cyan-400/40">
                <Avatar name={user.name} src={user.profileImage} size={28} />
                <span className="max-w-[120px] truncate">{user.name}</span>
              </Link>
              <button onClick={handleLogout} className="icon-btn-danger" title="Logout" aria-label="Logout">
                <LogOut size={16} />
              </button>
            </>
          ) : (
            <>
              <Link to="/login" {...preloadProps('/login')} className="btn-ghost font-medium">Login</Link>
              <Link to="/register" {...preloadProps('/register')} className="btn-primary px-5">Register</Link>
            </>
          )}
        </div>

        <button className="icon-btn lg:hidden" onClick={() => setMobileOpen((v) => !v)} aria-label="Menu">
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="animate-fade-up border-t border-white/[0.06] px-4 pb-5 pt-3 lg:hidden">
          <div className="grid grid-cols-2 gap-1.5">
            {[...links, ...tailLinks].map((l) => (
              <NavLink key={l.to} to={l.to} end={l.to === '/'} className={linkCls} {...preloadProps(l.to)}>
                <l.icon size={15} className="opacity-80" /> {l.label}
              </NavLink>
            ))}
          </div>
          <p className="eyebrow mb-2 mt-4 px-3">Project</p>
          <div className="grid gap-1">
            {projectSubmenu.map((s) => (
              <NavLink key={s.to} to={s.to} className={linkCls} {...preloadProps(s.to)}>
                <span className="flex items-center gap-2"><s.icon size={15} /> {s.label}</span>
              </NavLink>
            ))}
          </div>
          <div className="mt-4 flex gap-2 border-t border-white/[0.06] pt-4">
            {user ? (
              <>
                <Link to="/dashboard" className="btn-secondary flex-1"><LayoutDashboard size={15} /> Dashboard</Link>
                <button onClick={handleLogout} className="btn-ghost text-rose-300"><LogOut size={15} /> Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary flex-1">Login</Link>
                <Link to="/register" className="btn-primary flex-1">Register</Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
