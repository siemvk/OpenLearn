"use client"

import * as React from "react"
import { Popover, PopoverContent, PopoverTrigger } from "./popover"
import { Button } from "./button"
import { Calendar } from "lucide-react"
import { format } from "date-fns"
import { DayPicker } from "react-day-picker"
import "react-day-picker/dist/style.css"

interface DatePickerProps {
  value?: Date | undefined | null
  onSelect?: (date: Date | undefined) => void
  placeholder?: string
}

export function DatePicker({ value, onSelect, placeholder = "Kies een datum" }: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [selected, setSelected] = React.useState<Date | undefined | null>(value ?? undefined)

  React.useEffect(() => {
    setSelected(value ?? undefined)
  }, [value])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="w-[160px] justify-between">
          <span>{selected ? format(selected, "yyyy-MM-dd") : placeholder}</span>
          <Calendar className="ml-2 h-4 w-4 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-[140]" align="start">
        <DayPicker
          mode="single"
          selected={selected ?? undefined}
          onSelect={(d: Date | undefined | null) => {
            const dt = d ?? undefined
            setSelected(dt)
            if (onSelect) onSelect(dt)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
