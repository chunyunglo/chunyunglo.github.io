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
      const k = 0.5 // render the map at half resolution; the filter stretches it
      const W = Math.max(2, Math.round(w * k)); const H = Math.max(2, Math.round(h * k))
      const c = document.createElement('canvas'); c.width = W; c.height = H
      const ctx = c.getContext('2d'); const img = ctx.createImageData(W, H); const d = img.data
      const hx = w / 2; const hy = h / 2; const r = Math.min(radius, hx, hy)
      const sdf = (x, y) => {
        const qx = Math.abs(x - hx) - (hx - r); const qy = Math.abs(y - hy) - (hy - r)
        return Math.min(Math.max(qx, qy), 0) + Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) - r
      }
      for (let j = 0; j < H; j++) {
        for (let i = 0; i < W; i++) {
          const x = (i + 0.5) / k; const y = (j + 0.5) / k
          const dist = -sdf(x, y) // distance inside the edge
          let dx = 0; let dy = 0
          if (dist > 0 && dist < bezel) {
            const e = 0.75
            let nx = sdf(x - e, y) - sdf(x + e, y); let ny = sdf(x, y - e) - sdf(x, y + e) // inward normal
            const n = Math.hypot(nx, ny) || 1; nx /= n; ny /= n
            const t = 1 - dist / bezel // 0 where the flat middle starts, 1 at the rim
            const mag = Math.pow(t, 1.6) // convex bezel: bends hardest at the rim, none in the flat middle
            dx = nx * mag; dy = ny * mag
          }
          const o = (j * W + i) * 4
          d[o] = 128 + dx * 127; d[o + 1] = 128 + dy * 127; d[o + 2] = 128; d[o + 3] = 255
        }
      }
      ctx.putImageData(img, 0, 0)
      return c.toDataURL()
    }

    const setups = panels.map((el, n) => {
      const layer = document.createElement('span')
      layer.className = 'lg-refract'; layer.setAttribute('aria-hidden', 'true')
      layer.style.setProperty('--photo', url)
      el.prepend(layer)
      const id = `lg-glass-${n}`
      const f = document.createElementNS(NS, 'filter')
      f.setAttribute('id', id); f.setAttribute('x', '0'); f.setAttribute('y', '0')
      f.setAttribute('width', '100%'); f.setAttribute('height', '100%')
      f.setAttribute('color-interpolation-filters', 'sRGB')
      defs.append(f)
      layer.style.setProperty('--lg-filter', `url(#${id})`)
      return { el, layer, f }
    })

    const build = ({ el, f }) => {
      const w = el.offsetWidth; const h = el.offsetHeight
      if (!w || !h) return
      const bezel = Math.min(46, Math.min(w, h) * 0.16)
      const map = makeMap(w, h, 30, bezel)
      const s = bezel * 2.2 // max shift in px is scale / 2
      // Three passes with slightly different strengths give the red/green/blue fringe.
      f.innerHTML = `
        <feImage href="${map}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="none" result="map"/>
        <feDisplacementMap in="SourceGraphic" in2="map" scale="${s}" xChannelSelector="R" yChannelSelector="G" result="dr"/>
        <feDisplacementMap in="SourceGraphic" in2="map" scale="${s * 1.08}" xChannelSelector="R" yChannelSelector="G" result="dg"/>
        <feDisplacementMap in="SourceGraphic" in2="map" scale="${s * 1.16}" xChannelSelector="R" yChannelSelector="G" result="db"/>
        <feColorMatrix in="dr" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r"/>
        <feColorMatrix in="dg" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g"/>
        <feColorMatrix in="db" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b"/>
        <feBlend in="r" in2="g" mode="screen" result="rg"/>
        <feBlend in="rg" in2="b" mode="screen"/>`
    }

    // Keep the photo inside each card lined up with the fixed background behind it.
    let queued = false
    const align = () => {
      queued = false
      const W = window.innerWidth; const H = window.innerHeight
      const sc = Math.max(W / iw, H / ih); const bw = iw * sc; const bh = ih * sc
      const ox = (W - bw) / 2; const oy = (H - bh) / 2
      for (const { el, layer } of setups) {
        const r = el.getBoundingClientRect()
        layer.style.setProperty('--bgs', `${bw.toFixed(1)}px ${bh.toFixed(1)}px`)
        layer.style.setProperty('--bgp', `${(ox - r.left).toFixed(1)}px ${(oy - r.top).toFixed(1)}px`)
      }
    }
    const queue = () => { if (!queued) { queued = true; requestAnimationFrame(align) } }
    const rebuild = () => { setups.forEach(build); queue() }
    window.addEventListener('scroll', queue, { passive: true })
    new ResizeObserver(rebuild).observe(panels[0].parentElement)
    rebuild()

    // Specular light (and a slight tilt) follow the pointer.
    if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      for (const { el } of setups) {
        el.addEventListener('pointermove', (e) => {
          const r = el.getBoundingClientRect()
          const x = (e.clientX - r.left) / r.width; const y = (e.clientY - r.top) / r.height
          el.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`)
          el.style.setProperty('--my', `${(y * 100).toFixed(1)}%`)
          if (!reduceMotion) {
            el.style.setProperty('--rx', `${((x - 0.5) * 5).toFixed(2)}deg`)
            el.style.setProperty('--ry', `${((0.5 - y) * 5).toFixed(2)}deg`)
          }
          queue()
        })
        el.addEventListener('pointerleave', () => {
          el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); setTimeout(queue, 520)
        })
      }
    }
  }
}
