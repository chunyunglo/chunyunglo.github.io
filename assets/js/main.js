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

    // The works hang one behind another down a dark hall, facing the visitor and alternating
    // a little to the left and right. Scrolling walks forward: each work comes out of the dark,
    // is seen straight on at full size, then slides past and fades away.
    let gap = 1
    const build = () => {
      tiles.forEach((t) => t.el.remove()); tiles = []; items = []
      const vw = stage.clientWidth; const vh = stage.clientHeight
      P = Math.max(900, vh * 1.1)
      stage.style.setProperty('--cd-p', P + 'px')
      const narrow = vw < 700
      const hh = vh * 0.5; const hw = Math.max(vw * 0.75, hh * 1.4)
      const maxW = narrow ? vw * 0.86 : Math.min(vw * 0.58, 980)
      const maxH = vh * (narrow ? 0.5 : 0.6)
      gap = P * 0.85
      const start = P * 0.25
      const doorZ = start + (works.length - 1) * gap + gap * 1.3
      camEnd = doorZ - P * 0.25
      cd.style.height = (vh + camEnd * 0.9) + 'px'
      const add = (cls, w, h, tf, z0, z1, dir) => {
        const el = document.createElement('div')
        el.className = 'cd-tile ' + cls
        el.style.width = w + 'px'; el.style.height = h + 'px'; el.style.transform = tf
        if (dir) el.style.setProperty('--fd', dir)
        world.append(el); tiles.push({ el, z0, z1 })
        return el
      }
      const L = gap
      for (let z = -P; z < doorZ; z += L) {
        add('cd-floor', hw * 2, L + 1, `translate3d(${-hw}px,${hh}px,${-z - L}px) rotateX(90deg)`, -z, -z - L, 'to top')
        add('cd-ceil', hw * 2, L + 1, `translate3d(${-hw}px,${-hh}px,${-z}px) rotateX(-90deg)`, -z, -z - L, 'to bottom')
      }
      const endW = Math.min(vw * 0.9, hh * 2.4)
      const end = add('cd-end', endW, hh * 2, `translate3d(${-endW / 2}px,${-hh}px,${-doorZ}px)`, -doorZ, -doorZ)
      end.style.setProperty('--dh', hh * 2 + 'px')
      end.append(door)
      works.forEach((li, i) => {
        const ar = parseFloat(li.style.getPropertyValue('--ar')) || 1.5
        let w = maxW; let h = w / ar
        if (h > maxH) { h = maxH; w = h * ar }
        const side = narrow ? 0 : (i % 2 ? 1 : -1)
        li.classList.remove('is-r')
        li.style.setProperty('--w', w + 'px'); li.style.setProperty('--h', h + 'px')
        li.style.transformOrigin = '50% 50%'
        const x = side * vw * 0.13 - w / 2
        const y = -h / 2 - vh * 0.04
        li.style.transform = `translate3d(${x}px,${y}px,${-(start + i * gap)}px)`
        items.push({ li, z: -(start + i * gap), img: li.querySelector('img'), loaded: false, caption: li.querySelector('.photo').dataset.caption || '' })
      })
      target = Math.min(camEnd, Math.max(0, -cd.getBoundingClientRect().top / 0.9))
      cam = target
      render()
    }

    const fog = (d) => Math.min(0.94, Math.max(0, d - P * 1.2) / (P * 3.5))
    const render = () => {
      world.style.transform = `translate3d(0,0,${cam}px)`
      const far = P * 6
      tiles.forEach((t) => {
        const near = P - (t.z0 + cam); const back = P - (t.z1 + cam)
        const show = back > 20 && near < far
        t.el.style.visibility = show ? '' : 'hidden'
        if (show) {
          t.el.style.setProperty('--f0', fog(Math.max(near, 0)).toFixed(3))
          t.el.style.setProperty('--f1', fog(back).toFixed(3))
        }
      })
      let best = -1; let bestD = Infinity
      items.forEach((it, i) => {
        const rel = it.z + cam // 0 = seen at full size; positive = closer than that
        const show = rel < P * 0.22 && rel > -far
        it.li.style.visibility = show ? '' : 'hidden'
        if (!show) return
        const dist = P - rel
        const out = rel > P * 0.08 ? Math.min(1, (rel - P * 0.08) / (P * 0.14)) : 0
        it.li.style.opacity = (1 - out).toFixed(3)
        it.li.style.setProperty('--fog', fog(dist).toFixed(3))
        if (!it.loaded && dist < far) { it.loaded = true; it.img.loading = 'eager' }
        const d = Math.abs(rel + gap * 0.1)
        if (d < bestD && rel < P * 0.4) { bestD = d; best = i }
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
      target = Math.min(camEnd, Math.max(0, -cd.getBoundingClientRect().top / 0.9))
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
  const heroPhoto = document.querySelector('.hero-photo')
  const bar = document.querySelector('.cd-on') ? null : document.createElement('div')
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
