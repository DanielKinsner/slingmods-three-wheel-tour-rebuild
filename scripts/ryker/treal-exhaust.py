"""Treal Performance TRP-RKR-SES street exhaust, remodelled September 2026 from the retail photos.

Executed in the build-mods namespace; parents everything to `exhaust`. Runtime X/Y-up/-Z-forward.
A short, mirror-polished horizontal-oval can with rolled (not flat) ends, a smoothly bent inlet,
a straight-cut 3-inch tip with a rolled lip and real wall, a bronze-to-blue heat-tinted weld ring
where the tip meets the can, and a clamp-band hanger with a rubber isolator. Stays inside the stock
exhaust envelope. Original game geometry; not manufacturer CAD.
"""
import bmesh

CX,CY=.143,.247            # can axis
ZA,ZB=.100,.418            # can ends
RX,RY=.076,.066            # horizontal oval, as fitted under the Ryker's rear panel
N=64
rubber=mat('Treal_isolator_rubber',(.02,.02,.021),.8)

def solid(name,verts,faces,material,sharp=40):
 data=bpy.data.meshes.new(name);data.from_pydata([v(p) for p in verts],[],faces);data.update()
 o=bpy.data.objects.new(name,data);bpy.context.scene.collection.objects.link(o);finish(o,name,exhaust,material)
 bm=bmesh.new();bm.from_mesh(data);bmesh.ops.recalc_face_normals(bm,faces=bm.faces)
 for f in bm.faces:f.smooth=True
 for e in bm.edges:
  if len(e.link_faces)==2 and e.calc_face_angle(0)>math.radians(sharp):e.smooth=False
 bm.to_mesh(data);bm.free();data.update();return o
def loft(name,rings,material,caps=(False,False),sharp=40):
 n=len(rings[0]);verts=[p for r in rings for p in r]
 faces=[(j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i) for j in range(len(rings)-1) for i in range(n)]
 if caps[0]:faces.append(tuple(range(n))[::-1])
 if caps[1]:faces.append(tuple(range(len(verts)-n,len(verts))))
 return solid(name,verts,faces,material,sharp)
def ellipse(cx,cy,z,rx,ry,n=N):return [(cx+rx*math.cos(a),cy+ry*math.sin(a),z) for a in [k*math.tau/n for k in range(n)]]
def circle_on(p,axis,r,n=48):
 axis=Vector(axis).normalized();u=axis.cross(Vector((0,1,0)) if abs(axis.y)<.9 else Vector((1,0,0))).normalized();w=axis.cross(u)
 return [tuple(Vector(p)+(u*math.cos(a)+w*math.sin(a))*r) for a in [k*math.tau/n for k in range(n)]]

# ---------------------------------------------------------------- can with rolled ends
ROLL=.024;rings=[]
for k in range(9):                                   # front roll: quarter round from the inlet neck out to full size
 a=k/8*math.pi/2;f=.46+.54*math.sin(a);z=ZA+ROLL*(1-math.cos(a));rings.append(ellipse(CX,CY,z,RX*f,RY*f))
for z in [ZA+ROLL+.02,(ZA+ZB)/2,ZB-ROLL-.02]:rings.append(ellipse(CX,CY,z,RX,RY))
for k in range(9):                                   # rear roll down to the outlet neck
 a=k/8*math.pi/2;f=1-.54*(1-math.cos(a));z=ZB-ROLL+ROLL*math.sin(a);rings.append(ellipse(CX,CY,z,RX*f,RY*f))
loft('Treal_oval_silencer',rings,steel,(True,True),55)
# two rolled lock seams where the end shells meet the body
for z in [ZA+ROLL,ZB-ROLL]:
 pts=ellipse(CX,CY,z,RX+.0012,RY+.0012);tube('Treal_rolled_seam',pts+[pts[0]],.0022,exhaust,steel)
# the stamped Treal oval badge band on the outboard face
badge=[(CX+RX+.0008,CY+ry,z) for ry,z in [(-.014,.215),(.014,.215),(.014,.31),(-.014,.31)]]
solid('Treal_badge_plate',[(x+.0007,y,z) for x,y,z in badge],[(0,1,2,3)],alloy)

# ---------------------------------------------------------------- inlet: smooth bend from the header to the can neck
def spline(points,steps=8):
 P=[Vector(p) for p in points];out=[]
 for i in range(len(P)-1):
  p0,p1,p2,p3=P[max(i-1,0)],P[i],P[i+1],P[min(i+2,len(P)-1)]
  for k in range(steps):
   t=k/steps;out.append(tuple(.5*((2*p1)+(-p0+p2)*t+(2*p0-5*p1+4*p2-p3)*t*t+(-p0+3*p1-3*p2+p3)*t**3)))
 out.append(tuple(P[-1]));return out
inlet=spline([(CX,CY,ZA+.004),(CX,CY,.035),(.125,.268,-.035),(.085,.305,-.09),(.05,.33,-.12)])
rings=[]
for i,p in enumerate(inlet):
 T=Vector(inlet[min(i+1,len(inlet)-1)])-Vector(inlet[max(i-1,0)]);rings.append(circle_on(p,T,.0235,32))
loft('Treal_inlet',rings,steel,(False,False),70)
tube('Treal_inlet_weld',circle_on((CX,CY,ZA-.001),(0,0,1),.0245,32)+[circle_on((CX,CY,ZA-.001),(0,0,1),.0245,32)[0]],.0018,exhaust,weld)

# ---------------------------------------------------------------- straight-cut 3-inch tip with a rolled lip
TIP0,TIP1,R_OUT,R_IN=ZB-.004,.590,.0381,.0345
rings=[ellipse(CX,CY,z,R_OUT,R_OUT,48) for z in [TIP0,TIP1-.006]]
for k in range(1,7):                                 # rolled lip turns the outer wall into the bore
 a=k/6*math.pi;r=(R_OUT+R_IN)/2+(R_OUT-R_IN)/2*math.cos(a);rings.append(ellipse(CX,CY,TIP1-.006+.0055*math.sin(a),r,r,48))
rings.append(ellipse(CX,CY,TIP1-.03,R_IN,R_IN,48))
loft('Treal_straight_tip',rings,steel,(False,False),70)
loft('Treal_dark_inner_bore',[ellipse(CX,CY,TIP1-.03,R_IN,R_IN,48),ellipse(CX,CY,ZB-.05,R_IN*.96,R_IN*.96,48)],recess,(False,True),80)
# heat-tinted TIG weld: bronze, blue, bronze beads where the tip leaves the can
for j,m in enumerate([weld,blue,weld]):
 pts=ellipse(CX,CY,ZB+.006+j*.0045,R_OUT+.0016,R_OUT+.0016,48);tube('Treal_colored_weld',pts+[pts[0]],.0017,exhaust,m)

# ---------------------------------------------------------------- clamp-band hanger with rubber isolator
zc=.262;band=[]
for a in [k*math.tau/64 for k in range(65)]:band.append((CX+(RX+.003)*math.cos(a),CY+(RY+.003)*math.sin(a),zc))
tube('Treal_clamp_band',band,.0035,exhaust,steel)
loft('Treal_clamp_band_face',[ellipse(CX,CY,zc-.011,RX+.0024,RY+.0024),ellipse(CX,CY,zc+.011,RX+.0024,RY+.0024)],steel,(False,False),80)
tube('Treal_hanger_strap',[(CX-.030,CY+RY+.003,zc),(CX-.030,CY+RY+.045,zc),(CX-.012,CY+RY+.062,zc)],.0045,exhaust,steel)
cylinder('Treal_isolator',(CX-.012,CY+RY+.056,zc-.012),(CX-.012,CY+RY+.056,zc+.012),.013,exhaust,rubber,24)
cylinder('Treal_hanger_bolt',(CX-.012,CY+RY+.056,zc-.016),(CX-.012,CY+RY+.056,zc+.016),.0045,exhaust,alloy,6)
