#!/bin/sh
# Gera site/config.js no deploy com o endereço e a chave pública (anon) do Supabase.
# As duas vêm das variáveis de ambiente do Render. A chave anon é pública por natureza;
# quem protege os dados são as regras de acesso do banco (supabase/schema.sql).
set -e
: "${SUPABASE_URL:?Defina SUPABASE_URL nas variáveis de ambiente do Render}"
: "${SUPABASE_ANON_KEY:?Defina SUPABASE_ANON_KEY nas variáveis de ambiente do Render}"
cat > site/config.js <<FIM
window.ANIMASYS_CONFIG = { supabaseUrl: "${SUPABASE_URL}", supabaseAnonKey: "${SUPABASE_ANON_KEY}" };
FIM
echo "config.js gerado para ${SUPABASE_URL}"
