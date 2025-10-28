import fs from "fs"
import path from "path"

function collectFiles(startDir, exts = [".js", ".mjs"]) {
  const results = []
  function walk(dir) {
    if (!fs.existsSync(dir)) return
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const e of entries) {
      const fp = path.join(dir, e.name)
      if (e.isDirectory()) walk(fp)
      else if (e.isFile()) {
        const ext = path.extname(e.name).toLowerCase()
        if (exts.includes(ext)) {
          try {
            const stat = fs.statSync(fp)
            results.push({ size: stat.size, file: fp })
          } catch {}
        }
      }
    }
  }
  walk(startDir)
  return results
}

function topN(arr, n = 5) {
  return [...arr].sort((a, b) => b.size - a.size).slice(0, n)
}

function fmt(bytes) {
  const units = ["B", "KB", "MB", "GB"]
  let i = 0
  let n = bytes
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i++
  }
  return `${n.toFixed(2)} ${units[i]}`
}

function printSection(title, arr) {
  console.log(`\n=== ${title} ===`)
  if (arr.length === 0) {
    console.log("(none found)")
    return
  }
  for (const { size, file } of arr) {
    console.log(`${fmt(size).padStart(10)}  ${file}`)
  }
}

const clientDir = path.join("apps", "web", ".next", "static")
const serverDir = path.join("apps", "web", ".next", "server")

const clientFiles = collectFiles(clientDir)
const serverFiles = collectFiles(serverDir)

printSection("CLIENT TOP 5", topN(clientFiles, 5))
printSection("SERVER TOP 5", topN(serverFiles, 5))
