import { Routes, Route } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Tasks from './pages/Tasks';
import Members from './pages/Members';
import Messages from './pages/Messages';
import Surveys from './pages/Surveys';
import ProjectOverview from './pages/ProjectOverview';
import LiteratureReview from './pages/LiteratureReview';
import Equipments from './pages/Equipments';
import PaperWork from './pages/PaperWork';
import Elements from './pages/Elements';
import About from './pages/About';

function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/about" element={<About />} />
        <Route path="/project/overview" element={<ProjectOverview />} />

        {/* All sections are publicly viewable. Write actions inside each page
            are still gated by checking `user` / `isAdmin` from AuthContext. */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/members" element={<Members />} />
        <Route path="/messages" element={<Messages />} />
        <Route path="/surveys" element={<Surveys />} />
        <Route path="/project/literature" element={<LiteratureReview />} />
        <Route path="/project/equipments" element={<Equipments />} />
        <Route path="/project/paper-work" element={<PaperWork />} />
        <Route path="/elements" element={<Elements />} />

        <Route path="*" element={<Home />} />
      </Route>
    </Routes>
  );
}

export default App;
