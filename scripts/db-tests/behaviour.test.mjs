// Behaviour tests for the Supabase schema: sign-up trigger, access rules,
// account-type switching, security policies and the admin review RPC.
// Run: npm run test:db
import fs from 'node:fs';
import path from 'node:path';
import './run_migrations.mjs';
const db = globalThis.__db;
const dir = process.env.MIGRATIONS_DIR || new URL('../../supabase/migrations/', import.meta.url).pathname;
let pass = 0, fail = 0;
const check = (label, cond, detail = '') => { if (cond) { pass++; console.log(`  PASS ${label}`); } else { fail++; console.log(`  FAIL ${label} ${detail}`); } };
const asUser = async (uid, role = 'authenticated') => {
  await db.exec(`reset role;`);
  await db.query(`select set_config('request.jwt.claims', $1, false)`, [JSON.stringify(uid ? { sub: uid, role } : { role })]);
  await db.exec(`set role ${role};`);
};
const asPostgres = async () => { await db.exec(`reset role;`); await db.query(`select set_config('request.jwt.claims', '', false)`); };
const attempt = async (sql, params = []) => { try { const r = await db.query(sql, params); return { ok: true, rows: r.rows, n: r.affectedRows }; } catch (e) { return { ok: false, err: e.message }; } };

// Idempotency: re-run the last two migrations
for (const f of ['20261028000000_schema_harmonization.sql', '20261029000000_launch_fixes.sql', '20261030000000_connection_requests.sql', '20261031000000_verify_sets_account_type.sql']) {
  try { await db.exec(fs.readFileSync(path.join(dir, f), 'utf8')); check(`re-run ${f}`, true); } catch (e) { check(`re-run ${f}`, false, e.message); }
}

console.log('\nSIGN-UP');
const signup = async (email, meta) => { await asPostgres(); return attempt(`insert into auth.users (email, raw_user_meta_data) values ($1, $2::jsonb) returning id`, [email, JSON.stringify(meta)]); };
const ids = {};
for (const [k, meta] of Object.entries({
  doctor: { full_name: 'Dr Doc', account_type: 'doctor' },
  student: { full_name: 'Stu Dent', account_type: 'student' },
  researcher: { full_name: 'Re Search', account_type: 'researcher' },
  notype: { full_name: 'No Type' },
  google: { name: 'Goo Gle', picture: 'https://lh3.googleusercontent.com/a/x' },
  hacker: { full_name: 'Sneaky', account_type: 'admin' },
  other: { full_name: 'Other Doc', account_type: 'doctor' },
})) {
  const r = await signup(`${k}@t.in`, meta);
  check(`sign-up ${k}`, r.ok, r.err);
  if (r.ok) ids[k] = r.rows[0].id;
}
await asPostgres();
const prof = async (id) => (await db.query(`select role, account_type, status, verification_status, display_name, avatar_url, state from public.profiles where id=$1`, [id])).rows[0];
check('type in sign-up metadata ignored (set by verification)', (await prof(ids.doctor)).role === 'member' && (await prof(ids.doctor)).account_type === null);
check('student sign-up not auto-verified', (await prof(ids.student)).status === 'pending');
check('no type → role member', (await prof(ids.notype)).role === 'member');
const g = await prof(ids.google);
check('google name + avatar captured', g.display_name === 'Goo Gle' && g.avatar_url?.includes('googleusercontent'), JSON.stringify(g));
check('admin account_type in metadata is ignored', (await prof(ids.hacker)).role === 'member');
const roles = (await db.query(`select role from public.user_roles where user_id=$1`, [ids.hacker])).rows.map(r => r.role);
check('no admin role granted via sign-up', !roles.includes('admin'), JSON.stringify(roles));

// Admin + content
const adminId = (await signup('boss@t.in', { full_name: 'Boss' })).rows[0].id;
await asPostgres();
await db.query(`insert into public.user_roles (user_id, role) values ($1,'admin')`, [adminId]);
await db.query(`insert into public.categories (id,name,slug,type) values ('general','General','general','discussion') on conflict do nothing`);
const post = (await db.query(`insert into public.posts (author_id, author_name, title, body, category_id, status) values ($1,'Boss','Hello','World','general','published') returning id`, [adminId])).rows[0].id;
await db.query(`insert into public.events (title, summary, organizer, speaker, date_badge_day, date_badge_month, time_display, start_at, location, registration_url) values ('CME','s','o','sp','1','JAN','t', now() + interval '3 days','online','/events')`);
await db.query(`update public.profiles set profile_visibility='public' where id=$1`, [ids.other]);

console.log('\nACCESS AFTER LOGIN (new, unverified doctor)');
await asUser(ids.doctor);
check('can read posts', (await attempt(`select id from public.posts`)).rows?.length === 1);
check('can read events', (await attempt(`select id from public.events`)).rows?.length === 1);
check('can read categories', (await attempt(`select id from public.categories`)).rows?.length >= 1);
check('can create a post', (await attempt(`insert into public.posts (author_id, author_name, title, body, category_id) values ($1,'Dr Doc','Q','B','general') returning id`, [ids.doctor])).ok);
check('can comment', (await attempt(`insert into public.comments (post_id, author_id, author_name, body) values ($1,$2,'Dr Doc','hi')`, [post, ids.doctor])).ok);
check('can like', (await attempt(`insert into public.post_likes (post_id, user_id) values ($1,$2)`, [post, ids.doctor])).ok);
check('can register for event', (await attempt(`insert into public.event_registrations (event_id, user_id) select id, $1 from public.events limit 1`, [ids.doctor])).ok);
check('sees members in directory', (await attempt(`select id from public.profile_public_view`)).rows?.length >= 2);
check('cannot read another profile row directly', (await attempt(`select id from public.profiles where id=$1`, [ids.other])).rows?.length === 0);

console.log('\nACCOUNT TYPE (set only by verification)');
check('member cannot set own account type', !(await attempt(`update public.profiles set account_type='student' where id=$1`, [ids.doctor])).ok);
check('member cannot set own role to doctor', !(await attempt(`update public.profiles set role='doctor' where id=$1`, [ids.doctor])).ok);
check('member can still edit own bio', (await attempt(`update public.profiles set bio='Hello' where id=$1`, [ids.doctor])).ok);
check('self-promote to admin blocked', !(await attempt(`update public.profiles set role='admin' where id=$1`, [ids.doctor])).ok);
check('self-verify blocked', !(await attempt(`update public.profiles set status='verified' where id=$1`, [ids.doctor])).ok);
check('cannot insert admin into user_roles', !(await attempt(`insert into public.user_roles (user_id, role) values ($1,'admin')`, [ids.doctor])).ok);

console.log('\nSECURITY');
await asUser(null, 'anon');
const anonUpd = await attempt(`update public.profile_public_view set bio='HACKED' where id=$1`, [ids.other]);
check('visitor cannot write through profile_public_view', !anonUpd.ok, JSON.stringify(anonUpd));
check('visitor sees only public profiles', (await attempt(`select id, profile_visibility from public.profile_public_view`)).rows?.every(r => r.profile_visibility === 'public'));
check('visitor cannot read posts', ((await attempt(`select id from public.posts`)).rows?.length ?? 0) === 0);
await asUser(ids.student);
check('cannot notify another user', !(await attempt(`insert into public.app_notifications (user_id, type, title, message) values ($1,'system','x','y')`, [ids.other])).ok);
check('can notify self', (await attempt(`insert into public.app_notifications (user_id, type, title, message) values ($1,'system','x','y')`, [ids.student])).ok);
await asPostgres();
await db.query(`update public.profiles set status='suspended' where id=$1`, [ids.notype]);
await asUser(ids.notype);
check('suspended member cannot read posts', ((await attempt(`select id from public.posts`)).rows?.length ?? 0) === 0);
check('suspended member cannot post', !(await attempt(`insert into public.posts (author_id, author_name, title, body) values ($1,'x','t','b')`, [ids.notype])).ok);

// self-created profile cannot claim admin / verified
await asPostgres();
const orphan = (await db.query(`insert into auth.users (email) values ('orphan@t.in') returning id`)).rows[0].id;
await db.query(`delete from public.profiles where id=$1`, [orphan]);
await db.query(`delete from public.user_roles where user_id=$1`, [orphan]);
await asUser(orphan);
const forged = await attempt(`insert into public.profiles (id, display_name, state, qualification, role, status, verification_status) values ($1,'Forger','x','y','admin','verified','verified') returning role, status, verification_status`, [orphan]);
check('self-created profile cannot claim admin or verified', forged.ok && !['admin','super_admin'].includes(forged.rows[0].role) && forged.rows[0].status === 'pending' && forged.rows[0].verification_status === 'pending', JSON.stringify(forged));

console.log('\nADMIN REVIEW');
await asPostgres();
const mk = async (uid) => (await db.query(`insert into public.practitioner_applications (user_id, full_name, email, phone, qualification, registration_number, registration_authority, state, role_applied) values ($1,'A','a@t.in','1','BHMS','R1','Council','Delhi','doctor') returning id`, [uid])).rows[0].id;
for (const decision of ['declined', 'needs_information', 'verified', 'pending_review']) {
  const app = await mk(ids.other);
  await asUser(adminId);
  const r = await attempt(`select public.review_practitioner_application($1, $2, 'reason')`, [app, decision]);
  check(`admin (browser) review → ${decision}`, r.ok, r.err);
  await asPostgres();
}
const app2 = await mk(ids.researcher);
await db.exec(`reset role;`); await db.query(`select set_config('request.jwt.claims', '{"role":"service_role"}', false)`); await db.exec('set role service_role;');
const es = await attempt(`select public.review_practitioner_application($1, 'verified', null, null, null, $2)`, [app2, adminId]);
check('Edge Function (service role) review → verified', es.ok, es.err);
await asUser(ids.student);
const app3 = await (async () => { await asPostgres(); const id = await mk(ids.other); await asUser(ids.student); return id; })();
check('non-admin cannot review', !(await attempt(`select public.review_practitioner_application($1, 'verified')`, [app3])).ok);


console.log('\nCONNECTION REQUESTS');
await asUser(ids.student);
const sent = await attempt(`insert into public.connection_requests (sender_id, recipient_id, message, status) values ($1,$2,'  Hello doctor, may I learn from you?  ','accepted') returning id, status, message`, [ids.student, ids.researcher]);
check('student sends request with a note', sent.ok && sent.rows[0].status === 'pending' && sent.rows[0].message === 'Hello doctor, may I learn from you?', JSON.stringify(sent));
const reqId = sent.rows?.[0]?.id;
check('note longer than 300 characters rejected', !(await attempt(`insert into public.connection_requests (sender_id, recipient_id, message) values ($1,$2,$3)`, [ids.student, ids.doctor, 'x'.repeat(301)])).ok);
check('sender cannot accept own request', !(await attempt(`update public.connection_requests set status='accepted' where id=$1`, [reqId])).ok || (await attempt(`select status from public.connection_requests where id=$1`, [reqId])).rows[0].status === 'pending');
await asUser(ids.researcher);
const notif = await attempt(`select message, link from public.app_notifications where user_id=$1 and type='connection_request'`, [ids.researcher]);
check('recipient notified with the note', notif.rows?.[0]?.message.includes('may I learn'), JSON.stringify(notif));
check('reverse duplicate request blocked', !(await attempt(`insert into public.connection_requests (sender_id, recipient_id) values ($1,$2)`, [ids.researcher, ids.student])).ok);
check('recipient cannot edit the note', !(await attempt(`update public.connection_requests set message='changed' where id=$1`, [reqId])).ok);
const acc = await attempt(`update public.connection_requests set status='accepted' where id=$1 returning status`, [reqId]);
check('recipient accepts', acc.ok && acc.rows[0]?.status === 'accepted', JSON.stringify(acc));
check('answered request cannot change again', !(await attempt(`update public.connection_requests set status='declined' where id=$1`, [reqId])).ok);
await asUser(ids.student);
check('sender notified of acceptance', (await attempt(`select id from public.app_notifications where user_id=$1 and type='connection_accepted'`, [ids.student])).rows?.length === 1);
check('sender can remove the connection', (await attempt(`delete from public.connection_requests where id=$1`, [reqId])).ok);


console.log('\nVERIFICATION SETS ACCOUNT TYPE');
await asPostgres();
const newbie = (await db.query(`insert into auth.users (email, raw_user_meta_data) values ('newbie@t.in','{"full_name":"New Bie"}') returning id`)).rows[0].id;
check('new sign-up has no type', (await prof(newbie)).account_type === null && (await prof(newbie)).role === 'member');
await asUser(newbie);
const stuApp = await attempt(`insert into public.practitioner_applications (user_id, full_name, email, phone, qualification, registration_number, registration_authority, state, city, role_applied, institution, course_year, clinic_institution) values ($1,'New Bie','newbie@t.in','1','3rd Year BHMS','','','Kerala','Kochi','student','Govt Homoeo College','3rd Year BHMS','Govt Homoeo College') returning id`, [newbie]);
check('member submits student form', stuApp.ok, stuApp.err);
check('type not set before verification', (await prof(newbie)).account_type === null);
await asUser(adminId);
check('admin verifies', (await attempt(`select public.review_practitioner_application($1, 'verified')`, [stuApp.rows?.[0]?.id])).ok);
await asPostgres();
const nb = (await db.query(`select role, account_type, status, city, clinic_institution from public.profiles where id=$1`, [newbie])).rows[0];
check('verified → student type, role and details', nb.account_type === 'student' && nb.role === 'student' && nb.status === 'verified' && nb.city === 'Kochi' && nb.clinic_institution === 'Govt Homoeo College', JSON.stringify(nb));
check('user_roles synced to student', JSON.stringify((await db.query(`select array_agg(role) r from public.user_roles where user_id=$1`, [newbie])).rows[0].r) === '["student"]');
const staff = (await db.query(`insert into auth.users (email) values ('staff@t.in') returning id`)).rows[0].id;
await db.query(`update public.profiles set role='admin' where id=$1`, [staff]);
const staffApp = (await db.query(`insert into public.practitioner_applications (user_id, full_name, email, phone, qualification, registration_number, registration_authority, state, role_applied) values ($1,'S','staff@t.in','1','BHMS','R9','Council','Delhi','doctor') returning id`, [staff])).rows[0].id;
await asUser(adminId);
await attempt(`select public.review_practitioner_application($1, 'verified')`, [staffApp]);
await asPostgres();
const st = await prof(staff);
check('admin who applies keeps admin role, gets doctor type', st.role === 'admin' && st.account_type === 'doctor', JSON.stringify(st));


console.log('\nPOSTS');
await asPostgres();
const myPost = (await db.query(`insert into public.posts (author_id, author_name, title, body, category_id, status) values ($1,'Stu','T','B','general','published') returning id`, [ids.student])).rows[0].id;
await asUser(ids.student);
check('author cannot edit post', !(await attempt(`update public.posts set body='changed' where id=$1`, [myPost])).ok);
check('likes still update the counter', (await attempt(`insert into public.post_likes (post_id, user_id) values ($1,$2)`, [myPost, ids.student])).ok);
check('author can delete post', (await attempt(`delete from public.posts where id=$1`, [myPost])).ok);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
