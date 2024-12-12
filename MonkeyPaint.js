

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RGBELoader } from "three/addons/loaders/RGBELoader.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { GUI } from "three/addons/libs/lil-gui.module.min.js";
import CursorNode from "./CursorNode.js"

const { Scene, WebGLRenderer, PerspectiveCamera, Mesh, BufferGeometry, CircleGeometry, BoxGeometry, MeshBasicMaterial, Vector3, AnimationMixer, Object3D, TextureLoader, Sprite, SpriteMaterial, RepeatWrapping, } = THREE;
const vec3 = Vector3;
const { random, abs, sin, cos, min, max, floor } = Math;
const rnd = (rng = 1) => random() * rng;
const srnd = (rng = 1) => random() * rng * 2 - rng;

THREE.Cache.enabled = true;

const v0 = new vec3();
const v1 = new vec3();
const v2 = new vec3();
const v3 = new vec3();

console.log("Hello 🌎 [ᚠ]	ᚢ	ᚦ	ᚨ	ᚱ	ᚲ	ᚷ	[ᚹ]	ᚺ	ᚾ	ᛁ	ᛃ	ᛈ	ᛇ	ᛉ	ᛊ	ᛏ	ᛒ	ᛖ	ᛗ	ᛚ	ᛜ	ᛞ	ᛟ");

const renderer = new WebGLRenderer({
    //antialias: false,
    alpha: true,
    //logarithmicDepthBuffer: true
});
renderer.outputColorSpace = 'srgb-linear';

renderer.setClearColor(0xcccccc);

const stl = renderer.domElement.style;
stl.position = "absolute";
stl.left = stl.top = "0px";

document.body.appendChild(renderer.domElement);

const scene = new Scene();
const camera = new PerspectiveCamera();
scene.add(camera);
const controls = new OrbitControls(camera, renderer.domElement);
camera.position.set(-0.8, 0.5, 1.8);
controls.target.set(0, 0.5, 0.0);
controls.maxPolarAngle = Math.PI;
controls.minPolarAngle = -Math.PI;

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
// default THREE.PCFShadowMap

const lightRig = new THREE.Object3D();

//Create a DirectionalLight and turn on shadows for the light
const dlight = new THREE.DirectionalLight(0xffffff, 0.1);
dlight.position.set(0, 50, 0);
dlight.castShadow = true;

//Set up shadow properties for the light
dlight.shadow.mapSize.width = 1024;
dlight.shadow.mapSize.height = 1024;
dlight.shadow.camera.near = 0.5;
dlight.shadow.camera.far = 100;
dlight.shadow.camera.left = dlight.shadow.camera.bottom = -18;
dlight.shadow.camera.top = dlight.shadow.camera.right = 18;

//dlight.shadow.bias = -0.01;
//scene.fog = new THREE.Fog(0xcccccc, 48, 50);

const lightParam = {
    pitch: -0.13,
    yaw: -2.2,
};
camera.position.set(.5, .5, 2.7);
controls.target.set(0, 0, 0);
const ambientLight = new THREE.AmbientLight("white", 0.1)
dlight.intensity = 0.8;

dlight.target.position.set(0, 0.5, 0);

lightRig.add(ambientLight);
lightRig.add(dlight);
lightRig.add(dlight.target);

//let pointLight = new THREE.PointLight();
//pointLight.position.y+=.5;
//lightRig.add(pointLight)

scene.add(lightRig);

const repoLight = () => {
    const { pitch, yaw } = lightParam;
    const lpitch = Math.sin(pitch);
    dlight.position.set(Math.sin(yaw) * lpitch, Math.cos(pitch), Math.cos(yaw) * lpitch);
    dlight.position.multiplyScalar(1.5);
    dlight.lookAt(dlight.target.position);
    dlight.updateMatrix();
    dlight.updateMatrixWorld();
};
repoLight();

const gui = new GUI({
    width: 200,
    visible: false,
});

gui.add(lightParam, "pitch", -Math.PI * 1., 0).name("LightPitch").onChange((val) => {
    repoLight();
});
gui.add(lightParam, "yaw", -Math.PI, Math.PI).name("LightYaw").onChange((val) => {
    repoLight();
});

gui.add({
    wireframe: false
}, "wireframe").name("Wireframe").onChange((val) => {
    scene.traverse(e => e.isMesh && (e.material.wireframe = val ? true : false))
});

const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();
let envMap;
new RGBELoader().setPath("").load("https://cdn.glitch.global/364206c7-9713-48db-9215-72a591a6a9bd/pretville_street_1k.hdr?v=1658931258610", function (texture) {
    envMap = pmremGenerator.fromEquirectangular(texture).texture;

    //scene.background = envMap;
    scene.environment = envMap;

    texture.dispose();
    pmremGenerator.dispose();
});

controls.enableDamping = true;

const onWindowResize = (event) => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
};

onWindowResize();
window.addEventListener("resize", onWindowResize, false);

const cursorNode = new CursorNode(camera, renderer);
renderer.domElement.style.cursor = 'crosshair'

import PainterApp from "./ScenePainter.js"

const painterApp = new PainterApp({ THREE, GLTFLoader, GLTFExporter, scene, camera, controls, renderer, gui, cursorNode })

renderer.render(scene, camera)

//new GLTFLoader().load("teeth.glb", (glb)=>{
//new GLTFLoader().load("male-form.glb", (glb)=>{
//new GLTFLoader().load("female-form.glb", (glb)=>{
const glb = await new GLTFLoader().loadAsync("monkeh.glb");
const scenePainter = new painterApp.ScenePainter(glb.scene);

//new GLTFLoader().load("den.gltf", (glb)=>{
//new GLTFLoader().load("CartoonTV_bake.glb", (glb)=>{
//    let scenePainter = new painterApp.ScenePainter(glb.scene);
//}
//);

renderer.setAnimationLoop((time) => {
    scenePainter.update(time);
    painterApp.render(time)
})

export { THREE, GLTFLoader, GLTFExporter, gui, scene, camera, controls, renderer, cursorNode }