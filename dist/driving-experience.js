import {SteeringResponse} from './controls.js';
import {VehicleStateEstimator} from './vehicle-state.js';
import {SteeringReferenceEstimator} from './steering-reference.js';
import {SlipStateDetector} from './slip-detector.js';
import {BoundedSteeringPredictor,predictorParameters} from './steering-predictor.js';

// Ergonomics remain in SteeringResponse: curve, range, rate and neutral return.
// Simulation adds no vehicle-state feedback and never touches Vehicle/config.
export const drivingModes=Object.freeze({
 simulation:Object.freeze({code:1,available:true,steeringAssistance:false})
});
export class DrivingExperience{
 constructor(){this.processor=new SteeringResponse();this._mode='simulation';this.state=new VehicleStateEstimator();this.reference=new SteeringReferenceEstimator();this.slip=new SlipStateDetector();this.predictor=new BoundedSteeringPredictor();this.predictorEnabled=false;this.predictorClock=0;this.assistRequested=false;this.strength=0;}
 get mode(){return this._mode;}
 get modeCode(){return drivingModes[this._mode].code;}
 get correction(){return 0;}
 get assistanceAvailable(){return false;}
 get assistanceState(){return 1;} // explicitly disabled in Simulation
 get command(){return this.processor.position;}
 setMode(mode){
  // Fail closed: do not silently substitute a not-yet-implemented profile.
  if(!drivingModes[mode]?.available)throw new RangeError(`Driving mode unavailable: ${mode}`);
  this._mode=mode; // Same-mode selection preserves command/filter/rack.
  return this.command;
 }
 reset(){this.processor.reset();this.resetShadow();}
 resetShadow(){this.state.reset();this.reference.reset();this.slip.reset();this.predictor.reset();this.predictorClock=0;}
 configurePredictor(enabled){if(typeof enabled!=='boolean')throw new TypeError('Predictor requires boolean');this.predictorEnabled=enabled;this.predictor.reset();this.predictorClock=0;}
 configureAssist(enabled,strength){
  if(typeof enabled!=='boolean'||!Number.isFinite(strength))throw new TypeError('Assist request requires boolean and finite percent');
  this.assistRequested=enabled;this.strength=Math.max(0,Math.min(100,strength));
  // Request only: Shadow NEVER actuates, including On/100%.
 }
 observe(vehicle,dt){
  this.state.update(vehicle,dt);this.reference.update(this.state,vehicle);this.slip.update(this.state,vehicle,dt);
  if(!this.predictorEnabled)return;
  if(!this.state.valid){this.predictor.reset();this.predictorClock=0;return;}
  this.predictorClock+=dt;if(this.predictorClock+1e-10>=predictorParameters.interval){this.predictorClock=0;this.predictor.predict(vehicle,this.state,this.processor);}
 }
 value(demand,speed,dt,inputSource='touch',vehicleState=null){
  // vehicleState is a reserved read-only contract for a future estimator.
  // Simulation intentionally does not read it, even in a confirmed skid.
  return this.processor.value(demand,speed,dt,inputSource);
 }
}
