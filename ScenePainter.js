/***********

MESH TEXTURE PAINTER by Thrax (C) - manthrax@gmail && vectorslave.com

***********/

import UnwrapUVs from "./UnwrapUVs.js"

import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
export default function PaintApp({ THREE, GLTFLoader, scene, camera, controls, renderer, gui, cursorNode, uPaintSourceTexture }) {

    let patch = (obj, fld, ck, fn) => obj[fld] = obj[fld].replace(`#include <${ck}>`, fn(THREE.ShaderChunk[ck], `#include <${ck}>`));

    function MeshPainter(sourceMesh) { }





    function ScenePainter(paintScene) {
        let brushUniforms = {
            uBrushStrength: {
                value: 0.2
            },
            uBrushHardness: {
                value: 0.2
            },
            uBrushSize: {
                value: new THREE.Vector3(.1, .1, .1)
            },
            uBrushColor: {
                value: new THREE.Vector4(1, 0, 0, 1)
            }
        }
        scene.add(paintScene);

        let paintMaterials = []
        let paintMeshes = []
        paintScene.traverse(e => e.isMesh && e.material && (paintMaterials.push(e.material) | paintMeshes.push(e)))

        paintMeshes.forEach(e => e.visible = false);

        let query = window.location.search.substring(1).split("=");
        let id = parseInt(query);
        if (!((id >= 0) && (id < paintMeshes.length)))
            id = 2;
        let sourceMesh = paintMeshes[id % paintMeshes.length]

        sourceMesh.visible = true;

        let bounds = new THREE.Box3().setFromObject(sourceMesh);
        let size = bounds.getSize(new THREE.Vector3());
        let { max } = Math;
        let maxsz = max(size.x, max(size.y, size.z));
        //Rescale the model..
        sourceMesh.scale.multiplyScalar(1 / maxsz);
        sourceMesh.updateMatrixWorld()
        bounds.setFromObject(sourceMesh);
        sourceMesh.position.sub(bounds.getCenter(new THREE.Vector3()))

        /*    
    //Recenter camera/controls on model
    bounds.getCenter(controls.target)
    camera.position.copy(controls.target)
    camera.position.z += maxsz * 1.5;
  */

        if (!sourceMesh.material.map) {
            alert("Object has no Texture/Material assigned.. ")
            let canv = document.createElement('canvas');
            canv.width = canv.height = 1024;
            let ctx = canv.getContext('2d');
            ctx.fillStyle = 'white'
            ctx.fillRect(0, 0, canv.width, canv.height)
            //sourceMesh.material.map = new THREE.CanvasTexture(canv)
            sourceMesh.material.map = new THREE.Texture(canv)
            sourceMesh.material.map.colorSpace = THREE.SRGBColorSpace;
            sourceMesh.material.map.needsUpdate = true;
        }

        if (!sourceMesh.geometry.attributes.uv) {
            alert("Object has no UV map.. ")
            UnwrapUVs(sourceMesh.geometry);
        }

        /*
    let p=sourceMesh.position.clone().sub(controls.target);
    controls.target.add(p);
    camera.position.add(p);
*/
        // sourceMesh.position.x -= .4;

        let texTransformer = new TextureTransformer(sourceMesh.material.map, renderer)

        let previewPlane = new THREE.Mesh(new THREE.PlaneGeometry(), new THREE.MeshBasicMaterial({
            map: texTransformer.feedbackTexture.renderTarget.texture,
            depthWrite: false
        }));
        camera.add(previewPlane);
        previewPlane.rotation.set(0, 0, 0);
        previewPlane.position.set(-.1, 0, -1.2);
        previewPlane.scale.set(1, 1, 1);
        previewPlane.visible = false;
        previewPlane.material.onBeforeCompile = (shader) => {
            shader.fragmentShader = shader.fragmentShader.replace('}', `
    if(sampledDiffuseColor.a<.1)
       sampledDiffuseColor.rgb=vec3(0,0,1);
}`)
        }

        let paintMesh = sourceMesh.clone();
        paintMesh.material = paintMesh.material.clone();

        let setEnvBrightness = (v) => {
            scene.traverse(e => e.isMesh && e.material && (e.material.envMapIntensity = v));
        }

        this.exportScene = () => {

            const exporter = new GLTFExporter();
            //const scene = new THREE.Scene();
            //const mesh = new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({
            //    color: 0xff0000
            //}));
            //scene.add(mesh);

            const link = document.createElement('a');
            link.style.display = 'none';
            document.body.appendChild(link);
            // Firefox workaround, see #6594

            function save(blob, filename) {
                link.href = URL.createObjectURL(blob);
                link.download = filename;
                link.click();
                // URL.revokeObjectURL( url ); breaks Firefox...
            }
            function saveArrayBuffer(buffer, filename) {
                save(new Blob([buffer], {
                    type: 'application/octet-stream'
                }), filename);
            }
            const options = {
                trs: true,
                onlyVisible: true,
                binary: true,
                maxTextureSize: 4096 //params.maxTextureSize
            };

            scene.traverse(e => {
                if (e.isMesh && e.material.map && e.material.map.userData.renderTargetId) {
                    let rt = FeedbackTexture.renderTargetMap[e.material.map.userData.renderTargetId];

                    // rt = texTransformer.feedbackTexture.renderTarget;

                    let canvas = renderTargetToCanvas(renderer, rt);
                    e.material.map = new THREE.CanvasTexture(canvas);
                    //null;
                    e.material.map.flipY = false;
                }
            }
            )
            exporter.parse(scene, (result) => {
                if (result instanceof ArrayBuffer) {
                    saveArrayBuffer(result, 'scene.glb');
                }
            }
                , function (error) {
                    console.log('An error happened during parsing', error);
                }, options);
        }

        this.update = (time) => {

            //let time = performance.now();
            // if(!lastTime)lastTime=time;
            //  fdt=time-lastTime;
            // if(fdt<fps)
            //   return;
            let substep = 0;

            while (simTime < time) {
                let dt = 1 / fps;
                simTime += dt;

                //update

                substep++;
                if (substep >= maxSubsteps) {
                    simTime = time;
                    break;
                }
            }
            if (exportTriggered) {
                exportTriggered = false;
                this.exportScene();
            }
        }
        gui.add({
            export: () => {
                exportTriggered = true;
            }
        }, "export").name("export glb!");

        (paintMesh.material.roughness !== undefined) && gui.add(paintMesh.material, "roughness", 0, 1);
        (paintMesh.material.metalness !== undefined) && gui.add(paintMesh.material, "metalness", 0, 1);

        gui.add({
            intensity: .25
        }, "intensity", 0, 1).name("env brightness:").onChange(setEnvBrightness)
        gui.add(previewPlane, 'visible').name('tex : ' + paintMesh.name);

        gui.add(brushUniforms.uBrushStrength, "value", 0, 1.).name("Strength")
        gui.add(brushUniforms.uBrushHardness, "value", 0, 1.).name("Hardness")
        gui.add({
            value: .01
        }, "value", .002, .2, 0.0001).name("Size").onChange(v => {
            brushUniforms.uBrushSize.value.x = v;//(Math.pow(v, 3.) * 3.) + .01;
        }
        )

        const colorFormats = {
            string: '#ff0000',
            int: 0xff0000,
            object: {
                r: 1,
                g: 0,
                b: 0
            },
            array: [1, 0, 0]
        };
        let tc = new THREE.Color();
        gui.addColor(colorFormats, 'string').onChange(v => {
            tc.set(v);
            brushUniforms.uBrushColor.value.set(tc.r, tc.g, tc.b, 1);
        }
        )

        let uCamViewMatrix = {
            value: camera.matrixWorldInverse
        }
        let uCamProjectionMatrix = {
            value: camera.projectionMatrix
        }
        let uBrushPoint = {
            value: new THREE.Vector3()
        }
        let uBrushNormal = {
            value: new THREE.Vector3()
        }
        let uCursorPosition = {
            value: cursorNode.fragMouse
        }
        let uMatrixWorld = {
            value: paintMesh.matrixWorld
        }
        let setUniforms = (shader) => {
            shader.uniforms.uMatrixWorld = uMatrixWorld
            shader.uniforms.uCamViewMatrix = uCamViewMatrix
            shader.uniforms.uCamProjectionMatrix = uCamProjectionMatrix
            shader.uniforms.uBrushNormal = uBrushNormal;
            shader.uniforms.uBrushPoint = uBrushPoint;
            shader.uniforms.uCursorPosition = uCursorPosition;
            shader.uniforms.uPaintSourceTexture = uPaintSourceTexture;

            Object.assign(shader.uniforms, brushUniforms)
        }

        let computeBrushInfluence = `
        float brushInfluence = 0.;
        vec3 brushDelta = (vWorldPosition-uBrushPoint) / uBrushSize.x;
        
        vec4 brushScreen =  uCamViewMatrix  * vec4(vWorldPosition,1.);
        brushScreen = uCamProjectionMatrix * brushScreen;
        brushScreen /= brushScreen.w;
        
        float dist = min(1.,length(brushDelta));
        dist = length(brushDelta);
        brushInfluence = max(0.,1.-pow(dist,.1+(uBrushHardness*15.)));
        brushInfluence *= uBrushStrength;
`
        let brushVars = `
    
uniform vec4 uBrushColor;
uniform vec3 uBrushPoint;
uniform vec3 uBrushSize;
uniform float uBrushHardness;
uniform float uBrushStrength;
uniform vec2 uCursorPosition;
varying vec3 vWorldPosition;

uniform mat4 uCamViewMatrix;
uniform mat4 uCamProjectionMatrix;

uniform sampler2D uPaintSourceTexture;
    `

        //This shader renders a model with the ghost of the brush cursor rendered on top...
        paintMesh.material.onBeforeCompile = (shader, renderer) => {
            shader.vertexShader = `
uniform mat4 uMatrixWorld;
varying vec3 vWorldPosition;
` + shader.vertexShader;

            patch(shader, 'vertexShader', `fog_vertex`, (ck, ckinc) => {
                return ckinc + `
    vWorldPosition = (uMatrixWorld * vec4(transformed,1.0)).xyz;

    `
            }
            )
            shader.fragmentShader = `
        ${brushVars}

` + shader.fragmentShader

            shader.fragmentShader = shader.fragmentShader.replace('}', `
#ifdef USE_MAP
    //gl_FragColor=vec4(.0,fract(vMapUv*10.)*.2,1.);
#endif

${computeBrushInfluence}

brushInfluence = max(0., brushInfluence - smoothstep(.1,0.,brushInfluence));
gl_FragColor = mix(gl_FragColor,vec4(1.)-gl_FragColor,brushInfluence);
  
//brushInfluence = max(0., brushInfluence - smoothstep(brushInfluence,.1,0.));
//gl_FragColor = mix(gl_FragColor,uBrushColor,brushInfluence);
    
}
`)
            setUniforms(shader)
        }

        let drawing = false;
        let buttons = 0;
        document.addEventListener('pointerdown', (e) => {
            if (e.target !== renderer.domElement) return;
            buttons = e.buttons;
            if (buttons == 1) {
                (controls.enabled = !(cursorNode.raycast(paintMesh).length > 0));
                if (!controls.enabled)
                    drawing = true;
            }
        }
        );
        document.addEventListener('pointerup', (e) => {
            controls.enabled = true;
            drawing = false;
            buttons = e.buttons;
        }
        )

        let uvMesh = sourceMesh;
        uvMesh.parent.add(paintMesh);
        uvMesh.material = uvMesh.material.clone();

        camera.add(uvMesh);
        uvMesh.rotation.set(0, 0, 0);
        uvMesh.position.set(-4.5, -3, -20);
        uvMesh.scale.set(2, 2, 2);
        uvMesh.position.set(-1, -1, 0);
        texTransformer.uvScene.add(uvMesh);

        let dilator = new Dilator(texTransformer, uvMesh, previewPlane, paintMesh);

        renderer.setClearColor(0x101010);

        let replay = []
        let replaying = false;
        let replayCursor = 0;
        let repeatCountdown = 0;

        let load = () => {
            try {
                if (localStorage.monkeyReplay) {
                    replay = JSON.parse(localStorage.monkeyReplay);
                    if (replay.length)
                        replaying = true;
                }
            } catch {
                alert("Couldn't parse localstorage! Replay lost...")
                replay = []
            }
        }
        let getState = () => {
            return {
                uBrushPoint: uBrushPoint.value.clone(),
                uBrushNormal: uBrushNormal.value.clone(),
                uBrushSize: brushUniforms.uBrushSize.value.clone(),
                uBrushColor: brushUniforms.uBrushColor.value.clone(),
                uBrushHardness: brushUniforms.uBrushHardness.value,
                uBrushStrength: brushUniforms.uBrushStrength.value,
                _repeat: 1,
            }
        }
        let setState = (st) => {
            uBrushPoint.value.copy(st.uBrushPoint)
            uBrushNormal.value.copy(st.uBrushNormal)
            brushUniforms.uBrushSize.value.copy(st.uBrushSize)
            brushUniforms.uBrushColor.value.copy(st.uBrushColor)
            brushUniforms.uBrushHardness.value = st.uBrushHardness
            brushUniforms.uBrushStrength.value = st.uBrushStrength
            // console.log(st.uBrushPoint)
        }
        let statesEqual = (sa, sb) => {
            if (typeof sa == 'object') {
                for (let f in sa)
                    if ((!f.startsWith('_')) && (!statesEqual(sa[f], sb[f])))
                        return false;
            } else
                return (sa == sb);
            return true;
        }

        let lastState;
        //    window.onBeforeUnload=()=>{
        //        if(replay.length){
        //            localStorage.monkeyReplay = JSON.stringify(replay);
        //        }
        //    }

        gui.add({
            save: () => {
                localStorage.monkeyReplay = JSON.stringify(replay);
                console.log("Save size:", localStorage.monkeyReplay.length)
            }
        }, "save")
        gui.add({
            load
        }, "load")

        gui.add({
            reset: () => {
                replay = []
                //delete localStorage.monkeyReplay;
                location.reload();
            }
        }, "reset")
        let updateReplay = () => {
            if (replaying) {
                if (replayCursor >= replay.length) {
                    replaying = false;
                    lastState = undefined;
                } else {
                    let state = replay[replayCursor];
                    if (!repeatCountdown)
                        repeatCountdown = state._repeat;
                    else {
                        repeatCountdown--;
                        if (!repeatCountdown)
                            replayCursor++;
                    }
                    setState(state);
                }
            } else {
                let state = getState();
                if (lastState) {
                    if (statesEqual(state, lastState))
                        lastState._repeat++;
                    else
                        replay.push(lastState)
                }
                lastState = state;
            }
        }
        let draw = () => {
            let fbt = texTransformer.feedbackTexture;
            let iterations = 0;
            do {
                try {
                    updateReplay();
                } catch (e) {
                    console.log(e)
                    replaying = false;
                    replay = []
                }
                uvMesh.material.map = fbt.renderTarget.texture;
                texTransformer.renderUVMeshToTarget(fbt.offRenderTarget);
                previewPlane.material.map = fbt.renderTarget.texture;
                paintMesh.material.map = fbt.renderTarget.texture
                uvMesh.material.map = fbt.offRenderTarget.texture;

                iterations++;
            } while (replaying && (iterations < 100)) dilator.apply(fbt);
        }

        //Convert rendertarget to canvasTexture
        function renderTargetToCanvas(renderer, renderTarget, canvas = document.createElement('canvas')) {
            const width = renderTarget.width;
            const height = renderTarget.height;
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            const imageData = ctx.createImageData(width, height);
            if (renderTarget.texture.type == THREE.FloatType) {
                const buffer = new Float32Array(width * height * 4);
                renderer.readRenderTargetPixels(renderTarget, 0, 0, width, height, buffer);
                for (let i = 0; i < buffer.length; i++)
                    buffer[i] *= 255;
                imageData.data.set(buffer);
            } else {
                const buffer = new Uint8Array(width * height * 4);
                renderer.readRenderTargetPixels(renderTarget, 0, 0, width, height, buffer);
                imageData.data.set(buffer);
            }
            ctx.putImageData(imageData, 0, 0);
            return canvas;
        }

        paintMesh.onBeforeRender = () => {
            let hits = cursorNode.raycast(paintMesh)
            if (hits[0]) {
                //controls.enabled = false;
                let v = uBrushPoint.value;
                v.copy(hits[0].point)
                //paintMesh.worldToLocal(v);
                let n = uBrushNormal.value;
                n.copy(hits[0].face.normal).add(v)
                //paintMesh.worldToLocal(n);
                n.sub(v);

            } else {
                let v = uBrushPoint.value;
                uBrushPoint.value.set(0, -1000, 0)
            }
            if ((buttons == 1) && (drawing || replaying))
                draw();
        }

        //This shader renders a models UV coordinates as polygons, and applies the influence of the brush...  rendering the current brush stroke when mouse is down...
        uvMesh.material.onBeforeCompile = (shader, renderer) => {
            if (shader.vertexShader.indexOf('normal_pars_vertex') < 0) {
                shader.vertexShader = shader.vertexShader.replace(`#include <color_pars_vertex>`, `
            #include <color_pars_vertex>
            varying vec3 vNormal;
        `)
                shader.vertexShader = shader.vertexShader.replace(`#include <batching_vertex>`, `
            #include <batching_vertex>
            #include <beginnormal_vertex>
            #include <defaultnormal_vertex>
            vNormal = normalize( transformedNormal );
        `)
            }

            shader.vertexShader = `
            varying vec3 vWorldPosition;
            uniform mat4 uMatrixWorld;
            ` + shader.vertexShader;

            patch(shader, 'vertexShader', 'begin_vertex', (ck) => {
                return `
            #include <begin_vertex>
            #ifdef USE_MAP
                vWorldPosition = (uMatrixWorld * vec4(transformed,1.)).xyz;
                transformed = vec3(vMapUv,0.);
            #endif
            `
            }
            )

            shader.fragmentShader = `
        
${brushVars}
        
` + shader.fragmentShader;
            shader.fragmentShader = shader.fragmentShader.replace('}', `
#ifdef USE_MAP
    //gl_FragColor=vec4(fract(vMapUv*10.),0.,1.);
    
${computeBrushInfluence}

//BAKE
  //gl_FragColor.rgb = mix(gl_FragColor,uBrushColor,brushInfluence);


//PAINT

vec4 brushColor = uBrushColor;

${uPaintSourceTexture ? `

//Transfer brush from paintSourceTexture
vec2 brushUV = (brushScreen.xy*.5)+.5;
brushColor = texture2D(uPaintSourceTexture, brushUV);


` : ``}

gl_FragColor = mix(sampledDiffuseColor,brushColor,brushInfluence);
return;

/*
// BACK FACE CULLING...
vec3 camVert = vWorldPosition-uCamViewMatrix[3].xyz;
vec3 viewNormal = mat3(uCamViewMatrix) * vNormal;
if(dot(normalize(viewNormal),camVert)<0.)
    gl_FragColor = sampledDiffuseColor;
// BACK FACE CULLING...
*/


#endif
}
`)
            setUniforms(shader);

        }

        setEnvBrightness(.25);
    }

    function FeedbackTexture(texture, renderer) {

        let makeTarget = this.makeTarget = () => {
            let rt = new THREE.WebGLRenderTarget(texture.image.width, texture.image.height, {
                format: THREE.RGBAFormat,
                type: THREE.UnsignedByteType,
                //THREE.FloatType,
                //minFilter: THREE.NearestFilter,
                //magFilter: THREE.NearestFilter,
                depthBuffer: false,
                stencilBuffer: false,
                //encoding: THREE.LinearEncoding
                colorSpace: THREE.NoColorSpace //""//THREE.LinearSRGBColorSpace
            });
            if (!FeedbackTexture.renderTargetMap) {
                FeedbackTexture.renderTargetMap = {}
            }

            rt.texture.userData.renderTargetId = rt.texture.uuid;
            FeedbackTexture.renderTargetMap[rt.texture.uuid] = rt;
            return rt;
        }

        let renderTarget = this.renderTarget = makeTarget()
        let offRenderTarget = this.offRenderTarget = makeTarget()

        // Create a scene with a mesh that uses the texture
        const geometry = new THREE.PlaneGeometry(2, 2);
        const material = this.material = new THREE.MeshBasicMaterial({
            map: texture
        });

        const mesh = this.mesh = new THREE.Mesh(geometry, material);
        const scene = new THREE.Scene();
        scene.add(mesh);

        const camera = this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
        // Render the scene to the render target
        let saveTarget = renderer.getRenderTarget();
        renderer.setRenderTarget(renderTarget);
        renderer.render(scene, camera);
        renderer.setRenderTarget(saveTarget);

        let swap = this.swap = () => {
            let sv = renderTarget;
            this.renderTarget = renderTarget = offRenderTarget;
            this.offRenderTarget = offRenderTarget = sv;
        }
        this.renderOperation = (destination, fn) => {
            let saveTarg = renderer.getRenderTarget();
            renderer.setRenderTarget(destination);

            let acSave = renderer.autoClearColor;
            renderer.autoClearColor = false;

            fn(renderer, scene, camera);

            renderer.autoClearColor = acSave;

            renderer.setRenderTarget(saveTarg);
        }
    }

    function TextureTransformer(texture, renderer) {
        // Create a texture to render into the render target

        // Set up the render target
        this.feedbackTexture = new FeedbackTexture(texture, renderer);

        const uvScene = this.uvScene = new THREE.Scene();

        this.renderUVMeshToTarget = (destination) => {

            this.feedbackTexture.renderOperation(destination, (renderer, scene, camera) => {
                renderer.render(scene, camera);
                renderer.render(uvScene, camera);
            }
            );
            this.feedbackTexture.swap()

        }
    }

    function Dilator(texTransformer, uvMesh, previewPlane, paintMesh) {
        let sourceTexture = uvMesh.material.map;

        this.feedbackTexture = new FeedbackTexture(sourceTexture, renderer);

        let uvMask = new UVMask(texTransformer, uvMesh.material, uvMesh);

        previewPlane.material.map = uvMask.uvMaskTarget.texture;

        let dilationMapShader = uvMesh.material.clone();
        let uPaintTextureSize = {
            value: new THREE.Vector2(sourceTexture.source.data.width, sourceTexture.source.data.height)
        }
        let uPaintTexture = {
            value: paintMesh.material.map
        }
        dilationMapShader.onBeforeCompile = (shader, renderer) => {
            shader.fragmentShader = `
uniform sampler2D uPaintTexture;
uniform vec2 uPaintTextureSize;
` + shader.fragmentShader
            shader.uniforms.uPaintTextureSize = uPaintTextureSize;
            shader.uniforms.uPaintTexture = uPaintTexture;
            //This shader hack dilates the UV island textures outwards to remove seams.
            shader.fragmentShader = shader.fragmentShader.replace('}', `
#ifdef USE_MAP
        vec4 maskColor = texture2D( map, vMapUv); //map is the mask texture
        if(maskColor.r<.99){
            //OUtside the mask
            gl_FragColor.rgba = vec4(0.);
            const float rad=16.;
            float closestDistance = sqrt(rad*rad);
            vec4 closestColor = vec4(0.);
            for( float y=-rad;y<rad;y++){
                for( float x=-rad;x<rad;x++){
                    if((abs(x)<.5)&&(abs(y)<.5))continue;
                    vec2 txv=vec2(x,y) / uPaintTextureSize;
                    vec4 clr = texture2D( map, vMapUv+txv );
                    if(clr.r > .9){
                        float distance = length(vec2(x,y));
                        if(distance<closestDistance){
                            closestDistance = distance;
                            closestColor = texture2D( uPaintTexture , vMapUv+txv );//.gbra;//clr.gbra;
                        }
                    }
                }
            }
            gl_FragColor = closestColor;
        }else
            gl_FragColor = texture2D( uPaintTexture, vMapUv );//paintColor;//.rgb=sampledDiffuseColor.rgb*vec3(0.,1.,0.);

//gl_FragColor = texture2D( uPaintTexture, vMapUv );

            
#endif
}`)
        }
        this.apply = (sourceFBT) => {

            this.feedbackTexture.mesh.material = dilationMapShader

            dilationMapShader.map = uvMask.uvMaskTarget.texture;

            uPaintTexture.value = sourceFBT.renderTarget.texture;

            this.feedbackTexture.renderOperation(this.feedbackTexture.offRenderTarget, (renderer, scene, camera) => {
                renderer.render(scene, camera);
            }
            );
            this.feedbackTexture.swap();
            paintMesh.material.map = previewPlane.material.map = this.feedbackTexture.renderTarget.texture;

        }
    }

    function UVMask(transformer, material, uvMesh) {
        let uvMaskShader = material.clone();
        uvMaskShader.side = THREE.DoubleSide;//This sumbitch took me for a ride...
        uvMaskShader.onBeforeCompile = (shader, renderer) => {
            //This shader renders out a mask channel with vec4(1.) where the texel is covered by the UV and 0 otherwise.

            //    shader.vertexShader = `#extension GL_ANGLE_multi_draw : require
            //    `+shader.vertexShader;

            shader.vertexShader = `
varying vec3 vWorldPosition;
uniform mat4 uMatrixWorld;
` + shader.vertexShader;

            patch(shader, 'vertexShader', 'begin_vertex', (ck, ckinc) => ckinc + `
#ifdef USE_MAP
    vWorldPosition = (uMatrixWorld * vec4(transformed,1.)).xyz;
    transformed = vec3(vMapUv,0.);
#endif
`)
            shader.fragmentShader = shader.fragmentShader.replace('}', `
    gl_FragColor.rgb=vec3(1.);
}`)
        }

        this.uvMaskTarget = transformer.feedbackTexture.makeTarget();

        let svMat = uvMesh.material;
        uvMesh.material = uvMaskShader;

        renderer.setRenderTarget(this.uvMaskTarget);

        transformer.feedbackTexture.renderOperation(this.uvMaskTarget, (renderer, scene, camera) => {

            renderer.render(transformer.uvScene, camera);

        }
        )
        uvMesh.material = svMat;
    }

    //---------------end texpaint

    let first = true;
    let animating = true;
    let maxSubsteps = 10;

    let simTime = 0;
    let fps = 60;

    let takeScreenshot = false;
    let exportTriggered = false;

    let { MOUSE } = THREE;
    controls.mouseButtons = {
        LEFT: MOUSE.PAN,
        MIDDLE: MOUSE.PAN,
        RIGHT: MOUSE.ROTATE
    };


    this.render = (time) => {
        controls.update();
        renderer.setRenderTarget(null)
        renderer.render(scene, camera);
    }
    this.ScenePainter = ScenePainter;
}

/*
let {min,max,PI} = Math;
function indexedGeometryTo2dPerimeter(geom){
let arr = geom.index.array;
let edges = []
for(let i=0,l=arr.length;i<l;i+=3){
    let a=arr.slice(i,i+3).sort();
    edges.push([a[0],a[1]],[a[1],a[2]],[a[0],a[2]])
}
edges.sort((a,b)=>a[0]-b[0]);
let uniqueEdges=[]
for(let i=0;i<edges.length;i++){
    let e0=edges[i];
    let e1=edges[(i+1)%edges.length];
    if((e0[0]==e1[0])&&(e0[1]==e1[1]))i++; //shared edge.. discard;
    else
        uniqueEdges.push(e0);
}
return uniqueEdges;
}
let disc = new THREE.RingGeometry(20,10,4,1,0,PI);
//let disc = new THREE.CircleGeometry(20,10,0,PI);
let m = new THREE.Mesh(disc);
scene.add(m);
let edges = indexedGeometryTo2dPerimeter(disc);
console.log(edges);
let edgeGeom = disc.clone();
let idx = []
for(let i=0;i<edges.length;i++)idx.push(edges[i][0],edges[i][1]);
edgeGeom.setIndex(idx);
let lines = new THREE.LineSegments(edgeGeom);
scene.add(lines);

let ringPath = ()
*/
