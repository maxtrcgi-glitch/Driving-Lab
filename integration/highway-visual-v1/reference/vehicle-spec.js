// Reference: 2022 US-market Toyota GR86 base, 6MT, 17-inch road tires.
// Published anchors are separated from engineering estimates; this is a
// calibration baseline, not a validated recreation of Toyota's full vehicle.
export const GR86=Object.freeze({
 name:'GR86 · 2022 base 6MT',curbMass:1275.06,driverMass:75,mass:1350.06,
 length:4.265,width:1.775,height:1.310,frontOverhang:.830,rearOverhang:.860,
 wheelbase:2.575,frontTrack:1.520,rearTrack:1.550,frontWeight:.53,
 gears:[3.626,2.189,1.541,1.213,1,.767],reverseRatio:3.438,finalDrive:4.1,
 tireWidth:.215,tireRadius:.215*.45+.017*25.4/2,
 peakTorque:250,peakTorqueRPM:3700,ratedPowerKW:228*.745699872,ratedPowerRPM:7000,steeringRatio:13.5,
 // Estimated until measured tire/suspension/inertia data become available.
 diffBias:2.5,wheelInertia:1.25,engineInertia:.28,yawInertia:2050,centerHeight:.48,
 spring:35000,damper:3200,dragArea:.68,
 sources:['https://pressroom.toyota.com/toyota-announces-pricing-on-all-new-2022-gr86/','https://www.toyota.com.sg/showroom/new-models/gr-86']
});
// Only peak torque and rated power anchors are published; intermediate points
// are estimates. Values represent net crankshaft torque, not combustion torque.
const curve=[[800,90],[1500,145],[2500,205],[3200,238],[3700,250],[4500,245],[5500,240],[6500,237],[7000,GR86.ratedPowerKW*1000/(7000*Math.PI/30)],[7400,212],[7500,0]];
export function engineTorqueAt(rpm){
 if(rpm<=curve[0][0])return curve[0][1];
 for(let i=1;i<curve.length;i++)if(rpm<=curve[i][0]){const a=curve[i-1],b=curve[i],t=(rpm-a[0])/(b[0]-a[0]);return a[1]+(b[1]-a[1])*t;}
 return 0;
}
