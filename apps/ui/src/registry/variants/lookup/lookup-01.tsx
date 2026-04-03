"use client"

import { useState } from "react"

import { SearchableLookupField } from "@/features/forms/searchable-lookup-field"

const options = [
  { label: "Tamil Nadu", value: "state:tn" },
  { label: "Karnataka", value: "state:ka" },
  { label: "Kerala", value: "state:kl" },
  { label: "Telangana", value: "state:ts" },
  { label: "Maharashtra", value: "state:mh" },
]

export default function Lookup01() {
  const [value, setValue] = useState("state:tn")

  return (
    <div className="w-full max-w-sm space-y-3 rounded-xl border border-border/70 bg-background p-4">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">State Lookup</p>
        <p className="text-xs text-muted-foreground">
          Compact autocomplete lookup with inline search and create action.
        </p>
      </div>
      <SearchableLookupField
        value={value}
        options={options}
        placeholder="Select state"
        searchPlaceholder="Search state"
        createActionLabel="Create new state"
        onValueChange={setValue}
        onCreateNew={() => undefined}
      />
    </div>
  )
}
