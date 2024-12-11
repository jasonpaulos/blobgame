import * as THREE from 'three';

// Create the scene
const scene = new THREE.Scene();

// Create an orthographic camera for isometric projection
const aspect = window.innerWidth / window.innerHeight;
const d = 10;
const camera = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 1, 1000);
camera.position.set(d, d, d); // Position the camera
camera.lookAt(new THREE.Vector3(0, 0, 0)); // Look at the center of the scene

// Create the renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create a 5x5 grid floor
const gridHelper = new THREE.GridHelper(5, 5);
gridHelper.position.set(0, -0.5, 0); // Position the grid at the center of the scene
scene.add(gridHelper);

// Create a 1x1 cube in the back corner with each face a different color
const geometry = new THREE.BoxGeometry(1, 1, 1);
const materials = [
    new THREE.MeshBasicMaterial({ color: 0xff0000 }), // Red
    new THREE.MeshBasicMaterial({ color: 0x00ff00 }), // Green
    new THREE.MeshBasicMaterial({ color: 0x0000ff }), // Blue
    new THREE.MeshBasicMaterial({ color: 0xff00ff }), // Magenta
    new THREE.MeshBasicMaterial({ color: 0xffff00 }), // Yellow
    new THREE.MeshBasicMaterial({ color: 0x00ffff })  // Cyan
];
const cube = new THREE.Mesh(geometry, materials);
cube.position.set(-2, 0, -2); // Position the cube in the back corner
// cube.renderOrder = 1; // Render the cube after the grid
scene.add(cube);

// Create a 1x1x1 blob shape
const blobGeometry = new THREE.SphereGeometry(0.5, 32, 32); // Radius 0.5, 32 segments for smoothness
const blobMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00, roughness: 0.5, metalness: 0.1 });
const blob = new THREE.Mesh(blobGeometry, blobMaterial);
// blob.position.set(2, 0, 2); // Position the blob in the scene
scene.add(blob);

// Add a point light source for better visibility of the blob
const light = new THREE.PointLight(0xffffff, 100, 100);
light.position.set(5, 5, 0);
scene.add(light);

// Add an ambient light for uniform lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Render the scene
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener('resize', () => {
    const aspect = window.innerWidth / window.innerHeight;
    camera.left = -d * aspect;
    camera.right = d * aspect;
    camera.top = d;
    camera.bottom = -d;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
