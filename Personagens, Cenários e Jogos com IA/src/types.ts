/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ============================================================================
// DEFINIÇÃO DE TIPOS DO JOGO "AS AVENTURAS DE NINA"
// ============================================================================

export type EstadoPersonagem = 'idle' | 'walk' | 'jump' | 'attack' | 'hit';

export type StatusJogo = 'inicio' | 'jogando' | 'vitoria' | 'derrota';

// Representa a personagem principal (Nina)
export interface PersonagemNina {
  x: number;
  y: number;
  vx: number;
  vy: number;
  largura: number;
  altura: number;
  noChao: boolean;
  olhandoDireita: boolean;
  estado: EstadoPersonagem;
  vidas: number;
  medicamentosColetados: number;
  tempoAtaque: number;
  tempoInvencivel: number;
  quadroAnimacao: number;
  tempoPasso: number;
}

// Representa um inimigo patrulheiro
export interface Inimigo {
  id: number;
  x: number;
  y: number;
  largura: number;
  altura: number;
  vx: number;
  limiteEsquerdo: number;
  limiteDireito: number;
  vivo: boolean;
  tempoMorte: number;
  tempoPausa: number; // Pausa de 0,5s (30 quadros) ao atingir a ponta da plataforma
  olhandoDireita: boolean;
}

// Representa uma plataforma sólida
export interface Plataforma {
  x: number;
  y: number;
  largura: number;
  altura: number;
  tipo?: 'chao' | 'elevada';
}

// Representa um frasco de medicamento coletável
export interface Medicamento {
  id: number;
  x: number;
  y: number;
  largura: number;
  altura: number;
  coletado: boolean;
  flutuacaoOffset: number;
}

// Efeito visual de brilho dourado ao coletar medicamento (0,3s = 18 frames)
export interface EfeitoColeta {
  x: number;
  y: number;
  frame: number;
  duracaoMax: number; // 18 frames a 60fps = 0.3 segundos
}

// Representa partículas visuais (brilhos, poeira, faíscas)
export interface Particula {
  x: number;
  y: number;
  vx: number;
  vy: number;
  vida: number;
  vidaMax: number;
  cor: string;
  tamanho: number;
}

// Representa a câmera do jogo
export interface Camera {
  x: number;
  y: number;
}

// Estado completo do jogo
export interface EstadoJogo {
  nina: PersonagemNina;
  inimigos: Inimigo[];
  medicamentos: Medicamento[];
  plataformas: Plataforma[];
  camera: Camera;
  particulas: Particula[];
  efeitosColeta: EfeitoColeta[];
  status: StatusJogo;
  tempoDecorrido: number;
  shakeTela: number;
}

// Chaves de assets do jogo com seus caminhos exatos
export type NomeAsset =
  | 'nina_idle.png'
  | 'nina_walk.png'
  | 'nina_jump.png'
  | 'nina_hit.png'
  | 'nina_attack.png'
  | 'enemy.png'
  | 'remedy.png'
  | 'bg_sky.png'
  | 'bg_city.png'
  | 'tile_ground.png';
