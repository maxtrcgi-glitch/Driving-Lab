# A.4.1 — P0 repeat launch

Confirmed on unchanged A4: real Vehicle accelerates to 100 km/h, brakes to a complete stop and remains stationary for eight seconds with full gas. RPM900, first gear, shiftTimer0, shiftRecovery=true, clutch open, wheel drive torque0. Automatic downshift leaves recovery waiting for locked/synchronized clutch; recovery cuts combustion; low-speed launch needs raised RPM to engage clutch. This is a control-state deadlock, not insufficient tyre grip.

Fix: only after shiftTimer expires, when |forward speed|≤3m/s and connected wheel-side RPM<1900, hand recovery back to existing automatic launch control. Shift torque cut, engine/friction/idle model, clutch capacities and launch curve remain unchanged. No chassis impulse, wheel-speed injection, tyre or TCS change.

Regression: tests/launch-validation.mjs exports immutable A4 physics into a temporary ESmodule tree, requires the old repeat-launch suite to fail, and the fixed suite to pass. reports/relaunch-A4.json and relaunch-fixed.json include 10Hz samples of RPM/gear/recovery/timer/clutch/torque/wheelRPM/speed. Five of14 old configurations fail; all15 fixed cycles pass (default repeat twice). RWD/FWD/AWD × TCS/LSD, 80/120km/h stops, reverse after forward stop, actual light bumper contact with no broken links. Initial clutch states0/.4/1 and unfinished timed shift checked separately. No manual transmission is implemented, so manual-mode testing is unavailable.

5760 complete Vehicle state ticks at50/100/150/200km/h with TCSOff/On remain bit exact against A4 outside the corrected low-speed transition. Source guard allows exactly the documented recovery block; all other physics source is byte identical. Core npm run check29programs passes. Not an iPhone test; final device check remains required.
