import * as THREE from 'three';
import { CONFIG } from './constants.js';

export const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050505, 0.005);

export const camera = new THREE.PerspectiveCamera(CONFIG.fov, window.innerWidth / window.innerHeight, 0.1, 1000);
export const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Optim
renderer.shadowMap.enabled = false; // Perf
document.getElementById('container').appendChild(renderer.domElement);

// --- CURVED WORLD SHADER LOGIC ---
export const bendUniform = { value: 0 };

export function applyBend(mat) {
    mat.onBeforeCompile = (shader) => {
        shader.uniforms.uCurve = bendUniform;
        shader.vertexShader = `
      uniform float uCurve;
      ${shader.vertexShader}
    `.replace(
            '#include <project_vertex>',
            `
        vec4 mvPosition = viewMatrix * modelMatrix * vec4( transformed, 1.0 );
        // Bend X based on negative Z (distance into screen)
        float zDist = mvPosition.z; 
        mvPosition.x += uCurve * zDist * zDist * 0.001;
        gl_Position = projectionMatrix * mvPosition;
      `
        );
    };
}

// --- LIGHTING ---
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);
const dirLight = new THREE.DirectionalLight(0xffffff, 0.8);
dirLight.position.set(50, 100, 50);
scene.add(dirLight);

// --- MOON/SUN ---
function createSun() {
    const sunGeo = new THREE.SphereGeometry(20, 32, 32);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xffaa00, fog: false });
    const sun = new THREE.Mesh(sunGeo, sunMat);
    sun.position.set(-60, 100, -300);
    scene.add(sun);

    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    const grd = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(255, 170, 0, 1)');
    grd.addColorStop(0.5, 'rgba(255, 100, 0, 0.2)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, 128, 128);
    const sunTex = new THREE.CanvasTexture(canvas);
    const sunSprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: sunTex, color: 0xffaa00, transparent: true, blending: THREE.AdditiveBlending }));
    sunSprite.scale.set(200, 200, 1);
    sun.add(sunSprite);
}
createSun();

// --- ROAD ---
function createRoadTexture(biome) {
    const c = document.createElement('canvas');
    c.width = 1024; c.height = 1024;
    const ctx = c.getContext('2d');

    // Base Color
    let color = '#333333';
    let lineColor = '#ffffff';
    let centerColor = '#f1c40f';

    if (biome === 'desert') {
        color = '#7f6f50'; lineColor = '#dcdde1'; centerColor = '#dcdde1';
    } else if (biome === 'jungle') {
        color = '#4b3621'; centerColor = '#dcdde1'; lineColor = 'transparent';
    } else if (biome === 'village') {
        color = '#596275'; centerColor = '#dcdde1';
    } else if (biome === 'ocean') {
        color = '#95a5a6'; centerColor = '#f5f6fa';
    }

    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 1024, 1024);

    // Noise
    for (let i = 0; i < 8000; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.1)';
        ctx.fillRect(Math.random() * 1024, Math.random() * 1024, 2, 2);
    }

    // Lines
    if (centerColor !== 'transparent') {
        ctx.fillStyle = centerColor;
        for (let y = 0; y < 1024; y += 100) {
            ctx.fillRect(508, y, 8, 60);
        }
    }
    if (lineColor !== 'transparent') {
        ctx.fillStyle = lineColor;
        ctx.fillRect(20, 0, 10, 1024);
        ctx.fillRect(994, 0, 10, 1024);
    }

    if (biome === 'ocean') {
        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(0, 0, 15, 1024);
        ctx.fillRect(1009, 0, 15, 1024);
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 10);
    tex.anisotropy = 16;
    return tex;
}

// Mutable Road Material
export const roadMat = new THREE.MeshStandardMaterial({ map: createRoadTexture('city'), roughness: 0.8, metalness: 0.1 });
applyBend(roadMat);

const road = new THREE.Mesh(new THREE.PlaneGeometry(CONFIG.roadWidth, 800, 20, 20), roadMat);
road.rotation.x = -Math.PI / 2;
road.receiveShadow = false;
scene.add(road);

export function setBiome(b) {
    roadMat.map = createRoadTexture(b);
    roadMat.needsUpdate = true;

    // Simple fog/sky tweak
    if (b === 'city') { scene.background = new THREE.Color(0x050510); scene.fog.color.setHex(0x050510); }
    if (b === 'desert') { scene.background = new THREE.Color(0x2c1e0f); scene.fog.color.setHex(0x2c1e0f); }
    if (b === 'jungle') { scene.background = new THREE.Color(0x0a1a0a); scene.fog.color.setHex(0x0a1a0a); }
    if (b === 'village') { scene.background = new THREE.Color(0x1a1a2e); scene.fog.color.setHex(0x1a1a2e); }
    if (b === 'ocean') { scene.background = new THREE.Color(0x0f1e2c); scene.fog.color.setHex(0x0f1e2c); }
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
