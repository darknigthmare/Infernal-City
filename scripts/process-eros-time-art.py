"""Normalize one independent OpenAI Eros Time CG for the runtime.

The source remains a full, standalone image. This script only performs the
mechanical 16:9 crop, RGB conversion and deterministic WebP encoding expected
by the adult-scene registry.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image, ImageOps


ROOT = Path(__file__).resolve().parents[1]
GROUPS = {"heroines", "villains"}
STAGES = {"prelude", "ellipsis", "return"}
HEROINE_IDS = {
    "nyx", "aurelia", "maris", "zahra", "mircalla",
    "isolde", "hana", "freyja", "vega", "amara",
}
VILLAIN_IDS = {
    "xyra", "ossuary", "nhalzara", "astarra", "umbrael",
    "pestifera", "vexara", "kalix", "malika", "noctis",
}
PARTICIPANTS = HEROINE_IDS | VILLAIN_IDS


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--group", choices=sorted(GROUPS), required=True)
    parser.add_argument("--participant", choices=sorted(PARTICIPANTS), required=True)
    parser.add_argument("--stage", choices=sorted(STAGES), required=True)
    parser.add_argument("--quality", type=int, default=88)
    args = parser.parse_args()
    expected_group = "heroines" if args.participant in HEROINE_IDS else "villains"
    if args.group != expected_group:
        parser.error(f"{args.participant} belongs to {expected_group}, not {args.group}")

    destination = (
        ROOT
        / "assets"
        / "vn"
        / "cg"
        / "eros-time"
        / args.group
        / f"{args.participant}-eros-{args.stage}-v1.webp"
    )
    destination.parent.mkdir(parents=True, exist_ok=True)

    with Image.open(args.input) as source_image:
        source = source_image.convert("RGB")
        normalized = ImageOps.fit(
            source,
            (960, 540),
            Image.Resampling.LANCZOS,
            centering=(0.5, 0.5),
        )
        normalized.save(destination, "WEBP", quality=args.quality, method=6)

    with Image.open(destination) as rendered:
        if rendered.format != "WEBP" or rendered.mode != "RGB" or rendered.size != (960, 540):
            raise RuntimeError(
                f"Invalid Eros Time CG: format={rendered.format}, "
                f"mode={rendered.mode}, size={rendered.size}"
            )

    print(f"{destination.relative_to(ROOT).as_posix()}\t{destination.stat().st_size}")


if __name__ == "__main__":
    main()
