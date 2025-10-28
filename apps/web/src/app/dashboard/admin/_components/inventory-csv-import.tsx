"use client"

import { Button } from "@components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@components/ui/table"
import type React from "react"
import { useMemo, useState } from "react"

type CsvRow = ReadonlyArray<string>

/**
 * InventoryCsvImport: lightweight CSV uploader with client-side preview only.
 */
export function InventoryCsvImport(): React.ReactElement {
  const [rows, setRows] = useState<CsvRow[]>([])

  const parseCsv = (text: string): CsvRow[] => {
    const lines: string[] = text.split(/\r?\n/).filter((l) => l.trim().length > 0)
    return lines.map((line) => line.split(",").map((cell) => cell.trim()))
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file: File | undefined = e.target.files?.[0]
    if (!file) return
    const content: string = await file.text()
    setRows(parseCsv(content))
  }

  const clear = (): void => setRows([])

  const preview: CsvRow[] = rows.slice(0, 10)
  const cols: number = preview[0]?.length ?? 0

  // Stable keys for table headers and rows
  const headerKeys: readonly string[] = useMemo(
    () => Array.from({ length: cols }, (_, i) => `col-${i + 1}`),
    [cols],
  )
  const rowKeys: readonly string[] = useMemo(
    () => preview.map((r) => globalThis.crypto?.randomUUID?.() ?? r.join("|").slice(0, 24)),
    [preview],
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>CSV Import (preview)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <input type="file" accept=".csv" onChange={handleFileChange} />
        {preview.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Showing first {preview.length} row{preview.length !== 1 ? "s" : ""}
              </span>
              <Button variant="outline" size="sm" onClick={clear}>
                Clear
              </Button>
            </div>
            <div className="max-h-64 overflow-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headerKeys.map((k, i) => (
                      <TableHead key={k}>Col {i + 1}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((r, idx) => (
                    <TableRow key={rowKeys[idx]}>
                      {r.map((c, j) => (
                        <TableCell key={`${rowKeys[idx]}-c${j}`} className="whitespace-pre-wrap">
                          {c}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Upload a .csv file to preview its contents. No data is saved.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
