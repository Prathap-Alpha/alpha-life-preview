/* Hero shader: Paper Shaders "warp" 0.0.82 (Apache-2.0, vendor/paper-shaders-0.0.82/). Two layers, colours from data-c1/c2/c3.
   Reduced motion or save-data: one still frame. If WebGL2 is missing the CSS gradient stays. */
import { ShaderMount } from './vendor/paper-shaders-0.0.82/shader-mount.js';
import { warpFragmentShader } from './vendor/paper-shaders-0.0.82/shaders/warp.js';
import { getShaderColorFromString } from './vendor/paper-shaders-0.0.82/get-shader-color-from-string.js';
import { getShaderNoiseTexture } from './vendor/paper-shaders-0.0.82/get-shader-noise-texture.js';

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const saveData = !!(navigator.connection && navigator.connection.saveData);
const lowPower = saveData || (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) ||
                 (navigator.deviceMemory && navigator.deviceMemory <= 2);
// Settings read off the reference component (Prism recipe, custom colours)
const SHADER = { rotation: -50, proportion: 0.01, scale: 1, distortion: 0, swirl: 0.5, swirlIterations: 16,
                 softness: 0.47, shape: 0, shapeScale: 0.45, speed: 0.2, frame: 0 };

const hero = document.querySelector('.hero');
const layers = [...document.querySelectorAll('.hero .shader')];
const noise = getShaderNoiseTexture();
const start = () => {
  try {
    const mounts = layers.map(el => new ShaderMount(el, warpFragmentShader, {
      u_noiseTexture: noise,
      u_colors: ['c1', 'c2', 'c3'].map(k => getShaderColorFromString(el.dataset[k])),
      u_colorsCount: 3,
      u_proportion: SHADER.proportion, u_softness: SHADER.softness, u_shape: SHADER.shape, u_shapeScale: SHADER.shapeScale,
      u_distortion: SHADER.distortion, u_swirl: SHADER.swirl, u_swirlIterations: SHADER.swirlIterations,
      u_fit: 0, u_scale: SHADER.scale, u_rotation: SHADER.rotation, u_offsetX: 0, u_offsetY: 0, u_originX: 0.5, u_originY: 0.5,
      u_worldWidth: 0, u_worldHeight: 0,
    }, { alpha: true, premultipliedAlpha: true, powerPreference: 'low-power' },
    reduced ? 0 : SHADER.speed, SHADER.frame, lowPower ? 0.5 : 1, 1920 * 1080));
    document.querySelector('.hero__shader').classList.add('live');
    window.__alphaLifeShader = { canvases: mounts.length, hero };
  } catch (e) { console.warn(e.message); }
};
if (noise.complete) start(); else noise.addEventListener('load', start, { once: true });
