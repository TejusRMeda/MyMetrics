#!/bin/bash
# Pings Supabase to prevent free-tier project from pausing due to inactivity.
# Scheduled via crontab to run every 2 days.

SUPABASE_URL="https://ecadfgywiytrcgwlmygp.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVjYWRmZ3l3aXl0cmNnd2xteWdwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMyMTI1ODAsImV4cCI6MjA4ODc4ODU4MH0.vcjF9iz8ayQK1RH2D1B2s0B_C_USt_cGyVgSExb9IO0"

response=$(curl -s -o /dev/null -w "%{http_code}" \
  "${SUPABASE_URL}/rest/v1/" \
  -H "apikey: ${SUPABASE_ANON_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}")

if [ "$response" -eq 200 ]; then
  echo "$(date): Supabase ping OK (${response})"
else
  echo "$(date): Supabase ping FAILED (${response})" >&2
fi
