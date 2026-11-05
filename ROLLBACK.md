# A.5.1 rollback to accepted A.4.2

Immutable source tag before-highway-geometry/v0.14A.4.2 / gameplay-baseline/v0.14A.4.2 →93e5e260977ca0b079ccd198e12ac9cc97fafa28. All-In-One содержит Gameplay_Baseline_v014A42.zip с source и ready-build; CRC/SHA в reports/A51/baseline-backup.json. Original full A42 ZIP SHA a0145c2d65e23f2a6905866c0447829bccbb64f1509105657c51ff028aba4828 также остаётся отдельным сохранением.

Быстрый возврат публикации: Sites deploy_private_site_version с project appgprj_6ac3ab6964a8819180ced6a4738c6759 и ранее сохранённой version_id appgprj_6ac3ab6964a8819180ced6a4738c6759~appgver_1b9433174cb081918677fe7e83ef190f. Не создавать/пересохранять ту же версию. Проверить terminal succeeded, HTTPS и BUILD_RECEIPT v014a42-5e80bbad66f5,27 JS modules A42. Не менять audience.

После возврата source repo и публикация могут временно расходиться: продолжать из отдельной baseline branch, native source вернуть документированным forward commit с точными A42 files, не force-push/не reset чужую историю. Для офлайн запуска распаковать baseline/ready-build/dist, python3 -m http.server из родителя; на iPhone потребуется HTTPS-hosting с доступом. Git bundle verify/clone сначала, source backup не перезаписывать.
