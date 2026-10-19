#!/usr/bin/env bash
# Testa as migrations num Postgres local descartável.
# Uso: PGHOST=127.0.0.1 PGPORT=55432 PGUSER=postgres supabase/tests/run.sh [--sem-0003]
set -euo pipefail
cd "$(dirname "$0")/.."
DB=lumen_teste
psql -q -d postgres -c "drop database if exists $DB" -c "create database $DB"
run() { psql -q -v ON_ERROR_STOP=1 -d "$DB" -f "$1"; }
run tests/_auth_stub.sql
run migrations/0001_init.sql
run migrations/0002_sources_citation.sql
run tests/0003_seed.sql
if [[ "${1:-}" != "--sem-0003" ]]; then run migrations/0003_conversations.sql; fi
run tests/0003_conversations.sql
run migrations/0004_drop_legacy_search_columns.sql
run migrations/0005_reusable_invite_code.sql
run tests/0005_invites.sql
