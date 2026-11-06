# Changing who is admin

Run these in **Supabase → SQL Editor → New query → Run**.
The new person must **sign up on the website first** (email or Google).

## Give admin to a new Gmail and remove it from the old one
```sql
CALL public.transfer_super_admin('new.admin@gmail.com', 'old.admin@gmail.com');
```

## Only add a new admin (keep the current one)
```sql
CALL public.transfer_super_admin('new.admin@gmail.com');
```

## Check who is admin now
```sql
select u.email, p.role
from auth.users u join public.profiles p on p.id = u.id
where p.role in ('admin', 'super_admin');
```

After the change, both people should **sign out and sign in again**.
Every change is recorded in Admin → Audit Logs.
