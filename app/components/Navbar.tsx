import UserAccountMenu from './UserAccountMenu'
import type { Profile, User } from '@/lib/types'

type NavbarProps = {
  user: User | null
  profile: Profile | null
  isAdmin: boolean
  menuOpen: boolean
  setMenuOpen: (value: boolean) => void
  setProfile: (value: Profile | null) => void
  setUser: (value: User | null) => void
}

export default function Navbar({
  user,
  profile,
  isAdmin,
  menuOpen,
  setMenuOpen,
  setProfile,
  setUser,
}: NavbarProps) {
  return (
    <header className="relative mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-6">
      <div className="flex items-center gap-3">
        <div className="h-9 w-9 rounded-md border border-red-700/60 bg-red-950/30 shadow-[0_0_22px_rgba(220,38,38,0.25)]" />

        <div className="leading-tight">
          <p className="text-xs uppercase tracking-[0.28em] text-red-200/80">
            Relicario
          </p>

          <p className="text-sm text-[#e9e2d6]/90">Crónicas del Continente</p>
        </div>
      </div>

      <nav className="hidden items-center gap-6 md:flex">
        <a
          className="text-sm text-[#e9e2d6]/80 transition hover:text-[#fff]"
          href="#misiones"
        >
          Misiones
        </a>

        <a
          className="text-sm text-[#e9e2d6]/80 transition hover:text-[#fff]"
          href="#cronicas"
        >
          Crónicas
        </a>

        <a
          className="text-sm text-[#e9e2d6]/80 transition hover:text-[#fff]"
          href="#aventureros"
        >
          Aventureros
        </a>
      </nav>

      <UserAccountMenu
        user={user}
        profile={profile}
        isAdmin={isAdmin}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        setUser={setUser}
        setProfile={setProfile}
      />
    </header>
  )
}
