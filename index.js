import * as THREE from "three";
import { OrbitControls } from 'jsm/controls/OrbitControls.js';

import getStarfield from "./src/getStarfield.js";
import { getFresnelMat } from "./src/getFresnelMat.js";

const w = window.innerWidth;
const h = window.innerHeight;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, w / h, 0.1, 1000);
camera.position.z = 4;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(w, h);
document.body.appendChild(renderer.domElement);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpace = THREE.LinearSRGBColorSpace;

const earthGroup = new THREE.Group();
earthGroup.rotation.z = -23.4 * Math.PI / 180;
scene.add(earthGroup);
new OrbitControls(camera, renderer.domElement);
const detail = 12;
const loader = new THREE.TextureLoader();
const geometry = new THREE.IcosahedronGeometry(1, detail);
const material = new THREE.MeshPhongMaterial({
  map: loader.load("./textures/00_earthmap1k.jpg"),
  specularMap: loader.load("./textures/02_earthspec1k.jpg"),
  bumpMap: loader.load("./textures/01_earthbump1k.jpg"),
  bumpScale: 0.04,
});
const earthMesh = new THREE.Mesh(geometry, material);
earthGroup.add(earthMesh);

const lightsMat = new THREE.MeshBasicMaterial({
  map: loader.load("./textures/03_earthlights1k.jpg"),
  blending: THREE.AdditiveBlending,
});
const lightsMesh = new THREE.Mesh(geometry, lightsMat);
earthGroup.add(lightsMesh);

const cloudsMat = new THREE.MeshStandardMaterial({
  map: loader.load("./textures/04_earthcloudmap.jpg"),
  transparent: true,
  opacity: 0.8,
  blending: THREE.AdditiveBlending,
  alphaMap: loader.load('./textures/05_earthcloudmaptrans.jpg'),
});
const cloudsMesh = new THREE.Mesh(geometry, cloudsMat);
cloudsMesh.scale.setScalar(1.003);
earthGroup.add(cloudsMesh);

const fresnelMat = getFresnelMat();
const glowMesh = new THREE.Mesh(geometry, fresnelMat);
glowMesh.scale.setScalar(1.01);
earthGroup.add(glowMesh);

const stars = getStarfield({ numStars: 2000 });
scene.add(stars);

const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
sunLight.position.set(-2, 0.5, 1.5);
scene.add(sunLight);

// Create a canvas texture for the text
const textCanvas = document.createElement('canvas');
const context = textCanvas.getContext('2d');
textCanvas.width = 512;
textCanvas.height = 256;
context.font = '60px Arial';
context.fillStyle = 'white';
context.textAlign = 'center';
context.fillText('Earth', textCanvas.width / 2, textCanvas.height / 2);

const textTexture = new THREE.CanvasTexture(textCanvas);
const textMaterial = new THREE.SpriteMaterial({ map: textTexture });
const textSprite = new THREE.Sprite(textMaterial);
textSprite.scale.set(2, 1, 1);
textSprite.position.set(0, 2, 0);
scene.add(textSprite);

// Create realistic debris group
const debrisGroup = new THREE.Group();
scene.add(debrisGroup);

// Raycaster and mouse setup
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Create a div element for displaying debris details
const debrisDetails = document.createElement('div');
debrisDetails.style.position = 'absolute';
debrisDetails.style.backgroundColor = 'rgba(0,0,0,0.7)';
debrisDetails.style.color = 'white';
debrisDetails.style.padding = '5px';
debrisDetails.style.display = 'none';
document.body.appendChild(debrisDetails);

function createDebris() {
  const debrisTexture = loader.load("./textures/debris_texture.jpg"); // Use a custom debris texture
  const debrisShapes = [
    new THREE.BoxGeometry(0.1, 0.1, 0.1),
    new THREE.SphereGeometry(0.05, 8, 8),
    new THREE.TetrahedronGeometry(0.07),
    new THREE.CylinderGeometry(0.05, 0.05, 0.2, 12)
  ];

  const debrisMaterial = new THREE.MeshStandardMaterial({ map: debrisTexture });
  const debrisCount = 100;

  for (let i = 0; i < debrisCount; i++) {
    // Randomly choose a shape for the debris
    const debrisGeometry = debrisShapes[Math.floor(Math.random() * debrisShapes.length)];
    const debris = new THREE.Mesh(debrisGeometry, debrisMaterial);

    // Set random position around Earth
    debris.position.set(
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 4,
      (Math.random() - 0.5) * 4
    );

    // Set random rotation
    debris.rotation.set(
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI
    );

    // Set random scaling for variation
    debris.scale.setScalar(Math.random() * 0.5 + 0.1);

    // Calculate distance from Earth (assuming Earth is at (0,0,0))
    const distanceFromEarth = debris.position.length();

    // Add custom metadata to each debris piece
    debris.userData = {
      name: `Debris ${i + 1}`,
      type: "Space Debris",
      id: i + 1,
      weight: `${(Math.random() * 50 + 10).toFixed(2)} kg`, // Random weight between 10 and 60 kg
      dimensions: `${(debris.scale.x * 10).toFixed(1)}m x ${(debris.scale.y * 10).toFixed(1)}m x ${(debris.scale.z * 10).toFixed(1)}m`, // Scaled dimensions
      distance: `${distanceFromEarth.toFixed(2)} AU`
    };

    debrisGroup.add(debris);
  }
}

// Create a moon or celestial body
const moonGeometry = new THREE.SphereGeometry(0.27, 16, 16);
const moonTexture = loader.load("./textures/moon_texture.jpg"); // Use a moon texture
const moonMaterial = new THREE.MeshPhongMaterial({ map: moonTexture });
const moonMesh = new THREE.Mesh(moonGeometry, moonMaterial);
moonMesh.position.set(2.5, 0, 0);
scene.add(moonMesh);

// Call the function to create debris around the Earth
createDebris();

function animate() {
  requestAnimationFrame(animate);

  earthMesh.rotation.y += 0.002;
  lightsMesh.rotation.y += 0.002;
  cloudsMesh.rotation.y += 0.0023;
  glowMesh.rotation.y += 0.002;
  stars.rotation.y -= 0.0002;

  debrisGroup.rotation.y += 0.001; // Rotate debris around Earth

  // Rotate the moon around the Earth
  moonMesh.position.x = Math.cos(Date.now() * 0.001) * 2.5;
  moonMesh.position.z = Math.sin(Date.now() * 0.001) * 2.5;

  renderer.render(scene, camera);
}

animate();

function handleWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', handleWindowResize, false);

// Mouse move event to update raycaster
window.addEventListener('mousemove', (event) => {
  // Convert mouse position to normalized device coordinates (-1 to +1) for both x and y
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Use raycaster to check intersections
  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(debrisGroup.children);

  if (intersects.length > 0) {
    // Get the first intersected object
    const intersectedDebris = intersects[0].object;

    // Display details about the debris
    debrisDetails.style.display = 'block';
    debrisDetails.style.left = `${event.clientX + 10}px`;
    debrisDetails.style.top = `${event.clientY + 10}px`;
    debrisDetails.innerHTML = `<b>${intersectedDebris.userData.name}</b><br>
                               Type: ${intersectedDebris.userData.type}<br>
                               ID: ${intersectedDebris.userData.id}<br>
                               Weight: ${intersectedDebris.userData.weight}<br>
                               Dimensions: ${intersectedDebris.userData.dimensions}<br>
                               Distance: ${intersectedDebris.userData.distance}`;
  } else {
    // Hide the debris details if not hovering over any debris
    debrisDetails.style.display = 'none';
  }
});
