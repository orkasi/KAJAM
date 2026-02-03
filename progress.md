Original prompt: wow this preview is so mucuh laggy!!! even menu is 5 fps

- Reverted preview-only render tweaks in client/src/utils.js (cool text caching + tutorial rect prebuild).
- Committed and pushed to codex/preview-cooltext-cache, redeployed preview (manual deploy to avoid port conflict).
- Preview URL still http://preview-reincarnation-racing-w21n6n-nnvmsh-45-94-169-136.traefik.me
- Next: re-test FPS; if still low, add runtime perf fallback (lower pixel density / reduce shader updates) and measure.
