# STRUCTURE

- `client/src/pages/Home.tsx`: shell full-screen 9:16, five visual layers, camera controls, board UI, game state.
- `client/src/index.css`: visual system, dark-mode tokens, board geometry, overlay motion, responsive rules.
- `client/src/App.tsx`: route `/`, ThemeProvider dark.
- `client/src/game/`: reserved for future framework-agnostic engine extraction; current lightweight engine is colocated in Home to keep the single-screen interaction cohesive.
- `/manus-storage/goldfish-overlay_cbdc9929.png`: generated koi/goldfish overlay.
- `/manus-storage/taiwan-tech-emblem_f9723e43.png`: generated abstract electronics reward emblem.
- `/manus-storage/viet-co-tuong-visual-target_77971af1.png`: generated art-direction reference.
