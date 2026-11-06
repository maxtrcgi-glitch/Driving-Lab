> Current candidate: **Revision2**. Confirm that marker in the header before comparing. The first A60 preview failed manual behavior acceptance. Current report: Driving_Lab_A60_Traffic_AI3_R2_Report.md.

# A60 iPhone Traffic Test Guide
Status: manual validation pending. Main HTTPS URL is still A52 and must not be mistaken for this candidate.
Separate experimental preview: https://driving-lab-a60-traffic-preview.maxtrcgi.chatgpt.site (sign in with the owner account if requested). It does not replace the stable site. Confirm the version before testing.
1. Confirm header v0.14A.6.0 — Traffic AI 3.0; choose Endless highway.
2. First observe five minutes at100–120km/h with72 and120NPC, then compare28NPC. At density28, follow a visibly slower car for a minute; watch smooth braking, a pass into a free lane, and return to normal flow. Repeat density72 and120.
3. Approach a car planning a lane change at150,200,250km/h. Check it does not jump directly in front; verify no synchronized braking of unrelated lanes.
4. Watch two neighboring cars making competing maneuvers, and early cancellation if the target gap closes. Record a video of lateral jerks, clipping, unsafe cut-ins or ping-pong.
5. Drive through several curves and hills in both lanes; cars should follow road height and direction.
6. Run10–15min/multiple kilometers; watch steady density, no exhausted flow and no mass visible spawning. Respawn repeatedly.
7. Check ordinary cockpit/chase, steering, seat settings and reload. Record device/iOS, density, graphics quality/DPR, approximate FPS and stutter/thermal changes.
8. Capture telemetry before/after an issue. Note whether a real collision or impossible late cut-in caused it.
Compare with the stable A52 deployment under the same density/settings and approximate route; do not call desktop SwiftShader FPS an iPhone result.

