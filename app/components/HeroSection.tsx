type HeroSectionProps = {

}

export default function HeroSection(
    props: HeroSectionProps
  ) {
  
    return (
        <>
        
<section className="relative mx-auto w-full max-w-6xl px-6 pb-12 pt-2">
<div className="grid gap-10 lg:grid-cols-12 lg:items-center">
  <div className="lg:col-span-7">
    <div className="inline-flex items-center gap-3 rounded-full border border-red-800/40 bg-red-950/20 px-4 py-2 shadow-[0_0_24px_rgba(220,38,38,0.25)]">
      <span className="h-2 w-2 rounded-full bg-red-400 shadow-[0_0_18px_rgba(248,113,113,0.9)]" />
      <p className="text-xs uppercase tracking-[0.26em] text-red-100/80">
        Oscuridad de Noctherra
      </p>
    </div>

    <h1 className="mt-6 font-serif text-6xl font-semibold tracking-wide text-[#f2ead8] drop-shadow-sm sm:text-7xl">
      NOCTHERRA
    </h1>

    <p className="mt-4 max-w-xl text-base leading-relaxed text-[#e9e2d6]/85 sm:text-lg">
      El continente recuerda a quienes sobreviven.
    </p>

    <div className="mt-8 flex flex-wrap items-center gap-4">
      <a
        href="#misiones"
        className="rounded-md border border-red-700/70 bg-red-950/30 px-5 py-3 text-sm font-medium text-[#f7f0dc] shadow-[0_0_24px_rgba(220,38,38,0.25)] transition hover:bg-red-900/25"
      >
        Ver el tablero de misiones
      </a>
      <a
        href="#adventureres"
        className="rounded-md border border-[#e9e2d6]/15 bg-[#0a0a0a]/20 px-5 py-3 text-sm font-medium text-[#e9e2d6]/80 transition hover:border-red-700/40 hover:text-[#f2ead8]"
      >
        Conocer leyendas
      </a>
    </div>

    <div className="mt-7 grid gap-3 sm:grid-cols-2">
      <div className="rounded-lg border border-red-800/30 bg-black/20 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-red-200/70">Juramento</p>
        <p className="mt-1 text-sm text-[#e9e2d6]/85">Sólo la voluntad abre puertas.</p>
      </div>
      <div className="rounded-lg border border-[#e9e2d6]/10 bg-black/20 p-4">
        <p className="text-xs uppercase tracking-[0.2em] text-red-200/60">Sombra</p>
        <p className="mt-1 text-sm text-[#e9e2d6]/85">Cada paso deja una crónica.</p>
      </div>
    </div>
  </div>










</div>

{/* Parches tipo pergamino */}
<div className="mt-10 hidden h-10 w-full items-center justify-center lg:flex">
  <div className="h-px w-full bg-gradient-to-r from-transparent via-red-700/30 to-transparent" />
</div>
</section>

  </>
)
}