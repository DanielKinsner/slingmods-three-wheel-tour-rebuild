"""Half-resolution KTX2 variants by dropping the top mip level (no re-encoding, bit-exact lower mips).

For every hosted (demo-assets.json) public/assets/**/*.ktx2 at 4096 px, or 2048 px and over 3 MB, writes `<name>.half.ktx2` beside it and lists the originals in
public/assets/game-feel/texture-halves.json. The game uses them only when Texture detail is Balanced (Options), so the
approved full-resolution textures stay the default on High/Ultra.

    python scripts/game-feel/ktx2-half.py

Supports zstd (UASTC) and BasisLZ (ETC1S) supercompression; BasisLZ keeps its global codebooks and drops the level-0
image descriptors. Level data keeps its original order.
"""
import json, pathlib, struct, sys

ROOT = pathlib.Path(__file__).resolve().parents[2] / 'public' / 'assets'
MIN = 4096
# 2048 px maps are halved too when they are heavy (props, bark, rocks): Balanced is the low-bandwidth / low-memory tier.
MIN_HEAVY, HEAVY_BYTES = 2048, 3_000_000


def half(src: bytes) -> bytes:
    assert src[:12] == b'\xabKTX 20\xbb\r\n\x1a\n', 'not KTX2'
    vk, ts, w, h, d, layers, faces, levels, sc = struct.unpack_from('<9I', src, 12)
    dfd_off, dfd_len, kvd_off, kvd_len = struct.unpack_from('<4I', src, 48)
    sgd_off, sgd_len = struct.unpack_from('<2Q', src, 64)
    if levels < 2 or d > 1:
        raise ValueError('needs 2D texture with mips')
    index = [struct.unpack_from('<3Q', src, 80 + 24 * i) for i in range(levels)]
    keep = list(range(1, levels))
    dfd, kvd = src[dfd_off:dfd_off + dfd_len], src[kvd_off:kvd_off + kvd_len]
    sgd = src[sgd_off:sgd_off + sgd_len] if sgd_len else b''
    if sc == 1:  # BasisLZ: drop level-0 image descriptors
        per_level = max(1, layers) * faces
        head, descs = sgd[:20], sgd[20:]
        drop = 20 * per_level
        total_images = per_level * levels
        sgd = head + descs[drop:20 * total_images] + descs[20 * total_images:]
    elif sc not in (0, 2, 3):
        raise ValueError(f'unsupported supercompression {sc}')
    new_levels = len(keep)
    out = bytearray()
    out += src[:12]
    out += struct.pack('<9I', vk, ts, max(1, w >> 1), max(1, h >> 1), d, layers, faces, new_levels, sc)
    out += b'\0' * 32 + b'\0' * (24 * new_levels)  # index + level index, filled below

    def align(n):
        while len(out) % n:
            out.append(0)
    align(4); new_dfd = len(out); out += dfd
    new_kvd = len(out) if kvd_len else 0; out += kvd
    if sgd:
        align(8); new_sgd = len(out); out += sgd
    else:
        new_sgd = 0
    unit = 1 if sc else max(4, 16 if vk == 0 else 4)
    placed = {}
    for i in sorted(keep, key=lambda i: index[i][0]):  # preserve original on-disk order (smallest mips first)
        align(unit); off, length, raw = index[i]; placed[i] = (len(out), length, raw); out += src[off:off + length]
    struct.pack_into('<4I', out, 48, new_dfd, len(dfd), new_kvd, kvd_len)
    struct.pack_into('<2Q', out, 64, new_sgd, len(sgd))
    for n, i in enumerate(keep):
        struct.pack_into('<3Q', out, 80 + 24 * n, *placed[i])
    return bytes(out)


def main():
    hosted = set(json.loads((ROOT.parents[1] / 'demo-assets.json').read_text(encoding='utf8'))['assets'])
    listed = []
    for f in sorted(ROOT.rglob('*.ktx2')):
        if f.name.endswith('.half.ktx2'):
            continue
        b = f.read_bytes()
        w = struct.unpack_from('<I', b, 20)[0]
        rel = '/assets/' + f.relative_to(ROOT).as_posix()
        if rel[1:] not in hosted or not (w >= MIN or (w >= MIN_HEAVY and len(b) >= HEAVY_BYTES)):
            continue
        out = half(b)
        f.with_name(f.stem + '.half.ktx2').write_bytes(out)
        listed.append(rel)
        print(f'{rel}: {len(b)/1e6:.1f} MB -> {len(out)/1e6:.1f} MB')
    manifest = ROOT / 'game-feel' / 'texture-halves.json'
    manifest.write_text(json.dumps({'method': 'Top mip level dropped from the original KTX2 (scripts/game-feel/ktx2-half.py); lower mips are bit-identical', 'files': listed}, indent=1) + '\n')
    print(len(listed), 'variants')


if __name__ == '__main__':
    main()
