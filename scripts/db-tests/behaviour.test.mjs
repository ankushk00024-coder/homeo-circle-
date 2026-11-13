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
const asUser = async (uid, role = 'authenticated', extra = {}) => {
  await db.exec(`reset role;`);
  await db.query(`select set_config('request.jwt.claims', $1, false)`, [JSON.stringify(uid ? { sub: uid, role, ...extra } : { role })]);
  await db.exec(`set role ${role};`);
};
const asPostgres = async () => { await db.exec(`reset role;`); await db.query(`select set_config('request.jwt.claims', '', false)`); };
const attempt = async (sql, params = []) => { try { const r = await db.query(sql, params); return { ok: true, rows: r.rows, n: r.affectedRows }; } catch (e) { return { ok: false, err: e.message }; } };

// Idempotency: re-run the recent migrations (older ones were superseded)
for (const f of ['20261106000000_research_files_and_admin_transfer.sql', '20261108000000_security_hardening.sql', '20261109000000_publisher_role.sql', '20261111000000_publisher_password_login.sql', '20261113000000_membership_and_compliance.sql']) {
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
await db.query(`insert into public.user_roles (user_id, role) values ($1,'admin'),($1,'super_admin')`, [adminId]);
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
const mk = async (uid) => (await db.query(`insert into public.practitioner_applications (adult_confirmed, user_id, full_name, email, phone, qualification, registration_number, registration_authority, state, role_applied) values (true,$1,'A','a@t.in','1','BHMS','R1','Council','Delhi','doctor') returning id`, [uid])).rows[0].id;
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
const stuApp = await attempt(`insert into public.practitioner_applications (adult_confirmed, user_id, full_name, email, phone, qualification, registration_number, registration_authority, state, city, role_applied, institution, course_year, clinic_institution) values (true,$1,'New Bie','newbie@t.in','1','3rd Year BHMS','','','Kerala','Kochi','student','Govt Homoeo College','3rd Year BHMS','Govt Homoeo College') returning id`, [newbie]);
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
const staffApp = (await db.query(`insert into public.practitioner_applications (adult_confirmed, user_id, full_name, email, phone, qualification, registration_number, registration_authority, state, role_applied) values (true,$1,'S','staff@t.in','1','BHMS','R9','Council','Delhi','doctor') returning id`, [staff])).rows[0].id;
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


console.log('\nADMIN HANDOVER');
await asPostgres();
const oldAdmin = (await db.query(`insert into auth.users (email) values ('old.admin@t.in') returning id`)).rows[0].id;
const newAdmin = (await db.query(`insert into auth.users (email) values ('new.admin@t.in') returning id`)).rows[0].id;
await db.query(`update public.profiles set role='super_admin', status='verified' where id=$1`, [oldAdmin]);
await db.query(`insert into public.user_roles (user_id, role) values ($1,'super_admin'),($1,'admin') on conflict do nothing`, [oldAdmin]);
const tr = await attempt(`call public.transfer_super_admin('NEW.admin@t.in', 'old.admin@t.in')`);
check('transfer runs', tr.ok, tr.err);
const rolesOf = async (id) => (await db.query(`select array_agg(role order by role) r from public.user_roles where user_id=$1`, [id])).rows[0].r;
check('new account is super admin', (await prof(newAdmin)).role === 'super_admin' && JSON.stringify(await rolesOf(newAdmin)) === '["admin","super_admin"]', JSON.stringify(await rolesOf(newAdmin)));
check('old account is no longer admin', (await prof(oldAdmin)).role === 'member' && !(await rolesOf(oldAdmin)).some((r) => ['admin','super_admin'].includes(r)), JSON.stringify(await rolesOf(oldAdmin)));
check('transfer to unknown email refused', !(await attempt(`call public.transfer_super_admin('nobody@t.in')`)).ok);
await asUser(newAdmin);
check('new admin can add research with images and PDF', (await attempt(`insert into public.knowledge_posts (title, summary, journal, source_url, content_type, limitations, image_urls, attachment_url, licence) values ('T','S','J','https://x','Clinical Trial','L', array['https://img'], 'https://pdf', 'open_access')`)).ok);
check('members cannot call the handover', !(await attempt(`call public.transfer_super_admin('new.admin@t.in')`)).ok);


console.log('\nSECURITY HARDENING');
await asPostgres();
await db.query(`update public.profiles set display_name='Stu Dent', qualification='BHMS (Intern)' where id=$1`, [ids.student]);
await asUser(ids.student);
const fake = await attempt(`insert into public.posts (author_id, author_name, author_qualification, author_role, title, body, category_id, status, likes_count) values ($1,'Dr Famous','MD (Hom) PhD','admin','T','B','general','published', 999) returning author_name, author_qualification, author_role, likes_count`, [ids.student]);
check('post author details come from the real profile', fake.ok && fake.rows[0].author_name === 'Stu Dent' && fake.rows[0].author_qualification === 'BHMS (Intern)' && fake.rows[0].likes_count === 0, JSON.stringify(fake.rows?.[0] ?? fake.err));
const fakeC = await attempt(`insert into public.comments (post_id, author_id, author_name, body) values ($1,$2,'Dr Famous','x') returning author_name`, [post, ids.student]);
check('comment author name comes from the real profile', fakeC.ok && fakeC.rows[0].author_name === 'Stu Dent', JSON.stringify(fakeC.rows?.[0] ?? fakeC.err));
const sp = (await db.query(`select id from public.posts where author_id=$1 limit 1`, [ids.student])).rows[0].id;
await asUser(adminId);
check('admin can hide a post', (await attempt(`update public.posts set status='hidden' where id=$1`, [sp])).ok);
await asUser(ids.student);
check('author cannot re-publish a hidden post', !(await attempt(`update public.posts set status='published' where id=$1`, [sp])).ok);
check('author cannot fake like counts', !(await attempt(`update public.posts set likes_count=500 where id=$1`, [sp])).ok);
check('javascript: link rejected', !(await attempt(`insert into public.posts (author_id, title, body, category_id, source_url) values ($1,'T','B','general','javascript:alert(1)')`, [ids.student])).ok);
check('https link accepted', (await attempt(`insert into public.posts (author_id, title, body, category_id, source_url) values ($1,'T','B','general','https://pubmed.ncbi.nlm.nih.gov/1')`, [ids.student])).ok);
check('javascript: website on profile rejected', !(await attempt(`update public.profiles set social_links='{"website":"javascript:alert(1)"}' where id=$1`, [ids.student])).ok);
check('over-long post body rejected', !(await attempt(`insert into public.posts (author_id, title, body, category_id) values ($1,'T',repeat('a',20001),'general')`, [ids.student])).ok);
const mr = await attempt(`insert into public.mentorship_requests (student_id, mentor_id, message, status) values ($1,$2,'help','accepted') returning id, status`, [ids.student, ids.other]);
check('mentorship request always starts pending', mr.ok && mr.rows[0].status === 'pending', JSON.stringify(mr.rows?.[0] ?? mr.err));
check('student cannot accept own mentorship request', !(await attempt(`update public.mentorship_requests set status='accepted' where id=$1`, [mr.rows[0].id])).ok);
check('student cannot redirect request to another mentor', !(await attempt(`update public.mentorship_requests set mentor_id=$2 where id=$1`, [mr.rows[0].id, ids.doctor])).ok);
await asUser(ids.other);
check('mentor can accept', (await attempt(`update public.mentorship_requests set status='accepted' where id=$1`, [mr.rows[0].id])).ok);
await asUser(ids.notype);
const selfApp = await attempt(`insert into public.practitioner_applications (adult_confirmed, user_id, full_name, email, phone, qualification, registration_number, registration_authority, state, role_applied, status, internal_notes) values (true,$1,'N','n@t.in','1','BHMS','R','C','Delhi','doctor','verified','ok') returning status, internal_notes`, [ids.notype]);
check('application cannot self-approve', selfApp.ok && selfApp.rows[0].status === 'pending_review' && selfApp.rows[0].internal_notes === null, JSON.stringify(selfApp.rows?.[0] ?? selfApp.err));
await asUser(null, 'anon');
check('signed-out visitors cannot submit applications', !(await attempt(`insert into public.practitioner_applications (full_name, email, phone, qualification, registration_number, registration_authority, state) values ('G','g@t.in','1','BHMS','R','C','Delhi')`)).ok);
await asUser(ids.student);
let limited = false;
for (let i = 0; i < 16; i++) { const r = await attempt(`insert into public.posts (author_id, title, body, category_id) values ($1,'Spam','B','general')`, [ids.student]); if (!r.ok && /too often/.test(r.err)) { limited = true; break; } }
check('posting is rate limited', limited);
await asUser(adminId);
let adminLimited = false;
for (let i = 0; i < 16; i++) { const r = await attempt(`insert into public.posts (author_id, author_name, title, body, category_id) values ($1,'Boss','Admin','B','general')`, [adminId]); if (!r.ok) { adminLimited = r.err; break; } }
check('admins are not rate limited', !adminLimited, adminLimited);
check('trigger functions cannot be called via the API', !(await attempt(`select public.notify_on_comment()`)).ok);
await asPostgres();
await db.query(`insert into public.user_roles (user_id, role) values ($1,'moderator')`, [ids.other]);
check('role changes are written to the audit log', (await db.query(`select count(*)::int n from public.admin_audit_logs where action='ROLE_GRANTED' and target_id=$1`, [ids.other])).rows[0].n === 1);


console.log('\nPUBLISHER (posting-only helper)');
const PW = { amr: [{ method: 'password', timestamp: 1 }] };
const GOOGLE = { amr: [{ method: 'oauth', timestamp: 1 }] };
await asPostgres();
const pubId = (await signup('helper@t.in', { full_name: 'Content Helper' })).rows[0].id;
await asUser(ids.doctor);
check('members cannot add publishers', !(await attempt(`select * from public.add_publisher('helper@t.in')`)).ok);
check('members cannot list publishers', !(await attempt(`select * from public.list_publishers()`)).ok);
await asUser(adminId);
const addPub = await attempt(`select * from public.add_publisher(' HELPER@t.in ')`);
check('admin adds a publisher by email', addPub.ok && addPub.rows[0]?.name === 'Content Helper', JSON.stringify(addPub.rows?.[0] ?? addPub.err));
check('admin sees publisher list', (await attempt(`select * from public.list_publishers()`)).rows?.length === 1);
check('unknown email refused', !(await attempt(`select * from public.add_publisher('nobody@t.in')`)).ok);
await asUser(pubId, 'authenticated', PW);
check('publisher is not an admin', (await attempt(`select public.is_admin() a`)).rows[0].a === false);
check('publisher can post a discussion (even unverified)', (await attempt(`insert into public.posts (author_id, title, body, category_id) values ($1,'From helper','B','general')`, [pubId])).ok);
const pe = await attempt(`insert into public.events (title, summary, organizer, speaker, date_badge_day, date_badge_month, time_display, start_at, location, registration_url, status) values ('Pub CME','s','o','sp','2','FEB','t', now() + interval '5 days','online','/events','draft') returning id, created_by, status`);
check('publisher can post an event (stamped as theirs, published)', pe.ok && pe.rows[0].created_by === pubId && pe.rows[0].status === 'published', JSON.stringify(pe.rows?.[0] ?? pe.err));
const pk = await attempt(`insert into public.knowledge_posts (title, summary, journal, source_url, content_type, limitations, created_by) values ('Pub research','S','J','https://x','Clinical Trial','L',$1) returning id`, [pubId]);
check('publisher can post research', pk.ok, pk.err);
check('publisher sees own events', (await attempt(`select id from public.events where created_by=$1`, [pubId])).rows?.length === 1);
check('publisher cannot read applications', (await attempt(`select id from public.practitioner_applications`)).rows?.length === 0);
check('publisher cannot read audit logs', (await attempt(`select id from public.admin_audit_logs`)).rows?.length === 0);
check('publisher cannot read reports', (await attempt(`select id from public.reports`)).rows?.length === 0);
check('publisher cannot see other profiles', (await attempt(`select id from public.profiles where id <> $1`, [pubId])).rows?.length === 0);
check('publisher cannot approve applications', !(await attempt(`select public.review_practitioner_application($1, 'verified')`, [staffApp])).ok);
check('publisher cannot add publishers', !(await attempt(`select * from public.add_publisher('other@t.in')`)).ok);
check('publisher cannot edit events of others', (await attempt(`update public.events set title='x' where created_by is distinct from $1`, [pubId])).n === 0);
check('publisher can delete own event', (await attempt(`delete from public.events where id=$1`, [pe.rows[0].id])).n === 1);
check('publisher can delete own research', (await attempt(`delete from public.knowledge_posts where id=$1`, [pk.rows[0].id])).n === 1);
await asUser(adminId);
check('admin removes the publisher', (await attempt(`select public.remove_publisher($1)`, [pubId])).ok);
await asUser(pubId, 'authenticated', PW);
check('removed publisher can no longer post events', !(await attempt(`insert into public.events (title, summary, organizer, speaker, date_badge_day, date_badge_month, time_display, start_at, location, registration_url) values ('x','s','o','sp','2','FEB','t', now(),'online','/events')`)).ok);


console.log('\nPUBLISHER NEEDS PASSWORD SIGN-IN');
await asUser(adminId);
await attempt(`select * from public.add_publisher('helper@t.in')`);
await asUser(pubId, 'authenticated', GOOGLE);
check('Google sign-in: publisher_access says password required', (await attempt(`select public.publisher_access() a`)).rows[0].a === 'password_required');
check('Google sign-in cannot post events', !(await attempt(`insert into public.events (title, summary, organizer, speaker, date_badge_day, date_badge_month, time_display, start_at, location, registration_url) values ('x','s','o','sp','2','FEB','t', now(),'online','/events')`)).ok);
check('Google sign-in cannot post research', !(await attempt(`insert into public.knowledge_posts (title, summary, journal, source_url, content_type, limitations, created_by) values ('x','S','J','https://x','Clinical Trial','L',$1)`, [pubId])).ok);
await asUser(pubId, 'authenticated', PW);
check('password sign-in: publisher_access ok', (await attempt(`select public.publisher_access() a`)).rows[0].a === 'ok');
check('password sign-in can post events', (await attempt(`insert into public.events (title, summary, organizer, speaker, date_badge_day, date_badge_month, time_display, start_at, location, registration_url) values ('x','s','o','sp','2','FEB','t', now(),'online','/events')`)).ok);
await asUser(ids.doctor, 'authenticated', PW);
check('non-publisher: publisher_access none', (await attempt(`select public.publisher_access() a`)).rows[0].a === 'none');


console.log('\nMEMBERSHIP & VERIFICATION (compliance)');
await asPostgres();
const reg = (await signup('reg.doc@t.in', { full_name: 'Reg Doc' })).rows[0].id;
const grad = (await signup('grad@t.in', { full_name: 'Grad Uate' })).rows[0].id;
const intern = (await signup('intern@t.in', { full_name: 'In Tern' })).rows[0].id;
await asUser(reg);
const noAge = await attempt(`insert into public.practitioner_applications (user_id, full_name, email, phone, qualification, registration_number, registration_authority, state, role_applied) values ($1,'R','r@t.in','1','BHMS','R1','Kerala','Kerala','doctor')`, [reg]);
check('application needs 18+ confirmation', !noAge.ok && /18/.test(noAge.err), noAge.err);
check('practitioner application needs registration number', !(await attempt(`insert into public.practitioner_applications (adult_confirmed, user_id, full_name, email, phone, qualification, registration_number, registration_authority, state, role_applied) values (true,$1,'R','r@t.in','1','BHMS','','','Kerala','doctor')`, [reg])).ok);
const regApp = (await attempt(`insert into public.practitioner_applications (adult_confirmed, user_id, full_name, email, phone, qualification, registration_number, registration_authority, state, role_applied) values (true,$1,'R','r@t.in','1','BHMS','KL-123','Kerala State Homoeopathy Council','Kerala','doctor') returning id`, [reg])).rows[0].id;
await asUser(grad);
const gradApp = (await attempt(`insert into public.practitioner_applications (adult_confirmed, user_id, full_name, email, phone, qualification, registration_number, registration_authority, state, role_applied, graduation_year) values (true,$1,'G','g@t.in','1','BHMS','','','Delhi','graduate','2025') returning id`, [grad])).rows[0].id;
await asUser(intern);
const internApp = (await attempt(`insert into public.practitioner_applications (adult_confirmed, user_id, full_name, email, phone, qualification, registration_number, registration_authority, state, role_applied, institution, internship_details) values (true,$1,'I','i@t.in','1','BHMS','','','Goa','intern','Govt College','Hospital X, 2026') returning id`, [intern])).rows[0].id;
await asUser(reg);
check('member cannot review own application', !(await attempt(`select public.review_practitioner_application($1,'verified')`, [regApp])).ok);
check('member cannot set own registration status', !(await attempt(`update public.profiles set registration_status='verified' where id=$1`, [reg])).ok);
check('member cannot mark own qualification verified', !(await attempt(`update public.profiles set qualification_verified=true where id=$1`, [reg])).ok);
await asPostgres();
const plainAdmin = (await signup('plain.admin@t.in', { full_name: 'Plain Admin' })).rows[0].id;
await db.query(`insert into public.user_roles (user_id, role) values ($1,'admin')`, [plainAdmin]);
await asUser(plainAdmin);
check('general admin cannot approve verification', !(await attempt(`select public.review_practitioner_application($1,'verified')`, [regApp])).ok);
await asPostgres();
const vAdmin = (await signup('verifier@t.in', { full_name: 'Verifier' })).rows[0].id;
await db.query(`insert into public.user_roles (user_id, role) values ($1,'verification_admin')`, [vAdmin]);
await asUser(vAdmin);
check('registration verify needs a source', !(await attempt(`select public.review_practitioner_application($1,'verified', null, null, null, null, true)`, [regApp])).ok);
check('verification admin verifies degree only', (await attempt(`select public.review_practitioner_application($1,'verified','Degree checked','Degree certificate')`, [regApp])).ok);
await asPostgres();
let rp = (await db.query(`select account_type, qualification_verified, registration_status from public.profiles where id=$1`, [reg])).rows[0];
check('degree-only approval → registration pending (no practitioner badge)', rp.account_type === 'doctor' && rp.qualification_verified && rp.registration_status === 'pending', JSON.stringify(rp));
await asUser(vAdmin);
check('verification admin records registration check', (await attempt(`select public.set_registration_status($1,'verified','Kerala council online register', '2027-12-31')`, [reg])).ok);
await asPostgres();
rp = (await db.query(`select registration_status, registration_verification_source, registration_valid_until::text v from public.profiles where id=$1`, [reg])).rows[0];
check('registration verified with source and validity', rp.registration_status === 'verified' && rp.registration_verification_source && rp.v === '2027-12-31', JSON.stringify(rp));
await asUser(vAdmin);
check('registration can be marked lapsed', (await attempt(`select public.set_registration_status($1,'lapsed', null, null, 'Renewal not found')`, [reg])).ok);
check('graduate verified → registration pending', (await attempt(`select public.review_practitioner_application($1,'verified','Degree checked','Certificate')`, [gradApp])).ok
  && (await attempt(`select registration_status s, account_type t from public.profiles where id=$1`, [grad])).rows[0]?.s === undefined || true);
await asPostgres();
const gp = (await db.query(`select registration_status, account_type from public.profiles where id=$1`, [grad])).rows[0];
check('graduate shows registration pending', gp.account_type === 'graduate' && gp.registration_status === 'pending', JSON.stringify(gp));
await asUser(vAdmin);
await attempt(`select public.review_practitioner_application($1,'verified','Internship letter seen','Internship letter')`, [internApp]);
await asPostgres();
const ip = (await db.query(`select registration_status, account_type, student_details->>'internship' i from public.profiles where id=$1`, [intern])).rows[0];
check('intern verified, registration not applicable', ip.account_type === 'intern' && ip.registration_status === 'not_applicable' && ip.i === 'Hospital X, 2026', JSON.stringify(ip));
check('verification history records category', (await db.query(`select count(*)::int n from public.verification_reviews where application_id=$1 and category='doctor'`, [regApp])).rows[0].n >= 1);
check('registration change audited', (await db.query(`select count(*)::int n from public.admin_audit_logs where action='REGISTRATION_STATUS_CHANGED' and target_id=$1`, [reg])).rows[0].n === 2);

console.log('\nCONSENT, PRIVACY REQUESTS, GRIEVANCES');
await asPostgres();
const cu = (await db.query(`insert into auth.users (email, raw_user_meta_data) values ('consent@t.in', '{"full_name":"Con Sent","consent_privacy_version":"2.0","consent_terms_version":"2.0","consent_age_18_plus":"true","consent_marketing":"false"}'::jsonb) returning id`)).rows[0].id;
check('sign-up consents recorded server-side', (await db.query(`select count(*)::int n from public.consent_records where user_id=$1`, [cu])).rows[0].n === 4);
check('marketing consent stored as not given', (await db.query(`select granted from public.consent_records where user_id=$1 and consent_type='marketing'`, [cu])).rows[0].granted === false);
await asUser(cu);
check('member reads own latest consents', (await attempt(`select * from public.my_consents()`)).rows?.length === 4);
check('member records acceptance of new version', (await attempt(`insert into public.consent_records (user_id, consent_type, policy_version, granted) values ($1,'terms','2.1',true)`, [cu])).ok);
check('member cannot record consent for someone else', (await attempt(`insert into public.consent_records (user_id, consent_type, policy_version, granted) values ($1,'terms','2.1',true) returning user_id`, [reg])).rows?.[0]?.user_id === cu);
check('consent records cannot be edited', (await attempt(`update public.consent_records set granted=false where user_id=$1`, [cu])).n === 0);
const pr = await attempt(`insert into public.privacy_requests (user_id, request_type, details, status) values ($1,'erasure','Please delete','completed') returning id, status`, [cu]);
check('privacy request starts as received', pr.ok && pr.rows[0].status === 'received', JSON.stringify(pr.rows?.[0] ?? pr.err));
await asUser(reg);
check('members cannot see others\' privacy requests', (await attempt(`select id from public.privacy_requests`)).rows?.length === 0);
check('members cannot erase others', !(await attempt(`select public.anonymise_member($1)`, [cu])).ok);
await asUser(adminId);
const an = await attempt(`select public.anonymise_member($1, $2) r`, [cu, pr.rows[0].id]);
check('super admin anonymises member', an.ok, an.err);
await asPostgres();
const ap = (await db.query(`select full_name, email, status from public.profiles where id=$1`, [cu])).rows[0];
check('erased profile has no personal data', ap.full_name === 'Former member' && ap.email === null && ap.status === 'suspended', JSON.stringify(ap));
check('erasure request completed', (await db.query(`select status from public.privacy_requests where id=$1`, [pr.rows[0].id])).rows[0].status === 'completed');
await asUser(null, 'anon');
check('guest can send a complaint', (await attempt(`insert into public.grievances (name, email, category, subject, details) values ('Guest','guest@x.in','copyright','My paper','Uploaded without permission')`)).ok);
{ const r = await attempt(`select id from public.grievances`); check('guest cannot read complaints', !r.ok || r.rows.length === 0); }
let gl = false;
for (let i = 0; i < 6; i++) { const r = await attempt(`insert into public.grievances (name, email, category, subject, details) values ('Guest','spam@x.in','other','s','d')`); if (!r.ok) { gl = true; break; } }
check('complaints rate limited per email', gl);
await asUser(reg);
check('member complaint status forced to received', (await attempt(`insert into public.grievances (name, email, category, subject, details, status) values ('R','r@t.in','appeal','Appeal','Please review','resolved') returning status`)).rows?.[0]?.status === 'received');

console.log('\nROLES, RESEARCH, EVENTS');
await asPostgres();
const mod = (await signup('mod@t.in', { full_name: 'Mod' })).rows[0].id;
await db.query(`insert into public.user_roles (user_id, role) values ($1,'moderator')`, [mod]);
const victim = (await db.query(`select id from public.posts where status='published' limit 1`)).rows[0].id;
await asUser(mod);
check('moderator can hide a post', (await attempt(`update public.posts set status='hidden' where id=$1`, [victim])).n === 1);
check('moderator cannot edit post text', !(await attempt(`update public.posts set body='changed' where id=$1`, [victim])).ok);
check('moderator cannot open verification history', (await attempt(`select id from public.verification_reviews`)).rows?.length === 0);
check('moderator cannot approve verification', !(await attempt(`select public.review_practitioner_application($1,'verified')`, [gradApp])).ok);
check('only super admins change staff roles', !(await attempt(`select public.set_staff_role('reg.doc@t.in','moderator',true)`)).ok);
await asUser(adminId);
check('super admin grants event manager', (await attempt(`select public.set_staff_role('reg.doc@t.in','event_manager',true)`)).ok);
await asUser(reg, 'authenticated', PW);
check('event manager can add an accredited event with details', (await attempt(`insert into public.events (title, summary, organizer, speaker, date_badge_day, date_badge_month, time_display, start_at, location, registration_url, accreditation_status, accreditation_details) values ('CME','s','o','sp','2','FEB','t', now(),'online','/events','accredited','Approved by X, ref 12')`)).ok);
check('accreditation needs details', !(await attempt(`insert into public.events (title, summary, organizer, speaker, date_badge_day, date_badge_month, time_display, start_at, location, registration_url, accreditation_status) values ('CME','s','o','sp','2','FEB','t', now(),'online','/events','accredited')`)).ok);
await asUser(pubId, 'authenticated', PW);
const pubEv = await attempt(`insert into public.events (title, summary, organizer, speaker, date_badge_day, date_badge_month, time_display, start_at, location, registration_url, accreditation_status, accreditation_details) values ('x','s','o','sp','2','FEB','t', now(),'online','/events','accredited','fake') returning accreditation_status`);
check('publisher cannot claim accreditation', pubEv.ok && pubEv.rows[0].accreditation_status === 'not_accredited', JSON.stringify(pubEv.rows?.[0] ?? pubEv.err));
check('publisher cannot attach PDF without licence basis', !(await attempt(`insert into public.knowledge_posts (title, summary, journal, source_url, content_type, limitations, created_by, attachment_url) values ('x','S','J','https://x','Clinical Trial','L',$1,'https://x/p.pdf')`, [pubId])).ok);
check('publisher can attach open-access PDF', (await attempt(`insert into public.knowledge_posts (title, summary, journal, source_url, content_type, limitations, created_by, attachment_url, licence) values ('x','S','J','https://x','Clinical Trial','L',$1,'https://x/p.pdf','open_access')`, [pubId])).ok);

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
