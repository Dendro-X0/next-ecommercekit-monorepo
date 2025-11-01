"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Edit, MapPin, Plus, Trash2 } from "lucide-react"
import type React from "react"
import { memo, useCallback, useId, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  addressesApi,
  type CreateAddressInput,
  type UpdateAddressInput,
} from "@/lib/data/addresses"
import type { Address } from "@/types/address"

const ADDRESS_QK = ["account", "addresses"] as const

type AddressFormProps = {
  formData: Partial<Address>
  onChange: (patch: Partial<Address>) => void
  onSubmit: () => void
  onCancel: () => void
  isEditing: boolean
}

const AddressForm = memo(function AddressForm({
  formData,
  onChange,
  onSubmit,
  onCancel,
  isEditing,
}: AddressFormProps) {
  const uid = useId()
  const fid = (name: string): string => `${uid}-${name}`
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={fid("firstName")}>First Name</Label>
          <Input
            id={fid("firstName")}
            value={formData.firstName || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange({ firstName: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={fid("lastName")}>Last Name</Label>
          <Input
            id={fid("lastName")}
            value={formData.lastName || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange({ lastName: e.target.value })
            }
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={fid("address")}>Address</Label>
        <Input
          id={fid("address")}
          value={formData.address || ""}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            onChange({ address: e.target.value })
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={fid("city")}>City</Label>
          <Input
            id={fid("city")}
            value={formData.city || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange({ city: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={fid("state")}>State</Label>
          <Input
            id={fid("state")}
            value={formData.state || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange({ state: e.target.value })
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={fid("zipCode")}>ZIP Code</Label>
          <Input
            id={fid("zipCode")}
            value={formData.zipCode || ""}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              onChange({ zipCode: e.target.value })
            }
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={fid("country")}>Country</Label>
          <Select value={formData.country} onValueChange={(value) => onChange({ country: value })}>
            <SelectTrigger id={fid("country")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="United States">United States</SelectItem>
              <SelectItem value="Canada">Canada</SelectItem>
              <SelectItem value="United Kingdom">United Kingdom</SelectItem>
              <SelectItem value="Australia">Australia</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor={fid("type")}>Address Type</Label>
          <Select
            value={formData.type}
            onValueChange={(value) => onChange({ type: value as "shipping" | "billing" })}
          >
            <SelectTrigger id={fid("type")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="shipping">Shipping</SelectItem>
              <SelectItem value="billing">Billing</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id={fid("isDefault")}
            checked={!!formData.isDefault}
            onCheckedChange={(checked) => onChange({ isDefault: checked })}
          />
          <Label htmlFor={fid("isDefault")}>Set as default address</Label>
        </div>
      </div>

      <div className="flex gap-2 pt-4">
        <Button onClick={onSubmit} className="flex-1">
          {isEditing ? "Update Address" : "Add Address"}
        </Button>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
})

export function AddressSettings() {
  const [isAddingAddress, setIsAddingAddress] = useState(false)
  const [editingAddress, setEditingAddress] = useState<Address | null>(null)
  const [formData, setFormData] = useState<Partial<Address>>({
    type: "shipping",
    country: "United States",
    isDefault: false,
  })
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ADDRESS_QK, queryFn: addressesApi.list })
  const addresses = (data?.items ?? []) as Address[]

  type AddressesList = { items: Address[] }
  const updateCache = (mapper: (items: Address[]) => Address[]): void => {
    queryClient.setQueryData<AddressesList | undefined>(ADDRESS_QK, (prev) => {
      const items = prev?.items ?? []
      return { ...(prev ?? {}), items: mapper(items) }
    })
  }

  const handleFormChange = useCallback((patch: Partial<Address>): void => {
    setFormData((prev) => ({ ...prev, ...patch }))
  }, [])

  const createMutation = useMutation({
    mutationFn: async (input: CreateAddressInput) => addressesApi.create(input),
    onSuccess: (created) => {
      updateCache((items) => {
        const cleared = created.isDefault ? items.map((a) => ({ ...a, isDefault: false })) : items
        return [...cleared, created]
      })
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ADDRESS_QK })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: UpdateAddressInput }) =>
      addressesApi.update(id, patch),
    onMutate: async ({ id, patch }) => {
      const previous = queryClient.getQueryData<AddressesList>(ADDRESS_QK)
      updateCache((items) =>
        items
          .map((a) => (a.id === id ? ({ ...a, ...patch } as Address) : a))
          .map((a) => ({ ...a, isDefault: patch.isDefault ? a.id === id : a.isDefault })),
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(ADDRESS_QK, ctx.previous)
    },
    onSuccess: (updated) => {
      updateCache((items) =>
        items
          .map((a) => (a.id === updated.id ? updated : a))
          .map((a) => ({ ...a, isDefault: updated.isDefault ? a.id === updated.id : a.isDefault })),
      )
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ADDRESS_QK })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => addressesApi.remove(id),
    onMutate: async (id) => {
      const previous = queryClient.getQueryData<AddressesList>(ADDRESS_QK)
      updateCache((items) => items.filter((a) => a.id !== id))
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(ADDRESS_QK, ctx.previous)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ADDRESS_QK })
    },
  })

  const setDefaultMutation = useMutation({
    mutationFn: async (id: string) => addressesApi.setDefault(id),
    onMutate: async (id) => {
      const previous = queryClient.getQueryData<AddressesList>(ADDRESS_QK)
      updateCache((items) => items.map((a) => ({ ...a, isDefault: a.id === id })))
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.previous) queryClient.setQueryData(ADDRESS_QK, ctx.previous)
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ADDRESS_QK })
    },
  })

  const _saving =
    createMutation.isPending ||
    updateMutation.isPending ||
    deleteMutation.isPending ||
    setDefaultMutation.isPending

  const handleAddAddress = async () => {
    if (
      formData.firstName &&
      formData.lastName &&
      formData.address &&
      formData.city &&
      formData.state &&
      formData.zipCode
    ) {
      const input: CreateAddressInput = {
        type: (formData.type as "shipping" | "billing") ?? "shipping",
        firstName: formData.firstName,
        lastName: formData.lastName,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country || "United States",
        isDefault: !!formData.isDefault,
      }
      await createMutation.mutateAsync(input)
      setFormData({ type: "shipping", country: "United States", isDefault: false })
      setIsAddingAddress(false)
    }
  }

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address)
    setFormData(address)
  }

  const handleUpdateAddress = async () => {
    if (
      editingAddress &&
      formData.firstName &&
      formData.lastName &&
      formData.address &&
      formData.city &&
      formData.state &&
      formData.zipCode
    ) {
      const patch: UpdateAddressInput = {
        type: (formData.type as "shipping" | "billing") ?? editingAddress.type,
        firstName: formData.firstName,
        lastName: formData.lastName,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country || editingAddress.country,
        isDefault: !!formData.isDefault,
      }
      await updateMutation.mutateAsync({ id: editingAddress.id, patch })
      setEditingAddress(null)
      setFormData({ type: "shipping", country: "United States", isDefault: false })
    }
  }

  const handleDeleteAddress = async (addressId: string) => {
    await deleteMutation.mutateAsync(addressId)
  }

  const handleSetDefault = async (addressId: string) => {
    await setDefaultMutation.mutateAsync(addressId)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Address Book</h2>
          <p className="text-muted-foreground">Manage your shipping and billing addresses</p>
        </div>
        <Dialog open={isAddingAddress} onOpenChange={setIsAddingAddress}>
          <DialogTrigger>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Address
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Address</DialogTitle>
            </DialogHeader>
            <AddressForm
              formData={formData}
              onChange={handleFormChange}
              onSubmit={handleAddAddress}
              onCancel={() => {
                setIsAddingAddress(false)
                setFormData({ type: "shipping", country: "United States", isDefault: false })
              }}
              isEditing={false}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {isLoading
          ? null
          : addresses.map((address) => (
              <Card key={address.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <Badge variant={address.type === "shipping" ? "default" : "secondary"}>
                          {address.type}
                        </Badge>
                        {address.isDefault && <Badge variant="outline">Default</Badge>}
                      </div>

                      <div>
                        <p className="font-medium">
                          {address.firstName} {address.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">{address.address}</p>
                        <p className="text-sm text-muted-foreground">
                          {address.city}, {address.state} {address.zipCode}
                        </p>
                        <p className="text-sm text-muted-foreground">{address.country}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {!address.isDefault && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(address.id)}
                        >
                          Set Default
                        </Button>
                      )}

                      <Dialog
                        open={editingAddress?.id === address.id}
                        onOpenChange={(open) => {
                          if (!open) {
                            setEditingAddress(null)
                            setFormData({
                              type: "shipping",
                              country: "United States",
                              isDefault: false,
                            })
                          }
                        }}
                      >
                        <DialogTrigger>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditAddress(address)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Edit Address</DialogTitle>
                          </DialogHeader>
                          <AddressForm
                            formData={formData}
                            onChange={handleFormChange}
                            onSubmit={handleUpdateAddress}
                            onCancel={() => {
                              setEditingAddress(null)
                              setFormData({
                                type: "shipping",
                                country: "United States",
                                isDefault: false,
                              })
                            }}
                            isEditing={true}
                          />
                        </DialogContent>
                      </Dialog>

                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteAddress(address.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

        {!isLoading && addresses.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No addresses saved</h3>
              <p className="text-muted-foreground mb-4">
                Add your first address to make checkout faster and easier.
              </p>
              <Button onClick={() => setIsAddingAddress(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Address
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
