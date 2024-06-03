# monkeypaint
 An app for painting on meshes in THREEJS, with glb export.

Try it here!: https://manthrax.github.io/monkeypaint/index.html?1

This implements 3d mesh painting using via the gpu and rendertargets.

Tested with threejs r160..
For some older versions replace all "vMapUv" in ScenePainter.js
with "vUv"

Algorithm:
First, the UV map is rendered as a 3d model onto a renderTarget in white, to form a binary mask of which pixels are covered by the UVmap

Then the UV map is rendered a second time, with the models texture bound. The 3d vertex coordinates are also available since
the UV rendering behavior is injected into the material using shader injection.

As each UV triangle is rendered.. the vertex coordinate is transformed to world space and compared with the Brush position in worldspace
(derived from the cursor raycast)
This computes an intensity 0 to 1 for the brush affecting this texel of the UV map.
Brush color is mixed with existing texel color and output.

Next, a "dilation" shader is run with the UV mask texture bound. For every texel not underneath a UV triangle (i.e. edges of UV islands)
The nearest texel that is in a UV island (within 16 pixels or so) is found , and that pixel color is output.
This step eliminates most of the seams that occur due to the filtering of textures, 
by giving the islands a 16 or so pixel padding for the filtering to access on island boundaries.

Export:
intermediate rendertargets containing the painted texture, are converted to canvas texture, then run through
the binary GLTF exporter as a binary gltf file (.glb)


Save/Load/Reset:
these are a bit janky.. When you hit Save, all the brush strokes in the seesion are saved to localstorage.
 so if you reload the page, and then hit Load, it will repaint the model as you had it before.
Reset clears the current localStorage save and reloads the page.

TODO:
implement custom brush shapes. right now it's just a variable sized sphere.. and doesn't orient along the ray hit normal.
Allow texture stamping as an extension of this.

Allow specifying different texture outputs for roughnessmap, metalnessmap, opacitymap, and normalmap.
