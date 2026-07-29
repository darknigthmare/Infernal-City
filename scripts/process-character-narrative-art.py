"""Normalize one OpenAI VN triptych and expression sheet for a heroine.

The CG source is authored as three horizontal cinematic bands, one per chapter.
This script makes the runtime WebP files without repainting the generated art.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
HEROES = {
    "nyx": ("nyx-circuit", ["ghost-in-the-rain", "unchained-frequency", "after-the-blackout"]),
    "aurelia": ("aurelia-brassheart", ["brass-after-hours", "borrowed-minute", "heart-under-glass"]),
    "maris": ("maris-blacktide", ["captains-table", "two-compasses", "blacktide-cabin"]),
    "zahra": ("zahra-mille-ciels", ["garden-above-sand", "unwritten-constellation", "lanterns-of-choice"]),
    "mircalla": ("mircalla-dollheart", ["porcelain-audience", "crack-in-perfection", "lace-curtain"]),
    "isolde": ("isolde-mourne", ["last-requiem", "voice-between-silences", "mourning-into-dawn"]),
    "hana": ("hana-kurogane", ["tea-without-rank", "truth-under-steel", "moon-on-empty-blade"]),
    "freyja": ("freyja-rimeborne", ["feast-after-storm", "erasable-oath", "warmth-under-rime"]),
    "vega": ("vega-solari", ["halo-at-rest", "permission-to-doubt", "eclipse-for-two"]),
    "amara": ("amara-verdigris", ["safe-greenhouse", "unowned-creation", "verdigris-bloom"]),
}


def save_webp(image: Image.Image, destination: Path, quality: int) -> None:
    destination.parent.mkdir(parents=True, exist_ok=True)
    image.convert("RGB").save(destination, "WEBP", quality=quality, method=6)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--hero", choices=sorted(HEROES), required=True)
    parser.add_argument("--cg-sheet", type=Path, required=True)
    parser.add_argument("--expression-sheet", type=Path, required=True)
    args = parser.parse_args()

    slug, chapter_ids = HEROES[args.hero]
    outputs: list[Path] = []
    with Image.open(args.cg_sheet) as source_image:
        source = source_image.convert("RGB")
        band_edges = [round(source.height * index / 3) for index in range(4)]
        bands = [
            source.crop((0, band_edges[index], source.width, band_edges[index + 1]))
            for index in range(3)
        ]
        for chapter_id, band in zip(chapter_ids, bands, strict=True):
            destination = (
                ROOT / "assets" / "vn" / "cg" / "chapters"
                / f"{args.hero}-{chapter_id}.webp"
            )
            save_webp(ImageOps.fit(band, (960, 540), Image.Resampling.LANCZOS), destination, 86)
            outputs.append(destination)

        night_portrait = (
            ROOT / "assets" / "characters" / "heroines"
            / f"{slug}-night-portrait-v1.webp"
        )
        save_webp(
            ImageOps.fit(bands[2], (512, 640), Image.Resampling.LANCZOS, centering=(0.64, 0.5)),
            night_portrait,
            88,
        )
        outputs.append(night_portrait)

    with Image.open(args.expression_sheet) as expression_image:
        expression_source = expression_image.convert("RGB")
        expression = ImageOps.fit(
            expression_source,
            (768, 768),
            Image.Resampling.LANCZOS,
        )
        expression_destination = (
            ROOT / "assets" / "vn" / "expressions"
            / f"{args.hero}-expressions-v1.webp"
        )
        save_webp(expression, expression_destination, 86)
        outputs.append(expression_destination)

        # The first tile is requested as the neutral close-up in every OpenAI
        # expression prompt. It provides a sharper HUD/Codex portrait than an
        # enlarged 256 px combat-atlas cell while preserving the same identity.
        tile_right = round(expression_source.width / 3)
        tile_bottom = round(expression_source.height / 3)
        neutral_closeup = expression_source.crop((0, 0, tile_right, tile_bottom))
        portrait_destination = (
            ROOT / "assets" / "characters" / "heroines"
            / f"{slug}-portrait-v1.webp"
        )
        save_webp(
            ImageOps.fit(
                neutral_closeup,
                (512, 640),
                Image.Resampling.LANCZOS,
                centering=(0.5, 0.42),
            ),
            portrait_destination,
            88,
        )
        outputs.append(portrait_destination)

    for output in outputs:
        print(f"{output.relative_to(ROOT).as_posix()}\t{output.stat().st_size}")


if __name__ == "__main__":
    main()
