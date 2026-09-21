"""Owner-supplied high-resolution SlingMods wordmark -> runtime sign artwork. Plain Python + Pillow.

Crops the 2000x500 original to its visible artwork (alpha bounds + 8 px) so sign margins are measured from ink, not from
transparent canvas. Pixels are otherwise untouched: no resample, no recolour. Run before build-brand-sign.py and
build-ridge-gantry-sign.py. The 360 px slingmods-logo-main.png stays as retrieved for the 2D interface.
"""
from pathlib import Path
import json, hashlib
from PIL import Image
ROOT=Path(__file__).resolve().parents[1];SRC=ROOT/'assets/source/brand';OUT=ROOT/'public/assets/brand';PAD=8
sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
original=SRC/'slingmods-logo-wide-2000.webp';image=Image.open(original).convert('RGBA')
left,top,right,bottom=image.getchannel('A').point(lambda v:255 if v>16 else 0).getbbox()
box=(max(0,left-PAD),max(0,top-PAD),min(image.width,right+PAD),min(image.height,bottom+PAD));wide=image.crop(box);wide.save(OUT/'slingmods-logo-wide.png',optimize=True)
record={'suppliedBy':'Owner, in the working session of 2026-09-21 (two files: wide wordmark and round SM badge)','original':{'file':'assets/source/brand/slingmods-logo-wide-2000.webp','pixels':list(image.size),'sha256':sha(original)},'badge':{'file':'assets/source/brand/slingmods-badge-762.png','sha256':sha(SRC/'slingmods-badge-762.png'),'use':'Retained as source art; not placed yet.'},
 'runtime':{'file':'public/assets/brand/slingmods-logo-wide.png','pixels':list(wide.size),'sha256':sha(OUT/'slingmods-logo-wide.png'),'cropBox':list(box)},'transform':'Lossless crop to alpha bounds plus 8 px. No resample or colour change.','authorizationBasis':'First-party SlingMods artwork supplied by the owner for this private project. Trademark/copyright retained by SlingMods; no public deployment permission inferred.','generator':'scripts/build-brand-logo-wide.py'}
(OUT/'slingmods-logo-wide.source.json').write_text(json.dumps(record,indent=2)+'\n',encoding='utf-8');print('Wide logo',wide.size,'aspect',round(wide.width/wide.height,4))
