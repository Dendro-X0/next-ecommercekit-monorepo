"use client"

import { Bell } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { preferencesApi } from "@/lib/data/preferences"

export default function NotificationsPage() {
  const [newsletter, setNewsletter] = useState<boolean>(false)
  const [notifications, setNotifications] = useState<boolean>(false)
  const [smsUpdates, setSmsUpdates] = useState<boolean>(false)
  const [saving, setSaving] = useState<boolean>(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const prefs = await preferencesApi.get()
        if (!cancelled) {
          setNewsletter(prefs.newsletter)
          setNotifications(prefs.notifications)
          setSmsUpdates(prefs.smsUpdates)
        }
      } catch {
        // swallow; UI stays with defaults
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>Choose how you want to be notified</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Email Notifications</Label>
                <p className="text-sm text-muted-foreground">
                  Receive order updates and promotions via email
                </p>
              </div>
              <Switch checked={notifications} onCheckedChange={setNotifications} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Newsletter</Label>
                <p className="text-sm text-muted-foreground">
                  Get the latest news and exclusive offers
                </p>
              </div>
              <Switch checked={newsletter} onCheckedChange={setNewsletter} />
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>SMS Updates</Label>
                <p className="text-sm text-muted-foreground">
                  Receive order updates via text message
                </p>
              </div>
              <Switch checked={smsUpdates} onCheckedChange={setSmsUpdates} />
            </div>
          </div>
          <Button
            disabled={saving}
            onClick={async () => {
              setSaving(true)
              try {
                const updated = await preferencesApi.update({
                  newsletter,
                  notifications,
                  smsUpdates,
                })
                setNewsletter(updated.newsletter)
                setNotifications(updated.notifications)
                setSmsUpdates(updated.smsUpdates)
              } finally {
                setSaving(false)
              }
            }}
          >
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
