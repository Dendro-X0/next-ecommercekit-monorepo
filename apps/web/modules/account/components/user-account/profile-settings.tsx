"use client"

import { Camera, Plus, Save, Trash2 } from "lucide-react"
import { useId, useState } from "react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { useAuthStore } from "@/lib/stores/auth"
import type { Address, User } from "@/lib/types/auth"

export function ProfileSettings() {
  const { user, updateUser } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<User>(user || ({} as User))
  const uid = useId()
  const idFirst = `${uid}-firstName`
  const idLast = `${uid}-lastName`
  const idEmail = `${uid}-email`
  const idPhone = `${uid}-phone`
  const id2fa = `${uid}-twoFactor`
  const idEmailNotifs = `${uid}-emailNotifications`
  const idNewsletter = `${uid}-newsletter`
  const idTheme = `${uid}-theme`
  const idLanguage = `${uid}-language`

  if (!user) return null

  const handleSave = () => {
    updateUser(formData)
    setIsEditing(false)
  }

  const handleChange = (field: keyof User, value: string | boolean) => {
    setFormData((prev: User) => ({ ...prev, [field]: value }))
  }

  const handlePreferenceChange = (field: keyof User["preferences"], value: string | boolean) => {
    setFormData((prev: User) => ({
      ...prev,
      preferences: { ...prev.preferences, [field]: value },
    }))
  }

  return (
    <div className="space-y-6">
      {/* Profile Picture & Basic Info */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Profile Information</CardTitle>
          <Button
            variant={isEditing ? "default" : "outline"}
            onClick={isEditing ? handleSave : () => setIsEditing(true)}
          >
            {isEditing ? (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            ) : (
              "Edit Profile"
            )}
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={formData.avatar || "/placeholder.svg"} />
              <AvatarFallback className="text-lg">
                {formData.firstName?.[0]}
                {formData.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            {isEditing && (
              <Button variant="outline" size="sm">
                <Camera className="h-4 w-4 mr-2" />
                Change Photo
              </Button>
            )}
          </div>

          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={idFirst}>First Name</Label>
              <Input
                id={idFirst}
                value={formData.firstName || ""}
                onChange={(e) => handleChange("firstName", e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={idLast}>Last Name</Label>
              <Input
                id={idLast}
                value={formData.lastName || ""}
                onChange={(e) => handleChange("lastName", e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor={idEmail}>Email</Label>
              <div className="flex items-center gap-2">
                <Input
                  id={idEmail}
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) => handleChange("email", e.target.value)}
                  disabled={!isEditing}
                />
                {formData.emailVerified ? (
                  <Badge variant="default" className="shrink-0">
                    Verified
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="shrink-0">
                    Unverified
                  </Badge>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor={idPhone}>Phone</Label>
              <Input
                id={idPhone}
                value={formData.phone || ""}
                onChange={(e) => handleChange("phone", e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor={id2fa}>Two-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id={id2fa}
                checked={formData.twoFactorEnabled}
                onCheckedChange={(checked) => handleChange("twoFactorEnabled", checked)}
              />
              {formData.twoFactorEnabled && <Badge variant="default">Enabled</Badge>}
            </div>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label>Password</Label>
              <p className="text-sm text-muted-foreground">Last updated 30 days ago</p>
            </div>
            <Button variant="outline" size="sm">
              Change Password
            </Button>
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
              <Label htmlFor={idEmailNotifs}>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive updates about orders and promotions
              </p>
            </div>
            <Switch
              id={idEmailNotifs}
              checked={formData.preferences?.notifications}
              onCheckedChange={(checked) => handlePreferenceChange("notifications", checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor={idNewsletter}>Newsletter</Label>
              <p className="text-sm text-muted-foreground">
                Get the latest news and product updates
              </p>
            </div>
            <Switch
              id={idNewsletter}
              checked={formData.preferences?.newsletter}
              onCheckedChange={(checked) => handlePreferenceChange("newsletter", checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor={idTheme}>Theme</Label>
              <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
            </div>
            <Select
              value={formData.preferences?.theme}
              onValueChange={(value) => handlePreferenceChange("theme", value)}
            >
              <SelectTrigger id={idTheme} className="w-32" aria-labelledby={idTheme}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor={idLanguage}>Language</Label>
              <p className="text-sm text-muted-foreground">Select your preferred language</p>
            </div>
            <Select
              value={formData.preferences?.language}
              onValueChange={(value) => handlePreferenceChange("language", value)}
            >
              <SelectTrigger id={idLanguage} className="w-32" aria-labelledby={idLanguage}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
                <SelectItem value="de">German</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Addresses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Saved Addresses</CardTitle>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Add Address
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {formData.addresses?.map((address: Address) => (
              <div key={address.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant={address.type === "shipping" ? "default" : "secondary"}>
                        {address.type}
                      </Badge>
                      {address.isDefault && <Badge variant="outline">Default</Badge>}
                    </div>
                    <p className="font-medium">
                      {address.firstName} {address.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{address.address}</p>
                    <p className="text-sm text-muted-foreground">
                      {address.city}, {address.state} {address.zipCode}
                    </p>
                    <p className="text-sm text-muted-foreground">{address.country}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" className="text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
