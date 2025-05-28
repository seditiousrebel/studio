
// src/lib/api-client.ts
import { AppError } from './error-handling';
import { ROUTES } from './routes'; // For constructing API paths

// Helper to resolve API paths using the ROUTES object
function resolveApiPath(entity: keyof typeof ROUTES.API, id?: string): string {
  const pathConfig = ROUTES.API[entity];
  if (typeof pathConfig === 'function' && id) {
    return pathConfig(id);
  } else if (typeof pathConfig === 'string') {
    return pathConfig;
  }
  throw new Error(`Invalid API path configuration for entity: ${String(entity)}`);
}


export const apiClient = {
  async get<T>(pathOrEntity: string | keyof typeof ROUTES.API, id?: string): Promise<T> {
    const path = typeof pathOrEntity === 'string' ? pathOrEntity : resolveApiPath(pathOrEntity, id);
    return this.request('GET', path);
  },

  async post<T>(pathOrEntity: string | keyof typeof ROUTES.API, data: any, id?: string): Promise<T> {
    const path = typeof pathOrEntity === 'string' ? pathOrEntity : resolveApiPath(pathOrEntity, id);
    return this.request('POST', path, data);
  },

  async put<T>(pathOrEntity: string | keyof typeof ROUTES.API, data: any, id?: string): Promise<T> {
    const path = typeof pathOrEntity === 'string' ? pathOrEntity : resolveApiPath(pathOrEntity, id);
    return this.request('PUT', path, data);
  },
  
  async patch<T>(pathOrEntity: string | keyof typeof ROUTES.API, data: any, id?: string): Promise<T> {
    const path = typeof pathOrEntity === 'string' ? pathOrEntity : resolveApiPath(pathOrEntity, id);
    return this.request('PATCH', path, data);
  },

  async delete<T>(pathOrEntity: string | keyof typeof ROUTES.API, id?: string): Promise<T> {
    const path = typeof pathOrEntity === 'string' ? pathOrEntity : resolveApiPath(pathOrEntity, id);
    return this.request('DELETE', path);
  },

  async request<T>(method: string, path: string, data?: any): Promise<T> {
    const options: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Important for sending cookies for auth
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    // Ensure path starts with /api if it's a relative path without it
    const fullPath = path.startsWith('/api') ? path : `/api${path}`;

    const response = await fetch(fullPath, options);

    if (!response.ok) {
      let errorResponse;
      try {
        errorResponse = await response.json();
      } catch (e) {
        // If response is not JSON, use status text
        throw new AppError(
          `Request failed with status ${response.status}: ${response.statusText}`,
          response.status,
          'NETWORK_ERROR'
        );
      }
      
      throw new AppError(
        errorResponse?.error?.message || errorResponse?.message || `Request failed with status ${response.status}`,
        response.status,
        errorResponse?.error?.code || errorResponse?.code || 'API_ERROR',
        errorResponse?.error?.details || errorResponse?.details
      );
    }

    // Handle cases where response might be empty (e.g., 204 No Content for DELETE)
    if (response.status === 204) {
      return null as T; // Or an appropriate empty value based on T
    }

    return response.json();
  }
};
