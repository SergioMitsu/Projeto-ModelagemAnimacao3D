📊 Relato de Custo e Otimização do Jogo

Etapa 1 — Conceito e Escopo
Quantidade de Gerações: 1 iteração principal de alinhamento textual.

O que faria diferente: Desenhar o layout aproximado das plataformas em um rascunho de papel quadriculado antes de passar para o código. Isso evitaria ajustes sucessivos nas coordenadas exatas das plataformas e na distribuição dos 10 medicamentos durante a prototipagem.

Etapa 2 — Personagem e Sprites (nina_idle, nina_walk, nina_jump, nina_hit, nina_attack)
Quantidade de Gerações: 1 iteração visual principal.

O que faria diferente: Consolidar todas as restrições estéticas em um único prompt inicial altamente detalhado.

Etapa 3 — Cenário e Camadas (bg_sky, bg_city, tile_ground)
Quantidade de Gerações: 2 iterações de teste para garantir o efeito de profundidade (parallax) e o tileamento horizontal do chão.

O que faria diferente: Estabelecer dimensões padrão de proporção (aspect ratio) alinhadas à resolução de 800x450 do canvas logo na primeira geração, evitando distorções ao esticar a imagem de fundo no navegador.

Etapa 4 — Implementação do Código e Mecânicas (Lógica em JavaScript/HTML5)
Quantidade de Gerações: 3 iterações de desenvolvimento de código:

Geração 1: Estrutura base de física, gravidade, colisão de plataformas, HUD e coleta de itens.

Geração 2: Refinamento de jogabilidade (redução da velocidade dos inimigos, inclusão de pausa de 0.5s nas pontas e adição do efeito visual de brilho dourado nos medicamentos).

Geração 3: Inclusão da tela inicial temática com instruções e ativação por tecla ENTER.

O que faria diferente: Modularizar a máquina de estados (Start, Playing, Game Over, Victory) e as rotinas de partículas desde a primeira arquitetura do código. Isso facilitaria a injeção do efeito visual e da tela de menu sem precisar reestruturar trechos da função de atualização (update()) posteriormente.
