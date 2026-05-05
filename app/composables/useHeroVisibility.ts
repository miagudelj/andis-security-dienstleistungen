import { ref, computed, onScopeDispose } from 'vue'

const heroEl = ref<HTMLElement | null>(null)
// Wird von der Hero-Seite im setup() auf true gesetzt — sorgt dafür, dass SSR + erste Hydration
// bereits den "Top of Hero"-Zustand rendert (kein Aufblitzen von Sticky-Button + Nav-Farbwechsel).
const heroPresent = ref(false)
const scrollY = ref(0)

const heroVisibleRatio = computed(() => {
  if (!heroPresent.value) return 0
  if (!heroEl.value) return 1
  const h = heroEl.value.offsetHeight
  if (h === 0) return 1
  return Math.max(0, Math.min(1, 1 - scrollY.value / h))
})

const isHeroDominant = computed(() => heroVisibleRatio.value >= 0.75)
const isHeroPartiallyVisible = computed(() => heroVisibleRatio.value > 0.5)
// Echtes "ganz oben" — nur wahr bei nahezu Scroll-Position 0 (kleine Toleranz für iOS-Rubber-Band).
const isAtTop = computed(() => heroPresent.value && scrollY.value <= 5)

let consumers = 0
function onScroll() { scrollY.value = window.scrollY }

function attach() {
  if (!import.meta.client) return
  consumers++
  if (consumers === 1) {
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
  }
}
function detach() {
  if (!import.meta.client) return
  consumers--
  if (consumers <= 0) {
    window.removeEventListener('scroll', onScroll)
    consumers = 0
  }
}

export function useHeroVisibility() {
  attach()
  onScopeDispose(detach)
  return {
    heroEl,
    heroPresent,
    heroVisibleRatio,
    isHeroDominant,
    isHeroPartiallyVisible,
    isAtTop,
  }
}
