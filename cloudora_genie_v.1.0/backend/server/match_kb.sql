create or replace function match_kb(
  query_embedding vector(1536),
  match_count int default 5
)
returns table (
  id uuid,
  content text,
  similarity double precision
)
language plpgsql
as $$
begin
  return query
  select
    kb.id,
    kb.content,
    1 - (kb.embedding <-> query_embedding) as similarity
  from kb_internal kb
  order by kb.embedding <-> query_embedding
  limit match_count;
end;
$$;
