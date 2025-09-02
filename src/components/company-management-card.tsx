"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { Building2, Edit, Trash2, Plus, Users, UserPlus, Mail, Crown, Shield, Eye, X } from "lucide-react"
import {
  getSessionUser,
  getUserCompanies,
  switchUserCompany,
  getCompanyMembers,
  addCompanyMember,
  removeCompanyMember,
  updateCompanyMember,
} from "@/lib/storage"
import type { Company, CompanyMember } from "@/lib/types"
import CreateCompanyModal from "@/components/create-company-modal"

export default function CompanyManagementCard() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [currentCompanyId, setCurrentCompanyId] = useState<string | null>(null)
  const [editingCompany, setEditingCompany] = useState<Company | null>(null)
  const [deletingCompany, setDeletingCompany] = useState<Company | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [showAddMemberModal, setShowAddMemberModal] = useState(false)
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null)
  const [companyMembers, setCompanyMembers] = useState<CompanyMember[]>([])
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [newMemberEmail, setNewMemberEmail] = useState("")
  const [newMemberName, setNewMemberName] = useState("")
  const [newMemberRole, setNewMemberRole] = useState<CompanyMember["role"]>("member")
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

  const loadCompanyMembers = (companyId: string) => {
    const members = getCompanyMembers(companyId)
    setCompanyMembers(members)
  }

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company)
    setEditName(company.name)
    setEditDescription(company.description || "")
  }

  const handleSaveEdit = () => {
    if (!editingCompany || !editName.trim()) return

    setLoading(true)

    setTimeout(() => {
      const updatedCompany = {
        ...editingCompany,
        name: editName.trim(),
        description: editDescription.trim(),
      }

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

    setTimeout(() => {
      setCompanies((prev) => prev.filter((c) => c.id !== deletingCompany.id))

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

  const handleManageMembers = (company: Company) => {
    setSelectedCompany(company)
    loadCompanyMembers(company.id)
    setShowMembersModal(true)
  }

  const handleAddMember = () => {
    if (!selectedCompany || !newMemberEmail.trim() || !newMemberName.trim()) return

    setLoading(true)

    setTimeout(() => {
      addCompanyMember(selectedCompany.id, newMemberEmail.trim(), newMemberName.trim(), newMemberRole)
      loadCompanyMembers(selectedCompany.id)
      setNewMemberEmail("")
      setNewMemberName("")
      setNewMemberRole("member")
      setShowAddMemberModal(false)
      setLoading(false)
    }, 500)
  }

  const handleRemoveMember = (memberId: string) => {
    if (!selectedCompany) return

    setLoading(true)

    setTimeout(() => {
      removeCompanyMember(selectedCompany.id, memberId)
      loadCompanyMembers(selectedCompany.id)
      setLoading(false)
    }, 300)
  }

  const handleUpdateMemberRole = (memberId: string, newRole: CompanyMember["role"]) => {
    if (!selectedCompany) return

    setLoading(true)

    setTimeout(() => {
      updateCompanyMember(selectedCompany.id, memberId, { role: newRole })
      loadCompanyMembers(selectedCompany.id)
      setLoading(false)
    }, 300)
  }

  const getRoleIcon = (role: CompanyMember["role"]) => {
    switch (role) {
      case "owner":
        return <Crown className="h-3 w-3 text-yellow-600" />
      case "admin":
        return <Shield className="h-3 w-3 text-blue-600" />
      case "member":
        return <Users className="h-3 w-3 text-green-600" />
      case "viewer":
        return <Eye className="h-3 w-3 text-gray-600" />
      default:
        return <Users className="h-3 w-3 text-gray-600" />
    }
  }

  const getRoleBadgeVariant = (role: CompanyMember["role"]) => {
    switch (role) {
      case "owner":
        return "default"
      case "admin":
        return "secondary"
      case "member":
        return "outline"
      case "viewer":
        return "secondary"
      default:
        return "outline"
    }
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
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleManageMembers(company)}
                      disabled={loading}
                      className="text-blue-600 hover:text-blue-700"
                    >
                      <Users className="h-4 w-4" />
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

      <Dialog open={showMembersModal} onOpenChange={setShowMembersModal}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Manage Members - {selectedCompany?.name}
            </DialogTitle>
            <DialogDescription>
              Add, remove, and manage member roles for your company. Members can be invited to collaborate on posts and
              projects.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Company Members</Label>
                <p className="text-sm text-muted-foreground">
                  {companyMembers.length} member{companyMembers.length !== 1 ? "s" : ""} total
                </p>
              </div>
              <Button onClick={() => setShowAddMemberModal(true)} size="sm" className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Add Member
              </Button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto">
              {companyMembers.map((member) => (
                <div key={member.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-8 h-8 bg-muted rounded-full">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{member.name}</span>
                        <Badge variant={getRoleBadgeVariant(member.role)} className="text-xs flex items-center gap-1">
                          {getRoleIcon(member.role)}
                          {member.role}
                        </Badge>
                        {member.status === "pending" && (
                          <Badge variant="outline" className="text-xs">
                            Pending
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{member.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Invited {new Date(member.invitedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {member.role !== "owner" && (
                      <Select
                        value={member.role}
                        onValueChange={(value: CompanyMember["role"]) => handleUpdateMemberRole(member.id, value)}
                        disabled={loading}
                      >
                        <SelectTrigger className="w-24 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="member">Member</SelectItem>
                          <SelectItem value="viewer">Viewer</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    {member.role !== "owner" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={loading}
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {companyMembers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm">No members yet</p>
                <p className="text-xs">Add members to collaborate on your company's content</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showAddMemberModal} onOpenChange={setShowAddMemberModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>
              Invite a new member to join your company. They'll receive an invitation to collaborate.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="member-name">Full Name</Label>
              <Input
                id="member-name"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                placeholder="John Doe"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-email">Email Address</Label>
              <Input
                id="member-email"
                type="email"
                value={newMemberEmail}
                onChange={(e) => setNewMemberEmail(e.target.value)}
                placeholder="john@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="member-role">Role</Label>
              <Select value={newMemberRole} onValueChange={(value: CompanyMember["role"]) => setNewMemberRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-600" />
                      <div>
                        <div className="font-medium">Admin</div>
                        <div className="text-xs text-muted-foreground">Can manage members and settings</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="member">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-green-600" />
                      <div>
                        <div className="font-medium">Member</div>
                        <div className="text-xs text-muted-foreground">Can create and edit posts</div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="viewer">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-gray-600" />
                      <div>
                        <div className="font-medium">Viewer</div>
                        <div className="text-xs text-muted-foreground">Can only view content</div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddMemberModal(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handleAddMember} disabled={loading || !newMemberEmail.trim() || !newMemberName.trim()}>
              {loading ? "Adding..." : "Add Member"}
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

      <CreateCompanyModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
        onCompanyCreated={handleCompanyCreated}
      />
    </>
  )
}
