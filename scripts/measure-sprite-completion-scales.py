"""Measure fixed display scales for native completion atlases without changing PNGs.

Only JSON is written. Pillow reads alpha envelopes; the actual game sprite maps
and smooth-atlas overrides supply the old artwork. The output is a hash-bound
measurement input for build-sprite-completion-manifest.cjs --scales, never an
artwork approval list.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import subprocess

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]


def definitions() -> dict:
    source = r"""
const fs = require('node:fs');
const vm = require('node:vm');
const sandbox = { window: {}, console };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync('characters.v1.js', 'utf8'), sandbox);
const expansion = sandbox.window.INFERNAL_CITY_CHARACTERS;
const legions = require('./enemy-legions.v1.js');
sandbox.window.INFERNAL_CITY_ENEMY_LEGIONS = legions;
vm.runInContext(fs.readFileSync('sprite-completion.v1.js', 'utf8'), sandbox);
const game = fs.readFileSync('game.v9.js', 'utf8');
function table(name) {
  const match = game.match(new RegExp('const ' + name + ' = (\\{[\\s\\S]*?\\n\\});'));
  if (!match) throw new Error('Missing sprite table ' + name);
  return vm.runInNewContext('(' + match[1] + ')', { CHARACTER_EXPANSION: expansion });
}
const enemies = table('ENEMY_SPRITE_DATA');
Object.entries(legions.enemies).forEach(([id, definition]) => {
  enemies[id] = { src: definition.spriteSrc, row: 0, rows: 1, columns: 4 };
});
console.log(JSON.stringify({
  assets: sandbox.window.INFERNAL_CITY_SPRITE_COMPLETION.assets,
  heroes: table('HERO_SPRITE_DATA'), bosses: enemies, enemies,
  towers: table('TOWER_SPRITE_DATA'), overrides: table('SMOOTH_ATLAS_OVERRIDES')
}));
"""
    return json.loads(subprocess.check_output(['node', '-e', source], cwd=ROOT, text=True))


def envelope(relative: str, columns: int, rows: int, row: int, *, column: int = 0, square_destination: bool) -> dict:
    path = ROOT / relative
    with Image.open(path) as image:
        width, height = image.size
        alpha = image.getchannel('A')
        cell_width, cell_height = width / columns, height / rows
        # Integer inspection bounds only; canvas uses the native fractional grid.
        cell = alpha.crop((round(column * cell_width), round(row * cell_height),
                           round((column + 1) * cell_width), round((row + 1) * cell_height)))
        bbox = cell.point(lambda value: 255 if value >= 96 else 0).getbbox()
        if bbox is None:
            raise ValueError(f'No opaque reference silhouette: {relative}, row {row}')
        body_width, body_height = bbox[2] - bbox[0], bbox[3] - bbox[1]
        coverage = max(body_width / cell_width, body_height / cell_height) if square_destination else (
            max(body_width, body_height) / max(cell_width, cell_height))
        return {'src': relative, 'sha256': hashlib.sha256(path.read_bytes()).hexdigest(),
                'columns': columns, 'rows': rows, 'row': row, 'column': column,
                'cellWidth': cell_width, 'cellHeight': cell_height,
                'bboxAlpha96': list(bbox), 'coverage': round(coverage, 6)}


def measure(data: dict, key: str, spec: dict) -> dict:
    path = ROOT / spec['src']
    sha256 = hashlib.sha256(path.read_bytes()).hexdigest()
    if spec['group'] == 'evolutions':
        return {'key': key, 'sha256': sha256, 'drawScale': 1,
                'reason': 'New weapon VFX have no equivalent old body silhouette; retain authored runtime size.'}
    old = data[spec['group']][spec['id']]
    override = data['overrides'].get(old['src'])
    use_smooth = bool(override and (ROOT / override['src']).exists())
    old_src = override['src'] if use_smooth else old['src']
    old_columns = override['columns'] if use_smooth else old.get('columns', 4)
    old_rows = override['rows'] if use_smooth else old.get('rows', 4)
    # State-row bosses retain row 1 in drawEnemy even when standing still.
    old_row = 1 if spec['group'] == 'bosses' and old.get('layout') == 'state_rows' else old.get('row', 0)
    new_row = 5 if spec['group'] == 'bosses' else (
        1 if spec['group'] == 'heroes' and 'idle_respiration' in spec['states'] else 0)
    # Expansion heroines arrive kneeling; the final intro cell is their upright
    # neutral silhouette and avoids oversizing every subsequent standing pose.
    new_column = 7 if spec['group'] == 'heroes' and 'idle_respiration' not in spec['states'] else 0
    before = envelope(old_src, old_columns, old_rows, old_row, square_destination=True)
    after = envelope(spec['src'], spec['columns'], spec['rows'], new_row,
                     column=new_column, square_destination=False)
    factor = round(before['coverage'] / after['coverage'], 4)
    if not .5 <= factor <= 2.5:
        raise ValueError(f'{key}: measured scale {factor} needs manual review (allowed .5–2.5).')
    return {'key': key, 'sha256': sha256, 'drawScale': factor,
            'old': before, 'new': after, 'oldUsesSmoothOverride': use_smooth,
            'referenceState': spec['states'][new_row]}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT / 'docs/art-generation/completion-v1/draw-scales.json')
    parser.add_argument('--groups', default='heroes,bosses,enemies,towers,evolutions')
    args = parser.parse_args()
    data = definitions()
    groups = set(args.groups.split(','))
    assets, skipped = [], []
    for key, spec in data['assets'].items():
        if spec.get('preparedOnly') or spec['group'] not in groups:
            continue
        if not (ROOT / spec['src']).exists():
            skipped.append(key)
            continue
        assets.append(measure(data, key, spec))
    report = {'schemaVersion': 1, 'method': 'Fixed ratio of maximum-axis alpha>=96 silhouette coverage in resting reference cells; no image bytes changed.',
              'limitations': 'Resting envelope includes visible attached equipment; expansion heroine intros use their upright last frame. Original edge fragments can influence coverage. This measurement never grants visual approval.',
              'assets': assets, 'missing': skipped,
              'preparedOnlyExcluded': [key for key, spec in data['assets'].items() if spec.get('preparedOnly')]}
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'measured': len(assets), 'missing': skipped,
                      'minimumScale': min(entry['drawScale'] for entry in assets),
                      'maximumScale': max(entry['drawScale'] for entry in assets)}, indent=2))


if __name__ == '__main__':
    main()
