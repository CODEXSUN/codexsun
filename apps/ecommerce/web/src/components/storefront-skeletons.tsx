import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function StorefrontHeroSkeleton() {
  return (
    <section className="grid min-h-[420px] gap-6 overflow-hidden rounded-[2.4rem] border border-[#e6d8c8] bg-[linear-gradient(135deg,#f0e6da,#fbf7f1)] p-6 xl:h-[520px] xl:grid-cols-[minmax(0,1fr)_minmax(320px,520px)]">
      <div className="flex flex-col justify-center space-y-5">
        <Skeleton className="h-8 w-32 rounded-full bg-white/55" />
        <div className="space-y-3">
          <Skeleton className="h-12 w-4/5 rounded-xl bg-white/60" />
          <Skeleton className="h-12 w-3/5 rounded-xl bg-white/50" />
        </div>
        <Skeleton className="h-6 w-2/3 rounded-lg bg-white/45" />
        <Skeleton className="h-10 w-56 rounded-full bg-white/65" />
      </div>
      <div className="hidden items-center justify-center xl:flex">
        <Skeleton className="h-[480px] w-full max-w-[520px] rounded-[2rem] bg-white/55" />
      </div>
    </section>
  )
}

export function StorefrontSectionHeadingSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-24 rounded-full" />
      <Skeleton className="h-10 w-72 rounded-xl" />
      <Skeleton className="h-5 w-[32rem] max-w-full rounded-lg" />
    </div>
  )
}

export function StorefrontProductCardSkeleton() {
  return (
    <Card className="overflow-hidden rounded-[2rem] border border-[#ece2d4] py-0">
      <Skeleton className="aspect-[4/4.75] w-full rounded-none bg-[linear-gradient(135deg,#f3eadf,#fbf7f2)]" />
      <CardContent className="space-y-4 p-6">
        <Skeleton className="h-3 w-20 rounded-full" />
        <Skeleton className="h-7 w-4/5 rounded-lg" />
        <Skeleton className="h-4 w-full rounded-lg" />
        <Skeleton className="h-4 w-2/3 rounded-lg" />
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-7 w-24 rounded-lg" />
          <Skeleton className="h-4 w-12 rounded-lg" />
        </div>
        <Skeleton className="h-12 w-full rounded-full" />
      </CardContent>
    </Card>
  )
}

export function StorefrontCategoryCardSkeleton() {
  return (
    <Card className="overflow-hidden rounded-[1.8rem] py-0">
      <Skeleton className="aspect-[16/10] w-full rounded-none" />
      <CardContent className="space-y-3 p-5">
        <Skeleton className="h-3 w-24 rounded-full" />
        <Skeleton className="h-6 w-40 rounded-lg" />
        <Skeleton className="h-4 w-3/4 rounded-lg" />
      </CardContent>
    </Card>
  )
}

export function StorefrontCatalogSkeleton() {
  return (
    <div className="space-y-8">
      <StorefrontSectionHeadingSkeleton />
      <Card className="rounded-[2rem] border-[#e3d5c6] bg-white/85 py-0 shadow-[0_26px_55px_-42px_rgba(48,31,19,0.28)]">
        <CardContent className="grid gap-5 p-5">
          <Skeleton className="h-14 w-full rounded-[1.6rem]" />
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_auto]">
            <Skeleton className="h-12 w-full rounded-full" />
            <Skeleton className="h-12 w-full rounded-full" />
            <Skeleton className="h-12 w-full rounded-full" />
            <Skeleton className="h-12 w-28 rounded-full" />
          </div>
        </CardContent>
      </Card>
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <StorefrontProductCardSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}

export function StorefrontProductPageSkeleton() {
  return (
    <div className="space-y-8">
      <section className="grid gap-8 xl:grid-cols-[1fr_0.95fr]">
        <div className="grid gap-4">
          <Skeleton className="aspect-[4/4.7] w-full rounded-[2.2rem]" />
          <div className="grid gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="aspect-square w-full rounded-[1.3rem]" />
            ))}
          </div>
        </div>
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
            <Skeleton className="h-4 w-28 rounded-full" />
            <Skeleton className="h-12 w-3/4 rounded-xl" />
            <Skeleton className="h-5 w-full rounded-lg" />
            <Skeleton className="h-5 w-5/6 rounded-lg" />
            <Skeleton className="h-8 w-40 rounded-lg" />
          </div>
          <Card className="rounded-[1.8rem] py-0">
            <CardContent className="space-y-4 p-5">
              <Skeleton className="h-10 w-full rounded-full" />
              <Skeleton className="h-12 w-full rounded-full" />
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  )
}
