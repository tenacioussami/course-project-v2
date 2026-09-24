import { Outlet } from 'react-router-dom';
import Navbar from '../components/Navbar';

const DashboardLayout = () => (
  <div className="min-h-screen bg-gray-50">
    <Navbar />
    <main className="mx-auto max-w-7xl px-4 py-6">
      <Outlet />
    </main>
    <footer className="border-t bg-white py-6 text-center text-sm text-gray-400">
      Course Project Hub &copy; {new Date().getFullYear()}
    </footer>
  </div>
);

export default DashboardLayout;
