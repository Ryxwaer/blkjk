# BLKJK

A grim, glitchy, single-player blackjack. No accounts. Unlimited chips. Pull the trigger.

Built with Nuxt 4, Tailwind 4, motion-v and Bun.

## Run

```bash
bun install
bun run dev
```

Then open http://localhost:3000.

## Controls

- `1` / `H` — hit
- `2` / `Space` / `S` — stand
- `3` / `D` — double
- `Space` / `Enter` — deal / again
- `↑` `↓` — adjust bet (`Shift` for ±100)

Cards are draggable by mouse, Balatro-style.

## Docker

```bash
docker compose up -d --build
```

Multi-stage Bun image, exposes port `3000`, attaches to the `nginx-proxy-manager_default` network.

## Tech

- [Nuxt 4](https://nuxt.com/) + [Nuxt UI](https://ui.nuxt.com/)
- [Tailwind CSS 4](https://tailwindcss.com/)
- [motion-v](https://motion.dev/) for spring animations and drag
- [Bun](https://bun.sh/) for install / build / runtime
