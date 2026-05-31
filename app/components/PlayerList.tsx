'use client'

type Props = {

  adventurers: string[] | null

}

export default function PlayerList({

  adventurers,

}: Props) {

  return (

    <div className="mt-4 border-t border-white/10 pt-4">

      <p className="text-sm text-[#e9e2d6]/70">
        Aventureros ligados al juramento
      </p>

      <div className="mt-3 space-y-2">

        {adventurers?.length ? (

          adventurers.map((name) => (

            <div
              key={name}
              className="rounded-lg border border-red-900/20 bg-red-950/10 px-3 py-2 text-sm text-[#f2ead8]"
            >
              {name}
            </div>

          ))

        ) : (

          <p className="text-sm text-[#e9e2d6]/50">
            Nadie ha aceptado esta misión todavía.
          </p>

        )}

      </div>

    </div>

  )

}