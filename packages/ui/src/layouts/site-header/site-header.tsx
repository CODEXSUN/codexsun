import { useState } from 'react'
import { cn } from '../../lib/utils'
import { AnnouncementBar } from './announcement-bar'
import { CategoryStrip } from './category-strip'
import { MainNavbar } from './main-navbar'
import { MobileDrawer } from './mobile-drawer'
import type { SiteHeaderProps } from './site-header-types'

export function SiteHeader({
  actions,
  announcement,
  brand,
  categories = [],
  className,
  links = [],
  onCategorySelect,
  showCategories = true,
  sticky = true,
}: SiteHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header
      className={cn(
        'w-full flex flex-col z-40 transition-shadow',
        sticky && 'sticky top-0 bg-background/90 backdrop-blur-md border-b border-border/70 shadow-2xs',
        className,
      )}
    >
      {/* 1. Top Announcement Bar */}
      {announcement && <AnnouncementBar {...announcement} />}

      {/* 2. Primary Navigation Bar */}
      <MainNavbar
        actions={actions}
        brand={brand}
        links={links}
        onOpenMobileMenu={() => setMobileMenuOpen(true)}
      />

      {/* 3. Sub-navigation Category Strip */}
      {showCategories && categories.length > 0 && (
        <CategoryStrip categories={categories} onSelect={onCategorySelect} />
      )}

      {/* 4. Responsive Mobile Drawer */}
      <MobileDrawer
        actions={actions}
        brand={brand}
        categories={categories}
        isOpen={mobileMenuOpen}
        links={links}
        onClose={() => setMobileMenuOpen(false)}
      />
    </header>
  )
}
