/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { audio } from './audio';
import {
  Camera,
  EstadoJogo,
  EstadoPersonagem,
  Inimigo,
  Medicamento,
  NomeAsset,
  Particula,
  PersonagemNina,
  Plataforma,
} from './types';

// ============================================================================
// CONSTANTES DE FÍSICA E CONFIGURAÇÃO DO JOGO
// Fáceis de ajustar conforme solicitado nas instruções
// ============================================================================

export const GRAVIDADE = 0.62;                    // Aceleração da gravidade por quadro (px/frame²)
export const VELOCIDADE_HORIZONTAL = 4.4;         // Velocidade de deslocamento da Nina (px/frame)
export const FORCA_PULO = -12.4;                  // Impulso inicial para cima ao saltar (px/frame)
export const VELOCIDADE_INIMIGO = 0.85;           // Velocidade reduzida pela metade conforme solicitado
export const PAUSA_INIMIGO_QUADROS = 30;          // Pausa de 0,5 segundo (30 frames a 60 FPS) na ponta da plataforma

export const LARGURA_MUNDO = 3600;                // Comprimento total da fase horizontal (px)
export const ALTURA_MUNDO = 540;                  // Altura total do cenário do jogo (px)
export const LARGURA_TELA = 960;                  // Resolução horizontal base de renderização (px)
export const ALTURA_TELA = 540;                   // Resolução vertical base de renderização (px)

export const PONTO_INICIAL_X = 90;                // Posição inicial de spawn da Nina (X)
export const PONTO_INICIAL_Y = 380;               // Posição inicial de spawn da Nina (Y)

export const DURACAO_ATAQUE = 16;                 // Duração da animação de ataque em frames
export const COOLDOWN_ATAQUE = 22;                // Intervalo mínimo entre ataques consecutivos
export const TEMPO_INVENCIVEL_POS_HIT = 90;       // Duração do período de invulnerabilidade após dano
export const TOTAL_MEDICAMENTOS = 10;             // Total de remédios que devem ser coletados para vencer

// ============================================================================
// GERENCIADOR DE ASSETS COM SUPORTE A FALLBACK VISUAL
// Se a imagem não for encontrada, desenha um retângulo colorido mantendo o nome
// ============================================================================

export interface AssetItem {
  img: HTMLImageElement;
  carregado: boolean;
  erro: boolean;
  caminho: string;
  corFallback: string;
}

export const NOMES_ASSETS: Record<NomeAsset, { caminho: string; cor: string }> = {
  'nina_idle.png': { caminho: '/assets/nina_idle.png', cor: '#3b82f6' },
  'nina_walk.png': { caminho: '/assets/nina_walk.png', cor: '#2563eb' },
  'nina_jump.png': { caminho: '/assets/nina_jump.png', cor: '#1d4ed8' },
  'nina_hit.png': { caminho: '/assets/nina_hit.png', cor: '#ef4444' },
  'nina_attack.png': { caminho: '/assets/nina_attack.png', cor: '#f59e0b' },
  'enemy.png': { caminho: '/assets/enemy.png', cor: '#e11d48' },
  'remedy.png': { caminho: '/assets/remedy.png', cor: '#06b6d4' },
  'bg_sky.png': { caminho: '/assets/bg_sky.png', cor: '#0f172a' },
  'bg_city.png': { caminho: '/assets/bg_city.png', cor: '#1e293b' },
  'tile_ground.png': { caminho: '/assets/tile_ground.png', cor: '#334155' },
};

export const assets: Record<NomeAsset, AssetItem> = {} as Record<NomeAsset, AssetItem>;

// Inicialização imediata do carregamento de todas as imagens requeridas
Object.entries(NOMES_ASSETS).forEach(([nome, info]) => {
  const chave = nome as NomeAsset;
  const img = new Image();
  img.src = info.caminho;
  const item: AssetItem = {
    img,
    carregado: false,
    erro: false,
    caminho: info.caminho,
    corFallback: info.cor,
  };
  img.onload = () => {
    item.carregado = true;
  };
  img.onerror = () => {
    item.erro = true;
    console.warn(`[Asset] Imagem não encontrada: ${info.caminho}. Utilizando fallback colorido.`);
  };
  assets[chave] = item;
});

// Desenha a imagem ou seu fallback colorido caso o arquivo não exista
export function desenharAsset(
  ctx: CanvasRenderingContext2D,
  nome: NomeAsset,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  sx?: number,
  sy?: number,
  sw?: number,
  sh?: number
) {
  const asset = assets[nome];
  if (asset && asset.carregado && !asset.erro && asset.img.naturalWidth > 0) {
    if (sx !== undefined && sy !== undefined && sw !== undefined && sh !== undefined) {
      ctx.drawImage(asset.img, sx, sy, sw, sh, dx, dy, dw, dh);
    } else {
      ctx.drawImage(asset.img, dx, dy, dw, dh);
    }
  } else {
    // Fallback: Desenho de retângulo colorido com borda e nome do arquivo
    ctx.save();
    ctx.fillStyle = asset ? asset.corFallback : '#64748b';
    ctx.fillRect(dx, dy, dw, dh);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(dx, dy, dw, dh);

    // Texto com o nome exato do arquivo no código
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(nome, dx + dw / 2, dy + dh / 2);
    ctx.restore();
  }
}

// ============================================================================
// 1. ESTADO (GAME STATE & DATA STRUCTURES)
// Inicialização de Nina, Inimigos, Plataformas, Medicamentos e Câmera
// ============================================================================

export function criarEstadoInicial(): EstadoJogo {
  // Criação da personagem Nina com todos os atributos físicos e de animação
  const nina: PersonagemNina = {
    x: PONTO_INICIAL_X,
    y: PONTO_INICIAL_Y,
    vx: 0,
    vy: 0,
    largura: 36,
    altura: 48,
    noChao: false,
    olhandoDireita: true,
    estado: 'idle',
    vidas: 3,
    medicamentosColetados: 0,
    tempoAtaque: 0,
    tempoInvencivel: 0,
    quadroAnimacao: 0,
    tempoPasso: 0,
  };

  // Criação dos 3 inimigos patrulheiros com plataformas designadas
  const inimigos: Inimigo[] = [
    {
      id: 1,
      x: 620,
      y: 260,
      largura: 38,
      altura: 38,
      vx: VELOCIDADE_INIMIGO,
      limiteEsquerdo: 580,
      limiteDireito: 880,
      vivo: true,
      tempoMorte: 0,
      tempoPausa: 0,
      olhandoDireita: true,
    },
    {
      id: 2,
      x: 1380,
      y: 220,
      largura: 38,
      altura: 38,
      vx: -VELOCIDADE_INIMIGO,
      limiteEsquerdo: 1280,
      limiteDireito: 1620,
      vivo: true,
      tempoMorte: 0,
      tempoPausa: 0,
      olhandoDireita: false,
    },
    {
      id: 3,
      x: 2450,
      y: 300,
      largura: 38,
      altura: 38,
      vx: VELOCIDADE_INIMIGO,
      limiteEsquerdo: 2360,
      limiteDireito: 2720,
      vivo: true,
      tempoMorte: 0,
      tempoPausa: 0,
      olhandoDireita: true,
    },
  ];

  // Construção do mapa com piso contínuo e plataformas elevadas
  const plataformas: Plataforma[] = [
    // Chão principal contínuo por toda a extensão da fase
    { x: 0, y: 476, largura: LARGURA_MUNDO, altura: 64, tipo: 'chao' },

    // Plataformas elevadas para exploração e saltos estratégicos
    { x: 260, y: 380, largura: 220, altura: 32, tipo: 'elevada' },
    { x: 560, y: 300, largura: 340, altura: 32, tipo: 'elevada' }, // Patrulha do Inimigo 1
    { x: 960, y: 380, largura: 200, altura: 32, tipo: 'elevada' },
    { x: 1260, y: 260, largura: 380, altura: 32, tipo: 'elevada' }, // Patrulha do Inimigo 2
    { x: 1700, y: 370, largura: 210, altura: 32, tipo: 'elevada' },
    { x: 1980, y: 270, largura: 290, altura: 32, tipo: 'elevada' },
    { x: 2340, y: 340, largura: 400, altura: 32, tipo: 'elevada' }, // Patrulha do Inimigo 3
    { x: 2820, y: 250, largura: 260, altura: 32, tipo: 'elevada' },
    { x: 3160, y: 350, largura: 320, altura: 32, tipo: 'elevada' },
  ];

  // Distribuição dos 10 medicamentos ao longo de todo o percurso
  const medicamentos: Medicamento[] = [
    { id: 1, x: 360, y: 330, largura: 30, altura: 30, coletado: false, flutuacaoOffset: 0 },
    { id: 2, x: 730, y: 250, largura: 30, altura: 30, coletado: false, flutuacaoOffset: 1.2 },
    { id: 3, x: 1050, y: 330, largura: 30, altura: 30, coletado: false, flutuacaoOffset: 2.1 },
    { id: 4, x: 1450, y: 210, largura: 30, altura: 30, coletado: false, flutuacaoOffset: 3.0 },
    { id: 5, x: 1650, y: 430, largura: 30, altura: 30, coletado: false, flutuacaoOffset: 0.8 },
    { id: 6, x: 1800, y: 320, largura: 30, altura: 30, coletado: false, flutuacaoOffset: 1.7 },
    { id: 7, x: 2120, y: 220, largura: 30, altura: 30, coletado: false, flutuacaoOffset: 2.9 },
    { id: 8, x: 2540, y: 290, largura: 30, altura: 30, coletado: false, flutuacaoOffset: 1.5 },
    { id: 9, x: 2940, y: 200, largura: 30, altura: 30, coletado: false, flutuacaoOffset: 0.4 },
    { id: 10, x: 3320, y: 300, largura: 30, altura: 30, coletado: false, flutuacaoOffset: 2.3 },
  ];

  // Câmera que acompanha a Nina horizontalmente
  const camera: Camera = { x: 0, y: 0 };

  return {
    nina,
    inimigos,
    medicamentos,
    plataformas,
    camera,
    particulas: [],
    efeitosColeta: [],
    status: 'inicio',
    tempoDecorrido: 0,
    shakeTela: 0,
  };
}

// ============================================================================
// 2. ENTRADA (INPUT HANDLING)
// Leitura de teclas do teclado e suporte a botões na interface
// ============================================================================

export interface TeclasPressionadas {
  esquerda: boolean;
  direita: boolean;
  pulo: boolean;
  ataque: boolean;
  enter: boolean;
}

export class GerenciadorEntradas {
  public teclas: TeclasPressionadas = {
    esquerda: false,
    direita: false,
    pulo: false,
    ataque: false,
    enter: false,
  };

  private puloConsumido: boolean = false;
  private ataqueConsumido: boolean = false;
  private enterConsumido: boolean = false;

  constructor() {
    this.configurarOuvintesTeclado();
  }

  private configurarOuvintesTeclado() {
    window.addEventListener('keydown', (e) => {
      // Ignora se o foco estiver num campo de texto ou formulário
      if (
        document.activeElement &&
        (document.activeElement.tagName === 'INPUT' ||
          document.activeElement.tagName === 'TEXTAREA')
      ) {
        return;
      }

      // Tecla ENTER para iniciar o jogo a partir da tela inicial
      if (e.code === 'Enter') {
        if (!this.enterConsumido) {
          this.teclas.enter = true;
        }
      }

      // Setas esquerda/direita ou A/D
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        this.teclas.esquerda = true;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.teclas.direita = true;
      }

      // Barra de espaço para pular
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        if (!this.puloConsumido) {
          this.teclas.pulo = true;
        }
        // Previne a rolagem padrão da página com a barra de espaço
        e.preventDefault();
      }

      // Tecla "E" para atacar
      if (e.code === 'KeyE') {
        if (!this.ataqueConsumido) {
          this.teclas.ataque = true;
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      if (e.code === 'Enter') {
        this.teclas.enter = false;
        this.enterConsumido = false;
      }
      if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
        this.teclas.esquerda = false;
      }
      if (e.code === 'ArrowRight' || e.code === 'KeyD') {
        this.teclas.direita = false;
      }
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        this.teclas.pulo = false;
        this.puloConsumido = false;
      }
      if (e.code === 'KeyE') {
        this.teclas.ataque = false;
        this.ataqueConsumido = false;
      }
    });
  }

  // Métodos auxiliares para acionamento via botões virtuais / toque
  public definirEsquerda(ativo: boolean) {
    this.teclas.esquerda = ativo;
  }

  public definirDireita(ativo: boolean) {
    this.teclas.direita = ativo;
  }

  public acionarPulo() {
    this.teclas.pulo = true;
  }

  public soltarPulo() {
    this.teclas.pulo = false;
    this.puloConsumido = false;
  }

  public acionarAtaque() {
    this.teclas.ataque = true;
  }

  public soltarAtaque() {
    this.teclas.ataque = false;
    this.ataqueConsumido = false;
  }

  public acionarEnter() {
    this.teclas.enter = true;
  }

  public soltarEnter() {
    this.teclas.enter = false;
    this.enterConsumido = false;
  }

  // Consome a intenção do enter instantâneo
  public consumirEnter(): boolean {
    if (this.teclas.enter && !this.enterConsumido) {
      this.enterConsumido = true;
      return true;
    }
    return false;
  }

  // Consome a intenção de pulo instantânea para evitar repetição involuntária
  public consumirPulo(): boolean {
    if (this.teclas.pulo && !this.puloConsumido) {
      this.puloConsumido = true;
      return true;
    }
    return false;
  }

  // Consome a intenção de ataque instantânea
  public consumirAtaque(): boolean {
    if (this.teclas.ataque && !this.ataqueConsumido) {
      this.ataqueConsumido = true;
      return true;
    }
    return false;
  }
}

// ============================================================================
// 3. REGRAS (PHYSICS & GAMEPLAY LOGIC)
// Gravidade constante, colisões com plataformas, dano, coleta e vitória
// ============================================================================

// Criação de partículas decorativas (brilhos, impacto, poeira)
export function criarParticulas(
  estado: EstadoJogo,
  x: number,
  y: number,
  quantidade: number,
  cor: string,
  velocidadeBase: number = 3
) {
  for (let i = 0; i < quantidade; i++) {
    const angulo = Math.random() * Math.PI * 2;
    const vel = (Math.random() * 0.7 + 0.3) * velocidadeBase;
    estado.particulas.push({
      x,
      y,
      vx: Math.cos(angulo) * vel,
      vy: Math.sin(angulo) * vel - 1,
      vida: 20 + Math.random() * 15,
      vidaMax: 35,
      cor,
      tamanho: 3 + Math.random() * 3,
    });
  }
}

// Atualização de todas as regras físicas e mecânicas por frame
export function atualizarRegras(estado: EstadoJogo, entradas: GerenciadorEntradas) {
  // Transição da tela inicial para o jogo ao pressionar ENTER ou PULO
  if (estado.status === 'inicio') {
    if (entradas.consumirEnter() || entradas.consumirPulo()) {
      estado.status = 'jogando';
    }
    return;
  }

  if (estado.status !== 'jogando') {
    return;
  }

  estado.tempoDecorrido++;

  const { nina, inimigos, medicamentos, plataformas } = estado;

  // Redução de efeitos temporários (screen shake, invencibilidade)
  if (estado.shakeTela > 0) {
    estado.shakeTela *= 0.88;
    if (estado.shakeTela < 0.2) estado.shakeTela = 0;
  }

  if (nina.tempoInvencivel > 0) {
    nina.tempoInvencivel--;
  }

  // --------------------------------------------------------------------------
  // CONTROLE DO ATAQUE DA NINA
  // --------------------------------------------------------------------------
  const apertouAtaque = entradas.consumirAtaque();
  if (apertouAtaque && nina.tempoAtaque <= 0) {
    nina.tempoAtaque = DURACAO_ATAQUE;
    audio.tocarAtaque();
    // Gera pequenas faíscas frontais
    const frenteX = nina.olhandoDireita ? nina.x + nina.largura + 10 : nina.x - 10;
    criarParticulas(estado, frenteX, nina.y + nina.altura / 2, 6, '#facc15', 2);
  }

  if (nina.tempoAtaque > 0) {
    nina.tempoAtaque--;
  }

  // --------------------------------------------------------------------------
  // MOVIMENTO HORIZONTAL DA NINA
  // --------------------------------------------------------------------------
  let direcaoX = 0;
  if (entradas.teclas.esquerda) direcaoX -= 1;
  if (entradas.teclas.direita) direcaoX += 1;

  if (direcaoX !== 0) {
    nina.vx = direcaoX * VELOCIDADE_HORIZONTAL;
    nina.olhandoDireita = direcaoX > 0;
  } else {
    nina.vx = 0;
  }

  // --------------------------------------------------------------------------
  // GRAVIDADE E PULO DA NINA
  // --------------------------------------------------------------------------
  const apertouPulo = entradas.consumirPulo();
  if (apertouPulo && nina.noChao) {
    nina.vy = FORCA_PULO;
    nina.noChao = false;
    audio.tocarPulo();
    // Poeira de salto aos pés da Nina
    criarParticulas(estado, nina.x + nina.largura / 2, nina.y + nina.altura, 5, '#cbd5e1', 1.5);
  }

  // Aplicação da gravidade constante
  nina.vy += GRAVIDADE;

  // --------------------------------------------------------------------------
  // ATUALIZAÇÃO DE POSIÇÃO E COLISÃO COM O TOPO DAS PLATAFORMAS
  // --------------------------------------------------------------------------
  // Movimento horizontal
  nina.x += nina.vx;

  // Limite horizontal do mundo
  if (nina.x < 0) nina.x = 0;
  if (nina.x + nina.largura > LARGURA_MUNDO) {
    nina.x = LARGURA_MUNDO - nina.largura;
  }

  // Movimento vertical prévio para detectar cruzamento do topo das plataformas
  const yAnterior = nina.y;
  nina.y += nina.vy;
  nina.noChao = false;

  // Colisão com plataformas: a personagem colide com o topo das plataformas
  for (const plat of plataformas) {
    const colideHorizontal =
      nina.x + nina.largura > plat.x && nina.x < plat.x + plat.largura;

    if (colideHorizontal) {
      const pesAnteriores = yAnterior + nina.altura;
      const pesAtuais = nina.y + nina.altura;

      // Colisão ocorre quando a personagem está descendo (vy >= 0) e cruzou o topo
      if (nina.vy >= 0 && pesAnteriores <= plat.y + 6 && pesAtuais >= plat.y) {
        nina.y = plat.y - nina.altura;
        nina.vy = 0;
        nina.noChao = true;
        break;
      }
    }
  }

  // Limite inferior do mundo (caso caia em alguma fresta)
  if (nina.y + nina.altura > ALTURA_MUNDO) {
    nina.y = ALTURA_MUNDO - nina.altura;
    nina.vy = 0;
    nina.noChao = true;
  }

  // --------------------------------------------------------------------------
  // DETERMINAÇÃO DO ESTADO VISUAL DA NINA
  // --------------------------------------------------------------------------
  if (nina.tempoInvencivel > TEMPO_INVENCIVEL_POS_HIT - 20) {
    nina.estado = 'hit';
  } else if (nina.tempoAtaque > 0) {
    nina.estado = 'attack';
  } else if (!nina.noChao) {
    nina.estado = 'jump';
  } else if (Math.abs(nina.vx) > 0.1) {
    nina.estado = 'walk';
    nina.tempoPasso++;
    // Alterna quadros da caminhada (4 quadros no sprite sheet)
    if (nina.tempoPasso % 6 === 0) {
      nina.quadroAnimacao = (nina.quadroAnimacao + 1) % 4;
    }
  } else {
    nina.estado = 'idle';
    nina.quadroAnimacao = 0;
  }

  // --------------------------------------------------------------------------
  // ATUALIZAÇÃO DOS INIMIGOS E PATRULHA
  // Velocidade reduzida pela metade e pausa de 0,5 segundo ao chegar na ponta da plataforma
  // --------------------------------------------------------------------------
  const alcanceAtaque = 42;
  const caixaAtaque = nina.tempoAtaque > 0 ? {
    x: nina.olhandoDireita ? nina.x + nina.largura - 4 : nina.x - alcanceAtaque + 4,
    y: nina.y + 8,
    largura: alcanceAtaque,
    altura: nina.altura - 12,
  } : null;

  for (const inimigo of inimigos) {
    if (!inimigo.vivo) {
      // Inimigo derrotado: tempo para renascer após derrota
      inimigo.tempoMorte++;
      if (inimigo.tempoMorte > 360) { // ~6 segundos
        inimigo.vivo = true;
        inimigo.tempoMorte = 0;
        inimigo.tempoPausa = 0;
      }
      continue;
    }

    // Pausa de 0,5 segundo (30 frames) ao chegar na ponta da plataforma
    if (inimigo.tempoPausa > 0) {
      inimigo.tempoPausa--;
      if (inimigo.tempoPausa === 0) {
        // Ao finalizar a pausa de 0,5s, inverte o sentido de patrulha
        inimigo.vx = -inimigo.vx;
        inimigo.olhandoDireita = inimigo.vx > 0;
      }
    } else {
      inimigo.x += inimigo.vx;

      // Ao chegar na ponta esquerda da plataforma
      if (inimigo.x <= inimigo.limiteEsquerdo) {
        inimigo.x = inimigo.limiteEsquerdo;
        inimigo.tempoPausa = PAUSA_INIMIGO_QUADROS; // Pausa de 0,5s
      }
      // Ao chegar na ponta direita da plataforma
      else if (inimigo.x + inimigo.largura >= inimigo.limiteDireito) {
        inimigo.x = inimigo.limiteDireito - inimigo.largura;
        inimigo.tempoPausa = PAUSA_INIMIGO_QUADROS; // Pausa de 0,5s
      }
    }

    // 1. Verificação se o ataque da Nina atinge o inimigo
    if (caixaAtaque) {
      const colideAtaque =
        caixaAtaque.x < inimigo.x + inimigo.largura &&
        caixaAtaque.x + caixaAtaque.largura > inimigo.x &&
        caixaAtaque.y < inimigo.y + inimigo.altura &&
        caixaAtaque.y + caixaAtaque.altura > inimigo.y;

      if (colideAtaque) {
        inimigo.vivo = false;
        inimigo.tempoMorte = 0;
        audio.tocarInimigoDerrotado();
        criarParticulas(estado, inimigo.x + inimigo.largura / 2, inimigo.y + inimigo.altura / 2, 14, '#e11d48', 4);
        criarParticulas(estado, inimigo.x + inimigo.largura / 2, inimigo.y + inimigo.altura / 2, 8, '#facc15', 3);
        continue;
      }
    }

    // 2. Colisão do corpo da Nina com o inimigo
    // "Encostar num inimigo: perde 1 de 3 vidas e volta ao ponto inicial."
    const margem = 6;
    const colideInimigo =
      nina.x + margem < inimigo.x + inimigo.largura &&
      nina.x + nina.largura - margem > inimigo.x &&
      nina.y + margem < inimigo.y + inimigo.altura &&
      nina.y + nina.altura - margem > inimigo.y;

    if (colideInimigo && nina.tempoInvencivel <= 0) {
      nina.vidas--;
      audio.tocarDano();
      estado.shakeTela = 14;
      criarParticulas(estado, nina.x + nina.largura / 2, nina.y + nina.altura / 2, 16, '#ef4444', 4);

      if (nina.vidas <= 0) {
        // "Vidas zeradas: tela de 'Fim de jogo' com opção de reiniciar."
        estado.status = 'derrota';
        audio.tocarFimDeJogo();
      } else {
        // Retorna ao ponto inicial com vidas restantes e invulnerabilidade temporária
        nina.x = PONTO_INICIAL_X;
        nina.y = PONTO_INICIAL_Y;
        nina.vx = 0;
        nina.vy = 0;
        nina.tempoInvencivel = TEMPO_INVENCIVEL_POS_HIT;
        nina.estado = 'hit';
      }
    }
  }

  // --------------------------------------------------------------------------
  // COLETA DE MEDICAMENTOS (10 ESPALHADOS PELO MAPA)
  // Efeito visual: o medicamento some com um brilho dourado que se expande e desaparece em 0,3s
  // --------------------------------------------------------------------------
  for (const med of medicamentos) {
    if (med.coletado) continue;

    // Efeito sutil de flutuação vertical
    med.flutuacaoOffset += 0.05;

    const colideRemedio =
      nina.x < med.x + med.largura &&
      nina.x + nina.largura > med.x &&
      nina.y < med.y + med.altura &&
      nina.y + nina.altura > med.y;

    if (colideRemedio) {
      med.coletado = true;
      nina.medicamentosColetados++;
      audio.tocarColeta();

      // Adiciona o efeito visual de brilho dourado que se expande e desaparece em 0,3s (18 quadros)
      estado.efeitosColeta.push({
        x: med.x + med.largura / 2,
        y: med.y + med.altura / 2,
        frame: 0,
        duracaoMax: 18,
      });

      criarParticulas(estado, med.x + med.largura / 2, med.y + med.altura / 2, 10, '#f59e0b', 3.0);
      criarParticulas(estado, med.x + med.largura / 2, med.y + med.altura / 2, 6, '#fef08a', 2.0);

      // "coletar todos vence a fase."
      if (nina.medicamentosColetados >= TOTAL_MEDICAMENTOS) {
        estado.status = 'vitoria';
        audio.tocarVitoria();
      }
    }
  }

  // --------------------------------------------------------------------------
  // ATUALIZAÇÃO DA CÂMERA (SEGUE A PERSONAGEM HORIZONTALMENTE)
  // --------------------------------------------------------------------------
  const centroDesejadoX = nina.x + nina.largura / 2 - LARGURA_TELA / 2;
  // Câmera segue suavemente ou diretamente limitada às fronteiras do mapa
  estado.camera.x += (centroDesejadoX - estado.camera.x) * 0.12;

  if (estado.camera.x < 0) {
    estado.camera.x = 0;
  }
  const maxCameraX = LARGURA_MUNDO - LARGURA_TELA;
  if (estado.camera.x > maxCameraX) {
    estado.camera.x = maxCameraX;
  }

  // --------------------------------------------------------------------------
  // ATUALIZAÇÃO DOS EFEITOS DE BRILHO DOURADO (DESAPARECEM EM 0,3s)
  // --------------------------------------------------------------------------
  for (let i = estado.efeitosColeta.length - 1; i >= 0; i--) {
    const efeito = estado.efeitosColeta[i];
    efeito.frame++;
    if (efeito.frame >= efeito.duracaoMax) {
      estado.efeitosColeta.splice(i, 1);
    }
  }

  // --------------------------------------------------------------------------
  // ATUALIZAÇÃO DE PARTÍCULAS
  // --------------------------------------------------------------------------
  for (let i = estado.particulas.length - 1; i >= 0; i--) {
    const p = estado.particulas[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.1; // Leve gravidade na partícula
    p.vida--;
    if (p.vida <= 0) {
      estado.particulas.splice(i, 1);
    }
  }
}

// ============================================================================
// 4. RENDER (CANVAS RENDERING & PARALLAX)
// Renderização em 3 camadas de parallax, sprites, chão repetido e HUD
// ============================================================================

export function renderizarJogo(
  ctx: CanvasRenderingContext2D,
  estado: EstadoJogo,
  canvasLargura: number,
  canvasAltura: number
) {
  // Ajusta a escala proporcional caso o canvas tenha dimensões diferentes
  const escalaX = canvasLargura / LARGURA_TELA;
  const escalaY = canvasAltura / ALTURA_TELA;

  ctx.save();
  ctx.scale(escalaX, escalaY);

  // Aplicação de Screen Shake quando Nina recebe dano
  if (estado.shakeTela > 0) {
    const tremorX = (Math.random() - 0.5) * estado.shakeTela;
    const tremorY = (Math.random() - 0.5) * estado.shakeTela;
    ctx.translate(tremorX, tremorY);
  }

  // --------------------------------------------------------------------------
  // CAMADA 1 DE PARALLAX: bg_sky.png a 0% da velocidade da câmera
  // --------------------------------------------------------------------------
  const skyAsset = assets['bg_sky.png'];
  if (skyAsset.carregado && !skyAsset.erro && skyAsset.img.naturalWidth > 0) {
    // Desenha o céu preenchendo a tela estaticamente (0% velocidade da câmera)
    ctx.drawImage(skyAsset.img, 0, 0, LARGURA_TELA, ALTURA_TELA);
  } else {
    // Gradiente de céu noturno com fallback
    const grad = ctx.createLinearGradient(0, 0, 0, ALTURA_TELA);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#1e293b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, LARGURA_TELA, ALTURA_TELA);
    desenharAsset(ctx, 'bg_sky.png', 20, 20, 100, 30);
  }

  // --------------------------------------------------------------------------
  // CAMADA 2 DE PARALLAX: bg_city.png a 40% da velocidade da câmera
  // --------------------------------------------------------------------------
  const cityAsset = assets['bg_city.png'];
  const velCity = 0.4;
  const cityLargura = cityAsset.carregado && cityAsset.img.naturalWidth > 0 ? cityAsset.img.naturalWidth : 800;
  const cityAltura = cityAsset.carregado && cityAsset.img.naturalHeight > 0 ? cityAsset.img.naturalHeight : 450;
  const deslocamentoCity = -(estado.camera.x * velCity) % cityLargura;

  if (cityAsset.carregado && !cityAsset.erro && cityAsset.img.naturalWidth > 0) {
    // Renderiza a cidade repetidamente para cobrir toda a tela horizontal
    let posX = deslocamentoCity;
    while (posX < LARGURA_TELA) {
      ctx.drawImage(
        cityAsset.img,
        posX,
        ALTURA_TELA - cityAltura,
        cityLargura,
        cityAltura
      );
      posX += cityLargura;
    }
  } else {
    // Fallback estilizado para a camada de cidade
    ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
    let posX = deslocamentoCity;
    while (posX < LARGURA_TELA) {
      ctx.fillRect(posX, ALTURA_TELA - 200, 160, 200);
      ctx.fillRect(posX + 180, ALTURA_TELA - 260, 140, 260);
      posX += 340;
    }
    desenharAsset(ctx, 'bg_city.png', 140, 20, 100, 30);
  }

  // --------------------------------------------------------------------------
  // CAMADA 3: MUNDO DO JOGO (100% da velocidade da câmera)
  // Transladado pelo deslocamento horizontal da câmera
  // --------------------------------------------------------------------------
  ctx.save();
  ctx.translate(-Math.floor(estado.camera.x), 0);

  // 1. RENDERIZAÇÃO DAS PLATAFORMAS E CHÃO
  // "O chão é montado repetindo tile_ground.png."
  const tileLargura = 48;
  const tileAltura = 48;

  for (const plat of estado.plataformas) {
    if (plat.tipo === 'chao') {
      // Repete tile_ground.png ao longo de toda a extensão do chão
      const numTilesX = Math.ceil(plat.largura / tileLargura);
      const numTilesY = Math.ceil(plat.altura / tileAltura);

      for (let tx = 0; tx < numTilesX; tx++) {
        for (let ty = 0; ty < numTilesY; ty++) {
          desenharAsset(
            ctx,
            'tile_ground.png',
            plat.x + tx * tileLargura,
            plat.y + ty * tileAltura,
            tileLargura,
            tileAltura
          );
        }
      }
    } else {
      // Plataforma elevada estilizada com repetição de tile_ground
      const numTiles = Math.ceil(plat.largura / tileLargura);
      for (let tx = 0; tx < numTiles; tx++) {
        const larguraDesenho = Math.min(tileLargura, plat.largura - tx * tileLargura);
        desenharAsset(
          ctx,
          'tile_ground.png',
          plat.x + tx * tileLargura,
          plat.y,
          larguraDesenho,
          plat.altura
        );
      }
      // Borda decorativa superior azul luminosa nas plataformas
      ctx.fillStyle = 'rgba(96, 165, 250, 0.4)';
      ctx.fillRect(plat.x, plat.y, plat.largura, 3);
    }
  }

  // 2. RENDERIZAÇÃO DOS MEDICAMENTOS (10 REMÉDIOS)
  for (const med of estado.medicamentos) {
    if (med.coletado) continue;

    const flutuacaoY = Math.sin(med.flutuacaoOffset) * 4;
    const medY = med.y + flutuacaoY;

    // Brilho / Halo suave ao redor do medicamento
    ctx.save();
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 12;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.beginPath();
    ctx.arc(
      med.x + med.largura / 2,
      medY + med.altura / 2,
      med.largura / 1.7,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.restore();

    desenharAsset(
      ctx,
      'remedy.png',
      med.x,
      medY,
      med.largura,
      med.altura
    );
  }

  // 3. RENDERIZAÇÃO DOS 3 INIMIGOS PATRULHEIROS
  for (const inimigo of estado.inimigos) {
    if (!inimigo.vivo) continue;

    ctx.save();
    // Inversão de direção do inimigo caso esteja patrulhando para a esquerda
    if (!inimigo.olhandoDireita) {
      ctx.translate(inimigo.x + inimigo.largura, inimigo.y);
      ctx.scale(-1, 1);
      desenharAsset(ctx, 'enemy.png', 0, 0, inimigo.largura, inimigo.altura);
    } else {
      desenharAsset(
        ctx,
        'enemy.png',
        inimigo.x,
        inimigo.y,
        inimigo.largura,
        inimigo.altura
      );
    }
    ctx.restore();

    // Marcador sutil de patrulha / sensor no topo do inimigo
    ctx.fillStyle = 'rgba(239, 68, 68, 0.8)';
    ctx.fillRect(inimigo.x + inimigo.largura / 2 - 4, inimigo.y - 6, 8, 3);
  }

  // 4. RENDERIZAÇÃO DA PERSONAGEM NINA
  const nina = estado.nina;
  const piscarHit =
    nina.tempoInvencivel > 0 && Math.floor(nina.tempoInvencivel / 4) % 2 === 0;

  if (!piscarHit) {
    ctx.save();
    // Centralização para permitir inverter horizontalmente conforme direção do olhar
    const ninaCentroX = nina.x + nina.largura / 2;
    ctx.translate(ninaCentroX, nina.y);

    if (!nina.olhandoDireita) {
      ctx.scale(-1, 1);
    }

    const ninaDesenhoX = -nina.largura / 2;
    const ninaDesenhoY = 0;

    // Seleção de sprite conforme estado atual
    if (nina.estado === 'hit') {
      desenharAsset(
        ctx,
        'nina_hit.png',
        ninaDesenhoX,
        ninaDesenhoY,
        nina.largura,
        nina.altura
      );
    } else if (nina.estado === 'attack') {
      desenharAsset(
        ctx,
        'nina_attack.png',
        ninaDesenhoX,
        ninaDesenhoY,
        nina.largura + 12,
        nina.altura
      );
      // Efeito de corte luminoso no ataque
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(nina.largura / 2, nina.altura / 2, 24, -Math.PI / 3, Math.PI / 3);
      ctx.stroke();
    } else if (nina.estado === 'jump') {
      desenharAsset(
        ctx,
        'nina_jump.png',
        ninaDesenhoX,
        ninaDesenhoY,
        nina.largura,
        nina.altura
      );
    } else if (nina.estado === 'walk') {
      // nina_walk.png tem 4 quadros lado a lado
      const assetWalk = assets['nina_walk.png'];
      if (assetWalk.carregado && !assetWalk.erro && assetWalk.img.naturalWidth > 0) {
        const frameW = assetWalk.img.naturalWidth / 4;
        const frameH = assetWalk.img.naturalHeight;
        const sX = nina.quadroAnimacao * frameW;
        ctx.drawImage(
          assetWalk.img,
          sX,
          0,
          frameW,
          frameH,
          ninaDesenhoX,
          ninaDesenhoY,
          nina.largura,
          nina.altura
        );
      } else {
        desenharAsset(
          ctx,
          'nina_walk.png',
          ninaDesenhoX,
          ninaDesenhoY,
          nina.largura,
          nina.altura
        );
      }
    } else {
      // Estado 'idle'
      desenharAsset(
        ctx,
        'nina_idle.png',
        ninaDesenhoX,
        ninaDesenhoY,
        nina.largura,
        nina.altura
      );
    }

    ctx.restore();
  }

  // 5. RENDERIZAÇÃO DOS EFEITOS DE BRILHO DOURADO (AO COLETAR MEDICAMENTO)
  for (const efeito of estado.efeitosColeta) {
    const progresso = efeito.frame / efeito.duracaoMax; // 0 a 1 em 0,3s
    const raio = 10 + progresso * 38; // Expande
    const alpha = Math.max(0, 1 - progresso); // Desaparece em 0,3s

    ctx.save();
    ctx.globalAlpha = alpha;

    // Brilho dourado radial expansivo
    const grad = ctx.createRadialGradient(
      efeito.x,
      efeito.y,
      0,
      efeito.x,
      efeito.y,
      raio
    );
    grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
    grad.addColorStop(0.25, 'rgba(254, 240, 138, 0.9)'); // Dourado luminoso
    grad.addColorStop(0.65, 'rgba(245, 158, 11, 0.65)'); // Âmbar dourado
    grad.addColorStop(1, 'rgba(217, 119, 6, 0)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(efeito.x, efeito.y, raio, 0, Math.PI * 2);
    ctx.fill();

    // Anel dourado em expansão
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5 * (1 - progresso);
    ctx.beginPath();
    ctx.arc(efeito.x, efeito.y, raio * 0.85, 0, Math.PI * 2);
    ctx.stroke();

    // Brilho em cruz cintilante
    const rLuz = raio * 1.25;
    ctx.strokeStyle = `rgba(254, 240, 138, ${alpha})`;
    ctx.lineWidth = 2 * (1 - progresso);
    ctx.beginPath();
    ctx.moveTo(efeito.x - rLuz, efeito.y);
    ctx.lineTo(efeito.x + rLuz, efeito.y);
    ctx.moveTo(efeito.x, efeito.y - rLuz);
    ctx.lineTo(efeito.x, efeito.y + rLuz);
    ctx.stroke();

    ctx.restore();
  }

  // 6. RENDERIZAÇÃO DAS PARTÍCULAS NO MUNDO
  for (const p of estado.particulas) {
    const alpha = p.vida / p.vidaMax;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.fillStyle = p.cor;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.tamanho, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore(); // Fim da translação da Câmera (mundo)

  // --------------------------------------------------------------------------
  // INTERFACE / TELAS E HUD (FIXO NA TELA)
  // Paleta: Azul, off-white. Fonte sem serifa, texto branco com contorno escuro.
  // --------------------------------------------------------------------------
  if (estado.status === 'inicio') {
    renderizarTelaInicial(ctx);
  } else {
    renderizarHUD(ctx, estado);

    if (estado.status === 'derrota') {
      renderizarTelaDerrota(ctx);
    } else if (estado.status === 'vitoria') {
      renderizarTelaVitoria(ctx);
    }
  }

  ctx.restore();
}

// Desenha texto com contorno escuro legível em qualquer fundo
function desenharTextoComContorno(
  ctx: CanvasRenderingContext2D,
  texto: string,
  x: number,
  y: number,
  tamanho: number = 20,
  alinhamento: CanvasTextAlign = 'left'
) {
  ctx.save();
  ctx.font = `bold ${tamanho}px sans-serif`;
  ctx.textAlign = alinhamento;
  ctx.textBaseline = 'middle';

  // Contorno escuro sólido
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#0f172a';
  ctx.lineJoin = 'round';
  ctx.strokeText(texto, x, y);

  // Preenchimento branco / off-white
  ctx.fillStyle = '#f8fafc';
  ctx.fillText(texto, x, y);
  ctx.restore();
}

// Tela inicial do jogo com a mesma paleta do HUD
function renderizarTelaInicial(ctx: CanvasRenderingContext2D) {
  ctx.save();
  // Fundo escuro translúcido para destacar o menu inicial
  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
  ctx.fillRect(0, 0, LARGURA_TELA, ALTURA_TELA);

  // Painel central com a mesma paleta do HUD (Azul e off-white)
  const cardW = 640;
  const cardH = 340;
  const cardX = (LARGURA_TELA - cardW) / 2;
  const cardY = (ALTURA_TELA - cardH) / 2;

  ctx.fillStyle = 'rgba(15, 23, 42, 0.94)';
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 20);
  ctx.fill();
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.85)';
  ctx.lineWidth = 3;
  ctx.stroke();

  // Ícone decorativo de medicamento central
  desenharAsset(ctx, 'remedy.png', LARGURA_TELA / 2 - 24, cardY + 30, 48, 48);

  // Título exatamente como solicitado: "Dra. Nina e A Busca Pelo Medicamento"
  desenharTextoComContorno(
    ctx,
    'Dra. Nina e A Busca Pelo Medicamento',
    LARGURA_TELA / 2,
    cardY + 115,
    28,
    'center'
  );

  // Subtítulo exatamente como solicitado: "setas para mover · espaço para pular · E para atacar"
  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#93c5fd';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(
    'setas para mover · espaço para pular · E para atacar',
    LARGURA_TELA / 2,
    cardY + 165
  );

  // Botão com a instrução na paleta do HUD: "pressione ENTER para começar"
  const btnW = 360;
  const btnH = 54;
  const btnX = (LARGURA_TELA - btnW) / 2;
  const btnY = cardY + 225;

  ctx.fillStyle = '#2563eb';
  ctx.beginPath();
  ctx.roundRect(btnX, btnY, btnW, btnH, 12);
  ctx.fill();
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Instrução exatamente como solicitada: "pressione ENTER para começar"
  desenharTextoComContorno(
    ctx,
    'pressione ENTER para começar',
    LARGURA_TELA / 2,
    btnY + btnH / 2,
    18,
    'center'
  );

  ctx.restore();
}

// Renderização do HUD no topo esquerdo
function renderizarHUD(ctx: CanvasRenderingContext2D, estado: EstadoJogo) {
  ctx.save();

  // Caixa de fundo translúcida com paleta Azul (#1e3a8a) e borda off-white (#f8fafc)
  ctx.fillStyle = 'rgba(15, 23, 42, 0.78)';
  ctx.beginPath();
  ctx.roundRect(16, 16, 280, 76, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(59, 130, 246, 0.6)';
  ctx.lineWidth = 2;
  ctx.stroke();

  // 1. Vidas (3 ícones) no HUD
  for (let i = 0; i < 3; i++) {
    const coracaoX = 36 + i * 32;
    const coracaoY = 40;
    const ativo = i < estado.nina.vidas;

    ctx.save();
    if (ativo) {
      // Coração / Vida ativa em vermelho vivo com brilho
      ctx.fillStyle = '#ef4444';
      ctx.shadowColor = '#f87171';
      ctx.shadowBlur = 6;
    } else {
      // Vida perdida em tom apagado
      ctx.fillStyle = 'rgba(100, 116, 139, 0.5)';
      ctx.shadowBlur = 0;
    }

    // Desenha o formato do coração vetorial
    ctx.beginPath();
    const cx = coracaoX;
    const cy = coracaoY;
    ctx.moveTo(cx, cy + 4);
    ctx.bezierCurveTo(cx - 8, cy - 8, cx - 14, cy + 3, cx, cy + 14);
    ctx.bezierCurveTo(cx + 14, cy + 3, cx + 8, cy - 8, cx, cy + 4);
    ctx.fill();
    ctx.strokeStyle = '#0f172a';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  // 2. Contador "Medicamentos: X/10"
  desenharTextoComContorno(
    ctx,
    `Medicamentos: ${estado.nina.medicamentosColetados}/${TOTAL_MEDICAMENTOS}`,
    36,
    70,
    17,
    'left'
  );

  // Mini ícone de frasco ao lado do contador
  desenharAsset(ctx, 'remedy.png', 242, 57, 22, 22);

  ctx.restore();
}

// Tela de "Fim de jogo" com opção de reiniciar
function renderizarTelaDerrota(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.fillRect(0, 0, LARGURA_TELA, ALTURA_TELA);

  // Moldura central estilizada
  const cardW = 460;
  const cardH = 280;
  const cardX = (LARGURA_TELA - cardW) / 2;
  const cardY = (ALTURA_TELA - cardH) / 2;

  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 16);
  ctx.fill();
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 3;
  ctx.stroke();

  desenharTextoComContorno(ctx, 'FIM DE JOGO', LARGURA_TELA / 2, cardY + 60, 36, 'center');

  ctx.font = '16px sans-serif';
  ctx.fillStyle = '#cbd5e1';
  ctx.textAlign = 'center';
  ctx.fillText(
    'Nina perdeu todas as vidas para os inimigos.',
    LARGURA_TELA / 2,
    cardY + 110
  );
  ctx.fillText(
    'Pressione REINICIAR ou a barra de Espaço para tentar novamente!',
    LARGURA_TELA / 2,
    cardY + 138
  );

  // Botão estilizado na paleta Azul e Off-white
  const btnW = 220;
  const btnH = 48;
  const btnX = (LARGURA_TELA - btnW) / 2;
  const btnY = cardY + 185;

  ctx.fillStyle = '#2563eb';
  ctx.beginPath();
  ctx.roundRect(btnX, btnY, btnW, btnH, 10);
  ctx.fill();
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 2;
  ctx.stroke();

  desenharTextoComContorno(ctx, 'REINICIAR JOGO', LARGURA_TELA / 2, btnY + btnH / 2, 18, 'center');

  ctx.restore();
}

// Tela de Vitória quando todos os 10 medicamentos forem coletados
function renderizarTelaVitoria(ctx: CanvasRenderingContext2D) {
  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
  ctx.fillRect(0, 0, LARGURA_TELA, ALTURA_TELA);

  const cardW = 500;
  const cardH = 300;
  const cardX = (LARGURA_TELA - cardW) / 2;
  const cardY = (ALTURA_TELA - cardH) / 2;

  ctx.fillStyle = '#1e293b';
  ctx.beginPath();
  ctx.roundRect(cardX, cardY, cardW, cardH, 16);
  ctx.fill();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.stroke();

  desenharTextoComContorno(ctx, 'FASE CONCLUÍDA!', LARGURA_TELA / 2, cardY + 55, 36, 'center');

  desenharAsset(ctx, 'remedy.png', LARGURA_TELA / 2 - 24, cardY + 95, 48, 48);

  ctx.font = 'bold 18px sans-serif';
  ctx.fillStyle = '#f8fafc';
  ctx.textAlign = 'center';
  ctx.fillText(
    'Parabéns! Você coletou todos os 10 medicamentos!',
    LARGURA_TELA / 2,
    cardY + 170
  );

  ctx.font = '15px sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText(
    'A cidade agora está segura graças à Nina.',
    LARGURA_TELA / 2,
    cardY + 196
  );

  // Botão Jogar Novamente
  const btnW = 240;
  const btnH = 48;
  const btnX = (LARGURA_TELA - btnW) / 2;
  const btnY = cardY + 225;

  ctx.fillStyle = '#2563eb';
  ctx.beginPath();
  ctx.roundRect(btnX, btnY, btnW, btnH, 10);
  ctx.fill();
  ctx.strokeStyle = '#f8fafc';
  ctx.lineWidth = 2;
  ctx.stroke();

  desenharTextoComContorno(ctx, 'JOGAR NOVAMENTE', LARGURA_TELA / 2, btnY + btnH / 2, 18, 'center');

  ctx.restore();
}
