const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('accessToken');
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async handleResponse(res: Response) {
    if (res.status === 401) {
      // Try refresh
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          if (refreshRes.ok) {
            const data = await refreshRes.json();
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            // Caller should retry
            return { __retry: true };
          }
        } catch {
          // Refresh failed
        }
      }
      localStorage.clear();
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || 'Request failed');
    }

    return res.json();
  }

  async get(path: string) {
    const res = await fetch(`${API_URL}${path}`, { headers: this.getHeaders() });
    const data = await this.handleResponse(res);
    if (data?.__retry) {
      const retryRes = await fetch(`${API_URL}${path}`, { headers: this.getHeaders() });
      return this.handleResponse(retryRes);
    }
    return data;
  }

  async post(path: string, body?: any) {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await this.handleResponse(res);
    if (data?.__retry) {
      const retryRes = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });
      return this.handleResponse(retryRes);
    }
    return data;
  }

  async put(path: string, body?: any) {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await this.handleResponse(res);
    if (data?.__retry) {
      const retryRes = await fetch(`${API_URL}${path}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: body ? JSON.stringify(body) : undefined,
      });
      return this.handleResponse(retryRes);
    }
    return data;
  }

  async delete(path: string) {
    const res = await fetch(`${API_URL}${path}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleResponse(res);
  }
}

export const api = new ApiClient();
