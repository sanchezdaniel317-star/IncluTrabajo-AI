import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch } from '../api/client';

const SessionContext = createContext();

export function SessionProvider({ children }) {
  const [session, setSession] = useState({ perfil: null, rol: null });
  const [loading, setLoading] = useState(true);

  const fetchSession = async () => {
    try {
      const data = await apiFetch('/sesion');
      setSession(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const login = async (email, password, recordar = false) => {
    const data = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, recordar }),
    });
    setSession({ perfil: data.perfil, rol: data.rol });
    return data;
  };

  const loginDemo = async (perfilId) => {
    const data = await apiFetch('/auth/demo', {
      method: 'POST',
      body: JSON.stringify({ perfil_id: perfilId }),
    });
    setSession({ perfil: data.perfil, rol: data.rol });
    return data;
  };

  const register = async (payload) => {
    const data = await apiFetch('/auth/registro', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    setSession({ perfil: data.perfil, rol: data.rol });
    return data;
  };

  const logout = async () => {
    await apiFetch('/sesion', { method: 'DELETE' });
    setSession({ perfil: null, rol: null });
  };

  return (
    <SessionContext.Provider value={{
      session,
      loading,
      login,
      loginDemo,
      register,
      logout,
      refreshSession: fetchSession,
    }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
