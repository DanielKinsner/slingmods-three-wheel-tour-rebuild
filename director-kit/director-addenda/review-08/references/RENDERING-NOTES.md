# Rendering notes — source-backed hypotheses, not passed game fixes

Checked September 11, 2026. The game pins Three.js 0.186.0. Public `dev` sources can differ; inspect the installed local version before implementation. No renderer migration is authorized.

## Area-light scale

Primary source: [Three.js RectAreaLight implementation](https://raw.githubusercontent.com/mrdoob/three.js/dev/src/lights/RectAreaLight.js), `power` getter/setter. The source uses intensity in nits and calculates power as intensity × width × height × pi. [API documentation](https://threejs.org/docs/pages/RectAreaLight.html) describes rectangular strip-like sources, PBR support and absence of area-light shadow support.

Local `src/presentation/product.ts`: width .035, height 1.3, intensity `brightness*14`. Default .6 gives 8.4 intensity, 1.2007 nominal lm/light, 2.4014 total. This arithmetic is not a measured SM-133 specification. It diagnoses a low virtual emission starting point. The emitted color and tone-mapped result are not captured by a raw nominal power scalar.

Orientation is not the primary suspected problem: -Z rotated -pi/2 about X points -Y. Preserve that unless an actual runtime normal/transform test shows otherwise. The source is near the ground, so dimensional placement matters; choose output via matched local render comparisons, not a giant default point light.

## Shader-variant lead

Primary source: [Three.js WebGLPrograms](https://raw.githubusercontent.com/mrdoob/three.js/dev/src/renderers/webgl/WebGLPrograms.js), `getParameters` and `getProgramCacheKeyParameters`: spotlight/area-light counts are shader parameters/cache-key inputs. [WebGLRenderer implementation](https://raw.githubusercontent.com/mrdoob/three.js/dev/src/renderers/WebGLRenderer.js) shows visible-light scene traversal and compilation preparation.

Local `harbor-lighting.ts`: `l.visible=!!sample&&sample.d<55` changes a four-slot allocated pool into three or four visible practicals. Actual light-count changes are demonstrated by the submitted trajectory and our independent source-equation analysis. The coincident wall-clock freeze is a hypothesis to investigate, not causal proof. New shaders, CPU work, graphics synchronization and recording overhead need to be separated by measurements.

Primary API: [WebGLRenderer compile/compileAsync/initTexture](https://threejs.org/docs/pages/WebGLRenderer.html). Configure lighting/environment before compilation; asynchronous compilation can reduce avoidable stalls and `initTexture` can prepare texture resources. Compile completion is not a blanket guarantee against every upload/camera/pipeline first use.

## Measurement boundary

The existing profile calls full `inspect()` per RAF and records video with preserved drawing buffers. That differs from ordinary production rendering. Native RAF intervals include scheduling, not merely GPU work; two short runs cannot isolate cost causally. Stable light counts, minimal observation, prepared render states and full-course cold/warm comparisons are proposed diagnostics/repairs. They have not been executed or accepted by Astra as a fix in this review.
