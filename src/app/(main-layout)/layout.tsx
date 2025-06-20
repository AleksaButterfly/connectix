import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Header />
      <main className="relative flex-1">{children}</main>
      <Footer />
    </>
  )
}
