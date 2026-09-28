-- animasys: banco no Supabase.
-- Rode este arquivo uma vez no SQL Editor do projeto (Supabase > SQL Editor > New query > colar > Run).
-- Depois rode o seed.sql, que traz as animações e os apps do acervo antigo.

create extension if not exists pg_net with schema extensions;

-- ------------------------------------------------------------------
-- Tabelas
-- ------------------------------------------------------------------

-- Um perfil por pessoa cadastrada no login (auth.users).
-- status: pendente (pediu convite) -> liberado | recusado; removido = acesso cortado depois.
create table if not exists public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  nome text not null default '',
  mensagem text not null default '',
  papel text not null default 'usuario' check (papel in ('usuario', 'admin')),
  status text not null default 'pendente' check (status in ('pendente', 'liberado', 'recusado', 'removido')),
  criado_em timestamptz not null default now(),
  decidido_em timestamptz
);

-- Animações e apps guardam o documento inteiro em "dados" (mesmo formato do acervo antigo).
create table if not exists public.animacoes (
  id text primary key,
  dados jsonb not null,
  atualizado_em timestamptz not null default now()
);

create table if not exists public.sistemas (
  id text primary key,
  dados jsonb not null,
  atualizado_em timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- Quem é quem
-- ------------------------------------------------------------------

create or replace function public.eh_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfis where id = auth.uid() and papel = 'admin' and status = 'liberado');
$$;

create or replace function public.eh_liberado() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from perfis where id = auth.uid() and status = 'liberado');
$$;

-- ------------------------------------------------------------------
-- E-mails (Resend, direto do banco)
-- A chave fica no Vault, nunca no código:
--   select vault.create_secret('re_SUA_CHAVE', 'resend_api_key');
--   select vault.create_secret('animasys <avisos@animasys.com>', 'email_remetente');
-- Sem a chave, nada é enviado e o resto funciona normalmente.
-- ------------------------------------------------------------------

create or replace function public.esc(t text) returns text
language sql immutable as $$
  select replace(replace(replace(replace(coalesce(t, ''), '&', '&amp;'), '<', '&lt;'), '>', '&gt;'), '"', '&quot;');
$$;

create or replace function public.enviar_email(para text, assunto text, corpo_html text) returns void
language plpgsql security definer set search_path = public, extensions as $$
declare
  chave text;
  remetente text;
begin
  select decrypted_secret into chave from vault.decrypted_secrets where name = 'resend_api_key';
  if chave is null or para is null then
    return;
  end if;
  select decrypted_secret into remetente from vault.decrypted_secrets where name = 'email_remetente';
  perform net.http_post(
    url := 'https://api.resend.com/emails',
    headers := jsonb_build_object('Authorization', 'Bearer ' || chave, 'Content-Type', 'application/json'),
    body := jsonb_build_object(
      'from', coalesce(remetente, 'animasys <onboarding@resend.dev>'),
      'to', jsonb_build_array(para),
      'subject', assunto,
      'html', '<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#1b1a1c">' || corpo_html ||
              '<p style="margin-top:24px;font-size:12px;color:#6b605b">animasys · aviso automático</p></div>'
    )
  );
end;
$$;
revoke all on function public.enviar_email(text, text, text) from public, anon, authenticated;

-- ------------------------------------------------------------------
-- Cadastro: cada conta nova vira um pedido de convite
-- O admin (joaogvalim@gmail.com) é liberado sozinho, mas só depois de confirmar
-- o e-mail, para ninguém conseguir se passar por ele.
-- ------------------------------------------------------------------

create or replace function public.ao_criar_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into perfis (id, email, nome, mensagem)
  values (
    new.id,
    lower(new.email),
    left(coalesce(new.raw_user_meta_data ->> 'nome', ''), 60),
    left(coalesce(new.raw_user_meta_data ->> 'mensagem', ''), 500)
  )
  on conflict (id) do nothing;
  if new.email_confirmed_at is not null then
    perform public.ao_confirmar(new.id);
  end if;
  return new;
end;
$$;

create or replace function public.ao_confirmar_usuario() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if old.email_confirmed_at is null and new.email_confirmed_at is not null then
    perform public.ao_confirmar(new.id);
  end if;
  return new;
end;
$$;

-- E-mail confirmado: o admin é liberado; os outros viram pedido e o admin é avisado.
create or replace function public.ao_confirmar(uid uuid) returns void
language plpgsql security definer set search_path = public as $$
declare
  p perfis;
begin
  select * into p from perfis where id = uid;
  if not found then
    return;
  end if;
  if p.email = 'joaogvalim@gmail.com' then
    perform set_config('animasys.promover', 'sim', true);
    update perfis set papel = 'admin', status = 'liberado', decidido_em = now() where id = uid;
    perform set_config('animasys.promover', '', true);
    return;
  end if;
  if p.status = 'pendente' then
    perform public.enviar_email(
      'jnautomacoes@gmail.com',
      'Pedido de convite no animasys: ' || coalesce(nullif(p.nome, ''), p.email),
      '<p><b>' || esc(coalesce(nullif(p.nome, ''), 'Alguém')) || '</b> pediu acesso ao animasys.</p>' ||
      '<p>E-mail: ' || esc(p.email) || '</p>' ||
      case when p.mensagem <> '' then '<p>Mensagem: ' || esc(p.mensagem) || '</p>' else '' end ||
      '<p>Para liberar, entre no animasys e abra <b>Acessos</b>.</p>'
    );
  end if;
end;
$$;
revoke all on function public.ao_confirmar(uuid) from public, anon, authenticated;

drop trigger if exists animasys_ao_criar on auth.users;
create trigger animasys_ao_criar after insert on auth.users
  for each row execute function public.ao_criar_usuario();

drop trigger if exists animasys_ao_confirmar on auth.users;
create trigger animasys_ao_confirmar after update of email_confirmed_at on auth.users
  for each row execute function public.ao_confirmar_usuario();

-- Liberou: a pessoa recebe um e-mail avisando.
create or replace function public.ao_decidir() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'liberado' and old.status is distinct from 'liberado' and new.papel = 'usuario' then
    perform public.enviar_email(
      new.email,
      'Seu acesso ao animasys foi liberado',
      '<p>Olá' || case when new.nome <> '' then ', ' || esc(new.nome) else '' end || '!</p>' ||
      '<p>Seu acesso ao <b>animasys</b> foi liberado. Entre com o seu e-mail e a senha que você criou no pedido.</p>'
    );
  end if;
  return new;
end;
$$;

drop trigger if exists animasys_ao_decidir on public.perfis;
create trigger animasys_ao_decidir after update of status on public.perfis
  for each row execute function public.ao_decidir();

-- O admin não pode mexer no próprio papel nem se tirar do ar sem querer.
create or replace function public.proteger_perfil() returns trigger
language plpgsql as $$
begin
  if new.id <> old.id or new.email <> old.email or new.criado_em <> old.criado_em then
    raise exception 'Esses campos não podem ser alterados.';
  end if;
  if old.papel = 'admin' and (new.papel <> 'admin' or new.status <> 'liberado') then
    raise exception 'A conta de administrador não pode perder o acesso.';
  end if;
  if new.papel = 'admin' and old.papel <> 'admin' and coalesce(current_setting('animasys.promover', true), '') <> 'sim' then
    raise exception 'Só existe um administrador.';
  end if;
  return new;
end;
$$;

drop trigger if exists animasys_proteger_perfil on public.perfis;
create trigger animasys_proteger_perfil before update on public.perfis
  for each row execute function public.proteger_perfil();

-- Carimbo de alteração
create or replace function public.carimbar() returns trigger
language plpgsql as $$
begin
  new.atualizado_em := now();
  return new;
end;
$$;

drop trigger if exists animasys_carimbo on public.animacoes;
create trigger animasys_carimbo before update on public.animacoes
  for each row execute function public.carimbar();
drop trigger if exists animasys_carimbo on public.sistemas;
create trigger animasys_carimbo before update on public.sistemas
  for each row execute function public.carimbar();

-- ------------------------------------------------------------------
-- Regras de acesso (RLS)
-- Usuários liberados só leem; só o admin grava. Quem não entrou não vê nada.
-- ------------------------------------------------------------------

alter table public.perfis enable row level security;
alter table public.animacoes enable row level security;
alter table public.sistemas enable row level security;

drop policy if exists "perfis: cada um vê o seu, o admin vê todos" on public.perfis;
create policy "perfis: cada um vê o seu, o admin vê todos" on public.perfis
  for select to authenticated using (id = auth.uid() or public.eh_admin());

drop policy if exists "perfis: só o admin decide" on public.perfis;
create policy "perfis: só o admin decide" on public.perfis
  for update to authenticated using (public.eh_admin()) with check (public.eh_admin());

drop policy if exists "animacoes: liberados leem" on public.animacoes;
create policy "animacoes: liberados leem" on public.animacoes
  for select to authenticated using (public.eh_liberado());

drop policy if exists "animacoes: admin grava" on public.animacoes;
create policy "animacoes: admin grava" on public.animacoes
  for all to authenticated using (public.eh_admin()) with check (public.eh_admin());

drop policy if exists "sistemas: liberados leem" on public.sistemas;
create policy "sistemas: liberados leem" on public.sistemas
  for select to authenticated using (public.eh_liberado());

drop policy if exists "sistemas: admin grava" on public.sistemas;
create policy "sistemas: admin grava" on public.sistemas
  for all to authenticated using (public.eh_admin()) with check (public.eh_admin());

revoke all on public.perfis, public.animacoes, public.sistemas from anon;
grant select, update on public.perfis to authenticated;
grant select, insert, update, delete on public.animacoes, public.sistemas to authenticated;

-- ------------------------------------------------------------------
-- Tempo real: a tela atualiza sozinha quando algo muda
-- ------------------------------------------------------------------

do $$
begin
  begin alter publication supabase_realtime add table public.animacoes; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.sistemas; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.perfis; exception when duplicate_object then null; end;
end $$;
