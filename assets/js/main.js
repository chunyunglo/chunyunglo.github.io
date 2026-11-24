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
    setTimeout(tick, 4500)
  }
}

// Fade sections in as they scroll into view.
const reveals = document.querySelectorAll('.reveal, .stagger, .jg-item')
if ('IntersectionObserver' in window && !reduceMotion) {
  const io = new IntersectionObserver((entries) => {
    // Items that arrive together enter one after another, in reading order.
    let n = 0
    entries.forEach((e) => {
      if (!e.isIntersecting) return
      if (!e.target.classList.contains('reveal')) e.target.style.setProperty('--i', Math.min(n++, 6))
      e.target.classList.add('visible'); io.unobserve(e.target)
    })
  }, { threshold: 0.01, rootMargin: '0px 0px -4% 0px' })
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

// Album lightbox: click a photo to view it large; arrows, swipe and Escape work too.
{
  const box = document.querySelector('.lightbox')
  const links = [...document.querySelectorAll('.photo-grid .photo, .jg .photo')]
  if (box && links.length && typeof box.showModal === 'function') {
    const img = box.querySelector('img')
    const cap = box.querySelector('figcaption')
    let at = 0
    const show = (i) => {
      at = (i + links.length) % links.length
      const a = links[at]
      img.src = a.dataset.full
      img.alt = a.querySelector('img').alt
      cap.textContent = a.dataset.caption || ''
      const count = box.querySelector('.lb-count'); if (count) count.textContent = `${at + 1} / ${links.length}`
      // Warm up the neighbours so paging feels instant.
      ;[at - 1, at + 1].forEach((j) => { const n = links[(j + links.length) % links.length]; if (n) new Image().src = n.dataset.full })
    }
    links.forEach((a, i) => a.addEventListener('click', (e) => { e.preventDefault(); show(i); box.showModal() }))
    box.querySelector('.lb-close').addEventListener('click', () => box.close())
    box.querySelector('.lb-prev').addEventListener('click', () => show(at - 1))
    box.querySelector('.lb-next').addEventListener('click', () => show(at + 1))
    box.addEventListener('click', (e) => { if (e.target === box || e.target.tagName === 'FIGURE') box.close() })
    box.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') show(at - 1)
      if (e.key === 'ArrowRight') show(at + 1)
    })
    let x0 = null
    box.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX }, { passive: true })
    box.addEventListener('touchend', (e) => {
      if (x0 === null) return
      const dx = e.changedTouches[0].clientX - x0
      if (Math.abs(dx) > 40) show(at + (dx < 0 ? 1 : -1))
      x0 = null
    })
    box.addEventListener('close', () => links[at].focus())
  }
}

// Hero name: split into letters so they can arrive one by one (see .ch in the CSS).
{
  const h1 = document.querySelector('.hero h1')
  const text = h1 && h1.firstChild
  if (text && text.nodeType === 3 && !reduceMotion) {
    const frag = document.createDocumentFragment()
    const label = text.textContent
    // Words stay unbroken and keep their spaces; each letter inside animates on its own.
    let i = 0
    label.split(/(\s+)/).forEach((part) => {
      if (!part) return
      if (/^\s+$/.test(part)) { frag.append(document.createTextNode(' ')); return }
      const w = document.createElement('span')
      w.className = 'word'; w.setAttribute('aria-hidden', 'true')
      ;[...part].forEach((c) => {
        const s = document.createElement('span')
        s.className = 'ch'; s.textContent = c; s.style.setProperty('--c', i++)
        w.append(s)
      })
      frag.append(w)
    })
    const sr = document.createElement('span')
    sr.className = 'visually-hidden'; sr.textContent = label
    sr.style.cssText = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap'
    frag.append(sr)
    text.replaceWith(frag)
  }
}

// Cards that tilt towards the pointer.
if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.querySelectorAll('.tilt').forEach((card) => {
    let raf = 0
    card.addEventListener('pointermove', (e) => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        const r = card.getBoundingClientRect()
        const x = (e.clientX - r.left) / r.width; const y = (e.clientY - r.top) / r.height
        card.classList.add('tilting')
        card.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 5}deg) rotateY(${(x - 0.5) * 6}deg) translateY(-3px)`
        card.style.setProperty('--mx', x * 100 + '%'); card.style.setProperty('--my', y * 100 + '%')
      })
    })
    card.addEventListener('pointerleave', () => {
      cancelAnimationFrame(raf)
      card.classList.remove('tilting'); card.style.transform = ''
    })
  })
}

// Scroll-linked effects: the reading progress bar and the experience timeline's line.
{
  const lines = [...document.querySelectorAll('.timeline.draw-line')]
  const heroPhoto = document.querySelector('.hero-photo')
  const bar = document.createElement('div')
  if (bar) { bar.className = 'progress'; bar.setAttribute('aria-hidden', 'true'); document.body.append(bar) }
  let queued = false
  const update = () => {
    queued = false
    const max = document.documentElement.scrollHeight - innerHeight
    if (bar) bar.style.setProperty('--p', max > 0 ? Math.min(1, scrollY / max).toFixed(4) : 0)
    if (reduceMotion) return
    if (heroPhoto) {
      const r = heroPhoto.parentNode.getBoundingClientRect()
      if (r.bottom > 0) heroPhoto.style.setProperty('--hy', (-7.5 - Math.min(1, Math.max(-1, (innerHeight / 2 - (r.top + r.height / 2)) / innerHeight)) * 7).toFixed(2) + '%')
    }
    const mark = innerHeight * 0.7
    lines.forEach((ol) => {
      const r = ol.getBoundingClientRect()
      ol.style.setProperty('--tl', Math.min(1, Math.max(0, (mark - r.top) / r.height)).toFixed(4))
      ol.querySelectorAll('.timeline-item').forEach((li) => li.classList.toggle('reached', li.getBoundingClientRect().top + 30 < mark))
    })
  }
  const onScroll = () => { if (!queued) { queued = true; requestAnimationFrame(update) } }
  window.addEventListener('scroll', onScroll, { passive: true })
  window.addEventListener('resize', onScroll)
  update()
}

// Highlight the navigation link for the section currently being read, and show a back-to-top
// button once the visitor has scrolled well past the first screen.
{
  const links = [...document.querySelectorAll('.site-nav a[href*="#"]')]
  const targets = links.map((a) => document.getElementById(a.hash.slice(1))).filter(Boolean)
  if (document.body.classList.contains('is-home') && targets.length && 'IntersectionObserver' in window) {
    const visible = new Map()
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((e) => visible.set(e.target.id, e.isIntersecting))
      const current = targets.find((t) => visible.get(t.id))
      links.forEach((a) => a.classList.toggle('is-active', !!current && a.hash === '#' + current.id))
    }, { rootMargin: '-45% 0px -50% 0px' })
    targets.forEach((t) => spy.observe(t))
  }
  const top = document.createElement('button')
  top.type = 'button'; top.className = 'to-top'
  top.setAttribute('aria-label', document.documentElement.lang.startsWith('zh') ? '回到頂端' : 'Back to top')
  top.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 15l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  top.addEventListener('click', () => { window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }) })
  document.body.append(top)
  let shown = false
  const check = () => { const s = scrollY > innerHeight * 1.2; if (s !== shown) { shown = s; top.classList.toggle('show', s) } }
  window.addEventListener('scroll', check, { passive: true }); check()
}
