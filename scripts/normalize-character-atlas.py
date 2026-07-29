"""Give every frame of a 4x4 character atlas a transparent safety margin.

The whole 256 px source cell is scaled by the same amount, rather than trimming
each pose independently. This preserves animation scale, anchor and movement
while ensuring large attack/ultimate effects cannot bleed into another frame.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


GRID_SIZE = 4
ATLAS_SIZE = 1024
CELL_SIZE = ATLAS_SIZE // GRID_SIZE


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("atlas", type=Path)
    parser.add_argument("--margin", type=int, default=12)
    args = parser.parse_args()

    if not 1 <= args.margin < CELL_SIZE // 2:
        raise ValueError("La marge doit rester comprise entre 1 et 127 px")

    with Image.open(args.atlas) as source_image:
        source = source_image.convert("RGBA")
    if source.size != (ATLAS_SIZE, ATLAS_SIZE):
        raise ValueError(f"Atlas attendu en 1024x1024, reçu {source.size}")

    inner_size = CELL_SIZE - (args.margin * 2)
    destination = Image.new("RGBA", source.size)
    for row in range(GRID_SIZE):
        for column in range(GRID_SIZE):
            cell = source.crop(
                (
                    column * CELL_SIZE,
                    row * CELL_SIZE,
                    (column + 1) * CELL_SIZE,
                    (row + 1) * CELL_SIZE,
                )
            )
            if cell.getchannel("A").getbbox() is None:
                raise ValueError(f"Cellule vide: ligne {row + 1}, colonne {column + 1}")
            normalized = cell.resize(
                (inner_size, inner_size),
                Image.Resampling.LANCZOS,
            )
            destination.alpha_composite(
                normalized,
                (
                    (column * CELL_SIZE) + args.margin,
                    (row * CELL_SIZE) + args.margin,
                ),
            )

    destination.save(args.atlas, "PNG", optimize=True)

    alpha = destination.getchannel("A")
    for row in range(GRID_SIZE):
        for column in range(GRID_SIZE):
            bounds = alpha.crop(
                (
                    column * CELL_SIZE,
                    row * CELL_SIZE,
                    (column + 1) * CELL_SIZE,
                    (row + 1) * CELL_SIZE,
                )
            ).getbbox()
            if bounds is None:
                raise ValueError("La normalisation a créé une cellule vide")
            left, top, right, bottom = bounds
            if (
                left < args.margin
                or top < args.margin
                or right > CELL_SIZE - args.margin
                or bottom > CELL_SIZE - args.margin
            ):
                raise ValueError(f"Marge alpha invalide après normalisation: {bounds}")

    print(f"{args.atlas.as_posix()}\t1024x1024 RGBA\tmarge {args.margin}px")


if __name__ == "__main__":
    main()
