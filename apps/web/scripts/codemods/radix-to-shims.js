/**
 * jscodeshift codemod: Replace direct Radix imports with app shims (@/components/ui/*).
 * - Dialog -> import from "@/components/ui/dialog" and update usages
 * - Popover -> import from "@/components/ui/popover" and update usages
 * - Tooltip -> import from "@/components/ui/tooltip" and update usages
 * - If TooltipPrimitive.Arrow is used, add a named import from '@radix-ui/react-tooltip' for Arrow
 *
 * Run:
 *   npx jscodeshift -t scripts/codemods/radix-to-shims.js --extensions=ts,tsx --parser=tsx "src/**/*.{ts,tsx}" "modules/**/*.{ts,tsx}"
 */

const TARGETS = {
  "@radix-ui/react-dialog": {
    shim: "@/components/ui/dialog",
    memberMap: {
      Root: "Dialog",
      Trigger: "DialogTrigger",
      Content: "DialogContent",
      Overlay: "DialogOverlay",
      Title: "DialogTitle",
      Description: "DialogDescription",
      Close: "DialogClose",
      Portal: "DialogPortal",
    },
  },
  "@radix-ui/react-popover": {
    shim: "@/components/ui/popover",
    memberMap: {
      Root: "Popover",
      Trigger: "PopoverTrigger",
      Content: "PopoverContent",
      Portal: "PopoverPortal",
      Anchor: "PopoverAnchor",
    },
  },
  "@radix-ui/react-tooltip": {
    shim: "@/components/ui/tooltip",
    memberMap: {
      Root: "Tooltip",
      Trigger: "TooltipTrigger",
      Content: "TooltipContent",
      Provider: "TooltipProvider",
    },
    special: {
      Arrow: { keepRadixNamed: "Arrow", localName: "TooltipArrow" },
    },
  },
}

/** @param {import('jscodeshift').API} api */
module.exports = function transform(file, api, options) {
  // Skip our UI shim directory entirely
  if (file.path.includes("modules/ui/components/")) {
    return null
  }
  const j = api.jscodeshift
  const root = j(file.source)
  let modified = false

  function addOrMergeImport(source, namedSpecifiers) {
    const existing = root.find(j.ImportDeclaration, { source: { value: source } })
    if (existing.size() > 0) {
      const first = existing.get()
      const currentSpecs = first.node.specifiers || []
      const existingNames = new Set(
        currentSpecs.filter(s => s.type === 'ImportSpecifier').map(s => s.imported.name)
      )
      const toAdd = namedSpecifiers.filter(n => !existingNames.has(n.imported.name))
      if (toAdd.length) {
        first.node.specifiers = [...currentSpecs, ...toAdd]
        modified = true
      }
      return
    }
    root.get().node.program.body.unshift(
      j.importDeclaration(namedSpecifiers, j.literal(source))
    )
    modified = true
  }

  function uniqueLocal(name) {
    // ensure not colliding
    let candidate = name
    let i = 1
    while (root.find(j.Identifier, { name: candidate }).size() > 0) {
      candidate = `${name}_${i++}`
    }
    return candidate
  }

  Object.entries(TARGETS).forEach(([radixSource, cfg]) => {
    // handle namespace or named imports
    root.find(j.ImportDeclaration, { source: { value: radixSource } }).forEach(path => {
      const imp = path.node
      const namespace = imp.specifiers?.find(s => s.type === 'ImportNamespaceSpecifier')
      const named = (imp.specifiers || []).filter(s => s.type === 'ImportSpecifier')

      const usedMembers = new Set()
      const specialUsages = {}

      if (namespace) {
        const ns = namespace.local.name
        // member expressions like DialogPrimitive.Root
        root.find(j.MemberExpression, {
          object: { type: 'Identifier', name: ns },
          property: { type: 'Identifier' },
        }).forEach(memPath => {
          const name = memPath.node.property.name
          if (cfg.memberMap[name]) {
            usedMembers.add(name)
            // replace with bare identifier
            j(memPath).replaceWith(j.identifier(cfg.memberMap[name]))
            modified = true
          } else if (cfg.special && cfg.special[name]) {
            specialUsages[name] = cfg.special[name]
          }
        })

        // If namespace is no longer used, remove it
        const nsStillUsed = root.find(j.Identifier, { name: ns }).filter(p => p.parentPath.value !== namespace).size() > 0
        if (!nsStillUsed) {
          j(path).remove()
          modified = true
        }
      }

      if (named.length) {
        // e.g., import { Root, Trigger } from '@radix-ui/react-dialog'
        named.forEach(spec => {
          const importedName = spec.imported.name
          if (cfg.memberMap[importedName]) {
            usedMembers.add(importedName)
          } else if (cfg.special && cfg.special[importedName]) {
            specialUsages[importedName] = cfg.special[importedName]
          }
        })
        // Remove original Radix import; we'll add shims instead
        j(path).remove()
        modified = true
      }

      // Add shim imports for used members
      if (usedMembers.size > 0) {
        const namedSpecs = Array.from(usedMembers).map(m => j.importSpecifier(j.identifier(cfg.memberMap[m])))
        addOrMergeImport(cfg.shim, namedSpecs)
      }

      // Handle specials (Tooltip Arrow)
      Object.entries(specialUsages).forEach(([radixName, specCfg]) => {
        const local = uniqueLocal(specCfg.localName)
        // Replace remaining MemberExpressions ns.Arrow or identifier Arrow usage
        if (namespace) {
          const ns = namespace.local.name
          root.find(j.MemberExpression, {
            object: { type: 'Identifier', name: ns },
            property: { type: 'Identifier', name: radixName },
          }).forEach(mem => {
            j(mem).replaceWith(j.identifier(local))
            modified = true
          })
        }
        root
          .find(j.Identifier, { name: radixName })
          .filter(p => p.parentPath.value.type !== 'ImportSpecifier')
          .forEach(p => {
            j(p).replaceWith(j.identifier(local))
            modified = true
          })
        addOrMergeImport("@radix-ui/react-tooltip", [j.importSpecifier(j.identifier(specCfg.keepRadixNamed), j.identifier(local))])
      })
    })
  })

  return modified ? root.toSource({ quote: 'double', reuseWhitespace: false }) : null
}
