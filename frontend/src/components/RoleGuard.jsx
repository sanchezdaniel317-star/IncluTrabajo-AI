import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSession } from '../contexts/SessionContext';

export default function RoleGuard({ children, allowedRole }) {
  const { session, loading } = useSession();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20">
        <p className="text-lg font-medium text-slate-600 animate-pulse">Cargando sesión...</p>
      </div>
    );
  }

  if (!session.perfil) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole && session.rol !== allowedRole) {
    return <Navigate to="/inicio" replace />;
  }

  return children;
}
