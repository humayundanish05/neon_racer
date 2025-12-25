import * as THREE from 'three';
import { RES } from './constants.js';
import { scene, applyBend } from './world.js';
import { userSettings } from './state.js';

// Apply Bend to ALL RES Materials ONCE
Object.values(RES).forEach(val => {
    if (val instanceof THREE.Material) applyBend(val);
    else if (Array.isArray(val)) val.forEach(m => applyBend(m));
});

export const carGroup = new THREE.Group();
scene.add(carGroup);

// Headlights
const spotL = new THREE.SpotLight(0xffffff, 4.0);
spotL.position.set(0, 1.0, 1.0);
spotL.target.position.set(0, 0, -20);
spotL.angle = Math.PI / 6;
spotL.penumbra = 0.2;
spotL.distance = 150;
carGroup.add(spotL);
carGroup.add(spotL.target);

export let playerCar;

export function updatePlayerCar() {
    if (playerCar) carGroup.remove(playerCar);
    playerCar = createRealisticCar(userSettings.type, userSettings.color);
    carGroup.add(playerCar);
}

export function createRealisticCar(type, colorHex) {
    const car = new THREE.Group();
    const bodyColor = new THREE.Color(colorHex);
    const paintMat = new THREE.MeshPhysicalMaterial({
        color: bodyColor, metalness: 0.6, roughness: 0.2, clearcoat: 1.0, clearcoatRoughness: 0.1
    });
    const glassMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.0, metalness: 0.8 });
    const detailMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8 });

    applyBend(paintMat);
    applyBend(glassMat);
    applyBend(detailMat);

    let chassis, cabin;

    // GEOMETRY GENERATION
    if (type === 'muscle') {
        chassis = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.7, 4.6), paintMat);
        chassis.position.y = 0.65;
        cabin = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 2.8), glassMat);
        cabin.position.set(0, 1.25, 0.1);
    } else if (type === 'suv') {
        chassis = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.9, 4.8), paintMat);
        chassis.position.y = 0.8;
        cabin = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.7, 3.2), glassMat);
        cabin.position.set(0, 1.6, 0);
    } else if (type === 'truck') {
        chassis = new THREE.Mesh(new THREE.BoxGeometry(2.3, 0.9, 5.0), paintMat);
        chassis.position.y = 0.85;
        cabin = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.8, 2.0), glassMat);
        cabin.position.set(0, 1.6, -0.6);
        const bed = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.5, 2.2), detailMat);
        bed.position.set(0, 1.2, 1.5);
        car.add(bed);
    } else if (type === 'f1') {
        chassis = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.4, 4.8), paintMat);
        chassis.position.y = 0.4;
        cabin = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.3, 1.0), glassMat);
        cabin.position.set(0, 0.7, -0.2);
        // Spoilers
        const spoilF = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 0.5), detailMat);
        spoilF.position.set(0, 0.3, -2.4);
        const spoilR = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.1, 0.5), detailMat);
        spoilR.position.set(0, 0.9, 2.2);
        car.add(spoilF, spoilR);
    } else {
        // Racer
        chassis = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.6, 4.2), paintMat);
        chassis.position.y = 0.6;
        cabin = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 2.4), glassMat);
        cabin.position.set(0, 1.15, 0.2);
    }

    car.add(chassis, cabin);

    // Grille
    const grille = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.4, 0.1), detailMat);
    grille.position.set(0, 0.6, -chassis.geometry.parameters.depth / 2 - 0.05);
    car.add(grille);

    // Side Mirrors
    const mirGeo = new THREE.BoxGeometry(0.3, 0.2, 0.2);
    const mirL = new THREE.Mesh(mirGeo, paintMat);
    mirL.position.set(- (chassis.geometry.parameters.width / 2 + 0.15), 1.0, -0.5);
    const mirR = new THREE.Mesh(mirGeo, paintMat);
    mirR.position.set((chassis.geometry.parameters.width / 2 + 0.15), 1.0, -0.5);
    car.add(mirL, mirR);

    // Lights
    const hlMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2.0 });
    const hlL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.1), hlMat);
    const hlR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.1), hlMat);
    hlL.position.set(-0.6, 0.7, -chassis.geometry.parameters.depth / 2);
    hlR.position.set(0.6, 0.7, -chassis.geometry.parameters.depth / 2);
    car.add(hlL, hlR);

    const tlMat = new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 1.0 });
    const tlL = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.1), tlMat);
    const tlR = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.2, 0.1), tlMat);
    tlL.position.set(-0.6, 0.7, chassis.geometry.parameters.depth / 2);
    tlR.position.set(0.6, 0.7, chassis.geometry.parameters.depth / 2);
    car.add(tlL, tlR);

    // WHEELS
    const wGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.4, 16);
    const wMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
    const rimGeo = new THREE.CylinderGeometry(0.2, 0.2, 0.42, 8);
    const rimMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.8 });
    applyBend(wMat);
    applyBend(rimMat); // Fix wheels bending

    const positions = [
        [0.85, 0.35, 1.2], [-0.85, 0.35, 1.2],
        [0.85, 0.35, -1.2], [-0.85, 0.35, -1.2]
    ];
    positions.forEach(pos => {
        const wGroup = new THREE.Group();
        const tire = new THREE.Mesh(wGeo, wMat);
        tire.rotation.z = Math.PI / 2;
        const rim = new THREE.Mesh(rimGeo, rimMat);
        rim.rotation.z = Math.PI / 2;
        wGroup.add(tire, rim);
        wGroup.position.set(...pos);
        if (type === 'f1') wGroup.position.x *= 1.2;
        car.add(wGroup);
    });

    return car;
}

export class SimplePool {
    constructor(createFn, count) {
        this.pool = [];
        this.active = [];
        for (let i = 0; i < count; i++) {
            const obj = createFn();
            obj.visible = false;
            obj.userData.poolId = i;
            scene.add(obj);
            this.pool.push(obj);
        }
    }
    get() {
        if (this.pool.length === 0) return null;
        const obj = this.pool.pop();
        obj.visible = true;
        this.active.push(obj);
        return obj;
    }
    release(obj) {
        obj.visible = false;
        const idx = this.active.indexOf(obj);
        if (idx > -1) this.active.splice(idx, 1);
        this.pool.push(obj);
    }
    reset() {
        [...this.active].forEach(o => this.release(o));
    }
}

// --- POOLS ---
export const poolSports = new SimplePool(() => {
    const car = createRealisticCar('racer', '#f1c40f');
    car.userData.type = 'sports'; return car;
}, 10);
export const poolSedans = new SimplePool(() => {
    const color = RES.matSedans[Math.floor(Math.random() * RES.matSedans.length)].color.getHexString();
    const car = createRealisticCar('sedan', '#' + color);
    car.userData.type = 'sedan'; return car;
}, 10);
export const poolSUV = new SimplePool(() => {
    const color = RES.matSUVs[Math.floor(Math.random() * RES.matSUVs.length)].color.getHexString();
    const car = createRealisticCar('suv', '#' + color);
    car.userData.type = 'suv'; return car;
}, 10);
export const poolTruck = new SimplePool(() => {
    const car = createRealisticCar('truck', '#e67e22');
    car.userData.type = 'truck'; return car;
}, 5);
export const poolBike = new SimplePool(() => {
    const mesh = new THREE.Mesh(RES.geoBikeBody, RES.matBikes[0]);
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.1), RES.matTailLight); t.position.set(0, 0.3, 1.0); mesh.add(t);
    const h = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.1, 0.1), RES.matHeadLight); h.position.set(0, 0.3, -1.0); mesh.add(h);
    mesh.userData.type = 'bike'; return mesh;
}, 10);

export const poolScenery = new SimplePool(() => {
    const group = new THREE.Group();
    // Simplified construction for brevity, assume similar to original
    const tree = new THREE.Group();
    tree.add(new THREE.Mesh(RES.geoTreeTop, RES.matTreeLeaf), new THREE.Mesh(RES.geoTreeTrunk, RES.matTreeTrunk));
    tree.children[0].position.y = 5.5; tree.children[1].position.y = 1.5;
    tree.visible = false; tree.name = 'tree'; group.add(tree);

    const b = new THREE.Mesh(RES.geoBuilding, RES.matBuilding); b.position.y = 10; b.visible = false; b.name = 'building'; group.add(b);
    const c = new THREE.Mesh(RES.geoCactus, RES.matCactus); c.position.y = 2.5; c.visible = false; c.name = 'cactus'; group.add(c);
    const r = new THREE.Mesh(RES.geoRock, RES.matRock); r.position.y = 1; r.visible = false; r.name = 'rock'; group.add(r);

    const h = new THREE.Group();
    const w = new THREE.Mesh(RES.geoHouseWall, RES.matHouseWall); w.position.y = 2;
    const rf = new THREE.Mesh(RES.geoHouseRoof, RES.matHouseRoof); rf.position.y = 5.5; rf.rotation.y = Math.PI / 4;
    h.add(w, rf); h.visible = false; h.name = 'house'; group.add(h);

    // Island
    const isle = new THREE.Mesh(RES.geoIsland, RES.matIsland); isle.position.y = 1; isle.visible = false; isle.name = 'island'; group.add(isle);

    // Light
    const tl = new THREE.Group();
    tl.add(new THREE.Mesh(RES.geoTraffPole, RES.matTraffReady), new THREE.Mesh(RES.geoTraffBox, RES.matTraffReady));
    tl.children[0].position.y = 4; tl.children[1].position.set(0, 7, 0);
    tl.visible = false; tl.name = 'trafficlight'; group.add(tl);

    return group;
}, 30);

// --- PARTICLES ---
const particleGeo = new THREE.PlaneGeometry(0.5, 0.5);
const particleMat = new THREE.MeshBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending });
export const particles = [];

export function spawnBoostParticle() {
    const p = new THREE.Mesh(particleGeo, particleMat);
    p.position.copy(carGroup.position);
    p.position.z += 1.5;
    p.position.y += 0.5;
    p.position.x += (Math.random() - 0.5) * 1.0;
    scene.add(p);
    particles.push({ mesh: p, life: 1.0 });
}
