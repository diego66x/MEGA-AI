
export interface PageResult {
  id: string;
  name: string;
  page_profile_uri?: string;
  category?: string;
  verification_status?: string;
  page_likes?: number;
  ig_username?: string;
  // Novos campos avançados
  active_ads_count: number;
  ads_start_date: string;
  is_active: boolean;
}

export interface MetaPageResult {
    id: string;
    name: string;
    page_profile_uri: string;
    verification_status?: string;
    page_likes?: number;
}

export interface SearchState {
  query: string;
  country: string;
  results: PageResult[];
  loading: boolean;
  error: string | null;
}

export interface CountryOption {
  code: string;
  name: string;
  flag: string;
}

export const COUNTRIES: CountryOption[] = [
  { code: 'BR', name: 'Brasil', flag: '🇧🇷' },
  { code: 'US', name: 'Estados Unidos', flag: '🇺🇸' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'GB', name: 'Reino Unido', flag: '🇬🇧' },
  { code: 'DE', name: 'Alemanha', flag: '🇩🇪' },
  { code: 'ES', name: 'Espanha', flag: '🇪🇸' },
];

export enum ViewMode {
  GRID = 'GRID',
  LIST = 'LIST',
  ANALYTICS = 'ANALYTICS'
}

// Interfaces para os novos serviços
export interface StockMedia {
    id: number | string;
    type: 'image' | 'video';
    url: string; // URL para display
    downloadUrl: string; // URL para download/save
    thumbnail: string;
    author: string;
    width: number;
    height: number;
}

// --- Interfaces para o Módulo de Roteiro (Script to Video) ---
export interface ScriptScene {
    id: number;
    description: string; // O que acontece visualmente
    narration: string; // O que é falado
    searchTerm: string; // Termo para buscar no Pexels/Grok
    duration: number; // Estimativa
    
    // Assets gerados
    mediaUrl?: string;
    mediaType?: 'video' | 'image';
    audioUrl?: string;
}

export interface VideoProject {
    id: string;
    title: string;
    format: '9:16' | '16:9';
    scenes: ScriptScene[];
    score: number; // Nota de qualidade da IA (0-100)
    createdAt: string;
}
