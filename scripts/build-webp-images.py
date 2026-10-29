#!/usr/bin/env python3
"""把本站托管的配图（public/images/wechat、csdn，以及外链图副本 mirror）转成多尺寸 WebP。

每张位图 x.png 生成：
  x.webp        原尺寸
  x-240.webp    宽 240（仅当原图更宽；列表缩略图用）
  x-480.webp    宽 480（同上）
  x-960.webp    宽 960（同上）
  x-1440.webp   宽 1440（同上）
原图保留作回退；SVG（公式图）和动图 GIF 不转。

同时写出 lib/db/notion/ownImages.json：{"/images/wechat/x.png": [宽, 高]}，
没有 WebP 的条目为 [宽, 高, 0]（只留了 240 缩略图的为 [宽, 高, 0, 1]），渲染层据此补宽高、拼 srcset。

可重复运行：WebP 比原图新时跳过。依赖 Pillow，建议在 venv 里跑：
  python3 -m venv .venv && .venv/bin/pip install Pillow
  .venv/bin/python scripts/build-webp-images.py
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "public"
# mirror/<原域名>/<原路径>：外链封面下载到本站的副本，见 lib/db/notion/ownImages.js mirroredOwnUrl
DEFAULT_DIRS = ("images/wechat", "images/csdn", "images/mirror")
MANIFEST = ROOT / "lib" / "db" / "notion" / "ownImages.json"
WIDTHS = (240, 480, 960, 1440)
# 列表缩略图尺寸：原尺寸 WebP 不划算的图也单独留这一档
THUMB_WIDTH = 240
RASTER_SUFFIXES = {".png", ".jpg", ".jpeg", ".gif"}
QUALITY = 80


@dataclass
class Stats:
    originals: int = 0
    webp_full: int = 0
    variants: int = 0
    skipped: int = 0


def webp_paths(src: Path, width: int) -> dict[int | None, Path]:
    """原尺寸用 None 作键，其余按宽度。"""
    paths: dict[int | None, Path] = {None: src.with_suffix(".webp")}
    for w in WIDTHS:
        if w < width:
            paths[w] = src.with_name(f"{src.stem}-{w}.webp")
    return paths


def is_fresh(src: Path, outputs: list[Path]) -> bool:
    mtime = src.stat().st_mtime
    return all(p.exists() and p.stat().st_mtime >= mtime for p in outputs)


def save_webp(img: Image.Image, dest: Path, width: int | None) -> None:
    if width is not None:
        height = round(img.height * width / img.width)
        img = img.resize((width, height), Image.Resampling.LANCZOS)
    img.save(dest, "WEBP", quality=QUALITY, method=6)


def convert(src: Path, stats: Stats) -> list[int]:
    """转换一张图，返回清单条目 [宽, 高]、[宽, 高, 0]，或只留了缩略图的 [宽, 高, 0, 1]。"""
    with Image.open(src) as opened:
        width, height = opened.size
        animated = getattr(opened, "is_animated", False)
        if animated:
            stats.skipped += 1
            return [width, height, 0]
        paths = webp_paths(src, width)
        full = paths[None]
        if is_fresh(src, list(paths.values())):
            stats.webp_full += 1
            stats.variants += len(paths) - 1
            return [width, height]
        img = opened.convert("RGBA" if opened.mode in ("RGBA", "LA", "P") else "RGB")

    save_webp(img, full, None)
    # 极少数小图 WebP 反而更大：删掉，渲染层直接用原图；原图比缩略图宽时仍留缩略图给列表用
    if full.stat().st_size >= src.stat().st_size:
        for w, p in paths.items():
            if w != THUMB_WIDTH:
                p.unlink(missing_ok=True)
        stats.skipped += 1
        if THUMB_WIDTH in paths:
            save_webp(img, paths[THUMB_WIDTH], THUMB_WIDTH)
            stats.variants += 1
            return [width, height, 0, 1]
        return [width, height, 0]
    stats.webp_full += 1
    for w, dest in paths.items():
        if w is not None:
            save_webp(img, dest, w)
            stats.variants += 1
    return [width, height]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("dirs", nargs="*", default=DEFAULT_DIRS, help="public/ 下的目录")
    args = parser.parse_args()

    stats = Stats()
    manifest: dict[str, list[int]] = {}
    before = 0
    after = 0
    for rel in args.dirs:
        for src in sorted((PUBLIC / rel).rglob("*")):
            if src.suffix.lower() not in RASTER_SUFFIXES:
                continue
            stats.originals += 1
            entry = convert(src, stats)
            manifest["/" + src.relative_to(PUBLIC).as_posix()] = entry
            before += src.stat().st_size
            full = src.with_suffix(".webp")
            after += full.stat().st_size if len(entry) == 2 else src.stat().st_size

    MANIFEST.write_text(json.dumps(manifest, separators=(",", ":"), sort_keys=True) + "\n")
    print(
        f"位图 {stats.originals} 张：WebP {stats.webp_full} 张、缩略尺寸 {stats.variants} 张、"
        f"保留原图 {stats.skipped} 张"
    )
    print(f"原尺寸合计：原图 {before / 1e6:.1f}MB → WebP {after / 1e6:.1f}MB")
    print(f"清单：{MANIFEST.relative_to(ROOT)}（{len(manifest)} 条）")


if __name__ == "__main__":
    main()
