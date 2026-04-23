<script setup lang="ts">
import { AnimatePresence } from 'motion-v'
import type { Card } from '~/composables/useBlackjack'

const props = defineProps<{
  cards: Card[]
  total: number
  showTotal: boolean
  highlight?: 'win' | 'lose' | 'push' | null
}>()

const totalColor = computed(() => {
  if (props.highlight === 'win') return 'text-emerald-400'
  if (props.highlight === 'lose') return 'text-rose-500'
  if (props.highlight === 'push') return 'text-amber-300'
  if (props.total > 21) return 'text-rose-500'
  if (props.total === 21) return 'text-emerald-400'
  return 'text-stone-300'
})

const handStyle = computed(() => {
  const n = Math.max(0, props.cards.length - 1)
  return {
    width: `calc(var(--card-w) + ${n} * var(--card-off))`,
    height: 'var(--card-h)',
    minWidth: 'var(--card-w)'
  }
})
</script>

<template>
  <div class="flex flex-col items-center gap-2 sm:gap-3">
    <div class="h-5 sm:h-6 flex items-center">
      <span
        v-if="showTotal && cards.length > 0"
        class="font-display text-xl sm:text-2xl tabular-nums leading-none"
        :class="totalColor"
      >
        {{ total }}
      </span>
      <span
        v-else-if="cards.length > 0"
        class="font-display text-xl sm:text-2xl text-stone-700 leading-none"
      >
        ?
      </span>
    </div>

    <div
      class="relative transition-[width] duration-300"
      :style="handStyle"
    >
      <AnimatePresence>
        <PlayingCard
          v-for="(card, i) in cards"
          :key="card.id"
          :card="card"
          :index="i"
        />
      </AnimatePresence>
    </div>
  </div>
</template>
