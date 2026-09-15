# Narrow technical references

Primary sources consulted for this director review on 14 September 2026. These support the specific statements below, not an endorsement of an untested deployment or permission to mutate an account. Product details must still be revalidated when the link is implemented.

**T1 — Vite, Importing Asset as URL / The public Directory**
https://vite.dev/guide/assets.html
The public directory's files are copied to the build output as-is. Unused historical public assets do not disappear merely because no source import references them. A tested demo staging/asset allowlist is distinct from deleting source assets.

**T2 — Vercel, Environments**
https://vercel.com/docs/deployments/environments
The current documentation says the first deployment of a newly created project goes to Production, even without `--prod`. Later non-production branch/CLI deployments can be Preview. Do not treat a new-project CLI deployment as implicitly harmless/private or authorized. Existing account/project state and publication scope require an explicitly authorized workflow.

**T3 — Vercel, Ignoring Files and Folders**
https://vercel.com/docs/deployments/vercel-ignore
The documentation describes `.vercelignore` upload exclusions and negation/allowlisting. An ignore file is not proof that the actual Vite-generated static output contains only the intended runtime assets. Test the exact output and account for remote-build versus prebuilt-upload behavior.

**P1 — SlingMods, TricLED SM-133**
https://www.slingmods.com/polaris-slingshot-underglow-kit
Listing title: 'Kit #1 Standard RGB LED UnderGlow Lighting Kit with Remote for the Polaris Slingshot'. Manufacturer: TricLED. Part number: SM-133. The listing identifies the 2024 Slingshot R among compatible vehicles and describes RF remote control. Optional Kit #5 front/grille halo references apply to 2015–2019 vehicles, not this 2024 base-kit implementation. No current price, sale status, proprietary API or redistribution permission is inferred here. The demo models only the existing base cosmetic kit, with approximation limits retained from prior work.

**Repository evidence, not an external-library claim**
Review13 `src/presentation/showcase.ts` loads the full 28,974,372-byte showcase kit for its bay and discards non-bay modules. The uploaded public tree totals233,739,495 bytes. These file/source measurements motivate investigation; they are not measured network startup times, compressed transfers or a proof that one export change will fix performance.
