# Dra. Nina e A Busca Pelo Medicamento - Prompts

Este arquivo contém a documentação, a estrutura técnica e todos os **prompts de inteligência artificial** utilizados para a criação dos assets visuais do jogo de plataforma 2D, desenvolvido em HTML5 Canvas.

---

## 1. Model Sheet
```text
Create a character model sheet for a 2D platformer video game.

CHARACTER:
anthropomorphic calico cat scientist, white, warm brown, and orange-ginger fur patches, expressive green eyes, fine whiskers, wearing a classic white laboratory coat with deep front pockets, right hand/paw tucked inside the lab coat pocket, striped cat tail visible, body proportion 1:4 stylized, palette of white, sand beige, warm brown, turquoise accents, and black outline, intelligent, confident, and professional expression.

LAYOUT:
Four full-body views in a single horizontal row, evenly spaced:
front view, left side view, back view, three-quarter view.
Identical height, identical proportion and identical scale across all
four views. Neutral standing pose, one paw in the lab coat pocket.

STYLE:
2D hand-painted game art, bold clean black outlines, flat cel shading,
limited color palette, readable silhouette.

TECHNICAL:
Plain light grey background, even soft frontal lighting, no cast
shadows, no text, no labels, no arrows, no watermark, no logo.
High detail on the cat face, eyes, and the white lab coat texture.
```

---

## 2. Facial Expression Sheet
```text
Using EXACTLY this character, without changing any design detail,
generate a facial expression sheet.

LAYOUT: six head-and-shoulders portraits in a 3x2 grid.
EXPRESSIONS: neutral, determined, angry, surprised, exhausted, relieved.

Keep the exact same face shape, skin tone, head shape, hood and
palette as the reference image.

TECHNICAL: plain light grey background, same art style, same line
weight, no text, no labels under the faces, no watermark.
```

---

## 3. Walk Cycle Sprite Sheet
```text
Using EXACTLY this character, without changing any design detail,
generate a walk cycle sprite sheet.

LAYOUT: four full-body frames in a single horizontal row, side view
(facing right), evenly spaced, same height and same scale in all
frames, feet aligned on the same ground line.

FRAMES: 1) contact pose, 2) down pose, 3) passing pose, 4) up pose.

TECHNICAL: fully transparent background (PNG alpha), flat even
lighting, NO cast shadow on the ground, no text, no frame numbers,
no grid lines, no watermark.
```

---

## 4. Action Poses
```text
Using EXACTLY this character, without changing any design detail,
generate four separate action poses in a single horizontal row,
side view facing right:

1) IDLE — standing, weight on one leg, cloak slightly moving
2) JUMP — mid-air, knees bent, cloak trailing upward
3) ATTACK — right arm extended forward, body twisted
4) HIT — recoiling backwards, off balance

Same height, same scale, same art style in all four.

TECHNICAL: fully transparent background, no cast shadow, no motion
blur, no speed lines, no text, no watermark.
```

---

## 5. Camada de Fundo - Céu (`bg_sky.png`)
```text
Background sky layer for a 2D side-scrolling platformer game.

CONTENT: A city sky with a soft gradient; a blue hue near the horizon with stars. Nothing else—no clouds, no sun, no mountains, no ground, no characters.

TECHNICAL SPECIFICATIONS: 16:9 aspect ratio, horizontally seamless (the left edge must align perfectly with the right edge), no text, no watermarks.
```

---

## 6. Camada de Fundo Distante - Prédios (`bg_house.png`)
```text
Distant background layer for a 2D side-scrolling platformer game.

CONTENT: Silhouettes of houses and buildings; silhouettes only, rendered in a single, flat shade of black—slightly lighter near the horizon line. No sky, no ground, no interior details within the silhouettes, and no characters.

TECHNICAL SPECIFICATIONS: Fully transparent background above the silhouettes; horizontally seamless (tiled/loopable); 16:9 aspect ratio; the bottom half must be empty; no text, no watermarks.
```

---

## 7. Textura de Chão (`tile_ground.png`)
```text
Game texture, perfectly tileable: concrete ground (flat).

STYLE: stylized 2D art, minimalist panel consisting of a blue top bar and a 2x2 grid in dark gray with a carbon fiber texture.

TECHNICAL ASPECTS: perfectly tileable on all FOUR sides (the texture must repeat without visible seams), square format (1:1 aspect ratio), completely flat and uniform lighting, NO directional shadows, no perspective, no vignetting, no text, and no watermarks.
```

---

## 8. Item Colecionável e Inimigo (`remedy.png` e `enemy.png`)
```text
Using the same art style, palette, and line thickness as the attached character sheet, create two distinct game elements, placed side by side:

1) COLLECTIBLE ITEM — a white bottle with a blue cap and a red cross centered on it.
2) ENEMY — a small, hostile red creature with expressive eyes, a yellow mouth, and small, dark feet.
```
