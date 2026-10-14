import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(url && key);
export const supabase = isSupabaseConfigured
  ? createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: false
      }
    })
  : null;

let sessionRequest = null;
async function ensureSession() {
  if (!sessionRequest) {
    sessionRequest = (async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) throw sessionError;
      if (sessionData.session) return sessionData.session.user;
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      return data.user;
    })();
  }
  const pending = sessionRequest;
  try { return await pending; }
  finally { if (sessionRequest === pending) sessionRequest = null; }
}

export async function loadCourses() {
  if (!supabase) return null;
  await ensureSession();

  const { data, error } = await supabase
    .from('courses')
    .select('id, code, name, instructor, grade, final_grade, grade_result, credits, considered, course_type, prerequisite_ids, corequisite_ids, gradebook, color, assessments')
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data.map(row => ({ ...row, finalGrade:row.final_grade == null ? null : Number(row.final_grade), gradeResult:row.grade_result || '', courseType:row.course_type, prerequisiteIds:row.prerequisite_ids || [], corequisiteIds:row.corequisite_ids || [], final_grade:undefined, grade_result:undefined, course_type:undefined, prerequisite_ids:undefined, corequisite_ids:undefined }));
}

const courseRow = course => ({ code:course.code, name:course.name, instructor:course.instructor || '', grade:course.grade ?? 0, final_grade:course.finalGrade, grade_result:course.gradeResult || '', credits:course.credits, considered:course.considered !== false, course_type:course.courseType || 'Core', prerequisite_ids:course.prerequisiteIds || [], corequisite_ids:course.corequisiteIds || [], gradebook:course.gradebook || null, color:course.color, assessments:course.assessments || 0 });

export async function createCourse(course) {
  if (!supabase) return null;
  const user = await ensureSession();
  const { data, error } = await supabase
    .from('courses')
    .insert({ ...courseRow(course), user_id: user.id })
    .select('id, code, name, instructor, grade, final_grade, grade_result, credits, considered, course_type, prerequisite_ids, corequisite_ids, gradebook, color, assessments')
    .single();

  if (error) throw error;
  return { ...data, finalGrade:data.final_grade == null ? null : Number(data.final_grade), gradeResult:data.grade_result || '', courseType:data.course_type, prerequisiteIds:data.prerequisite_ids || [], corequisiteIds:data.corequisite_ids || [] };
}

export async function updateCourse(course) {
  if (!supabase) return null;
  const { data, error } = await supabase.from('courses').update(courseRow(course)).eq('id', course.id).select('id, code, name, instructor, grade, final_grade, grade_result, credits, considered, course_type, prerequisite_ids, corequisite_ids, gradebook, color, assessments').single();
  if (error) throw error;
  return { ...data, finalGrade:data.final_grade == null ? null : Number(data.final_grade), gradeResult:data.grade_result || '', courseType:data.course_type, prerequisiteIds:data.prerequisite_ids || [], corequisiteIds:data.corequisite_ids || [] };
}

export async function deleteCourse(id) {
  if (!supabase) return;
  const { error } = await supabase.from('courses').delete().eq('id', id);
  if (error) throw error;
}

export async function loadProfile() {
  if (!supabase) return null;
  await ensureSession();

  const { data, error } = await supabase
    .from('profiles')
    .select('full_name, year, student_number, curriculum, goal_gwa, scale_type')
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function saveProfile(profile) {
  if (!supabase) return null;
  const user = await ensureSession();

  const { data, error } = await supabase
    .from('profiles')
    .upsert({ user_id: user.id, ...profile }, { onConflict: 'user_id' })
    .select('full_name, year, student_number, curriculum, goal_gwa, scale_type')
    .single();

  if (error) throw error;
  return data;
}

export async function getAccount() {
  if (!supabase) return null;
  await ensureSession();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw error;
  return data.user;
}

export async function signInWithPassword(email, password) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function linkAnonymousEmail(email) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.auth.updateUser({ email });
  if (error) throw error;
  return data.user;
}

export async function signOutCurrentSession() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut({ scope: 'local' });
  if (error) throw error;
}

export async function deleteOwnAccount() {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { error } = await supabase.rpc('delete_own_account');
  if (error) throw error;
  await supabase.auth.signOut({ scope: 'local' });
}

export async function loadTerms() {
  if (!supabase) return null;
  await ensureSession();
  const { data, error } = await supabase.from('terms').select('*').order('start_date');
  if (error) throw error;
  return data.map(row => ({ id:row.id, name:row.name, academicYear:row.academic_year, format:row.format, number:row.term_number, startDate:row.start_date || '', endDate:row.end_date || '', targetGwa:Number(row.target_gwa), notes:row.notes || '', courseIds:row.course_ids || [], completed:row.completed, gradesLocked:row.grades_locked }));
}

export async function upsertTerm(term) {
  if (!supabase) return null;
  const user = await ensureSession();
  const row = { id:term.id, user_id:user.id, name:term.name, academic_year:term.academicYear, format:term.format, term_number:term.number, start_date:term.startDate || null, end_date:term.endDate || null, target_gwa:term.targetGwa, notes:term.notes, course_ids:term.courseIds, completed:term.completed, grades_locked:term.gradesLocked };
  const { error } = await supabase.from('terms').upsert(row);
  if (error) throw error;
  return term;
}

export async function deleteTerm(id) {
  if (!supabase) return;
  const { error } = await supabase.from('terms').delete().eq('id', id);
  if (error) throw error;
}
