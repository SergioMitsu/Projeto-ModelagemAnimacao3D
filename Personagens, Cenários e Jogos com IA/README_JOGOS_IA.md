# Dra. Nina e A Busca Pelo Medicamento

## Descrição do Jogo
Dra. Nina e A Busca Pelo Medicamento é um jogo de plataforma 2D em que a protagonista percorre um cenário urbano com parallax horizontal.
O objetivo é coletar todos os 10 medicamentos espalhados pelo mapa e neutralizar os inimigos patrulheiros utilizando a tecla de ataque.
Caso colida com um inimigo sem atacar, Nina perde 1 de suas 3 vidas e retorna ao ponto inicial, encerrando a partida se as vidas se esgotarem.

https://ai.studio/apps/8014c5d5-70ec-44a7-b52d-0e058b92cbf6
---

## Como Executar

### Pré-requisitos
- **Node.js** (versão 18 ou superior)
- Gerenciador de pacotes **npm**

### Passo a Passo
1. Instale as dependências do projeto:
   ```bash
   npm install
   ```
2. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```
3. Abra o navegador no endereço exibido no terminal (por padrão: `http://localhost:3000`).

---

## Assets Necessários

Todos os arquivos de imagem devem estar localizados no diretório `/public/assets` com os nomes exatos listados abaixo. Caso algum arquivo não exista ou falhe ao carregar, o motor gráfico desenha automaticamente um retângulo colorido com o nome do arquivo como mecanismo de fallback.

| Nome do Arquivo | Descrição | Dimensões Recomendadas |
| :--- | :--- | :--- |
| `nina_idle.png` | Sprite da personagem parada | 32 x 40 px ou 36 x 48 px |
| `nina_walk.png` | Sprite sheet da caminhada com 4 quadros dispostos lado a lado | 104 x 30 px ou 144 x 48 px (cada quadro ocupa 1/4 da largura) |
| `nina_jump.png` | Sprite da personagem no ar durante o salto | 32 x 40 px ou 36 x 48 px |
| `nina_hit.png` | Sprite de dano quando Nina é atingida | 32 x 40 px ou 36 x 48 px |
| `nina_attack.png` | Sprite do golpe/ataque de Nina | 36 x 40 px ou 48 x 48 px |
| `enemy.png` | Sprite do inimigo patrulheiro | 32 x 32 px ou 38 x 38 px |
| `remedy.png` | Sprite do frasco de medicamento coletável | 28 x 28 px ou 30 x 30 px |
| `bg_sky.png` | Camada de fundo do céu (Parallax a 0% de velocidade) | 800 x 450 px ou 960 x 540 px |
| `bg_city.png` | Camada intermediária da cidade (Parallax a 40% de velocidade) | 800 x 450 px (repetível horizontalmente) |
| `tile_ground.png` | Bloco de chão e plataforma repetido em grade | 48 x 48 px |

---

## Estrutura do Código

O código do jogo foi estruturado no arquivo `src/game.ts` em 4 blocos essenciais claramente separados e comentados em português, além dos tipos em `src/types.ts` e áudio em `src/audio.ts`:

### 1. ESTADO (`// 1. ESTADO`)
- Define e inicializa os dados de todos os elementos do jogo:
  - **Personagem Nina**: posição (`x`, `y`), velocidades (`vx`, `vy`), dimensões, orientações, vidas (3), estado visual atual (`idle`, `walk`, `jump`, `attack`, `hit`), tempo de ataque e invencibilidade pós-dano.
  - **Inimigos**: lista de 3 patrulheiros com coordenadas, limites de patrulha (`limiteEsquerdo`, `limiteDireito`), velocidade, status de vida e contador de pausa de 0,5s nas extremidades.
  - **Plataformas**: mapeamento do chão contínuo (largura de 3600px) e plataformas suspensas.
  - **Medicamentos**: posicionamento dos 10 frascos coletáveis ao longo do cenário.
  - **Câmera, Partículas e Efeitos**: controle de rolagem horizontal centrada na personagem, sistema de partículas e animações temporizadas de brilho dourado (0,3s).
  - **Status do Jogo**: controla se a sessão está em `inicio`, `jogando`, `derrota` ou `vitoria`.

### 2. ENTRADA (`// 2. ENTRADA`)
- Gerencia o teclado e os controles da interface através da classe `GerenciadorEntradas`:
  - **Movimentação**: Setas Esquerda/Direita ou teclas `A` e `D`.
  - **Pulo**: Barra de Espaço, tecla `W` ou Seta para Cima.
  - **Ataque**: Tecla `E`.
  - **Iniciar Jogo**: Tecla `Enter` (ou Espaço/clique) na tela inicial.
  - **Controles Touch / Virtuais**: Métodos auxiliares para interagir com botões na tela móvel (D-Pad, Pulo e Ataque).

### 3. REGRAS (`// 3. REGRAS`)
- Processa a física e a lógica do jogo a cada quadro:
  - **Gravidade e Salto**: gravidade constante aplicada verticalmente e colisão precisa quando os pés da personagem cruzam o topo das plataformas.
  - **Mecânica de Ataque**: ativação da caixa de colisão do golpe para neutralizar inimigos ao alcance.
  - **Patrulha dos Inimigos**: deslocamento com velocidade reduzida e execução de pausa obrigatória de 0,5 segundo (30 quadros) ao atingir as pontas das plataformas antes de inverter o sentido.
  - **Colisão e Dano**: encostar em um inimigo sem atacar consome 1 vida, aciona tremor de tela, som de dano e reposiciona Nina no ponto inicial. Zerando as 3 vidas, o jogo muda para o estado de `derrota`.
  - **Coleta de Medicamentos**: encostar em um frasco incrementa o contador, toca efeito sonoro e dispara um efeito visual de brilho dourado expansivo que desaparece em 0,3s. Ao atingir 10/10, o estado muda para `vitoria`.

### 4. RENDER (`// 4. RENDER`)
- Desenha o jogo no elemento `<canvas>` via `requestAnimationFrame`:
  - **Parallax em 3 Camadas**: camada 1 (`bg_sky.png` a 0% de velocidade), camada 2 (`bg_city.png` a 40% de velocidade da câmera em repetição horizontal) e camada 3 (mundo do jogo a 100%, transladado pelo deslocamento da câmera).
  - **Cenário e Entidades**: repetição modular de `tile_ground.png` no piso e plataformas, desenho de medicamentos flutuantes, inimigos e animações da Nina (incluindo o fatiamento dos 4 quadros de `nina_walk.png` e inversão horizontal).
  - **Efeitos Visuais**: desenho do brilho dourado radial expansivo e partículas de faíscas/poeira.
  - **Telas e HUD**: exibição da tela inicial (*"Dra. Nina e A Busca Pelo Medicamento"*), do HUD no topo esquerdo com as 3 vidas e contador `"Medicamentos: X/10"` (em paleta azul e off-white com texto sem serifa e contorno escuro), bem como das telas de *"Fim de Jogo"* e *"Fase Concluída"*.

---

## Declaração de Uso de IA

O desenvolvimento deste jogo utilizou assistência de Inteligência Artificial nas seguintes etapas:

- **Google AI Studio / Modelo Gemini**:
  - Geração e estruturação do código-fonte em TypeScript e React.
  - Separação modular da arquitetura do jogo estritamente nos 4 blocos requisitados (`ESTADO`, `ENTRADA`, `REGRAS`, `RENDER`).
  - Implementação das fórmulas de física (cálculo de gravidade, pulo, colisão com o topo de plataformas e interpolação de câmera parallax).
  - Ajuste e calibragem dos requisitos (redução de velocidade dos patrulheiros pela metade, pausa de 0,5s nas pontas das plataformas, efeito de brilho dourado de 0,3s e tela inicial).
- **Scripts de Síntese de Assets (Node.js + zlib)**:
  - Geração procedural dos spritesheets e texturas iniciais em formato PNG transparente (`public/assets/`).
- **Web Audio API**:
  - Geração procedural das frequências e osciladores sonoros para os efeitos de pulo, ataque, coleta, dano e fanfarras de vitória/derrota.
