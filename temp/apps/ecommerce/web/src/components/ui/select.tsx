import * as React from 'react'

export function Select(props: React.PropsWithChildren<{ value?: string; onValueChange?: (value: string) => void }>) {
  return <>{props.children}</>
}

export function SelectGroup({
  children,
}: React.PropsWithChildren) {
  return <>{children}</>
}

export function SelectValue({
  children,
}: React.PropsWithChildren) {
  return <>{children}</>
}

export function SelectTrigger({
  children,
}: React.PropsWithChildren<{ className?: string }>) {
  return <>{children}</>
}

export function SelectContent({
  children,
}: React.PropsWithChildren<{ className?: string }>) {
  return <>{children}</>
}

export function SelectLabel({
  children,
}: React.PropsWithChildren) {
  return <>{children}</>
}

export function SelectItem({
  children,
}: React.PropsWithChildren<{ value: string; className?: string }>) {
  return <>{children}</>
}

export function SelectSeparator() {
  return null
}

export function SelectScrollUpButton() {
  return null
}

export function SelectScrollDownButton() {
  return null
}
