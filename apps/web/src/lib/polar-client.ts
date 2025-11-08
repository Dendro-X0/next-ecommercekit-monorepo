import { Polar } from "@polar-sh/sdk"

export function createPolar(): InstanceType<typeof Polar> {
  const token: string | undefined = process.env.POLAR_ACCESS_TOKEN
  const serverRaw: string = process.env.POLAR_SERVER ?? "sandbox"
  const server: "sandbox" | "production" = serverRaw === "production" ? "production" : "sandbox"
  return new Polar({ accessToken: token ?? "", server })
}
