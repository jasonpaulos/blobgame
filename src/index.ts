import * as THREE from "three";
import gsap from "gsap";
import { Game, PlayerAction, RewardPolicy } from "./game";
import { QLearningPlayerController } from "./qlearning";
import { ReinforceJSPlayerController } from "./reinforce";
import { AutoRewardPolicy, ManualRewardPolicy } from "./rewardPolicies";

// Create the scene
const scene = new THREE.Scene();

// Create an orthographic camera for isometric projection
const aspect = window.innerWidth / window.innerHeight;
const d = 10;
const camera = new THREE.OrthographicCamera(
  -d * aspect,
  d * aspect,
  d,
  -d,
  1,
  1000,
);
camera.position.set(d, d, d); // Position the camera
camera.lookAt(new THREE.Vector3(0, 0, 0)); // Look at the center of the scene

// Create the renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Define the boundaries of the grid
const gridSize = 7; // Must be an odd number
const gridMinX = -Math.floor(gridSize / 2);
const gridMaxX = Math.floor(gridSize / 2);
const gridMinZ = -Math.floor(gridSize / 2);
const gridMaxZ = Math.floor(gridSize / 2);

const learningController = new QLearningPlayerController({
  alpha: 0.1,
  gamma: 0.9,
  maxEpsilon: 1,
  minEpsilon: 0.1,
  epsilonDecayPeriod: /*1200*/ 100,
});
// const learningController = new ReinforceJSPlayerController();

const rewardPolicy = new ManualRewardPolicy();
// const rewardPolicy = new AutoRewardPolicy();

const game = new Game({
  gridLengthX: gridSize,
  gridLengthZ: gridSize,
  player: {
    controller: learningController,
    state: {
      xPosition: Math.floor(gridSize / 2),
      zPosition: Math.floor(gridSize / 2),
    },
  },
  rewardPolicy,
});

function gamePositionToThreePosition(x: number, z: number): THREE.Vector3 {
  return new THREE.Vector3(x + gridMinX, 0, z + gridMinZ);
}

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
const blobMaterial = new THREE.MeshStandardMaterial({
  color: 0x00ff00,
  roughness: 0.5,
  metalness: 0.1,
});
const blob = new THREE.Mesh(blobGeometry, blobMaterial);
const blobPosition = gamePositionToThreePosition(
  game.player.state.xPosition,
  game.player.state.zPosition,
);
blob.position.set(blobPosition.x, blobPosition.y, blobPosition.z);
scene.add(blob);

// Add a point light source for better visibility of the blob
const light = new THREE.PointLight(0xffffff, 100, 100);
light.position.set(5, 5, 0);
scene.add(light);

// Add an ambient light for uniform lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

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

const actionToDirection = new Map<PlayerAction, THREE.Vector3>([
  [PlayerAction.MOVE_Z_POSITIVE, new THREE.Vector3(0, 0, 1)],
  [PlayerAction.MOVE_Z_NEGATIVE, new THREE.Vector3(0, 0, -1)],
  [PlayerAction.MOVE_X_NEGATIVE, new THREE.Vector3(-1, 0, 0)],
  [PlayerAction.MOVE_X_POSITIVE, new THREE.Vector3(1, 0, 0)],
  [PlayerAction.JUMP, new THREE.Vector3(0, 1, 0)],
]);

// Function to update arrows based on Q-values
function updateArrows() {
  for (let x = 0; x < game.gridLengthX; x++) {
    for (let z = 0; z < game.gridLengthZ; z++) {
      const arrow = arrows[x][z];
      const spread = learningController.getActionSpread(x, z);
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

function playerActionToString(action: PlayerAction): string {
  switch (action) {
    case PlayerAction.MOVE_X_POSITIVE:
      return "Move positive x";
    case PlayerAction.MOVE_X_NEGATIVE:
      return "Move negative x";
    case PlayerAction.MOVE_Z_POSITIVE:
      return "Move positive z";
    case PlayerAction.MOVE_Z_NEGATIVE:
      return "Move negative z";
    case PlayerAction.JUMP:
      return "Jump";
  }
}

function updateManualReward(value: number) {
  const policy: RewardPolicy = rewardPolicy;
  if (policy instanceof ManualRewardPolicy) {
    policy.setReward(value);
    document.getElementById("currentReward")!.textContent = value.toString();
  }
}

if (!(rewardPolicy instanceof ManualRewardPolicy)) {
  document.getElementById("currentReward")!.textContent = "auto";
} else {
  document.getElementById("currentReward")!.textContent = "0";
}

let autoplay = false;

function toggleAutoplay() {
  autoplay = (document.getElementById("autoplayCheckbox") as HTMLInputElement)
    .checked;
  if (autoplay) {
    step();
  }
}

let fastForwardRounds = 0;

function fastForward() {
  if (fastForwardRounds === 0) {
    fastForwardRounds = 100;
    step();
  }
}

let round = 0;

function step() {
  const stepDuration =
    fastForwardRounds > 0
      ? undefined
      : parseInt(
          (document.getElementById("stepDuration") as HTMLSelectElement).value,
          10,
        );

  const result = game.takeTurn();

  updateManualReward(0);

  if (stepDuration !== undefined) {
    const newPlayerPosition = gamePositionToThreePosition(
      result.newPlayerState.xPosition,
      result.newPlayerState.zPosition,
    );
    if (result.playerAction === PlayerAction.JUMP) {
      blob.position.x = newPlayerPosition.x;
      blob.position.y = 0;
      blob.position.z = newPlayerPosition.z;
      gsap.to(blob.position, {
        y: 1,
        duration: stepDuration / 1000 / 2,
        yoyo: true,
        repeat: 1,
      });
    } else {
      blob.position.y = 0;
      gsap.to(blob.position, {
        x: newPlayerPosition.x,
        z: newPlayerPosition.z,
        duration: stepDuration / 1000,
      });
    }

    updateArrows(); // Update arrows after each turn

    document.getElementById("round")!.textContent = round.toString();
    document.getElementById("epsilon")!.textContent = learningController
      .getEpsilon()
      .toFixed(3);
    document.getElementById("currentState")!.textContent =
      `(${result.newPlayerState.xPosition}, ${result.newPlayerState.zPosition})`;
    document.getElementById("lastAction")!.textContent = playerActionToString(
      result.playerAction,
    );
  }

  round++;

  if (autoplay || fastForwardRounds > 0) {
    if (stepDuration !== undefined) {
      setTimeout(step, stepDuration + 100);
    } else {
      fastForwardRounds--;
      setTimeout(step, 0);
    }
  }
}

// Add event listeners
document
  .getElementById("autoplayCheckbox")!
  .addEventListener("change", toggleAutoplay);
document.getElementById("nextRoundButton")!.addEventListener("click", step);
document
  .getElementById("fastForwardButton")!
  .addEventListener("click", fastForward);

for (const rewardValue of [-100, -10, -1, 0, 1, 10, 100]) {
  let qualifier = "";
  if (rewardValue < 0) {
    qualifier = "Minus";
  } else if (rewardValue > 0) {
    qualifier = "Plus";
  }
  document
    .getElementById(`setReward${qualifier}${Math.abs(rewardValue)}`)!
    .addEventListener("click", () => updateManualReward(rewardValue));
}

// Add event listener for keydown event
document.addEventListener("keydown", (event) => {
  if (event.key === "n") {
    step();
  }
});

// Render the scene
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// Handle window resize
window.addEventListener("resize", () => {
  const aspect = window.innerWidth / window.innerHeight;
  camera.left = -d * aspect;
  camera.right = d * aspect;
  camera.top = d;
  camera.bottom = -d;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
