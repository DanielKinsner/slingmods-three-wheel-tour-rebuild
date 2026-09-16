"""Plots measured traces only; no interpolated/fabricated vehicle trajectory."""
import gzip,json,math
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
root=Path(__file__).resolve().parents[1]/'director-kit/production/evidence/P09C'
out=root/'motion-plots';out.mkdir(exist_ok=True)
colors={'slingmods-sport-v2':'#b44166','slingmods-sport-v3':'#007b8c'}
fig,axes=plt.subplots(2,3,figsize=(15,9),layout='constrained')
for row,(mph,radius) in enumerate([(50,90),(65,150)]):
 for profile,color in colors.items():
  data=json.loads(gzip.decompress((root/'motion-final'/f'{profile}-{mph}-1.json.gz').read_bytes()));entry=[r for r in data if r['elapsed']==0][-1]['telemetry']['position'];z0=entry['z'];data=[r for r in data if r['elapsed']>0]
  axes[row,0].plot([r['telemetry']['position']['x'] for r in data],[-r['telemetry']['position']['z']+z0 for r in data],label=profile,color=color)
  axes[row,1].plot([r['elapsed'] for r in data],[r['error'] for r in data],color=color)
  axes[row,2].plot([r['elapsed'] for r in data],[abs(r['input']['steer']) for r in data],color=color)
 theta=[i*3.15/300 for i in range(301)];axes[row,0].plot([-radius+radius*math.cos(t) for t in theta],[radius*math.sin(t) for t in theta],'--',color='#777',label='target centerline');axes[row,0].set_aspect('equal');axes[row,0].set_title(f'{mph} mph / {radius} m: real path, left');axes[row,0].set_xlabel('x (m)');axes[row,0].set_ylabel('distance forward from entry (m)');axes[row,0].legend(fontsize=8)
 for column,title in [(1,'Centerline error (m)'),(2,'Normalized steer demand')]:
  ax=axes[row,column];ax.axvspan(4,12,alpha=.08,color='green');ax.set_title(title+'; shaded = scored');ax.set_xlabel('seconds after curve entry');ax.grid(alpha=.2)
 axes[row,1].axhline(3,color='grey',linestyle=':');axes[row,2].set_ylim(0,1.05)
fig.suptitle('P09C matched physical sweepers | same evidence control protocol | no post-start transforms',fontsize=13);fig.savefig(out/'matched-sweepers.png',dpi=140);plt.close(fig)
fig,axes=plt.subplots(2,2,figsize=(13,8),layout='constrained')
for profile,color in colors.items():
 data=json.loads(gzip.decompress((root/'transitions-03'/f'{profile}-cross50-held-1.json.gz').read_bytes()));data=[r for r in data if r['elapsed']>=0]
 for ax,key,label,factor in [(axes[0,0],'speed','Speed (mph)',1/.44704),(axes[0,1],'steer','Actual road-wheel angle (deg)',180/math.pi)]:ax.plot([r['elapsed'] for r in data],[r['telemetry'][key]*factor for r in data],label=profile,color=color);ax.set_title(label);ax.grid(alpha=.2)
 axes[1,0].plot([r['elapsed'] for r in data],[r['telemetry']['angularVelocity']['y'] for r in data],color=color);axes[1,0].set_title('Actual yaw rate (rad/s)')
 axes[1,1].plot([r['elapsed'] for r in data],[r['input']['brake'] for r in data],color=color);axes[1,1].set_title('Brake input (steer held +0.25)')
for ax in axes.flat:ax.set_xlabel('seconds after 35 mph entry');ax.grid(alpha=.2)
axes[0,0].legend();fig.suptitle('Held steering through 50 mph in both speed directions; production force integration');fig.savefig(out/'cross50-held.png',dpi=140);plt.close(fig)
