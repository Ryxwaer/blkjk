<script setup lang="ts">
const game = useBlackjack()

// Each visual layer ~= roughly a deck. Real shoe is 312 cards / 6 decks.
// Show 1..6 layers based on remaining cards.
const layers = computed(() => {
  const cardsPerLayer = 52
  const n = Math.max(1, Math.min(6, Math.ceil(game.shoeRemaining.value / cardsPerLayer)))
  return Array.from({ length: n }, (_, i) => i)
})
</script>

<template>
  <div class="deck-wrap group">
    <div class="deck-stack">
      <div
        v-for="i in layers"
        :key="i"
        class="deck-card"
        :style="{
          transform: `translate(${i * -1.2}px, ${i * -1.2}px)`,
          zIndex: i
        }"
      >
        <div class="deck-back">
          <div class="font-display text-2xl text-rose-500/70 tracking-widest leading-none">
            ✶
          </div>
        </div>
      </div>
    </div>

    <div class="deck-tooltip">
      <span class="font-display text-stone-300 tabular-nums text-base leading-none">
        {{ game.shoeRemaining.value }}
      </span>
      <span class="text-[9px] uppercase tracking-[0.3em] text-stone-600 leading-none mt-1 block">
        cards
      </span>
    </div>
  </div>
</template>

<style scoped>
.deck-wrap {
  position: relative;
  width: 56px;
  height: 78px;
  opacity: 0.32;
  transition: opacity 220ms ease;
}

@media (min-width: 640px) {
  .deck-wrap {
    width: 72px;
    height: 100px;
  }
}

.deck-wrap:hover {
  opacity: 0.85;
}

.deck-stack {
  position: relative;
  width: 100%;
  height: 100%;
}

.deck-card {
  position: absolute;
  inset: 0;
  border-radius: 6px;
}

.deck-back {
  position: absolute;
  inset: 0;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    repeating-linear-gradient(
      45deg,
      #18181b 0px,
      #18181b 6px,
      #0f0f12 6px,
      #0f0f12 12px
    );
  border: 1px solid rgba(244, 63, 94, 0.22);
  box-shadow:
    inset 0 0 8px rgba(244, 63, 94, 0.05),
    0 1px 2px rgba(0, 0, 0, 0.5);
}

.deck-tooltip {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 8px);
  transform: translateX(-50%);
  text-align: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity 180ms ease, transform 180ms ease;
  white-space: nowrap;
}

.deck-wrap:hover .deck-tooltip,
.deck-wrap:focus-within .deck-tooltip {
  opacity: 1;
  transform: translateX(-50%) translateY(-2px);
}

@media (hover: none) {
  .deck-wrap {
    opacity: 0.4;
  }
  .deck-wrap:active .deck-tooltip {
    opacity: 1;
  }
}
</style>
