"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Building2, Edit, Trash2, Plus, Users } from "lucide-react"
import { getSessionUser, getUserCompanies, switchUserCompany } from "@/lib/storage"
import type { Company } from "@/lib/types"
import CreateCompanyModal from "@/components/create-company-modal"

export default function CompanyManagementCard() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = () => {
    const user = getSessionUser()
    if (!user) return

    const userCompanies = getUserCompanies(user.id)
    setCompanies(userCompanies)
    setCurrentCompanyId(user.currentCompanyId || null)
  }

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company)
    setEditName(company.name)
    setEditDescription(company.description || "")
  }

  const handleSaveEdit = () => {
    if (!editingCompany || !editName.trim()) return

    setLoading(true)

    // Simulate async operation
    setTimeout(() => {
      // Update company in storage (would need to implement updateCompany function)
      const updatedCompany = {
        ...editingCompany,
        name: editName.trim(),
        description: editDescription.trim(),
      }

      // For now, just update local state
      setCompanies((prev) => prev.map((c) => (c.id === editingCompany.id ? updatedCompany : c)))

      setEditingCompany(null)
      setEditName("")
      setEditDescription("")
      setLoading(false)
    }, 500)
  }

  const handleDeleteCompany = (company: Company) => {
    setDeletingCompany(company)
  }

  const handleConfirmDelete = () => {
    if (!deletingCompany) return

    setLoading(true)

    // Simulate async operation
    setTimeout(() => {
      // Remove company from storage (would need to implement deleteCompany function)
      setCompanies((prev) => prev.filter((c) => c.id !== deletingCompany.id))

      // If deleting current company, switch to first available
      if (deletingCompany.id === currentCompanyId && companies.length > 1) {
        const remainingCompanies = companies.filter((c) => c.id !== deletingCompany.id)
        if (remainingCompanies.length > 0) {
          const user = getSessionUser()
          if (user) {
            switchUserCompany(user.id, remainingCompanies[0].id)
            setCurrentCompanyId(remainingCompanies[0].id)
          }
        }
      }

      setDeletingCompany(null)
      setLoading(false)
    }, 500)
  }

  const handleCompanyCreated = (companyId: string) => {
    loadCompanies()
    setShowCreateModal(false)
  }

  const handleSwitchCompany = (companyId: string) => {
    const user = getSessionUser()
    if (!user) return

    setLoading(true)

    setTimeout(() => {
      switchUserCompany(user.id, companyId)
      setCurrentCompanyId(companyId)
      setLoading(false)
    }, 300)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Management
          </CardTitle>
          <CardDescription>
            Manage your companies, switch between workspaces, and organize your social media accounts.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Your Companies</Label>
              <p className="text-sm text-muted-foreground">
                {companies.length} {companies.length === 1 ? "company" : "companies"} total
              </p>
            </div>
            <Button onClick={() => setShowCreateModal(true)} size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Add Company
            </Button>
          </div>

          <div className="space-y-3">
            {companies.map((company) => (
              <div
                key={company.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{company.name}</span>
                      {company.id === currentCompanyId && (
                        <Badge variant="default" className="text-xs">
                          Current
                        </Badge>
                      )}
                      {company.ownerId === getSessionUser()?.id && (
                        <Badge variant="secondary" className="text-xs">
                          Owner
                        </Badge>
                      )}
                    </div>
                    {company.description && <p className="text-sm text-muted-foreground">{company.description}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      <Users className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {company.members?.length || 1} member{(company.members?.length || 1) !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {company.id !== currentCompanyId && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSwitchCompany(company.id)}
                      disabled={loading}
                    >
                      Switch
                    </Button>
                  )}
                  {company.ownerId === getSessionUser()?.id && (
                    <>
                      <Button variant="ghost" size="sm" onClick={() => handleEditCompany(company)} disabled={loading}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {companies.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCompany(company)}
                          disabled={loading}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>

          {companies.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm">No companies found</p>
              <p className="text-xs">Create your first company to get started</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Company Dialog */}
      <Dialog open={!!editingCompany} onOpenChange={() => setEditingCompany(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Company</DialogTitle>
            <DialogDescription>Update your company information and settings.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Company Name</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Enter company name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Brief description (optional)"
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCompany(null)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleSaveEdit} disabled={loading || !editName.trim()}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Company Dialog */}
      <AlertDialog open={!!deletingCompany} onOpenChange={() => setDeletingCompany(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Company</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingCompany?.name}"? This action cannot be undone and will
              permanently remove all associated posts and data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Deleting..." : "Delete Company"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Company Modal */}
      <CreateCompanyModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCompanyCreated={handleCompanyCreated}
      />
    </>
  )
}
