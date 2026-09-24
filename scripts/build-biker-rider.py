"""SlingMods Biker rider: game build of the owner-purchased rigged biker (male-biker-rigged/).

Background Blender only, from the repository root:
  .tools/blender-4.5.2-windows-x64/blender.exe -b --factory-startup --python scripts/build-biker-rider.py
  ... -- --fit spyder --render     (one vehicle, plus inspection renders in .tools/biker-rider/)

The purchased source is NOT in Git: this repository is public, and the marketplace licence covers
shipping the character inside the game, not redistributing its FBX/.blend/texture sources. Keep the
download at male-biker-rigged/ (NORMAL RIG.fbx + TEXTURES.zip) to rebuild.

One skinned rider serves every vehicle. The glTF bind stays the purchased T-pose; each vehicle gets a
fit file holding its seated rest pose (every bone's local TRS, read back from an actual export) plus the
DriverAttachment the runtime IK uses. Hands are posed around the real grip/rim geometry measured from
the vehicle GLB, so wheelGripLocal is the wrist position that puts the palm on the control.

Outputs public/assets/drivers/biker/: biker-rider.glb, fit-slingshot.json, fit-ryker.json,
fit-spyder.json, manifest.json.
"""
import bpy, json, math, pathlib, struct, sys, zipfile, hashlib
import numpy as np
from mathutils import Vector, Matrix, Quaternion
from mathutils.bvhtree import BVHTree

R = pathlib.Path(__file__).resolve().parents[1]
SRC = R / 'male-biker-rigged'
OUT = R / 'public/assets/drivers/biker'
TMP = R / '.tools/biker-rider'
ARGS = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else []
ONLY = ARGS[ARGS.index('--fit') + 1] if '--fit' in ARGS else None
RENDER = '--render' in ARGS
FORWARD, UP = Vector((0, 1, 0)), Vector((0, 0, 1))   # Blender world after the rider is turned to face the vehicle


def rt(v):
    """Blender Z-up point/vector -> runtime glTF Y-up (+X right, +Y up, -Z forward)."""
    return [round(v.x, 5), round(v.z, 5), round(-v.y, 5)]


def bl(p):
    return Vector((p[0], -p[2], p[1]))


def update():
    bpy.context.view_layer.update()


# Tilts: positive leans the torso forward. reach: clavicle protraction (degrees) toward the control.
# head_pitch: negative drops the chin. foot_pitch: positive lifts the toes.
# Each vehicle: where the rider sits, how the body is carried, where the feet go (runtime coordinates).
# Grip points are the palm centres on the control in steering_control space; the script measures the
# real bar/rim around each one and refines it onto the tube centreline.
FITS = {
    'slingshot': dict(
        glb='public/assets/model02/slingshot-2026.glb', control='wheel', handlebar=False,
        # Hands at 10 and 2 (30 deg above the 9/3 spokes, whose hub joins cover the rim there).
        grips={'left': (-0.15155, 0.0875, 0.0), 'right': (0.15155, 0.0875, 0.0)},
        # Back in the bucket on the cushion (not 7 cm into it); left heel on the floor, right toe on the
        # throttle pad (x -0.25..-0.31, face 0.30-0.44 m high) clear of the brake pedal inboard of it.
        hip=(-0.375, 0.50, 0.25), pelvis_tilt=-10, chest_tilt=6, head_pitch=-2, reach=22,
        ankles={'left': (-0.47, 0.35, -0.64), 'right': (-0.285, 0.355, -0.59)}, foot_pitch=38,
        knee_out=0.05, wrist_ext=8, eye_forward=0.0),
    'ryker': dict(
        glb='public/assets/ryker/complete/ryker-900-complete.glb', control='bar', handlebar=True,
        grips={'left': (-0.274, 0.02, 0.012), 'right': (0.274, 0.02, 0.012)},
        # In the seat pocket behind the seat's front ridge (0.62 m cushion, ridge 0.79 m at z 0.17-0.2), leaning
        # to the low bars; balls of the feet on the pegs (tops 0.19 m at z -0.22), right toe under the brake pedal.
        hip=(0.0, 0.78, 0.43), pelvis_tilt=20, chest_tilt=26, head_pitch=-12, reach=18,
        ankles={'left': (-0.36, 0.29, -0.09), 'right': (0.36, 0.29, -0.09)}, foot_pitch=4,
        knee_out=0.50, wrist_ext=10, eye_forward=0.0, grip_inset=0.012,
        # Seated further back, the rider leans and turns into the outside grip at full lock.
        handlebar_pose=(0, -0.35, 0.75)),
    'spyder': dict(
        glb='public/assets/spyder/spyder-f3.glb', control='bar', handlebar=True,
        grips={'left': (-0.4805574, 0.2050073, 0.1751104), 'right': (0.4761434, 0.2050073, 0.1751104)},
        # Seated in the seat pocket (buttocks on the 0.76 m cushion, clear of the tank ramp), knees outside the
        # side panels, balls of the feet on the forward footpegs (peg tops 0.315 m at z -0.32, x 0.31-0.44).
        hip=(0.0, 0.965, 0.30), pelvis_tilt=10, chest_tilt=22, head_pitch=-6, reach=14,
        ankles={'left': (-0.39, 0.408, -0.18), 'right': (0.39, 0.41, -0.16)}, foot_pitch=8,
        knee_out=0.30, wrist_ext=6, eye_forward=0.0, grip_inset=0.08,
        # 96 cm bars: at full lock the outside grip swings ~27 cm forward, so the rider leans and turns into it
        # (tests/biker-rider.test.ts keeps both hands on the grips through full lock).
        handlebar_pose=(0, -0.6, 1.2)),
}

NAMES = {'root.x': 'driver_pelvis', 'spine_01.x': 'driver_spine', 'spine_02.x': 'driver_spine_02',
         'spine_03.x': 'driver_chest', 'neck.x': 'driver_neck', 'head.x': 'driver_head'}
for s, side in (('l', 'left'), ('r', 'right')):
    NAMES.update({f'shoulder.{s}': f'driver_clavicle_{side}', f'arm_stretch.{s}': f'driver_upper_arm_{side}',
                  f'arm_twist.{s}': f'driver_upper_arm_twist_{side}', f'forearm_stretch.{s}': f'driver_forearm_{side}',
                  f'forearm_twist.{s}': f'driver_forearm_twist_{side}', f'hand.{s}': f'driver_hand_{side}',
                  f'thigh_stretch.{s}': f'driver_thigh_{side}', f'thigh_twist.{s}': f'driver_thigh_twist_{side}',
                  f'leg_stretch.{s}': f'driver_shin_{side}', f'leg_twist.{s}': f'driver_shin_twist_{side}',
                  f'foot.{s}': f'driver_foot_{side}', f'toes_01.{s}': f'driver_toes_{side}'})
    for f in ('thumb', 'index', 'middle', 'ring', 'pinky'):
        for k in (1, 2, 3):
            NAMES[f'c_{f}{k}.{s}'] = f'driver_{f}{k}_{side}'
FINGERS = ('index', 'middle', 'ring', 'pinky')
# Glove skin thickness around each digit bone (m), proximal -> distal, used to stop the curl at the control surface.
FINGER_SKIN = {1: .012, 2: .011, 3: .0095}
THUMB_SKIN = {1: .013, 2: .012, 3: .0105}
PALM = .033                     # palm surface to hand-bone plane (m): the glove rests on the grip, not in it


# ---------------------------------------------------------------- source character -> game rig
def load_character():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.fbx(filepath=str(SRC / 'NORMAL RIG.fbx'), use_anim=False)
    arm = next(o for o in bpy.data.objects if o.type == 'ARMATURE')
    mesh = next(o for o in bpy.data.objects if o.type == 'MESH')
    for pb in arm.pose.bones:
        pb.matrix_basis = Matrix.Identity(4)
    # Face the vehicle's forward (+Y in Blender = runtime -Z) and bake the FBX centimetre scale.
    turn = Matrix.Rotation(math.pi, 4, 'Z')
    mw = mesh.matrix_world.copy()
    mesh.parent = None
    mesh.matrix_world = turn @ mw
    arm.matrix_world = turn @ arm.matrix_world
    for o in (arm, mesh):
        bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
        bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    mesh.parent = arm; mesh.matrix_parent_inverse = Matrix.Identity(4)
    for m in mesh.modifiers:
        if m.type == 'ARMATURE':
            m.object = arm
    for old, new in NAMES.items():
        b = arm.data.bones.get(old)
        if b:
            b.name = new
        g = mesh.vertex_groups.get(old)
        if g:
            g.name = new
    # The runtime leans/breathes about the torso's local +X; the purchased rig's torso X points left.
    bpy.context.view_layer.objects.active = arm; bpy.ops.object.mode_set(mode='EDIT')
    for n in ('driver_pelvis', 'driver_spine', 'driver_spine_02', 'driver_chest', 'driver_neck', 'driver_head'):
        eb = arm.data.edit_bones[n]
        if eb.x_axis.x < 0:
            eb.roll += math.pi
    bpy.ops.object.mode_set(mode='OBJECT')
    arm.name = arm.data.name = 'driver_rig'
    # Drop the source author's tool metadata (rigging add-on state, a fluid-sim pointer) from the export.
    for idb in [arm, arm.data, mesh, mesh.data, *arm.data.bones, *arm.pose.bones]:
        for k in list(idb.keys()):
            del idb[k]
    root = bpy.data.objects.new('driver_root', None); bpy.context.scene.collection.objects.link(root)
    arm.parent = root
    root['riderMotionVersion'] = 1
    root['riderDesign'] = 'SlingMods Biker / black leather / full-face helmet'
    # Head + helmet stay separate so the cockpit camera can hide them (headVisualNode).
    slot = {m.name: i for i, m in enumerate(mesh.data.materials)}
    body_mat, hand_mat, head_mat, helmet_mat = 'Material.001', 'Material.022', 'Material.021', 'Material.002'
    bpy.ops.object.select_all(action='DESELECT'); mesh.select_set(True); bpy.context.view_layer.objects.active = mesh
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='DESELECT')
    for n in (head_mat, helmet_mat):
        mesh.active_material_index = slot[n]; bpy.ops.object.material_slot_select()
    bpy.ops.mesh.separate(type='SELECTED'); bpy.ops.object.mode_set(mode='OBJECT')
    head = next(o for o in bpy.data.objects if o.type == 'MESH' and o != mesh)
    mesh.name = mesh.data.name = 'driver_body_visual'
    head.name = head.data.name = 'driver_head_visual'
    for o in (mesh, head):
        bpy.ops.object.select_all(action='DESELECT'); o.select_set(True); bpy.context.view_layer.objects.active = o
        bpy.ops.object.material_slot_remove_unused()
    build_materials({body_mat: mesh, hand_mat: mesh, head_mat: head, helmet_mat: head})
    return root, arm, mesh, head


# ---------------------------------------------------------------- materials and derived maps
def box_blur(a, r):
    for axis in (0, 1):
        pad = [(0, 0)] * a.ndim; pad[axis] = (r + 1, r)
        c = np.cumsum(np.pad(a, pad, mode='edge'), axis=axis)
        a = (np.take(c, range(2 * r + 1, c.shape[axis]), axis=axis) - np.take(c, range(0, c.shape[axis] - 2 * r - 1), axis=axis)) / (2 * r + 1)
    return a


def gauss(a, r):
    for _ in range(3):
        a = box_blur(a, r)
    return a


def image_array(path, size):
    img = bpy.data.images.load(str(path)); img.colorspace_settings.name = 'Non-Color'
    if img.size[0] != size:
        img.scale(size, size)
    a = np.empty(size * size * 4, np.float32); img.pixels.foreach_get(a)
    bpy.data.images.remove(img)
    return a.reshape(size, size, 4)


def new_image(name, arr, color=True):
    h, w = arr.shape[:2]
    img = bpy.data.images.new(name, w, h, alpha=False)
    img.colorspace_settings.name = 'sRGB' if color else 'Non-Color'
    rgba = np.ones((h, w, 4), np.float32); rgba[..., :arr.shape[2]] = arr[..., :min(arr.shape[2], 4)]
    img.pixels.foreach_set(rgba.ravel()); img.pack()
    return img


def leather_maps(albedo):
    """Recover relief from the painted leather: fold normals, grain roughness and metal hardware."""
    rgb = albedo[..., :3]; L = rgb @ np.array([.2126, .7152, .0722], np.float32)
    island = gauss((L > .004).astype(np.float32), 2) > .5
    fine = L - gauss(L, 3); folds = gauss(L, 3) - gauss(L, 22)
    s = lambda x: x / (np.std(x[island]) + 1e-6)
    h = .55 * s(fine) + 1.0 * s(folds); h[~island] = 0
    h = gauss(h, 1)
    dx = (np.roll(h, -1, 1) - np.roll(h, 1, 1)) * .5; dy = (np.roll(h, -1, 0) - np.roll(h, 1, 0)) * .5
    k = .55
    n = np.dstack([-dx * k, -dy * k, np.ones_like(h)]); n /= np.linalg.norm(n, axis=2, keepdims=True)
    sat = rgb.max(2) - rgb.min(2)
    metal = np.clip((L - .30) / .20, 0, 1) * np.clip(1 - sat / .08, 0, 1) * np.clip(s(fine) * .5 + .5, 0, 1)
    metal = np.clip(gauss(metal, 1) * 1.4, 0, 1)
    rough = np.clip(.50 + .07 * np.tanh(-s(folds) * .6) + .05 * np.tanh(-s(fine) * .5), .34, .66)
    rough = rough * (1 - metal) + .28 * metal
    orm = np.dstack([np.ones_like(L), rough, metal])
    return n * .5 + .5, orm


def material(name, base, normal=None, orm=None, rough=.5, metal=0., coat=0., normal_strength=1.):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; p = nt.nodes['Principled BSDF']
    t = nt.nodes.new('ShaderNodeTexImage'); t.image = base; nt.links.new(t.outputs['Color'], p.inputs['Base Color'])
    p.inputs['Roughness'].default_value = rough; p.inputs['Metallic'].default_value = metal
    if normal:
        tn = nt.nodes.new('ShaderNodeTexImage'); tn.image = normal
        nm = nt.nodes.new('ShaderNodeNormalMap'); nm.inputs['Strength'].default_value = normal_strength
        nt.links.new(tn.outputs['Color'], nm.inputs['Color']); nt.links.new(nm.outputs['Normal'], p.inputs['Normal'])
    if orm:
        to = nt.nodes.new('ShaderNodeTexImage'); to.image = orm
        sep = nt.nodes.new('ShaderNodeSeparateColor'); nt.links.new(to.outputs['Color'], sep.inputs['Color'])
        nt.links.new(sep.outputs['Green'], p.inputs['Roughness']); nt.links.new(sep.outputs['Blue'], p.inputs['Metallic'])
    if coat:
        p.inputs['Coat Weight'].default_value = coat; p.inputs['Coat Roughness'].default_value = .06
    return m


def build_materials(slots):
    tex = TMP / 'textures'
    tex.mkdir(parents=True, exist_ok=True)
    with zipfile.ZipFile(SRC / 'TEXTURES.zip') as z:
        z.extractall(tex)
    albedo = image_array(tex / 'body.png', 2048)
    n, orm = leather_maps(albedo)
    leather = material('Biker_Leather', new_image('biker_leather_base', albedo[..., :3]),
                       new_image('biker_leather_normal', n, False), new_image('biker_leather_orm', orm, False))
    hands = image_array(tex / 'HAND.png', 1024)
    skin_hands = material('Biker_Skin_Hands', new_image('biker_hands_base', hands[..., :3]), rough=.52)
    head = image_array(tex / 'HEAD BASE.png', 512); head_n = image_array(tex / 'HEAD NORMAL.png', 512)
    skin_head = material('Biker_Skin_Head', new_image('biker_head_base', head[..., :3]),
                         new_image('biker_head_normal', head_n[..., :3], False), rough=.55)
    hb = image_array(tex / 'HELMET/BASE.png', 1024); hn = image_array(tex / 'HELMET/NORMAL.png', 1024)
    hr = image_array(tex / 'HELMET/ROUGHNESS.png', 1024); hm = image_array(tex / 'HELMET/METALLIC.png', 1024)
    horm = np.dstack([np.ones(hr.shape[:2], np.float32), hr[..., 0], hm[..., 0]])
    helmet = material('Biker_Helmet', new_image('biker_helmet_base', hb[..., :3]),
                      new_image('biker_helmet_normal', hn[..., :3], False), new_image('biker_helmet_orm', horm, False), coat=.55)
    by_source = {'Material.001': leather, 'Material.022': skin_hands, 'Material.021': skin_head, 'Material.002': helmet}
    for src_name, ob in slots.items():
        for i, m in enumerate(ob.data.materials):
            if m and m.name == src_name:
                ob.data.materials[i] = by_source[src_name]


# ---------------------------------------------------------------- vehicle geometry
def glb_json(path):
    with open(path, 'rb') as f:
        f.seek(12); n = struct.unpack('<I', f.read(4))[0]; f.read(4)
        return json.loads(f.read(n))


def node_world(j, name):
    parent = {c: i for i, n in enumerate(j['nodes']) for c in n.get('children', [])}
    idx = next(i for i, n in enumerate(j['nodes']) if n.get('name') == name)

    def local(n):
        if 'matrix' in n:
            return Matrix([n['matrix'][i::4] for i in range(4)])
        t = n.get('translation', [0, 0, 0]); q = n.get('rotation', [0, 0, 0, 1]); s = n.get('scale', [1, 1, 1])
        return Matrix.LocRotScale(Vector(t), Quaternion((q[3], q[0], q[1], q[2])), Vector(s))
    m = local(j['nodes'][idx]); i = parent.get(idx)
    while i is not None:
        m = local(j['nodes'][i]) @ m; i = parent.get(i)
    return m     # runtime space


def import_vehicle(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=str(R / path))
    objs = [o for o in bpy.data.objects if o not in before]
    for o in objs:
        o.hide_select = True
    return objs


def descendants(o):
    out = [o]
    for c in o.children:
        out += descendants(c)
    return out


def measure_grip(control, point, inset=0.0):
    """Bar/rim tube at a palm point (Blender world): centreline point under the palm and tube axis.
    A tube's surface normals are all perpendicular to its axis, so the axis is the direction the normals
    avoid. That ignores end caps, switch housings and levers that fool a plain point-cloud fit."""
    P, N = [], []
    for o in descendants(control):
        if o.type != 'MESH' or not o.visible_get():
            continue
        n = len(o.data.vertices)
        co = np.empty(n * 3, np.float32); o.data.vertices.foreach_get('co', co)
        no = np.empty(n * 3, np.float32); o.data.vertices.foreach_get('normal', no)
        mw = np.array(o.matrix_world); w = co.reshape(-1, 3) @ mw[:3, :3].T + mw[:3, 3]
        keep = np.linalg.norm(w - np.array(point), axis=1) < .08
        if keep.any():
            nw = no.reshape(-1, 3)[keep] @ np.linalg.inv(mw[:3, :3])
            P.append(w[keep]); N.append(nw / (np.linalg.norm(nw, axis=1, keepdims=True) + 1e-9))
    if not P:
        return None
    P, N = np.concatenate(P), np.concatenate(N)
    if len(P) < 24:
        return None
    # The long grip dominates an 8 cm cloud even when levers/switches share its mesh: take its direction,
    # then refine on nearby tube wall only (normals perpendicular to the axis).
    centre = P.mean(0); axis = np.linalg.svd(P - centre, full_matrices=False)[2][0]; radius = .015
    for _ in range(4):
        d = P - centre; off = d - np.outer(d @ axis, axis)
        wall = (np.linalg.norm(off, axis=1) < .03) & (np.abs(N @ axis) < .4)
        if wall.sum() < 24:
            break
        Pw, Nw = P[wall], N[wall]
        axis = np.linalg.eigh(Nw.T @ Nw)[1][:, 0]
        d = Pw - Pw.mean(0); d -= np.outer(d @ axis, axis)
        radius = float(np.median(np.abs((d * Nw).sum(1))))
        centre = (Pw - Nw * radius).mean(0)
    P = P[wall] if wall.sum() >= 24 else P
    g0 = np.array(point); g = centre + axis * ((g0 - centre) @ axis)
    ax = Vector(axis).normalized()
    if ax.dot(Vector(g) - control.matrix_world.to_translation()) < 0:
        ax = -ax                                        # axis points outboard, toward the bar end
    return Vector(g) - ax * inset, ax, len(P), radius


def control_bvh(control):
    """World-space surface of the steering control (bar/rim, grips, spokes, switch gear, levers)."""
    dg = bpy.context.evaluated_depsgraph_get(); V, F = [], []
    for o in descendants(control):
        if o.type != 'MESH' or not o.visible_get():
            continue
        e = o.evaluated_get(dg); me = e.to_mesh(); mw = o.matrix_world; off = len(V)
        V += [mw @ v.co for v in me.vertices]; F += [[off + i for i in p.vertices] for p in me.polygons]
        e.to_mesh_clear()
    return BVHTree.FromPolygons(V, F)


# ---------------------------------------------------------------- posing (same limb solver as runtime)
def solve_elbow(shoulder, target, pole, upper, lower):
    direction = target - shoulder; distance = max(.015, min(direction.length, upper + lower - .0001))
    direction.normalize(); across = (pole - shoulder); across -= direction * across.dot(direction)
    if across.length_squared < 1e-8:
        across = Vector((1, 0, 0)).cross(direction)
    across.normalize()
    along = (upper * upper - lower * lower + distance * distance) / (2 * distance)
    return shoulder + direction * along + across * math.sqrt(max(0, upper * upper - along * along))


def frame(d, h):
    d = d.normalized(); h = (h - d * h.dot(d)).normalized()
    return Matrix((d, h, d.cross(h))).transposed()


class Poser:
    def __init__(self, arm):
        self.arm = arm; self.pb = arm.pose.bones
        self.rest = {b.name: b.matrix_local.copy() for b in arm.data.bones}

    def reset(self):
        for p in self.pb:
            p.matrix_basis = Matrix.Identity(4)
        update()

    def head(self, n):
        return self.pb[n].matrix.to_translation()

    def rest_head(self, n):
        return self.rest[n].to_translation()

    def set_rot(self, n, rot3, at=None):
        head = at if at is not None else self.head(n)
        self.pb[n].matrix = Matrix.Translation(head) @ rot3.to_4x4(); update()

    def rotate_world(self, n, axis, angle):
        cur = self.pb[n].matrix.to_3x3().normalized()
        self.set_rot(n, Matrix.Rotation(angle, 3, axis) @ cur)

    def limb(self, upper, lower, end, target, pole):
        S = self.head(upper)
        a0, b0, c0 = self.rest_head(upper), self.rest_head(lower), self.rest_head(end)
        L1, L2 = (b0 - a0).length, (c0 - b0).length
        hinge0 = (b0 - a0).cross(c0 - b0)
        E = solve_elbow(S, target, pole, L1, L2)
        hinge = (E - S).cross(target - E)
        for bone, d0, d in ((upper, b0 - a0, E - S), (lower, c0 - b0, target - E)):
            q = frame(d, hinge) @ frame(d0, hinge0).transposed()
            self.set_rot(bone, q @ self.rest[bone].to_3x3())
        return E

    def wrap(self, bone, axis, sign, degrees, surface, skin):
        """Curl a digit segment toward its nominal angle, stopping where its skin would touch the control."""
        def clear():
            a, b = self.pb[bone].head, self.pb[bone].tail
            for u in (.25, .5, .75, 1.0):
                p = a.lerp(b, u); loc, n, _, d = surface.find_nearest(p, .2)
                if loc is not None and ((p - loc).dot(n) < 0 or d < skin):
                    return False
            return True
        if not clear():                                        # already touching: keep the authored curl
            self.rotate_world(bone, axis, sign * math.radians(degrees)); return
        done = 0.0
        while done < degrees:
            step = min(2.0, degrees - done)
            self.rotate_world(bone, axis, sign * math.radians(step))
            if not clear():
                self.rotate_world(bone, axis, -sign * math.radians(step)); return
            done += step

    def curl_sign(self, bone, axis, toward):
        """Rotation sense about a world axis that swings the bone's tail toward `toward` (decided once per digit)."""
        d = self.pb[bone].matrix.to_3x3().col[1]
        return 1 if (Matrix.Rotation(.3, 3, axis) @ d).dot(toward) > (Matrix.Rotation(-.3, 3, axis) @ d).dot(toward) else -1


def hand_model(poser, side, radius=.016):
    """Hand-local grip geometry from the purchased T-pose: knuckle direction, palm normal, grip centre."""
    hn = f'driver_hand_{side}'; rest = poser.rest[hn].to_3x3()
    wrist = poser.rest_head(hn); knuckle = poser.rest_head(f'driver_middle1_{side}')
    F = (knuckle - wrist).normalized(); N = Vector((0, 0, -1)); N = (N - F * N.dot(F)).normalized()
    meta = (knuckle - wrist).length
    grip = wrist + F * (meta * .86) + N * (PALM + radius)   # tube centre under the palm's distal crease
    inv = rest.transposed()
    return inv @ F, inv @ N, inv @ (grip - wrist)


def pose_for(poser, fit, control_obj, sc_world_bl):
    poser.reset()
    # Pelvis on the seat, torso carried per vehicle, eyes level.
    pel = 'driver_pelvis'
    hip = bl(fit['hip'])
    poser.set_rot(pel, Matrix.Rotation(-math.radians(fit['pelvis_tilt']), 3, 'X') @ poser.rest[pel].to_3x3(), at=hip)
    poser.rotate_world('driver_chest', Vector((1, 0, 0)), -math.radians(fit['chest_tilt']))
    poser.set_rot('driver_head', Matrix.Rotation(math.radians(fit['head_pitch']), 3, 'X') @ poser.rest['driver_head'].to_3x3())
    report = {}
    for side in ('left', 'right'):
        c = f'driver_clavicle_{side}'
        poser.rotate_world(c, UP, poser.curl_sign(c, UP, FORWARD) * math.radians(fit['reach']))
    for side, sign in (('left', -1), ('right', 1)):
        g0 = sc_world_bl @ Vector(bl(fit['grips'][side]))
        m = measure_grip(control_obj, g0, fit.get('grip_inset', 0.0))
        radius = m[3] if m else .016
        g, axis = (m[0], m[1]) if m else (g0, (sc_world_bl.to_3x3() @ Vector((1, 0, 0))).normalized())
        if fit['control'] == 'wheel':
            centre = sc_world_bl.to_translation()
            hint = (centre - g); hint -= axis * hint.dot(axis)            # palm faces the wheel's centre
        else:
            hint = -UP.copy()                                              # palm on top of the bar
        F_l, N_l, grip_l = hand_model(poser, side, radius)
        up, lo, hn = f'driver_upper_arm_{side}', f'driver_forearm_{side}', f'driver_hand_{side}'
        S = poser.head(up)
        pole = (S + g) * .5 + Vector((sign * .30, -.08, -.28))
        f_des = (g - S).normalized(); W = g
        for _ in range(6):
            Fw = f_des - axis * f_des.dot(axis); Fw.normalize()
            Nw = axis.cross(Fw)
            if Nw.dot(hint) < 0:
                Nw = -Nw
            ext = math.radians(fit['wrist_ext'])
            Fw2 = (Fw * math.cos(ext) - Nw * math.sin(ext)).normalized(); Nw = (Nw - Fw2 * Nw.dot(Fw2)).normalized(); Fw = Fw2
            Q = frame(Fw, Nw) @ frame(F_l, N_l).transposed()
            W = g - Q @ grip_l
            E = solve_elbow(S, W, pole, (poser.rest_head(lo) - poser.rest_head(up)).length, (poser.rest_head(hn) - poser.rest_head(lo)).length)
            f_des = (W - E).normalized()
        E = poser.limb(up, lo, hn, W, pole)
        poser.set_rot(hn, Q)
        # Fingers wrap the tube; the thumb closes from the opposite side. Each segment curls toward its authored
        # angle but stops where its skin meets the real control surface, so fingertips rest on the grip/rim
        # (and on spokes, switch gear or levers) instead of sinking into it.
        surface = control_bvh(control_obj)
        for f in FINGERS:
            s = poser.curl_sign(f'driver_{f}1_{side}', axis, Nw)
            for k, ang in ((1, 62), (2, 78), (3, 48)):
                poser.wrap(f'driver_{f}{k}_{side}', axis, s, ang, surface, FINGER_SKIN[k])
        t_axis = poser.pb[f'driver_thumb1_{side}'].matrix.to_3x3().col[0].normalized()
        s = poser.curl_sign(f'driver_thumb1_{side}', t_axis, Nw)
        for k, ang in ((1, 18), (2, 28), (3, 22)):
            poser.wrap(f'driver_thumb{k}_{side}', t_axis, s, ang, surface, THUMB_SKIN[k])
        report[side] = dict(grip=g, axis=axis, wrist=W, elbow=E, pole=pole, measured=bool(m), samples=m[2] if m else 0, radius=m[3] if m else 0)
    for side, sign in (('left', -1), ('right', 1)):
        th, sh, ft = f'driver_thigh_{side}', f'driver_shin_{side}', f'driver_foot_{side}'
        A = bl(fit['ankles'][side]); H = poser.head(th)
        pole = (H + A) * .5 + Vector((sign * fit['knee_out'], .45, .35))
        K = poser.limb(th, sh, ft, A, pole)
        poser.set_rot(ft, Matrix.Rotation(math.radians(fit['foot_pitch']), 3, 'X') @ poser.rest[ft].to_3x3())
        report['leg_' + side] = dict(ankle=A, knee=K, pole=pole)
    return report


def eye_point(poser, head_obj):
    """Cockpit eye from the actual head mesh: 11.5 cm under the crown, 3 cm behind the brow line."""
    me = head_obj.data; mats = [m.name for m in me.materials]
    skin = mats.index('Biker_Skin_Head')
    vs = [me.vertices[i].co for p in me.polygons if p.material_index == skin for i in p.vertices]
    top = max(v.z for v in vs); front = max(v.y for v in vs)
    rest_eye = Vector((0, front - .045, top - .115))
    hn = 'driver_head'
    return poser.pb[hn].matrix @ poser.rest[hn].inverted() @ rest_eye


# ---------------------------------------------------------------- export and read-back
def export(path, objs, materials=True):
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs:
        o.hide_select = False; o.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=str(path), export_format='GLB', use_selection=True, export_extras=True, export_yup=True,
        export_apply=False, export_skins=True, export_all_influences=False, export_rest_position_armature=False,
        export_animations=False, export_morph=False, export_tangents=False, export_cameras=False, export_lights=False,
        export_materials='EXPORT' if materials else 'NONE',
        export_image_format='WEBP' if materials else 'NONE', export_image_quality=88)


def rest_pose_from(path, bones):
    j = glb_json(path); out = {}
    for n in j['nodes']:
        if n.get('name') in bones:
            e = {'t': [round(x, 6) for x in n.get('translation', [0, 0, 0])], 'r': [round(x, 7) for x in n.get('rotation', [0, 0, 0, 1])]}
            s = n.get('scale')
            if s and max(abs(x - 1) for x in s) > 1e-4:
                e['s'] = [round(x, 6) for x in s]
            out[n['name']] = e
    return out


def attachment(poser, fit, rep, sc_runtime, eye, rest_pose):
    inv = sc_runtime.inverted()
    arms = {}
    for side in ('left', 'right'):
        up, lo, hn = f'driver_upper_arm_{side}', f'driver_forearm_{side}', f'driver_hand_{side}'
        S, E, W = poser.head(up), poser.head(lo), poser.head(hn)
        arms[side] = dict(upperBone=up, lowerBone=lo, handBone=hn, shoulder=rt(S), elbow=rt(E), wrist=rt(W), contact=rt(rep[side]['grip']),
                          upperLength=round((E - S).length, 6), lowerLength=round((W - E).length, 6), poleHint=rt(rep[side]['pole']),
                          wheelGripLocal=[round(x, 6) for x in inv @ Vector(rt(W))])
    legs = {}
    for side in ('left', 'right'):
        th, sh, ft = f'driver_thigh_{side}', f'driver_shin_{side}', f'driver_foot_{side}'
        H, K, A = poser.head(th), poser.head(sh), poser.head(ft)
        legs[side] = dict(upperBone=th, lowerBone=sh, footBone=ft, ankle=rt(A), pole=rt(rep['leg_' + side]['pole']),
                          upperLength=round((K - H).length, 6), lowerLength=round((A - K).length, 6), footPitch=0)
    out = dict(version=2, asset='/assets/drivers/biker/biker-rider.glb', rider='biker',
               basis='runtime +X right,+Y up,-Z forward; vehicle space, scale 1',
               rootNode='driver_root', rigNode='driver_rig', bodyNode='driver_body_visual', headVisualNode='driver_head_visual',
               handlebar=fit['handlebar'], rootOffset=[0, 0, 0], eye=rt(eye), arms=arms,
               feet={s: dict(bone=f'driver_foot_{s}', anchor=legs[s]['ankle']) for s in ('left', 'right')}, legs=legs,
               restPose=rest_pose)
    if fit['handlebar']:
        # Posture is authored in the rest pose; the runtime only adds a small steer-follow lean and twist.
        lean, extra, twist = fit.get('handlebar_pose', (0, -.12, .3))
        out['handlebarPose'] = dict(lean=lean, extraLean=extra, twist=twist)
    return out


# ---------------------------------------------------------------- inspection renders
def render(name, fit, rep, eye):
    sc = bpy.context.scene; sc.render.engine = 'BLENDER_EEVEE_NEXT'; sc.render.resolution_x = 1280; sc.render.resolution_y = 900
    if not sc.world:
        w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
        w.node_tree.nodes['Background'].inputs[0].default_value = (.62, .66, .72, 1)
        for i, (rot, e) in enumerate([((55, 0, 30), 3.2), ((35, 0, 210), 1.6)]):
            l = bpy.data.objects.new(f'sun{i}', bpy.data.lights.new(f'sun{i}', 'SUN')); l.data.energy = e
            l.rotation_euler = [math.radians(a) for a in rot]; sc.collection.objects.link(l)
    cam = bpy.data.objects.get('inspect_cam') or bpy.data.objects.new('inspect_cam', bpy.data.cameras.new('inspect_cam'))
    if cam.name not in sc.collection.objects:
        sc.collection.objects.link(cam)
    sc.camera = cam
    hip = bl(fit['hip']); gl, gr = rep['left']['grip'], rep['right']['grip']; mid = (gl + gr) * .5
    views = [('side', hip + Vector((-2.6, .35, .15)), hip + Vector((0, .25, .2)), 38),
             ('front', hip + Vector((1.5, 2.6, .6)), hip + Vector((0, .2, .25)), 38),
             ('rear', hip + Vector((-1.2, -2.2, 1.0)), hip + Vector((0, .3, .25)), 38),
             ('hand-left', gl + Vector((-.26, .30, .14)), gl, 45),
             ('hand-right', gr + Vector((.26, .30, .14)), gr, 45),
             ('hand-top', mid + Vector((0, -.05, .55)), mid, 30),
             ('cockpit', eye, mid + Vector((0, .6, -.1)), 22)]
    for view, pos, tgt, lens in views:
        cam.location = pos; cam.rotation_euler = (tgt - pos).to_track_quat('-Z', 'Y').to_euler(); cam.data.lens = lens
        cam.data.clip_start = .02
        head = bpy.data.objects['driver_head_visual']; head.hide_render = view == 'cockpit'
        sc.render.filepath = str(TMP / f'{name}-{view}.png'); bpy.ops.render.render(write_still=True)


# ---------------------------------------------------------------- main
def main():
    TMP.mkdir(parents=True, exist_ok=True); OUT.mkdir(parents=True, exist_ok=True)
    root, arm, body, head = load_character()
    rider = [root, arm, body, head]
    poser = Poser(arm)
    bones = {b.name for b in arm.data.bones}
    summary = {}
    names = [ONLY] if ONLY else list(FITS)
    for name in names:
        fit = FITS[name]
        vehicle = import_vehicle(fit['glb'])
        control = next(o for o in vehicle if o.name == 'steering_control')
        j = glb_json(R / fit['glb']); sc_runtime = node_world(j, 'steering_control')
        sc_bl = control.matrix_world.copy()
        assert (sc_bl.to_translation() - bl(sc_runtime.to_translation())).length < 1e-3, 'glTF import axis mismatch'
        rep = pose_for(poser, fit, control, sc_bl)
        eye = eye_point(poser, head) + FORWARD * fit['eye_forward']
        tmp = TMP / f'pose-{name}.glb'; export(tmp, rider, materials=False)
        rest = rest_pose_from(tmp, bones)
        att = attachment(poser, fit, rep, sc_runtime, eye, rest)
        (OUT / f'fit-{name}.json').write_text(json.dumps(att, indent=1))
        summary[name] = {s: dict(measured=rep[s]['measured'], samples=rep[s]['samples'], axis=rt(rep[s]['axis']), tubeRadius=round(rep[s]['radius'], 4),
                                 gripShift=round((rep[s]['grip'] - sc_bl @ bl(fit['grips'][s])).length, 4)) for s in ('left', 'right')}
        print('FIT', name, json.dumps(summary[name]))
        if RENDER:
            render(name, fit, rep, eye)
        for o in vehicle:
            bpy.data.objects.remove(o, do_unlink=True)
    if ONLY and ONLY != 'slingshot':
        return
    # The shipped GLB rests in the Slingshot pose; every presenter applies its own fit's restPose anyway.
    fit = FITS['slingshot']
    vehicle = import_vehicle(fit['glb']); control = next(o for o in vehicle if o.name == 'steering_control')
    pose_for(poser, fit, control, control.matrix_world.copy())
    for o in vehicle:
        bpy.data.objects.remove(o, do_unlink=True)
    glb = OUT / 'biker-rider.glb'; export(glb, rider)
    data = glb.read_bytes(); j = glb_json(glb)
    tris = sum(a['count'] // 3 for m in j['meshes'] for p in m['primitives'] for a in [j['accessors'][p['indices']]])
    (OUT / 'manifest.json').write_text(json.dumps(dict(
        version=1, asset='/assets/drivers/biker/biker-rider.glb', source='male-biker-rigged/ (owner purchase, not in Git)',
        build='scripts/build-biker-rider.py', triangles=tris, joints=len(j['skins'][0]['joints']),
        materials=[m['name'] for m in j['materials']], images=len(j.get('images', [])), bytes=len(data),
        sha256=hashlib.sha256(data).hexdigest(), fits={n: f'/assets/drivers/biker/fit-{n}.json' for n in FITS},
        grips=summary,
        provenance='Owner-purchased rigged biker character. Game build: turned to vehicle forward, semantic bone names, '
                   'head/helmet split for cockpit, rebuilt PBR materials with leather relief/roughness/hardware maps '
                   'derived from the supplied albedo, per-vehicle seated poses fitted to measured grip geometry.'), indent=1))
    print('BUILT', glb, len(data), 'bytes', tris, 'tris')


main()
