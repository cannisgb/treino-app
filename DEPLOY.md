# Pôr a app de treino em produção — passo a passo

Tempo estimado: 45–60 min. Exemplo de endereço usado neste guia: **treino.looksignature.pt** (troca pelo que escolheres).

## Regra de ouro: zero recursos partilhados com o looksignature.pt

| Recurso | Look Signature (não tocar) | App de treino (novo) |
|---|---|---|
| Código | repo `cannisgb/looksignature` | repo **novo** `cannisgb/treino-app` |
| Alojamento | projeto Railway `looksignature` | projeto Railway **novo** `treino-app` |
| Base de dados | Postgres do projeto looksignature | Postgres **novo**, dentro do projeto treino-app |
| Segredo das sessões | `NEXTAUTH_SECRET` do site | `NEXTAUTH_SECRET` **novo** |
| Email | API key Resend do site | API key Resend **nova** |
| Ficheiros (R2) | bucket do site | **nenhum** (esta versão não guarda ficheiros) |
| IA (Anthropic) | chave do site | **nenhuma** (o gerador de planos funciona por regras) |
| DNS | `www` → Railway (site) | só **um registo novo**: `treino` |

Porque não há conflito:
- **Projeto Railway separado:** variáveis, base de dados e deploys não se misturam. Um erro na app nunca reinicia o site.
- **Cookies de sessão:** os cookies do NextAuth ficam presos ao endereço exato (`www.looksignature.pt` ≠ `treino.looksignature.pt`). Com segredos diferentes, uma sessão de um site nunca é aceite no outro.
- **DNS:** acrescentas apenas um registo com o nome `treino`. Os registos `www`, de email (MX) e do Resend ficam exatamente como estão.

---

## Passo 0 — Antes de começar

1. Decide o **nome da app**, que aparece no ícone do telemóvel, e o **endereço**: um subdomínio como `treino.looksignature.pt` ou um domínio próprio.
2. Pede ao teu treinador o **email** que ele vai usar. Esse email passa a ser automaticamente a conta de treinador.
3. Gera um segredo novo para as sessões. No PowerShell:
   ```powershell
   [Convert]::ToBase64String((1..32 | % { Get-Random -Max 256 }))
   ```
   Guarda o resultado (é o `NEXTAUTH_SECRET`). **Não** uses o do Look Signature.

## Passo 1 — Repositório novo no GitHub

1. Descompacta `treino-app.zip` no Ambiente de trabalho. Fica uma pasta `treino-app`, ao lado da pasta do site e não dentro dela.
2. Em github.com → **New repository** → nome `treino-app`, **Private**, sem README. Clica em **Create**.
3. Na pasta `treino-app`, abre o terminal (botão direito → *Abrir no Terminal*) e corre:
   ```bash
   git init
   git add .
   git commit -m "Primeira versão da app de treino"
   git branch -M main
   git remote add origin https://github.com/cannisgb/treino-app.git
   git push -u origin main
   ```
   Confirma que o comando `git remote` tem **treino-app** e não looksignature.

## Passo 2 — Projeto novo no Railway

1. railway.com → **New Project** → **Deploy from GitHub repo** → escolhe `cannisgb/treino-app`.
   > Atenção: tem de ser **New Project**. Não uses “+ New” dentro do projeto looksignature.
2. Dentro deste projeto novo: **+ New → Database → PostgreSQL**. Fica um serviço `Postgres` só desta app.
3. O primeiro deploy pode falhar por ainda não haver variáveis. É normal.

## Passo 3 — Variáveis (serviço da app → *Variables* → *Raw Editor*)

```
DATABASE_URL=${{Postgres.DATABASE_URL}}
NEXTAUTH_SECRET=<o segredo novo do passo 0>
NEXTAUTH_URL=https://treino.looksignature.pt
TRAINER_EMAIL=<email do treinador>
NEXT_PUBLIC_APP_NAME=<nome da app>
```

- `${{Postgres.DATABASE_URL}}` liga à base de dados **deste** projeto. Confirma que o nome do serviço é `Postgres`.
- Emails (opcional, ver passo 6): `RESEND_API_KEY`, `RESEND_FROM_EMAIL`.
- **Não copies** variáveis do projeto looksignature.

## Passo 4 — Criar as tabelas automaticamente em cada deploy

Serviço da app → **Settings → Deploy → Pre-deploy Command**:
```
npx prisma db push --skip-generate
```
Depois disto, carrega em **Deploy** (ou faz *Redeploy*). Nos *Deploy Logs* deve aparecer “Your database is now in sync with your Prisma schema” e depois “Ready”.

Se a tua conta Railway não mostrar esse campo, faz assim: abre o separador **Console** do serviço depois do deploy, corre `npx prisma db push` uma vez e repete sempre que o ficheiro `schema.prisma` mudar.

## Passo 5 — Endereço (domínio)

1. Serviço da app → **Settings → Networking → Custom Domain** → escreve `treino.looksignature.pt`. O Railway mostra o(s) registo(s) a criar, normalmente um **CNAME** e às vezes um **TXT** de verificação.
2. Na amen.pt → gestão de DNS de looksignature.pt → **Adicionar registo**:
   - Tipo **CNAME**, nome **treino**, destino = o valor que o Railway mostrou.
   - Se o Railway pedir um TXT, acrescenta-o tal como ele indica.
   - **Não alteres nem apagues** nenhum registo existente (`www`, MX, `resend._domainkey`, SPF, DMARC).
3. Aguarda que o Railway mostre o domínio como verificado e com certificado. Costuma demorar de minutos a algumas horas.
4. Confirma que o `NEXTAUTH_URL` é exatamente `https://treino.looksignature.pt`, sem `/` no fim.

> Sem domínio ainda? Usa o endereço `*.up.railway.app` que o Railway gera (**Settings → Networking → Generate Domain**), mete-o no `NEXTAUTH_URL` e troca quando o domínio estiver pronto.

## Passo 6 — Emails (opcional, recomendado)

Servem para a recuperação de password e para o aviso “tens um plano novo”.
1. resend.com → **API Keys → Create API Key** → nome `treino-app`, permissão **Sending access**, domínio `looksignature.pt`.
   - O domínio já está verificado pelo site, por isso **não são precisos registos DNS novos**.
   - Usa uma chave **nova**, não a do site. Se for preciso, revogas uma sem afetar a outra.
2. No Railway (app de treino), acrescenta:
   ```
   RESEND_API_KEY=<chave nova>
   RESEND_FROM_EMAIL=<Nome da app> <treino@looksignature.pt>
   ```

## Passo 7 — Primeiras contas

A ordem importa:
1. O **treinador** abre o endereço → **Criar conta** com o email de `TRAINER_EMAIL`. Fica treinador automaticamente.
2. **Tu** crias a tua conta. Ficas automaticamente associado a esse treinador.
   - Alternativa: o treinador vai a *Clientes → Adicionar cliente*. A app gera uma password temporária, que tens de mudar na primeira entrada.
3. Se alguém ficou com o papel errado: Railway → Console → `npm run make-trainer -- email@exemplo.com`.

## Passo 8 — Instalar no telemóvel

- **Android (tu):** abre o endereço no Chrome → menu ⋮ → **Instalar app** (ou “Adicionar ao ecrã principal”).
- **iPhone (treinador):** Safari → botão Partilhar → **Adicionar ao ecrã principal**. A área do treinador também funciona no computador.

## Passo 9 — Verificação final (10 min)

- [ ] O site **www.looksignature.pt** continua a abrir normalmente, e o login de cliente de lá funciona.
- [ ] O treinador entra e vê *Clientes*, e tu apareces na lista.
- [ ] Em **Medidas**, escolhes a referência e registas peso, pulso (ou anca) e as outras medidas. O radar aparece em *Corpo*.
- [ ] O treinador regista uma sessão. O botão **PT | EN** muda os nomes dos exercícios na hora, e a carga e o 1RM aparecem.
- [ ] Em *Força* e *Evolução* aparecem os dados da sessão.
- [ ] O treinador gera e **publica** um plano, que aparece no teu separador *Plano*.
- [ ] “Esqueceste a password?” envia o email (se configuraste o Resend).

## Atualizações futuras

Alteras o código na pasta `treino-app` e corres `git add . && git commit -m "..." && git push`. O Railway volta a fazer o deploy sozinho e o *pre-deploy* atualiza as tabelas. O site Look Signature não é afetado.

## Voltar atrás

Railway → serviço da app → **Deployments** → no deploy anterior, **⋮ → Redeploy**.
