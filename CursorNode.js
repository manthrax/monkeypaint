import*as THREE from 'three';


class ScreenSpaceNode {
    constructor(camera, renderer) {
        this.camera = camera;
        this.renderer = renderer;
        this.plane = new THREE.Mesh(new THREE.PlaneGeometry(.01,.01),new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 1.,
            side: THREE.DoubleSide
        }));
        let loader = new THREE.TextureLoader().load("cursor.png", (tex)=>{
            this.plane.material.map = tex;
            this.plane.scale.x = 1;
            this.plane.scale.y = tex.image.height / tex.image.width;
            this.plane.scale.multiplyScalar(.5)
        }
        )
        this.plane.geometry.translate(.0034, -0.004, 0)
        this.camera.add(this.plane);
        this.addEventListeners();

    }
}

import $3 from "./ThreeQuery.js"

function scaleObjectToScreenScale(object, camera) {
    // Assuming `object` is the object you want to scale

    // Get the camera's field of view in radians
    const fov = camera.fov * (Math.PI / 180);

    // Calculate the distance between the camera and the object
    const distance = camera.position.distanceTo(object.position);

    // Calculate the height of the object at the current distance
    const height = 2 * Math.tan(fov / 2) * distance;

    // Calculate the scaling factor to maintain the object's relative size
    const scaleFactor = height * .5;

    // Apply the scaling factor to the object
    object.scale.set(scaleFactor, scaleFactor, scaleFactor);
}

export default class CursorNode extends ScreenSpaceNode {
    constructor(camera, renderer) {
        super(camera, renderer)

        this.addEventListeners();

this.mouse = new THREE.Vector2();
this.fragMouse = new THREE.Vector2();
this.groundPoint = new THREE.Vector3();

        
        
        //camera.parent.add(this.hitPlane)
        const raycaster = new THREE.Raycaster();

        this.raycast=(object)=>{
            
            raycaster.setFromCamera(this.mouse, this.camera);
            return raycaster.intersectObjects([object], true);
        }
        
        return
        
        this.marker = $3("<plane>").e[0];
        this.marker.material = this.marker.material.clone();
        //[this.marker.material.clone(),this.marker.material.clone()];
        let sz = .5;
        this.marker.geometry.scale(sz, sz, sz)
        this.marker.material.transparent = true;
        this.marker.material.color.set('green')
        this.marker.material.opacity = .5;
        this.marker.material.blending = THREE.AdditiveBlending;
        let c = this.marker.clone();
        this.marker.material.map = new THREE.TextureLoader().load("crosshair.png", (tex)=>{
            this.marker.material.map = tex;

            c.material = this.marker.material.clone();
            c.material.depthFunc = THREE.GreaterDepth;
            c.material.color.set('red')
            c.material.opacity = .5;

        }
        )
        this.marker.add(c)
        this.marker.rotation.x = -Math.PI * .5;
        this.camera.parent.add(this.marker);


        this.hitPlane = new THREE.Mesh(new THREE.PlaneGeometry());
        this.hitPlane.scale.set(10000, 10000, 10000);
        this.hitPlane.rotation.x = -Math.PI * .5;
        this.hitPlane.updateMatrix();
        this.hitPlane.updateMatrixWorld();

        this.plane.onBeforeRender = ()=>{
            this.hitPlane.position.set(this.camera.position.x, 1, this.camera.position.z);
            this.hitPlane.updateMatrixWorld();
            const intersects = this.raycast(this.hitPlane);
            if (intersects.length > 0) {
                this.marker.position.copy(intersects[0].point)
                this.marker.position.y += .01;
                if (!this.marker.geometry.boundingBox)
                    this.marker.geometry.computeBoundingBox();
                scaleObjectToScreenScale(this.marker, this.camera)
            }
        }
    }

    updateCursorPosition(event) {
        const rect = this.renderer.domElement.getBoundingClientRect();
        let x = (event.clientX - rect.left);
        let y = (event.clientY - rect.top);
        this.fragMouse.set(x,y);
        x/=rect.width;
        y/=rect.height;
        this.fragMouse.y = rect.height-this.fragMouse.y;
        this.mouse.set(x * 2 - 1, -y * 2 + 1);
        this.plane.position.set(this.mouse.x, this.mouse.y, this.camera.near).unproject(this.camera);
        this.camera.worldToLocal(this.plane.position)

    }

    addEventListeners() {
        this.renderer.domElement.addEventListener('mousemove', (event)=>{
            this.updateCursorPosition(event);
        }
        );
    }
}
