import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App.tsx';
import { AuthProvider } from './contexts/AuthContext.tsx';
import AdminLayout from './components/admin/AdminLayout.tsx';
import AdminDashboard from './components/admin/AdminDashboard.tsx';
import AdminUserList from './components/admin/AdminUserList.tsx';
import AdminUserDetail from './components/admin/AdminUserDetail.tsx';
import AdminStats from './components/admin/AdminStats.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUserList />} />
            <Route path="users/:id" element={<AdminUserDetail />} />
            <Route path="stats" element={<AdminStats />} />
          </Route>
          <Route path="*" element={<App />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
);
