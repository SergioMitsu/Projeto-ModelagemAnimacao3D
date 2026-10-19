/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  Shield,
  HelpCircle,
  Maximize2,
  Minimize2,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Zap,
} from 'lucide-react';
import { audio } from './audio';
import {
  atualizarRegras,
  criarEstadoInicial,
  GerenciadorEntradas,
  LARGURA_TELA,
  ALTURA_TELA,
  renderizarJogo,
} from './game';
import { EstadoJogo } from './types';

// ============================================================================
// COMPONENTE PRINCIPAL DA APLICAÇÃO: AS AVENTURAS DE NINA
// Interface estilizada em Azul e Off-White, controles responsivos e HUD
// ============================================================================

export default function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Instâncias persistentes do estado do jogo e gerenciador de entradas
  const estadoRef = useRef<EstadoJogo>(criarEstadoInicial());
  const entradasRef = useRef<GerenciadorEntradas>(new GerenciadorEntradas());

  // Estados React para sincronização da interface externa e configurações
  const [estaMudo, setEstaMudo] = useState<boolean>(false);
  const [mostrarAjuda, setMostrarAjuda] = useState<boolean>(false);
  const [telaCheia, setTelaCheia] = useState<boolean>(false);
  const [vidasHUD, setVidasHUD] = useState<number>(3);
  const [remediosHUD, setRemediosHUD] = useState<number>(0);
  const [statusHUD, setStatusHUD] = useState<'inicio' | 'jogando' | 'vitoria' | 'derrota'>('inicio');

  // Reinicia o jogo para o estado inicial
  const reiniciarJogo = useCallback(() => {
    estadoRef.current = criarEstadoInicial();
    // Ao reiniciar via botão, inicia diretamente o jogo
    estadoRef.current.status = 'jogando';
    setStatusHUD('jogando');
    setVidasHUD(3);
    setRemediosHUD(0);
  }, []);

  // Alterna o áudio do jogo
  const alternarAudio = useCallback(() => {
    const novoMudo = audio.alternarMudo();
    setEstaMudo(novoMudo);
  }, []);

  // Alterna modo de tela cheia
  const alternarTelaCheia = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
      setTelaCheia(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setTelaCheia(false);
    }
  }, []);

  // ==========================================================================
  // GAME LOOP COM requestAnimationFrame
  // ==========================================================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let idAnimacao: number;

    const loop = () => {
      const estado = estadoRef.current;
      const entradas = entradasRef.current;

      // 1. Atualiza a física e regras do jogo
      atualizarRegras(estado, entradas);

      // 2. Renderiza o cenário com parallax, sprites, tiles e HUD
      renderizarJogo(ctx, estado, canvas.width, canvas.height);

      // 3. Atualiza os estados do React periodicamente para a interface
      if (
        estado.nina.vidas !== vidasHUD ||
        estado.nina.medicamentosColetados !== remediosHUD ||
        estado.status !== statusHUD
      ) {
        setVidasHUD(estado.nina.vidas);
        setRemediosHUD(estado.nina.medicamentosColetados);
        setStatusHUD(estado.status);
      }

      // Próximo quadro da animação
      idAnimacao = requestAnimationFrame(loop);
    };

    idAnimacao = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(idAnimacao);
    };
  }, [vidasHUD, remediosHUD, statusHUD]);

  // Captura cliques no Canvas para interagir com os botões desenhados
  const tratarCliqueCanvas = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * LARGURA_TELA;
    const clickY = ((e.clientY - rect.top) / rect.height) * ALTURA_TELA;

    const estado = estadoRef.current;

    // Se estiver na tela inicial, clique inicia o jogo
    if (estado.status === 'inicio') {
      estado.status = 'jogando';
      setStatusHUD('jogando');
      return;
    }

    // Se estiver na tela de Fim de Jogo ou Vitória, verifica clique no botão central
    if (estado.status === 'derrota') {
      const btnW = 220;
      const btnH = 48;
      const btnX = (LARGURA_TELA - btnW) / 2;
      const btnY = (ALTURA_TELA - 280) / 2 + 185;

      if (
        clickX >= btnX &&
        clickX <= btnX + btnW &&
        clickY >= btnY &&
        clickY <= btnY + btnH
      ) {
        reiniciarJogo();
      }
    } else if (estado.status === 'vitoria') {
      const btnW = 240;
      const btnH = 48;
      const btnX = (LARGURA_TELA - btnW) / 2;
      const btnY = (ALTURA_TELA - 300) / 2 + 225;

      if (
        clickX >= btnX &&
        clickX <= btnX + btnW &&
        clickY >= btnY &&
        clickY <= btnY + btnH
      ) {
        reiniciarJogo();
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col items-center justify-between min-h-screen bg-slate-950 text-slate-100 font-sans select-none overflow-x-hidden"
    >
      {/* ==================================================================== */}
      {/* CABEÇALHO / BARRA SUPERIOR (Paleta Azul e Off-White) */}
      {/* ==================================================================== */}
      <header className="w-full max-w-6xl px-4 py-3 flex items-center justify-between border-b border-blue-900/50 bg-slate-900/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30 text-white font-black text-xl">
            N
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-100 flex items-center gap-2">
              Dra. Nina e A Busca Pelo Medicamento
              <span className="text-xs px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                Plataforma 2D
              </span>
            </h1>
            <p className="text-xs text-blue-300/80 hidden sm:block">
              setas para mover · espaço para pular · E para atacar
            </p>
          </div>
        </div>

        {/* Botões de Ação Superior */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMostrarAjuda(!mostrarAjuda)}
            title="Como Jogar"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-200 transition border border-slate-700 hover:border-blue-500"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={alternarAudio}
            title={estaMudo ? 'Ativar Som' : 'Silenciar'}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-200 transition border border-slate-700 hover:border-blue-500"
          >
            {estaMudo ? (
              <VolumeX className="w-4 h-4 text-red-400" />
            ) : (
              <Volume2 className="w-4 h-4 text-emerald-400" />
            )}
          </button>

          <button
            onClick={reiniciarJogo}
            title="Reiniciar Jogo"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reiniciar</span>
          </button>

          <button
            onClick={alternarTelaCheia}
            title="Tela Cheia"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-200 transition border border-slate-700 hidden md:block"
          >
            {telaCheia ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* ==================================================================== */}
      {/* ÁREA CENTRAL DO JOGO (CANVAS 16:9 RESPONSIVO) */}
      {/* ==================================================================== */}
      <main className="flex-1 w-full flex flex-col items-center justify-center p-2 sm:p-4">
        <div className="relative w-full max-w-5xl rounded-xl overflow-hidden shadow-2xl border-2 border-blue-900/60 bg-black aspect-video flex items-center justify-center">
          <canvas
            ref={canvasRef}
            width={LARGURA_TELA}
            height={ALTURA_TELA}
            onClick={tratarCliqueCanvas}
            className="w-full h-full object-contain cursor-crosshair block"
          />

          {/* Banner de status rápido caso o jogo tenha terminado */}
          {statusHUD === 'derrota' && (
            <div className="absolute top-4 right-4 bg-red-950/90 text-red-200 border border-red-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg animate-pulse">
              <Shield className="w-4 h-4 text-red-400" />
              Fim de Jogo! Clique para Reiniciar
            </div>
          )}

          {statusHUD === 'vitoria' && (
            <div className="absolute top-4 right-4 bg-blue-950/90 text-blue-200 border border-blue-500 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-lg animate-bounce">
              <Sparkles className="w-4 h-4 text-amber-300" />
              Missão Concluída! 10/10 Remédios
            </div>
          )}
        </div>

        {/* ================================================================== */}
        {/* CONTROLES VIRTUAIS NA TELA (TOUCH / MOBILE / CLIQUE) */}
        {/* ================================================================== */}
        <div className="w-full max-w-5xl mt-3 flex items-center justify-between gap-3 px-2">
          {/* D-Pad Esquerda e Direita */}
          <div className="flex items-center gap-2">
            <button
              onMouseDown={() => entradasRef.current.definirEsquerda(true)}
              onMouseUp={() => entradasRef.current.definirEsquerda(false)}
              onMouseLeave={() => entradasRef.current.definirEsquerda(false)}
              onTouchStart={(e) => {
                e.preventDefault();
                entradasRef.current.definirEsquerda(true);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                entradasRef.current.definirEsquerda(false);
              }}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-blue-600 border border-slate-700 active:border-blue-400 text-white flex items-center justify-center shadow-lg transition select-none active:scale-95"
              title="Mover para a Esquerda (Seta Esquerda ou A)"
            >
              <ArrowLeft className="w-7 h-7" />
            </button>

            <button
              onMouseDown={() => entradasRef.current.definirDireita(true)}
              onMouseUp={() => entradasRef.current.definirDireita(false)}
              onMouseLeave={() => entradasRef.current.definirDireita(false)}
              onTouchStart={(e) => {
                e.preventDefault();
                entradasRef.current.definirDireita(true);
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                entradasRef.current.definirDireita(false);
              }}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-blue-600 border border-slate-700 active:border-blue-400 text-white flex items-center justify-center shadow-lg transition select-none active:scale-95"
              title="Mover para a Direita (Seta Direita ou D)"
            >
              <ArrowRight className="w-7 h-7" />
            </button>
          </div>

          {/* Dicas centrais de atalhos */}
          <div className="hidden lg:flex items-center gap-4 bg-slate-900/90 border border-slate-800 px-4 py-2 rounded-xl text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-blue-400 font-bold">
                ◄ ►
              </span>
              <span>Mover</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-blue-400 font-bold">
                ESPAÇO
              </span>
              <span>Pular</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-blue-400 font-bold">
                E
              </span>
              <span>Atacar</span>
            </div>
          </div>

          {/* Botões de Ação: Pulo e Ataque */}
          <div className="flex items-center gap-2">
            <button
              onMouseDown={() => entradasRef.current.acionarAtaque()}
              onMouseUp={() => entradasRef.current.soltarAtaque()}
              onMouseLeave={() => entradasRef.current.soltarAtaque()}
              onTouchStart={(e) => {
                e.preventDefault();
                entradasRef.current.acionarAtaque();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                entradasRef.current.soltarAtaque();
              }}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-amber-600 hover:bg-amber-500 active:bg-amber-400 border border-amber-500/80 text-white flex flex-col items-center justify-center shadow-lg transition select-none active:scale-95"
              title="Atacar com a tecla E"
            >
              <Zap className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Atacar [E]</span>
            </button>

            <button
              onMouseDown={() => entradasRef.current.acionarPulo()}
              onMouseUp={() => entradasRef.current.soltarPulo()}
              onMouseLeave={() => entradasRef.current.soltarPulo()}
              onTouchStart={(e) => {
                e.preventDefault();
                entradasRef.current.acionarPulo();
              }}
              onTouchEnd={(e) => {
                e.preventDefault();
                entradasRef.current.soltarPulo();
              }}
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-400 border border-blue-400 text-white flex flex-col items-center justify-center shadow-lg transition select-none active:scale-95"
              title="Pular com a Barra de Espaço"
            >
              <ArrowUp className="w-5 h-5 mb-0.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">Pular</span>
            </button>
          </div>
        </div>
      </main>

      {/* ==================================================================== */}
      {/* MODAL / PAINEL DE AJUDA E REGRAS */}
      {/* ==================================================================== */}
      {mostrarAjuda && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setMostrarAjuda(false)}
        >
          <div
            className="bg-slate-900 border-2 border-blue-600 rounded-2xl max-w-md w-full p-6 shadow-2xl text-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                Como Jogar
              </h2>
              <button
                onClick={() => setMostrarAjuda(false)}
                className="text-slate-400 hover:text-white text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded bg-blue-950 text-blue-400 font-bold flex items-center justify-center border border-blue-800 shrink-0">
                  1
                </span>
                <p>
                  <strong className="text-white">Movimentação:</strong> Use as{' '}
                  <span className="text-blue-300 font-semibold">Setas Esquerda/Direita</span> ou as
                  teclas <span className="text-blue-300 font-semibold">A / D</span> para mover a
                  Nina.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded bg-blue-950 text-blue-400 font-bold flex items-center justify-center border border-blue-800 shrink-0">
                  2
                </span>
                <p>
                  <strong className="text-white">Pulo:</strong> Pressione a{' '}
                  <span className="text-blue-300 font-semibold">Barra de Espaço</span> para saltar
                  entre plataformas elevadas e desviar de obstáculos.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded bg-blue-950 text-blue-400 font-bold flex items-center justify-center border border-blue-800 shrink-0">
                  3
                </span>
                <p>
                  <strong className="text-white">Ataque:</strong> Pressione a tecla{' '}
                  <span className="text-amber-400 font-semibold">"E"</span> para desferir um golpe
                  e neutralizar os inimigos patrulheiros.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded bg-blue-950 text-blue-400 font-bold flex items-center justify-center border border-blue-800 shrink-0">
                  4
                </span>
                <p>
                  <strong className="text-white">Objetivo:</strong> Encontre e colete todos os{' '}
                  <span className="text-cyan-300 font-semibold">10 medicamentos</span> espalhados pelo
                  mapa para vencer a fase!
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-6 h-6 rounded bg-red-950 text-red-400 font-bold flex items-center justify-center border border-red-800 shrink-0">
                  5
                </span>
                <p>
                  <strong className="text-red-400">Inimigos:</strong> Tocar num patrulheiro sem
                  atacar custa 1 das suas 3 vidas e retorna ao início. Zerando as vidas, é Fim de Jogo!
                </p>
              </div>
            </div>

            <button
              onClick={() => setMostrarAjuda(false)}
              className="mt-6 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-lg transition"
            >
              Entendido, Vamos Jogar!
            </button>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* RODAPÉ INFORMATIVO */}
      {/* ==================================================================== */}
      <footer className="w-full max-w-6xl px-4 py-2.5 text-center text-xs text-slate-500 border-t border-slate-900 flex flex-wrap items-center justify-between gap-2">
        <span>As Aventuras de Nina &copy; 2026 - Desenvolvido com Vite e React</span>
        <span className="text-blue-400/80">
          Câmera com Parallax em 3 Camadas: Céu (0%), Cidade (40%) e Chão (100%)
        </span>
      </footer>
    </div>
  );
}
