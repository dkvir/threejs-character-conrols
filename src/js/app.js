/* Demo JS */
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
import { gsap } from 'gsap';
import { DoubleSide, EquirectangularRefractionMapping } from 'three';
import { AnimationUtils } from 'three';
import { KeyDisplay } from './utils';
import { CharacterControls } from './characterControls';

//variables
const canvas = document.querySelector('.canvas');
const keyPressed = {}
const keyDisplay = new KeyDisplay();
const clock = new THREE.Clock();
let characterControls, running;

//loaders
const gltfLoader = new GLTFLoader();

// SCENE
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xa8def0);

// CAMERA
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.y = 5;
camera.position.z = 5;
camera.position.x = 0;

// RENDERER
const renderer = new THREE.WebGLRenderer({ antialias: true, canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
renderer.shadowMap.enabled = true

// CONTROLS
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true
orbitControls.minDistance = 5
orbitControls.maxDistance = 15
orbitControls.enablePan = false
orbitControls.maxPolarAngle = Math.PI / 2 - 0.05
orbitControls.update();

// LIGHTS
light()

// FLOOR
generateFloor();

//eventListeners
addEventListeners();

//glft

gltfLoader.load('/models/Soldier.glb', function(gltf){
  const model = gltf.scene;
  model.traverse(function(object){
    if(object.isMesh) object.castShadow = true;
  })

  scene.add(model);

  const gltfAnimations = gltf.animations;
  const mixer = new THREE.AnimationMixer(model);
  const animationMap = new Map();
  gltfAnimations.filter(a=>a.name !='TPose').forEach((a)=>{
    animationMap.set(a.name, mixer.clipAction(a));
  })
  characterControls = new CharacterControls(model, mixer, animationMap, orbitControls, camera, 'Idle');
})


animate();

function animate() {
  let mixerUpdateDelta = clock.getDelta();
  if(characterControls) characterControls.update(mixerUpdateDelta, keyPressed)

  orbitControls.update()
  renderer.render(scene, camera);
  renderer.setAnimationLoop(animate);
}

function generateFloor() {
  // TEXTURES
  const textureLoader = new THREE.TextureLoader();
  const placeholder = textureLoader.load("./textures/placeholder/placeholder.png");

  const geometry = new THREE.PlaneGeometry(80, 80, 512, 512);
  const material = new THREE.MeshStandardMaterial({map: placeholder})

  wrapAndRepeatTexture(material.map)

  const floor = new THREE.Mesh(geometry, material)
  floor.receiveShadow = true
  floor.rotation.x = - Math.PI / 2
  scene.add(floor)
}

function wrapAndRepeatTexture (map) {
  map.wrapS = map.wrapT = THREE.RepeatWrapping
  map.repeat.x = map.repeat.y = 10
}

function light() {
  scene.add(new THREE.AmbientLight(0xffffff, 0.7))

  const dirLight = new THREE.DirectionalLight(0xffffff, 1)
  dirLight.position.set(- 60, 100, - 10);
  dirLight.castShadow = true;
  dirLight.shadow.camera.top = 50;
  dirLight.shadow.camera.bottom = - 50;
  dirLight.shadow.camera.left = - 50;
  dirLight.shadow.camera.right = 50;
  dirLight.shadow.camera.near = 0.1;
  dirLight.shadow.camera.far = 200;
  dirLight.shadow.mapSize.width = 4096;
  dirLight.shadow.mapSize.height = 4096;
  scene.add(dirLight);
  // scene.add( new THREE.CameraHelper(dirLight.shadow.camera))
}

// eventlisteners

function addEventListeners(){
  window.addEventListener('resize', resizeEvent);
  window.addEventListener('keydown', keydownEvent, false);
  document.addEventListener('keyup', keyupEvent, false);
}

function resizeEvent() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function keydownEvent(event){
  keyDisplay.down(event.key);
  running = false
  if (event.shiftKey && characterControls && !running) {
    running = true
    characterControls.toggleRun()
  } else if(!keyPressed[event.key.toLowerCase()]) {
    keyPressed[event.key.toLowerCase()] = true
  }
}

function keyupEvent(event){
  running = false
  keyDisplay.up(event.key);
  keyPressed[event.key.toLowerCase()] = false
}