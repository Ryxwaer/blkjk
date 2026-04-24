<script setup lang="ts">
import { Motion, AnimatePresence } from 'motion-v'

const props = defineProps<{ showOdds?: boolean }>()

const game = useBlackjack()
const odds = useOdds()

const chipDenoms = [25, 100, 500, 1000]
const chipDrawerOpen = ref(false)

function pct(n: number | undefined | null): string {
  if (n == null || Number.isNaN(n)) return '—'
  return `${Math.round(n * 100)}%`
}

function oddsClass(n: number | undefined | null): string {
  if (n == null || Number.isNaN(n)) return 'text-stone-500'
  if (n >= 0.55) return 'text-emerald-400'
  if (n >= 0.45) return 'text-stone-200'
  if (n >= 0.35) return 'text-amber-400'
  return 'text-rose-500'
}

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
  if (!canEditBet.value) return
  chipDrawerOpen.value = !chipDrawerOpen.value
}

function dealAndClose() {
  chipDrawerOpen.value = false
  game.deal()
}

watch(() => game.phase.value, (p) => {
  if (p === 'player' || p === 'dealing' || p === 'dealer') {
    chipDrawerOpen.value = false
  }
})

const isBetting = computed(() => game.phase.value === 'betting')
const isPlayer = computed(() => game.phase.value === 'player')
const isResolved = computed(() => game.phase.value === 'resolved')
const canEditBet = computed(() => isBetting.value || isResolved.value)
</script>

<template>
  <div
    class="relative z-20 shrink-0 px-4 sm:px-10 pt-2 pb-[calc(env(safe-area-inset-bottom)+2.5rem)] sm:pb-8"
  >
    <!-- ============================== -->
    <!-- MOBILE: floating, thumb-mapped -->
    <!-- ============================== -->
    <div class="sm:hidden mx-auto max-w-3xl">
      <AnimatePresence>
        <Motion
          v-if="canEditBet && chipDrawerOpen"
          key="chips-mobile"
          as="div"
          class="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2"
          :initial="{ opacity: 0, y: 12 }"
          :animate="{ opacity: 1, y: 0 }"
          :exit="{ opacity: 0, y: 8 }"
          :transition="{ type: 'spring', stiffness: 360, damping: 28 }"
        >
          <button
            v-for="amount in chipDenoms"
            :key="amount"
            type="button"
            class="font-display text-base tracking-wider text-stone-400 active:text-stone-100 transition py-1"
            @click="addChip(amount)"
          >
            +{{ amount }}
          </button>
          <div class="flex-1" />
          <button
            type="button"
            class="font-display text-xs uppercase tracking-[0.3em] text-stone-600 active:text-stone-300 transition py-1"
            @click="clearBet"
          >
            reset
          </button>
          <button
            type="button"
            class="font-display text-xs uppercase tracking-[0.3em] text-rose-800 active:text-rose-400 transition py-1"
            @click="maxBet"
          >
            all in
          </button>
        </Motion>
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <!-- BETTING -->
        <Motion
          v-if="isBetting"
          key="bet-m"
          as="div"
          class="flex items-end justify-between gap-6"
          :initial="{ opacity: 0, y: 8 }"
          :animate="{ opacity: 1, y: 0 }"
          :exit="{ opacity: 0, y: -8 }"
          :transition="{ duration: 0.18 }"
        >
          <button
            type="button"
            class="text-left leading-none active:opacity-60 transition"
            @click="toggleDrawer"
          >
            <span class="text-[9px] uppercase tracking-[0.35em] text-stone-600 leading-none block mb-1">
              bet
            </span>
            <Motion
              :key="game.bet.value"
              as="div"
              class="font-display text-4xl text-stone-300 tabular-nums leading-none"
              :initial="{ scale: 1.12 }"
              :animate="{ scale: 1 }"
              :transition="{ type: 'spring', stiffness: 400, damping: 18 }"
            >
              ${{ game.bet.value.toLocaleString() }}
            </Motion>
          </button>

          <Motion
            as="button"
            type="button"
            class="font-display text-5xl tracking-[0.4em] uppercase text-stone-100 active:text-stone-400 disabled:text-stone-700 disabled:opacity-50 transition py-2 pl-6 leading-none"
            :disabled="game.bet.value > game.chips.value"
            :while-tap="{ scale: 0.94 }"
            @click="dealAndClose"
          >
            deal
          </Motion>
        </Motion>

        <!-- PLAYER -->
        <Motion
          v-else-if="isPlayer"
          key="player-m"
          as="div"
          class="flex items-end justify-between gap-4"
          :initial="{ opacity: 0, y: 8 }"
          :animate="{ opacity: 1, y: 0 }"
          :exit="{ opacity: 0, y: -8 }"
          :transition="{ duration: 0.18 }"
        >
          <div v-if="game.canDouble.value" class="flex flex-col items-start gap-2 leading-none">
            <span
              v-if="props.showOdds"
              class="font-display text-xl tabular-nums leading-none"
              :class="oddsClass(odds?.double?.win)"
            >
              {{ pct(odds?.double?.win) }}
            </span>
            <Motion
              as="button"
              type="button"
              class="font-display text-base tracking-[0.3em] uppercase text-rose-800 active:text-rose-400 disabled:opacity-30 transition py-3 pr-2 leading-none"
              :disabled="game.chips.value < game.bet.value"
              :while-tap="{ scale: 0.94 }"
              @click="game.double"
            >
              ×2
            </Motion>
          </div>
          <span v-else class="w-2" />

          <div class="flex items-end gap-6">
            <div class="flex flex-col items-center gap-2 leading-none">
              <span
                v-if="props.showOdds"
                class="font-display text-2xl tabular-nums leading-none"
                :class="oddsClass(odds?.stand.win)"
              >
                {{ pct(odds?.stand.win) }}
              </span>
              <Motion
                as="button"
                type="button"
                class="font-display text-2xl tracking-[0.35em] uppercase text-stone-500 active:text-stone-200 transition py-2 leading-none"
                :while-tap="{ scale: 0.94 }"
                @click="game.stand"
              >
                stand
              </Motion>
            </div>

            <div class="flex flex-col items-end gap-2 leading-none">
              <span
                v-if="props.showOdds"
                class="font-display text-2xl tabular-nums leading-none"
                :class="oddsClass(odds?.hit.win)"
              >
                {{ pct(odds?.hit.win) }}
              </span>
              <Motion
                as="button"
                type="button"
                class="font-display text-5xl tracking-[0.4em] uppercase text-stone-100 active:text-stone-400 transition py-2 pl-2 leading-none"
                :while-tap="{ scale: 0.94 }"
                @click="game.hit"
              >
                hit
              </Motion>
            </div>
          </div>
        </Motion>

        <!-- RESOLVED — bet is now editable -->
        <Motion
          v-else-if="isResolved"
          key="resolved-m"
          as="div"
          class="flex items-end justify-between gap-6"
          :initial="{ opacity: 0, y: 8 }"
          :animate="{ opacity: 1, y: 0 }"
          :exit="{ opacity: 0, y: -8 }"
          :transition="{ duration: 0.18 }"
        >
          <button
            type="button"
            class="text-left leading-none active:opacity-60 transition"
            @click="toggleDrawer"
          >
            <span class="text-[9px] uppercase tracking-[0.35em] text-stone-600 leading-none block mb-1">
              bet
            </span>
            <Motion
              :key="game.bet.value"
              as="div"
              class="font-display text-4xl text-stone-300 tabular-nums leading-none"
              :initial="{ scale: 1.12 }"
              :animate="{ scale: 1 }"
              :transition="{ type: 'spring', stiffness: 400, damping: 18 }"
            >
              ${{ game.bet.value.toLocaleString() }}
            </Motion>
          </button>

          <Motion
            as="button"
            type="button"
            class="font-display text-5xl tracking-[0.4em] uppercase text-stone-100 active:text-stone-400 disabled:text-stone-700 disabled:opacity-50 transition py-2 pl-6 leading-none"
            :disabled="game.bet.value > game.chips.value"
            :while-tap="{ scale: 0.94 }"
            @click="dealAndClose"
          >
            again
          </Motion>
        </Motion>
      </AnimatePresence>
    </div>

    <!-- ============================== -->
    <!-- DESKTOP: dense control panel  -->
    <!-- ============================== -->
    <div class="hidden sm:block mx-auto max-w-5xl">
      <AnimatePresence mode="wait">
        <!-- BETTING / RESOLVED share the chip-row layout -->
        <Motion
          v-if="canEditBet"
          key="bet-d"
          as="div"
          class="flex items-end justify-between gap-10"
          :initial="{ opacity: 0, y: 8 }"
          :animate="{ opacity: 1, y: 0 }"
          :exit="{ opacity: 0, y: -8 }"
          :transition="{ duration: 0.18 }"
        >
          <!-- LEFT: bet + chip pills always visible -->
          <div class="flex items-end gap-8">
            <div class="leading-none">
              <span class="text-[10px] uppercase tracking-[0.4em] text-stone-600 leading-none block mb-2">
                bet
              </span>
              <Motion
                :key="game.bet.value"
                as="div"
                class="font-display text-5xl text-stone-200 tabular-nums leading-none"
                :initial="{ scale: 1.1 }"
                :animate="{ scale: 1 }"
                :transition="{ type: 'spring', stiffness: 380, damping: 20 }"
              >
                ${{ game.bet.value.toLocaleString() }}
              </Motion>
            </div>

            <div class="flex items-end gap-1">
              <button
                v-for="amount in chipDenoms"
                :key="amount"
                type="button"
                class="font-display text-sm tracking-[0.2em] uppercase text-stone-500 hover:text-stone-100 hover:-translate-y-0.5 transition px-3 py-2 leading-none"
                @click="addChip(amount)"
              >
                +{{ amount }}
              </button>
            </div>

            <div class="flex items-end gap-3 ml-2">
              <button
                type="button"
                class="font-display text-xs uppercase tracking-[0.3em] text-stone-600 hover:text-stone-300 transition py-2 leading-none"
                @click="clearBet"
              >
                reset
              </button>
              <button
                type="button"
                class="font-display text-xs uppercase tracking-[0.3em] text-rose-800 hover:text-rose-400 transition py-2 leading-none"
                @click="maxBet"
              >
                all in
              </button>
            </div>
          </div>

          <!-- RIGHT: primary action with keyboard hint -->
          <div class="flex items-end gap-6">
            <Motion
              as="button"
              type="button"
              class="group relative font-display text-4xl tracking-[0.4em] uppercase text-stone-100 hover:text-white disabled:text-stone-700 disabled:opacity-50 hover:-translate-y-0.5 transition py-2 leading-none"
              :disabled="game.bet.value > game.chips.value"
              :while-tap="{ scale: 0.96 }"
              @click="dealAndClose"
            >
              {{ isResolved ? 'again' : 'deal' }}
              <span class="absolute -bottom-4 right-0 text-[9px] tracking-[0.3em] text-stone-700 group-hover:text-stone-500 transition">
                space
              </span>
            </Motion>
          </div>
        </Motion>

        <!-- PLAYER actions -->
        <Motion
          v-else-if="isPlayer"
          key="player-d"
          as="div"
          class="flex items-end justify-between gap-10"
          :initial="{ opacity: 0, y: 8 }"
          :animate="{ opacity: 1, y: 0 }"
          :exit="{ opacity: 0, y: -8 }"
          :transition="{ duration: 0.18 }"
        >
          <!-- bet info (read-only mid-hand) -->
          <div class="leading-none">
            <span class="text-[10px] uppercase tracking-[0.4em] text-stone-600 leading-none block mb-2">
              bet
            </span>
            <div class="font-display text-5xl text-stone-300 tabular-nums leading-none">
              ${{ game.bet.value.toLocaleString() }}
            </div>
          </div>

          <div class="flex items-end gap-10">
            <div v-if="game.canDouble.value" class="flex flex-col items-center gap-3 leading-none">
              <Motion
                v-if="props.showOdds"
                :key="`d-${pct(odds?.double?.win)}`"
                as="div"
                class="font-display text-3xl tabular-nums leading-none"
                :class="oddsClass(odds?.double?.win)"
                :initial="{ opacity: 0.5 }"
                :animate="{ opacity: 1 }"
                :transition="{ duration: 0.2 }"
              >
                {{ pct(odds?.double?.win) }}
              </Motion>
              <Motion
                as="button"
                type="button"
                class="group relative font-display text-2xl tracking-[0.35em] uppercase text-rose-700 hover:text-rose-400 disabled:opacity-30 hover:-translate-y-0.5 transition py-2 leading-none"
                :disabled="game.chips.value < game.bet.value"
                :while-tap="{ scale: 0.96 }"
                @click="game.double"
              >
                ×2
                <span class="absolute -bottom-4 right-0 text-[9px] tracking-[0.3em] text-stone-700 group-hover:text-stone-500 transition">
                  3
                </span>
              </Motion>
            </div>

            <div class="flex flex-col items-center gap-3 leading-none">
              <Motion
                v-if="props.showOdds"
                :key="`s-${pct(odds?.stand.win)}`"
                as="div"
                class="font-display text-3xl tabular-nums leading-none"
                :class="oddsClass(odds?.stand.win)"
                :initial="{ opacity: 0.5 }"
                :animate="{ opacity: 1 }"
                :transition="{ duration: 0.2 }"
              >
                {{ pct(odds?.stand.win) }}
              </Motion>
              <Motion
                as="button"
                type="button"
                class="group relative font-display text-3xl tracking-[0.35em] uppercase text-stone-400 hover:text-stone-100 hover:-translate-y-0.5 transition py-2 leading-none"
                :while-tap="{ scale: 0.96 }"
                @click="game.stand"
              >
                stand
                <span class="absolute -bottom-4 right-0 text-[9px] tracking-[0.3em] text-stone-700 group-hover:text-stone-500 transition">
                  space
                </span>
              </Motion>
            </div>

            <div class="flex flex-col items-center gap-3 leading-none">
              <Motion
                v-if="props.showOdds"
                :key="`h-${pct(odds?.hit.win)}`"
                as="div"
                class="font-display text-3xl tabular-nums leading-none"
                :class="oddsClass(odds?.hit.win)"
                :initial="{ opacity: 0.5 }"
                :animate="{ opacity: 1 }"
                :transition="{ duration: 0.2 }"
              >
                {{ pct(odds?.hit.win) }}
              </Motion>
              <Motion
                as="button"
                type="button"
                class="group relative font-display text-4xl tracking-[0.4em] uppercase text-stone-100 hover:text-white hover:-translate-y-0.5 transition py-2 leading-none"
                :while-tap="{ scale: 0.96 }"
                @click="game.hit"
              >
                hit
                <span class="absolute -bottom-4 right-0 text-[9px] tracking-[0.3em] text-stone-700 group-hover:text-stone-500 transition">
                  1
                </span>
              </Motion>
            </div>
          </div>
        </Motion>
      </AnimatePresence>
    </div>
  </div>
</template>
