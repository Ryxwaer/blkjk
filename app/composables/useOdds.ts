import { computed } from 'vue'
import { cardValue, type Card, type Rank } from './useBlackjack'

const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

type DealerDist = Record<17 | 18 | 19 | 20 | 21 | 'bust', number>
type WPL = { win: number, push: number, lose: number }

function emptyDealer(): DealerDist {
  return { 17: 0, 18: 0, 19: 0, 20: 0, 21: 0, bust: 0 }
}

function rankProbs(cards: Card[]): Record<Rank, number> {
  const counts = {} as Record<Rank, number>
  for (const r of RANKS) counts[r] = 0
  for (const c of cards) counts[c.rank]++
  const n = cards.length
  const probs = {} as Record<Rank, number>
  for (const r of RANKS) probs[r] = n > 0 ? counts[r] / n : 0
  return probs
}

function applyCard(total: number, aces11: number, rank: Rank) {
  const v = cardValue(rank)
  let newTotal = total + v
  let newAces = aces11 + (rank === 'A' ? 1 : 0)
  while (newTotal > 21 && newAces > 0) {
    newTotal -= 10
    newAces -= 1
  }
  return { total: newTotal, aces11: newAces }
}

function handState(cards: Card[]) {
  let total = 0
  let aces = 0
  for (const c of cards) {
    if (c.hidden) continue
    total += cardValue(c.rank)
    if (c.rank === 'A') aces++
  }
  let aces11 = aces
  while (total > 21 && aces11 > 0) {
    total -= 10
    aces11--
  }
  return { total, aces11 }
}

// Dealer plays: stand on all 17s (S17). Memoised on (total | aces11).
function dealerOutcomes(
  total: number,
  aces11: number,
  p: Record<Rank, number>,
  memo: Map<string, DealerDist>
): DealerDist {
  if (total > 21) {
    const d = emptyDealer()
    d.bust = 1
    return d
  }
  if (total >= 17) {
    const d = emptyDealer()
    d[total as 17 | 18 | 19 | 20 | 21] = 1
    return d
  }
  const key = `${total}|${aces11}`
  const cached = memo.get(key)
  if (cached) return cached

  const out = emptyDealer()
  for (const r of RANKS) {
    const pr = p[r]
    if (pr === 0) continue
    const n = applyCard(total, aces11, r)
    const sub = dealerOutcomes(n.total, n.aces11, p, memo)
    out.bust += sub.bust * pr
    out[17] += sub[17] * pr
    out[18] += sub[18] * pr
    out[19] += sub[19] * pr
    out[20] += sub[20] * pr
    out[21] += sub[21] * pr
  }
  memo.set(key, out)
  return out
}

function standOutcome(playerTotal: number, dealer: DealerDist): WPL {
  let win = dealer.bust
  let push = 0
  let lose = 0
  for (const t of [17, 18, 19, 20, 21] as const) {
    if (playerTotal > t) win += dealer[t]
    else if (playerTotal === t) push += dealer[t]
    else lose += dealer[t]
  }
  return { win, push, lose }
}

// "If I hit, what happens?" — assumes optimal play after the hit (re-hit if EV is better than standing).
function hitOptimal(
  total: number,
  aces11: number,
  dealer: DealerDist,
  p: Record<Rank, number>,
  memo: Map<string, WPL>
): WPL {
  if (total > 21) return { win: 0, push: 0, lose: 1 }
  const key = `${total}|${aces11}`
  const cached = memo.get(key)
  if (cached) return cached

  const acc: WPL = { win: 0, push: 0, lose: 0 }
  for (const r of RANKS) {
    const pr = p[r]
    if (pr === 0) continue
    const n = applyCard(total, aces11, r)
    if (n.total > 21) {
      acc.lose += pr
      continue
    }
    const stand = standOutcome(n.total, dealer)
    if (n.total === 21) {
      acc.win += pr * stand.win
      acc.push += pr * stand.push
      acc.lose += pr * stand.lose
      continue
    }
    const hit = hitOptimal(n.total, n.aces11, dealer, p, memo)
    const standEv = stand.win - stand.lose
    const hitEv = hit.win - hit.lose
    const choose = hitEv > standEv ? hit : stand
    acc.win += pr * choose.win
    acc.push += pr * choose.push
    acc.lose += pr * choose.lose
  }
  memo.set(key, acc)
  return acc
}

// Double: take exactly one card, then forced stand.
function doubleOutcome(
  total: number,
  aces11: number,
  dealer: DealerDist,
  p: Record<Rank, number>
): WPL {
  const acc: WPL = { win: 0, push: 0, lose: 0 }
  for (const r of RANKS) {
    const pr = p[r]
    if (pr === 0) continue
    const n = applyCard(total, aces11, r)
    if (n.total > 21) {
      acc.lose += pr
      continue
    }
    const stand = standOutcome(n.total, dealer)
    acc.win += pr * stand.win
    acc.push += pr * stand.push
    acc.lose += pr * stand.lose
  }
  return acc
}

export interface OddsSnapshot {
  stand: WPL
  hit: WPL
  double: WPL | null
}

export const useOdds = () => {
  const game = useBlackjack()

  return computed<OddsSnapshot | null>(() => {
    if (game.phase.value !== 'player') return null
    if (game.player.value.length === 0) return null
    if (game.dealer.value.length === 0) return null

    const upcard = game.dealer.value.find(c => !c.hidden)
    if (!upcard) return null

    const probs = rankProbs(game.shoe.value)

    const dealerStart = upcard.rank === 'A'
      ? { total: 11, aces11: 1 }
      : { total: cardValue(upcard.rank), aces11: 0 }

    const dealerMemo = new Map<string, DealerDist>()
    const dDist = dealerOutcomes(dealerStart.total, dealerStart.aces11, probs, dealerMemo)

    const player = handState(game.player.value)

    const stand = standOutcome(player.total, dDist)
    const hitMemo = new Map<string, WPL>()
    const hit = hitOptimal(player.total, player.aces11, dDist, probs, hitMemo)
    const double = game.canDouble.value
      ? doubleOutcome(player.total, player.aces11, dDist, probs)
      : null

    return { stand, hit, double }
  })
}
