#!/usr/bin/env node
/*
  Lists all direct Radix imports in src/ and modules/ with file and line numbers.
  Usage: node scripts/reports/list-radix-imports.js
*/
const fs = require("fs")
const path = require("path")

const ROOTS = [path.join(process.cwd(), "src"), path.join(process.cwd(), "modules")]
const EXTENSIONS = new Set([".ts", ".tsx"])

function* walk(dir) {
  let ents = []
  try {
    ents = fs.readdirSync(dir, { withFileTypes: true })
  } catch {
    return
  }
  for (const ent of ents) {
    const full = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      yield* walk(full)
    } else if (EXTENSIONS.has(path.extname(ent.name))) {
      yield full
    }
  }
}

function scanFile(file) {
  const text = fs.readFileSync(file, "utf8")
  const lines = text.split(/\r?\n/)
  lines.forEach((line, idx) => {
    if (
      /from\s+['"]@radix-ui\/.+['"]/.test(line) ||
      /import\s+\*\s+as\s+\w+\s+from\s+['"]@radix-ui\/.+['"]/.test(line)
    ) {
      console.log(`${path.relative(process.cwd(), file)}:${idx + 1}: ${line.trim()}`)
    }
  })
}
;(function main() {
  let count = 0
  for (const root of ROOTS) {
    for (const file of walk(root)) {
      scanFile(file)
      count++
    }
  }
  if (count === 0) {
    console.log("No TS/TSX files found under src/ or modules/")
  }
})()
