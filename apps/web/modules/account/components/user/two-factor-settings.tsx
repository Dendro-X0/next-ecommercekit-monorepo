"use client"

import { AlertTriangle, Download, Shield, ShieldCheck } from "lucide-react"
import Image from "next/image"
import { type ReactElement, useId, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClientHelpers } from "@/lib/auth-client-helpers"

interface TwoFactorSettingsProps {
  readonly isEnabled: boolean
  readonly backupCodes?: readonly string[]
}

/**
 * TwoFactorSettings provides a thin client-side UI to enable/disable 2FA.
 * It uses Better Auth client methods and avoids server actions.
 */
export function TwoFactorSettings({
  isEnabled: initialEnabled,
  backupCodes: initialBackupCodes,
}: TwoFactorSettingsProps): ReactElement {
  const [isEnabled, setIsEnabled] = useState<boolean>(initialEnabled)
  const [backupCodes, setBackupCodes] = useState<string[]>(Array.from(initialBackupCodes ?? []))
  const [qrCode, setQrCode] = useState<string>("")
  const [showSetupDialog, setShowSetupDialog] = useState<boolean>(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState<boolean>(false)
  const [password, setPassword] = useState<string>("")
  const [error, setError] = useState<string | undefined>(undefined)
  const [loading, setLoading] = useState<boolean>(false)
  const uid = useId()
  const passwordId = `${uid}-password`

  // Note: error reset is handled in the password onChange handler to avoid unnecessary dependencies.

  const downloadBackupCodes = (): void => {
    const content = backupCodes.join("\n")
    const blob = new Blob([content], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "backup-codes.txt"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleEnable2FA = async (): Promise<void> => {
    setLoading(true)
    setError(undefined)
    const { data, error: err } = await authClientHelpers.twoFactorEnable({ password })
    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    // Best-effort extraction of QR/backup codes if provided by server
    const payload = data as unknown
    const maybeQr =
      payload &&
      typeof payload === "object" &&
      "qrCode" in (payload as Record<string, unknown>) &&
      typeof (payload as { qrCode?: unknown }).qrCode === "string"
        ? (payload as { qrCode: string }).qrCode
        : ""
    const maybeCodes =
      payload &&
      typeof payload === "object" &&
      "backupCodes" in (payload as Record<string, unknown>) &&
      Array.isArray((payload as { backupCodes?: unknown }).backupCodes) &&
      (payload as { backupCodes: unknown[] }).backupCodes.every((x) => typeof x === "string")
        ? (payload as { backupCodes: string[] }).backupCodes
        : []
    setQrCode(maybeQr)
    setBackupCodes(maybeCodes)
    setShowPasswordDialog(false)
    setShowSetupDialog(true)
    setIsEnabled(true)
    setPassword("")
  }

  const handleDisable2FA = async (): Promise<void> => {
    setLoading(true)
    setError(undefined)
    const { error: err } = await authClientHelpers.twoFactorDisable({ password })
    setLoading(false)
    if (err) {
      setError(err.message)
      return
    }
    setIsEnabled(false)
    setBackupCodes([])
    setPassword("")
    setShowPasswordDialog(false)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {isEnabled ? (
                  <ShieldCheck className="h-5 w-5 text-green-600" />
                ) : (
                  <Shield className="h-5 w-5" />
                )}
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your account with two-factor authentication
              </CardDescription>
            </div>
            <Badge variant={isEnabled ? "default" : "secondary"}>
              {isEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Two-factor authentication adds an additional layer of security to your account by
              requiring more than just a password to sign in.
            </p>

            <div className="flex gap-2">
              {!isEnabled ? (
                <Button onClick={() => setShowPasswordDialog(true)}>Enable 2FA</Button>
              ) : (
                <Button variant="destructive" onClick={() => setShowPasswordDialog(true)}>
                  Disable 2FA
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {isEnabled && backupCodes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-600" />
              Backup Codes
            </CardTitle>
            <CardDescription>
              Save these backup codes in a safe place. You can use them to access your account if
              you lose your authenticator device.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Each backup code can only be used once. Generate new codes if you've used most of
                them.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-2 p-4 bg-muted rounded-lg font-mono text-sm">
              {backupCodes.map((code) => (
                <div key={`code-${code}`} className="p-2 bg-background rounded border">
                  {code}
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={downloadBackupCodes}>
                <Download className="h-4 w-4 mr-2" />
                Download Codes
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Your Password</DialogTitle>
            <DialogDescription>
              For your security, please enter your password to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={passwordId}>Password</Label>
              <Input
                id={passwordId}
                name="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError(undefined)
                }}
                required
              />
            </div>
            <div className="flex gap-2">
              {!isEnabled ? (
                <Button className="w-full" disabled={loading} onClick={handleEnable2FA}>
                  Enable 2FA
                </Button>
              ) : (
                <Button
                  className="w-full"
                  variant="destructive"
                  disabled={loading}
                  onClick={handleDisable2FA}
                >
                  Disable 2FA
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSetupDialog} onOpenChange={setShowSetupDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Set up Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan this QR code with your authenticator app. You'll be asked for a code on your next
              login.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {qrCode && (
              <div className="flex justify-center">
                <div className="flex justify-center">
                  <Image
                    src={`data:image/svg+xml;utf8,${encodeURIComponent(qrCode)}`}
                    alt="2FA QR Code"
                    className="border rounded-lg"
                    width={192}
                    height={192}
                    unoptimized
                    priority
                  />
                </div>
              </div>
            )}
            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                After scanning, close this dialog. Your setup is complete.
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
