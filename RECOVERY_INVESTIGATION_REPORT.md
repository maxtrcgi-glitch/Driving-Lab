# DRIVING LAB v0.14A.3.1 — RECOVERY INVESTIGATION

Диагностическая HTTPS-сборка: https://max-driving-lab-recovery-a31.maxtrcgi.chatgpt.site . Private owner access. Физика и характеристика руля полностью сохранены A3. Это запись/исследование, не исправление управления. Stable A.1 и предыдущая A3 публикация не заменены.

2026-10-11. Base A3 8fad2e1695dccbb726a0dc86af0d56db6d0bac8e; original archive SHA2568937853d8c0991cbb01bb523417deb49a6102d1ad991d455b1fd92f515688b49. CRC/source bytes/receipt/Git checked. Protected baseline/A3; work/0.14A.3.1. Frozen investigation protocol commit a93437d до испытаний. Final SHA/site publication receipt в RELEASE_RECEIPT.json итогового ZIP. Full previous C0.3 preserved transitively inside original A3 ZIP.

## 1. Что удалось и что недоступно

Прочитаны текущие исходники/A3 HANDOFF/receipt и полный StageB research, включая FORCE_HYPOTHESIS_RU, SIGN_CONVENTIONS_AND_AUDIT и force evidence. Новый большой интернет-ресерч не проводился. Реальный полный DrivingLabCSV/4 из Director не возвращён доступным поиском: присутствует факт отправки, но не заголовок/строки. В этом задании доступны только четыре приблизительные пользовательские точки. Предыдущая assistant-summary про газ1/TCSOff не является сырым журналом и не использована как измерение.

Поэтому точное восстановление Touch→raw→target→position→rack→FL/FR→forces→moments именно iPhone episode НЕ выполнено. Нет реального highfrequency iPhone log. Не создавалось псевдосостояние автомобиля из beta/r: такие точки не определяют nodes/loads/tyre memory/LSD/engine/rack. Далее раздельно: (а) quoted observations, (б) подтверждённая логика исходников, (в) настоящие воспроизводимые trajectories модели, (г) гипотезы для телефона.

|Время s|Доступное наблюдение|Что следует / чего не следует|
|---|---|---|
|170.57|beta≈+10.8°,r≈−12.4°/s|Кузов и скорость не выровнены; точные силы/положение пальца неизвестны|
|170.77|r≈+8.9°/s,actual rack≈+16°|Вращение уже сменило знак при существенном угле; betaDot/command/rear forces не даны|
|170.97|r≈+82°/s|Рост нового вращения: finite difference≈+365.5°/s² за0.2s; это среднее между точками, не мгновенная yaw acceleration|
|171.37|beta≈−29°,r≈+91°/s|Выраженное противоположное скольжение, не восстановление только потому, что старое вращение прекратилось|

5Hz пропускает короткие переходы. Из этих точек нельзя установить, удерживал ли игрок руль, возвращал ли его, запаздывал ли processor или произошёл отменённый touch. Нельзя доказать отсутствие collision/damage/contact loss или состояние педалей в отдельном coast опыте.

![Quoted iPhone observations](docs/plots/iphone-quoted-points.png)

## 2. Передаточная характеристика — подтверждённая возможность дозировочной проблемы

Pad меняет raw как sign(f)*abs(f)^precision;default1.45. Speed blend=clamp((abs(speed)-8)/48). Touch shaped=abs(raw)^(1+.35blend). Target=sign(raw)[shaped×speedEnvelope+(1-speedEnvelope)×smoothstep((shaped-.45)/.55)]. Нет дополнительного этапа shaped→target filter: это алгебра одного вызова. Dynamic filter/rate находятся между target и position. Physical rack target=−0.57position; cap3rad/s; Ackermann передние углы отличаются и включают toe в направлении сил шин. Positive input значит negative actual rack; positive rack вращает вправо при обычном forward движении. Знак β не равен универсальному правильному steering sign.

При200km/h:

|Finger travel|Raw|Target|Abs settled rack|
|---|---:|---:|---:|
|20%|.09694|.01069|.349°|
|40%|.26484|.04140|1.352°|
|50%|.36602|.06400|2.090°|
|60%|.47678|.09137|2.984°|
|70%|.59620|.13987|4.568°|
|80%|.72357|.38022|12.417°|
|90%|.85832|.75409|24.627°|
|100%|1|1|32.659°|

Target монотонный, симметричный, непрерывный; outer smoothstep имеет непрерывный первый derivative, дискретного скачка нет. Но local gain около60%≈9.7deg/full fingertravel,80%≈110deg/travel: рост≈11.3×. Средний диапазон не нулевой, зато внешняя часть требует намного более тонкого дозирования. Это возможная причина overshoot при собственном countersteer, НЕ доказанная причина конкретного phone event. Ничего в curve/precision/rate не изменено. 5005 static samples50–250km/h and actual20 sequential actuator trials. Статические FL/FR curves — точная алгебра Ackermann; реальные dynamic FL/FR отдельно записаны стендом.

![Transfer](docs/plots/steering-transfer.png)
![Sequential steering](docs/plots/steering-time.png)

## 3. Задержки: не сводить их к скорости руля

A3 pad callback и dt0 updateInputs принимают raw/target сразу; это не измерение hardware sampling. Response position продвигается240Hz. LP tau35–55ms с selective multiplier.8; normal1.8/return2/reversal2.4 смешиваются с fast3.4 при больших target/error. Mechanical rackcap3rad/s unchanged. Отпускание pad меняет raw0, затем прежний finite return. Это управляемый lag, не интегральное накопление ошибки: position bounded и стремится к target.

Повторные противоположные команды измерены tests/steering-transfer-a31.mjs: synthetic accepted event→target→command→actualrack/front angles at240Hz, обе стороны/5скоростей. Max target-position ошибки могут быть большими при +1→−1, но actualrack-command tracking практически0 (см.transfer-metrics.json). UI/runtime FPS/sensor/display latency не измерены. Existing80ms frame clamp/20 steps также не изменён, lowFPS discarded time может увеличивать wall-clock steering delay. Воспроизводимые A3 delay tables вновь применимы, потому что controls/physics byte-identical и сохранены внутриpriorA3 ZIP: full200 reversal rack50%=295.8ms,90%=583.3ms,within.05deg866.7ms;W0/W1t90=554.2/608.3ms. Exact100% часто асимптотический — не подменять tolerance значением100%.

Offline mechanical-fast пропускает только responsefilter, выдаёт target непосредственно Vehicle.step с реальным3rad/s rack cap; это допустимый механический upper-response experiment, НЕ новая game setting, НЕ изменённая модель. Во всех24 seeded states с прежним большим held counter он не прошёл path-aware recovery. Следовательно задержка может быть фактором, но просто её уменьшить недостаточно, а направление/амплитуда/время снятия остаются важными.

## 4. Настоящие динамические сценарии и Oracle

24 donor states:stock dry flat model,50/100/150/200km/h,both signs,3 timepoints0.75/.95/1.20s после0.4ssettle. Условия зафиксированы заранее: finger.78 до.8s,opposite.9 затем;gas1;handbrake.22 между.5–.8s. Никакого injected beta/yaw; это скольжение от actual input. Названия early/late/aftercounter — независимые timeline labels, не ground truth classifier фаз.

Состояния включают все nodes/beams/wheels/tyre α/κ/omega/rack/engine/clutch/filters/processor/observer. structuredClone сохраняет alias topology; V8binary full-snapshots.v8 сохраняет её на диске. JSON flatten не использовать для точного replay. 24 duplicate runs с read-only force probe versus обычный Vehicle совпали по checkpoints; snapshot serialization roundtrip separately checked. Прошлые ограниченные цифровые logs не содержат такого complete state и не подходят для точного player counterfactual.

696 runs3s:25 fixed steering policies +4 additional pedals perstate. Neutral,large counter.9 held.65s,smaller.5,early unwind.2s,delay.2s,mechanical-fast,geometric alignment with validity guards; finite grid±.5/±.8/±1×.2/.5/.8s thenrelease. Geometric controller использует inverse shaping и штатный processor/rack. Никаких assist вdist; все controllers только tests. Ранее counter timing исследуется стартом в раннем donor state и delayed policy; это не exact rewind реального player input. Поиск заранее ограничен, результат не global optimum и не theorem об unrecoverability. Grid не претендует на независимую validation будущего predictor/assist.

Успех: beta<3°,|r|<.1rad/s,|V|<1m/s,U>5 sustained.3s; дополнительно all contacts,maxdamage<.03,maxheading excursion<30°,maxoffset<8m,no opposite beta>5° while forwardU>3 andabsbeta<.8rad. Эти conservative path gates условны, а не доказательство дорожной безопасности. Report все metrics, не только boolean. Результат:26 успешных candidates в10/24states; зеркальные outcomes совпадают, max peakβmirror discrepancy1.65e−9°. В severe200km/h states в этом finite search безопасный исход не найден — это НЕ доказательство физической невозможности. Стабилизация может быть возможна ценой недопустимого path deviation.

|Policy,full gas|Стабилизация beta/r/V|Path-aware successes /24|Secondary events /24|
|---|---:|---:|---:|
|Большой counter.9 held.65s|0|0|20|
|Mechanical-fast sameangle/hold|0|0|20|
|Меньший counter.5 held.65s|6|4|8|
|Early unwind after.2s|6|2|8|
|Geometric reference|10|2|18|
|Delayed counter|4|0|18|
|Neutral|4|0|6|

50km/h recovered states:3timepoints/bothsigns;100km/h:.95;150km/h:.75. Пример150km/h early:gridfinger−.8 held.5s,peakbeta16.156°,recovery1.417s,maxoffset2.808m,maxheading11.847°,no secondary/allcontacts. Samefullstate large.9held.65s and mechanical-fast both spun (~180°peakbeta). Это доказательство существования допустимой восстановимой траектории в конкретной модели.

Пример100km/h .95:early-unwind stabilizes at1.058s,peakbeta10.209°,heading14.585°,ноoffset17.814m, поэтому strict path recovery FAIL. Reference stabilizes2.142s,offset8.727m,secondary FAIL. Пример200km/h1.20 neutral stabilizes2.038s,ноoffset60.746m,heading30.215°,secondary FAIL: нельзя назвать такое «машина спокойно спасена».

![Oracle](docs/plots/oracle-comparison.png)

## 5. Силы и моменты: установленный механизм переброса

Offline ForceProbe observes original distributeCouple непосредственно перед node integration на каждом1920Hzsubstep. Fx/Fy/normal load/geometry/αrelaxed/κ/driveTorque берутся из настоящего Vehicle; forward projected into road plane,lateral=normal×forward; wheel forces преобразованы в world/body; moments about true ALL-node mass COM atcontact hub−radius×normal; rolling resistance разделён. Для flat yaw projection hub-vs-contact rolling difference не создаёт y torque. CSV60Hz содержит mean8substeps последнего240Hztick, не среднее всех пропущенныхticks. Runtime highfreq uses end-tick estimates, это другой уровень точности.

Max external/allnode torque closure residual1.246e−9Nm. Max finite-difference ALL-node angular-momentum residual versus pre-drag torque9.066Nm (drag+discretization excluded from pre-dragmeasurement). Не утверждаем, что chassis yaw acceleration точно M/Iall: suspension/chassis exchange momentum. Эти результаты говорят против sign/scaling/conservation implementation defect в проверенных flat scenarios; не калибруют stiffness/load/inertia/tyre force law к реальному GR86.

Natural100km/h donor.95,sign+ (не iPhone replay):

|Послеsnapshot s|rack°|beta°|r°/s|FrontMy kNm|RearMy kNm|
|---|---:|---:|---:|---:|---:|
|.004|−.60|+8.4|−29.6|−7.464|+6.635|
|.204|+17.0|+10.1|+7.1|+6.202|+7.338|
|.404|+26.4|+2.0|+73.4|+6.411|−2.230|
|.804|+16.7|−20.1|+73.5|+6.904|−6.147|

Изначально передний момент поддерживает отрицательное вращение, rear oppose. После steering reversal frontFy меняет знак;rear moment пока имеет прежний положительный знак. Оба ускоряют positive yaw. Послеrужеpositive приt.204 большойrack остаётся;front angle/relaxed slip создают положительный frontMy даже когда rear уже opposing. Bodybeta проходит через0 позже и возникает противоположное скольжение. При удержании угол не обязан быть «правильным» просто потому, что это counter относительно начального заноса.

Вt.404 front relaxedα≈−17.5°/−23.8°,qratio≈1.35/2.03 (combined saturation);rear α≈−.7°/−.7°,qratio.17/.46. Нельзя сказать, что front force просто «не хватает»: большая frontforce в этот момент ускоряет нежелательное новое вращение. Rear force направление/момент также меняется с запаздыванием body/velocity geometry. Later обе оси глубоко скользят;уменьшениеrpm/r безbeta/V/path не recovery.

![Forces and moments](docs/plots/force-time.png)
![Tyre states](docs/plots/tyre-time.png)

Steering authority frozen sweep отдельно:24states×115racks×4horizons0/50/100/200ms. Ограничение reachable3rad/s,α/κ relaxation к candidate geometry при frozen load/hubvelocity/omega. Это local force sensitivity, НЕ C0.3 predictor или полная actualtrajectory. Opposing currentyaw moment и improving instantaneousbetaDot могут требовать разных angular directions; отсутствие обоих признаков в100ms не доказывает невозможность eventual recovery. Truefull-state Oracle — более сильная проверка результата. Geometric self-steering alignment не универсальная оптимальная команда.

## 6. Шины, нагрузки, numerical stability

Исходная tireForce: generic combined brush,frontCα46000/rear60000N,load^0.8 stiffness,load^-0.1μsensitivity,combined radius,afterpeak amplitude decays лишь до91%peak. Frozenactualκ влияет на lateral share; qratio1 означаетcombinedbrush saturation,не обязательно отдельный максимумFy. Currentlaw не имеет огромного резкого force-drop при одном большомalpha. Статический sweep3loads×3κ×2axles проверяет finite forces, Fy opposing slip sign и hypot(Fx,Fy)<=limit. Source parameters estimates, не измеренные tyre data; rear stiffness balance может нуждаться в calibration, но сейчас не менялся.

Measured preintegration relaxation τ=length/max(|wheelLong|,2). В начале seed100km/h medianατ≈11.47ms,150≈7.76ms,200≈5.83ms,50≈20.69ms. При сильном sideways motion τ может достигнуть150ms потому, что продольная скорость колеса мала;bodyhighspeed не означает высокий tyre transport. Нельзя объяснить первый0.2s flip единственно «очень медленной шиной», но поздняя sliding memory остаётся фактором. Force-derivatives CSV — finite differences60Hz recorded means, не exactphysicalsubstep derivatives.

External-step convergence100/200km/h1/120,1/240,1/480 при одинаковойструктурной substep<=1/1920:100 finalβ155.673/155.598/155.560°,200 finalβ158.683/158.733/158.757°,small stable differences в этих сценариях. Это argument против timestep catastrophe, не глобальная validationphysics/FPS. Contact loss при сильныхlargecommands действительно наблюдался (до2–3contacts), поэтому нельзя считать unreliable states goodcontroller targets. Нужноvalidity failclosed, а не скрытоповышатьμ.

![Tyre law](docs/plots/tyre-law.png)

## 7. Отпускание газа, LSD и обнаруженный предел модели

Original throttle filterτ.22s: после immediategas0 filtered≈.39 в.204s,.157 в.404s,.063 в.604s. Throttle90%fall needs≈.507s. Engine/coupledclutch/wheels имеют собственную память;gas0 не zeroaxletorque и не обязательно enginebraking каждыймомент. В100lateoff rear torque mean trace≈1001Nm в.004s,593Nm в.204s,80Nm в.404s,77Nm в.804s,256Nm в1.604s,800Nm в2.604s при почтинулевомthrottle. Flywheel energy, gear/clutch synchronization и idle control способны передавать positive torque без pedal; negative transmission torque тоже встречается. Не называть весь negativeDrive isolatedenginebraking.

96 дополнительнопарных pedal branches:immediategas0,gas0 после.2s counter,scheduled.5s nominalunwind,near-neutralgas.12. Все24 с темжебольшим heldcounter не прошлиstrictrecovery, дажеoff. Initial50early maxβ179.9°full→25.0°off;100late179.8→155.6;150/200severe остаётся≈180°. Это поддерживает замечание игрока: уменьшениетяги недостаточно при ошибочном/запаздывающем angularforcing. Off меняет задний longitudinal use, но не отменяет lateralvelocity/yaw и heldsteer.

Ещё144 trials:existing userLSDsetting On/Off×fullgas/immediateoff/recovery-signature,all24seeds. Signature требует одновременно уменьшение|β|и|r|50ms при|β|>5°,U>5; в этихбольшихheldcounter trajectories такихevents0, поэтому «release в доказанном начале recovery» не получилось. Не подменено уменьшениемyawalone. Scheduled.5branch не называетсяactualrecoverysignature. Across24state meanpeakβfullLSDon179.9°,off165.3°;immediategasoffLSDon136.3°,off136.1°. Means не главныйcriterion и не показываютglobalLSDbenefit. LSD transfer толькоequal/opposite torque boundedabs(totalTorque), не yawforce илиgrip multiplier. Neutralgear/clutchdisconnect userinput не представлены этоймоделью;near-neutralgas.12 не настоящий0torque.

Отдельныйengine integrator audit обнаружил finite lowerclamp engineOmega40rad/s. В9/12sign+ gasoffspin states clamp добавляетangularimpulse, earliest≈1.748s послеsnapshot;100latefirst2.756s. Audit реконструирует originalengineintegrationerror<1.2e−13rad/s. Это численнаяregularization/модельавтоподдержанияработы, а не чистая механическая energyconservation. В severe lowRPM/reversingwheelspin это отдельная реализационная/модельнаяпроблема для causal audit. В100late initialyawflip.2–.4s происходит раньшеfloor, такчто floor не объясняет его. Нет intervening branch сremovedclamp, поэтому причинныйвкладfloor в окончательнуюнеудачу НЕ установлен. Physicssource не менялся. Next narrow audit:idle/clutch/downshift/stall energy bookkeeping,безподгонкиgrip.

## 8. Сравнение гипотез

|Гипотеза|Доказательства|Противоречия/предел|Статус|
|---|---|---|---|
|Недостаточный steering rate|ВA3finitefullreversal90%.583s;release такжеfinite|Mechanical-fast sameheldangle0/24strictsuccess;wheelmomentstrong иwronglater|Возможныйфактор,неуниверсальноосновнаяпричина|
|Ошибочная shaping/dosing|Outer gain≈11× versus midrange;large target требуетoutertravel|Smooth/monotonic;normaliPhonehandlingподтвержденпользователем|Гипотезаэргономикиподдержана,безизмененияcurve|
|Избыточная tyre delay|Sidewayswheelτдо150ms;α/κmemory|Initial100/200τ≈11.5/5.8ms,forcesactuallyreact|Не доказан excessparameter;state-dependent delay подтверждён|
|Некорректная chassisforces/yaw|Generic stiffness/inertia/load assumptions;contactsdropatspin|Momentclosure1e−9Nm,mirrors/convergenceconsistent|Sign/conservationbugне найден;realismcalibrationнеподтверждена|
|Power/TCSonly cause|Gas1+LSD combinedslip усиливаютнекоторыесценарии|Gasofffailedsameheldcounter;residualtorquepossible;angularstatepersists|Недостаточноедляодногообъяснения|
|Overheld/oversized counter|ActualfrontMymaintainsnewyaw;smaller/earlyunwind иногдауспешны|Phonefullchainmissing;earlyunwindmaymissdesiredpath|Механизмвмоделидоказан,наphoneпокаhypothesis|
|Enginefloor/modelregularization|9/12gasoffspinbranchescappedΩ40,addedimpulse|Laterthaninitialflip,no clamp-ablationcausaltrial|Реальныйauditfinding,отдельныйследующийфизическийexperiment|
|Настоящаяпотеряуправляемости|Severe200searchfailsallpathgates;off/fastнепомогают|Finitegridfailureнеglobalimpossibility;neutralcanstabilizewith60mdeviation|Физическивозможныйпредел;неprovenдляphone|

## 9. Высокочастотный recorder и input-source lifecycle

SteeringTrace/2,60Hz,1200rows20s,84Float64columns,806400bytes. ExistingStateEstimator alreadyupdates240Hz. Recorder reads endticktrue forces/angles and filtered40ms βDot/rDot,appacceptedpadEventTime/receivedTime +passivepad/button/keyboard eventmetadata,source/touchactive/digitalheld/tiltenabled,gas/filteredthrottle/gear/clutch/driveTorque,αgeom/αrelax/κ/Fx/Fy/Fz/limit/qratio,contact/damage/validreasons/approximatemoments. No capture allocations; startup passive observers and export allocate only outsidecapture. Enabledcanbefullydisabledvia window.drivingLab.steeringTrace.enabled=false. Ring includeslasttimestampsheld,невыдуманныеhardwareevents60Hz. Simulationtimeexcludespauses;cartimeidentifiesreset. Pausepreservesbuffer. Listenerrecordsmayobserve events ignoredbycontrolownership;acceptedtimestampsseparate.

Source mode2 digital вapp выбираетсяпри releasedpad and !tilt дажебезdigitalbutton/key. Поэтомуtouch→digital0можетбытьпростоотпусканиемпальца. Вtests syntheticpointercancel приводитraw0/inactive/digital-idle;lostcaptureнеоставляетостаточногоinput. Новыйdigitalheld+eventsource помогаетотличатьнажатиекнопкиотneutralrelease. КонкретныепереключениястарогоphonejournalнеразобраныбезCSV. NoassumptionthatUIbugabsent: Safari dualpointer/touchownership/cancelneedsrealdeviceevents.

960identityticks withtraceenabled/disabled andOn100request compare completephysicsbitexact,read-onlycaptureverified. Hostcapture median.000212ms/p95.000794ms averagedperphysicalcall;это Node cost с240Hzcalls, НЕiPhoneFPS/thermal/displaylag. Existing29Node+5Shadow+1Predictorcheckspassed, finalappstubboot120NPC/pause/settings/reset/cameraspassed;noactualSafari/WebGLtests. C0.3 algorithm/state/ref/slip/controls/Vehicle/spec/traffic/model filesbyteidenticalA3;previouspredictionvalidationremainsA3controlledbaseline,не новая accuracyclaim.

## 10. Ответы для следующего решения

1. **Почему конкретный автомобиль на iPhone не удаётся стабилизировать?** Точная причина пока не установлена: полного CSV и высокочастотной записи нет. В аналогичном сценарии движка доказана цепочка «большой удерживаемый угол → передний момент поддерживает новое вращение → вторичный занос». Ограниченный поиск находит как восстановимые, так и потерявшие допустимую траекторию состояния. Перенос этого объяснения на конкретный журнал остаётся гипотезой.
2. **Почему увеличение steering rate не решило проблему?** Быстрее достичь чрезмерного угла и затем удерживать его — не то же самое, что правильно дозировать контрруление. Офлайн-вариант с прямой выдачей target и штатным механическим пределом тоже не восстановил эти 24 состояния при большом удерживаемом counter. Скорость является лишь одним фактором вместе с амплитудой, направлением и временем снятия.
3. **Какую роль играет отпускание газа?** Оно уменьшает некоторые тяжёлые заносы, но не обнуляет боковую скорость и вращение. Педаль проходит фильтр, трансмиссия и маховик имеют память, idle control может передавать тягу. Поэтому gas0 не равен нулевому моменту на оси. Поздний предел engineOmega отдельно требует проверки энергетики.
4. **Есть ли восстановимая область?** В 10 из 24 проверенных состояний найден хотя бы один физически допустимый кандидат, прошедший строгие условия скольжения и траектории. Это не непрерывная карта области управляемости. Неудача остальных кандидатов не доказывает глобальную физическую невозможность.
5. **Как отличать ошибку водителя от ошибки реализации?** Нужны фактическая цепочка ввода, силы, полные состояния и сравнимый лучший кандидат. Для реализации отдельно проверяются знаки, баланс моментов, пределы, контакты и сходимость. Моментный баланс в проверенных сценариях согласован; поздний численный engine floor найден, но его причинный вклад пока не установлен. По четырём точкам нельзя обвинить ни игрока, ни движок.
6. **Что рекомендовать без ущерба обычному управлению?** Сначала получить исходный CSV и запись на 60 Гц. Затем, только по отдельному заданию, проверить более равномерное усиление внешнего диапазона при сохранении центральной характеристики и полного механического угла. Сравнить дозирование и раннее снятие руля вместо очередного общего rate boost. Отдельно провести узкий аудит idle/clutch/downshift/engine floor. В этой версии ничего из этого не изменено.
7. **Нужен ли активный Countersteering Assist?** Для самого факта восстановления он не обязателен: некоторые состояния восстанавливаются допустимыми командами водителя. Для удобства на телефоне он может быть полезен, но включать его до проверки входных сигналов, физических ограничений и неопределённости предиктора рано. Помощник не исправляет физически невозможную траекторию или ошибку энергетики. Архитектура остаётся единой: Off/On и Strength.

**Статус:** инженерные эксперименты и диагностическая сборка сохранены. Причинный разбор конкретного эпизода iPhone частично заблокирован отсутствием исходного CSV. Требуется файл DrivingLabCSV/4 и новая запись SteeringTrace/2. Работа остановлена.
