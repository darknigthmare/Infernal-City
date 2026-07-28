# Prompts du bestiaire OpenAI

Mode : outil ImageGen intégré, une génération distincte par ennemi.

## Direction commune

```text
Use case: stylized-concept
Asset type: 2D game enemy sprite for a dark canvas roguelite
Style/medium: premium anime dark-fantasy techno-gothic game art, precise black
contour, painted cel shading, readable mechanical details, gunmetal blacks and
midnight-blue shadows.
Composition/framing: one full-body subject only, centered, orthographic
three-quarter top-down view, camera pitched about 65 degrees toward the ground,
canonical facing direction to the right, compact pose, readable at tiny sprite
size, square composition, about 18 percent clear padding around every appendage.
Lighting/mood: cyan key light from upper left, restrained magenta rim light.
Scene/backdrop: perfectly flat solid #00ff00 chroma-key background.
Constraints: no green on the subject; no environment, floor, horizon, shadow,
glow, text, UI, frame, watermark, projectile, isolated particles, motion blur
or cropped body parts.
```

## Sujets

- **Démon Swarmer** : petit démon quadrupède de meute, corps bas et agressif,
  carapace d’obsidienne, cornes vers l’avant, griffes compactes, fissures et
  yeux `#ff2a5f`, silhouette triangulaire, sans ailes.
- **Acid Runner** : hybride raptor-insecte très fin, corps en flèche, longues
  pattes repliées en course, plaques noires, réservoirs d’acide et veines
  `#00f0ff`, sans liquide vert ni traînée.
- **Cyber Behemoth** : cyber-démon gorille-sanglier colossal, épaules blindées,
  torse carré, poings mécaniques proches du corps, petite tête cornue, réacteur
  et fissures `#a855f7`.
- **Hellwarden** : gardienne infernale non humaine en armure techno-gothique
  lourde, casque fermé à grandes cornes, noyau de magma `#f97316`, couperet tenu
  près du torse.
- **Vespera** : adaptation fidèle de `assets/cg_vespera.jpg`, souveraine
  démoniaque adulte, cheveux noirs, cornes de bélier, armure gothique, ailes
  partiellement repliées et hache rapprochée du corps, pose martiale.
- **Carmilla** : adaptation fidèle de `assets/cg_carmilla.jpg`, souveraine
  vampire adulte, longs cheveux noirs, robe-armure bordeaux, cape compacte,
  rapière le long du corps et sceau sanguin près de la main.
- **Titan Léviathan** : adaptation fidèle de `assets/cg_leviathan.jpg`, immense
  dragon cybernétique gunmetal, tête cornue, épines, noyau `#ff2a5f`, ailes
  mécaniques repliées en croissant, sans rayon buccal.

Les sources chroma ont été détourées avec le script reproductible du dépôt :

```powershell
py scripts/remove_chroma_key.py source.png destination.png `
  --auto-key border --soft-matte --transparent-threshold 12 `
  --opaque-threshold 220 --despill
py scripts/optimize_enemy_sprites.py
```

Ces deux outils utilisent Pillow (`py -m pip install Pillow`). Le matte doux
conserve les contours peints tandis que le despill nettoie le débordement vert.
