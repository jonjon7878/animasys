# animasys

Acervo de animações em HTML e CSS, separado por app. Quem entra vê as animações rodando e copia o código.
Só o administrador (joaogvalim@gmail.com) adiciona apps e animações e libera quem pede convite.

## Como funciona

- **Site** (`site/`): uma página só (`index.html`), sem etapa de build. Hospedado como site estático no Render.
- **Banco e login**: Supabase. O login confere a senha no servidor; as regras de acesso (RLS) garantem que:
  - quem não entrou não vê nada;
  - quem pediu convite e ainda não foi liberado não vê nada;
  - usuários liberados só leem e copiam;
  - só o admin grava (animações, apps, logos, acessos).
- **E-mails** (Resend, disparados pelo próprio banco):
  - quando alguém pede convite e confirma o e-mail, chega um aviso em **jnautomacoes@gmail.com**;
  - quando o admin libera, a pessoa recebe "Seu acesso ao animasys foi liberado".
- **Páginas de demonstração** (`site/site-ipc/`, `site/myrunning/`): as páginas completas usadas no passo "Na página".
  Ficam como arquivos públicos do site.

## Pôr no ar (uma vez)

### 1. Supabase
1. Em [supabase.com](https://supabase.com), crie o projeto **animasys**. Região: São Paulo.
2. **SQL Editor → New query**: cole `supabase/schema.sql` e clique em **Run**. Depois faça o mesmo com `supabase/seed.sql`,
   que traz as 16 animações e os 2 apps do acervo antigo.
3. **Authentication → Sign In / Providers → Email**: deixe **Confirm email** ligado.
   Isso impede que alguém se cadastre com o e-mail de outra pessoa, inclusive o do admin.
4. **Authentication → URL Configuration**:
   - Site URL: `https://animasys.com`
   - Redirect URLs: `https://animasys.com/**`, `https://www.animasys.com/**` e `https://animasys.onrender.com/**`
5. **Project Settings → API**: anote a **Project URL** e a chave **anon public**. Elas vão para o Render.

### 2. Resend (e-mails)
1. Em [resend.com](https://resend.com) → **Domains**, adicione `animasys.com` e crie no seu registrador os registros DNS que ele mostrar.
2. **API Keys → Create**: crie uma chave.
3. No **SQL Editor** do Supabase, rode trocando a chave:
   ```sql
   select vault.create_secret('re_SUA_CHAVE', 'resend_api_key');
   select vault.create_secret('animasys <avisos@animasys.com>', 'email_remetente');
   ```
4. Recomendado: **Authentication → Emails → SMTP Settings** no Supabase, para os e-mails de confirmação
   e de "esqueci a senha" também saírem pelo Resend (o envio padrão do Supabase é bem limitado):
   host `smtp.resend.com`, porta `465`, usuário `resend`, senha = a chave do Resend, remetente `avisos@animasys.com`.

### 3. Render
1. **New → Blueprint**, escolha o repositório **animasys**. O Render lê o `render.yaml`.
2. Preencha `SUPABASE_URL` e `SUPABASE_ANON_KEY` com os valores do passo 1.5 e confirme.
3. Quando terminar, o site abre em `https://animasys.onrender.com`.

### 4. Domínio animasys.com
1. No Render, abra o serviço **animasys → Settings → Custom Domains**. `animasys.com` e `www.animasys.com` já aparecem listados.
2. No painel onde você comprou o domínio, crie os registros que o Render mostrar. Normalmente são:
   - `A` em `animasys.com` apontando para o IP informado pelo Render;
   - `CNAME` em `www` apontando para `animasys.onrender.com`.
3. O certificado HTTPS sai sozinho quando o DNS propagar (de minutos a algumas horas).

### 5. Primeiro acesso
Abra o site, clique em **Pedir convite** e use **joaogvalim@gmail.com**. Confirme o e-mail pelo link que chegar.
Essa conta vira administradora sozinha. As outras pessoas pedem convite pelo site e você libera em **Acessos**.

## Rodar no computador
Copie `site/config.example.js` para `site/config.js` e preencha. Depois rode `python3 -m http.server 8000 --directory site`
e abra `http://localhost:8000`. Adicione `http://localhost:8000/**` nas Redirect URLs do Supabase se for testar os e-mails.
