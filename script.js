import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'; // Not used for this assignment but useful for future 3D models

// --- Scene Setup ---
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('canvas-container').appendChild(renderer.domElement);

// --- Loading Screen Management ---
const loadingScreen = document.getElementById('loading-screen');
const loadingManager = new THREE.LoadingManager();

// Update loading progress message
loadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
    loadingScreen.querySelector('p').textContent = `Loading: ${Math.round((itemsLoaded / itemsTotal) * 100)}%`;
};

// Hide loading screen when all resources are loaded
loadingManager.onLoad = function () {
    loadingScreen.style.display = 'none';
};

// Initialize TextureLoader with the loading manager
const textureLoader = new THREE.TextureLoader(loadingManager);

// --- Camera Initial Position ---
camera.position.set(0, 200, 400); // Adjust as needed for initial view
camera.lookAt(0, 0, 0); // Make camera look at the origin (where the Sun is)

// --- Orbit Controls ---
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; // Smooth camera movement
controls.dampingFactor = 0.05; // Amount of damping (lower = more damping)

// --- Lighting ---
// Ambient light provides general illumination, preventing completely dark areas.
const ambientLight = new THREE.AmbientLight(0x333333); // Soft ambient light, color 0x333333
scene.add(ambientLight);

// --- The Sun ---
const sunGeometry = new THREE.SphereGeometry(60, 64, 64); // Radius, width segments, height segments
const sunMaterial = new THREE.MeshBasicMaterial({
    // IMPORTANT: Ensure 'assets/textures/sun.jpg' exists and is correctly named.
    map: textureLoader.load('assets/textures/sun.jpg')
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

// Point light emanating from the Sun for realistic illumination of planets
const pointLight = new THREE.PointLight(0xffffff, 2, 10000); // Color (white), intensity, distance (how far light reaches)
sun.add(pointLight); // Add light as child of sun, so it moves with the sun (though sun is static)

// --- Planets Data ---
// This array holds all the necessary data for creating and animating each planet.
const planetsData = [
    // Corrected 'textures' to 'texture' to match usage below (data.texture)
    { name: 'Mercury', size: 4.87, distance: 80, orbitalSpeed: 0.008, selfRotationSpeed: 0.005, texture: 'mercury.jpg' },
    { name: 'Venus', size: 12.1, distance: 120, orbitalSpeed: 0.006, selfRotationSpeed: 0.003, texture: 'venus.jpg' },
    { name: 'Earth', size: 12.7, distance: 180, orbitalSpeed: 0.005, selfRotationSpeed: 0.01, texture: 'earth.jpg' },
    { name: 'Mars', size: 6.78, distance: 230, orbitalSpeed: 0.004, selfRotationSpeed: 0.009, texture: 'mars.jpg' },
    { name: 'Jupiter', size: 139.8, distance: 400, orbitalSpeed: 0.002, selfRotationSpeed: 0.02, texture: 'jupiter.jpg' },
    { name: 'Saturn', size: 116.4, distance: 600, orbitalSpeed: 0.0015, selfRotationSpeed: 0.018, texture: 'saturn.jpg', ringInnerRadius: 130, ringOuterRadius: 200, ringTexture: 'saturn-ring.png' }, // Ensure saturn-ring.png exists
    { name: 'Uranus', size: 50.7, distance: 800, orbitalSpeed: 0.001, selfRotationSpeed: 0.012, texture: 'uranus.jpg' },
    { name: 'Neptune', size: 49.2, distance: 1000, orbitalSpeed: 0.0008, selfRotationSpeed: 0.011, texture: 'neptune.jpg' }
];

const planets = []; // Array to store planet meshes for easy iteration

// --- Create Planets ---
planetsData.forEach(data => {
    const planetGeometry = new THREE.SphereGeometry(data.size / 2, 32, 32); // Sphere geometry for the planet
    const planetMaterial = new THREE.MeshLambertMaterial({ // LambertMaterial reacts to light sources
        // IMPORTANT: Ensure 'assets/textures/YOUR_PLANET_TEXTURE.jpg' exists and is correctly named.
        map: textureLoader.load(`assets/textures/${data.texture}`) // Dynamically load texture based on data
    });
    const planet = new THREE.Mesh(planetGeometry, planetMaterial);
    
    // Store custom data about the planet (e.g., speed, distance, current angle)
    planet.userData = {
        name: data.name,
        orbitalSpeed: data.orbitalSpeed,
        selfRotationSpeed: data.selfRotationSpeed,
        distance: data.distance,
        angle: 0 // Initialize current orbital angle
    };
    planet.position.x = data.distance; // Initial position along X-axis from the Sun

    // Create an orbital pivot for the planet. This allows the planet to rotate on its axis
    // while simultaneously orbiting the Sun correctly.
    const orbitalPivot = new THREE.Object3D(); // Empty object to act as the pivot
    orbitalPivot.add(planet); // Add the planet to the pivot
    scene.add(orbitalPivot); // Add the pivot to the scene
    planet.userData.orbitalPivot = orbitalPivot; // Store reference to the pivot for animation

    planets.push(planet); // Add planet to the main planets array

    // Add Saturn's ring if applicable
    if (data.name === 'Saturn' && data.ringInnerRadius && data.ringOuterRadius && data.ringTexture) {
        const ringGeometry = new THREE.RingGeometry(data.ringInnerRadius / 2, data.ringOuterRadius / 2, 64);
        const ringMaterial = new THREE.MeshBasicMaterial({
            // IMPORTANT: Ensure 'assets/textures/saturn-ring.png' (or .jpg) exists.
            map: textureLoader.load(`assets/textures/${data.ringTexture}`),
            side: THREE.DoubleSide, // Render both sides of the ring
            transparent: true // Allow transparency for the ring texture
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2; // Tilt the ring to simulate Saturn's axial tilt
        planet.add(ring); // Add ring as child of Saturn, so it moves with Saturn
    }
});

// --- Background Stars (Bonus) ---
const starGeometry = new THREE.SphereGeometry(5000, 32, 32); // Large sphere for the skybox
const starMaterial = new THREE.MeshBasicMaterial({
    // IMPORTANT: Ensure 'assets/textures/stars.jpg' exists.
    map: textureLoader.load('assets/textures/stars.jpg'),
    side: THREE.BackSide // Render the texture on the inside of the sphere
});
const stars = new THREE.Mesh(starGeometry, starMaterial);
scene.add(stars);

// --- Animation Loop ---
const clock = new THREE.Clock(); // Used to track time for frame-rate independent animation
let isPaused = false; // Flag to control animation pause/resume

function animate() {
    requestAnimationFrame(animate); // Request the next frame

    if (!isPaused) {
        const delta = clock.getDelta(); // Time elapsed since the last frame, in seconds

        // Sun's self-rotation
        sun.rotation.y += 0.001; // Constant rotation for the Sun

        // Animate planets
        planets.forEach(planet => {
            // Self-rotation of the planet
            planet.rotation.y += planet.userData.selfRotationSpeed;

            // Orbital animation around the Sun
            // Scale orbital speed by delta and a factor (60) for visible motion
            planet.userData.angle += planet.userData.orbitalSpeed * delta * 60;
            planet.userData.orbitalPivot.rotation.y = planet.userData.angle; // Rotate the pivot
        });
    }

    controls.update(); // Update orbit controls for camera damping
    renderer.render(scene, camera); // Render the scene from the camera's perspective
}

animate(); // Start the animation loop

// --- Speed Control Feature (JavaScript) ---
const planetSpeedControlsDiv = document.getElementById('planet-speed-controls');

// Dynamically create sliders for each planet
planets.forEach(planet => {
    const controlDiv = document.createElement('div');
    controlDiv.className = 'planet-control';

    const label = document.createElement('label');
    label.textContent = `${planet.userData.name} Speed:`;
    controlDiv.appendChild(label);

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.min = 0;
    slider.max = 0.02; // Maximum speed (adjust as needed)
    slider.step = 0.0001; // Granularity of the slider
    slider.value = planet.userData.orbitalSpeed; // Set initial slider value
    slider.id = `speed-${planet.userData.name.toLowerCase()}`; // Unique ID for each slider

    // Event listener to update planet's orbital speed when slider changes
    slider.addEventListener('input', (event) => {
        planet.userData.orbitalSpeed = parseFloat(event.target.value);
    });
    controlDiv.appendChild(slider);
    planetSpeedControlsDiv.appendChild(controlDiv);
});

// --- Pause/Resume Button (Bonus) ---
const pauseResumeBtn = document.getElementById('pauseResumeBtn');
pauseResumeBtn.addEventListener('click', () => {
    isPaused = !isPaused; // Toggle pause state
    pauseResumeBtn.textContent = isPaused ? 'Resume' : 'Pause'; // Update button text
});

// --- Dark/Light Toggle UI (Bonus) ---
const darkLightToggle = document.getElementById('darkLightToggle');
const body = document.body;
darkLightToggle.addEventListener('click', () => {
    body.classList.toggle('light-mode'); // Toggle 'light-mode' class on body
    darkLightToggle.textContent = body.classList.contains('light-mode') ? 'Dark Mode' : 'Light Mode'; // Update button text
});

// --- Labels/Tooltips on Hover (Bonus - Simplified HTML overlay) ---
const raycaster = new THREE.Raycaster(); // Used for detecting intersections with 3D objects
const mouse = new THREE.Vector2(); // Stores normalized mouse coordinates
const planetInfoDiv = document.getElementById('planet-info'); // HTML element for displaying planet info

let intersectedPlanet = null; // Stores the currently hovered planet

function onMouseMove(event) {
    // Convert mouse coordinates to normalized device coordinates (-1 to +1)
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the raycaster with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Find intersected objects (only check planets)
    const intersects = raycaster.intersectObjects(planets);

    if (intersects.length > 0) {
        const newIntersected = intersects[0].object;
        if (intersectedPlanet !== newIntersected) {
            intersectedPlanet = newIntersected;
            planetInfoDiv.textContent = intersectedPlanet.userData.name; // Display planet name
            planetInfoDiv.style.left = `${event.clientX + 10}px`; // Position info div near mouse
            planetInfoDiv.style.top = `${event.clientY + 10}px`;
            planetInfoDiv.classList.remove('hidden'); // Show info div
        }
    } else {
        if (intersectedPlanet) {
            intersectedPlanet = null;
            planetInfoDiv.classList.add('hidden'); // Hide info div if no planet is hovered
        }
    }
}

// --- Camera Movement or Zoom on Click (Bonus) ---
function onClick(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(planets);

    if (intersects.length > 0) {
        const clickedPlanet = intersects[0].object;
        const targetPosition = new THREE.Vector3();
        clickedPlanet.getWorldPosition(targetPosition); // Get the planet's world position

        // Calculate a new camera position that zooms in on the planet
        // Offset by 3 times the planet's radius to be a good distance away
        const offset = new THREE.Vector3(0, clickedPlanet.geometry.parameters.radius * 3, clickedPlanet.geometry.parameters.radius * 3);
        const newCameraPosition = targetPosition.clone().add(offset);

        // Smooth camera movement using basic linear interpolation (lerp)
        const startPosition = camera.position.clone();
        const startLookAt = controls.target.clone(); // Current point the camera is looking at

        const duration = 1000; // Animation duration in milliseconds
        const startTime = performance.now();

        function animateCamera() {
            const elapsedTime = performance.now() - startTime;
            const t = Math.min(1, elapsedTime / duration); // Easing factor (0 to 1)

            camera.position.lerpVectors(startPosition, newCameraPosition, t); // Interpolate camera position
            controls.target.lerpVectors(startLookAt, targetPosition, t); // Interpolate look-at target

            controls.update(); // Update controls after changing camera/target (important for damping)

            if (t < 1) { // Continue animation if not finished
                requestAnimationFrame(animateCamera);
            }
        }
        animateCamera(); // Start the camera animation
    }
}
// --- Event Listeners ---
window.addEventListener('mousemove', onMouseMove, false);
window.addEventListener('click', onClick, false);
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
