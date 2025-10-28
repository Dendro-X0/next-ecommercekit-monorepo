/**
 * Zod validation helpers for Hono routes.
 * Centralizes parsing for body, query, and params.
 */
import type { Context } from "hono"
import type { z } from "zod"

/**
 * One-export utility following project standards.
 */
export const validate = (() => {
  async function body<TSchema extends z.ZodTypeAny>(
    c: Context,
    schema: TSchema,
  ): Promise<Readonly<z.output<TSchema>>> {
    const json = await c.req.json().catch(() => null)
    return schema.parse(json) as Readonly<z.output<TSchema>>
  }
  function query<TSchema extends z.ZodTypeAny>(
    c: Context,
    schema: TSchema,
  ): Readonly<z.output<TSchema>> {
    const q = Object.fromEntries(new URL(c.req.url).searchParams.entries())
    return schema.parse(q) as Readonly<z.output<TSchema>>
  }
  function params<TSchema extends z.ZodTypeAny>(
    c: Context,
    schema: TSchema,
  ): Readonly<z.output<TSchema>> {
    // Hono's params are untyped string map
    const p = c.req.param() as Record<string, unknown>
    return schema.parse(p) as Readonly<z.output<TSchema>>
  }
  return { body, query, params } as const
})()
