# Treino — app de acompanhamento (cliente + treinador)

PWA em Next.js 14 + Prisma/PostgreSQL + NextAuth. Foi criada a partir da base técnica do Look Signature, mas é um projeto **totalmente independente**: repositório, base de dados, segredos, chaves e domínio próprios.

## O que faz

**Cliente (telemóvel, instalável no Android e no iPhone)**
- **Corpo**: radar das proporções face ao ideal (McCallum a partir do pulso; referência feminina a partir da anca), nota geral e prioridades.
- **Força**: nível por exercício (iniciante → elite) a partir do 1RM estimado ÷ peso corporal, e equilíbrio entre exercícios.
- **Evolução**: índice por exercício (1.ª sessão = 100), 1RM, melhor série e séries por grupo nos últimos 7 dias.
- **Plano**: o plano publicado pelo treinador.

**Treinador (web)**
- Clientes: lista, adicionar (cria conta com password temporária ou associa uma existente).
- Registo de sessão: grupo → exercício (221 exercícios), séries, reps, carga pré-preenchida com a última vez, 1RM em tempo real, sugestões.
- **Catálogo PT/EN**: botão PT | EN no registo de sessão, no gerador de plano e no catálogo. Muda os nomes no momento e fica guardado como preferência.
- Gerador de plano: objetivo, dias (2–6), duração; cargas a partir do histórico; grupos em atraso reforçados; editável antes de publicar.

## Estrutura

```
prisma/schema.prisma        base de dados (fonte de verdade)
prisma/promote-trainer.ts   npm run make-trainer -- email
src/data/catalog.json       catálogo (221 exercícios PT/EN), padrões de força, equilíbrios
src/lib/metrics.ts          1RM, proporções, níveis, equilíbrio, progressão
src/lib/plan.ts             gerador de planos
src/lib/suggestions.ts      sugestões do registo de sessão
src/app/app/*               ecrãs do cliente
src/app/treinador/*         ecrãs do treinador
src/app/api/*               API
public/sw.js, src/app/manifest.ts   PWA
```

## Correr localmente

```bash
cp .env.example .env      # e preenche
npm install
npx prisma db push
npm run dev               # http://localhost:3000
```

Para pôr em produção, ver **DEPLOY.md**.
