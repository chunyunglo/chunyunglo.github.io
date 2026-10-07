#!/usr/bin/env node
// Removes metadata (EXIF incl. GPS, XMP, IPTC, text chunks) from JPEG/PNG files in place.
// JPEG orientation is kept so photos still display the right way up.
// Usage: node tools/strip-exif.mjs [--check] <files...>
//   --check  report files that still contain metadata and exit 1, without changing them.
import { readFileSync, writeFileSync } from 'node:fs'

const check = process.argv.includes('--check')
const files = process.argv.slice(2).filter((a) => a !== '--check')
let dirty = 0
let failed = 0

function exifOrientation (app1) {
  // app1: segment payload starting with "Exif\0\0".
  if (app1.toString('latin1', 0, 4) !== 'Exif') return 1
  const t = app1.subarray(6)
  const le = t.toString('latin1', 0, 2) === 'II'
  const u16 = (o) => (le ? t.readUInt16LE(o) : t.readUInt16BE(o))
  const u32 = (o) => (le ? t.readUInt32LE(o) : t.readUInt32BE(o))
  try {
    const ifd = u32(4)
    const n = u16(ifd)
    for (let i = 0; i < n; i++) {
      const e = ifd + 2 + i * 12
      if (u16(e) === 0x0112) return u16(e + 8) || 1
    }
  } catch (e) {}
  return 1
}

function orientationSegment (o) {
  // Minimal EXIF block containing only the Orientation tag (big-endian TIFF).
  const tiff = Buffer.alloc(26)
  tiff.write('MM', 0, 'latin1'); tiff.writeUInt16BE(42, 2); tiff.writeUInt32BE(8, 4)
  tiff.writeUInt16BE(1, 8) // one entry
  tiff.writeUInt16BE(0x0112, 10); tiff.writeUInt16BE(3, 12); tiff.writeUInt32BE(1, 14); tiff.writeUInt16BE(o, 18)
  tiff.writeUInt32BE(0, 22) // no next IFD
  const payload = Buffer.concat([Buffer.from('Exif\0\0', 'latin1'), tiff])
  const head = Buffer.from([0xff, 0xe1, 0, 0]); head.writeUInt16BE(payload.length + 2, 2)
  return Buffer.concat([head, payload])
}

function stripJpeg (buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) throw new Error('not a JPEG')
  const out = [buf.subarray(0, 2)]
  let pos = 2
  let orientation = 1
  let removed = false
  while (pos < buf.length) {
    if (buf[pos] !== 0xff) throw new Error('corrupt JPEG')
    const marker = buf[pos + 1]
    if (marker === 0xda) { out.push(buf.subarray(pos)); break } // start of scan: copy the rest
    const len = buf.readUInt16BE(pos + 2)
    const seg = buf.subarray(pos, pos + 2 + len)
    const payload = seg.subarray(4)
    const isExif = marker === 0xe1 // EXIF or XMP
    const isIptc = marker === 0xed
    const isComment = marker === 0xfe
    if (isExif && payload.toString('latin1', 0, 4) === 'Exif') orientation = exifOrientation(payload)
    if (isExif || isIptc || isComment) removed = true
    else out.push(seg)
    pos += 2 + len
  }
  if (!removed) return null
  if (orientation !== 1) out.splice(1, 0, orientationSegment(orientation))
  return Buffer.concat(out)
}

function stripPng (buf) {
  const sig = buf.subarray(0, 8)
  const out = [sig]
  let pos = 8
  let removed = false
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos)
    const type = buf.toString('latin1', pos + 4, pos + 8)
    const chunk = buf.subarray(pos, pos + 12 + len)
    if (['eXIf', 'tEXt', 'iTXt', 'zTXt', 'tIME'].includes(type)) removed = true
    else out.push(chunk)
    pos += 12 + len
  }
  return removed ? Buffer.concat(out) : null
}

function hasMeta (buf, kind) {
  if (kind === 'jpeg') {
    let pos = 2
    while (pos < buf.length && buf[pos] === 0xff) {
      const marker = buf[pos + 1]
      if (marker === 0xda) break
      const len = buf.readUInt16BE(pos + 2)
      if (marker === 0xe1) {
        const p = buf.subarray(pos + 4, pos + 2 + len)
        // An orientation-only block (as written above) is fine.
        if (!(p.toString('latin1', 0, 4) === 'Exif' && len === 2 + 6 + 26)) return true
      }
      if (marker === 0xed || marker === 0xfe) return true
      pos += 2 + len
    }
    return false
  }
  return stripPng(buf) !== null
}

for (const f of files) {
  const lower = f.toLowerCase()
  if (/\.(heic|heif)$/.test(lower)) {
    console.error(`✗ ${f}: HEIC 照片無法在網站上顯示，請先轉成 JPEG（在「照片」App 匯出為 JPEG）。`)
    failed++
    continue
  }
  const kind = /\.(jpe?g)$/.test(lower) ? 'jpeg' : /\.png$/.test(lower) ? 'png' : null
  if (!kind) continue
  try {
    const buf = readFileSync(f)
    if (check) {
      if (hasMeta(buf, kind)) { console.error(`✗ ${f} 含有 EXIF/定位等中繼資料`); dirty++ }
      continue
    }
    const res = kind === 'jpeg' ? stripJpeg(buf) : stripPng(buf)
    if (res) { writeFileSync(f, res); console.log(`✓ 已移除中繼資料：${f}`) }
  } catch (e) {
    console.error(`✗ ${f}: ${e.message}`)
    failed++
  }
}
if (failed || (check && dirty)) process.exit(1)
