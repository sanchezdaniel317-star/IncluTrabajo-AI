import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { AccessibilityProvider } from './contexts/AccessibilityContext';
import { SessionProvider } from './contexts/SessionContext';
import Layout from './components/Layout';
import RoleGuard from './components/RoleGuard';

import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';
import Privacy from './pages/Privacy';
import Home from './pages/Home';
import CandidateProfile from './pages/CandidateProfile';
import Matches from './pages/Matches';
import VacancyDetail from './pages/VacancyDetail';
import Vacancies from './pages/Vacancies';
import Applications from './pages/Applications';
import CompanyDashboard from './pages/CompanyDashboard';
import NewVacancy from './pages/NewVacancy';
import Applicants from './pages/Applicants';
import Notifications from './pages/Notifications';
import Help from './pages/Help';

function NotFound() {
  return (
    <div className="empty-state max-w-xl mx-auto py-16 space-y-4">
      <span className="text-6xl font-extrabold text-teal-600" aria-hidden="true">404</span>
      <h1 className="text-3xl font-extrabold text-brand-900" tabIndex={-1}>Página no encontrada</h1>
      <p className="text-slate-600 max-w-md">
        Es posible que el enlace haya cambiado o esté incompleto. Puedes regresar al inicio o consultar la sección de ayuda.
      </p>
      <div className="flex flex-wrap justify-center gap-3 pt-2">
        <Link to="/" className="btn-navy">
          Volver a la bienvenida
        </Link>
        <Link to="/ayuda" className="btn-secondary">
          Ayuda y accesibilidad
        </Link>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AccessibilityProvider>
        <SessionProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<Welcome />} />
              <Route path="/login" element={<Login />} />
              <Route path="/registro" element={<Register />} />
              <Route path="/privacidad" element={<Privacy />} />
              <Route path="/ayuda" element={<Help />} />
              <Route
                path="/notificaciones"
                element={
                  <RoleGuard>
                    <Notifications />
                  </RoleGuard>
                }
              />

              <Route
                path="/inicio"
                element={
                  <RoleGuard>
                    <Home />
                  </RoleGuard>
                }
              />

              {/* Rutas de candidato */}
              <Route
                path="/perfil"
                element={
                  <RoleGuard allowedRole="candidato">
                    <CandidateProfile />
                  </RoleGuard>
                }
              />
              <Route
                path="/coincidencias"
                element={
                  <RoleGuard allowedRole="candidato">
                    <Matches />
                  </RoleGuard>
                }
              />
              <Route path="/vacantes" element={<Vacancies />} />
              <Route path="/vacantes/:id" element={<VacancyDetail />} />
              <Route
                path="/postulaciones"
                element={
                  <RoleGuard allowedRole="candidato">
                    <Applications />
                  </RoleGuard>
                }
              />

              {/* Rutas de empresa */}
              <Route
                path="/empresa"
                element={
                  <RoleGuard allowedRole="empresa">
                    <CompanyDashboard />
                  </RoleGuard>
                }
              />
              <Route
                path="/empresa/vacantes/nueva"
                element={
                  <RoleGuard allowedRole="empresa">
                    <NewVacancy />
                  </RoleGuard>
                }
              />
              <Route
                path="/empresa/vacantes/:id/editar"
                element={
                  <RoleGuard allowedRole="empresa">
                    <NewVacancy />
                  </RoleGuard>
                }
              />
              <Route
                path="/empresa/vacantes/:id/candidatos"
                element={
                  <RoleGuard allowedRole="empresa">
                    <Applicants />
                  </RoleGuard>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </SessionProvider>
      </AccessibilityProvider>
    </BrowserRouter>
  );
}
