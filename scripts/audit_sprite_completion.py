"""Read-only checks for native generated combat sprites; never changes image bytes.

Usage: python scripts/audit_sprite_completion.py [--output path.json]
Pillow is only used to inspect RGBA pixels. Visual approval remains separate.
"""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PACK = ROOT / 'assets/animations/completion-v1'
HISTORICAL = {'aria', 'kira', 'rin', 'selene', 'vespera', 'carmilla'}


def inspect(path: Path) -> dict:
    category, identity = path.parent.name, path.stem
    cols = 4 if category in ('evolutions', 'environment', 'portraits') else 8
    rows = {'enemies': 4, 'bosses': 6, 'towers': 8, 'evolutions': 2,
            'environment': 2, 'portraits': 2, 'heroes': 8 if identity in HISTORICAL else 4}[category]
    raw = path.read_bytes()
    with Image.open(path) as image:
        image.load()
        alpha = image.getchannel('A') if 'A' in image.getbands() else None
        result = {'key': f'{category}/{identity}', 'path': str(path.relative_to(ROOT)),
                  'sha256': hashlib.sha256(raw).hexdigest(), 'bytes': len(raw),
                  'width': image.width, 'height': image.height, 'mode': image.mode,
                  'columns': cols, 'rows': rows, 'frameCount': cols * rows,
                  'cellAspectError': abs(image.width / cols / (image.height / rows) - 1),
                  'visualApproval': False}
        if alpha is None:
            result.update(issues=['missing-alpha-channel'], cells=[])
            return result
        hist = alpha.histogram()
        area = image.width * image.height
        result.update(alphaMin=alpha.getextrema()[0], alphaMax=alpha.getextrema()[1],
                      transparentFraction=round(hist[0] / area, 5),
                      nearTransparentFraction=round(sum(hist[:17]) / area, 5))
        issues, cells = [], []
        if hist[0] / area < .05:
            issues.append('little-real-transparency: inspect-background')
        if result['cellAspectError'] > .025:
            issues.append('non-square-cells: inspect-grid')
        for row in range(rows):
            for col in range(cols):
                box = (round(col * image.width / cols), round(row * image.height / rows),
                       round((col + 1) * image.width / cols), round((row + 1) * image.height / rows))
                cell = alpha.crop(box)
                hard = cell.point(lambda value: 255 if value >= 96 else 0)
                bbox = hard.getbbox()
                if bbox is None:
                    issues.append(f'empty-or-faint-cell:{row},{col}')
                cw, ch = cell.size
                edge = list(cell.crop((0, 0, cw, 1)).tobytes())
                edge += list(cell.crop((0, ch - 1, cw, ch)).tobytes())
                edge += list(cell.crop((0, 0, 1, ch)).tobytes())
                edge += list(cell.crop((cw - 1, 0, cw, ch)).tobytes())
                cells.append({'row': row, 'col': col, 'bboxAlpha96': bbox,
                              'edgeAlpha96Fraction': round(sum(v >= 96 for v in edge) / len(edge), 4),
                              'rgbaSha256': hashlib.sha256(image.crop(box).tobytes()).hexdigest()})
        result.update(issues=issues, cells=cells,
                      uniqueCellBytes=len({c['rgbaSha256'] for c in cells}),
                      edgeContactCells=sum(c['edgeAlpha96Fraction'] > .05 for c in cells))
        return result


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path)
    args = parser.parse_args()
    results = [inspect(p) for p in sorted(PACK.rglob('*.png'))]
    report = {'scope': 'Native RGBA technical inspection, not visual approval', 'files': results}
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    print(json.dumps({'files': len(results), 'frames': sum(r['frameCount'] for r in results),
                      'review': [{'key': r['key'], 'issues': r['issues'],
                                  'edgeContactCells': r.get('edgeContactCells'),
                                  'transparentFraction': r.get('transparentFraction')}
                                 for r in results]}, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
