const root = document.documentElement
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Theme toggle: cycles light/dark and remembers the choice.
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')
const current = () =>
  root.dataset.theme === 'auto' ? (prefersDark.matches ? 'dark' : 'light') : root.dataset.theme
document.querySelector('.theme-toggle')?.addEventListener('click', () => {
  const next = current() === 'dark' ? 'light' : 'dark'
  root.dataset.theme = next
  try { localStorage.setItem('theme', next) } catch (e) {}
})

// Navigation: collapse into a menu as soon as the links would wrap or overflow.
const header = document.querySelector('.site-header')
const toggle = document.querySelector('.nav-toggle')
const nav = document.getElementById('site-nav')
if (header && toggle && nav) {
  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open))
    nav.classList.toggle('open', open)
    header.classList.toggle('menu-open', open)
  }
  const fit = () => {
    header.classList.remove('compact')
    const list = nav.querySelector('ul')
    const links = [...list.querySelectorAll('a')]
    const brand = header.querySelector('.brand')
    const oneLine = links.every((a) => a.offsetTop === links[0].offsetTop && a.getClientRects().length === 1) &&
      (!brand || brand.getClientRects().length === 1)
    const inner = header.querySelector('.header-inner')
    const overflow = inner.scrollWidth > inner.clientWidth + 1
    if (!oneLine || overflow) header.classList.add('compact')
    else setOpen(false)
  }
  new ResizeObserver(fit).observe(header)
  document.fonts?.ready.then(fit)
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'))
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false) })
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || toggle.getAttribute('aria-expanded') !== 'true') return
    const inNav = nav.contains(document.activeElement)
    setOpen(false)
    if (inNav) toggle.focus()
  })
  document.addEventListener('click', (e) => {
    if (nav.classList.contains('open') && !header.contains(e.target)) setOpen(false)
  })

  // Transparent header only while the home page is scrolled to the very top.
  if (document.body.classList.contains('is-home') && document.querySelector('.hero')) {
    const update = () => header.classList.toggle('over-hero', window.scrollY < 24)
    update()
    window.addEventListener('scroll', update, { passive: true })
  }
}

// Typing carousel for the summary lines.
const typed = document.querySelector('.typed')
if (typed && !reduceMotion) {
  let strings = []
  try { strings = JSON.parse(typed.dataset.strings) } catch (e) {}
  if (strings.length > 1) {
    let i = 0
    let n = strings[0].length
    let deleting = true
    let cycles = 0
    const tick = () => {
      const s = strings[i]
      if (cycles >= 2 && i === 0 && !deleting && n === s.length) { typed.textContent = s; return }
      typed.textContent = s.slice(0, n)
      let delay = deleting ? 25 : 55
      if (!deleting && n === s.length) { deleting = true; delay = 2200 }
      else if (deleting && n === 0) { deleting = false; i = (i + 1) % strings.length; if (i === 0) cycles++; delay = 350 }
      else n += deleting ? -1 : 1
      setTimeout(tick, delay)
    }
    setTimeout(tick, 2500)
  }
}

// Fade sections in as they scroll into view.
const reveals = document.querySelectorAll('.reveal')
if ('IntersectionObserver' in window && !reduceMotion) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target) } })
  }, { threshold: 0.08 })
  reveals.forEach((el) => io.observe(el))
} else {
  reveals.forEach((el) => el.classList.add('visible'))
}

// Project filter on the home page.
document.querySelectorAll('[data-filter-group]').forEach((group) => {
  const items = document.querySelectorAll(group.dataset.filterGroup)
  group.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-filter]')
    if (!btn) return
    group.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === btn)))
    const f = btn.dataset.filter
    items.forEach((el) => { el.hidden = f !== 'all' && !el.dataset.tags.split(' ').includes(f) })
  })
})

// Liquid glass: light and a slight tilt follow the pointer; on touch screens the light follows scrolling.
const glass = [...document.querySelectorAll('[data-glass]')]
if (glass.length) {
  if (navigator.userAgentData?.brands?.some((b) => /Chromium/.test(b.brand))) root.classList.add('lens')
  const set = (el, x, y, tilt) => {
    el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`)
    el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`)
    el.style.setProperty('--la', `${(Math.atan2(y - 0.5, x - 0.5) * 180 / Math.PI + 90).toFixed(1)}deg`)
    el.style.setProperty('--rx', `${tilt ? ((x - 0.5) * 6).toFixed(2) : 0}deg`)
    el.style.setProperty('--ry', `${tilt ? ((0.5 - y) * 6).toFixed(2) : 0}deg`)
  }
  const fromScroll = () => {
    const vh = window.innerHeight
    glass.forEach((el) => {
      const r = el.getBoundingClientRect()
      const t = Math.min(Math.max((r.top + r.height / 2) / vh, 0), 1)
      set(el, 0.2 + 0.6 * t, 1 - t, false)
    })
  }
  let raf = 0
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches
  if (finePointer) {
    glass.forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        cancelAnimationFrame(raf)
        raf = requestAnimationFrame(() => {
          const r = el.getBoundingClientRect()
          set(el, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height, !reduceMotion)
        })
      })
      el.addEventListener('pointerleave', () => fromScroll())
    })
  }
  window.addEventListener('scroll', () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(fromScroll) }, { passive: true })
  fromScroll()
}

// The same pointer light on every glass card across the site (no tilt).
if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll('.card, .timeline-item, .post-card, .glass-panel').forEach((el) => {
    let f = 0
    el.addEventListener('pointermove', (e) => {
      cancelAnimationFrame(f)
      f = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect()
        const x = (e.clientX - r.left) / r.width
        const y = (e.clientY - r.top) / r.height
        el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`)
        el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`)
        el.style.setProperty('--la', `${(Math.atan2(y - 0.5, x - 0.5) * 180 / Math.PI + 90).toFixed(1)}deg`)
      })
    })
  })
}
