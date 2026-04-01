import { Link, Outlet } from 'react-router-dom'
import { BrandMark } from '@/shared/branding/brand-mark'

export function AuthLayout() {
  return (
    <div className="page-frame min-h-dvh px-4 py-4 sm:py-6">
      <div className="mx-auto flex min-h-[calc(100dvh-2rem)] max-w-lg flex-col justify-start sm:min-h-[calc(100dvh-3rem)] sm:justify-center">
        <div className="mb-5 flex justify-center sm:mb-7">
          <Link to="/" className="inline-flex">
            <BrandMark className="flex-col items-center gap-4 text-center" />
          </Link>
        </div>
        <div className="w-full">
          <Outlet />
        </div>
      </div>
    </div>
  )
}

