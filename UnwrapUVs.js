import * as THREE from "three"
export default function UnwrapUVs(geometry){
    
    let g = geometry;
    let triCount = (g.index?g.index.count:g.attributes.position.count)/3;
    console.log("autogenerating UV map... ",triCount)

    let box = new THREE.Box3();
    let v0=new THREE.Vector3();
    let v1=new THREE.Vector3();
    let v2=new THREE.Vector3();
    let pa = g.attributes.position.array;
    let getTriangle=(i)=>{
        let idx = g.index.array;
        if(idx){
            let vi=i*3;
            let ia=idx[vi]*3
            let ib=idx[vi+1]*3
            let ic=idx[vi+2]*3
            v0.set(pa[ia],pa[ia+1],pa[ia+2])
            v1.set(pa[ib],pa[ib+1],pa[ib+2])
            v2.set(pa[ic],pa[ic+1],pa[ic+2])
        }
    }
    let boxUnwrap=(v0,v1,v2)=>{
        box.setEmpty();
        box.expandByPoint(v0)
        box.expandByPoint(v1)
        box.expandByPoint(v2)
        
    }
    let uvs=new Float32Array(pa.length*2/3);
    
    box.makeEmpty();
    for(let i=0;i<pa.length;i+=3){
        v0.set(pa[i],pa[i+1],pa[i+2]);
        box.expandByPoint(v0)
    }
    let sz = box.getSize(v0);
    let bmin = box.min.clone();
    let {max}=Math;
    let imaxax=1/max(sz.x,max(sz.y,sz.z))
    for(let i=0,w=0;i<triCount;i++,w+=6){  
        getTriangle(i)
        v0.sub(bmin).multiplyScalar(imaxax)
        v1.sub(bmin).multiplyScalar(imaxax)
        v2.sub(bmin).multiplyScalar(imaxax)
        uvs[w]  =v0.x;
        uvs[w+1]=v0.y;
        uvs[w+2]=v1.x;
        uvs[w+3]=v1.y;
        uvs[w+4]=v2.x;
        uvs[w+5]=v2.y;
    }
    g.setAttribute('uv',new THREE.BufferAttribute(uvs,2));
    g.attributes.uv.needsUpdate = true;
}