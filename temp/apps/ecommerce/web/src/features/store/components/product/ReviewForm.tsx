import { StarIcon } from "lucide-react"
import { useState } from "react"
import type { FormEvent } from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

export function ReviewForm({
  onSubmit,
}: {
  onSubmit: (payload: { rating: number; title: string; review: string }) => void
}) {
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState("")
  const [review, setReview] = useState("")

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit({ rating, title, review })
    setTitle("")
    setReview("")
    setRating(5)
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 rounded-[1.8rem] border border-border/60 bg-card p-5">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Rating</Label>
          <div className="flex items-center gap-2 rounded-[1rem] border border-border/70 bg-background/60 px-3 py-3">
            {Array.from({ length: 5 }, (_, index) => {
              const value = index + 1
              const active = value <= rating

              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className="rounded-full p-1 transition hover:scale-105"
                  aria-label={`Rate ${value} star${value > 1 ? "s" : ""}`}
                >
                  <StarIcon
                    className={cn(
                      "size-5 transition",
                      active ? "fill-amber-400 text-amber-400" : "text-muted-foreground/35",
                    )}
                  />
                </button>
              )
            })}
            <span className="ml-2 text-sm text-muted-foreground">{rating} of 5</span>
          </div>
        </div>
        <div className="space-y-2">
          <Label>Title</Label>
          <Input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Short headline"
          />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Review</Label>
        <Textarea
          value={review}
          onChange={(event) => setReview(event.target.value)}
          rows={4}
          placeholder="Share your buying experience"
        />
      </div>
      <div className="flex justify-end">
        <Button type="submit" className="rounded-full px-5">
          Submit review
        </Button>
      </div>
    </form>
  )
}
