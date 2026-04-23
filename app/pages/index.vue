<script setup lang="ts">
import { Motion, AnimatePresence } from 'motion-v'

const game = useBlackjack()

const playerHighlight = computed(() => {
  if (game.phase.value !== 'resolved') return null
  if (game.outcome.value === 'win' || game.outcome.value === 'blackjack') return 'win'
  if (game.outcome.value === 'lose' || game.outcome.value === 'bust') return 'lose'
  if (game.outcome.value === 'push') return 'push'
  return null
})

const dealerHighlight = computed(() => {
  if (game.phase.value !== 'resolved') return null
  if (game.outcome.value === 'win' || game.outcome.value === 'blackjack') return 'lose'
  if (game.outcome.value === 'lose' || game.outcome.value === 'bust') return 'win'
  if (game.outcome.value === 'push') return 'push'
  return null
})

const dealerHasHidden = computed(() => game.dealer.value.some(c => c.hidden))
const showDealerTotal = computed(() => game.dealer.value.length > 0 && !dealerHasHidden.value)

const winRate = computed(() => {
  if (game.handsPlayed.value === 0) return '—'
  return `${Math.round((game.wins.value / game.handsPlayed.value) * 100)}%`
})

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable
}

function onKey(e: KeyboardEvent) {
  if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
  if (isTypingTarget(e.target)) return

  const phase = game.phase.value
  const k = e.key
  const code = e.code
  const isSpace = k === ' ' || code === 'Space'
  const isEnter = k === 'Enter' || code === 'Enter' || code === 'NumpadEnter'

  if (phase === 'player') {
    if (k === '1' || k.toLowerCase() === 'h') {
      e.preventDefault()
      game.hit()
    } else if (k === '2' || isSpace || k.toLowerCase() === 's') {
      e.preventDefault()
      game.stand()
    } else if (k === '3' || k.toLowerCase() === 'd') {
      if (game.canDouble.value) {
        e.preventDefault()
        game.double()
      }
    }
    return
  }

  if (phase === 'betting') {
    if (isSpace || isEnter) {
      e.preventDefault()
      game.deal()
    } else if (k === 'ArrowUp') {
      e.preventDefault()
      game.adjustBet(e.shiftKey ? 100 : 25)
    } else if (k === 'ArrowDown') {
      e.preventDefault()
      game.adjustBet(e.shiftKey ? -100 : -25)
    }
    return
  }

  if (phase === 'resolved') {
    if (isSpace || isEnter) {
      e.preventDefault()
      game.nextRound()
      game.deal()
    }
  }
}

onMounted(() => window.addEventListener('keydown', onKey))
onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
</script>

<template>
  <div
    class="relative w-full overflow-hidden flex flex-col"
    style="height: 100dvh; max-height: 100dvh;"
  >
    <!-- HUD -->
    <header
      class="relative z-10 flex items-center justify-between gap-3 px-4 sm:px-10 pt-[max(0.75rem,env(safe-area-inset-top))] pb-2 sm:py-4"
    >
      <h1
        class="glitch-text font-display text-base sm:text-3xl shrink-0 text-stone-400"
        data-text="BLKJK"
      >
        BLKJK
      </h1>

      <div class="flex items-baseline gap-5 sm:gap-10">
        <Motion
          :key="game.chips.value"
          as="div"
          class="font-display text-base sm:text-3xl tabular-nums leading-none text-stone-200"
          :initial="{ scale: 1.12, color: '#fb7185' }"
          :animate="{ scale: 1, color: '#e7e5e4' }"
          :transition="{ duration: 0.45 }"
        >
          ${{ game.chips.value.toLocaleString() }}
        </Motion>

        <div class="hidden sm:block text-right leading-none">
          <div class="text-[10px] uppercase tracking-[0.35em] text-stone-500 mb-0.5">
            rate
          </div>
          <div class="font-display text-2xl text-stone-300 tabular-nums leading-none">
            {{ winRate }}
          </div>
        </div>
      </div>
    </header>

    <!-- Table — gets the upper 60-65% of the screen -->
    <main class="relative z-10 flex-1 min-h-0 flex flex-col items-center justify-center gap-3 sm:gap-12 px-3 py-2 sm:py-6 overflow-hidden">
      <Hand
        :cards="game.dealer.value"
        :total="game.dealerTotal.value"
        :show-total="showDealerTotal"
        :highlight="dealerHighlight"
      />

      <div class="h-6 sm:h-8 flex items-center justify-center">
        <AnimatePresence mode="wait">
          <Motion
            v-if="game.message.value"
            :key="game.message.value"
            as="div"
            class="font-display text-base sm:text-2xl tracking-[0.35em] sm:tracking-[0.45em] uppercase"
            :class="{
              'text-emerald-400': game.outcome.value === 'win' || game.outcome.value === 'blackjack',
              'text-rose-500': game.outcome.value === 'lose' || game.outcome.value === 'bust',
              'text-amber-300': game.outcome.value === 'push'
            }"
            :initial="{ opacity: 0, y: 12, filter: 'blur(8px)' }"
            :animate="{ opacity: 1, y: 0, filter: 'blur(0px)' }"
            :exit="{ opacity: 0, y: -12, filter: 'blur(6px)' }"
            :transition="{ duration: 0.35 }"
          >
            <span
              v-if="game.outcome.value === 'blackjack'"
              class="glitch-text"
              data-text="BLACKJACK"
            >
              BLACKJACK
            </span>
            <span v-else>{{ game.message.value }}</span>
          </Motion>
        </AnimatePresence>
      </div>

      <Hand
        :cards="game.player.value"
        :total="game.playerTotal.value"
        :show-total="game.player.value.length > 0"
        :highlight="playerHighlight"
      />
    </main>

    <BetControls />
  </div>
</template>
