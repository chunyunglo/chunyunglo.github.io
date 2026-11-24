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
const reveals = document.querySelectorAll('.reveal, .stagger')
if ('IntersectionObserver' in window && !reduceMotion) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target) } })
  }, { threshold: 0.08, rootMargin: '0px 0px -6% 0px' })
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

    // Keep the photo inside each card lined up with the background behind it.
    // Desktop: the background is fixed and CSS (background-attachment: fixed) does the work.
    // Touch screens ignore that, and realigning from script on every scroll frame re-ran the
    // refraction filter each frame, which made phones stutter. There the background scrolls with
    // the hero instead, so the alignment (and the filtered rim) is computed once per resize.
    const hero = photo.closest('.hero')
    const align = () => {
      const box = hero.getBoundingClientRect()
      const W = box.width; const H = box.height
      const sc = Math.max(W / iw, H / ih); const bw = iw * sc; const bh = ih * sc
      const ox = (W - bw) / 2; const oy = (H - bh) / 2
      const size = `${bw.toFixed(1)}px ${bh.toFixed(1)}px`
      for (const { el, base, strips } of setups) {
        const r = el.getBoundingClientRect()
        const x = r.left - box.left; const y = r.top - box.top
        base.style.setProperty('--bgs', size)
        base.style.setProperty('--bgp', `${(ox - x).toFixed(1)}px ${(oy - y).toFixed(1)}px`)
        for (const st of strips) {
          st.l.style.setProperty('--bgs', size)
          st.l.style.setProperty('--bgp', `${(ox - x - st.x).toFixed(1)}px ${(oy - y - st.y).toFixed(1)}px`)
        }
      }
    }
    const needsAlign = !window.matchMedia('(hover: hover)').matches
    const rebuild = () => { setups.forEach(build); if (needsAlign) align() }
    new ResizeObserver(rebuild).observe(hero)
    rebuild()

  }
}

// Exhibition corridor: the photos hang on the walls of a 3D hallway, and scrolling walks the
// visitor down it. Each work swings out from the wall as the visitor reaches it; the far wall
// holds a lit doorway to the next exhibition.
{
  const cd = document.querySelector('.cd')
  const stage = cd && cd.querySelector('.cd-stage')
  const track = cd && cd.querySelector('.cd-track')
  const works = track ? [...track.children] : []
  if (works.length && !reduceMotion && CSS.supports('transform-style', 'preserve-3d')) {
    cd.classList.add('cd-on')
    document.querySelector('.ex-end')?.setAttribute('hidden', '')
    const world = document.createElement('div')
    world.className = 'cd-world'
    stage.prepend(world)
    world.append(track)
    track.style.display = 'contents'
    const door = cd.querySelector('.cd-door')
    const hud = cd.querySelector('.cd-hud')
    const nowNo = hud.querySelector('.cd-now-no')
    const nowTitle = hud.querySelector('.cd-now-title')
    door.hidden = false; hud.hidden = false
    let tiles = []; let items = []; let P = 900; let camEnd = 1; let cam = 0; let target = 0; let running = false; let current = -1

    const it0 = (li) => li.querySelector('img').complete
    const build = () => {
      tiles.forEach((t) => t.el.remove()); tiles = []; items = []
      const vw = stage.clientWidth; const vh = stage.clientHeight
      P = Math.max(vw, vh) * 0.62
      stage.style.setProperty('--cd-p', P + 'px')
      const hw = Math.max(vw * 0.5, 330); const hh = vh * 0.5
      const h0 = hh * 0.92; const gap = h0 * 1.2
      const start = P * 0.9
      const depth = start + works.length * gap + gap * 1.6
      camEnd = depth - P * 1.05
      cd.style.height = (vh + camEnd) + 'px'
      const L = gap * 2
      // dir: which way the fog gradient runs across the tile (near edge to far edge).
      const add = (cls, w, h, tf, z0, z1, dir) => {
        const el = document.createElement('div')
        el.className = 'cd-tile ' + cls
        el.style.width = w + 'px'; el.style.height = h + 'px'; el.style.transform = tf
        if (dir) el.style.setProperty('--fd', dir)
        world.append(el); tiles.push({ el, z0, z1 })
        return el
      }
      for (let z = 0; z < depth; z += L) {
        const len = Math.min(L, depth - z)
        add('cd-wall', len + 1, hh * 2, `translate3d(${-hw}px,${-hh}px,${-z}px) rotateY(90deg)`, -z, -z - len, 'to right')
        add('cd-wall is-r', len + 1, hh * 2, `translate3d(${hw}px,${-hh}px,${-z - len}px) rotateY(-90deg)`, -z, -z - len, 'to left')
        add('cd-floor', hw * 2, len + 1, `translate3d(${-hw}px,${hh}px,${-z - len}px) rotateX(90deg)`, -z, -z - len, 'to top')
        add('cd-ceil', hw * 2, len + 1, `translate3d(${-hw}px,${-hh}px,${-z}px) rotateX(-90deg)`, -z, -z - len, 'to bottom')
      }
      const end = add('cd-end', hw * 2, hh * 2, `translate3d(${-hw}px,${-hh}px,${-depth}px)`, -depth, -depth)
      end.style.setProperty('--dh', hh * 2 + 'px')
      end.append(door)
      works.forEach((li, i) => {
        const ar = parseFloat(li.style.getPropertyValue('--ar')) || 1.5
        const h = Math.min(h0, (h0 * 1.9) / ar); const w = h * ar
        const right = i % 2 === 1
        const z = -(start + i * gap)
        li.classList.toggle('is-r', right)
        li.style.setProperty('--w', w + 'px'); li.style.setProperty('--h', h + 'px')
        li.style.transformOrigin = right ? '100% 50%' : '0 50%'
        const minAngle = Math.acos(Math.min(1, (hw * 0.62) / w)) * 180 / Math.PI
        items.push({ li, z, w, h, right, x: right ? hw - w : -hw, y: -h * 0.62, minAngle: Math.max(minAngle, 38), img: li.querySelector('img'), loaded: it0(li), caption: li.querySelector('.photo').dataset.caption || '' })
      })
      target = Math.min(camEnd, Math.max(0, -cd.getBoundingClientRect().top))
      cam = target
      render()
    }

    const fog = (d) => Math.min(0.94, Math.max(0, d - P * 1.2) / (P * 5.5))
    const render = () => {
      world.style.transform = `translate3d(0,0,${cam}px)`
      const far = P * 9
      tiles.forEach((t) => {
        const near = P - (t.z0 + cam); const back = P - (t.z1 + cam)
        const show = back > 20 && near < far
        t.el.style.visibility = show ? '' : 'hidden'
        if (show) {
          t.el.style.setProperty('--f0', fog(near).toFixed(3))
          t.el.style.setProperty('--f1', fog(back).toFixed(3))
        }
      })
      let best = -1; let bestT = 0
      items.forEach((it, i) => {
        const dist = P - (it.z + cam) // from the visitor's eye to the work's near edge
        const show = dist > P * 0.08 && dist < far
        it.li.style.visibility = show ? '' : 'hidden'
        if (!show) return
        let t = (P * 2.7 - dist) / (P * 1.8)
        t = Math.min(1, Math.max(0, t)); t = t * t * (3 - 2 * t)
        const a = 90 - (90 - it.minAngle) * t
        it.li.style.transform = `translate3d(${it.x}px,${it.y}px,${it.z}px) rotateY(${it.right ? -a : a}deg)`
        it.li.style.setProperty('--fog', fog(dist).toFixed(3))
        if (!it.loaded) { it.loaded = true; it.img.loading = 'eager' }
        if (t > bestT && dist > P * 0.45) { bestT = t; best = i }
      })
      if (best !== current) {
        current = best
        nowNo.textContent = best >= 0 ? `${String(best + 1).padStart(2, '0')} / ${String(items.length).padStart(2, '0')}` : ''
        nowTitle.textContent = best >= 0 ? items[best].caption : ''
      }
      hud.classList.toggle('walking', cam > 40)
      stage.style.setProperty('--cd-progress', (cam / camEnd).toFixed(4))
    }

    const loop = () => {
      const d = target - cam
      cam += Math.abs(d) < 0.5 ? d : d * 0.12
      render()
      if (Math.abs(target - cam) > 0.5) requestAnimationFrame(loop)
      else running = false
    }
    const onScroll = () => {
      target = Math.min(camEnd, Math.max(0, -cd.getBoundingClientRect().top))
      if (!running) { running = true; requestAnimationFrame(loop) }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    let rt; new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(build, 120) }).observe(stage)
    build()

    // Looking around: the vanishing point follows the pointer a little.
    if (window.matchMedia('(hover: hover)').matches) {
      stage.addEventListener('pointermove', (e) => {
        const r = stage.getBoundingClientRect()
        stage.style.setProperty('--cd-ox', (50 - ((e.clientX - r.left) / r.width - 0.5) * 14) + '%')
        stage.style.setProperty('--cd-oy', (50 - ((e.clientY - r.top) / r.height - 0.5) * 10) + '%')
      })
      stage.addEventListener('pointerleave', () => { stage.style.removeProperty('--cd-ox'); stage.style.removeProperty('--cd-oy') })
    }
  }
}

// Album lightbox: click a photo to view it large; arrows, swipe and Escape work too.
{
  const box = document.querySelector('.lightbox')
  const links = [...document.querySelectorAll('.photo-grid .photo, .cd-work .photo')]
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
    ;[...label].forEach((c, i) => {
      const s = document.createElement('span')
      s.className = 'ch'; s.textContent = c; s.style.setProperty('--c', i); s.setAttribute('aria-hidden', 'true')
      frag.append(s)
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
  const bar = document.querySelector('.cd-on') ? null : document.createElement('div')
  if (bar) { bar.className = 'progress'; bar.setAttribute('aria-hidden', 'true'); document.body.append(bar) }
  let queued = false
  const update = () => {
    queued = false
    const max = document.documentElement.scrollHeight - innerHeight
    if (bar) bar.style.setProperty('--p', max > 0 ? Math.min(1, scrollY / max).toFixed(4) : 0)
    if (reduceMotion) return
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
