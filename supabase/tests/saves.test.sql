begin;
create extension if not exists pgtap with schema extensions;

select plan(16);

-- Two users, each with their own save.
insert into auth.users (id, email) values
  ('11111111-1111-1111-1111-111111111111', 'a@example.com'),
  ('22222222-2222-2222-2222-222222222222', 'b@example.com');

insert into public.saves (user_id, entries, settings) values
  ('11111111-1111-1111-1111-111111111111', '[]', '{}'),
  ('22222222-2222-2222-2222-222222222222', '[]', '{}');

-- Acts as a signed-in user for the rest of the transaction, the way PostgREST does.
create function pg_temp.sign_in_as(user_id uuid) returns void language sql as $$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', json_build_object('sub', user_id, 'role', 'authenticated')::text, true);
$$;

-- User A
select pg_temp.sign_in_as('11111111-1111-1111-1111-111111111111');

select results_eq(
  'select user_id from public.saves',
  $$values ('11111111-1111-1111-1111-111111111111'::uuid)$$,
  'user A sees only their own save'
);

select is_empty(
  $$select 1 from public.saves where user_id = '22222222-2222-2222-2222-222222222222'$$,
  'user A cannot select user B''s save'
);

select throws_ok(
  $$insert into public.saves (user_id, entries, settings)
    values ('22222222-2222-2222-2222-222222222222', '[]', '{}')$$,
  '42501',
  null,
  'user A cannot insert a save for user B'
);

select is_empty(
  $$update public.saves set entries = '[1]'
    where user_id = '22222222-2222-2222-2222-222222222222' returning 1$$,
  'user A cannot update user B''s save'
);

select throws_ok(
  $$update public.saves set user_id = '22222222-2222-2222-2222-222222222222'
    where user_id = '11111111-1111-1111-1111-111111111111'$$,
  '42501',
  null,
  'user A cannot hand their save to user B'
);

select isnt_empty(
  $$update public.saves set entries = '[1]', version = version + 1
    where user_id = '11111111-1111-1111-1111-111111111111' returning 1$$,
  'user A can update their own save'
);

select is_empty(
  $$delete from public.saves returning 1$$,
  'user A cannot delete a save directly'
);

-- The anon role
reset role;
select set_config('request.jwt.claims', '{"role": "anon"}', true);
set local role anon;

select throws_ok(
  'select * from public.saves',
  '42501',
  null,
  'anon cannot read saves'
);

select throws_ok(
  $$insert into public.saves (user_id, entries, settings)
    values ('33333333-3333-3333-3333-333333333333', '[]', '{}')$$,
  '42501',
  null,
  'anon cannot insert a save'
);

select throws_ok(
  $$update public.saves set entries = '[]'$$,
  '42501',
  null,
  'anon cannot update saves'
);

select throws_ok(
  'select public.delete_my_account()',
  '42501',
  null,
  'anon cannot call delete_my_account'
);

-- Deleting an account
reset role;
select pg_temp.sign_in_as('22222222-2222-2222-2222-222222222222');

select lives_ok(
  'select public.delete_my_account()',
  'user B can delete their account'
);

reset role;

select is_empty(
  $$select 1 from auth.users where id = '22222222-2222-2222-2222-222222222222'$$,
  'delete_my_account deletes the caller'
);

select is_empty(
  $$select 1 from public.saves where user_id = '22222222-2222-2222-2222-222222222222'$$,
  'delete_my_account deletes the caller''s save by cascade'
);

select isnt_empty(
  $$select 1 from auth.users where id = '11111111-1111-1111-1111-111111111111'$$,
  'delete_my_account keeps other users'
);

select isnt_empty(
  $$select 1 from public.saves where user_id = '11111111-1111-1111-1111-111111111111'$$,
  'delete_my_account keeps other users'' saves'
);

select * from finish();
rollback;
