export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs'
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'

export interface Card {
  id: string
  suit: Suit
  rank: Rank
  hidden?: boolean
}

export type Phase = 'betting' | 'dealing' | 'player' | 'dealer' | 'resolved'
export type Outcome = 'win' | 'lose' | 'push' | 'blackjack' | 'bust' | null

const SUITS: Suit[] = ['spades', 'hearts', 'diamonds', 'clubs']
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

function buildShoe(decks = 6): Card[] {
  const shoe: Card[] = []
  for (let d = 0; d < decks; d++) {
    for (const s of SUITS) {
      for (const r of RANKS) {
        shoe.push({ id: `${d}-${s}-${r}-${Math.random().toString(36).slice(2, 8)}`, suit: s, rank: r })
      }
    }
  }
  return shuffle(shoe)
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

export function cardValue(rank: Rank): number {
  if (rank === 'A') return 11
  if (rank === 'J' || rank === 'Q' || rank === 'K') return 10
  return Number.parseInt(rank, 10)
}

export function handTotals(hand: Card[]): { soft: number, hard: number, best: number, isSoft: boolean } {
  let total = 0
  let aces = 0
  for (const c of hand) {
    if (c.hidden) continue
    total += cardValue(c.rank)
    if (c.rank === 'A') aces++
  }
  let soft = total
  while (soft > 21 && aces > 0) {
    soft -= 10
    aces--
  }
  const isSoft = aces > 0 && soft <= 21 && soft !== total - 10 * (hand.filter(c => c.rank === 'A' && !c.hidden).length)
  return { soft, hard: total, best: soft, isSoft }
}

const sleep = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms))

export const useBlackjack = () => {
  const shoe = useState<Card[]>('bj-shoe', () => buildShoe(6))
  const player = useState<Card[]>('bj-player', () => [])
  const dealer = useState<Card[]>('bj-dealer', () => [])
  const phase = useState<Phase>('bj-phase', () => 'betting')
  const bet = useState<number>('bj-bet', () => 100)
  const lastBet = useState<number>('bj-lastbet', () => 100)
  const chips = useState<number>('bj-chips', () => 10000)
  const outcome = useState<Outcome>('bj-outcome', () => null)
  const message = useState<string>('bj-message', () => '')
  const canDouble = useState<boolean>('bj-double', () => false)
  const handsPlayed = useState<number>('bj-hands', () => 0)
  const wins = useState<number>('bj-wins', () => 0)

  const playerTotal = computed(() => handTotals(player.value).best)
  const dealerTotal = computed(() => handTotals(dealer.value).best)
  const dealerVisibleTotal = computed(() => handTotals(dealer.value.filter(c => !c.hidden)).best)

  const SHOE_DECKS = 6
  const SHOE_SIZE = SHOE_DECKS * 52
  const RESHUFFLE_AT = 52

  function ensureShoe() {
    if (shoe.value.length < RESHUFFLE_AT) {
      shoe.value = buildShoe(SHOE_DECKS)
    }
  }

  const shoeRemaining = computed(() => shoe.value.length)
  const shoePenetration = computed(() => 1 - shoe.value.length / SHOE_SIZE)

  function draw(hidden = false): Card {
    ensureShoe()
    const c = shoe.value.shift()!
    return { ...c, hidden }
  }

  function adjustBet(delta: number) {
    if (phase.value !== 'betting' && phase.value !== 'resolved') return
    bet.value = Math.max(5, bet.value + delta)
    lastBet.value = bet.value
  }

  function setBet(value: number) {
    if (phase.value !== 'betting' && phase.value !== 'resolved') return
    bet.value = Math.max(5, Math.floor(value))
    lastBet.value = bet.value
  }

  async function deal() {
    if (phase.value !== 'betting' && phase.value !== 'resolved') return
    outcome.value = null
    message.value = ''
    player.value = []
    dealer.value = []
    phase.value = 'dealing'
    chips.value -= bet.value
    lastBet.value = bet.value

    await sleep(220)
    player.value = [draw()]
    await sleep(260)
    dealer.value = [draw()]
    await sleep(260)
    player.value = [...player.value, draw()]
    await sleep(260)
    dealer.value = [...dealer.value, draw(true)]
    await sleep(280)

    canDouble.value = chips.value >= bet.value
    phase.value = 'player'

    const pTotals = handTotals(player.value)
    if (pTotals.best === 21) {
      await stand()
    }
  }

  async function hit() {
    if (phase.value !== 'player') return
    player.value = [...player.value, draw()]
    canDouble.value = false
    const totals = handTotals(player.value)
    if (totals.best > 21) {
      await resolve('bust')
    } else if (totals.best === 21) {
      await stand()
    }
  }

  async function double() {
    if (phase.value !== 'player' || !canDouble.value) return
    if (chips.value < bet.value) return
    chips.value -= bet.value
    bet.value *= 2
    canDouble.value = false
    player.value = [...player.value, draw()]
    await sleep(200)
    const totals = handTotals(player.value)
    if (totals.best > 21) {
      await resolve('bust')
    } else {
      await stand()
    }
  }

  async function stand() {
    if (phase.value !== 'player') return
    phase.value = 'dealer'

    if (dealer.value[1]?.hidden) {
      const revealed = dealer.value.slice()
      revealed[1] = { ...revealed[1]!, hidden: false }
      dealer.value = revealed
      await sleep(420)
    }

    while (handTotals(dealer.value).best < 17) {
      await sleep(420)
      dealer.value = [...dealer.value, draw()]
    }

    await sleep(320)
    const pBest = handTotals(player.value).best
    const dBest = handTotals(dealer.value).best
    let result: Outcome = null
    if (dBest > 21) result = 'win'
    else if (pBest > dBest) result = 'win'
    else if (pBest < dBest) result = 'lose'
    else result = 'push'

    if (player.value.length === 2 && pBest === 21 && !(dealer.value.length === 2 && dBest === 21)) {
      result = 'blackjack'
    }
    await resolve(result)
  }

  async function resolve(result: Outcome) {
    outcome.value = result
    phase.value = 'resolved'
    handsPlayed.value++
    if (result === 'blackjack') {
      chips.value += Math.floor(bet.value * 2.5)
      message.value = 'blackjack'
      wins.value++
    } else if (result === 'win') {
      chips.value += bet.value * 2
      message.value = 'win'
      wins.value++
    } else if (result === 'push') {
      chips.value += bet.value
      message.value = 'push'
    } else if (result === 'bust') {
      message.value = 'bust'
    } else if (result === 'lose') {
      message.value = 'lose'
    }
    // Doubling only applies to the hand it was used on — restore the
    // visible bet to whatever was originally staked so the next hand
    // starts fresh.
    bet.value = lastBet.value
  }

  function nextRound() {
    if (phase.value !== 'resolved') return
    bet.value = lastBet.value
    phase.value = 'betting'
    outcome.value = null
    message.value = ''
    player.value = []
    dealer.value = []
  }

  return {
    shoe,
    player,
    dealer,
    phase,
    bet,
    lastBet,
    chips,
    outcome,
    message,
    canDouble,
    handsPlayed,
    wins,
    playerTotal,
    dealerTotal,
    dealerVisibleTotal,
    shoeRemaining,
    shoePenetration,
    adjustBet,
    setBet,
    deal,
    hit,
    stand,
    double,
    nextRound
  }
}
