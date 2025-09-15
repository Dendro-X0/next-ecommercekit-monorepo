"use client"

import { useState } from "react"
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
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                value={user.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                value={user.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={user.email}
              onChange={(e) => handleChange("email", e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
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
              <Label htmlFor="newsletter">Newsletter</Label>
              <p className="text-sm text-muted-foreground">
                Receive updates about new products and offers
              </p>
            </div>
            <Switch
              id="newsletter"
              checked={user.preferences.newsletter}
              onCheckedChange={(checked) => handlePreferenceChange("newsletter", checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="notifications">Push Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Get notified about order updates and promotions
              </p>
            </div>
            <Switch
              id="notifications"
              checked={user.preferences.notifications}
              onCheckedChange={(checked) => handlePreferenceChange("notifications", checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
