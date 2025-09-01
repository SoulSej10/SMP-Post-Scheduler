"use client"

import { useState, useEffect } from "react"
import { Check, ChevronsUpDown, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { getSessionUser, getUserCompanies, switchUserCompany, getCompanyById } from "@/lib/storage"
import type { Company } from "@/lib/types"

type Props = {
  onCompanyChange?: (companyId: string) => void
  className?: string
}

export default function CompanySelector({ onCompanyChange, className }: Props) {
  const [open, setOpen] = useState(false)
  const [companies, setCompanies] = useState<Company[]>([])
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadCompanies()
  }, [])

  const loadCompanies = () => {
    const user = getSessionUser()
    if (!user) return

    const userCompanies = getUserCompanies(user.id)
    setCompanies(userCompanies)

    // Set current company
    if (user.currentCompanyId) {
      const current = getCompanyById(user.currentCompanyId)
      setCurrentCompany(current)
    } else if (userCompanies.length > 0) {
      // Auto-select first company if none selected
      const firstCompany = userCompanies[0]
      setCurrentCompany(firstCompany)
      handleCompanySwitch(firstCompany.id)
    }
  }

  const handleCompanySwitch = async (companyId: string) => {
    const user = getSessionUser()
    if (!user) return

    setLoading(true)

    // Simulate async operation
    setTimeout(() => {
      const success = switchUserCompany(user.id, companyId)
      if (success) {
        const company = getCompanyById(companyId)
        setCurrentCompany(company)
        onCompanyChange?.(companyId)
      }
      setLoading(false)
      setOpen(false)
    }, 200)
  }

  if (companies.length === 0) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">No companies</span>
      </div>
    )
  }

  if (companies.length === 1) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">{currentCompany?.name}</span>
      </div>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("justify-between min-w-[200px]", className)}
          disabled={loading}
        >
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            {currentCompany ? <span className="truncate">{currentCompany.name}</span> : "Select company..."}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0">
        <Command>
          <CommandInput placeholder="Search companies..." />
          <CommandList>
            <CommandEmpty>No companies found.</CommandEmpty>
            <CommandGroup>
              {companies.map((company) => (
                <CommandItem
                  key={company.id}
                  value={company.name}
                  onSelect={() => handleCompanySwitch(company.id)}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <div className="flex flex-col">
                      <span className="font-medium">{company.name}</span>
                      {company.description && (
                        <span className="text-xs text-muted-foreground truncate">{company.description}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {company.ownerId === getSessionUser()?.id && (
                      <Badge variant="secondary" className="text-xs">
                        Owner
                      </Badge>
                    )}
                    <Check className={cn("h-4 w-4", currentCompany?.id === company.id ? "opacity-100" : "opacity-0")} />
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
