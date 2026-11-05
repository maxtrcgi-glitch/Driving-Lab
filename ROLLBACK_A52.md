# A.5.2 rollback

A51 source: gameplay-baseline/v0.14A.5.1 → e843b6ba49bad8f1888c266ef0f9614f79a9f464. Full previous source/build in backup/Gameplay_Baseline_v014A51.zip. ZIP SHA256 d19f6b0746947dd7ab2ce64bb7c6c93dbddbc72b73c36b088202997fd9f0b110,8,688,942bytes, CRC verified. Full original A51 archive remains separate and unchanged.

Fast publication rollback: deploy previously saved owner-private Site version appgprj_6ac3ab6964a8819180ced6a4738c6759~appgver_de9feffe4e5081919cc096a1095c4a7d for project appgprj_6ac3ab6964a8819180ced6a4738c6759. No new save/force-push. Native source002bc21feeaae3dd27d31ed89b3f24ca4a3982f7, buildv014a51-dbd1b70304b4. Check succeeded, root/index version and served hashes after rollback. Audience unchanged. Development native history can then be reconciled with a forward commit, not destructive reset.

Local recovery: clone history/source.bundle, checkout gameplay-baseline/v0.14A.5.1; baseline ready-build uses all local Three.js modules. Serve HTTP locally, HTTPS for iPhone. New seat fields are ignored by old A51 sanitizer; do not claim seat offsets are active in rollback. Accepted older A42 rollback remains in Git history, but A52 backup targets A51.
