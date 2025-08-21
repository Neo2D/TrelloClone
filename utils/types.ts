export interface User {
  id: number;
  name: string;
  email: string;
  profile_image?: string;
}

export interface CreateWorkspaceData {
  name: string;
  image_url?: string;
}

export interface CreateBoardData {
  name: string;
  workspace_id: number;
}

export interface CreateListData {
  title: string;
  board_id: number;
  position?: number;
}

export interface CreateCardData {
  title: string;
  description?: string;
  list_id: number;
  position?: number;
}

export interface UpdateCardData {
  title?: string;
  description?: string;
  list_id?: number;
  position?: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
}

export interface UserProfileUpdate {
  name?: string;
  email?: string;
}

export interface PasswordUpdate {
  currentPassword: string;
  newPassword: string;
}