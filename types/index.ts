export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
  profile_image?: string;
}

export interface Workspace {
  id: number;
  name: string;
  image_url?: string;
  owner_id: number;
}

export interface Board {
  id: number;
  name: string;
  workspace_id: number;
}

export interface Card {
  id: number;
  title: string;
  description?: string;
  position: number;
  list_id: number;
}

// Cada lista tiene un arreglo de cartas
export interface List {
  id: number;
  title: string;
  position: number;
  board_id: number;
  cards: Card[]; // aquí agregamos las cartas
}
