import Link from "next/link";
import { requirePageUser } from "@/lib/guards";
import { loadAthlete } from "@/lib/athleteData";
import { exName, isLang } from "@/lib/catalog";
import { formatEntry } from "@/lib/measure";
import DeleteSessionButton from "@/components/DeleteSessionButton";

export default async function ClientSessions({ params }: { params: { id: string } }) {
  const trainer = await requirePageUser("TRAINER");
  const a = await loadAthlete(params.id);
  const lang = isLang(trainer.catalogLang) ? trainer.catalogLang : "pt";
  const base = `/treinador/clientes/${params.id}`;
  const sessions = [...a.sessions].reverse();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <div className="font-mono text-xs text-muted">{sessions.length} sessões · mais recentes primeiro</div>
          <h2 className="h-display mt-1 text-4xl">Sessões</h2>
        </div>
      </div>
      {sessions.length === 0 && <p className="text-sm text-muted">Sem sessões registadas.</p>}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(340px,1fr))] gap-3">
        {sessions.map((s) => (
          <article key={s.id} className="card flex flex-col p-4">
            <div className="mb-2 flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">
                  {s.title || "Sessão"}
                  {s.kind === "teste" && <span className="ml-2 rounded bg-lime px-1.5 py-0.5 font-mono text-[10px] text-ground">TESTE RM</span>}
                </div>
                <div className="font-mono text-xs text-muted">
                  {s.date.toLocaleDateString("pt-PT", { weekday: "short", day: "numeric", month: "short", year: "numeric" })} · {s.entries.length} exercícios
                </div>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <Link href={`${base}/sessoes/${s.id}`} className="btn-ghost min-h-0 px-3 py-1.5 text-xs">Editar</Link>
                <DeleteSessionButton id={s.id} />
              </div>
            </div>
            {[...s.entries]
              .sort((x, y) => x.order - y.order)
              .map((e) => (
                <div key={e.id} className="flex justify-between gap-3 border-t border-line/60 py-1.5 text-sm">
                  <span>{exName(e.exerciseId, lang)}</span>
                  <span className="whitespace-nowrap font-mono text-xs text-muted">{formatEntry(e)}</span>
                </div>
              ))}
          </article>
        ))}
      </div>
    </div>
  );
}
