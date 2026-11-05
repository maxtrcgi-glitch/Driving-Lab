# Stage B — подтверждённые проверки

2026-10-11. Source Stage A307e271, reference A.1 0ef5b8d. Все результаты ниже выполнены в Node, не iPhone.

| Проверка | Результат |
|---|---|
| npm run check | 29 скриптов, exit0 |
| Simulation unit | Точный processoroutput, no dynamicstate read/write, correction0, neutral/release/reset, fullanaloglock, safe rejectedfuturemodes, независимыеABS/TCS |
| stage-b-comparison | 48 пар свободнойдинамики:50/150/200, обе стороны, corrections/lane/sharp/neutral/counter/late/excess/wrong;41 040fixedsteps, exact commands и полныеfinalstates |
| Frame delivery | Wrapper equivalence30/60/120Hz touch/digital/tilt на200; адаптерныйстенд0–250 сохраняет38 880exactsteps |
| Initial state | Полный клонированный settledstate, node velocities, wheels/drivetrain/rack, StructuralSkincache/rebinding; не толькоseed |
| Productionbootstrap | 209rendercalls/stubs,120NPC/rolling-speed/noinitialcontact, prefs/settings/spawns/cameras/lifecycle/cancel/reset, mode1/state1/correction0 вCSV |
| Protectedmodules | physics/spec/highway/highway-world/world byte-identicalA.1; controls.js byte-identicalStageA; SteeringResponse source exactA.1 |
| Future mode switching | Same-Simulation idempotent; Balanced/Assisted rejected безмутации. Реальногоswitchмеждутремярежимаминетпока |

Сценарии3s, drydefault, gas.1, DT1/240, input60Hz. Skidinitialbeta±10°/yaw∓.45rad/s. Для200/+ neutralpeakbeta48.507°/.466rad/s, counter43.225°/.449rad/s — recoverycriterion за3sне выполнен в обеихверсиях. Не объявлятьспасениеилиулучшениедрифта; неудачаводногоprotocolне доказываетфизическуюневозможность. Laneoffset−3.250m/peakbeta5.560° unchanged. RawcomparisonJSON сохраняетвсеcases.

Нулевойвводприneutralcontroller даётстрогоsteer0 несмотряназанос. Нейтральнаяцельпослеповоротаимеетпрежнийratelimitedreturn; actualrackтакженемгновенный. Это механика/эргономика, неactiveassist.

В процессеисправленыошибкитестовогоsnapshot (StructuralSkinbackreference) и устаревшеепояснениетелеметрии, неphysics. Финальныеповторныепроверкипройдены. EvidenceвZIP:check.log,comparison.json/log,adapter-baseline.json,bootstrap.log. Результатархивнойпроверки/финальныйSHA вreceipt/integrity.

Browser/control-browser недоступен; realWebGL/iPhone/FPS/heat/input-to-photonlatencyне измерены. Сравнениеcadenceне моделируетполныйbrowserdelay. Новых ассистентов/детектора/режимныхпереходовне тестировалипотомуихнет. Полныйrangeподтверждёнtouch/tilt, digitallimitсохранёнкакA.1.
