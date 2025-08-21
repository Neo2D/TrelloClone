const API_BASE = '/api';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  success: boolean;
}

class ApiClient {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();

      if (response.ok) {
        return { data, success: true };
      } else {
        return { error: data.error || 'Request failed', success: false };
      }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
        success: false,
      };
    }
  }

  // Auth methods
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(name: string, email: string, password: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
  }

  async logout() {
    return this.request('/auth/logout', { method: 'POST' });
  }

  async getUser() {
    return this.request('/auth/profile');
  }

  // Workspace methods
  async getWorkspaces() {
    return this.request('/workspaces');
  }

  async createWorkspace(name: string, image_url?: string) {
    return this.request('/workspaces', {
      method: 'POST',
      body: JSON.stringify({ name, image_url }),
    });
  }

  async updateWorkspace(id: number, name?: string, image_url?: string) {
    return this.request(`/workspaces/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name, image_url }),
    });
  }

  async deleteWorkspace(id: number) {
    return this.request(`/workspaces/${id}`, { method: 'DELETE' });
  }

  // Board methods
  async getBoards(workspaceId: number) {
    return this.request(`/workspaces/${workspaceId}/boards`);
  }

  async createBoard(workspaceId: number, name: string) {
    return this.request(`/workspaces/${workspaceId}/boards`, {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  async getBoard(id: number) {
    return this.request(`/boards/${id}`);
  }

  async updateBoard(id: number, name: string) {
    return this.request(`/boards/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    });
  }

  async deleteBoard(id: number) {
    return this.request(`/boards/${id}`, { method: 'DELETE' });
  }

  // List methods
  async getLists(boardId: number) {
    return this.request(`/boards/${boardId}/lists`);
  }

  async createList(boardId: number, title: string) {
    return this.request(`/boards/${boardId}/lists`, {
      method: 'POST',
      body: JSON.stringify({ title }),
    });
  }

  async updateList(id: number, title?: string, position?: number) {
    return this.request(`/lists/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ title, position }),
    });
  }

  async deleteList(id: number) {
    return this.request(`/lists/${id}`, { method: 'DELETE' });
  }

  // Card methods
  async getCards(listId: number) {
    return this.request(`/lists/${listId}/cards`);
  }

  async createCard(listId: number, title: string, description?: string) {
    return this.request(`/lists/${listId}/cards`, {
      method: 'POST',
      body: JSON.stringify({ title, description }),
    });
  }

  async updateCard(id: number, updates: { title?: string; description?: string; list_id?: number; position?: number }) {
    return this.request(`/cards/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteCard(id: number) {
    return this.request(`/cards/${id}`, { method: 'DELETE' });
  }
}

export const api = new ApiClient();
