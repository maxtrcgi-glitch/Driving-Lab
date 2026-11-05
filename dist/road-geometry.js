// Geometry-only provider. Existing global-Z parameter, no bank/branches/physics writes.
const hash=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
export const ROAD_BLOCK=4800;
function ramp(u,out){if(u<=0){out.q=out.d=out.dd=0;return;}if(u>=1){out.q=1;out.d=out.dd=0;return;}out.q=u*u*u*(10+u*(-15+6*u));out.d=30*u*u*(1-u)*(1-u);out.dd=60*u*(1-u)*(1-2*u);}
export class RoadGeometry{
 constructor(seed){this.seed=seed;this.blocks=new Map();this.ramp={};}
 profile(k){let p=this.blocks.get(k);if(p)return p;const r=i=>hash(k*193+this.seed*977+i*31);p={k,start:350+300*r(1),rise:1100+400*r(2),hold:200+300*r(3),fall:1100+400*r(4),amplitude:(r(5)<.5?-1:1)*(160+90*r(6)),hillStart:400+400*r(7),hillRise:1100+400*r(8),hillHold:100+300*r(9),hillFall:1100+400*r(10),hillAmplitude:(r(11)<.35?-1:1)*(10+12*r(12))};if(this.blocks.size>=8)this.blocks.delete(this.blocks.keys().next().value);this.blocks.set(k,p);return p;}
 sample(s,out){if(out.s===s&&out.seed===this.seed)return out;const k=Math.floor(s/ROAD_BLOCK),u=s-k*ROAD_BLOCK,p=this.profile(k),r=this.ramp;
  ramp((u-p.start)/p.rise,r);let x=p.amplitude*r.q,g=p.amplitude*r.d/p.rise,g2=p.amplitude*r.dd/p.rise**2;
  ramp((u-p.start-p.rise-p.hold)/p.fall,r);x-=p.amplitude*r.q;g-=p.amplitude*r.d/p.fall;g2-=p.amplitude*r.dd/p.fall**2;
  ramp((u-p.hillStart)/p.hillRise,r);let y=p.hillAmplitude*r.q,grade=p.hillAmplitude*r.d/p.hillRise,y2=p.hillAmplitude*r.dd/p.hillRise**2;
  ramp((u-p.hillStart-p.hillRise-p.hillHold)/p.hillFall,r);y-=p.hillAmplitude*r.q;grade-=p.hillAmplitude*r.d/p.hillFall;y2-=p.hillAmplitude*r.dd/p.hillFall**2;
  out.s=s;out.seed=this.seed;out.x=x;out.y=y;out.g=g;out.g2=g2;out.grade=grade;out.y2=y2;return out;
 }
}
