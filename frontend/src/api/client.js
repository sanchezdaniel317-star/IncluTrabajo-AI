const API_BASE = '/api';

export async function apiFetch(endpoint, options = {}) {
  const { timeoutMs = 15000, ...fetchOptions } = options;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...fetchOptions,
      credentials: 'include',
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
    });

    const contentType = response.headers.get('content-type') || '';
    let data = null;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = { error: text && text.length < 300 ? text : 'El servidor devolvió una respuesta inesperada.' };
    }

    if (!response.ok) {
      const error = new Error(data?.error || 'Ocurrió un error en la solicitud');
      error.status = response.status;
      throw error;
    }
    return data;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('La solicitud tardó demasiado. Revisa tu conexión e intenta de nuevo.');
    }
    if (error instanceof TypeError) {
      throw new Error('No pudimos conectar con el servidor. Verifica que el backend esté activo.');
    }
    if (import.meta.env.DEV) {
      console.error('API Error:', error);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}
