# MEMORY

- WebDev template is `web-db-user`; no database schema is needed for this local-session game.
- The decorative layers are explicitly `pointer-events: none`; only camera cards, camera buttons, board pieces and board controls are interactive.
- Camera streams are best-effort: front uses `facingMode: user`, back uses `facingMode: environment`; mobile browsers may require permission or may not allow two simultaneous devices.
- The AI uses deterministic minimax alpha-beta with a compact heuristic so the experience is responsive.
