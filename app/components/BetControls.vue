<script setup lang="ts">
import { Motion, AnimatePresence } from 'motion-v'

const game = useBlackjack()

const chipDenoms = [25, 100, 500, 1000]
const chipDrawerOpen = ref(false)

function addChip(amount: number) {
  game.adjustBet(amount)
}

function clearBet() {
  game.setBet(100)
}

function maxBet() {
  game.setBet(Math.min(game.chips.value, 5000))
}

function toggleDrawer() {
  chipDrawerOpen.value = !chipDrawerOpen.value
}

function dealAndClose() {
  chipDrawerOpen.value = false
  game.deal()
}

function replay() {
  game.nextRound()
  game.deal()
}

watch(() => game.phase.value, (p) => {
  if (p !== 'betting') chipDrawerOpen.value = false
})

const isBetting = computed(() => game.phase.value === 'betting')
const isPlayer = computed(() => game.phase.value === 'player')
const isResolved = computed(() => game.phase.value === 'resolved')
</script>

<template>
  <div
    class="relative z-20 px-3 sm:px-6 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-6"
  >
    <div class="mx-auto max-w-3xl">
      <!-- Chip drawer (mobile) — slides up from above bar -->
      <AnimatePresence>
        <Motion
          v-if="isBetting && chipDrawerOpen"
          key="drawer"
          as="div"
          class="sm:hidden mb-3 rounded-md border border-stone-800/80 bg-zinc-950/85 backdrop-blur px-3 py-3"
          :initial="{ opacity: 0, y: 16 }"
          :animate="{ opacity: 1, y: 0 }"
          :exit="{ opacity: 0, y: 12 }"
          :transition="{ type: 'spring', stiffness: 360, damping: 28 }"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-[9px] uppercase tracking-[0.35em] text-stone-500">
              wager
            </span>
            <button
              type="button"
              class="text-[9px] uppercase tracking-[0.35em] text-stone-500 active:text-stone-200 px-1"
              @click="chipDrawerOpen = false"
            >
              close
            </button>
          </div>
          <div class="flex items-center gap-1.5 flex-wrap">
            <button
              v-for="amount in chipDenoms"
              :key="amount"
              type="button"
              class="px-3 py-2 rounded-sm border border-stone-700/70 bg-stone-950/40 text-stone-300 active:bg-stone-800 transition text-xs font-display tracking-wider min-h-[40px]"
              @click="addChip(amount)"
            >
              + ${{ amount }}
            </button>
            <div class="flex-1" />
            <button
              type="button"
              class="px-2 py-2 text-[10px] uppercase tracking-[0.3em] text-stone-500 active:text-stone-200 transition min-h-[40px]"
              @click="clearBet"
            >
              reset
            </button>
            <button
              type="button"
              class="px-2 py-2 text-[10px] uppercase tracking-[0.3em] text-rose-700 active:text-rose-400 transition min-h-[40px]"
              @click="maxBet"
            >
              all in
            </button>
          </div>
        </Motion>
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <!-- BETTING -->
        <Motion
          v-if="isBetting"
          key="bet"
          as="div"
          class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6"
          :initial="{ opacity: 0, y: 8 }"
          :animate="{ opacity: 1, y: 0 }"
          :exit="{ opacity: 0, y: -8 }"
          :transition="{ duration: 0.18 }"
        >
          <!-- mobile: compact bet bar -->
          <div class="flex items-stretch gap-2 sm:hidden">
            <button
              type="button"
              class="flex-1 flex flex-col justify-center rounded-sm border border-stone-800/80 bg-zinc-950/60 px-3 py-2 text-left active:bg-stone-900 transition"
              @click="toggleDrawer"
            >
              <span class="text-[9px] uppercase tracking-[0.35em] text-stone-500 leading-none">
                bet · tap to edit
              </span>
              <Motion
                :key="game.bet.value"
                as="div"
                class="font-display text-2xl text-stone-200 tabular-nums leading-none mt-1"
                :initial="{ scale: 1.1 }"
                :animate="{ scale: 1 }"
                :transition="{ type: 'spring', stiffness: 400, damping: 18 }"
              >
                ${{ game.bet.value.toLocaleString() }}
              </Motion>
            </button>
            <Motion
              as="button"
              type="button"
              class="px-7 rounded-sm bg-stone-200 active:bg-stone-300 text-stone-950 font-display text-base tracking-[0.3em] uppercase border border-stone-300 transition disabled:opacity-30"
              :disabled="game.bet.value > game.chips.value"
              :while-tap="{ scale: 0.97 }"
              @click="dealAndClose"
            >
              deal
            </Motion>
          </div>

          <!-- desktop: full controls -->
          <div class="hidden sm:block leading-none shrink-0">
            <span class="text-[10px] uppercase tracking-[0.35em] text-stone-500 mb-1 block">
              bet
            </span>
            <Motion
              :key="game.bet.value"
              as="div"
              class="font-display text-4xl text-stone-200 tabular-nums leading-none"
              :initial="{ scale: 1.1 }"
              :animate="{ scale: 1 }"
              :transition="{ type: 'spring', stiffness: 400, damping: 18 }"
            >
              ${{ game.bet.value.toLocaleString() }}
            </Motion>
          </div>

          <div class="hidden sm:flex sm:items-center sm:gap-2">
            <button
              v-for="amount in chipDenoms"
              :key="amount"
              type="button"
              class="px-3 py-1.5 rounded-sm border border-stone-700/70 bg-stone-950/40 text-stone-300 hover:bg-stone-800 hover:border-stone-500 transition text-sm font-display tracking-wider"
              @click="addChip(amount)"
            >
              + ${{ amount }}
            </button>
            <button
              type="button"
              class="px-2 py-1.5 text-xs uppercase tracking-[0.3em] text-stone-500 hover:text-stone-200 transition"
              @click="clearBet"
            >
              reset
            </button>
            <button
              type="button"
              class="px-2 py-1.5 text-xs uppercase tracking-[0.3em] text-rose-700 hover:text-rose-400 transition"
              @click="maxBet"
            >
              all in
            </button>
            <Motion
              as="button"
              type="button"
              class="ml-2 px-6 py-2.5 rounded-sm bg-stone-200 hover:bg-stone-100 text-stone-950 font-display text-base tracking-[0.3em] uppercase border border-stone-300 transition disabled:opacity-30"
              :disabled="game.bet.value > game.chips.value"
              :while-tap="{ scale: 0.97 }"
              @click="game.deal"
            >
              deal
            </Motion>
          </div>
        </Motion>

        <!-- PLAYER -->
        <Motion
          v-else-if="isPlayer"
          key="player"
          as="div"
          class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6"
          :initial="{ opacity: 0, y: 8 }"
          :animate="{ opacity: 1, y: 0 }"
          :exit="{ opacity: 0, y: -8 }"
          :transition="{ duration: 0.18 }"
        >
          <!-- mobile: HIT dominates the thumb zone -->
          <div class="flex items-stretch gap-2 sm:hidden h-16">
            <Motion
              as="button"
              type="button"
              class="basis-[30%] rounded-sm bg-zinc-900 active:bg-zinc-800 text-stone-300 font-display text-sm tracking-[0.3em] uppercase border border-stone-800 transition"
              :while-tap="{ scale: 0.97 }"
              @click="game.stand"
            >
              stand
            </Motion>
            <Motion
              as="button"
              type="button"
              class="flex-1 rounded-sm bg-stone-200 active:bg-stone-100 text-stone-950 font-display text-xl tracking-[0.4em] uppercase border border-stone-300 transition"
              :while-tap="{ scale: 0.97 }"
              @click="game.hit"
            >
              hit
            </Motion>
            <Motion
              v-if="game.canDouble.value"
              as="button"
              type="button"
              class="basis-[22%] rounded-sm bg-zinc-900 active:bg-zinc-800 text-rose-400 font-display text-sm tracking-[0.25em] uppercase border border-rose-900/60 transition disabled:opacity-30"
              :disabled="game.chips.value < game.bet.value"
              :while-tap="{ scale: 0.97 }"
              @click="game.double"
            >
              ×2
            </Motion>
          </div>

          <!-- desktop -->
          <div class="hidden sm:block leading-none shrink-0">
            <span class="text-[10px] uppercase tracking-[0.35em] text-stone-500 mb-1 block">
              bet
            </span>
            <div class="font-display text-4xl text-stone-200 tabular-nums leading-none">
              ${{ game.bet.value.toLocaleString() }}
            </div>
          </div>
          <div class="hidden sm:flex sm:items-center sm:gap-2">
            <Motion
              as="button"
              type="button"
              class="px-5 py-2.5 rounded-sm bg-stone-200 hover:bg-stone-100 text-stone-950 font-display text-base tracking-[0.3em] uppercase border border-stone-300 transition"
              :while-tap="{ scale: 0.97 }"
              @click="game.hit"
            >
              hit
            </Motion>
            <Motion
              as="button"
              type="button"
              class="px-5 py-2.5 rounded-sm bg-zinc-900 hover:bg-zinc-800 text-stone-300 font-display text-base tracking-[0.3em] uppercase border border-stone-800 transition"
              :while-tap="{ scale: 0.97 }"
              @click="game.stand"
            >
              stand
            </Motion>
            <Motion
              v-if="game.canDouble.value"
              as="button"
              type="button"
              class="px-5 py-2.5 rounded-sm bg-zinc-900 hover:bg-zinc-800 text-rose-400 font-display text-base tracking-[0.3em] uppercase border border-rose-900/60 transition disabled:opacity-30"
              :disabled="game.chips.value < game.bet.value"
              :while-tap="{ scale: 0.97 }"
              @click="game.double"
            >
              double
            </Motion>
          </div>
        </Motion>

        <!-- RESOLVED -->
        <Motion
          v-else-if="isResolved"
          key="resolved"
          as="div"
          class="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-6"
          :initial="{ opacity: 0, y: 8 }"
          :animate="{ opacity: 1, y: 0 }"
          :exit="{ opacity: 0, y: -8 }"
          :transition="{ duration: 0.18 }"
        >
          <div class="hidden sm:block leading-none shrink-0">
            <span class="text-[10px] uppercase tracking-[0.35em] text-stone-500 mb-1 block">
              bet
            </span>
            <div class="font-display text-4xl text-stone-200 tabular-nums leading-none">
              ${{ game.bet.value.toLocaleString() }}
            </div>
          </div>
          <Motion
            as="button"
            type="button"
            class="w-full sm:w-auto px-6 h-16 sm:h-auto sm:py-3 rounded-sm bg-stone-200 active:bg-stone-300 hover:bg-stone-100 text-stone-950 font-display text-xl sm:text-lg tracking-[0.4em] sm:tracking-[0.3em] uppercase border border-stone-300 transition"
            :while-tap="{ scale: 0.97 }"
            @click="replay"
          >
            again
          </Motion>
        </Motion>
      </AnimatePresence>
    </div>
  </div>
</template>
