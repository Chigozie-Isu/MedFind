-- Location access: customers see and change only their own saved location.
begin;
create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(13);

create function pg_temp.as_user(p_user uuid) returns void language sql as $$
  select set_config('role', 'authenticated', true),
         set_config('request.jwt.claims', json_build_object('sub', p_user, 'role', 'authenticated')::text, true);
$$;
create function pg_temp.as_anon() returns void language sql as $$
  select set_config('role', 'anon', true), set_config('request.jwt.claims', '{"role":"anon"}', true);
$$;

-- signed out
select pg_temp.as_anon();
select throws_ok($$ select * from customer_locations $$, '42501', null, 'signed-out visitors cannot read locations');

-- Tunde (no saved location yet)
select pg_temp.as_user('c0000000-0000-4000-8000-000000000002');
select is((select count(*) from customer_locations), 0::bigint, 'Tunde cannot see Ada''s location');
select lives_ok($$
  insert into customer_locations (customer_id, label, address_line, lat, lng, accuracy_m, source)
  values ('c0000000-0000-4000-8000-000000000002', 'GRA Phase 2', 'Port Harcourt · within 20 m', 4.8156, 7.0498, 20, 'gps')
$$, 'Tunde saves his own GPS location');
select is((select label from customer_locations), 'GRA Phase 2', 'Tunde sees only his own location');
select ok((select location is not null from customer_locations), 'the map point is worked out from lat/lng');
select lives_ok($$
  insert into customer_locations (customer_id, label, address_line, lat, lng, accuracy_m, source)
  values ('c0000000-0000-4000-8000-000000000002', '12 Ada George Road', 'Mgbuoba, Port Harcourt, Rivers', 4.8402, 6.9937, null, 'address')
  on conflict (customer_id) do update set label = excluded.label, address_line = excluded.address_line,
    lat = excluded.lat, lng = excluded.lng, accuracy_m = excluded.accuracy_m, source = excluded.source
$$, 'Tunde replaces it with a typed address');
select is((select source from customer_locations), 'address', 'the typed address replaced the GPS one');
select throws_ok($$
  insert into customer_locations (customer_id, label, lat, lng)
  values ('c0000000-0000-4000-8000-000000000001', 'Somewhere else', 6.5, 3.4)
$$, '42501', null, 'Tunde cannot write a location for Ada');
select throws_ok($$
  update customer_locations set lat = 95 where customer_id = 'c0000000-0000-4000-8000-000000000002'
$$, '23514', null, 'latitude must be between -90 and 90');
select throws_ok($$
  update customer_locations set accuracy_m = 15 where customer_id = 'c0000000-0000-4000-8000-000000000002'
$$, '23514', null, 'a typed address has no GPS accuracy');

select throws_ok($$
  update customer_locations set customer_id = 'c0000000-0000-4000-8000-000000000001'
  where customer_id = 'c0000000-0000-4000-8000-000000000002'
$$, '42501', null, 'Tunde cannot move his location onto Ada''s account');

-- Ada
select pg_temp.as_user('c0000000-0000-4000-8000-000000000001');
select is((select count(*) from customer_locations), 1::bigint, 'Ada sees only her own location');
update customer_locations set label = 'Hacked' where customer_id = 'c0000000-0000-4000-8000-000000000002';
select pg_temp.as_user('c0000000-0000-4000-8000-000000000002');
select is((select label from customer_locations), '12 Ada George Road', 'Ada cannot change Tunde''s location');

select * from finish();
rollback;
