from pathlib import Path
import json,numpy as np,pandas as pd,matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import sys
r=Path(sys.argv[1]);plots=r/'plots';plots.mkdir(exist_ok=True)
plt.rcParams.update({'font.size':9,'axes.grid':True,'grid.alpha':.22,'figure.dpi':140})
transfer=pd.read_csv(r/'steering-transfer.csv');chain=pd.read_csv(r/'sequential-steering.csv');forces=pd.read_csv(r/'force-traces.csv');j=json.loads((r/'recovery-results.json').read_text());results=pd.DataFrame(j['runs']);ped=json.loads((r/'pedal-lsd-results.json').read_text());pd.DataFrame(ped['runs']).to_csv(r/'pedal-lsd-summary.csv',index=False);results.to_csv(r/'oracle-summary.csv',index=False)
fig,ax=plt.subplots(2,2,figsize=(10,7));
for kmh,g in transfer.groupby('kmh'):
 ax[0,0].plot(g.finger,g.raw,label=f'{kmh}km/h');ax[0,1].plot(g.raw,g.target,label=f'{kmh}');ax[1,0].plot(g.finger,-g.rack_deg,label=f'{kmh}');ax[1,1].plot(g.finger[:-1],-g.gain_deg_per_finger[:-1],label=f'{kmh}')
for a,title,xlab,ylab in zip(ax.flat,['Pad precision1.45','Progressive target / outer reserve','Settled rack mapping','Local transfer gain'],['Finger fraction','Raw demand','Finger fraction','Finger fraction'],['Raw demand','Normalized target','Absolute rack degrees','Degrees / full finger travel']):a.set(title=title,xlabel=xlab,ylabel=ylab)
ax[0,1].legend(title='speed km/h');fig.suptitle('Unchanged A3 steering transfer: continuous, strongly varying outer gain');fig.tight_layout();fig.savefig(plots/'steering-transfer.png');plt.close(fig)
fig,ax=plt.subplots(2,1,figsize=(10,6),sharex=True)
for profile,g in chain[(chain.kmh==200)&(chain.side==1)].groupby('profile'):
 ax[0].plot(g.t_s,g.target,ls=':',alpha=.7,label=profile+' target');ax[0].plot(g.t_s,g.command,label=profile+' command');ax[1].plot(g.t_s,g.rack_deg,label=profile+' actual rack')
ax[0].set(ylabel='Normalized steering',title='Sequential accepted synthetic commands; not sensor/display latency');ax[1].set(xlabel='Time s',ylabel='Actual rack degrees');ax[0].legend(ncol=2);ax[1].legend();fig.tight_layout();fig.savefig(plots/'steering-time.png');plt.close(fig)
case='100_1_0.95';ff=forces[forces['case']==case];fig,ax=plt.subplots(4,2,figsize=(12,12),sharex=True)
for policy,col in [('observed-like:full','tab:red'),('observed-like:off','tab:blue'),('early-unwind:full','tab:green'),('geometry-reference:full','tab:orange')]:
 g=ff[ff.policy==policy];label=policy
 ax[0,0].plot(g.t_s,np.rad2deg(g.beta),color=col,label=label);ax[0,1].plot(g.t_s,np.rad2deg(g.r),color=col,label=label);ax[1,0].plot(g.t_s,np.rad2deg(g.rack),color=col,label=label);ax[1,1].plot(g.t_s,g.frontM/1000,color=col,label=label+' front');ax[1,1].plot(g.t_s,g.rearM/1000,color=col,ls='--',label=label+' rear');ax[2,0].plot(g.t_s,(g.W0_Fy+g.W1_Fy)/1000,color=col);ax[2,1].plot(g.t_s,(g.W2_Fy+g.W3_Fy)/1000,color=col);ax[3,0].plot(g.t_s,g.W2_driveTorque+g.W3_driveTorque,color=col);ax[3,1].plot(g.t_s,g.throttle,color=col)
labels=['Beta degrees','Yaw rate deg/s','Rack degrees','Axle moment kNm (dashed rear)','Front wheel-frame Fy kN','Rear wheel-frame Fy kN','Rear drive torque Nm','Filtered throttle']
for a,label in zip(ax.flat,labels):a.set(ylabel=label,xlim=(0,1.5))
ax[0,0].legend(fontsize=7);ax[-1,0].set_xlabel('After snapshot, seconds');ax[-1,1].set_xlabel('After snapshot, seconds');fig.suptitle('Natural 100km/h donor, age0.95: identical full initial states\nForces average8 exact substeps of last240Hz tick; sampled60Hz. Not iPhone replay.');fig.tight_layout();fig.savefig(plots/'force-time.png');plt.close(fig)
full=ff[ff.policy=='observed-like:full'];fig,ax=plt.subplots(3,1,figsize=(10,8),sharex=True)
for i in range(4):
 ax[0].plot(full.t_s,np.rad2deg(full[f'W{i}_alphaRelax']),label=f'W{i} relaxed');ax[0].plot(full.t_s,np.rad2deg(full[f'W{i}_alphaGeom']),ls=':',alpha=.6);ax[1].plot(full.t_s,full[f'W{i}_qratio'],label=f'W{i}');ax[2].plot(full.t_s,full[f'W{i}_Fz'],label=f'W{i}')
ax[0].set(ylabel='Slip angle deg',title='Tyre state: solid relaxed / dotted geometric');ax[1].set(ylabel='Combined q/(3 limit)',ylim=(0,5));ax[1].axhline(1,color='black',ls='--');ax[2].set(ylabel='Normal load N',xlabel='After snapshot, seconds');ax[0].legend(ncol=4);fig.tight_layout();fig.savefig(plots/'tyre-time.png');plt.close(fig)
sweep=pd.read_csv(r/'tire-sweep.csv');fig,ax=plt.subplots(1,2,figsize=(10,4))
for front,a in [(1,ax[0]),(0,ax[1])]:
 for k,g in sweep[(sweep.front==front)&(sweep.load==3500)].groupby('kappa'):a.plot(g.alpha_deg,-g.Fy,label=f'kappa{k:g}')
 a.set(title='Front' if front else 'Rear',xlabel='Relaxed alpha degrees',ylabel='Absolute lateral force N');a.legend()
fig.suptitle('Existing generic tyre law; fixed3500N load, not calibrated GR86 tyre data');fig.tight_layout();fig.savefig(plots/'tyre-law.png');plt.close(fig)
fig,ax=plt.subplots(1,2,figsize=(10,4));time=[170.57,170.77,170.97,171.37];ax[0].scatter([time[0],time[3]],[10.8,-29],s=45);ax[1].scatter(time,[-12.4,8.9,82,91],s=45)
for a,label in zip(ax,['Quoted beta degrees','Quoted yaw deg/s']):a.set(xlim=(170.4,171.8),xlabel='User-quoted simulation time s',ylabel=label)
fig.suptitle('iPhone: approximate user-quoted points ONLY; full CSV unavailable\nNo interpolated forces, missing steering commands or invented samples');fig.tight_layout();fig.savefig(plots/'iphone-quoted-points.png');plt.close(fig)
# Snapshot-level table separates stabilization from trajectory safety.
seedDf=pd.DataFrame(j['seeds']);tables=[]
for s in j['seeds']:
 if s['side']!=1:continue
 g=results[results['case']==s['id']];base=g[(g.policy=='observed-like')&(g.pedal=='full')].iloc[0];off=g[(g.policy=='observed-like')&(g.pedal=='off')].iloc[0];ok=g[g.success];best=g.sort_values('maxBetaDeg').iloc[0]
 tables.append({'case':s['id'],'speed_kmh':s['kmh'],'age_s':s['age'],'initial_beta_deg':s['beta'],'initial_yaw_deg_s':s['r'],'successful_policies':len(ok),'baseline_peak_beta_deg':base.maxBetaDeg,'gas_off_peak_beta_deg':off.maxBetaDeg,'smallest_peak_beta_deg':best.maxBetaDeg,'lowest_peak_policy':best.policy,'lowest_peak_success':bool(best.success)})
table=pd.DataFrame(tables);table.to_csv(r/'recovery-by-state.csv',index=False)
fig,ax=plt.subplots(figsize=(10,5));xx=np.arange(len(table));ax.bar(xx-.15,table.baseline_peak_beta_deg,.3,label='held counter full gas');ax.bar(xx+.15,table.gas_off_peak_beta_deg,.3,label='same counter gas off');ax.plot(xx,table.smallest_peak_beta_deg,'ko',label='lowest peak among fixed grid (not safety)');ax.set_xticks(xx,table.case,rotation=45,ha='right');ax.set(ylabel='Peak |beta| degrees',title='Mirror+ states; finite candidate grid. Smaller beta alone is not recovery.');ax.legend(fontsize=8);fig.tight_layout();fig.savefig(plots/'oracle-comparison.png');plt.close(fig)
# Approximate derivatives of recorded offline60Hz force means, not new physical signals.
parts=[]
for (case,policy),g in forces.groupby(['case','policy'],sort=False):
 g=g.copy();dt=g.t_s.diff();
 for col in ['frontM','rearM','frontR','rearR']+[f'W{i}_{x}' for i in range(4) for x in ['alphaRelax','Fy','Fz']]:g[col+'_dot']=g[col].diff()/dt
 parts.append(g[['case','policy','t_s']+[c for c in g if c.endswith('_dot')]])
pd.concat(parts).to_csv(r/'force-derivatives.csv',index=False)
summary={'runs':len(results),'successfulCandidates':int(results.success.sum()),'successfulStates':results[results.success]['case'].nunique(),'states':len(j['seeds']),'exactDuplicateReplays':j['duplicates'],'closureMaxNm':j['closureMaxNm'],'angularResidualMaxNm':j['angularResidualMaxNm'],'mirrorPeakBetaDeltaMaxDeg':max(x['peakBetaDelta'] for x in j['mirror']),'mirrorSuccessMismatch':sum(not x['successSame'] for x in j['mirror']),'gasTrials':len(ped['runs']),'recoverySignatureEvents':sum(x['releaseTime'] is not None for x in ped['runs'] if x['gasProfile']=='recovery-signature'),'realCSVAvailable':False}
(r/'ANALYSIS_SUMMARY.json').write_text(json.dumps(summary,indent=2));print(summary)
