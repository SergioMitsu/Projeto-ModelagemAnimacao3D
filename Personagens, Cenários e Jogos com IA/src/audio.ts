/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// ============================================================================
// SISTEMA DE ÁUDIO PROCEDURAL (WEB AUDIO API)
// Fornece efeitos sonoros nostálgicos e responsivos sem arquivos externos
// ============================================================================

class GerenciadorAudio {
  private ctx: AudioContext | null = null;
  private mudo: boolean = false;

  constructor() {
    // Inicialização sob demanda para respeitar políticas de reprodução do navegador
  }

  // Inicializa o contexto de áudio após interação do jogador
  private obterContexto(): AudioContext | null {
    if (this.mudo) return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  // Alterna o estado de mudo
  public alternarMudo(): boolean {
    this.mudo = !this.mudo;
    return this.mudo;
  }

  public estaMudo(): boolean {
    return this.mudo;
  }

  // Som de pulo: frequência ascendente (onda quadrada / senoidal)
  public tocarPulo(): void {
    const ctx = this.obterContexto();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const ganho = ctx.createGain();
    osc.type = 'square';

    const agora = ctx.currentTime;
    osc.frequency.setValueAtTime(160, agora);
    osc.frequency.exponentialRampToValueAtTime(420, agora + 0.15);

    ganho.gain.setValueAtTime(0.12, agora);
    ganho.gain.exponentialRampToValueAtTime(0.01, agora + 0.15);

    osc.connect(ganho);
    ganho.connect(ctx.destination);

    osc.start(agora);
    osc.stop(agora + 0.16);
  }

  // Som de ataque: corte de energia / chicote sonoro
  public tocarAtaque(): void {
    const ctx = this.obterContexto();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const ganho = ctx.createGain();
    osc.type = 'sawtooth';

    const agora = ctx.currentTime;
    osc.frequency.setValueAtTime(580, agora);
    osc.frequency.exponentialRampToValueAtTime(140, agora + 0.12);

    ganho.gain.setValueAtTime(0.15, agora);
    ganho.gain.exponentialRampToValueAtTime(0.01, agora + 0.12);

    osc.connect(ganho);
    ganho.connect(ctx.destination);

    osc.start(agora);
    osc.stop(agora + 0.13);
  }

  // Som de coleta de medicamento: arpejo agudo e cristalino
  public tocarColeta(): void {
    const ctx = this.obterContexto();
    if (!ctx) return;

    const notas = [523.25, 659.25, 783.99, 1046.5]; // Dó, Mi, Sol, Dó alto
    notas.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const ganho = ctx.createGain();
      osc.type = 'sine';

      const agora = ctx.currentTime + idx * 0.05;
      osc.frequency.setValueAtTime(freq, agora);

      ganho.gain.setValueAtTime(0.12, agora);
      ganho.gain.exponentialRampToValueAtTime(0.001, agora + 0.15);

      osc.connect(ganho);
      ganho.connect(ctx.destination);

      osc.start(agora);
      osc.stop(agora + 0.16);
    });
  }

  // Som de colisão com inimigo / dano
  public tocarDano(): void {
    const ctx = this.obterContexto();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const ganho = ctx.createGain();
    osc.type = 'sawtooth';

    const agora = ctx.currentTime;
    osc.frequency.setValueAtTime(220, agora);
    osc.frequency.exponentialRampToValueAtTime(70, agora + 0.25);

    ganho.gain.setValueAtTime(0.2, agora);
    ganho.gain.exponentialRampToValueAtTime(0.01, agora + 0.25);

    osc.connect(ganho);
    ganho.connect(ctx.destination);

    osc.start(agora);
    osc.stop(agora + 0.26);
  }

  // Som de inimigo derrotado
  public tocarInimigoDerrotado(): void {
    const ctx = this.obterContexto();
    if (!ctx) return;

    const osc = ctx.createOscillator();
    const ganho = ctx.createGain();
    osc.type = 'triangle';

    const agora = ctx.currentTime;
    osc.frequency.setValueAtTime(320, agora);
    osc.frequency.linearRampToValueAtTime(90, agora + 0.2);

    ganho.gain.setValueAtTime(0.18, agora);
    ganho.gain.exponentialRampToValueAtTime(0.01, agora + 0.2);

    osc.connect(ganho);
    ganho.connect(ctx.destination);

    osc.start(agora);
    osc.stop(agora + 0.21);
  }

  // Som de Game Over
  public tocarFimDeJogo(): void {
    const ctx = this.obterContexto();
    if (!ctx) return;

    const notas = [220, 196, 174.61, 146.83];
    notas.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const ganho = ctx.createGain();
      osc.type = 'sawtooth';

      const agora = ctx.currentTime + idx * 0.18;
      osc.frequency.setValueAtTime(freq, agora);

      ganho.gain.setValueAtTime(0.14, agora);
      ganho.gain.exponentialRampToValueAtTime(0.01, agora + 0.25);

      osc.connect(ganho);
      ganho.connect(ctx.destination);

      osc.start(agora);
      osc.stop(agora + 0.26);
    });
  }

  // Fanfarra de Vitória
  public tocarVitoria(): void {
    const ctx = this.obterContexto();
    if (!ctx) return;

    const notas = [523.25, 659.25, 783.99, 1046.5, 880, 1046.5];
    const duracoes = [0.12, 0.12, 0.12, 0.22, 0.15, 0.45];
    let tempoAcumulado = 0;

    notas.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const ganho = ctx.createGain();
      osc.type = 'triangle';

      const agora = ctx.currentTime + tempoAcumulado;
      const dur = duracoes[idx];
      tempoAcumulado += dur;

      osc.frequency.setValueAtTime(freq, agora);

      ganho.gain.setValueAtTime(0.15, agora);
      ganho.gain.exponentialRampToValueAtTime(0.01, agora + dur);

      osc.connect(ganho);
      ganho.connect(ctx.destination);

      osc.start(agora);
      osc.stop(agora + dur);
    });
  }
}

export const audio = new GerenciadorAudio();
