import seedrandom from 'seedrandom'

export type RNG = seedrandom.PRNG

export const buildSeed = (seed: string | undefined, now: Date) =>
  seed ? `${seed}-${now.toISOString()}` : now.toISOString()

export const makeRng = (seed: string) => seedrandom(seed)

export const pickRandom = <T>(items: T[], rng: RNG): T => {
  if (!items.length) throw new Error('Cannot pick from empty list')
  const idx = Math.floor(rng() * items.length)
  return items[idx]!
}

export const chance = (probability: number, rng: RNG) => rng() < probability

export const randInt = (min: number, max: number, rng: RNG) => {
  const lo = Math.ceil(min)
  const hi = Math.floor(max)
  return Math.floor(rng() * (hi - lo + 1)) + lo
}

export const sampleWithoutReplacement = <T>(items: T[], n: number, rng: RNG): T[] => {
  const pool = [...items]
  const result: T[] = []
  const target = Math.min(n, pool.length)
  for (let i = 0; i < target; i += 1) {
    const idx = Math.floor(rng() * pool.length)
    result.push(pool[idx]!)
    pool.splice(idx, 1)
  }
  return result
}
