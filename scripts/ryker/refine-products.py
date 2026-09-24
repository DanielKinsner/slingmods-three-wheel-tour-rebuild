"""Executed in build-mods namespace. Mounted reference revisions, September 2026."""
# Replace the old faceted generic hood and red-coil approximation.
for parent in [body,shocks]:
 for o in list(parent.children_recursive):
  if o in made:made.remove(o)
  bpy.data.objects.remove(o,do_unlink=True)

# Panther: remodelled from the retail photos in panther-kit.py (molded hood, hex scoop, louver gills, scale-mesh grille).
exec(compile(pathlib.Path(__file__).with_name('panther-kit.py').read_text(),'panther-kit.py','exec'))

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
