"""Executed in build-mods namespace. Mounted reference revisions, September 2026."""
# Replace the old faceted generic hood and red-coil approximation.
for parent in [body,shocks]:
 for o in list(parent.children_recursive):
  if o in made:made.remove(o)
  bpy.data.objects.remove(o,do_unlink=True)

# Panther: broad molded hood, raised center intake, paired gills, triangular fascia braces.
verts=[];faces=[];nx,nz=32,24
for j in range(nz+1):
 t=j/nz;z=-1.025+.43*t;width=.218+.018*math.sin(t*math.pi)-.060*t*t
 for i in range(nx+1):
  u=2*i/nx-1;x=.003+u*width;y=.474+.132*t+.018*(1-u*u)+.010*math.sin(t*math.pi)
  verts.append((x,y,z))
for j in range(nz):
 for i in range(nx):a=j*(nx+1)+i;faces.append((a,a+1,a+nx+2,a+nx+1))
o=mesh('Panther_molded_hood',verts,faces,body,black,True);m=o.modifiers.new('Molded wall','SOLIDIFY');m.thickness=.004
# Raised central scoop with its actual open dark mouth and shaped crown.
mesh('Panther_center_scoop',[(-.073,.597,-.847),(.079,.597,-.847),(.072,.658,-.607),(-.066,.658,-.607),(-.099,.564,-.847),(.105,.564,-.847),(.093,.622,-.607),(-.087,.622,-.607)],[(0,1,2,3),(4,0,3,7),(1,5,6,2)],body,black)
mesh('Panther_scoop_opening',[(-.099,.564,-.846),(.105,.564,-.846),(.079,.596,-.846),(-.073,.596,-.846)],[(0,1,2,3)],body,recess)
for side in [-1,1]:
 def S(p):return [(side*x+.003,y,z) for x,y,z in p]
 for j in range(2):
  z=-.69-j*.102;y=.618-j*.024
  o=mesh('Panther_recessed_gill',S([(.115,y,z),(.170,y-.009,z-.016),(.19,y-.035,z-.073),(.115,y-.034,z-.055)]),[(0,1,2,3)],body,recess)
  tube('Panther_gill_molded_edge',S([(.112,y+.002,z),(.173,y-.006,z-.017),(.193,y-.033,z-.074)]),.0025,body,black)
 # Cheeks connect to source mounts without scaling the purchased bike.
 o=mesh('Panther_fascia_wing',S([(.218,.48,-1.027),(.295,.438,-1.005),(.308,.16,-1.055),(.241,.158,-1.089),(.22,.408,-1.09),(.282,.285,-.945),(.252,.47,-.90),(.192,.563,-.635)]),[(0,1,4),(1,2,3,4),(1,5,2),(0,6,1),(6,5,1),(6,7,0)],body,black)
 m=o.modifiers.new('Molded thickness','SOLIDIFY');m.thickness=.006;m=o.modifiers.new('Molded radii','BEVEL');m.width=.004;m.segments=3
 tube('Panther_triangular_grille_frame',S([(.242,.164,-1.097),(.093,.407,-1.099),(.221,.408,-1.096),(.242,.164,-1.097)]),.008,body,black)
 tube('Panther_outer_opening',S([(.242,.164,-1.093),(.272,.173,-1.080),(.27,.408,-1.072),(.22,.431,-1.08),(0,.441,-1.09)]),.008,body,black)
mesh('Panther_grille_depth',[(-.245,.17,-1.06),(.251,.17,-1.06),(.236,.41,-1.06),(-.23,.41,-1.06)],[(0,1,2,3)],body,recess)
mesh('Panther_fascia_brow',[(-.23,.434,-1.089),(.236,.434,-1.089),(.224,.485,-1.025),(.003,.497,-1.025),(-.218,.485,-1.025)],[(0,1,2,3,4)],body,black)
for j in range(10):
 y=.175+j*.025
 for i in range(16):
  x=-.23+i*.029+(j%2)*.0145
  if abs(x)>.242:continue
  tube('Panther_scale_mesh',[(x-.014,y+.011,-1.081),(x-.007,y+.002,-1.083),(x,y,-1.084),(x+.007,y+.002,-1.083),(x+.014,y+.011,-1.081)],.0013,body,black)
tube('Panther_lower_sill',[(-.245,.164,-1.097),(-.12,.164,-1.1),(-.09,.171,-1.102),(.096,.171,-1.102),(.126,.164,-1.1),(.251,.164,-1.097)],.009,body,black)
cylinder('Panther_badge_bezel',(.003,.518,-.967),(.003,.520,-.967),.017,body,alloy)
cylinder('Panther_badge_face',(.003,.520,-.967),(.003,.521,-.967),.014,body,recess)

def articulated_shock(name,channel,a,b):
 a,b=Vector(a),Vector(b);axis=(b-a).normalized();length=(b-a).length;u=axis.cross(Vector((0,0,1))).normalized();w=axis.cross(u).normalized()
 parents={}
 for part in ['body','shaft','spring']:
  o=group(name+'_'+part);o.parent=shocks;o['rykerMotion']={'kind':'shock','channel':channel,'part':part,'upper':list(a),'lower':list(b)};parents[part]=o
 def at(t):return tuple(a+(b-a)*t)
 upper,lower,spring=parents['body'],parents['shaft'],parents['spring']
 cylinder(name+'_threaded_body',at(.10),at(.56),.018,upper,black)
 cylinder(name+'_billet_head',at(.07),at(.18),.020,upper,alloy)
 cylinder(name+'_piston_rod',at(.40),at(.95),.0075,lower,alloy)
 for t in [.31,.34]:cylinder(name+'_preload_collar',at(t-.012),at(t+.012),.026,upper,red)
 for t in [.91,.94]:cylinder(name+'_lower_seat',at(t-.012),at(t+.012),.027,lower,black)
 # Two black spring sections, variable pitch; red preload collars and reservoir dial.
 for begin,end,turns in [(.35,.53,4),(.55,.91,5)]:
  pts=[]
  for i in range(193):
   t=i/192;theta=t*math.tau*turns;pts.append(tuple(a+(b-a)*(begin+(end-begin)*t)+.024*(math.cos(theta)*u+math.sin(theta)*w)))
  tube(name+'_black_coil',pts,.0033,spring,black)
 for endpoint,parent in [(a,upper),(b,lower)]:
  cylinder(name+'_billet_eye',tuple(endpoint+Vector((0,0,-.013))),tuple(endpoint+Vector((0,0,.013))),.017,parent,alloy)
  cylinder(name+'_eye_bushing',tuple(endpoint+Vector((0,0,-.014))),tuple(endpoint+Vector((0,0,.014))),.009,parent,black)
 offset=u*.047*(-1 if channel==0 else 1);c=a+axis*(length*.15)+offset;d=c+axis*min(.125,length*.46)
 cylinder(name+'_piggyback_reservoir',tuple(c),tuple(d),.0185,upper,black)
 cylinder(name+'_reservoir_billet_cap',tuple(c-axis*.005),tuple(c+axis*.024),.0195,upper,alloy)
 cylinder(name+'_compression_dial',tuple(c-axis*.012),tuple(c-axis*.006),.012,upper,red)
 cylinder(name+'_reservoir_end',tuple(d),tuple(d+axis*.004),.019,upper,red)
 cylinder(name+'_reservoir_bridge',at(.14),tuple(c+axis*.012),.012,upper,alloy)
 # Fine body threads share the upper rigid body.
 for i in range(15):
  t=.18+i*.007;cylinder(name+'_body_thread',at(t),at(t+.002),.0184,upper,alloy,32)
for i,(a,b) in enumerate([([-.168,.416,-.855],[-.378,.176,-.855]),([.184,.416,-.855],[.394,.176,-.855]),([.002,.49,.078],[.002,.34,.415])]):articulated_shock(['Elka_front_left','Elka_front_right','Elka_rear'][i],i,a,b)
