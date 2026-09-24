"""Panther Customs SM-8167 two-piece front kit, remodelled September 2026 from the retail photos.

Executed in the build-mods namespace (after refine-products.py clears the earlier kit) and parents
everything to `body`. Runtime coordinates: X right, Y up, -Z forward. Original game surfaces from
photographs; not manufacturer CAD. Shapes that read in the photos and are modelled here:
  - broad molded hood with a raised centre plateau (crisp crease) and rolled shoulders,
  - raised hexagonal centre scoop with a real open throat,
  - two stepped louver gills per side (raised rear lip over a dark pocket),
  - round emblem bezel on the plateau, following the hood slope,
  - heavy V-nosed brow over a trapezoid grille frame, two splayed struts and a low cross bar,
  - fish-scale stamped mesh (rows of hanging arcs, alternate rows offset) over a dark back plate,
  - flared side cheeks that wrap from the brow back to the hood shoulder.
"""
import bmesh

Z0,Z1=-1.035,-.595   # hood front edge / rear edge under the headlights
def sstep(a,b,x):
 x=min(1.,max(0.,(x-a)/(b-a)));return x*x*(3-2*x)
def hood_half(t):return .218+.018*math.sin(t*math.pi)-.060*t*t
def hood_base(t):return .474+.132*t+.010*math.sin(t*math.pi)
def plateau(t):return .34+.12*t
def hood_uy(u,t):
 au=abs(u);y=hood_base(t)+.018*(1-u*u)
 y+=.011*(1-sstep(plateau(t)-.05,plateau(t)+.015,au))   # raised centre plateau, crisp molded crease
 y-=.022*sstep(.78,1.,au)**2*(.3+.7*sstep(0.,.35,t))     # rolled shoulder into the cheeks (flatter at the brow)
 y-=.017*(1-sstep(0.,.28,t))*(1-.45*au*au)               # the hood's beak drops into the brow
 return y
def hood_y(x,z):
 t=min(1.,max(0.,(z-Z0)/(Z1-Z0)));return hood_uy((x-.003)/hood_half(t),t)
def hood_normal(x,z):
 e=.004;dx=(hood_y(x+e,z)-hood_y(x-e,z))/(2*e);dz=(hood_y(x,z+e)-hood_y(x,z-e))/(2*e)
 n=Vector((-dx,1,-dz));return n.normalized()

def build(name,verts,faces,material,smooth=True,sharp=32):
 """Mesh from runtime-space verts; smooth shading with edges sharper than `sharp` degrees split."""
 data=bpy.data.meshes.new(name);data.from_pydata([v(p) for p in verts],[],faces);data.update()
 o=bpy.data.objects.new(name,data);bpy.context.scene.collection.objects.link(o);finish(o,name,body,material)
 bm=bmesh.new();bm.from_mesh(data);bmesh.ops.recalc_face_normals(bm,faces=bm.faces)
 for f in bm.faces:f.smooth=smooth
 for e in bm.edges:
  if len(e.link_faces)==2 and e.calc_face_angle(0)>math.radians(sharp):e.smooth=False
 bm.to_mesh(data);bm.free();data.update();return o
def grid(rows,closed=False):
 """Quad faces for a list of equal-length point rows."""
 n=len(rows[0]);verts=[p for r in rows for p in r];faces=[]
 for j in range(len(rows)-1):
  for i in range(n if closed else n-1):
   a=j*n+i;b=j*n+(i+1)%n;faces.append((a,b,b+n,a+n))
 return verts,faces
def outward(o,direction):
 """Point every face roughly along a runtime direction (recalc can guess wrong on open sheets)."""
 d=v(direction);bm=bmesh.new();bm.from_mesh(o.data);bm.faces.ensure_lookup_table()
 if sum(f.normal.dot(d)*f.calc_area() for f in bm.faces)<0:
  for f in bm.faces:f.normal_flip()
 bm.to_mesh(o.data);bm.free();o.data.update()
def thicken(o,t,bevel=.0025):
 m=o.modifiers.new('Molded wall','SOLIDIFY');m.thickness=t;m.offset=-1;m.use_even_offset=True
 if bevel:b=o.modifiers.new('Molded edge radius','BEVEL');b.width=bevel;b.segments=2;b.limit_method='ANGLE';b.angle_limit=math.radians(40)
def rounded_rect(w,h,r,seg=3):
 pts=[]
 for cx,cy,a0 in [(w/2-r,h/2-r,0),(-w/2+r,h/2-r,90),(-w/2+r,-h/2+r,180),(w/2-r,-h/2+r,270)]:
  for k in range(seg+1):
   a=math.radians(a0+90*k/seg);pts.append((cx+r*math.cos(a),cy+r*math.sin(a)))
 return pts
def sweep(name,path,profile,hint,material,offset=(0,0),caps=True,sharp=60):
 """Sweep a closed 2D profile (a along side, b along up) along a runtime path. `hint` fixes the up axis."""
 path=[Vector(p) for p in path];hint=Vector(hint);rows=[]
 for i,p in enumerate(path):
  T=(path[min(i+1,len(path)-1)]-path[max(i-1,0)]).normalized();side=T.cross(hint).normalized();up=side.cross(T).normalized()
  rows.append([tuple(p+side*(a+offset[0])+up*(b+offset[1])) for a,b in profile])
 verts,faces=grid(rows,True);n=len(profile)
 if caps:faces+= [tuple(range(n))[::-1],tuple(range(len(verts)-n,len(verts)))]
 return build(name,verts,faces,material,True,sharp)
def resample(points,count):
 pts=[Vector(p) for p in points];lengths=[0.]
 for a,b in zip(pts,pts[1:]):lengths.append(lengths[-1]+(b-a).length)
 out=[]
 for k in range(count):
  d=lengths[-1]*k/(count-1);i=max(j for j in range(len(pts)-1) if lengths[j]<=d+1e-9) if d<lengths[-1] else len(pts)-2
  f=(d-lengths[i])/max(lengths[i+1]-lengths[i],1e-9);out.append(tuple(pts[i].lerp(pts[i+1],f)))
 return out

# ---------------------------------------------------------------- hood
NX,NZ=56,40
rows=[]
for j in range(NZ+1):
 t=j/NZ;z=Z0+(Z1-Z0)*t;rows.append([(.003+(2*i/NX-1)*hood_half(t),hood_uy(2*i/NX-1,t),z) for i in range(NX+1)])
verts,faces=grid(rows);hood=build('Panther_molded_hood',verts,faces,black);outward(hood,(0,1,0));thicken(hood,.004,.002)

# ---------------------------------------------------------------- hexagonal centre scoop
SZ0,SZ1,K=-.862,-.648,16
ring=lambda t:[(-(.086-.010*t),-.003,0),(-(.068-.014*t),.74,1),(-(.052-.014*t),1.,1),((.052-.014*t),1.,1),((.068-.014*t),.74,1),((.086-.010*t),-.003,0)]
rings=[]
for k in range(K+1):
 t=k/K;z=SZ0+(SZ1-SZ0)*t;h=.042*(1-t**1.7)+.0012;top=hood_y(.003,z)
 rings.append([(.003+x,(top+h*f) if lift else hood_y(.003+x,z)+f,z) for x,f,lift in ring(t)])
verts,faces=grid(rings);faces=[(a,b,c,d) for a,b,c,d in faces]
scoop=build('Panther_hex_scoop',verts,faces,black,True,28);outward(scoop,(0,1,-.2));thicken(scoop,.003,.0015)
# throat: the mouth steps in and back into a dark cavity
mouth=rings[0];inner=[(.003+(x-.003)*.8,y-(y-hood_y(.003,SZ0))*.22,SZ0+.034) for x,y,z in mouth]
verts=mouth+inner;n=len(mouth);faces=[(i,i+1,n+i+1,n+i) for i in range(n-1)]+[tuple(range(n,2*n))]
build('Panther_scoop_throat',verts,faces,recess,False)

# ---------------------------------------------------------------- stepped louver gills
# Each gill is one solid wedge on the hood skin: raised at the front with a dark intake mouth facing
# forward, sloping flush toward the rear. Two per side, parallel and slanted like the retail part.
for side in [-1,1]:
 for j,zf in enumerate([-.842,-.752]):
  xi,xo,dz,slant,rise=.118,.196,.062,.026,.017
  def P(x,z,up=0.):
   X=.003+side*x;n=hood_normal(X,z);y=hood_y(X,z);return tuple(Vector((X,y,z))+n*up)
  A,B=(xi,zf),(xo,zf+slant);C,D=(xo,zf+slant+dz),(xi,zf+dz)
  base=[P(*A,-.002),P(*B,-.002),P(*C,-.002),P(*D,-.002)];top=[P(*A,rise),P(*B,rise*.8)]
  verts=base+top   # 0 A,1 B,2 C,3 D,4 A',5 B'
  shell=[(4,5,2,3),(0,4,3),(1,2,5)];mouth=[(0,1,5,4)]
  if side<0:shell=[f[::-1] for f in shell];mouth=[f[::-1] for f in mouth]
  build('Panther_gill',verts,shell,black,True,25)
  inset=[P(A[0]+.006,A[1]+.004,.002),P(B[0]-.006,B[1]+.004,.002),P(B[0]-.006,B[1]+.004,rise*.8-.003),P(A[0]+.006,A[1]+.004,rise-.003)]
  build('Panther_gill_mouth',inset,[(0,1,2,3)] if side>0 else [(3,2,1,0)],recess,False)

# ---------------------------------------------------------------- emblem on the plateau, following the slope
ez=-.958;ep=Vector((.003,hood_y(.003,ez),ez));en=hood_normal(.003,ez)
cylinder('Panther_badge_bezel',tuple(ep-en*.001),tuple(ep+en*.0035),.021,body,alloy,48)
cylinder('Panther_badge_face',tuple(ep+en*.0035),tuple(ep+en*.0042),.0172,body,recess,48)
u=en.cross(Vector((1,0,0))).normalized();w=en.cross(u)
tube('Panther_badge_ring',[tuple(ep+en*.0045+(u*math.cos(a)+w*math.sin(a))*.0125) for a in [k*math.tau/40 for k in range(41)]],.0011,body,alloy)

# ---------------------------------------------------------------- brow over the grille
BW=.264
def brow_path():
 pts=[]
 for k in range(25):
  x=-BW+2*BW*k/24;e=abs(x)/BW;xh=max(-hood_half(0)+.003,min(hood_half(0)+.003,x))
  pts.append((x,hood_y(xh,Z0)-.013-.006*(1-e*e)+.004*e,-1.056+.018*e**1.6))
 return pts
sweep('Panther_front_brow',brow_path(),rounded_rect(.034,.028,.009),(0,1,0),black)

# ---------------------------------------------------------------- grille frame, struts and cross bar
GT,GB=.462,.166
def gz(y):return -1.060+.042*((GT-y)/(GT-GB))**1.15   # shark nose: the brow leads, the grille tucks back underneath
def ghalf(y):return .252-.025*(GT-y)/(GT-GB)
bar=rounded_rect(.02,.024,.006);strut=rounded_rect(.017,.021,.006)
for side in [-1,1]:
 sweep('Panther_grille_side',[(side*ghalf(y),y,gz(y)) for y in [GT-.022,.38,.30,.23,GB-.008]],bar,(0,0,-1),black)
 sweep('Panther_grille_strut',[(side*(.078+.137*f),GT-(GT-.176)*f,gz(GT-(GT-.176)*f)) for f in [0,.25,.5,.75,1]],strut,(0,0,-1),black)
sweep('Panther_grille_sill',[(-ghalf(GB)-.01,GB,gz(GB)),(-.12,GB,gz(GB)-.002),(-.07,GB+.006,gz(GB)-.004),(.076,GB+.006,gz(GB)-.004),(.126,GB,gz(GB)-.002),(ghalf(GB)+.01,GB,gz(GB))],rounded_rect(.02,.026,.007),(0,0,-1),black)
cy=.228;cx=.078+.137*(GT-cy)/(GT-.176)
sweep('Panther_grille_crossbar',[(-cx,cy,gz(cy)),(cx,cy,gz(cy))],rounded_rect(.011,.016,.004),(0,0,-1),black,(0,-.003))

# ---------------------------------------------------------------- fish-scale stamped mesh and dark back plate
ribbon=[(-.0013,-.003),(.0013,-.003),(.0013,.003),(-.0013,.003)]
CW,RH,DROP=.030,.0175,.0125
y=GT-.006;row=0
while y>GB+.004:
 lim=ghalf(y)-.006;x0=-lim-(CW/2 if row%2 else 0);seg=[]
 while x0<lim:
  for k in range(1 if seg else 0,9):
   th=math.pi*k/8;x=x0+CW/2*(1-math.cos(th));yy=y-DROP*math.sin(th)
   if -lim<=x<=lim and yy>GB+.002:seg.append((x,yy,gz(yy)+.009))
   elif len(seg)>1:sweep('Panther_scale_mesh',seg,ribbon,(0,0,-1),black,caps=False,sharp=80);seg=[]
   else:seg=[]
  x0+=CW
 if len(seg)>1:sweep('Panther_scale_mesh',seg,ribbon,(0,0,-1),black,caps=False,sharp=80)
 y-=RH;row+=1
plate=[(-ghalf(GT),.50,gz(GT)+.032),(ghalf(GT),.50,gz(GT)+.032),(ghalf(GB),GB,gz(GB)+.032),(-ghalf(GB),GB,gz(GB)+.032)]
build('Panther_grille_depth',plate,[(0,1,2,3)],recess,False)
for side in [-1,1]:
 wall=[(side*ghalf(GT),GT,gz(GT)),(side*ghalf(GB),GB,gz(GB)),(side*ghalf(GB),GB,gz(GB)+.032),(side*ghalf(GT),GT,gz(GT)+.032)]
 build('Panther_grille_wall',wall,[(0,1,2,3)],recess,False)

# ---------------------------------------------------------------- flared side cheeks (Coons patch)
for side in [-1,1]:
 X=lambda p:(side*p[0],p[1],p[2])
 top=[(BW,hood_y(.003+hood_half(0),Z0)-.012,-1.041)]+[(hood_half(t)+.006,hood_uy(1.,t)-.003,Z0+(Z1-Z0)*t) for t in [.1,.25,.45,.65,.85,.93]]
 top[0]=(ghalf(GT)+.008,top[0][1],-1.052)
 front=[top[0],(ghalf(.33)+.008,.33,gz(.33)+.006),(ghalf(GB)+.008,GB-.004,gz(GB)+.006)]
 bot=[front[-1],(.292,.168,-1.0),(.307,.19,-.93)]
 rear=[top[-1],(.285,.41,-.80),bot[-1]]
 R,S=26,20;T,B,F,Q=resample(top,R+1),resample(bot,R+1),resample(front,S+1),resample(rear,S+1)
 rows=[]
 for j in range(S+1):
  s=j/S;row_=[]
  for i in range(R+1):
   r=i/R;p=[(1-s)*T[i][k]+s*B[i][k]+(1-r)*F[j][k]+r*Q[j][k]-((1-r)*(1-s)*T[0][k]+r*(1-s)*T[-1][k]+(1-r)*s*B[0][k]+r*s*B[-1][k]) for k in range(3)]
   p[0]+=.013*(1-abs(2*s-1))*sstep(0.,.35,r)   # shallow faceted flare peaking along the crease, none at the grille bar
   row_.append(X(p))
  rows.append(row_)
 verts,faces=grid(rows);cheek=build('Panther_fascia_cheek',verts,faces,black,True,35);outward(cheek,(side,0,-.35));thicken(cheek,.006,.003)
 def at(s,r,out=0.):
  j=min(S-1,int(s*S));i=min(R-1,int(r*R));fs=s*S-j;fr=r*R-i
  q=[(1-fs)*((1-fr)*rows[j][i][k]+fr*rows[j][i+1][k])+fs*((1-fr)*rows[j+1][i][k]+fr*rows[j+1][i+1][k]) for k in range(3)]
  q[0]+=side*out;return tuple(q)
 # molded character line running from the brow corner back and down the cheek
 sweep('Panther_cheek_crease',[at(.18+.42*k/10,.04+.86*k/10,.004) for k in range(11)],rounded_rect(.007,.007,.003),(side,0,0),black)
 # triangular side vent with the same dark depth as the grille
 tri=[at(.50,.10,.001),at(.90,.12,.001),at(.88,.44,.001)]
 build('Panther_cheek_vent',tri,[(0,1,2) if side>0 else (2,1,0)],recess,False)
 sweep('Panther_cheek_vent_frame',[at(.50,.10,.004),at(.90,.12,.004),at(.88,.44,.004),at(.50,.10,.004),at(.90,.12,.004)],rounded_rect(.008,.007,.003),(side,0,0),black)
