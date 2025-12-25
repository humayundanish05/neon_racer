import * as THREE from 'three';
import { CONFIG, RES } from './constants.js';
import { state, userSettings, input } from './state.js';
import { initAudio, playSound, updateEngineSound, toggleMute } from './audio.js';
import { scene, camera, renderer, bendUniform, setBiome } from './world.js';
import {
    carGroup, updatePlayerCar, spawnBoostParticle, particles,
    poolSports, poolSedans, poolSUV, poolTruck, poolBike, poolScenery
} from './entities.js';

// --- GAME LOGIC ---

function spawnTraffic() {
    if (state.speed < 10) return;
    if (Math.random() < 0.02) {
        // Determine Lane
        const laneIdx = Math.floor(Math.random() * 4);
        const laneX = CONFIG.lanes[laneIdx];

        // Choose Type
        const r = Math.random();
        let car;
        if (r < 0.1) car = poolTruck.get();
        else if (r < 0.3) car = poolSUV.get();
        else if (r < 0.7) car = poolSedans.get();
        else if (r < 0.85) car = poolSports.get();
        else car = poolBike.get();

        if (car) {
            car.position.set(laneX, 0, -300); // Spawn far ahead
            car.userData.speed = (state.speed * 0.5) + (Math.random() * 20); // Move slower than player
            // Oncoming traffic logic (Leftmost lane?) - For now simplified to all same dir
            if (laneIdx === 0) {
                // Simple Oncoming: Move towards player?
                // car.rotation.y = Math.PI;
            } else {
                car.rotation.y = 0;
            }
        }
    }
}

function spawnScenery() {
    if (state.speed < 10) return;
    if (Math.random() < 0.05) {
        const grp = poolScenery.get();
        if (!grp) return;

        // Reset vis
        grp.children.forEach(c => c.visible = false);

        // Pick element based on biome
        let elName = 'tree';
        if (userSettings.biome === 'city') elName = Math.random() > 0.5 ? 'building' : 'trafficlight';
        else if (userSettings.biome === 'desert') elName = Math.random() > 0.5 ? 'cactus' : 'rock';
        else if (userSettings.biome === 'ocean') elName = 'island';
        else if (userSettings.biome === 'village') elName = 'house'; // missing house mapping in entities but safe fallback

        const el = grp.getObjectByName(elName) || grp.getObjectByName('tree');
        el.visible = true;

        const side = Math.random() > 0.5 ? -1 : 1;
        grp.position.set(side * (15 + Math.random() * 10), 0, -300);
        grp.userData.fixed = true; // Scenery doesn't move itself
    }
}

// --- NEAR MISS LOGIC ---
const NEAR_MISS_DIST = 2.5; // Meters
const COLLISION_DIST = 1.6; // Meters
let comboCount = 0;
let comboTimer = 0;

function triggerNearMiss() {
    comboCount++;
    playSound('nearmiss');

    // UI
    const hud = document.getElementById('comboHUD');
    hud.innerText = `NEAR MISS! +100 \n x${comboCount} COMBO`;
    hud.classList.remove('active');
    void hud.offsetWidth; // Trigger reflow
    hud.classList.add('active');

    // Rewards
    const score = 100 * comboCount;
    state.distance += score; // Add to score
    state.boostFuel = Math.min(state.boostFuel + 0.5, state.boostMax); // Refill boost

    // Combo Timeout
    clearTimeout(comboTimer);
    comboTimer = setTimeout(() => { comboCount = 0; }, 2000);
}

// --- MAIN LOOP ---
const clock = new THREE.Clock();
function animate() {
    requestAnimationFrame(animate);
    const dt = Math.min(clock.getDelta(), 0.1);

    if (state.playing) {
        if (input.gas) state.speed += CONFIG.accel * dt;
        else if (input.brake) state.speed -= CONFIG.brake * dt;
        else state.speed -= 10 * dt;

        // --- BOOST LOGIC ---
        let maxSpeed = CONFIG.maxSpeed;
        state.boosting = false;

        if (state.boostCooldown) {
            state.boostRechargeTimer -= dt;
            if (state.boostRechargeTimer <= 0) {
                state.boostCooldown = false;
                state.boostFuel = 12.0;
            }
            // UI Update
            const pct = 1 - (state.boostRechargeTimer / state.boostRechargeTime);
            document.getElementById('btnBoost').style.setProperty('--progress', (pct * 360) + 'deg');
            document.querySelector('#btnBoost span').innerText = "CHRG";
            document.querySelector('#btnBoost .timer').innerText = state.boostRechargeTimer.toFixed(1);
        } else {
            if (state.boostInput && state.boostFuel > 0) {
                state.boosting = true;
                state.boostFuel -= dt;
                maxSpeed = 500;
                state.speed += CONFIG.accelBoost * dt;
                spawnBoostParticle();
                if (state.boostFuel <= 0) {
                    state.boostCooldown = true;
                    state.boostRechargeTimer = state.boostRechargeTime;
                }
            } else if (state.boostFuel < 12.0 && !state.boostInput) {
                state.boostFuel += dt * 0.5;
            }
            state.boostFuel = Math.min(state.boostFuel, 12.0); // Clamp
            // UI Update
            const pct = state.boostFuel / 12.0;
            document.getElementById('btnBoost').style.setProperty('--progress', (pct * 360) + 'deg');
            document.querySelector('#btnBoost span').innerText = "NITRO";
            document.querySelector('#btnBoost .timer').innerText = state.boostFuel.toFixed(1);
        }

        state.speed = Math.max(0, Math.min(state.speed, maxSpeed));

        // Steering
        if (state.speed > 5) {
            let steerInput = 0;
            if (userSettings.controlType === 'buttons') {
                if (input.left) steerInput = -0.5;
                if (input.right) steerInput = 0.5;
            } else {
                steerInput = input.steer / 100;
            }
            state.laneX += steerInput * CONFIG.steerSpeed * dt * 2.0;
        }
        state.laneX = Math.max(-6, Math.min(6, state.laneX));
        carGroup.position.x = THREE.MathUtils.lerp(carGroup.position.x, state.laneX, dt * 5);

        // Tilt/Bob
        const tilt = (carGroup.position.x - state.laneX) * 0.15;
        carGroup.rotation.z = tilt;
        carGroup.position.y = Math.sin(clock.elapsedTime * state.speed * 0.5) * (state.speed > 20 ? 0.02 : 0);

        // Audio
        updateEngineSound(state.speed, userSettings.type);

        // --- ENTITIES & COLLISION ---
        const speedMps = state.speed / 3.6;
        const moveDist = speedMps * dt;
        state.distance += moveDist;

        spawnTraffic();
        spawnScenery();

        // Move Pools
        [poolSports, poolSedans, poolSUV, poolTruck, poolBike].forEach(pool => {
            pool.active.forEach(car => {
                // Traffic moves slower than player (relative speed)
                // car.z += (playerSpeed - carSpeed) * dt
                // In this 'infinite runner', player is static Z=0. World moves towards +Z.
                // Actually, let's keep player at 0. Objects spawn at -300.
                // If traffic speed < player speed, they should move +Z (closer to player).
                // Relative Speed = (PlayerSpeed - TrafficSpeed)
                const relSpeed = (speedMps - (car.userData.speed || 0));
                car.position.z += relSpeed * dt;

                // Collision Check
                if (Math.abs(car.position.z) < 2.5) { // Passes player (approx Z=0)
                    const dx = Math.abs(car.position.x - carGroup.position.x);

                    if (dx < COLLISION_DIST) {
                        if (state.invulnTimer <= 0) crashGame();
                    } else if (dx < NEAR_MISS_DIST && !car.userData.nearMissed) {
                        // NEAR MISS!
                        triggerNearMiss();
                        car.userData.nearMissed = true; // One per car
                    }
                }

                if (car.position.z > 20) {
                    pool.release(car);
                    car.userData.nearMissed = false;
                }
            });
        });

        poolScenery.active.forEach(obj => {
            obj.position.z += speedMps * dt;
            if (obj.position.z > 20) poolScenery.release(obj);
        });

        // Particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.life -= dt;
            p.mesh.position.z += speedMps * dt; // Trail moves with world
            p.mesh.material.opacity = p.life;
            if (p.life <= 0) {
                scene.remove(p.mesh);
                particles.splice(i, 1);
            }
        }

        // UI Update
        document.getElementById('scoreVal').innerText = Math.floor(state.distance) + " m";
        document.getElementById('speedVal').innerHTML = Math.floor(state.speed) + ' <span style="font-size:14px">km/h</span>';
    }

    // Render
    renderer.render(scene, camera);
}

function crashGame() {
    playSound('crash');
    state.health--;
    state.invulnTimer = 2.0;
    state.speed *= 0.2;
    document.getElementById('healthVal').innerText = "❤️".repeat(state.health) + "🖤".repeat(3 - state.health);
    document.getElementById('dangerOverlay').classList.add('active');
    setTimeout(() => document.getElementById('dangerOverlay').classList.remove('active'), 1000);

    if (state.health <= 0) {
        state.playing = false;
        const currentScore = Math.floor(state.distance);
        const savedScore = parseInt(localStorage.getItem('neonRacerHighScore') || '0');

        document.querySelector('.glitch-title').innerText = currentScore > savedScore ? "NEW HIGH SCORE!" : "CRASHED";
        document.querySelector('.subtitle').innerText = "SCORE: " + currentScore + " M";
        if (currentScore > savedScore) localStorage.setItem('neonRacerHighScore', currentScore);

        document.getElementById('btnStart').innerText = "RETRY";
        document.getElementById('overlay').classList.remove('hidden');
        document.getElementById('controls-left').style.display = 'none';
    }
}

function resetGame() {
    initAudio();
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();

    state.speed = 0;
    state.distance = 0;
    state.laneX = 0;
    state.health = 3;
    state.invulnTimer = 0;
    state.playing = true;
    state.boostFuel = 12.0;

    carGroup.position.x = 0;
    carGroup.rotation.z = 0;

    // Reset Pools
    [poolSports, poolSedans, poolSUV, poolTruck, poolBike, poolScenery].forEach(p => p.reset());

    // Curvature
    const curveDir = Math.random() > 0.5 ? 1 : -1;
    bendUniform.value = curveDir * Math.random() * 0.4;
    updatePlayerCar(); // Ensure material

    document.getElementById('overlay').classList.add('hidden');
    document.getElementById('controls-left').style.display = 'block'; // Or flex, based on logic
    updateControlVisibility();

    document.getElementById('healthVal').innerText = "❤️❤️❤️";
}

// --- INITIALIZATION ---
// Setup Event Listeners

document.getElementById('btnStart').addEventListener('click', resetGame);

// Controls Logic
function updateControlVisibility() {
    const type = userSettings.controlType;
    document.getElementById('ctrl-slider-group').style.display = (type === 'slider') ? 'block' : 'none';
    document.getElementById('ctrl-buttons-group').style.display = (type === 'buttons') ? 'flex' : 'none';
    document.getElementById('ctrl-wheel-group').style.display = (type === 'wheel') ? 'block' : 'none';
}

// Global expose for Index.html (Settings)
window.changeSetting = function (key, val) {
    if (key === 'controlType') {
        userSettings.controlType = val;
        updateControlVisibility();
    }
}
// Note: The rest of the Settings UI generation logic needs to be here too or adapted.
// For brevity, I'll migrate the Settings UI initialization deeply.

function initSettingsUI() {
    document.getElementById('btnSettings').addEventListener('click', () => {
        document.getElementById('settingsPanel').style.display = 'block';
        document.getElementById('overlay').classList.add('blur-bg'); // Blur landing
        document.getElementById('container').classList.add('blur-bg'); // Blur game
    });
    document.getElementById('btnCloseSettings').addEventListener('click', () => {
        document.getElementById('settingsPanel').style.display = 'none';
        document.getElementById('overlay').classList.remove('blur-bg');
        document.getElementById('container').classList.remove('blur-bg');
    });

    const colors = ['#ff0000', '#00ffff', '#39ff14', '#ffff00', '#ff00ff', '#ffffff', '#111111'];
    const container = document.getElementById('colorsContainer');
    colors.forEach(c => {
        const div = document.createElement('div');
        div.className = 'color-opt';
        div.style.backgroundColor = c;
        div.onclick = () => {
            document.querySelectorAll('.color-opt').forEach(el => el.classList.remove('selected'));
            div.classList.add('selected');
            userSettings.color = c;
            updatePlayerCar();
        };
        container.appendChild(div);
    });

    // Control Types
    const controlTypes = [
        { id: 'slider', icon: '↔️', name: 'Slider' },
        { id: 'buttons', icon: '◀ ▶', name: 'Buttons' },
        { id: 'wheel', icon: '⭕', name: 'Wheel' }
    ];
    const ctrlContainer = document.getElementById('controlsTypeContainer');
    controlTypes.forEach(opt => {
        const btn = document.createElement('div');
        btn.className = 'img-btn' + (userSettings.controlType === opt.id ? ' selected' : '');
        btn.innerHTML = `<span>${opt.icon}</span>${opt.name}`;
        btn.onclick = () => {
            document.querySelectorAll('#controlsTypeContainer .img-btn').forEach(el => el.classList.remove('selected'));
            btn.classList.add('selected');
            userSettings.controlType = opt.id;
            updateControlVisibility();
        };
        ctrlContainer.appendChild(btn);
    });

    // Biomes
    const biomes = [
        { id: 'city', icon: '🌃', name: 'Night City' },
        { id: 'village', icon: '🏘️', name: 'Village' },
        { id: 'desert', icon: '🏜️', name: 'Desert' },
        { id: 'jungle', icon: '🌴', name: 'Jungle' },
        { id: 'ocean', icon: '🌊', name: 'Ocean' }
    ];
    const bioContainer = document.getElementById('biomeContainer');
    biomes.forEach(opt => {
        const btn = document.createElement('div');
        btn.className = 'img-btn' + (userSettings.biome === opt.id ? ' selected' : '');
        btn.innerHTML = `<span>${opt.icon}</span>${opt.name}`;
        btn.onclick = () => {
            document.querySelectorAll('#biomeContainer .img-btn').forEach(el => el.classList.remove('selected'));
            btn.classList.add('selected');
            userSettings.biome = opt.id;
            setBiome(opt.id);
        };
        bioContainer.appendChild(btn);
    });

    // Car Types
    const carTypes = [
        { id: 'muscle', icon: '🚘', name: 'Muscle' },
        { id: 'racer', icon: '🏎️', name: 'Racer' },
        { id: 'suv', icon: '🚙', name: 'SUV' },
        { id: 'f1', icon: '🏁', name: 'Formula' },
        { id: 'truck', icon: '🚚', name: 'Truck' }
    ];
    const carContainer = document.getElementById('carTypeContainer');
    carTypes.forEach(opt => {
        const btn = document.createElement('div');
        btn.className = 'img-btn' + (userSettings.type === opt.id ? ' selected' : '');
        btn.innerHTML = `<span>${opt.icon}</span>${opt.name}`;
        btn.onclick = () => {
            document.querySelectorAll('#carTypeContainer .img-btn').forEach(el => el.classList.remove('selected'));
            btn.classList.add('selected');
            userSettings.type = opt.id;
            updatePlayerCar();
        };
        carContainer.appendChild(btn);
    });

}

// Input Handling
const slider = document.getElementById('sliderSteer');
slider.addEventListener('input', (e) => { input.steer = parseFloat(e.target.value); });
slider.addEventListener('pointerup', () => { slider.value = 0; input.steer = 0; });

const addTouch = (id, k) => {
    const el = document.getElementById(id);
    if (el) {
        el.addEventListener('pointerdown', e => { e.preventDefault(); input[k] = true });
        el.addEventListener('pointerup', e => { e.preventDefault(); input[k] = false });
        el.addEventListener('pointerleave', e => { e.preventDefault(); input[k] = false });
    }
}
addTouch('btnGas', 'gas');
addTouch('btnBrake', 'brake');
addTouch('btnLeft', 'left');
addTouch('btnRight', 'right');

const btnBoost = document.getElementById('btnBoost');
btnBoost.addEventListener('pointerdown', e => { e.preventDefault(); state.boostInput = true; });
btnBoost.addEventListener('pointerup', e => { e.preventDefault(); state.boostInput = false; });
btnBoost.addEventListener('pointerleave', e => { e.preventDefault(); state.boostInput = false; });

const wheelZone = document.getElementById('ctrl-wheel-group');
const wheelEl = document.getElementById('steeringWheel');
wheelZone.addEventListener('touchmove', e => {
    e.preventDefault(); e.stopPropagation();
    const touch = e.targetTouches[0];
    if (!touch) return;
    const rect = wheelZone.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = touch.clientX - cx;
    const dy = touch.clientY - cy;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    angle += 90;
    if (angle > 180) angle -= 360;
    angle = Math.max(-100, Math.min(100, angle));
    wheelEl.style.transform = `rotate(${angle}deg)`;
    input.steer = angle;
}, { passive: false });
wheelZone.addEventListener('touchend', (e) => {
    e.preventDefault();
    wheelEl.style.transform = `rotate(0deg)`;
    input.steer = 0;
});

// Start
initSettingsUI();
updateControlVisibility();
animate();
