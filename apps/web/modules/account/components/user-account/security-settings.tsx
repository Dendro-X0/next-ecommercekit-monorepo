"use client"

import { Key, Shield, Smartphone } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useId, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { authClientHelpers } from "@/lib/auth-client-helpers"
import { PasswordForm } from "../user/password-form"
import { TrustedDevices } from "../user/trusted-devices"

/**
 * Security settings page section for account: password, 2FA, and devices.
 */
export function SecuritySettings(): React.ReactElement {
  const [twoFactorEnabled, setTwoFactorEnabled] = useState<boolean>(false)
  const [isChangingPassword, setIsChangingPassword] = useState<boolean>(false)
  const [viewCodesOpen, setViewCodesOpen] = useState<boolean>(false)
  const [regenOpen, setRegenOpen] = useState<boolean>(false)
  const [codes, setCodes] = useState<readonly string[] | null>(null)
  const [busy, setBusy] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [password, setPassword] = useState<string>("")
  const [enableOpen, setEnableOpen] = useState<boolean>(false)
  const [disableOpen, setDisableOpen] = useState<boolean>(false)
  const [enablePassword, setEnablePassword] = useState<string>("")
  const [disablePassword, setDisablePassword] = useState<string>("")
  const [enabling, setEnabling] = useState<boolean>(false)
  const [disabling, setDisabling] = useState<boolean>(false)
  const router = useRouter()
  const uid = useId()
  const idEnablePassword = `${uid}-enable-password`
  const idDisablePassword = `${uid}-disable-password`
  const idRegenPassword = `${uid}-regen-password`

  const hasCodes: boolean = useMemo(() => Array.isArray(codes) && codes.length > 0, [codes])

  const handleEnable2FA = (): void => {
    setEnableOpen(true)
  }
  const handleDisable2FA = (): void => {
    setDisableOpen(true)
  }

  const fetchRecoveryCodes = useCallback(async (): Promise<void> => {
    setBusy(true)
    setError(null)
    try {
      const res = await fetch("/api/account/recovery-codes", {
        credentials: "include",
        cache: "no-store",
      })
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: { message?: string } }
        const msg: string = j?.error?.message ?? `Failed to load recovery codes (${res.status})`
        setError(msg)
        setCodes(null)
      } else {
        const j = await res.json().catch(() => null)
        const arr: readonly string[] = Array.isArray(j)
          ? (j as string[])
          : j &&
              typeof j === "object" &&
              Array.isArray((j as { backupCodes?: unknown }).backupCodes)
            ? (j as { backupCodes: string[] }).backupCodes
            : []
        setCodes(arr)
      }
    } catch (e) {
      const message: string = e instanceof Error ? e.message : "Failed to load recovery codes."
      setError(message)
      setCodes(null)
    } finally {
      setBusy(false)
    }
  }, [])

  const regenerateRecoveryCodes = useCallback(async (): Promise<void> => {
    if (!password) {
      setError("Password is required to regenerate codes.")
      return
    }
    setBusy(true)
    setError(null)
    try {
      const { data, error: err } = await authClientHelpers.twoFactorGenerateBackupCodes({
        password,
      })
      if (err) {
        setError(err.message ?? "Failed to regenerate codes.")
        setCodes(null)
      } else {
        setCodes(((data ?? []) as readonly string[]).slice() as string[])
        setPassword("")
      }
    } catch (e) {
      const message: string = e instanceof Error ? e.message : "Failed to regenerate codes."
      setError(message)
      setCodes(null)
    } finally {
      setBusy(false)
    }
  }, [password])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Security Settings</h2>
        <p className="text-muted-foreground">
          Manage your account security and authentication methods
        </p>
      </div>

      {/* Password Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            Password
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Password</p>
              <p className="text-sm text-muted-foreground">Last updated 30 days ago</p>
            </div>
            <Dialog open={isChangingPassword} onOpenChange={setIsChangingPassword}>
              <DialogTrigger>
                <Button variant="outline">Change Password</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                </DialogHeader>
                <PasswordForm hasPassword={true} />
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-medium">Authenticator App</p>
                {twoFactorEnabled ? (
                  <Badge variant="default">Enabled</Badge>
                ) : (
                  <Badge variant="secondary">Disabled</Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                Use an authenticator app to generate secure codes for login
              </p>
            </div>
            <Switch
              checked={twoFactorEnabled}
              onCheckedChange={twoFactorEnabled ? handleDisable2FA : handleEnable2FA}
            />
          </div>

          {twoFactorEnabled && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                  <Smartphone className="h-5 w-5 text-green-600" />
                  <div>
                    <p className="font-medium text-sm">Google Authenticator</p>
                    <p className="text-xs text-muted-foreground">Connected on iPhone</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setViewCodesOpen(true)
                      void fetchRecoveryCodes()
                    }}
                  >
                    View Recovery Codes
                  </Button>
                  <Dialog open={viewCodesOpen} onOpenChange={setViewCodesOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Recovery Codes</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3">
                        {error && <p className="text-sm text-red-600">{error}</p>}
                        {!error &&
                          !hasCodes &&
                          (busy ? (
                            <p className="text-sm text-muted-foreground">Loading…</p>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No recovery codes found.
                            </p>
                          ))}
                        {hasCodes && (
                          <ul className="grid grid-cols-2 gap-2">
                            {codes!.map((c) => (
                              <li
                                key={c}
                                className="font-mono text-sm px-2 py-1 rounded border bg-muted/40 select-all"
                              >
                                {c}
                              </li>
                            ))}
                          </ul>
                        )}
                        <p className="text-xs text-muted-foreground">
                          Store these codes in a secure password manager. Each code can be used
                          once.
                        </p>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" size="sm" onClick={() => setRegenOpen(true)}>
                    Regenerate Codes
                  </Button>
                  <Dialog open={regenOpen} onOpenChange={setRegenOpen}>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Regenerate Recovery Codes</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3">
                        {error && <p className="text-sm text-red-600">{error}</p>}
                        <div className="space-y-2">
                          <Label htmlFor={idRegenPassword}>Confirm password</Label>
                          <Input
                            id={idRegenPassword}
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.currentTarget.value)}
                            placeholder="••••••••"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Button disabled={busy} onClick={() => void regenerateRecoveryCodes()}>
                            {busy ? "Generating…" : "Generate"}
                          </Button>
                        </div>
                        {hasCodes && (
                          <div className="space-y-2">
                            <p className="text-sm font-medium">New codes</p>
                            <ul className="grid grid-cols-2 gap-2">
                              {codes!.map((c) => (
                                <li
                                  key={c}
                                  className="font-mono text-sm px-2 py-1 rounded border bg-muted/40 select-all"
                                >
                                  {c}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        <p className="text-xs text-muted-foreground">
                          This will invalidate any existing recovery codes.
                        </p>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Enable 2FA dialog (controlled) */}
      <Dialog open={enableOpen} onOpenChange={setEnableOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="space-y-2">
              <Label htmlFor={idEnablePassword}>Confirm password</Label>
              <Input
                id={idEnablePassword}
                type="password"
                value={enablePassword}
                onChange={(e) => setEnablePassword(e.currentTarget.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                disabled={enabling || !enablePassword}
                onClick={async () => {
                  setError(null)
                  setEnabling(true)
                  try {
                    const { error: err } = await authClientHelpers.twoFactorEnable({
                      password: enablePassword,
                    })
                    if (err) {
                      setError(err.message ?? "Failed to enable 2FA.")
                    } else {
                      setTwoFactorEnabled(true)
                      setEnablePassword("")
                      setEnableOpen(false)
                      router.push("/auth/two-factor")
                    }
                  } catch (e) {
                    const m: string = e instanceof Error ? e.message : "Failed to enable 2FA."
                    setError(m)
                  } finally {
                    setEnabling(false)
                  }
                }}
              >
                {enabling ? "Enabling…" : "Enable"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              After enabling, you'll need to verify a code from your authenticator app.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Disable 2FA dialog (controlled) */}
      <Dialog open={disableOpen} onOpenChange={setDisableOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disable Two-Factor Authentication</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {error && <p className="text-sm text-red-600">{error}</p>}
            <div className="space-y-2">
              <Label htmlFor={idDisablePassword}>Confirm password</Label>
              <Input
                id={idDisablePassword}
                type="password"
                value={disablePassword}
                onChange={(e) => setDisablePassword(e.currentTarget.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                disabled={disabling || !disablePassword}
                onClick={async () => {
                  setError(null)
                  setDisabling(true)
                  try {
                    const { error: err } = await authClientHelpers.twoFactorDisable({
                      password: disablePassword,
                    })
                    if (err) {
                      setError(err.message ?? "Failed to disable 2FA.")
                    } else {
                      setTwoFactorEnabled(false)
                      setDisablePassword("")
                      setDisableOpen(false)
                    }
                  } catch (e) {
                    const m: string = e instanceof Error ? e.message : "Failed to disable 2FA."
                    setError(m)
                  } finally {
                    setDisabling(false)
                  }
                }}
              >
                {disabling ? "Disabling…" : "Disable"}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              You can re-enable 2FA anytime. Consider keeping recovery codes safe.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Trusted Devices */}
      <Card>
        <CardHeader>
          <CardTitle>Trusted Devices</CardTitle>
        </CardHeader>
        <CardContent>
          <TrustedDevices />
        </CardContent>
      </Card>

      {/* Account Deletion */}
      <Card className="border-destructive/20">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Permanently delete your account and all associated data
              </p>
            </div>
            <Button variant="destructive" size="sm">
              Delete Account
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
