import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { Menu, X, ChevronDown, LogOut, User as UserIcon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navLink = 'px-3 py-2 text-sm font-medium rounded-md hover:bg-brand-50 hover:text-brand-700';
const activeLink = 'text-brand-700 bg-brand-50';

const projectSubmenu = [
  { to: '/project/overview', label: 'Project Overview' },
  { to: '/project/literature', label: 'Literature Review' },
  { to: '/project/equipments', label: 'Equipments' },
  { to: '/project/paper-work', label: 'Paper Work' },
];

const Navbar = () => {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);
  const [mobileProjectOpen, setMobileProjectOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const links = [
    { to: '/', label: 'Home' },
    { to: '/tasks', label: 'Task' },
    { to: '/members', label: 'Members' },
    { to: '/messages', label: 'Message' },
    { to: '/surveys', label: 'Survey' },
  ];

  return (
    <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-lg font-bold text-brand-700">
          Course Project Hub
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-1 md:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => `${navLink} ${isActive ? activeLink : 'text-gray-600'}`}>
              {l.label}
            </NavLink>
          ))}

          <div className="relative" onMouseEnter={() => setProjectOpen(true)} onMouseLeave={() => setProjectOpen(false)}>
            <button className={`${navLink} flex items-center gap-1 text-gray-600`}>
              Project <ChevronDown size={14} />
            </button>
            {projectOpen && (
              <div className="absolute left-0 top-full w-56 rounded-lg border bg-white py-2 shadow-lg">
                {projectSubmenu.map((s) => (
                  <Link key={s.to} to={s.to} className="block px-4 py-2 text-sm text-gray-600 hover:bg-brand-50 hover:text-brand-700">
                    {s.label}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <NavLink to="/elements" className={({ isActive }) => `${navLink} ${isActive ? activeLink : 'text-gray-600'}`}>
            Elements
          </NavLink>
          <NavLink to="/about" className={({ isActive }) => `${navLink} ${isActive ? activeLink : 'text-gray-600'}`}>
            About
          </NavLink>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          {user ? (
            <>
              <Link to="/dashboard" className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-brand-700">
                <UserIcon size={16} /> {user.name}
              </Link>
              <button onClick={handleLogout} className="flex items-center gap-1 rounded-md bg-gray-100 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600">
                <LogOut size={14} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-gray-600 hover:text-brand-700">Login</Link>
              <Link to="/register" className="rounded-md bg-brand-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-brand-700">Register</Link>
            </>
          )}
        </div>

        <button className="md:hidden" onClick={() => setMobileOpen((v) => !v)}>
          {mobileOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </nav>

      {/* Mobile nav */}
      {mobileOpen && (
        <div className="border-t bg-white px-4 py-3 md:hidden">
          <div className="flex flex-col gap-1">
            {links.map((l) => (
              <Link key={l.to} to={l.to} onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-brand-50">
                {l.label}
              </Link>
            ))}

            <button onClick={() => setMobileProjectOpen((v) => !v)} className="flex items-center justify-between rounded-md px-3 py-2 text-left text-sm font-medium text-gray-600 hover:bg-brand-50">
              Project <ChevronDown size={14} className={mobileProjectOpen ? 'rotate-180 transition' : 'transition'} />
            </button>
            {mobileProjectOpen && (
              <div className="ml-3 flex flex-col gap-1 border-l pl-3">
                {projectSubmenu.map((s) => (
                  <Link key={s.to} to={s.to} onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 text-sm text-gray-500 hover:bg-brand-50">
                    {s.label}
                  </Link>
                ))}
              </div>
            )}

            <Link to="/elements" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-brand-50">Elements</Link>
            <Link to="/about" onClick={() => setMobileOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-brand-50">About</Link>

            <div className="mt-2 border-t pt-2">
              {user ? (
                <>
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-brand-50">
                    {user.name} (Dashboard)
                  </Link>
                  <button onClick={handleLogout} className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50">
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileOpen(false)} className="block rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-brand-50">Login</Link>
                  <Link to="/register" onClick={() => setMobileOpen(false)} className="block rounded-md px-3 py-2 text-sm font-medium text-gray-600 hover:bg-brand-50">Register</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
