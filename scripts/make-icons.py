#!/usr/bin/env python3
"""Draw simple Harbor app icons. No third-party image library."""

import struct
import zlib
from pathlib import Path


def chunk(tag: bytes, data: bytes) -> bytes:
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)


def pixel(x: int, y: int, size: int) -> bytes:
    pad = size * 0.08
    teal = (22, 62, 59, 255)
    if not (pad <= x <= size - pad and pad <= y <= size - pad):
        return bytes(teal)
    cx, cy = size * 0.5, size * 0.56
    nx, ny = (x - cx) / (size * 0.28), (y - cy) / (size * 0.16)
    if nx * nx + ny * ny <= 1:
        return bytes((255, 253, 248, 255))
    if abs(y - size * 0.42) < size * 0.015 and abs(x - cx) < size * 0.22:
        return bytes((196, 132, 62, 255))
    return bytes(teal)


def write_png(path: Path, size: int) -> None:
    raw = bytearray()
    for y in range(size):
        raw.append(0)
        for x in range(size):
            raw.extend(pixel(x, y, size))
    ihdr = struct.pack(">IIBBBBB", size, size, 8, 6, 0, 0, 0)
    png = b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", ihdr) + chunk(b"IDAT", zlib.compress(bytes(raw), 9)) + chunk(b"IEND", b"")
    path.write_bytes(png)


if __name__ == "__main__":
    root = Path(__file__).resolve().parents[1] / "public" / "icons"
    root.mkdir(parents=True, exist_ok=True)
    write_png(root / "icon-192.png", 192)
    write_png(root / "icon-512.png", 512)
