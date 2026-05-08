import { SiteFooter } from '@/features/website/components/site-footer'
import { SiteHeader } from '@/features/website/components/site-header'

export default function WebsiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-screen flex-1 flex-col overflow-hidden bg-background">
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  )
}
