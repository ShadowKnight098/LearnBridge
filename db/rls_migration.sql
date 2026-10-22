-- =====================================================================
-- LearnBridge: Row Level Security migration
-- Run AFTER learnbridge_schema_v2.sql, as the schema owner (not as the app role).
--
-- HOW IT WORKS
--   * Your API authenticates the user (username + PIN/password), then for every
--     request/transaction does:
--         BEGIN;
--         SELECT set_config('app.user_id', '<user uuid>', true);   -- true = transaction-local
--         ... queries ...
--         COMMIT;
--     The user id must come from your server-side session, never from client input.
--   * Two database roles:
--       lb_app      the API, acting on behalf of ONE logged-in user (RLS enforced)
--       lb_service  trusted background work: question generation, mastery/XP/streak
--                   engine, alert and report jobs (full access, no user context)
--   * Create your real login roles as members, e.g.:
--         CREATE ROLE api_user LOGIN PASSWORD '...' IN ROLE lb_app;
--         CREATE ROLE worker   LOGIN PASSWORD '...' IN ROLE lb_service;
--   * The owner/superuser role bypasses RLS (no FORCE). Run migrations as the owner,
--     and never connect the API as the owner.
--   * Login happens BEFORE a user id exists, so it uses auth_lookup() and
--     auth_record_login() (SECURITY DEFINER) instead of reading users directly.
--     lb_app cannot read users.password_hash at all (column privileges).
--   * Users are never hard-deleted: there is no DELETE grant on users.
-- =====================================================================
BEGIN;

-- ---------- Roles ----------
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lb_app')     THEN CREATE ROLE lb_app     NOLOGIN; END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'lb_service') THEN CREATE ROLE lb_service NOLOGIN; END IF;
END $$;

GRANT USAGE ON SCHEMA public TO lb_app, lb_service;

-- ---------- Identity helpers ----------
-- Current user from the transaction-local setting ('' / unset => NULL => no access)
CREATE FUNCTION app_user_id() RETURNS uuid
LANGUAGE sql STABLE AS $$
  SELECT NULLIF(current_setting('app.user_id', true), '')::uuid
$$;

-- Role of the current user; NULL if no context, unknown user, or deactivated user
CREATE FUNCTION app_role() RETURNS user_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT role FROM users WHERE id = app_user_id() AND is_active
$$;

CREATE FUNCTION my_parent_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT parent_id FROM users WHERE id = app_user_id() AND is_active
$$;

-- Is p_target me, one of my direct children, or a grandchild?
--   student -> only self
--   teacher -> self + own students
--   admin   -> self + own teachers + their students
CREATE FUNCTION in_my_tree(p_target uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT app_role() IS NOT NULL AND EXISTS (
    SELECT 1
    FROM users u
    LEFT JOIN users p ON p.id = u.parent_id
    WHERE u.id = p_target
      AND (u.id = app_user_id() OR u.parent_id = app_user_id() OR p.parent_id = app_user_id())
  )
$$;

-- Class I can see: one I manage (teacher/admin) or one I am enrolled in (student)
CREATE FUNCTION class_visible(p_class uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (
    SELECT 1 FROM classes c
    WHERE c.id = p_class
      AND ( in_my_tree(c.teacher_id)
         OR EXISTS (SELECT 1 FROM class_students cs
                    WHERE cs.class_id = c.id AND cs.student_id = app_user_id()) )
  )
$$;

-- Class I may manage: teacher owns it, or admin owns that teacher
CREATE FUNCTION class_managed(p_class uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT app_role() IN ('admin','teacher') AND EXISTS (
    SELECT 1 FROM classes c WHERE c.id = p_class AND in_my_tree(c.teacher_id)
  )
$$;

CREATE FUNCTION student_in_class(p_class uuid) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT EXISTS (SELECT 1 FROM class_students WHERE class_id = p_class AND student_id = app_user_id())
$$;

-- ---------- Login flow (runs before a user context exists) ----------
-- Students must supply their class code; teachers/admins log in with username only.
CREATE FUNCTION auth_lookup(p_username TEXT, p_class_code TEXT DEFAULT NULL)
RETURNS TABLE (id UUID, role user_role, password_hash TEXT, language lang_code,
               is_active BOOLEAN, locked_until TIMESTAMPTZ)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp AS $$
  SELECT u.id, u.role, u.password_hash, u.language, u.is_active, u.locked_until
  FROM users u
  WHERE u.username = lower(p_username)
    AND ( u.role <> 'student'
          OR EXISTS (SELECT 1 FROM class_students cs
                     JOIN classes c ON c.id = cs.class_id
                     WHERE cs.student_id = u.id AND c.class_code = upper(p_class_code)) )
$$;

-- Call after verifying the hash. 5 failures => 15 minute lock.
CREATE FUNCTION auth_record_login(p_user UUID, p_success BOOLEAN) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
BEGIN
  IF p_success THEN
    UPDATE users SET failed_logins = 0, locked_until = NULL, last_login_at = now() WHERE id = p_user;
  ELSE
    UPDATE users
       SET failed_logins = failed_logins + 1,
           locked_until  = CASE WHEN failed_logins + 1 >= 5 THEN now() + interval '15 minutes'
                                ELSE locked_until END
     WHERE id = p_user;
  END IF;
END $$;

-- ---------- Make v2 validation triggers see ground truth, not RLS-filtered rows ----------
ALTER FUNCTION assert_role(UUID, user_role, TEXT) SECURITY DEFINER SET search_path = public, pg_temp;
ALTER FUNCTION users_check_hierarchy()            SECURITY DEFINER SET search_path = public, pg_temp;
ALTER FUNCTION classes_check_roles()              SECURITY DEFINER SET search_path = public, pg_temp;
ALTER FUNCTION class_students_check()             SECURITY DEFINER SET search_path = public, pg_temp;
ALTER FUNCTION documents_check()                  SECURITY DEFINER SET search_path = public, pg_temp;
ALTER FUNCTION skill_prereq_no_cycle()            SECURITY DEFINER SET search_path = public, pg_temp;
ALTER FUNCTION assignments_check()                SECURITY DEFINER SET search_path = public, pg_temp;
ALTER FUNCTION attempts_before_write()            SECURITY DEFINER SET search_path = public, pg_temp;
ALTER FUNCTION users_create_student_profile()     SECURITY DEFINER SET search_path = public, pg_temp;

-- purchase_item now runs with owner rights (it writes profile/items/audit log, which
-- lb_app cannot write directly) and only lets a user buy for themselves.
CREATE OR REPLACE FUNCTION purchase_item(p_student UUID, p_item TEXT) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_temp AS $$
DECLARE
  v_cost  INT;
  v_coins INT;
BEGIN
  IF app_user_id() IS NOT NULL AND p_student IS DISTINCT FROM app_user_id() THEN
    RAISE EXCEPTION 'you can only buy items for yourself' USING ERRCODE = 'insufficient_privilege';
  END IF;

  SELECT cost INTO v_cost FROM shop_items WHERE id = p_item;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'unknown shop item: %', p_item USING ERRCODE = 'no_data_found';
  END IF;

  SELECT coins INTO v_coins FROM student_profile WHERE student_id = p_student FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'no profile for student %', p_student USING ERRCODE = 'no_data_found';
  END IF;
  IF v_coins < v_cost THEN
    RAISE EXCEPTION 'insufficient coins (% < %)', v_coins, v_cost USING ERRCODE = 'check_violation';
  END IF;

  INSERT INTO student_items(student_id, item_id) VALUES (p_student, p_item);
  UPDATE student_profile SET coins = coins - v_cost WHERE student_id = p_student;
  INSERT INTO reward_events(student_id, type, amount, reason)
    VALUES (p_student, 'purchase', -v_cost, 'bought ' || p_item);
END $$;

-- Users may edit their own profile but never their own username or active flag.
CREATE FUNCTION users_guard_self_update() RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  IF app_user_id() IS NOT NULL AND NEW.id = app_user_id()
     AND (NEW.is_active IS DISTINCT FROM OLD.is_active OR NEW.username IS DISTINCT FROM OLD.username) THEN
    RAISE EXCEPTION 'you cannot change your own username or active status'
      USING ERRCODE = 'insufficient_privilege';
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_users_self_update
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION users_guard_self_update();

-- ---------- Function privileges ----------
REVOKE ALL ON FUNCTION
  app_user_id(), app_role(), my_parent_id(), in_my_tree(UUID), class_visible(UUID),
  class_managed(UUID), student_in_class(UUID), auth_lookup(TEXT, TEXT),
  auth_record_login(UUID, BOOLEAN), assert_role(UUID, user_role, TEXT), purchase_item(UUID, TEXT)
FROM PUBLIC;

GRANT EXECUTE ON FUNCTION
  app_user_id(), app_role(), my_parent_id(), in_my_tree(UUID), class_visible(UUID),
  class_managed(UUID), student_in_class(UUID), auth_lookup(TEXT, TEXT),
  auth_record_login(UUID, BOOLEAN), purchase_item(UUID, TEXT)
TO lb_app, lb_service;

-- ---------- Enable RLS + service-role policy on every table ----------
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users','classes','class_students','skills','skill_prerequisites','documents','chunks',
    'generation_jobs','questions','assignments','sessions','attempts','mastery','student_profile',
    'badges','student_badges','reward_events','shop_items','student_items','challenges',
    'challenge_progress','report_snapshots','alerts'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('CREATE POLICY svc_all ON %I TO lb_service USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;

-- =====================================================================
-- users
-- =====================================================================
CREATE POLICY users_select ON users FOR SELECT TO lb_app
  USING (in_my_tree(id) OR id = my_parent_id());

-- admin creates teachers (and students under teachers in their tree); teacher creates own students
CREATE POLICY users_insert ON users FOR INSERT TO lb_app
  WITH CHECK (
    (app_role() = 'admin' AND (
        (role = 'teacher' AND parent_id = app_user_id())
     OR (role = 'student' AND in_my_tree(parent_id))))
    OR (app_role() = 'teacher' AND role = 'student' AND parent_id = app_user_id())
  );

CREATE POLICY users_update_managed ON users FOR UPDATE TO lb_app
  USING      (app_role() IN ('admin','teacher') AND id <> app_user_id() AND in_my_tree(id))
  WITH CHECK (app_role() IN ('admin','teacher') AND id <> app_user_id() AND in_my_tree(id));

CREATE POLICY users_update_self ON users FOR UPDATE TO lb_app
  USING (id = app_user_id() AND app_role() IS NOT NULL)
  WITH CHECK (id = app_user_id());

-- =====================================================================
-- classes / class_students
-- =====================================================================
CREATE POLICY classes_select ON classes FOR SELECT TO lb_app
  USING (class_visible(id));

CREATE POLICY classes_insert ON classes FOR INSERT TO lb_app
  WITH CHECK (app_role() IN ('admin','teacher') AND in_my_tree(teacher_id) AND created_by = app_user_id());

CREATE POLICY classes_update ON classes FOR UPDATE TO lb_app
  USING (class_managed(id))
  WITH CHECK (app_role() IN ('admin','teacher') AND in_my_tree(teacher_id));

CREATE POLICY classes_delete ON classes FOR DELETE TO lb_app
  USING (class_managed(id));

CREATE POLICY class_students_select ON class_students FOR SELECT TO lb_app
  USING (student_id = app_user_id() OR class_managed(class_id));

CREATE POLICY class_students_insert ON class_students FOR INSERT TO lb_app
  WITH CHECK (class_managed(class_id) AND in_my_tree(student_id));

CREATE POLICY class_students_delete ON class_students FOR DELETE TO lb_app
  USING (class_managed(class_id));

-- =====================================================================
-- Reference data: everyone logged in can read, only admin can change
-- =====================================================================
DO $$
DECLARE t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['skills','skill_prerequisites','badges','shop_items'] LOOP
    EXECUTE format('CREATE POLICY %I ON %I FOR SELECT TO lb_app USING (app_role() IS NOT NULL)', t || '_select', t);
    EXECUTE format('CREATE POLICY %I ON %I FOR ALL TO lb_app USING (app_role() = ''admin'') WITH CHECK (app_role() = ''admin'')', t || '_admin', t);
  END LOOP;
END $$;

-- =====================================================================
-- documents, chunks, generation_jobs (teacher content; students have no access)
-- =====================================================================
CREATE POLICY documents_select ON documents FOR SELECT TO lb_app
  USING (app_role() IN ('admin','teacher') AND in_my_tree(teacher_id));

CREATE POLICY documents_write ON documents FOR ALL TO lb_app
  USING      (app_role() = 'teacher' AND teacher_id = app_user_id())
  WITH CHECK (app_role() = 'teacher' AND teacher_id = app_user_id());

-- chunks / jobs inherit visibility from documents (the subquery is itself RLS-filtered)
CREATE POLICY chunks_select ON chunks FOR SELECT TO lb_app
  USING (document_id IN (SELECT id FROM documents));
CREATE POLICY chunks_write ON chunks FOR ALL TO lb_app
  USING      (app_role() = 'teacher' AND document_id IN (SELECT id FROM documents))
  WITH CHECK (app_role() = 'teacher' AND document_id IN (SELECT id FROM documents));

CREATE POLICY jobs_select ON generation_jobs FOR SELECT TO lb_app
  USING (document_id IN (SELECT id FROM documents));
CREATE POLICY jobs_write ON generation_jobs FOR ALL TO lb_app
  USING      (app_role() = 'teacher' AND document_id IN (SELECT id FROM documents))
  WITH CHECK (app_role() = 'teacher' AND document_id IN (SELECT id FROM documents));

-- =====================================================================
-- questions
--   students : approved questions that are global or from their own teacher
--   teachers : global + their own;  admins: global + their tree's
--   writes   : teachers on their own questions; admins on global + their tree's
-- =====================================================================
CREATE POLICY questions_select ON questions FOR SELECT TO lb_app
  USING (
    CASE
      WHEN app_role() = 'student'
        THEN status = 'approved' AND (owner_id IS NULL OR owner_id = my_parent_id())
      WHEN app_role() IN ('admin','teacher')
        THEN owner_id IS NULL OR in_my_tree(owner_id)
      ELSE FALSE
    END
  );

CREATE POLICY questions_write ON questions FOR ALL TO lb_app
  USING (
       (app_role() = 'teacher' AND owner_id = app_user_id())
    OR (app_role() = 'admin'   AND (owner_id IS NULL OR in_my_tree(owner_id)))
  )
  WITH CHECK (
    (   (app_role() = 'teacher' AND owner_id = app_user_id())
     OR (app_role() = 'admin'   AND (owner_id IS NULL OR in_my_tree(owner_id))) )
    AND (chunk_id IS NULL OR chunk_id IN (SELECT id FROM chunks))
  );

-- =====================================================================
-- assignments
-- =====================================================================
CREATE POLICY assignments_select ON assignments FOR SELECT TO lb_app
  USING (
       (app_role() = 'teacher' AND teacher_id = app_user_id())
    OR (app_role() = 'admin'   AND in_my_tree(teacher_id))
    OR (app_role() = 'student' AND (student_id = app_user_id()
                                    OR (class_id IS NOT NULL AND student_in_class(class_id))))
  );

CREATE POLICY assignments_write ON assignments FOR ALL TO lb_app
  USING      (app_role() = 'teacher' AND teacher_id = app_user_id())
  WITH CHECK (app_role() = 'teacher' AND teacher_id = app_user_id());

-- =====================================================================
-- Practice: sessions, attempts (students write their own; staff read their tree)
-- =====================================================================
CREATE POLICY sessions_select ON sessions FOR SELECT TO lb_app
  USING (in_my_tree(student_id));
CREATE POLICY sessions_insert ON sessions FOR INSERT TO lb_app
  WITH CHECK (app_role() = 'student' AND student_id = app_user_id());
CREATE POLICY sessions_update ON sessions FOR UPDATE TO lb_app
  USING      (app_role() = 'student' AND student_id = app_user_id())
  WITH CHECK (app_role() = 'student' AND student_id = app_user_id());

CREATE POLICY attempts_select ON attempts FOR SELECT TO lb_app
  USING (in_my_tree(student_id));
CREATE POLICY attempts_insert ON attempts FOR INSERT TO lb_app
  WITH CHECK (app_role() = 'student' AND student_id = app_user_id());

-- =====================================================================
-- Progress and rewards (read-only for lb_app; the engine writes as lb_service)
-- =====================================================================
CREATE POLICY mastery_select ON mastery FOR SELECT TO lb_app
  USING (in_my_tree(student_id));

CREATE POLICY profile_select ON student_profile FOR SELECT TO lb_app
  USING (in_my_tree(student_id));
-- students may change only avatar_config (column grant below)
CREATE POLICY profile_update ON student_profile FOR UPDATE TO lb_app
  USING      (app_role() = 'student' AND student_id = app_user_id())
  WITH CHECK (app_role() = 'student' AND student_id = app_user_id());

CREATE POLICY student_badges_select ON student_badges FOR SELECT TO lb_app
  USING (in_my_tree(student_id));
-- staff can hand out MANUAL badges to students in their tree, and revoke ones they gave
CREATE POLICY student_badges_award ON student_badges FOR INSERT TO lb_app
  WITH CHECK (
    app_role() IN ('admin','teacher')
    AND awarded_by = app_user_id()
    AND in_my_tree(student_id)
    AND badge_id IN (SELECT id FROM badges WHERE criteria->>'type' = 'manual')
  );
CREATE POLICY student_badges_revoke ON student_badges FOR DELETE TO lb_app
  USING (awarded_by = app_user_id());

CREATE POLICY reward_events_select ON reward_events FOR SELECT TO lb_app
  USING (in_my_tree(student_id));

-- items are bought via purchase_item(); students may only toggle `equipped`
CREATE POLICY student_items_select ON student_items FOR SELECT TO lb_app
  USING (in_my_tree(student_id));
CREATE POLICY student_items_update ON student_items FOR UPDATE TO lb_app
  USING      (app_role() = 'student' AND student_id = app_user_id())
  WITH CHECK (app_role() = 'student' AND student_id = app_user_id());

-- =====================================================================
-- Challenges (class_id NULL = global, admin-managed)
-- =====================================================================
CREATE POLICY challenges_select ON challenges FOR SELECT TO lb_app
  USING (app_role() IS NOT NULL AND (class_id IS NULL OR class_visible(class_id)));

CREATE POLICY challenges_write ON challenges FOR ALL TO lb_app
  USING (
       (class_id IS NOT NULL AND class_managed(class_id))
    OR (class_id IS NULL AND app_role() = 'admin')
  )
  WITH CHECK (
       (class_id IS NOT NULL AND class_managed(class_id))
    OR (class_id IS NULL AND app_role() = 'admin')
  );

CREATE POLICY challenge_progress_select ON challenge_progress FOR SELECT TO lb_app
  USING (in_my_tree(student_id));

-- =====================================================================
-- Reports and alerts
-- =====================================================================
CREATE POLICY report_snapshots_select ON report_snapshots FOR SELECT TO lb_app
  USING (
    CASE scope
      WHEN 'school'  THEN app_role() = 'admin'
      WHEN 'class'   THEN class_managed(scope_id)
      WHEN 'student' THEN in_my_tree(scope_id)
    END
  );

CREATE POLICY alerts_select ON alerts FOR SELECT TO lb_app
  USING (
       (app_role() = 'teacher' AND teacher_id = app_user_id())
    OR (app_role() = 'admin'   AND in_my_tree(teacher_id))
  );
-- teachers can only resolve (column grant below)
CREATE POLICY alerts_resolve ON alerts FOR UPDATE TO lb_app
  USING      (app_role() = 'teacher' AND teacher_id = app_user_id())
  WITH CHECK (app_role() = 'teacher' AND teacher_id = app_user_id());

-- =====================================================================
-- Table / column privileges (RLS filters rows; these limit operations and columns)
-- =====================================================================
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM PUBLIC, lb_app, lb_service;

-- lb_service: full access, except no hard-deleting users and an append-only audit log
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO lb_service;
REVOKE DELETE ON users FROM lb_service;
REVOKE UPDATE, DELETE ON reward_events FROM lb_service;

-- lb_app: users - password_hash and lockout columns are invisible to the API
GRANT SELECT (id, role, parent_id, name, username, language, is_active, created_at, last_login_at)
  ON users TO lb_app;
GRANT INSERT (role, parent_id, name, username, password_hash, language) ON users TO lb_app;
GRANT UPDATE (name, username, password_hash, language, is_active)       ON users TO lb_app;

GRANT SELECT, INSERT, UPDATE, DELETE ON classes, documents, chunks, generation_jobs,
      questions, assignments, challenges                         TO lb_app;
GRANT SELECT, INSERT, DELETE ON class_students                   TO lb_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON skills, skill_prerequisites, badges, shop_items TO lb_app;
GRANT SELECT, INSERT, UPDATE ON sessions                         TO lb_app;
GRANT SELECT, INSERT ON attempts                                 TO lb_app;
GRANT SELECT ON mastery, reward_events, challenge_progress, report_snapshots TO lb_app;
GRANT SELECT ON student_profile                                  TO lb_app;
GRANT UPDATE (avatar_config) ON student_profile                  TO lb_app;
GRANT SELECT, INSERT, DELETE ON student_badges                   TO lb_app;
GRANT SELECT ON student_items                                    TO lb_app;
GRANT UPDATE (equipped) ON student_items                         TO lb_app;
GRANT SELECT ON alerts                                           TO lb_app;
GRANT UPDATE (resolved, resolved_at) ON alerts                   TO lb_app;

-- Future tables are NOT granted anything automatically: add policies + grants deliberately.

COMMIT;
