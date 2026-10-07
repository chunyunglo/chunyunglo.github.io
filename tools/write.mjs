#!/usr/bin/env node
// Starts the local preview (Hugo) and the post editor (Decap CMS), then opens the editor.
import { spawn, execSync } from 'node:child_process'

try { execSync('git config core.hooksPath .githooks') } catch (e) {}

try {
  const v = execSync('hugo version').toString().match(/v0\.(\d+)/)
  if (v && Number(v[1]) < 156) {
    console.error('Hugo 版本太舊（需要 0.156 以上），請先執行：brew upgrade hugo')
    process.exit(1)
  }
} catch (e) {
  console.error('找不到 Hugo，請先安裝：brew install hugo')
  process.exit(1)
}

const procs = [
  spawn('hugo', ['server', '-D', '--port', '1313', '--disableFastRender'], { stdio: ['ignore', 'inherit', 'inherit'] }),
  spawn('npx', ['--no-install', 'decap-server'], { stdio: ['ignore', 'inherit', 'inherit'] })
]
procs.forEach((p) => p.on('error', (e) => {
  console.error(e.code === 'ENOENT' ? `找不到 ${p.spawnfile}，請先安裝（見 README）。` : e.message)
  process.exit(1)
}))

setTimeout(() => {
  const url = 'http://localhost:1313/admin/'
  console.log(`\n✏️  編輯器：${url}\n👀 預覽網站：http://localhost:1313/\n按 Ctrl+C 結束。\n`)
  const opener = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'start' : 'xdg-open'
  try { execSync(`${opener} ${url}`) } catch (e) {}
}, 3000)

const stop = () => { procs.forEach((p) => p.kill()); process.exit(0) }
process.on('SIGINT', stop)
process.on('SIGTERM', stop)
