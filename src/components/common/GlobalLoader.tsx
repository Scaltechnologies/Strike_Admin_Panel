import { BrandLoader } from '@/components/brand/BrandLoader'

export function GlobalLoader() {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-background">
      <BrandLoader label="Strike Admin" />
    </div>
  )
}
