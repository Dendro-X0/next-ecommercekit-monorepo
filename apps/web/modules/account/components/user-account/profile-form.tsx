"use client"

import { useId, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { mockUser } from "@/lib/data/mock"
import type { User } from "@/types/user"

export function ProfileForm() {
  const [user, setUser] = useState<User>(mockUser)
  const [isEditing, setIsEditing] = useState(false)
  const uid = useId()
  const idFirst = `${uid}-firstName`
  const idLast = `${uid}-lastName`
  const idEmail = `${uid}-email`
  const idPhone = `${uid}-phone`
  const idNewsletter = `${uid}-newsletter`
  const idNotifications = `${uid}-notifications`

  const handleSave = () => {
    // Save user data
    setIsEditing(false)
  }

  const handleChange = (field: keyof User, value: string) => {
    setUser((prev) => ({ ...prev, [field]: value }))
  }

  const handlePreferenceChange = (field: keyof User["preferences"], value: boolean) => {
    setUser((prev) => ({
      ...prev,
      preferences: { ...prev.preferences, [field]: value },
    }))
  }

  return (
    <div className="space-y-6">
      {/* Personal Information */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Personal Information</CardTitle>
          <Button
            variant={isEditing ? "default" : "outline"}
            onClick={isEditing ? handleSave : () => setIsEditing(true)}
          >
            {isEditing ? "Save Changes" : "Edit Profile"}
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor={idFirst}>First Name</Label>
              <Input
                id={idFirst}
                value={user.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor={idLast}>Last Name</Label>
              <Input
                id={idLast}
                value={user.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div>
            <Label htmlFor={idEmail}>Email</Label>
            <Input
              id={idEmail}
              type="email"
              value={user.email}
              onChange={(e) => handleChange("email", e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div>
            <Label htmlFor={idPhone}>Phone</Label>
            <Input
              id={idPhone}
              value={user.phone || ""}
              onChange={(e) => handleChange("phone", e.target.value)}
              disabled={!isEditing}
            />
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor={idNewsletter}>Newsletter</Label>
              <p className="text-sm text-muted-foreground">
                Receive updates about new products and offers
              </p>
            </div>
            <Switch
              id={idNewsletter}
              checked={user.preferences.newsletter}
              onCheckedChange={(checked) => handlePreferenceChange("newsletter", checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor={idNotifications}>Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about order updates and promotions
              </p>
            </div>
            <Switch
              id={idNotifications}
              checked={user.preferences.notifications}
              onCheckedChange={(checked) => handlePreferenceChange("notifications", checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
