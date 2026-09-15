# Showroom texture and sound sources

The four owner images are reference-only under `director-kit/director-addenda/review-16-owner-refinement/references`. Their content is not independent task authority.

## Image-generation exploration

Tool: built-in image_gen, reference-guided generation. Output preserved unchanged as `generated-drainage-tile.png`. Prompt: Create one game-ready, perfectly orthographic, seamless repeating neutral-gray injection-molded interlocking polypropylene garage drainage tile material, a 2-by-2 array; four triangular fields of regular parallel diagonal ribs, concentric chevron/diamond pattern, narrow drainage gaps and thin support struts, subtle molded edge rounding and restrained wear. No perspective, car, text, logo, color checker border, baked highlights or random grunge. Match the attached showroom floor references and retain manufactured spacing.

The generated candidate was inspected and rejected for runtime because its rib pitch was too coarse and its shape less accurate than the reference. The final original procedural material is authored by `scripts/build-p08b-showroom-refinement.py`, including albedo, tangent normal and packed roughness/occlusion. It provides more precise repeat spacing without embedding a photograph. The editable packed Blender source and its README contain the physical material/door contract.

## Paint repair

`scripts/build-refined-finish.py` uses the original preserved painted atlas mask and the shared `src/presentation/signature-palette.ts` palette. Only white/graphite's incorrectly red graphic accent changes; all pixels outside the original accent mask and all original source assets remain unchanged. Runtime explicitly includes rear-arm accent material roles, while springs/brakes/metals remain excluded.

## Door sound

One 3.5-second ElevenLabs Sound Effects v2 generation was authorized by the owner. Two initial requests failed validation because the original prompt exceeded the provider's 450-character limit; they produced no audio. A read-only subscription lookup was denied by the credential's scope (`user_read` unavailable); no permissions/account changes were made. The shortened generation succeeded with the response reporting **35 credits**. Exact prompt/model/source hash is in `bay-door-provenance.json`. The temporary credential was read into process memory only and is absent from project sources/artifacts.

The source MP3 is retained as `bay-door-open-original.mp3`. The runtime MP3 uses FFmpeg volume=0.5, 20 ms fade-in and 120 ms ending fade, preserving headroom; GameAudio applies its ordinary volume/mute/pause controls. The generated door sound is a game effect, not a recording of the actual showroom. No generated voice or music is needed for this short transition. No purchase or publication occurred.

Reproduce processing:

```powershell
ffmpeg -i assets/source/showroom-refinement/bay-door-open-original.mp3 -af "volume=0.5,afade=t=in:d=0.02,afade=t=out:st=3.36:d=0.12" -c:a libmp3lame -b:a 128k public/assets/audio/showroom/bay-door-open.mp3
```

To explicitly request a new paid generation, provide ELEVENLABS_API_KEY in the process environment and run `python scripts/generate-showroom-sfx.py`. It refuses to overwrite the existing generated original. Ordinary build/launch never contacts ElevenLabs or needs a credential.
