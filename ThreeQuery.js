// threeQuery.js
import * as THREE from 'three';

const defaultMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });

class ThreeQuery {
  constructor(selector) {
    this.e = [];

    if (typeof selector === "string") {
      if (selector.startsWith("<") && selector.endsWith(">")) {
        const primitive = selector.slice(1, -1).toLowerCase();
        this.e = [createPrimitive(primitive)];
      } else {
        this.e = document.querySelectorAll(selector);
      }
    } else if (selector instanceof HTMLElement || selector instanceof THREE.Object3D) {
      this.e = [selector];
    }

    this.length = this.e.length;
  }

  position(x, y, z) { this.e.forEach(e => e.position.set(x, y, z)); return this; }
  scale(x, y, z) { this.e.forEach(e => e.scale.set(x, y, z)); return this; }
  rotation(x, y, z) { this.e.forEach(e => e.rotation.set(x, y, z)); return this; }
  addTo(parent) { this.e.forEach(e => parent.add(e)); return this; }
  attachTo(parent) { this.e.forEach(e => parent.attach(e)); return this; }

  // Add more methods here...
}

const createPrimitive = (primitive) => {
  switch (primitive) {
    case "sphere":
      return new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), defaultMaterial);
    case "plane":
      return new THREE.Mesh(new THREE.PlaneGeometry(1, 1), defaultMaterial);
    case "box":
      return new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), defaultMaterial);
    case "cylinder":
      return new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 32), defaultMaterial);
    case "directionallight":
      return new THREE.DirectionalLight(0xffffff, 1);
    case "pointlight":
      return new THREE.PointLight(0xffffff, 1, 100);
    // Add more cases for other primitives...
    default:
      throw new Error(`Unknown primitive: ${primitive}`);
  }
};

const $3 = (selector) => new ThreeQuery(selector);

export default $3;