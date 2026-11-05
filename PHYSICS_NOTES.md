# Current physics — 0.11

## Changes after the 0.10 rollover log

Camera changed at t=167.275 s; wheel-contact oscillation and rollover developed around t=183–185 s, about 16 seconds later. Camera updates do not feed the force solver. No discarded frame time or plastic damage explains the initial roll. The CSV does not contain all node velocities or sub-0.2-second inputs, so it cannot reproduce the precise initial state. An approximate replay is not presented as an exact reproduction.

A separate full-throttle steering-reversal test reproduced inversion on flat ground with 0.10. Two coplanar rods plus a spring left an underconstrained carrier mode. Added a compliant lateral upright guide (estimated 300 kN/m, 3.5 kN s/m), with equal/opposite force and moment reactions; rigid frame rotation produces zero guide damping velocity. Broken arm links disable the guide. This is a reduced carrier constraint, not measured GR86 suspension geometry. Spring/damper travel now has estimated bump and rebound stops. No roll-angle clamp, artificial lateral grip, or steering reduction was added.

Four 8 kg passenger-cage roof nodes replace an equal portion of existing sprung mass, with 32 bracing beams. Total mass and longitudinal CG are preserved. Their ground impulses account for momentum transmitted through the frame; friction uses actual normal impulse rather than only each contact node’s own weight. There are now 32 nodes and 160 connections. Contacts remain coarse node contacts; the car can tumble or roll back through physical forces.

The simulated automatic 6MT driver disconnects the clutch before changing ratio. Fuel remains cut while the clutch matches shaft speeds, with 180 Nm estimated clutch capacity during recovery. Full torque resumes after shaft mismatch falls below 25 rad/s. This is a simulated driver, not claimed Toyota control logic. Straight-line second-gear peak slip in the current test is about 0.078; 0–60 mph about 7.76 s remains slower than the manufacturer claim and uncalibrated.

Six 12-second reversal tests at initial 18/54/72 km/h on flat ground and course terrain peak at 3.20 degrees roll without structural damage. An inverted roof-contact test stops a 36 km/h sliding car within six seconds; free tumbling is retained. A numerical circuit driver completes a lap without damage. These are numerical checks, not browser execution or a real-device playtest.

Telemetry additionally records body height, vertical velocity, chassis contact count and last-substep normal ground impulse. All 19 check scripts passed.

The procedural exterior remains a placeholder and has failed the user’s GR86 likeness requirement. No new exterior asset is included in 0.11. A candidate by Reformed-Mojmir is downloadable under CC BY 4.0 (80,742 triangles): https://sketchfab.com/3d-models/low-poly-sports-car-04e3d5a65ad24e3db0429f95e874d541. Public metadata verified the license; official download returned HTTP 401 and requires the user’s signed-in download. Do not extract viewer geometry or claim this asset is already integrated.

## Historical 0.10 changes

## Changes after the 0.9 telemetry

The provided log contains no beam breakage or plastic damage. RAF maxima are predominantly 17–19 ms, with occasional 29–32 ms maxima; discarded frame time is zero. This does not establish average FPS or GPU cost. High lateral load transfer and rear slip occur around the grip limit, under braking and full throttle, followed by alternating large steering demands and mixed off-road surfaces. These observations alone do not justify boosting road grip.

Confirmed code defect: ABS factor/indicator responded to signed wheel slip even without the service brake. It now requires service brake demand. An engine-braking or backwards-wheel event no longer lights ABS by itself.

The old fixed 100 Nm viscous wheel coupling is replaced by equal/opposite friction torques bounded by total axle torque and an estimated 2.5:1 bias ratio. This approximates a helical differential's load-dependent behavior, not the exact production Torsen internals. It removes relative wheel energy; no tire coefficient or chassis-yaw assistance is added. The reference differential type is documented by Toyota, and torque bias behavior by Torsen. The actual GR86 bias ratio remains unverified.

Automatic shifting now cuts combustion torque while the clutch is commanded open. The automatic clutch driver engages above idle under launch throttle instead of immediately bogging the engine. Both are simulated driver operations for the 6MT, not Toyota ECU logic. The full-throttle straight-line check observes about 0.28 peak second-gear slip and about 6.93 s to 60 mph with the configured 75 kg driver; neither result establishes real-car parity.

A new original visual reconstruction uses 4265 / 1775 / 1310 mm overall reference dimensions, 2575 mm wheelbase and 1520 / 1550 mm tracks. Toyota explicitly gives roof height 1280 mm and overall height 1310 mm including the antenna. Interior is a left-hand-drive approximation with a digital instrument cluster and lower seated eye height. Geometry was inspected with four offline software-rendered views and ray/mesh checks. These are not WebGL screenshots or an iPhone playtest. No downloaded third-party car mesh is shipped.

Current design references:
- https://global.toyota/en/newsroom/toyota/36247827.html (dimensions, package drawings, exterior and interior photography; Japanese-spec power is not substituted for US power anchors)
- https://newsroom.toyota.eu/toyota-presents-the-new-gr86/ (53/47, steering ratio and Torsen type)
- https://torsen.com/ask-torsen-torque-bias-ratio-functional-questions/ (principle only; production bias ratio unverified)

## Architecture

This release replaces the planar sprung rigid-body model with a reduced physical mass/spring network. 24 frame nodes form six rectangular cross-sections with diagonal bracing, plus four roof nodes; four hub nodes represent unsprung masses. There are 148 frame/crumple/roof beams, eight arm links and four spring/damper struts. Ordinary loads, collisions, plasticity and broken links share the same node positions and velocities. Body pose is measured from the central structure, not integrated by a separate rigid-body update.

Semi-implicit force integration uses eight substeps per 240 Hz outer step (1920 Hz nominal). Terrain contact planes update once per outer step and are evaluated at moving hub coordinates within substeps. Chassis-ground candidates are refreshed per outer step when nodes approach the road. Gravity acts on every mass. Spring/arm/anti-roll forces have equal and opposite node reactions. Contact force at the hub plus a pure chassis force couple approximates the moment from road contact to wheel center. Aerodynamic drag remains lumped.

The total mass includes hubs. Distributed chassis weights are adjusted so total longitudinal CG is at the reference origin, reproducing approximately 53/47 static axle distribution. The 38 kg hub masses, vertical mass distribution, all beam stiffness/plasticity thresholds and arm locations are estimates. Inertias arise from node masses and positions.

## Physical damage

Axial beam force beyond a yield threshold changes its unloaded rest length. Beyond the strength threshold it disconnects. Beam capsules and node spheres receive obstacle contact impulses; plasticity uses actual resulting strain. No speed-to-dent shaping function or damage-to-toe rule remains. Changing a suspension link rest length shifts the actual hub position. Body skin uses current frame-node displacements after removing measured rigid pose. Detached structure is not rendered as separate fragments.

## Explicit limits

This is an independent prototype of a node/beam approach, not BeamNG, not its solver, and not full soft-body vehicle parity. Tires are analytical combined-slip brush forces with load sensitivity, now with identical front/rear friction scaling. Tread/sidewall nodes, pressure, full carrier orientation/inertia, accurate suspension kinematics, drivetrain reaction torques, triangle contacts and self-collision are absent. The single hub node cannot represent a complete wheel carrier; wheel toe follows deformed chassis axle-anchor direction, and steering remains prescribed. Contact moment transfer is approximate and can bypass detailed suspension torque paths. Chassis-floor node projection is a coarse dissipative collision approximation. Surface planes approximate curb/obstacle contact; no full tire contact envelope.

These limitations are material for future accuracy. Structure resolution is intentionally low for mobile testing; a node/beam label does not establish real-car fidelity.

## Validation and comparisons

Numerical checks: total mass; 53/47 resting loads; acceleration/braking load transfer; left/right symmetry; friction budget; wet vs dry braking; forward/reverse; timestep convergence; grade response; TCS wheel-spin reduction; driver-commanded sideslip recovery; full-system center-of-mass free fall; airborne zero ground load; unconstrained 3D roll; landing damping; dissipative obstacle impulses; persistent yielding/breakage; repair; altered wheel position after arm deformation; rendered hub positions; cockpit ray clearance; whole 2.08 km circuit with a numerical test driver and TCS off. No automatic steering/path controller is included in gameplay.

Observed controlled checks: 0–60 mph approximately 6.93 s vs manufacturer claim 6.1 s; discrepancy remains uncalibrated. Test-driver lap about 149.8 s; peak centerline offset 1.52 m, peak sideslip above 5 m/s about 2.77 degrees, no structural damage. This is not an iPhone playtest or proof of real-world accuracy.

Old TCS recovery tests included >3g commanded corners and required under 8.6 degrees of sideslip; that effectively tested the old rear grip margin. New checks keep stability maneuvers within a requested 0.7g budget and separately verify wheel-spin suppression under low grip. TCS is not a yaw-stability controller. Static load checks allow 10 seconds to settle the additional unsprung modes; old hard-coded yaw inertia check is replaced with distributed-mass verification.

Telemetry CSV/2 includes broken beam count, maximum beam strain, arm damage and maximum CPU physics time; 0.10 additionally records clutch torque/engagement, shift timer, distributed yaw inertia and individual wheel drive torques. CPU timings cannot establish GPU/device frame rate. Browser preview is unavailable in this environment; real iPhone controls, rendering and performance need user testing.

Primary design references (principles, no source code copied):
- https://documentation.beamng.com/modding/vehicle/intro_jbeam/
- https://documentation.beamng.com/modding/vehicle/sections/beams/
- https://docs.beamng.com/modding/vehicle/sections/wheels/

# Historical notes (through 0.8)

# Driving Lab 0.4: handling revision

## Evidence

The uploaded 65.5-second recording shows binary steering with near-continuous throttle, repeated asphalt-to-grass transitions, and a native text-selection menu over the controls. The recording identifies an interaction defect and helps reproduce a driving scenario. It does not measure tire forces, true pedal intent or subjective handling quality.

The previous tire model produced substantial lateral acceleration on flat asphalt. Consequently, simply increasing road friction would not address the complaint reliably. Its principal deficits were engine RPM inferred from rear wheel speed, fixed rotational inertia despite mass changes, linear load scaling of all tire forces, no peak-to-sliding loss, aggressive binary steering, and no grade gravity.

## Primary references consulted

- NVIDIA PhysX Vehicle SDK: https://nvidia-omniverse.github.io/PhysX/physx/5.6.1/docs/Vehicles.html
- NVIDIA mechanical model: https://nvidia-omniverse.github.io/PhysX/physx/5.4.1/docs/Vehicles.html
- Project Chrono tire models: https://api.projectchrono.org/wheeled_tire.html
- WebKit touch selection discussion: https://bugs.webkit.org/show_bug.cgi?id=231161
- WebKit Home Screen web apps: https://webkit.org/blog/17333/webkit-features-in-safari-26-0/

PhysX describes a rotational engine coupled through a torsion clutch to gearing and driven wheels, and combined tire-force limits dependent on load and friction. Chrono distinguishes transient handling tire models and specifically cautions that a simple Fiala model omits important handling effects. Those references support the model structure; they do not supply validated parameters for our fictional coupe.

## Implemented model

A 1280 kg generic coupe with 2.65 m wheelbase and 1.60 m track. Rotational chassis inertia scales with mass. Engine flywheel inertia, reaction torque through an implicitly integrated torsion clutch, automatic launch/shift behavior, gearbox, drive torque distribution, engine braking and bounded differential speed coupling are explicit states and forces. RWD, FWD and a simplified 50/50 AWD are selectable. The AWD model does not reproduce a specific real center differential.

Each tire has wheel angular speed and transient longitudinal and lateral slip. Combined brush adhesion transitions smoothly to reduced sliding force. Tire stiffness and friction depend sublinearly on vertical load; uneven loading therefore changes available axle force. These are estimated generic coefficients, not fitted tire-test data. Normal force comes from four spring/damper contacts and front/rear anti-roll bars. Ackermann front steering and road-grade gravity are included. No lateral velocity clamp or artificial chassis yaw assist is applied.

Physics updates at 240 Hz with stiff components substepped to at least 480 Hz. Digital steering is a separate rate-limited, speed-sensitive input aid; tilt steering retains full physical steering travel. The driver camera follows the sprung body with reduced pitch/roll cues, without delayed chase heading or changing FOV with speed. Dashboard and steering wheel are procedural placeholders.

## Checks and limits

`npm run check` verifies equilibrium, load transfer signs, tire-force budgets, reduced grip with uneven load, force loss during deep sliding, drive-dependent power handling, engine-limited mass sensitivity, engine braking, road-grade response and approximate steady-corner force balance. It compares external 120/240/480 Hz updates and a finer 960 Hz integration. Control tests exercise actual handlers with synthetic events, including simultaneous pedals/steering, pointer cancellation, active touch suppression, touch fallback and action-button tap cancellation. Geometry tests check the seated camera's forward ray, wheel placement and mesh bounds. Manifest/icon checks verify web-app configuration.

These are numerical and code-level checks, plus a software geometry projection. They are not Safari execution, actual accelerometer permission testing or a real-device playtest. Managed browser QA was unavailable. Real car telemetry/tire data and comparative driving sessions are required before claiming realistic handling. Unsprung wheel dynamics, full suspension kinematics, 3D chassis rollover, tire temperature and calibrated carcass/camber behavior remain absent. Crash deformation remains a separate simplified visual model.

## Revision 0.5: stability and input regression

A 15 m/s full-throttle, 0.18-steer maneuver exposed 48 degrees peak sideslip with TCS enabled in 0.4. The controller only cut combustion torque; it neither reserved lateral grip nor arrested wheel spin while flywheel energy remained coupled. It now reserves lateral grip in its slip target and applies driven-wheel braking. Estimated front/rear stiffness and rear grip were adjusted for a more progressive understeer balance. The same maneuver remains below 3 degrees sideslip; 12 tested entries at 10–25 m/s remain below 8.6 degrees. This is internal stability evidence, not real tire calibration. With TCS disabled, power oversteer remains possible. A separate test-driver feedback loop demonstrates recovery from an imposed 15-degree sideslip with manual countersteer and throttle reduction. The loop is not in the game.

The large steering pad preserves full steering range during recovery. The old binary steering speed cap can therefore no longer restrict touch countersteer. Pedals permit actual partial throttle and brake input. Permission requests are exempted from the generic synthetic tap helper and use native browser click activation. Orientation and motion APIs are both requested before the first asynchronous boundary. Embedded-policy denial, user/browser denial and missing sensor data are handled separately. Primary permissions references: https://developer.mozilla.org/en-US/docs/Web/API/DeviceMotionEvent/requestPermission_static and https://bugs.webkit.org/show_bug.cgi?id=221399 . No claim of a tested iPhone permission prompt is made.

## Revision 0.7: handling circuit and GR86 reference anchors

Primary sources: Toyota USA, 2022 GR86 launch information (https://pressroom.toyota.com/toyota-announces-pricing-on-all-new-2022-gr86/) for curb mass, balance, steering ratio, torque, tire grade and acceleration claim; Toyota GR86 specification table (https://www.toyota.com.sg/showroom/new-models/gr-86) for manual gear ratios, final drive, wheelbase and engine anchors. Reference is US-market 2022 base 6MT; regional output claims must not be mixed. Nominal 215/45 R17 unloaded radius is computed from tire dimensions, not a measured rolling radius. A 75 kg driver is an assumption.

Published engine output is net crankshaft torque; combustion torque therefore includes modeled internal friction so that full-throttle net output meets the two published anchors. Intermediate curve shape remains estimated. Mass, axle positions, Ackermann wheelbase, ratios, wheel radius, steering wheel ratio and RPM range now share the profile. RWD is fixed in the UI; automatic shifting is an assistance over the 6MT ratios.

Removing the provisional 8% rear grip margin exposed extreme steady-throttle oversteer in the existing recovery scenarios (up to 46 degrees sideslip); it has been retained pending a measured tire/camber/suspension calibration rather than weakening the regression test. Default recovery scenarios now peak at 8.54 degrees. This is explicitly a temporary model limitation, not a GR86 tire specification. The numerical 0-60 mph result is 7.13 s versus Toyota's 6.1 s claim; it is logged as a mismatch, not tuned by artificial acceleration or declared validated. Full 3D chassis, unsprung masses, realistic Torsen behavior and real GR86 geometry remain next work.

The new closed Handling Circuit has 2 m sampling, nonoverlapping branches, a flat main straight, right/left direction changes, localized smooth hills, 45 mm curbs, gravel runoff and grass. The road rendering samples the same physical surface as tire contact. Separate pad/bump presets remain. Full Nordschleife only, no partial recreation, is deferred. Infinite seeded highway generation with constrained curvature/grade, seamless streaming and continuous traffic is a future design, not implemented.


### 0.8 diagnostic release
TCS default is now off at user request; enabled TCS regression explicitly enables it. Tire/chassis equations are unchanged. Telemetry uses a monotonic driving clock, retains reset/repair/setup markers, stores 60 seconds at ~10 Hz, and copies ~5 Hz rows with explicit units and sign conventions. Low-speed beta is reported as zero below 0.5 m/s; sensor values unavailable are blank. Frame timing captures RAF interval maxima including the time excluded by the 80 ms simulation clamp. CPU scene/render submission duration is not a GPU measurement. Export can miss transients below 0.2 seconds.

### 0.12 moving traffic contacts
The existing static circle/capsule solver accepts an optional planar dynamic body. Contact inverse mass includes the obstacle's linear and yaw inertia, relative velocity includes its contact-point rotation, and impulse reactions conserve total horizontal linear momentum. Contact positional correction remains on the player nodes, so this is an approximate collision system. Wrecks coast with rolling/sliding drag; NPCs do not have player-level suspension/deformation or collision response against each other. No tire/chassis calibration was changed in this release. Highway rendering is measured under render CPU time; geometry streaming cost is not counted as physics time. Browser performance remains unmeasured.
