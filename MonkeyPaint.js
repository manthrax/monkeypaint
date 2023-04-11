
import*as THREE from "three";
import {OrbitControls} from "threeModules/controls/OrbitControls.js";
import {RGBELoader} from "threeModules/loaders/RGBELoader.js";
import {GLTFLoader} from "threeModules/loaders/GLTFLoader.js";
import {GLTFExporter} from "threeModules/exporters/GLTFExporter.js";
import {GUI} from "threeModules/libs/lil-gui.module.min.js";
import CursorNode from "./CursorNode.js"

let {Scene, WebGLRenderer, PerspectiveCamera, Mesh, BufferGeometry, CircleGeometry, BoxGeometry, MeshBasicMaterial, Vector3, AnimationMixer, Object3D, TextureLoader, Sprite, SpriteMaterial, RepeatWrapping, } = THREE;
let vec3 = Vector3;
let {random, abs, sin, cos, min, max, floor} = Math;
let rnd = (rng=1)=>random() * rng;
let srnd = (rng=1)=>random() * rng * 2 - rng;

THREE.Cache.enabled = true;

let v0 = new vec3();
let v1 = new vec3();
let v2 = new vec3();
let v3 = new vec3();

console.log("Hello 🌎 [ᚠ]	ᚢ	ᚦ	ᚨ	ᚱ	ᚲ	ᚷ	[ᚹ]	ᚺ	ᚾ	ᛁ	ᛃ	ᛈ	ᛇ	ᛉ	ᛊ	ᛏ	ᛒ	ᛖ	ᛗ	ᛚ	ᛜ	ᛞ	ᛟ");

let renderer = new WebGLRenderer({
    //antialias: false,
    alpha:true,
    //logarithmicDepthBuffer: true
});

renderer.setClearColor(0xcccccc);

let stl = renderer.domElement.style;
stl.position = "absolute";
stl.left = stl.top = "0px";

document.body.appendChild(renderer.domElement);

let scene = new Scene();
let camera = new PerspectiveCamera();
scene.add(camera);
let controls = new OrbitControls(camera,renderer.domElement);
camera.position.set(-0.8, 0.5, 1.8);
controls.target.set(0, 0.5, 0.0);
controls.maxPolarAngle = Math.PI;
controls.minPolarAngle = -Math.PI;

renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
// default THREE.PCFShadowMap

let lightRig = new THREE.Object3D();

//Create a DirectionalLight and turn on shadows for the light
const dlight = new THREE.DirectionalLight(0xffffff,0.1);
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

let lightParam = {
    pitch: -0.13,
    yaw: -2.2,
};
camera.position.set(.5,.5, 2.7);
controls.target.set(0, 0, 0);
let ambientLight = new THREE.AmbientLight("white",0.1)
dlight.intensity = 0.8;

dlight.target.position.set(0, 0.5, 0);

lightRig.add(ambientLight);
lightRig.add(dlight);
lightRig.add(dlight.target);

//let pointLight = new THREE.PointLight();
//pointLight.position.y+=.5;
//lightRig.add(pointLight)

scene.add(lightRig);

let repoLight = ()=>{
    let {pitch, yaw} = lightParam;
    let lpitch = Math.sin(pitch);
    dlight.position.set(Math.sin(yaw) * lpitch, Math.cos(pitch), Math.cos(yaw) * lpitch);
    dlight.position.multiplyScalar(1.5);
    dlight.lookAt(dlight.target.position);
    dlight.updateMatrix();
    dlight.updateMatrixWorld();
}
;
repoLight();

let gui = new GUI({
    width: 200,
    visible: false,
});

gui.add(lightParam, "pitch", -Math.PI * 1., 0).name("LightPitch").onChange((val)=>{
    repoLight();
}
);
gui.add(lightParam, "yaw", -Math.PI, Math.PI).name("LightYaw").onChange((val)=>{
    repoLight();
}
);

gui.add({
    wireframe: false
}, "wireframe").name("Wireframe").onChange((val)=>{
    scene.traverse(e=>e.isMesh && (e.material.wireframe = val ? true : false))
}
);

let pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();
let envMap;
new RGBELoader().setPath("").load("https://cdn.glitch.global/364206c7-9713-48db-9215-72a591a6a9bd/pretville_street_1k.hdr?v=1658931258610", function(texture) {
    envMap = pmremGenerator.fromEquirectangular(texture).texture;

    //scene.background = envMap;
    scene.environment = envMap;

    texture.dispose();
    pmremGenerator.dispose();
});

controls.enableDamping = true;

let onWindowResize = (event)=>{
    let width = window.innerWidth;
    let height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
}


onWindowResize();
window.addEventListener("resize", onWindowResize, false);

let cursorNode = new CursorNode(camera,renderer);
renderer.domElement.style.cursor = 'none'


export {THREE,GLTFLoader,GLTFExporter, gui,scene,camera,controls,renderer,cursorNode}