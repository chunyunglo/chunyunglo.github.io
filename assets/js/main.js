// Theme toggle: cycles light/dark and remembers the choice.
const root = document.documentElement
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)')
const current = () =>
  root.dataset.theme === 'auto' ? (prefersDark.matches ? 'dark' : 'light') : root.dataset.theme

document.querySelector('.theme-toggle')?.addEventListener('click', () => {
  const next = current() === 'dark' ? 'light' : 'dark'
  root.dataset.theme = next
  try { localStorage.setItem('theme', next) } catch (e) {}
})

// Mobile navigation.
const toggle = document.querySelector('.nav-toggle')
const nav = document.getElementById('site-nav')
if (toggle && nav) {
  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open))
    nav.classList.toggle('open', open)
  }
  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'))
  nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false) })
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false) })
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
