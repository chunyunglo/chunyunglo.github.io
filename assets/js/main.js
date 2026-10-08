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

// Liquid glass on the two home cards (see the CSS comment for the method).
{
  const photo = document.querySelector('.hero-bg')
  const panels = [...document.querySelectorAll('.hero .panel')]
  if (photo && panels.length) {
    const NS = 'http://www.w3.org/2000/svg'
    const defs = document.createElementNS(NS, 'svg')
    defs.setAttribute('width', '0'); defs.setAttribute('height', '0'); defs.setAttribute('aria-hidden', 'true')
    defs.style.position = 'absolute'
    document.body.append(defs)
    const iw = Number(photo.dataset.w) || 1920
    const ih = Number(photo.dataset.h) || 1440
    const url = `url("${photo.currentSrc || photo.src}")`

    // Displacement map for a rounded slab: neutral (no shift) in the flat middle; inside the
    // bezel each pixel samples further inward along the surface normal, following a convex
    // squircle profile, so the photo is compressed and bent at the edges like thick glass.
    const makeMap = (w, h, radius, bezel) => {
      const k = 1 // full-resolution map keeps the bent edge smooth
      const W = Math.max(2, Math.round(w * k)); const H = Math.max(2, Math.round(h * k))
      const c = document.createElement('canvas'); c.width = W; c.height = H
      const ctx = c.getContext('2d'); const img = ctx.createImageData(W, H); const d = img.data
      const hx = w / 2; const hy = h / 2; const r = Math.min(radius, hx, hy)
      const sdf = (x, y) => {
        const qx = Math.abs(x - hx) - (hx - r); const qy = Math.abs(y - hy) - (hy - r)
        return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - r
      }
      const rn = Math.min(Math.max(r, bezel * 1.6), hx, hy) // rounder shape for the normals avoids creases along the diagonals
      const sdfN = (x, y) => {
        const qx = Math.abs(x - hx) - (hx - rn); const qy = Math.abs(y - hy) - (hy - rn)
        return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - rn
      }
      for (let j = 0; j < H; j++) {
        for (let i = 0; i < W; i++) {
          const x = (i + 0.5) / k; const y = (j + 0.5) / k
          const dist = -sdf(x, y) // distance inside the edge
          let dx = 0; let dy = 0
          if (dist > 0 && dist < bezel) {
            const e = 0.75
            let nx = sdfN(x - e, y) - sdfN(x + e, y); let ny = sdfN(x, y - e) - sdfN(x, y + e) // inward normal (smoothed)
            const n = Math.hypot(nx, ny) || 1; nx /= n; ny /= n
            const t = 1 - dist / bezel // 0 where the flat middle starts, 1 at the rim
            // Smootherstep profile: zero slope and curvature where the flat middle begins, so there is no visible seam.
            const mag = t * t * t * (t * (t * 6 - 15) + 10)
            dx = nx * mag; dy = ny * mag
          }
          const o = (j * W + i) * 4
          d[o] = 128 + dx * 127; d[o + 1] = 128 + dy * 127; d[o + 2] = 128; d[o + 3] = 255
        }
      }
      ctx.putImageData(img, 0, 0)
      return c
    }

    // Each card gets a plain photo layer for the clear middle, plus four thin strips along the
    // rim that carry the refraction filter. Filtering only the rim keeps the per-frame work small
    // (an SVG filter over the whole card was what made scrolling stutter on Retina screens).
    const mkLayer = (cls) => {
      const l = document.createElement('span')
      l.className = cls; l.setAttribute('aria-hidden', 'true')
      l.style.setProperty('--photo', url)
      return l
    }
    let fid = 0
    const setups = panels.map((el) => {
      const base = mkLayer('lg-refract')
      const strips = ['top', 'bottom', 'left', 'right'].map((side) => {
        const l = mkLayer('lg-refract lg-rim')
        const f = document.createElementNS(NS, 'filter')
        const id = `lg-rim-${fid++}`
        f.setAttribute('id', id); f.setAttribute('x', '0'); f.setAttribute('y', '0')
        f.setAttribute('width', '100%'); f.setAttribute('height', '100%')
        f.setAttribute('color-interpolation-filters', 'sRGB')
        defs.append(f)
        l.style.setProperty('--lg-filter', `url(#${id})`)
        return { side, l, f, x: 0, y: 0 }
      })
      el.prepend(base, ...strips.map((s) => s.l))
      return { el, base, strips }
    })

    const build = ({ el, strips }) => {
      const w = el.offsetWidth; const h = el.offsetHeight
      if (!w || !h) return
      const bezel = Math.min(22, Math.min(w, h) * 0.06)
      const s = bezel // max inward shift is scale / 2; with this profile the image never folds
      const map = makeMap(w, h, 30, bezel) // full-card map, cut into the four strips below
      const band = Math.ceil(bezel * 1.6) // a little extra so corner samples stay inside the strip
      for (const st of strips) {
        const r = st.side === 'top' ? [0, 0, w, band]
          : st.side === 'bottom' ? [0, h - band, w, band]
            : st.side === 'left' ? [0, band, band, h - 2 * band]
              : [w - band, band, band, h - 2 * band]
        ;[st.x, st.y] = r
        Object.assign(st.l.style, { left: `${r[0]}px`, top: `${r[1]}px`, width: `${r[2]}px`, height: `${r[3]}px` })
        const c = document.createElement('canvas'); c.width = r[2]; c.height = r[3]
        c.getContext('2d').drawImage(map, r[0], r[1], r[2], r[3], 0, 0, r[2], r[3])
        st.f.innerHTML = `
          <feImage href="${c.toDataURL()}" x="0" y="0" width="${r[2]}" height="${r[3]}" preserveAspectRatio="none" result="map"/>
          <feDisplacementMap in="SourceGraphic" in2="map" scale="${s}" xChannelSelector="R" yChannelSelector="G"/>`
      }
    }

    // Keep the photo inside each card lined up with the fixed background behind it.
    let queued = false
    const align = () => {
      queued = false
      const W = window.innerWidth; const H = window.innerHeight
      const sc = Math.max(W / iw, H / ih); const bw = iw * sc; const bh = ih * sc
      const ox = (W - bw) / 2; const oy = (H - bh) / 2
      const size = `${bw.toFixed(1)}px ${bh.toFixed(1)}px`
      for (const { el, base, strips } of setups) {
        const r = el.getBoundingClientRect()
        base.style.setProperty('--bgs', size)
        base.style.setProperty('--bgp', `${(ox - r.left).toFixed(1)}px ${(oy - r.top).toFixed(1)}px`)
        for (const st of strips) {
          st.l.style.setProperty('--bgs', size)
          st.l.style.setProperty('--bgp', `${(ox - r.left - st.x).toFixed(1)}px ${(oy - r.top - st.y).toFixed(1)}px`)
        }
      }
    }
    // Touch devices ignore background-attachment: fixed, so there the script keeps it aligned.
    const needsAlign = !window.matchMedia('(hover: hover)').matches
    const queue = () => { if (needsAlign && !queued) { queued = true; requestAnimationFrame(align) } }
    const rebuild = () => { setups.forEach(build); queue() }
    let heroVisible = true
    new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting }).observe(photo.closest('.hero'))
    window.addEventListener('scroll', () => { if (heroVisible) queue() }, { passive: true })
    new ResizeObserver(rebuild).observe(panels[0].parentElement)
    rebuild()

  }
}
