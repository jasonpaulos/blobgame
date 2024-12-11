import * as THREE from 'three';
import gsap from 'gsap';
import { QLearning, Action } from './qlearning';

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

// Define the boundaries of the grid
const gridSize = 5;
const gridMinX = -Math.floor(gridSize / 2);
const gridMaxX = Math.floor(gridSize / 2);
const gridMinZ = -Math.floor(gridSize / 2);
const gridMaxZ = Math.floor(gridSize / 2);

// Create a grid floor
const gridHelper = new THREE.GridHelper(gridSize, gridSize);
gridHelper.position.set(0, -0.5, 0); // Position the grid at the center of the scene
scene.add(gridHelper);

// // Create a 1x1 cube in the back corner with each face a different color
// const geometry = new THREE.BoxGeometry(1, 1, 1);
// const materials = [
//     new THREE.MeshBasicMaterial({ color: 0xff0000 }), // Red
//     new THREE.MeshBasicMaterial({ color: 0x00ff00 }), // Green
//     new THREE.MeshBasicMaterial({ color: 0x0000ff }), // Blue
//     new THREE.MeshBasicMaterial({ color: 0xff00ff }), // Magenta
//     new THREE.MeshBasicMaterial({ color: 0xffff00 }), // Yellow
//     new THREE.MeshBasicMaterial({ color: 0x00ffff })  // Cyan
// ];
// const cube = new THREE.Mesh(geometry, materials);
// cube.position.set(-2, 0, -2); // Position the cube in the back corner
// // cube.renderOrder = 1; // Render the cube after the grid
// scene.add(cube);

// Create a 1x1x1 blob shape
const blobGeometry = new THREE.SphereGeometry(0.5, 32, 32); // Radius 0.5, 32 segments for smoothness
const blobMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00, roughness: 0.5, metalness: 0.1 });
const blob = new THREE.Mesh(blobGeometry, blobMaterial);
blob.position.set(2, 0, 2); // Position the blob in the scene
scene.add(blob);

// Add a point light source for better visibility of the blob
const light = new THREE.PointLight(0xffffff, 100, 100);
light.position.set(5, 5, 0);
scene.add(light);

// Add an ambient light for uniform lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Initialize Q-learning
const qLearning = new QLearning({ alpha: 0.1, gamma: 0.9, epsilon: 1, epsilonDecaryRate: 0.999 });

// Create arrows for each grid cell
const arrows: THREE.ArrowHelper[][] = [];
for (let x = gridMinX; x <= gridMaxX; x++) {
    const row: THREE.ArrowHelper[] = [];
    for (let z = gridMinZ; z <= gridMaxZ; z++) {
        const dir = new THREE.Vector3(0, 1, 0); // Initial direction
        const origin = new THREE.Vector3(x, -0.4, z); // Slightly above the grid
        const length = 0.1;
        const color = 0xffff00;
        const arrow = new THREE.ArrowHelper(dir, origin, length, color, 0.2, 0.1);
        scene.add(arrow);
        row.push(arrow);
    }
    arrows.push(row);
}

const actionToDirection = new Map<Action, THREE.Vector3>([
    ['forward', new THREE.Vector3(0, 0, 1)],
    ['backward', new THREE.Vector3(0, 0, -1)],
    ['left', new THREE.Vector3(-1, 0, 0)],
    ['right', new THREE.Vector3(1, 0, 0)],
    ['jump', new THREE.Vector3(0, 1, 0)]
]);

// Function to update arrows based on Q-values
function updateArrows() {
    for (let x = gridMinX; x <= gridMaxX; x++) {
        for (let z = gridMinZ; z <= gridMaxZ; z++) {
            const arrow = arrows[x - gridMinX][z - gridMinZ];
            const spread = qLearning.getActionSpread(x, z);
            const totalDirection = new THREE.Vector3(0, 0, 0);
            for (const [action, value] of spread.entries()) {
                const direction = actionToDirection.get(action)!;
                totalDirection.addScaledVector(direction, value);
            }
            const normalized = totalDirection.normalize();
            arrow.setDirection(normalized);
            if (normalized.length() !== 0) {
                arrow.setLength(0.5, 0.2, 0.1);
            } else {
                arrow.setLength(0.1, 0.2, 0.1);
            }
        }
    }
}

let running = false;

function toggleStart() {
    if (running) {
        running = false;
        document.getElementById('startButton')!.textContent = 'Continue';
        return;
    }
    running = true;
    step();
    document.getElementById('startButton')!.textContent = 'Pause';
}

let round = 0;

function step() {
    if (!running) return;

    const stepDuration = parseInt((document.getElementById('stepDuration') as HTMLSelectElement).value, 10);

    const action = qLearning.chooseAction(blob.position.x, blob.position.z);
    let newX = blob.position.x;
    let newZ = blob.position.z;
    let reward = -1;

    console.log(`Choosing action: ${action}`);

    switch (action) {
        case 'forward':
            newZ += 1;
            break;
        case 'backward':
            newZ -= 1;
            break;
        case 'left':
            newX -= 1;
            break;
        case 'right':
            newX += 1;
            break;
        case 'jump':
            if (blob.position.x === 0 && blob.position.z === 0) {
                reward = 10; // Reward for jumping in the center
            }
            break;
    }

    console.log(`Moving to: (${newX}, ${newZ})`);

    // Check if the new position is within the boundaries
    if (newX >= -gridSize / 2 && newX <= gridSize / 2 && newZ >= -gridSize / 2 && newZ <= gridSize / 2) {
        if (action === 'jump') {
            // Animate the jump
            gsap.to(blob.position, { y: 1, duration: stepDuration / 1000 / 2, yoyo: true, repeat: 1});
        } else {
            gsap.to(blob.position, { x: newX, z: newZ, duration: stepDuration / 1000 });
        }
        qLearning.updateQTable(blob.position.x, blob.position.z, action, reward, newX, newZ);
    } else {
        reward = -10; // Reward for hitting the wall
        qLearning.updateQTable(blob.position.x, blob.position.z, action, reward, blob.position.x, blob.position.z);
    }

    updateArrows(); // Update arrows after each move

    document.getElementById('round')!.textContent = round.toString();
    document.getElementById('epsilon')!.textContent = qLearning.epsilon.toFixed(3);
    document.getElementById('currentState')!.textContent = `(${newX}, ${newZ})`;
    document.getElementById('lastAction')!.textContent = action;

    round++;

    setTimeout(step, stepDuration + 100);
}

// Add event listener to the button
document.getElementById('startButton')!.addEventListener('click', toggleStart);

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
