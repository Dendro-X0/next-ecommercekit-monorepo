import { spawn } from "child_process"
import { mkdirSync, readFileSync } from "fs"
import path from "path"
import process from "process"

type LighthouseMode = "mobile" | "desktop"

interface RouteConfig {
  readonly path: string
  readonly name: string
}

interface ScoreMap {
  readonly performance?: number
  readonly accessibility?: number
  readonly bestPractices?: number
  readonly seo?: number
}

const baseUrl: string =
  process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "http://localhost:3000"

function parseBaseUrl(url: string): URL {
  try {
    return new URL(url)
  } catch {
    throw new Error(`Invalid base URL: ${url}`)
  }
}

const routes: RouteConfig[] = [
  { path: "/", name: "home" },
  { path: "/shop", name: "shop" },
  { path: "/cart", name: "cart" },
  { path: "/checkout", name: "checkout" },
  { path: "/auth", name: "auth" },
  { path: "/dashboard/user", name: "dashboard-user" },
]

const modes: LighthouseMode[] = ["mobile", "desktop"]

function createOutputDir(): string {
  const rootDir: string = path.resolve(__dirname, "..")
  const reportsRoot: string = path.join(rootDir, ".lighthouse")
  const timestamp: string = new Date().toISOString().replace(/[:.]/g, "-")
  const outputDir: string = path.join(reportsRoot, timestamp)
  mkdirSync(outputDir, { recursive: true })
  return outputDir
}

function buildUrl(base: URL, routePath: string): string {
  const url: URL = new URL(base.toString())
  url.pathname = routePath
  url.searchParams.set("lhci", "1")
  return url.toString()
}

function getBaseFileName(routeName: string, mode: LighthouseMode): string {
  const safeRoute: string = routeName
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase()
  return `${safeRoute || "root"}-${mode}`
}

function getJsonPath(dir: string, baseFileName: string): string {
  return path.join(dir, `${baseFileName}.report.json`)
}

function getBaseFilePath(dir: string, baseFileName: string): string {
  return path.join(dir, baseFileName)
}

function getLighthouseArgs(fullUrl: string, baseFilePath: string, mode: LighthouseMode): string[] {
  const args: string[] = [
    "lighthouse",
    fullUrl,
    "--quiet",
    "--chrome-flags=--headless=new",
    "--output=json",
    "--output=html",
    `--output-path=${baseFilePath}`,
  ]
  if (mode === "desktop") {
    args.push("--preset=desktop")
  }
  return args
}

function spawnLighthouse(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const cmd: string = process.platform === "win32" ? "npx.cmd" : "npx"
    const child = spawn(cmd, args, { stdio: "inherit" })
    child.on("error", (error: Error) => reject(error))
    child.on("exit", (code: number | null) => {
      if (code === 0) {
        resolve()
      } else {
        reject(new Error(`Lighthouse exited with code ${code ?? -1}`))
      }
    })
  })
}

function extractScores(root: unknown): ScoreMap {
  if (!root || typeof root !== "object") {
    return {}
  }
  const asRecord = root as Record<string, unknown>
  const lhrCandidate: unknown = "lhr" in asRecord ? asRecord.lhr : root
  if (!lhrCandidate || typeof lhrCandidate !== "object") {
    return {}
  }
  const lhrRecord = lhrCandidate as { categories?: unknown }
  if (!lhrRecord.categories || typeof lhrRecord.categories !== "object") {
    return {}
  }
  const categoriesRecord = lhrRecord.categories as Record<string, unknown>
  const map: { performance?: number; accessibility?: number; bestPractices?: number; seo?: number } = {}
  const setScore = (sourceKey: string, targetKey: keyof ScoreMap): void => {
    const cat = categoriesRecord[sourceKey]
    if (!cat || typeof cat !== "object") {
      return
    }
    const scoreValue = (cat as { score?: number | null }).score
    if (typeof scoreValue === "number") {
      const normalized: number = Math.round(scoreValue * 100)
      ;(map as Record<string, number>)[targetKey as string] = normalized
    }
  }
  setScore("performance", "performance")
  setScore("accessibility", "accessibility")
  setScore("best-practices", "bestPractices")
  setScore("seo", "seo")
  return map
}

async function runForRoute(
  route: RouteConfig,
  mode: LighthouseMode,
  base: URL,
  dir: string,
): Promise<void> {
  const fullUrl: string = buildUrl(base, route.path)
  const baseFileName: string = getBaseFileName(route.name, mode)
  const baseFilePath: string = getBaseFilePath(dir, baseFileName)
  const jsonPath: string = getJsonPath(dir, baseFileName)
  const args: string[] = getLighthouseArgs(fullUrl, baseFilePath, mode)
  console.log(`Running Lighthouse for ${fullUrl} [${mode}]`)
  await spawnLighthouse(args)
  const jsonContent: string = readFileSync(jsonPath, "utf8")
  const parsed: unknown = JSON.parse(jsonContent) as unknown
  const scores: ScoreMap = extractScores(parsed)
  const perf: string = scores.performance !== undefined ? `${scores.performance}` : "-"
  const a11y: string = scores.accessibility !== undefined ? `${scores.accessibility}` : "-"
  const best: string = scores.bestPractices !== undefined ? `${scores.bestPractices}` : "-"
  const seo: string = scores.seo !== undefined ? `${scores.seo}` : "-"
  console.log(`Summary ${route.name} [${mode}] perf=${perf} a11y=${a11y} best=${best} seo=${seo}`)
}

async function main(): Promise<void> {
  const parsedBase: URL = parseBaseUrl(baseUrl)
  const outputDir: string = createOutputDir()
  let hadError: boolean = false
  for (const route of routes) {
    for (const mode of modes) {
      try {
        await runForRoute(route, mode, parsedBase, outputDir)
      } catch (error) {
        hadError = true
        console.error(`Lighthouse failed for ${route.path} [${mode}]`, error)
      }
    }
  }
  if (hadError) {
    process.exitCode = 1
  }
}

main().catch((error: unknown) => {
  console.error("Unexpected error in Lighthouse runner", error)
  process.exitCode = 1
})
