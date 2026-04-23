<script setup lang="ts">
import { Motion, useMotionValue, useTransform, useSpring } from 'motion-v'
import type { Card } from '~/composables/useBlackjack'

const props = defineProps<{
  card: Card
  index: number
}>()

const isRed = computed(() => props.card.suit === 'hearts' || props.card.suit === 'diamonds')

const suitGlyph = computed(() => {
  switch (props.card.suit) {
    case 'spades': return '\u2660'
    case 'hearts': return '\u2665'
    case 'diamonds': return '\u2666'
    case 'clubs': return '\u2663'
  }
})

const fanRotate = computed(() => (props.index - 1) * 2.5)
const slotStyle = computed(() => ({
  left: `calc(${props.index} * var(--card-off))`,
  transformOrigin: 'bottom center'
}))

// Drag motion values feed a smoothed Balatro-ish tilt
const dragX = useMotionValue(0)
const dragY = useMotionValue(0)
const tiltZ = useTransform(dragX, [-220, 220], [-18, 18])
const tiltX = useTransform(dragY, [-200, 200], [12, -12])
const tiltY = useTransform(dragX, [-220, 220], [-12, 12])
const smoothZ = useSpring(tiltZ, { stiffness: 220, damping: 18, mass: 0.4 })
const smoothTX = useSpring(tiltX, { stiffness: 220, damping: 18, mass: 0.4 })
const smoothTY = useSpring(tiltY, { stiffness: 220, damping: 18, mass: 0.4 })
</script>

<template>
  <Motion
    as="div"
    class="card-slot absolute top-0 hover:z-50"
    :style="slotStyle"
    :initial="{ opacity: 0, y: -160, x: -120, rotate: -25, scale: 0.8 }"
    :animate="{ opacity: 1, y: 0, x: 0, rotate: fanRotate, scale: 1 }"
    :exit="{ opacity: 0, y: 220, scale: 0.55, rotate: 30 }"
    :transition="{ type: 'spring', stiffness: 280, damping: 22, mass: 0.9, delay: index * 0.04 }"
  >
    <Motion
      as="div"
      class="card-frame relative cursor-grab active:cursor-grabbing touch-none"
      :style="{ x: dragX, y: dragY, width: 'var(--card-w)', height: 'var(--card-h)' }"
      drag
      :drag-snap-to-origin="true"
      :drag-elastic="0.45"
      :drag-momentum="false"
      :drag-transition="{ bounceStiffness: 320, bounceDamping: 22 }"
    >
      <div
        class="card-hover-target absolute inset-0"
        :style="{ perspective: '900px' }"
      >
        <Motion
          as="div"
          class="absolute inset-0 rounded-md pointer-events-none"
          :style="{
            transformStyle: 'preserve-3d',
            rotateX: smoothTX,
            rotateY: smoothTY,
            rotateZ: smoothZ
          }"
        >
          <Motion
            as="div"
            class="absolute inset-0 rounded-md"
            :style="{ transformStyle: 'preserve-3d' }"
            :initial="{ rotateY: 180 }"
            :animate="{ rotateY: card.hidden ? 180 : 0 }"
            :transition="{ duration: 0.55, ease: [0.6, 0.05, 0.2, 1] }"
          >
            <!-- Front -->
            <div
              class="card-face absolute inset-0 rounded-md overflow-hidden"
              :style="{ backfaceVisibility: 'hidden' }"
            >
              <div
                class="absolute top-1.5 left-2 leading-none text-left"
                :class="isRed ? 'suit-red' : 'suit-black'"
              >
                <div class="font-display text-xl leading-none">
                  {{ card.rank }}
                </div>
                <div class="text-xs leading-none mt-0.5">
                  {{ suitGlyph }}
                </div>
              </div>

              <div
                class="absolute inset-0 flex items-center justify-center font-display text-4xl"
                :class="isRed ? 'suit-red' : 'suit-black'"
              >
                {{ suitGlyph }}
              </div>

              <div
                class="absolute bottom-1.5 right-2 leading-none text-right rotate-180"
                :class="isRed ? 'suit-red' : 'suit-black'"
              >
                <div class="font-display text-xl leading-none">
                  {{ card.rank }}
                </div>
                <div class="text-xs leading-none mt-0.5">
                  {{ suitGlyph }}
                </div>
              </div>

              <div
                aria-hidden
                class="pointer-events-none absolute inset-0 rounded-md mix-blend-overlay opacity-30"
                style="background-image: repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0px, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 3px);"
              />
            </div>

            <!-- Back -->
            <div
              class="card-back absolute inset-0 rounded-md flex items-center justify-center"
              :style="{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }"
            >
              <div class="font-display text-4xl text-rose-500/90 tracking-widest">
                ✶
              </div>
            </div>
          </Motion>
        </Motion>
      </div>
    </Motion>
  </Motion>
</template>

<style scoped>
.card-hover-target {
  transform: scale(1);
  transition: transform 180ms cubic-bezier(0.34, 1.56, 0.64, 1);
  will-change: transform;
}

@media (hover: hover) and (pointer: fine) {
  .card-slot:hover .card-hover-target {
    transform: scale(1.12);
  }
  .card-slot:active .card-hover-target {
    transform: scale(1.16);
  }
}
</style>
