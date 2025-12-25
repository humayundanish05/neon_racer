import * as THREE from 'three';

export const CONFIG = {
  roadWidth: 20,
  laneWidth: 5, // 4 lanes total: -7.5, -2.5, 2.5, 7.5
  lanes: [-7.5, -2.5, 2.5, 7.5],
  fov: 60,
  camHeight: 5,
  camDist: 10,
  fogDist: 250,
  speed: 0,
  maxSpeed: 300,
  accel: 50,
  accelBoost: 120, // Nitro
  brake: 80,
  steerSpeed: 10
};

export const RES = {
    sportsGeo: new THREE.BoxGeometry(1.8, 0.7, 3.5),
    sedanGeo: new THREE.BoxGeometry(2, 1, 4),
    geoSUV: new THREE.BoxGeometry(2.0, 0.9, 4.6),
    geoTruckCab: new THREE.BoxGeometry(2.2, 1.2, 2.0),
    geoTruckTrailer: new THREE.BoxGeometry(2.4, 1.5, 6.0),
    geoBikeBody: new THREE.BoxGeometry(0.6, 0.6, 2.0),

    matSports: new THREE.MeshStandardMaterial({ color: 0xf1c40f }),
    matSedans: [
      new THREE.MeshStandardMaterial({ color: 0x3498db }),
      new THREE.MeshStandardMaterial({ color: 0xe74c3c }),
      new THREE.MeshStandardMaterial({ color: 0x9b59b6 }),
      new THREE.MeshStandardMaterial({ color: 0xecf0f1 })
    ],
    matSUVs: [
      new THREE.MeshStandardMaterial({ color: 0x2ecc71 }),
      new THREE.MeshStandardMaterial({ color: 0x95a5a6 }),
      new THREE.MeshStandardMaterial({ color: 0x34495e })
    ],
    matTruckCabs: [
      new THREE.MeshStandardMaterial({ color: 0xe67e22 }),
      new THREE.MeshStandardMaterial({ color: 0x1abc9c })
    ],
    matTruckTrailers: [
      new THREE.MeshStandardMaterial({ color: 0xbdc3c7 }),
      new THREE.MeshStandardMaterial({ color: 0x7f8c8d })
    ],
    matBikes: [
      new THREE.MeshStandardMaterial({ color: 0x9b59b6 }),
      new THREE.MeshStandardMaterial({ color: 0x3498db })
    ],
    matTailLight: new THREE.MeshStandardMaterial({ color: 0xff0000, emissive: 0xff0000, emissiveIntensity: 2 }),
    matHeadLight: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 2 }),

    matTreeLeaf: new THREE.MeshStandardMaterial({ color: 0x27ae60 }),
    matTreeTrunk: new THREE.MeshStandardMaterial({ color: 0x5d4037 }),
    matBuilding: new THREE.MeshStandardMaterial({ color: 0x2c3e50 }),
    matBuildingWin: new THREE.MeshStandardMaterial({ color: 0xf1c40f, emissive: 0xf1c40f, emissiveIntensity: 2 }),
    matCactus: new THREE.MeshStandardMaterial({ color: 0x2ecc71 }),
    matRock: new THREE.MeshStandardMaterial({ color: 0x7f8c8d }),
    matHouseWall: new THREE.MeshStandardMaterial({ color: 0xd35400 }),
    matHouseRoof: new THREE.MeshStandardMaterial({ color: 0x2c3e50 }),

    geoTreeTop: new THREE.ConeGeometry(3, 8, 8),
    geoTreeTrunk: new THREE.CylinderGeometry(0.8, 1, 3, 8),
    geoBuilding: new THREE.BoxGeometry(8, 20, 8),
    geoCactus: new THREE.CylinderGeometry(0.5, 0.5, 5, 8),
    geoRock: new THREE.DodecahedronGeometry(2),
    geoHouseWall: new THREE.BoxGeometry(6, 4, 6),
    geoHouseRoof: new THREE.ConeGeometry(5, 4, 4),
    geoIsland: new THREE.CylinderGeometry(15, 18, 2, 8),
    matIsland: new THREE.MeshStandardMaterial({ color: 0xe67e22 }),

    geoTraffPole: new THREE.CylinderGeometry(0.2, 0.2, 8, 8),
    geoTraffBox: new THREE.BoxGeometry(2, 0.8, 0.8),
    matTraffReady: new THREE.MeshStandardMaterial({ color: 0x333333 }),
    matTraffRed: new THREE.MeshBasicMaterial({ color: 0xff0000 }),
    matTraffGreen: new THREE.MeshBasicMaterial({ color: 0x00ff00 }),
    matTraffYellow: new THREE.MeshBasicMaterial({ color: 0xf1c40f }),
};
