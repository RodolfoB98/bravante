# Lista de Presença — Treinamentos (Grupo Bravante)

App de controle de presença de treinamentos. O **líder** cria treinamentos; o **participante** se inscreve e assina a presença no próprio celular; ao final, o líder baixa a **lista oficial FRC-014** preenchida com nomes, funções, empresas e assinaturas — idêntica ao formulário padrão.

Stack: **Next.js 15** (App Router) + **Supabase** (banco, login, dados) + **docxtemplater** (geração do .docx). Pronto para **GitHub + Vercel**.

---

## 1. Pré-requisitos
- Node.js 18.18+ (recomendado 20+)
- Conta no [Supabase](https://supabase.com) e no [Vercel](https://vercel.com)

## 2. Criar o projeto no Supabase
1. Crie um novo projeto no Supabase.
2. Vá em **SQL Editor**, cole todo o conteúdo de `supabase/migrations/0001_init.sql` e clique em **Run**. Isso cria as tabelas (`profiles`, `treinamentos`, `inscricoes`), a segurança por perfil (RLS) e o gatilho que cria o perfil no primeiro login.
3. Em **Project Settings → API**, copie **Project URL** e a chave **anon public**.

## 3. Configurar variáveis de ambiente
Copie `.env.example` para `.env.local` e preencha:
```
NEXT_PUBLIC_SUPABASE_URL=https://SEU-PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua-anon-key
```

## 4. Rodar localmente
```bash
npm install
npm run dev
```
Abra http://localhost:3000.

## 5. Configurar o login (Supabase Auth)
O login é por **link mágico** (sem senha). Em **Authentication → URL Configuration**:
- **Site URL**: `http://localhost:3000` (e depois a URL do Vercel)
- **Redirect URLs**: adicione `http://localhost:3000/**` e `https://SEU-APP.vercel.app/**`

> O e-mail embutido do Supabase é limitado (poucos por hora). Para produção, configure um **SMTP próprio** em Authentication → Emails.

## 6. Definir o primeiro líder
Todo mundo entra como **participante** por padrão. Para promover alguém a **líder**, depois que a pessoa fizer login uma vez, rode no SQL Editor:
```sql
update public.profiles set role = 'lider' where email = 'lider@bravante.com.br';
```

## 7. Deploy no Vercel
1. Suba o projeto no GitHub (`git init`, commit, push).
2. No Vercel, **Import** o repositório.
3. Em **Environment Variables**, adicione as duas variáveis do passo 3.
4. Deploy. Depois, volte ao passo 5 e adicione a URL do Vercel nas Redirect URLs do Supabase.

---

## Como funciona
- **Líder** (`/treinamentos`): cria treinamentos, acompanha quem se inscreveu e assinou, muda o status (Aberto → Em andamento → Encerrado) e baixa a lista oficial.
- **Participante** (`/disponiveis`): vê os treinamentos abertos, se inscreve escolhendo a **função** (lista padrão + campo livre "Outra"), e faz o **check-in assinando** na tela.
- **Lista oficial** (`/api/treinamentos/[id]/lista`): gera o `.docx` no formato FRC-014 com todos que já assinaram. Só o líder que criou o treinamento consegue baixar.

## Decisões técnicas
- **Assinatura guardada como imagem (base64) no próprio registro de inscrição**, no banco do Supabase. Evita a complexidade de permissão de arquivos em storage. Para volumes grandes, dá para migrar para o Supabase Storage depois.
- **Template oficial corrigido**: as tabelas flutuantes do .docx original (que estouravam a margem no Word) foram convertidas para fluxo normal, então o documento renderiza igual em Word e LibreOffice. O molde fica em `lib/templates/lista_presenca.docx`.
- **Segurança por perfil (RLS)** no banco: participante só enxerga as próprias inscrições; líder só os treinamentos que criou.

## Estrutura
```
app/
  login/                 # login por link mágico
  auth/                  # callback e logout
  (app)/
    inicio/              # painel por perfil
    treinamentos/        # líder: criar, listar, detalhe, gerar lista
    disponiveis/         # participante: inscrever-se
    checkin/[id]/        # participante: assinar
  api/treinamentos/[id]/lista/   # gera o .docx oficial
components/              # prancheta de assinatura, formulários
lib/
  gerarLista.ts          # gerador do FRC-014
  actions.ts             # ações de servidor (inscrever, assinar, etc.)
  funcoes.ts             # lista de funções + campo livre
  supabase/              # clients e middleware de sessão
  templates/             # template .docx oficial corrigido
supabase/migrations/     # esquema do banco (SQL)
```
