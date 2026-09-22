export const EFFECT_SPRITES=['tire-smoke','dust-kickup','dry-leaf-burst','water-rooster-tail','brake-scrape-sparks','exhaust-flame-pop'] as const;
export const effectAssetURLs=()=>EFFECT_SPRITES.map(name=>`/assets/p11/vfx/${name}.ktx2`);
