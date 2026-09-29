"""Original Redstone Rally scenery. Run in background Blender; no external sources or downloads.
Exports small reusable GLBs and retains an editable, packed Blender kit.
"""
import bpy, math, random, json
from pathlib import Path
from mathutils import Vector

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/assets/rally'
SOURCE = ROOT / 'assets/blender/rally'
OUT.mkdir(parents=True, exist_ok=True)
SOURCE.mkdir(parents=True, exist_ok=True)
bpy.ops.object.select_all(action='SELECT')
bpy.ops.object.delete(use_global=False)
random.seed(291026)

def mat(name, color, rough=0.9, metal=0):
    m=bpy.data.materials.new(name); m.diffuse_color=(*color,1); m.use_nodes=True
    p=m.node_tree.nodes.get('Principled BSDF'); p.inputs['Base Color'].default_value=(*color,1); p.inputs['Roughness'].default_value=rough; p.inputs['Metallic'].default_value=metal
    return m
stone=[mat('Rally_sandstone_'+str(i),c) for i,c in enumerate([(0.35,.16,.08),(.39,.19,.095),(.43,.22,.115),(.37,.18,.09),(.46,.245,.14)])]
bark=mat('Rally_fissured_bark',(.18,.105,.065)); wood=mat('Rally_cut_timber',(.46,.30,.15)); dark=mat('Rally_dark_steel',(.075,.09,.085),.65,.6)
pine=[mat('Rally_pine_'+str(i),c) for i,c in enumerate([(.055,.12,.085),(.085,.18,.12),(.16,.245,.14)])]
red=mat('Rally_oxide_red',(.58,.08,.035)); cream=mat('Rally_canvas',(.78,.72,.53)); roof=mat('Rally_galvanized',(.31,.34,.32),.65,.65)
current=[]
def keep(o,m):
    o.data.materials.append(m); current.append(o); return o
def box(name,loc,scale,m,bevel=0):
    bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.scale=scale
    bpy.ops.object.transform_apply(location=False,rotation=False,scale=True)
    if bevel:
        mod=o.modifiers.new('Edge wear','BEVEL');mod.width=bevel;mod.segments=1
        bpy.ops.object.modifier_apply(modifier=mod.name)
    return keep(o,m)
def beam(name,a,b,r,m,verts=7,r2=None):
    a,b=Vector(a),Vector(b);d=b-a
    bpy.ops.mesh.primitive_cone_add(vertices=verts,radius1=r,radius2=r if r2 is None else r2,depth=d.length,location=(a+b)/2)
    o=bpy.context.object;o.name=name;o.rotation_euler=d.to_track_quat('Z','Y').to_euler();return keep(o,m)
def finish(name):
    bpy.ops.object.select_all(action='DESELECT')
    for o in current:o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=str(OUT/(name+'.glb')),export_format='GLB',use_selection=True,export_yup=True,export_materials='EXPORT')
    collection=bpy.data.collections.new(name);bpy.context.scene.collection.children.link(collection)
    for o in current:
        for c in list(o.users_collection):c.objects.unlink(o)
        collection.objects.link(o)
    current.clear()

# Stratified sandstone v2: weathered buttes instead of faceted tubes. Same footprint and height as v1 (about 5.2 x 3.6 x 6 m
# before instance scale) so colliders and placements are unchanged. Hard cap-rock layers overhang softer, recessed beds;
# vertical fluting and erosion noise break the silhouette; smooth normals; strata colour lives in vertex colours.
def noise3(x,y,z,seed):
    # Cheap smooth value noise from summed sines (deterministic, no external modules).
    return (math.sin(x*1.7+seed)*math.cos(y*1.3-seed*.7)+math.sin(y*2.3+z*1.1+seed*1.9)*.6+math.sin(z*2.9-x*1.4+seed*.3)*.35)/1.95
_later=random.getstate()  # the trees and props after this keep the exact v1 random sequence
stone_tint=mat('Rally_sandstone_strata',(1,1,1),.92)
# The glTF exporter keeps a colour attribute only when the material reads it (Blender 4.2+), so wire it to Base Color.
_strata=stone_tint.node_tree.nodes.new('ShaderNodeVertexColor');_strata.layer_name='Col'
stone_tint.node_tree.links.new(_strata.outputs['Color'],stone_tint.node_tree.nodes['Principled BSDF'].inputs['Base Color'])
bands=[(0.35,.16,.08),(.43,.22,.115),(.39,.19,.095),(.47,.26,.15),(.33,.15,.075),(.44,.235,.13),(.37,.18,.09)]
for variant in range(3):
    random.seed(291026+variant*17)
    rings=34; sides=40; verts=[]; faces=[]; colors=[]
    outline=[random.uniform(.85,1.15) for _ in range(8)]
    layers=sorted(random.uniform(.06,.94) for _ in range(6))
    def outline_at(a):
        f=a/(2*math.pi)*8; i=int(f)%8; t=f-int(f); t=t*t*(3-2*t)
        return outline[i]*(1-t)+outline[(i+1)%8]*t
    def strata(z):
        # Distance into the current bed (0 at its base, 1 at its cap) and the bed's index.
        edges=[0]+layers+[1]
        for k in range(len(edges)-1):
            if z<=edges[k+1]:return (z-edges[k])/max(edges[k+1]-edges[k],1e-6),k
        return 1,len(edges)-2
    for j in range(rings):
        z=j/(rings-1); into,bed=strata(z)
        # Soft bed recessed at its base, hard cap overhanging at its top; the whole butte tapers and leans slightly.
        ledge=-.09*(1-into)**2+.05*max(0,into-.82)/.18
        taper=(1-z*.36)+ledge
        for i in range(sides):
            a=2*math.pi*i/sides
            flute=.035*math.sin(a*9+variant*1.3)*(.4+.6*z)
            erosion=.08*noise3(math.cos(a)*1.6,math.sin(a)*1.6,z*5,variant*3.1)
            r=outline_at(a)*(taper+flute+erosion)
            top=1 if j<rings-1 else .82
            verts.append((math.cos(a)*r*2.6*top+z*.5,math.sin(a)*r*1.8*top,z*6+.25*noise3(math.cos(a),math.sin(a),variant,1.7)*z))
            c=bands[(bed+variant)%len(bands)]
            shade=.82+.18*into+.06*noise3(a*3,z*14,variant,4.2)   # beds darken toward their recessed base
            varnish=1-.16*max(0,math.sin(a*13+variant))**6*(1-z)  # dark desert-varnish streaks running down
            colors.append(tuple(max(0,min(1,ch*shade*varnish)) for ch in c))
    for j in range(rings-1):
        for i in range(sides):faces.append((j*sides+i,j*sides+(i+1)%sides,(j+1)*sides+(i+1)%sides,(j+1)*sides+i))
    faces.append(tuple(range(sides-1,-1,-1)))
    cap=len(verts);cz=verts[(rings-1)*sides][2]
    verts.append((.5,0,cz+.18));colors.append(bands[(len(layers)+variant)%len(bands)])
    for i in range(sides):faces.append(((rings-1)*sides+i,(rings-1)*sides+(i+1)%sides,cap))
    mesh=bpy.data.meshes.new('Stratified sandstone');mesh.from_pydata(verts,[],faces);mesh.update()
    for p in mesh.polygons:p.use_smooth=True
    attr=mesh.color_attributes.new('Col','FLOAT_COLOR','POINT')
    for k,c in enumerate(colors):attr.data[k].color=(*c,1)
    o=bpy.data.objects.new('redstone_'+str(variant),mesh);bpy.context.collection.objects.link(o);current.append(o)
    mesh.materials.append(stone_tint)
    finish('redstone-'+str(variant))
random.setstate(_later)
for _ in range(3*(11+10*11)):random.random()  # v1's rock loop drew 363 values

# Authored needle atlas: fine individual needles on an asymmetric branch, with an alpha cutout.
import numpy as np
size=512; pixels=np.zeros((size,size,4),dtype=np.float32)
def stroke(a,b,width,color):
    ax,ay=a;bx,by=b;steps=max(1,int(math.hypot(bx-ax,by-ay)*1.7))
    for i in range(steps+1):
        t=i/steps;x=int(ax+(bx-ax)*t);y=int(ay+(by-ay)*t)
        for dy in range(-width,width+1):
            for dx in range(-width,width+1):
                if 0<=x+dx<size and 0<=y+dy<size:pixels[y+dy,x+dx]=(*color,1)
stroke((248,28),(265,480),2,(.25,.20,.10))
for j in range(17):
    y=65+j*23;span=145*(1-j/21)
    for side in [-1,1]:
        x0=249+j;end=(x0+side*span,y+random.uniform(15,40))
        stroke((x0,y),end,1,(.16,.24,.12))
        for k in range(24):
            t=k/24;x=x0+(end[0]-x0)*t;yy=y+(end[1]-y)*t
            for sign in [-1,1]:
                length=random.uniform(15,35)*(1-t*.25);green=random.uniform(.20,.34)
                stroke((x,yy),(x+side*length*.25,yy+sign*length),0,(green*.64,green,green*.48))
image=bpy.data.images.new('Redstone pine needles',width=size,height=size,alpha=True)
image.pixels.foreach_set(pixels.flatten());image.filepath_raw=str(OUT/'pine-needles.png');image.file_format='PNG';image.save();image.pack()
needles=mat('Rally_pine_needles',(.28,.38,.18));nodes=needles.node_tree.nodes;tex=nodes.new('ShaderNodeTexImage');tex.image=image
shader=nodes.get('Principled BSDF');needles.node_tree.links.new(tex.outputs['Color'],shader.inputs['Base Color']);needles.node_tree.links.new(tex.outputs['Alpha'],shader.inputs['Alpha']);needles.surface_render_method='DITHERED';needles.use_backface_culling=False
for variant in range(2):
    beam('Fluted trunk',(0,0,0),(.08,-.12,12),.26,bark,9,.025)
    for tier in range(10):
        z=2.3+tier*.95;r=3.4*(1-tier/11)*random.uniform(.85,1.05)
        for branch in range(6):
            a=branch*math.tau/6+tier*1.7+variant*.6+random.uniform(-.2,.2)
            end=(math.cos(a)*r,math.sin(a)*r,z+.35)
            beam('Branch',(0,0,z+.10),end,.043,bark,5,.008)
            for k in range(2):
                bpy.ops.mesh.primitive_plane_add(size=1,location=(end[0]*.66,end[1]*.66,z+.25))
                o=bpy.context.object;o.name='Pine needle spray';o.scale=(r*.88,r*1.05,1);o.rotation_euler=(.18+k*.95,random.uniform(-.2,.2),a-math.pi/2);keep(o,needles)
    finish('ponderosa-'+str(variant))

beam('Snag',(0,0,0),(.5,.1,7.5),.32,bark,8,.06)
for i in range(6):
    a=i*2.2;z=2+i*.7;beam('Broken limb',(z*.06,0,z),(math.cos(a)*1.3,math.sin(a)*1.3,z+.7),.085,bark,6,.015)
finish('deadwood')

for i in range(5):
    x=(i%3-1)*.6;z=.31+(i//3)*.52
    beam('Stacked log',(x,-2.2,z),(x,2.2,z),.30,bark,10)
    beam('End grain',(x,-2.21,z),(x,-2.22,z),.275,wood,10)
    beam('End grain',(x,2.21,z),(x,2.22,z),.275,wood,10)
finish('log-stack')

# Trackside marshal hut with raised sill, plank siding, roof ribs and a porch.
box('Raised hut', (0,0,1.4),(4.4,3.6,2.7),wood,.05)
for i in range(17):box('Vertical siding',(-2.12+i*.265,-1.82,1.5),(.20,.08,2.55),bark)
box('Door',(.9,-1.89,1.12),(1.0,.08,2.15),dark)
box('Window',(-.85,-1.91,1.85),(1.15,.07,.75),dark)
for x in [-1.5,-.2]:box('Window trim',(x,-1.96,1.85),(.08,.08,.9),cream)
box('Porch',(0,-2.6,.18),(5,1.7,.3),wood)
for x in [-2.35,2.35]:beam('Porch column',(x,-3.25,.2),(x,-3.25,2.6),.09,bark)
for i in range(22):
    r=box('Corrugated roof',(-2.7+i*.255,-.5,2.95),(.25,6.1,.10),roof);r.rotation_euler[0]=.10
finish('marshal-hut')

# Rusted quarry conveyor gantry, diagonals and small headhouse.
for x in [-3.6,3.6]:
    for y in [-2.2,2.2]:
        beam('Gantry leg',(x,y,0),(x*.82,y*.82,10),.16,red,6)
        beam('Cross brace',(x,y,1),(-x*.82,y*.82,8),.065,dark,5)
        box('Footing',(x,y,.2),(1,1,.4),stone[3])
box('Quarry headhouse',(0,0,10.2),(8,5,2),red,.08)
box('Headhouse roof',(0,0,11.3),(8.6,5.6,.18),roof)
for x in [-2.8,-1.4,0,1.4,2.8]:box('Window',(x,-2.52,10.3),(1,.05,.7),dark)
for y in [-.8,.8]:beam('Conveyor frame',(0,y,8),(17,y,2),.12,dark,6)
for i in range(18):box('Conveyor slats',(i,-.0,8-i*6/17),(.25,1.8,.14),roof)
finish('quarry-gantry')

bpy.ops.wm.save_as_mainfile(filepath=str(SOURCE/'redstone-scenery.blend'))
manifest={"version":1,"author":"Original procedural Blender models for Redstone Rally","source":"scripts/build-rally-scenery.py","assets":[{"file":p.name,"bytes":p.stat().st_size} for p in sorted(OUT.glob('*.glb'))]}
(OUT/'scenery.json').write_text(json.dumps(manifest,indent=2)+'\n')
print(json.dumps(manifest))
