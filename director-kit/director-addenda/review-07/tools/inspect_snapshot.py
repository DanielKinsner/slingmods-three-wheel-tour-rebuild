"""Independent, read-only Review07 snapshot / tire-envelope audit.
Requires numpy and scipy; no Blender, npm packages, or project mutation.
The SAT certificate covers the exported tire vs fixed triangles across the
specified vertical travel and arbitrary spin, not all linkage interference.
"""
from pathlib import Path
import argparse,json,struct,hashlib,zipfile
import numpy as np
from scipy.spatial.transform import Rotation


def glb(path):
    raw=Path(path).read_bytes(); magic,ver,total=struct.unpack_from('<III',raw)
    assert magic==0x46546c67 and ver==2 and total==len(raw)
    at=12;g=None;binary=None
    while at<len(raw):
        size,kind=struct.unpack_from('<II',raw,at);chunk=raw[at+8:at+8+size];at+=8+size
        if kind==0x4e4f534a:g=json.loads(chunk)
        elif kind==0x004e4942:binary=chunk
    assert g is not None and binary is not None
    types={5120:'i1',5121:'u1',5122:'<i2',5123:'<u2',5125:'<u4',5126:'<f4'}
    widths={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4,'MAT4':16}
    def accessor(i):
        a=g['accessors'][i]; assert 'sparse' not in a
        v=g['bufferViews'][a['bufferView']];dt=np.dtype(types[a['componentType']]);w=widths[a['type']]
        return np.ndarray((a['count'],w),dtype=dt,buffer=binary,
            offset=v.get('byteOffset',0)+a.get('byteOffset',0),
            strides=(v.get('byteStride',dt.itemsize*w),dt.itemsize)).copy()
    nodes=g['nodes'];parents={c:i for i,n in enumerate(nodes) for c in n.get('children',[])};matrices={}
    def matrix(i):
        if i in matrices:return matrices[i]
        n=nodes[i]
        if 'matrix' in n:m=np.array(n['matrix']).reshape(4,4).T
        else:
            m=np.eye(4);m[:3,:3]=Rotation.from_quat(n.get('rotation',[0,0,0,1])).as_matrix()@np.diag(n.get('scale',[1,1,1]));m[:3,3]=n.get('translation',[0,0,0])
        if i in parents:m=matrix(parents[i])@m
        matrices[i]=m;return m
    reachable=set()
    def visit(i):
        reachable.add(i)
        for c in nodes[i].get('children',[]):visit(c)
    for i in g['scenes'][g.get('scene',0)]['nodes']:visit(i)
    meshes=[]
    for i in sorted(reachable):
        n=nodes[i]
        if 'mesh' not in n:continue
        ancestors=[];p=i
        while True:
            ancestors.append(nodes[p].get('name',str(p)))
            if p not in parents:break
            p=parents[p]
        for j,p in enumerate(g['meshes'][n['mesh']]['primitives']):
            assert p.get('mode',4)==4
            v=accessor(p['attributes']['POSITION']);m=matrix(i);v=v@m[:3,:3].T+m[:3,3]
            f=accessor(p['indices']).reshape(-1,3) if 'indices' in p else np.arange(len(v)).reshape(-1,3)
            meshes.append(dict(name=n.get('name',str(i)),primitive=j,vertices=v,faces=f,ancestors=ancestors,material=p.get('material')))
    return g,meshes,hashlib.sha256(raw).hexdigest()


def triangle_box_gaps(tris,lo,hi):
    """Max normalized separating-axis gap per triangle; <=0 means overlap.
    Uses all 13 SAT axes: 3 box, triangle normal, 9 edge/box crosses.
    Positive gap is a conservative Euclidean separation lower bound.
    """
    center=(lo+hi)/2;half=(hi-lo)/2;t=tris-center
    gap=np.maximum(t.min(1)-half,-half-t.max(1)).max(1)
    edges=np.roll(t,-1,axis=1)-t
    axes=[np.cross(edges[:,0],edges[:,1])]
    for i in range(3):
        for axis in np.eye(3):axes.append(np.cross(edges[:,i],axis))
    for axis in axes:
        norm=np.linalg.norm(axis,axis=1);valid=norm>1e-14
        unit=axis/np.where(valid,norm,1)[:,None]
        projection=np.einsum('nvc,nc->nv',t,unit);r=np.abs(unit)@half
        candidate=np.maximum(projection.min(1)-r,-r-projection.max(1))
        gap=np.maximum(gap,np.where(valid,candidate,-np.inf))
    return gap


def main():
    ap=argparse.ArgumentParser();ap.add_argument('root');ap.add_argument('--previous-zip');ap.add_argument('--output',required=True);args=ap.parse_args()
    root=Path(args.root);sha=lambda p:hashlib.sha256(p.read_bytes()).hexdigest()
    manifest=json.loads((root/'PACKAGE-MANIFEST.json').read_text());bad=[]
    for name,record in manifest['files'].items():
        p=root/name
        if not p.is_file() or p.stat().st_size!=record['bytes'] or sha(p)!=record['sha256']:bad.append(name)
    protected=json.loads((root/'director-kit/production/evidence/P04A1/protected-baseline.json').read_text());changes=[];prior_changes=[]
    for name,record in protected.items():
        expect=record if isinstance(record,str) else record['sha256']
        if sha(root/name)!=expect:changes.append(name)
    if args.previous_zip:
        with zipfile.ZipFile(args.previous_zip) as z:
            for name in protected:
                if sha(root/name)!=hashlib.sha256(z.read(name)).hexdigest():prior_changes.append(name)
    build=json.loads((root/'director-kit/production/evidence/Review07-final/build-inputs.json').read_text());build_bad=[]
    for name,record in build['inputs'].items():
        expect=record if isinstance(record,str) else record['sha256']
        if not(root/name).is_file() or sha(root/name)!=expect:build_bad.append(name)
    asset=root/'public/assets/vehicles/slingshot-p04a1.glb';g,meshes,h=glb(asset)
    rig=json.loads((root/'public/assets/vehicles/slingshot-p04a1-rear-rig.json').read_text());c=np.array(rig['wheelCenter']);tire=next(m for m in meshes if m['name']=='rear_spin__Rubber');v=tire['vertices']
    radius=float(np.linalg.norm(v[:,1:]-c[1:],axis=1).max());pad=1e-5
    lo=np.array([v[:,0].min(),rig['supportedHubY'][0]-radius,c[2]-radius])-pad
    hi=np.array([v[:,0].max(),rig['supportedHubY'][1]+radius,c[2]+radius])+pad
    moving=set(rig['groups'].values())|{'rear_spin','front_left_steer','front_right_steer','front_left_spin','front_right_spin'}
    fixed=[m for m in meshes if not moving.intersection(m['ancestors'])];hits=[];minimum=1e6;nearest=None;ntri=0
    # Sanity checks: center piercing, obvious separation, and coplanar contact.
    fixture=np.array([[[-2,0,0],[2,0,0],[0,2,0]],[[2,2,2],[3,2,2],[2,3,2]],[[1,0,0],[1,.5,0],[1,0,.5]]],float)
    fresult=triangle_box_gaps(fixture,-np.ones(3),np.ones(3));assert fresult[0]<=0 and fresult[1]>0 and abs(fresult[2])<1e-10
    for m in fixed:
        tris=m['vertices'][m['faces']];ntri+=len(tris);gap=triangle_box_gaps(tris,lo,hi)
        if gap.min()<minimum:minimum=float(gap.min());nearest=m['name']
        count=int((gap<=0).sum())
        if count:hits.append({'mesh':m['name'],'primitive':m['primitive'],'triangles':count})
    # A closed mesh could enclose the box without intersecting its surface.
    # No individual fixed-mesh bounds contain the rest hub in this snapshot.
    # Return any candidates explicitly; do not pretend to perform a general
    # manifold/solid-union containment test.
    enclosure_candidates=[{'mesh':m['name'],'primitive':m['primitive']}
        for m in fixed if np.all(c >= m['vertices'].min(0))
        and np.all(c <= m['vertices'].max(0))]
    # Tire vertices inside explicitly reserved storage (at any tested height).
    storage_hits=[]
    for y in np.linspace(*rig['supportedHubY'],81):
        for angle in np.linspace(0,2*np.pi,12,endpoint=False):
            t=v-c;co,si=np.cos(angle),np.sin(angle);vv=t.copy();vv[:,1]=t[:,1]*co+t[:,2]*si;vv[:,2]=-t[:,1]*si+t[:,2]*co;vv+=np.array([c[0],y,c[2]])
            for b in rig['storageEnvelopes']:
                n=int(np.all((vv>np.array(b['min']))&(vv<np.array(b['max'])),axis=1).sum())
                if n:storage_hits.append(dict(y=float(y),angle=float(angle),box=b['name'],vertices=n))
    summary=dict(runtimeCommit=manifest['runtimeCommit'],packagingCommit=manifest['packagingCommit'],manifestFilesChecked=len(manifest['files']),manifestMismatches=bad,capturedInputsChecked=len(build['inputs']),capturedInputMismatches=build_bad,protectedFilesChecked=len(protected),protectedBaselineMismatches=changes,previousArchiveMismatches=prior_changes,
       asset={'sha256':h,'bytes':asset.stat().st_size,'renderedTriangles':sum(len(m['faces']) for m in meshes),'renderedPrimitives':len(meshes),'images':len(g.get('images',[]))},
       tireEnvelope={'tireMesh':tire['name'],'radialBoundM':radius,'hubHeightRangeM':rig['supportedHubY'],'lo':lo.tolist(),'hi':hi.tolist(),'padM':pad,'fixedMeshesChecked':len(fixed),'fixedTrianglesChecked':ntri,'triangleIntersections':hits,'minimumSATSeparationLowerBoundM':minimum,'nearestMesh':nearest,'fixedMeshBoundsContainingRestWheelCenter':enclosure_candidates,'enclosureCheckScope':'Bounds prefilter only. An empty list rules out an individual closed fixed mesh enclosing the rest hub; not a manifold or arbitrary multi-mesh solid-union validation.','storageSamples':81*12,'sampledTireVerticesInsideReservedVolumes':storage_hits,'scope':'Conservative complete exported tire envelope vs ALL fixed car triangles. Valid for rig-defined vertical travel and all spins. Does not certify other moving links, physical crash/body flex, or exact OEM construction. Storage test is vertex sampling; not solid-volume proof.'},
       method='Independent numpy/scipy world-space GLB parser and full triangle/box SAT, not a rerun of submitted Blender BVH script. Inputs read-only; test output written outside project.')
    Path(args.output).write_text(json.dumps(summary,indent=2));print(json.dumps(summary,indent=2))
if __name__=='__main__':main()
