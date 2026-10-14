import './styles/app.css';
import { chooseBackupImportMode, mergeBackupData } from './features/backup-import.js';
import { mergeCourseLists, preserveLocalWorkspace } from './services/course-sync.js';
import { importCoreCourses } from './data/course-imports.js';
import { courseTypeColor } from './data/course-colors.js';
import { normalizeIcons } from './components/icons.js';
import { closeActivePopups } from './components/popup-dismiss.js';
import { styleColorPicker } from './components/color-picker.js';
import { styleDatePicker } from './components/date-picker.js';
import { styleTermDropdown } from './components/term-dropdown.js';
import { appVersion, renderChangelog } from './features/changelog.js';
import { createCourse, deleteCourse, deleteOwnAccount, deleteTerm, getAccount, isSupabaseConfigured, linkAnonymousEmail, loadCourses, loadProfile, loadTerms, saveProfile, signInWithPassword, signOutCurrentSession, updateCourse, upsertTerm } from './services/supabase.js';
import { adjustAcademicStart, bindTermsPage, createDefaultTerms, ensureAutomaticTerms, getVisibleTerms, renderTermsPage, statusFor } from './features/terms.js';
import { bindGradesPage, calculateCourseGrade, ensureGradebook, renderGradesPage } from './features/grades.js';

const defaultCourses = [
  { id: 1, code: 'MATH 201', name: 'Calculus II', instructor: 'Prof. Santos', grade: 91, credits: 4, considered: true, courseType: 'Core', color: '#ff6b51', assessments: 8 },
  { id: 2, code: 'CS 240', name: 'Data Structures', instructor: 'Prof. Reyes', grade: 87, credits: 4, considered: true, courseType: 'Specialization', color: '#7967e8', assessments: 10 },
  { id: 3, code: 'PHYS 150', name: 'Physics I', instructor: 'Prof. Cruz', grade: 84, credits: 3, considered: true, courseType: 'Core', color: '#2fa8a0', assessments: 6 },
  { id: 4, code: 'ENG 102', name: 'Academic Writing', instructor: 'Prof. Lim', grade: 94, credits: 3, considered: false, courseType: 'Elective', color: '#e0a228', assessments: 7 }
];

const recent = [
  { title: 'Integration techniques', course: 'Calculus II', score: '46 / 50', grade: 92, date: 'Today' },
  { title: 'Binary trees lab', course: 'Data Structures', score: '85 / 100', grade: 85, date: 'Sep 29' },
  { title: 'Kinematics report', course: 'Physics I', score: '42 / 50', grade: 84, date: 'Sep 26' }
];

const mapuaCurricula = [
  ['ACT', 'Bachelor of Science in Accountancy'], ['ADA', 'Bachelor of Arts in Advertising Design'],
  ['AIE', 'Bachelor of Science in Artificial Intelligence Engineering'], ['AR', 'Bachelor of Science in Architecture'],
  ['BA', 'Bachelor of Science in Business Administration'], ['BE', 'Bachelor of Science in Biological Engineering'],
  ['BIA', 'Bachelor of Science in Business Intelligence and Analytics'], ['BIO', 'Bachelor of Science in Biology'],
  ['BMA', 'Bachelor of Arts in Broadcast Media'], ['BMMA', 'Bachelor of Multimedia Arts'],
  ['BMMABMA', 'Multimedia Arts and Broadcast Media (Double Degree)'], ['BMMADJA', 'Multimedia Arts and Digital Journalism (Double Degree)'],
  ['BPE', 'Bachelor in Physical Education – Sports and Wellness Management'], ['CCE', 'Chemical Engineering and Chemistry (Double Degree)'],
  ['CE', 'Bachelor of Science in Civil Engineering'], ['CEM', 'Bachelor of Science in Construction Engineering and Management'],
  ['CEMSE', 'Civil Engineering and Materials Science and Engineering (Double Degree)'], ['CESE', 'Civil Engineering and Environmental and Sanitary Engineering (Double Degree)'],
  ['CHE', 'Bachelor of Science in Chemical Engineering'], ['CHM', 'Bachelor of Science in Chemistry'],
  ['CPE', 'Bachelor of Science in Computer Engineering'], ['CS', 'Bachelor of Science in Computer Science'],
  ['CYB', 'Bachelor of Science in Cybersecurity'], ['DF', 'Bachelor of Arts in Digital Film'],
  ['DJA', 'Bachelor of Arts in Digital Journalism'], ['DS', 'Bachelor of Science in Data Science'],
  ['ECE', 'Bachelor of Science in Electronics Engineering'], ['EE', 'Bachelor of Science in Electrical Engineering'],
  ['EMC', 'Bachelor of Science in Entertainment and Multimedia Computing'], ['ENT', 'Bachelor of Science in Entrepreneurship'],
  ['EP', 'Bachelor of Science in Environmental Planning'], ['ESE', 'Bachelor of Science in Environmental and Sanitary Engineering'],
  ['FNT', 'Bachelor of Science in Financial Technology'], ['GEO', 'Bachelor of Science in Geology'],
  ['GSE', 'Bachelor of Science in Geological Science and Engineering'], ['GLM', 'Bachelor of Science in Global Management'],
  ['ID', 'Bachelor of Science in Industrial Design'], ['IE', 'Bachelor of Science in Industrial Engineering'],
  ['INT', 'Bachelor of Science in Interior Design'], ['IS', 'Bachelor of Science in Information Systems'],
  ['IT', 'Bachelor of Science in Information Technology'], ['MDT', 'Bachelor of Science in Medical Technology'],
  ['ME', 'Bachelor of Science in Mechanical Engineering'], ['MEBE', 'Mechanical Engineering and Biological Engineering (Double Degree)'],
  ['MEMSE', 'Mechanical Engineering and Materials Science and Engineering (Double Degree)'], ['MFGE', 'Bachelor of Science in Manufacturing Engineering'],
  ['MGTE', 'Bachelor of Science in Management Engineering'], ['MKT', 'Bachelor of Science in Marketing'],
  ['MSE', 'Bachelor of Science in Materials Science and Engineering'], ['NRGE', 'Bachelor of Science in Energy Engineering'],
  ['NRS', 'Bachelor of Science in Nursing'], ['PHEC', 'Physics and Electronics Engineering (Double Degree)'],
  ['PHEE', 'Physics and Electrical Engineering (Double Degree)'], ['PHMS', 'Physics and Materials Science and Engineering (Double Degree)'],
  ['PHY', 'Bachelor of Science in Physics'], ['PSYA', 'Bachelor of Arts in Psychology'],
  ['PSYB', 'Bachelor of Science in Psychology'], ['REM', 'Bachelor of Science in Real Estate Management'],
  ['TCB', 'Bachelor of Science in Technical Communication'], ['UP', 'Bachelor of Science in Urban Planning'],
  ['CETCE', 'Civil Engineering Technology to Bachelor of Science in Civil Engineering (Ladderized)'],
  ['CHETCHE', 'Chemical Engineering Technology to Bachelor of Science in Chemical Engineering (Ladderized)'],
  ['CPETCPE', 'Computer Engineering Technology to Bachelor of Science in Computer Engineering (Ladderized)'],
  ['ECETECE', 'Electronics Engineering Technology to Bachelor of Science in Electronics Engineering (Ladderized)'],
  ['EETEE', 'Electrical Engineering Technology to Bachelor of Science in Electrical Engineering (Ladderized)'],
  ['ESETESE', 'Environmental and Sanitary Engineering Technology to BS Environmental and Sanitary Engineering (Ladderized)'],
  ['IETIE', 'Industrial Engineering Technology to Bachelor of Science in Industrial Engineering (Ladderized)'],
  ['METME', 'Mechanical Engineering Technology to Bachelor of Science in Mechanical Engineering (Ladderized)'],
  ['ME-MSE', 'Mechanical Engineering (Mapúa) and Mechanical System Engineering (KIT Korea) Dual Degree'],
  ['CPE-O', 'Online Bachelor of Science in Computer Engineering'], ['ECE-O', 'Online Bachelor of Science in Electronics Engineering'],
  ['EE-O', 'Online Bachelor of Science in Electrical Engineering'], ['IE-O', 'Online Bachelor of Science in Industrial Engineering'],
  ['CS-O', 'Online Bachelor of Science in Computer Science'], ['IT-O', 'Online Bachelor of Science in Information Technology']
];

const defaultProfile = {
  full_name: 'Your Name',
  year: '',
  student_number: '',
  curriculum: '',
  goal_gwa: 1.5,
  scale_type: '1-highest'
};

const gwaOptions = Array.from({ length: 17 }, (_, index) => (1 + index * 0.25).toFixed(2));
const defaultGradeConversion = [
  { gwa:1, min:97, max:100 }, { gwa:1.25, min:94, max:96.99 }, { gwa:1.5, min:91, max:93.99 },
  { gwa:1.75, min:88, max:90.99 }, { gwa:2, min:85, max:87.99 }, { gwa:2.25, min:82, max:84.99 },
  { gwa:2.5, min:79, max:81.99 }, { gwa:2.75, min:76, max:78.99 }, { gwa:3, min:75, max:75.99 },
  { gwa:5, min:0, max:74.99 }
];
const defaultSettings = { theme: 'system', accent: '#ff6047', density: 'comfortable', sidebarOpen: true, defaultUnits: 3, requiredUnits: 180, academicStartDate: '2026-08-01', termFormat: 'quarter', gradeConversion:defaultGradeConversion };
const storedSettings = JSON.parse(localStorage.getItem('grade-tracker-settings') || 'null') || {};
if (!storedSettings.academicStartDate && storedSettings.academicStart) storedSettings.academicStartDate = `${storedSettings.academicStart}-08-01`;

const state = {
  courses: JSON.parse(localStorage.getItem('grade-tracker-courses') || 'null') || defaultCourses,
  active: 'Overview',
  sidebarCollapsed: localStorage.getItem('grade-tracker-sidebar') === 'collapsed',
  sync: isSupabaseConfigured ? 'connecting' : 'local',
  profile: JSON.parse(localStorage.getItem('grade-tracker-profile') || 'null') || defaultProfile,
  profileSaved: false,
  profileEditing: false,
  settings: { ...defaultSettings, ...storedSettings },
  lastSync: localStorage.getItem('grade-tracker-last-sync') || '',
  account: null,
  notice: '',
  selectedCourseId: null
  ,selectedGradeCourseId: localStorage.getItem('grade-tracker-selected-grade-course')
  ,terms: JSON.parse(localStorage.getItem('grade-tracker-terms') || 'null') || createDefaultTerms(),
  selectedTermId: null
};
if (!Array.isArray(state.settings.gradeConversion) || state.settings.gradeConversion.length !== defaultGradeConversion.length) state.settings.gradeConversion = defaultGradeConversion.map(range => ({ ...range }));
state.courses.forEach(course=>{if(!Object.hasOwn(course,'finalGrade'))course.finalGrade=courseGwa(Number(course.grade),state.profile.scale_type,state.settings.gradeConversion);});

function applyPreferences() {
  const dark = state.settings.theme === 'dark' || (state.settings.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.dataset.density = state.settings.density;
  document.documentElement.style.setProperty('--app-accent', state.settings.accent);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#111518' : '#f5f6f8');
}

function markSynced() {
  state.lastSync = new Date().toISOString();
  localStorage.setItem('grade-tracker-last-sync', state.lastSync);
}

function downloadFile(name, content, type) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url; link.download = name; link.click();
  URL.revokeObjectURL(url);
}

const icon = (name) => ({
  overview: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/></svg>',
  courses: '<svg viewBox="0 0 24 24"><path d="m3 6 9-4 9 4-9 4-9-4Z"/><path d="M7 8v6c0 2 2.2 4 5 4s5-2 5-4V8"/><path d="M21 6v7"/></svg>',
  grades: '<svg viewBox="0 0 24 24"><path d="M4 19V9M10 19V5M16 19v-7M22 19V2"/></svg>',
  terms: '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/><path d="M8 14h3M8 17h6"/></svg>',
  settings: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6 1.7 1.7 0 0 0 10 3v-.2h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z"/></svg>'
})[name];

function letterGrade(value) {
  if (value >= 90) return 'A';
  if (value >= 80) return 'B';
  if (value >= 70) return 'C';
  if (value >= 60) return 'D';
  return 'F';
}

function safe(value) {
  return String(value ?? '').replace(/[&<>"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character]);
}

function initials(name) {
  return name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'YS';
}

function titleCase(value) { return value.charAt(0).toUpperCase() + value.slice(1); }

function courseGwa(grade, scaleType, conversion=defaultGradeConversion) {
  const custom = conversion.find(range => grade >= Number(range.min) && grade <= Number(range.max));
  if (scaleType === '1-highest' && custom) return Number(custom.gwa);
  const base = grade >= 97 ? 1 : grade >= 94 ? 1.25 : grade >= 91 ? 1.5 : grade >= 88 ? 1.75 : grade >= 85 ? 2 : grade >= 82 ? 2.25 : grade >= 79 ? 2.5 : grade >= 76 ? 2.75 : grade >= 75 ? 3 : 5;
  return scaleType === '5-highest' ? 6 - base : base;
}

function renderCoursesPage() {
  ensureAutomaticTerms(state);
  state.courses.forEach(course => { course.instructor ??= ''; course.considered ??= true; course.courseType ??= 'Core'; if(!Object.hasOwn(course,'finalGrade'))course.finalGrade=courseGwa(Number(course.grade), state.profile.scale_type, state.settings.gradeConversion); });
  const selected = state.courses.find(course => String(course.id) === String(state.selectedCourseId)) || state.courses[0];
  if (selected && !state.selectedCourseId) state.selectedCourseId = selected.id;
  const term = selected ? state.terms.find(item => item.courseIds?.some(id => String(id) === String(selected.id))) : null;
  const coursePassed = course => course.considered===false ? course.gradeResult==='P' : course.finalGrade != null && (state.profile.scale_type === '5-highest' ? Number(course.finalGrade) >= 3 : Number(course.finalGrade) <= 3);
  const completedCourseIds = completedLockedCourseIds(state.terms);
  const completedUnits = state.courses.filter(course => completedCourseIds.has(String(course.id)) && coursePassed(course)).reduce((sum, course) => sum + Number(course.credits || 0), 0);
  const selectedGwa = selected ? Number(selected.finalGrade ?? 0) : null;
  const goalDistance = selected?.considered===false ? 0 : selectedGwa==null ? 0 : Math.abs(selectedGwa - Number(state.profile.goal_gwa));
  const performance = selected ? selected.considered===false ? (selected.gradeResult==='P'?100:0) : selected.finalGrade==null ? 0 : (state.profile.scale_type === '5-highest' ? selectedGwa / 5 * 100 : (6 - selectedGwa) / 5 * 100) : 0;
  const trend = selected ? [Math.max(0, performance - 9), Math.max(0, performance - 5), Math.max(0, performance - 7), Math.max(0, performance - 2), performance] : [];
  const points = trend.map((value, index) => `${index * 25},${100 - value}`).join(' ');
  const relationList = ids => (ids || []).map(id => state.courses.find(course => String(course.id) === String(id))).filter(Boolean);
  const prerequisiteCourses = selected ? relationList(selected.prerequisiteIds) : [];
  const corequisiteCourses = selected ? relationList(selected.corequisiteIds) : [];
  return `<section class="courses-page"><div class="course-browser"><div><h2>Course overview</h2><p>${state.courses.length} courses in your workspace</p></div><div class="course-browser-tools"><label class="course-search"><span>⌕</span><input id="course-search" type="search" placeholder="Search code, title, or instructor…"></label><select id="course-type-filter" aria-label="Filter courses by type"><option value="all">All course types</option><option>Core</option><option>Specialization</option><option>Elective</option></select></div></div><div class="course-workspace"><section><div class="course-list" id="course-list">${state.courses.map(course => { const assigned = state.terms.find(item => item.courseIds?.some(id => String(id) === String(course.id))); return `<article class="course-list-row ${String(selected?.id) === String(course.id) ? 'selected' : ''}" data-course-item data-search="${safe(`${course.code} ${course.name} ${course.instructor}`.toLowerCase())}" data-type="${safe(course.courseType)}" style="--accent:${course.color}"><i></i><button class="course-row-main" data-course-open="${course.id}"><span><strong>${safe(course.code)}</strong><em>${safe(course.name)}</em></span><small>${safe(course.instructor || 'Instructor not set')} · ${course.credits} units</small></button><span class="course-type">${safe(course.courseType)}</span><b>${assigned ? safe(assigned.name) : 'Unassigned'}</b><button class="course-row-edit" data-edit-course="${course.id}" aria-label="Edit ${safe(course.code)}" title="Edit course">✎</button></article>`; }).join('') || '<div class="empty-state">Add your first course.</div>'}</div><div class="course-no-results" id="course-no-results" hidden>No courses match your search.</div></section>${selected ? `<aside class="course-detail-panel"><div class="course-detail-head"><div><span>${safe(selected.courseType)}</span><h2>${safe(selected.code)}</h2><p>${safe(selected.name)}</p></div><span class="read-only-badge">View only</span></div><div class="course-info-grid"><div><span>Instructor</span><strong>${safe(selected.instructor || 'Not set')}</strong></div><div><span>Units</span><strong>${selected.credits}</strong></div><div><span>Term</span><strong>${term ? safe(term.name) : 'Unassigned'}</strong></div><div><span>GWA calculation</span><strong>${selected.considered ? 'Included' : 'Excluded'}</strong></div></div><div class="course-readonly-note"><span>${selected.considered ? '✓' : '—'}</span><p><strong>${selected.considered ? 'Included in Term GWA' : 'Excluded from Term GWA'}</strong><small>This setting can be changed from Edit course.</small></p></div><div class="course-relations-summary"><div><span>Prerequisites</span>${prerequisiteCourses.length ? prerequisiteCourses.map(course => `<b>${safe(course.code)} <small>${safe(course.name)}</small></b>`).join('') : '<em>None assigned</em>'}</div><div><span>Co-requisites</span>${corequisiteCourses.length ? corequisiteCourses.map(course => `<b>${safe(course.code)} <small>${safe(course.name)}</small></b>`).join('') : '<em>None assigned</em>'}</div></div><div class="course-insights"><div><span>Current grade</span><strong>${selected.grade}%</strong><small>${selectedGwa.toFixed(2)} GWA</small></div><div><span>Units earned</span><strong>${completedUnits}</strong><small>Passing courses</small></div><div><span>From target</span><strong>${goalDistance.toFixed(2)}</strong><small>Target ${Number(state.profile.goal_gwa).toFixed(2)}</small></div></div><div class="course-trend"><div><h3>Grade trend</h3><span>Recent performance</span></div><svg viewBox="0 0 100 40" preserveAspectRatio="none" aria-label="Grade trend"><polyline points="${points}"/></svg></div></aside>` : ''}</div></section>`;
}

function completedLockedCourseIds(terms) {
  return new Set(terms.filter(term => term.completed && term.gradesLocked).flatMap(term => (term.courseIds || []).map(String)));
}

function render() {
  state.courses.forEach(course => { course.color = courseTypeColor(course.courseType); });
  closeActivePopups();
  applyPreferences();
  ensureAutomaticTerms(state);
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const dashboardTerms = state.terms.filter(term => term.format === state.settings.termFormat);
  const datedTerms = [...dashboardTerms].sort((a, b) => (a.startDate || '9999').localeCompare(b.startDate || '9999'));
  const currentTerm = datedTerms.find(term => statusFor(term, today) === 'current') || datedTerms.find(term => statusFor(term, today) === 'upcoming') || dashboardTerms.find(term => statusFor(term, today) === 'setup') || null;
  const currentTermIds = new Set((currentTerm?.courseIds || []).map(String));
  const currentCourses = state.courses.filter(course => currentTermIds.has(String(course.id)));
  const dashboardGradePreview = course => {
    const calculated=calculateCourseGrade(course,state.settings,state.profile),result=calculated.finalResult??(course.considered===false?course.gradeResult:course.finalGrade);
    const label=result==null?'—':course.considered===false?String(result):Number(result).toFixed(2);
    const percent=calculated.currentPercent??(course.considered===false?(result==='P'?100:result==='F'?0:0):Number(course.grade)||0);
    return {label,percent:Math.max(0,Math.min(100,percent)),detail:calculated.currentPercent==null?'No weighted score yet':`${calculated.currentPercent.toFixed(1)}% weighted`,assessmentCount:course.gradebook?.assessments?.length??course.assessments??0};
  };
  const termStart = currentTerm?.startDate ? new Date(`${currentTerm.startDate}T00:00:00`) : null;
  const termEnd = currentTerm?.endDate ? new Date(`${currentTerm.endDate}T00:00:00`) : null;
  const weekMs = 7 * 24 * 60 * 60 * 1000;
  const totalTermWeeks = termStart && termEnd ? Math.max(1, Math.ceil((termEnd - termStart + 24 * 60 * 60 * 1000) / weekMs)) : null;
  const currentTermWeek = totalTermWeeks ? Math.max(0, Math.min(totalTermWeeks, Math.ceil((today - termStart + 24 * 60 * 60 * 1000) / weekMs))) : null;
  const termWeekProgress = totalTermWeeks ? Math.round(currentTermWeek / totalTermWeeks * 100) : 0;
  const averageUnits = currentCourses.reduce((sum, course) => sum + Number(course.credits || 0), 0);
  const average = averageUnits ? Math.round(currentCourses.reduce((sum, course) => sum + Number(course.grade || 0) * Number(course.credits || 0), 0) / averageUnits) : 0;
  const termResults = currentCourses.map(course => ({ course, result: calculateCourseGrade(course, state.settings, state.profile).finalResult ?? (course.considered === false ? course.gradeResult || null : course.finalGrade) }));
  const gwaResults = termResults.filter(({ course, result }) => course.considered !== false && result != null && result !== '' && Number.isFinite(Number(result)));
  const gwaUnits = gwaResults.reduce((sum, { course }) => sum + Number(course.credits || 0), 0);
  const termGwa = gwaUnits ? gwaResults.reduce((sum, { course, result }) => sum + Number(result) * Number(course.credits || 0), 0) / gwaUnits : null;
  const gradedCourseCount = termResults.filter(({ result }) => result != null && result !== '').length;
  const targetGwa = Number(state.profile.goal_gwa) || 1.5;
  const targetProgress = termGwa == null ? 0 : Math.max(0, Math.min(100, (state.profile.scale_type === '5-highest' ? termGwa / targetGwa : (6 - termGwa) / (6 - targetGwa)) * 100));
  const completedCourseIds = completedLockedCourseIds(state.terms);
  const credits = state.courses.filter(course => course.considered !== false && completedCourseIds.has(String(course.id))).reduce((sum, course) => sum + Number(course.credits || 0), 0);
  const requiredUnits = Math.max(1, Number(state.settings.requiredUnits) || 180);
  const pageDetails = {
    Courses: { eyebrow: 'COURSE MANAGEMENT', title: 'Your courses', copy: 'Organise subjects, credits, and assessments.', symbol: '◇', action: 'Add course' },
    Grades: { eyebrow: 'ACADEMIC PERFORMANCE', title: 'Grades', copy: 'Review results and monitor your progress.', symbol: '↗', action: null },
    Terms: { eyebrow: 'ACADEMIC TERMS', title: 'Terms', copy: 'Organise school years and grading periods.', symbol: '▦', action: null },
    Settings: { eyebrow: 'PERSONALISE YOUR APP', title: 'Settings', copy: 'Manage your profile and app preferences.', symbol: '⚙', action: null }
    ,Profile: { eyebrow: 'STUDENT PROFILE', title: 'Your profile', copy: 'Keep your academic details and goals up to date.', symbol: '◎', action: null }
  };
  const currentPage = pageDetails[state.active];
  const settingsPage = `
    <section class="settings-page">
      ${state.notice ? `<div class="settings-notice">${safe(state.notice)}</div>` : ''}
      <article class="settings-card"><div class="settings-heading"><span>◐</span><div><h2>Appearance</h2><p>Choose how GradeTracker looks and feels.</p></div></div><div class="settings-grid">
        <label>Theme<select id="setting-theme"><option value="light" ${state.settings.theme === 'light' ? 'selected' : ''}>Light</option><option value="dark" ${state.settings.theme === 'dark' ? 'selected' : ''}>Dark</option><option value="system" ${state.settings.theme === 'system' ? 'selected' : ''}>System</option></select></label>
        <label>Accent colour<div class="color-setting"><input id="setting-accent" type="color" aria-label="Choose accent colour" value="${safe(state.settings.accent)}"><span>${safe(state.settings.accent)}</span><small>Custom colour</small></div></label>
        <label>Layout density<select id="setting-density"><option value="comfortable" ${state.settings.density === 'comfortable' ? 'selected' : ''}>Comfortable</option><option value="compact" ${state.settings.density === 'compact' ? 'selected' : ''}>Compact</option></select></label>
        <label class="toggle-row">Sidebar open by default<input id="setting-sidebar" type="checkbox" ${state.settings.sidebarOpen ? 'checked' : ''}><i></i></label>
      </div></article>
      <article class="settings-card"><div class="settings-heading"><span class="calendar-heading-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M16 3v4M8 3v4M3 11h18M8 15h2m4 0h2M8 18h2"/></svg></span><div><h2>Academic preferences</h2><p>Defaults for new academic records.</p></div></div><div class="settings-grid">
        <label class="wide">Default curriculum<input type="text" readonly value="${safe(mapuaCurricula.find(([code]) => code === state.profile.curriculum)?.[1] || 'Set your curriculum in Profile')}"></label>
        <label>Goal GWA<input type="text" readonly value="${Number(state.profile.goal_gwa).toFixed(2)}"></label>
        <label>Required units<input id="setting-required-units" type="number" min="1" max="999" step="1" value="${requiredUnits}"></label>
        <label>Academic Start<input id="setting-start" type="date" min="2000-01-01" max="2100-12-31" value="${safe(state.settings.academicStartDate)}"></label>
        <label>Term format<select id="setting-term"><option value="quarter" ${state.settings.termFormat === 'quarter' ? 'selected' : ''}>Quarter</option><option value="semester" ${state.settings.termFormat === 'semester' ? 'selected' : ''}>Semester</option><option value="trimester" ${state.settings.termFormat === 'trimester' ? 'selected' : ''}>Trimester</option></select></label>
      </div></article>
      ${state.profile.scale_type === '1-highest' ? `<article class="settings-card grade-conversion-card"><div class="settings-heading"><span>％</span><div><h2>Grade conversion</h2><p>Set the percentage range for each GWA when 1.00 is highest.</p></div></div><div class="grade-conversion-head"><span>GWA</span><span>Lowest percent</span><i></i><span>Highest percent</span></div><div class="grade-conversion-table">${state.settings.gradeConversion.map((range,index)=>`<div class="grade-conversion-row"><strong>${Number(range.gwa).toFixed(2)}</strong><label><input type="number" min="0" max="100" step="0.01" value="${range.min}" data-grade-min="${index}" aria-label="${Number(range.gwa).toFixed(2)} lowest percent"><span>%</span></label><i>—</i><label><input type="number" min="0" max="100" step="0.01" value="${range.max}" data-grade-max="${index}" aria-label="${Number(range.gwa).toFixed(2)} highest percent"><span>%</span></label></div>`).join('')}</div><div class="grade-conversion-footer"><small>Percentages must stay between 0 and 100.</small><button type="button" class="secondary-button" id="reset-grade-conversion">Reset defaults</button></div></article>` : ''}
      <article class="settings-card"><div class="settings-heading"><span>↻</span><div><h2>Data and synchronization</h2><p>Manage backups and connected data.</p></div></div><div class="status-line"><span><i class="${state.sync}"></i>Supabase</span><strong>${state.sync === 'connected' ? 'Connected' : state.sync === 'error' ? 'Connection error' : state.sync === 'connecting' ? 'Connecting' : 'Not configured'}</strong></div><div class="status-line"><span>Last synchronization</span><strong>${state.lastSync ? new Date(state.lastSync).toLocaleString() : 'Never'}</strong></div><div class="settings-actions"><button class="secondary-button" id="export-csv">Export grades as CSV</button><button class="secondary-button" id="export-backup">Export backup</button><label class="secondary-button file-button">Import backup<input id="import-backup" type="file" accept="application/json"></label><button class="danger-button" id="clear-cache">Clear local cache</button></div></article>
      <article class="settings-card"><div class="settings-heading"><span>♙</span><div><h2>Privacy and account</h2><p>${state.account?.email ? safe(state.account.email) : state.account?.is_anonymous ? 'Anonymous account' : 'No account information'}</p></div></div><div class="account-form"><input id="account-email" type="email" placeholder="Email address"><input id="account-password" type="password" placeholder="Password"><button class="secondary-button" id="sign-in">Sign in</button><button class="primary" id="link-account">Link anonymous account</button></div><div class="settings-actions"><button class="secondary-button" id="sign-out">Sign out</button><button class="danger-button" id="delete-account">Delete account and data</button></div></article>
      <article class="settings-card about-card"><div class="settings-heading"><span>ⓘ</span><div><h2>About</h2><p>GradeTracker version ${safe(appVersion)}</p></div></div><dialog id="privacy-policy-dialog" aria-labelledby="privacy-policy-title"><div class="dialog-head"><div><h2 id="privacy-policy-title">Privacy Policy</h2></div><button type="button" class="close" id="close-privacy-policy" aria-label="Close privacy policy">×</button></div><p>GradeTracker stores preferences and saved app data on this device. When Supabase is connected, your profile, courses, terms, and grades can be stored under your authenticated user ID and protected by Row Level Security.</p><p>You can export your data from Settings. The Privacy and account section provides a control to delete your account and its associated cloud data.</p></dialog><div class="about-links"><details class="changelog-details"><summary>Changelog</summary>${renderChangelog()}</details><details><summary>Licences</summary><p>Built with Electron, Capacitor, Vite, and Supabase. Third-party packages retain their respective open-source licences.</p></details></div><div class="about-footer-links"><button type="button" class="text-button" id="open-privacy-policy">Privacy Policy</button><a href="mailto:feedback@gradetracker.app?subject=GradeTracker%20Feedback">Feedback</a></div></article>
    </section>`;
  const placeholder = state.active === 'Profile' ? `
    <section class="profile-page">
      <article class="profile-summary">
        <div class="profile-avatar-large">${safe(initials(state.profile.full_name))}</div>
        <h2>${safe(state.profile.full_name || 'Your Name')}</h2>
        <p>${safe(state.profile.student_number || 'Student number not set')}</p><p class="profile-curriculum">${safe(mapuaCurricula.find(([code]) => code === state.profile.curriculum)?.[1] || 'Curriculum not set')}</p>
        <div class="profile-goal"><span>Goal GWA</span><strong>${Number(state.profile.goal_gwa).toFixed(2)}</strong><small>${state.profile.scale_type === '1-highest' ? '1 is highest' : '5 is highest'}</small></div>
        <button class="reset-profile" id="reset-profile" type="button">Reset profile</button>
      </article>
      <article class="profile-form-card">
        <div class="profile-form-head"><div><h2>Academic information</h2><p>Update the details used throughout GradeTracker.</p></div>${state.profileSaved ? '<span class="saved-badge">✓ Saved</span>' : ''}</div>
        <form id="profile-form" class="${state.profileEditing ? 'is-editing' : 'is-readonly'}">
          <label class="full-field">Full name<input name="full_name" required maxlength="80" value="${safe(state.profile.full_name)}" placeholder="Enter your full name" ${state.profileEditing ? '' : 'disabled'}></label>
          <label class="full-field">Curriculum<select name="curriculum" required ${state.profileEditing ? '' : 'disabled'}><option value="" ${!state.profile.curriculum ? 'selected' : ''} disabled>Select your program</option>${mapuaCurricula.map(([code, title]) => `<option value="${code}" ${state.profile.curriculum === code ? 'selected' : ''}>${code} — ${title}</option>`).join('')}</select></label>
          <label>Year level<select name="year" required ${state.profileEditing ? '' : 'disabled'}><option value="" ${!state.profile.year ? 'selected' : ''} disabled>Select year</option>${['1st Year','2nd Year','3rd Year','4th Year','5th Year','Graduate'].map(year => `<option ${state.profile.year === year ? 'selected' : ''}>${year}</option>`).join('')}</select></label>
          <label>Student number<input name="student_number" required maxlength="30" value="${safe(state.profile.student_number)}" placeholder="e.g. 2026-00123" ${state.profileEditing ? '' : 'disabled'}></label>
          <label>Goal GWA<select name="goal_gwa" required ${state.profileEditing ? '' : 'disabled'}>${gwaOptions.map(value => `<option value="${value}" ${Number(state.profile.goal_gwa).toFixed(2) === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label>
          <label>Scale type<select name="scale_type" required ${state.profileEditing ? '' : 'disabled'}><option value="1-highest" ${state.profile.scale_type === '1-highest' ? 'selected' : ''}>1 is highest</option><option value="5-highest" ${state.profile.scale_type === '5-highest' ? 'selected' : ''}>5 is highest</option></select></label>
          <div class="profile-form-actions">${state.profileEditing ? '<button type="button" class="secondary-button" id="cancel-profile">Cancel</button><button type="submit" class="primary">Save changes</button>' : '<button type="button" class="primary" id="edit-profile">Edit profile</button>'}</div>
        </form>
      </article>
    </section>` : state.active === 'Settings' ? settingsPage : state.active === 'Terms' ? renderTermsPage(state) : state.active === 'Courses' ? renderCoursesPage() : state.active === 'Grades' ? renderGradesPage(state) : currentPage ? `
    <section class="placeholder-page">
      <div class="placeholder-art"><span>${currentPage.symbol}</span><i></i><i></i><i></i></div>
      <p class="placeholder-label">${state.active.toUpperCase()} PAGE</p>
      <h2>${state.active} workspace</h2>
      <p>This page is ready for your ${state.active.toLowerCase()} features and content.</p>
      <div class="placeholder-panels"><span></span><span></span><span></span></div>
    </section>` : '';

  document.querySelector('#app').innerHTML = `
    <div class="shell ${state.sidebarCollapsed ? 'sidebar-collapsed' : ''}">
      <aside class="sidebar" aria-label="Primary navigation">
        <div class="brand"><span class="brand-mark">G</span><span>GradeTracker</span></div>
        <button class="sidebar-toggle" id="sidebar-toggle" aria-label="${state.sidebarCollapsed ? 'Open' : 'Close'} sidebar" title="${state.sidebarCollapsed ? 'Open' : 'Close'} sidebar">${state.sidebarCollapsed ? '›' : '‹'}</button>
        <nav>${['Overview','Courses','Grades','Terms','Settings'].map((label, i) => `<button class="nav-item ${state.active === label ? 'active' : ''}" data-page="${label}" title="${label}">${icon(['overview','courses','grades','terms','settings'][i])}<span>${label}</span></button>`).join('')}</nav>
        <div class="term-card"><span>${currentTerm ? safe(currentTerm.name) : 'Current term'}</span><strong>${currentTerm?.academicYear ? safe(currentTerm.academicYear) : safe(state.settings.academicStartDate?.slice(0, 4) || 'Not set')}</strong><small>${totalTermWeeks ? `Week ${currentTermWeek} / ${totalTermWeeks}` : 'Week —'}</small><div class="term-progress"><i style="width:${termWeekProgress}%"></i></div></div>
        <button class="profile ${state.active === 'Profile' ? 'active' : ''}" id="profile-button"><span class="avatar">${safe(initials(state.profile.full_name))}</span><span><strong>${safe(state.profile.full_name || 'Your Name')}</strong><small>${safe(state.profile.year || 'Student')}</small></span><b>•••</b></button>
      </aside>
      <main class="${state.active === 'Profile' ? 'profile-main' : ''}">
        <header>
          <div><p class="eyebrow">${currentPage ? currentPage.eyebrow : 'FALL SEMESTER · WEEK 7'}</p><h1>${currentPage ? currentPage.title : `Good ${new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'} 👋`}</h1><p>${currentPage ? currentPage.copy : 'Here’s how your semester is shaping up.'}</p></div>
          <div class="header-actions"><span class="sync-status ${state.sync}"><i></i>${state.sync === 'connected' ? 'Synced' : state.sync === 'error' ? 'Sync error' : state.sync === 'connecting' ? 'Connecting' : 'Local only'}</span>${!currentPage || currentPage.action ? `<button class="primary" id="add-course"><span>＋</span> ${currentPage?.action || 'Add course'}</button>` : ''}</div>
        </header>
        ${currentPage ? placeholder : `
        <section class="stats">
          <article><span class="stat-icon coral">↗</span><div><p>Current Term GWA</p><strong>${termGwa == null ? '—' : termGwa.toFixed(2)}</strong><small>${gradedCourseCount} of ${currentCourses.length} courses graded</small></div><div class="ring term-gwa-ring" style="--progress:${targetProgress * 3.6}deg" role="img" aria-label="${termGwa == null ? 'No grades yet' : `${termGwa.toFixed(2)} GWA`}; target ${targetGwa.toFixed(2)}" title="Target GWA: ${targetGwa.toFixed(2)}"><span>${termGwa == null ? '—' : termGwa.toFixed(2)}</span></div></article>
          <article><span class="stat-icon purple">◇</span><div><p>Current Term Units</p><strong>${averageUnits}</strong><small>${currentCourses.length} ${currentCourses.length === 1 ? 'course' : 'courses'} enrolled</small></div></article>
          <article><span class="stat-icon teal">✓</span><div><p>Credited units</p><strong>${credits}<small> / ${requiredUnits}</small></strong><small>${Math.max(0, requiredUnits - credits)} units remaining</small></div></article>
        </section>
        <section class="section-head"><div><h2>Your courses</h2><p>${currentCourses.length} course${currentCourses.length === 1 ? '' : 's'} in ${safe(currentTerm?.name || 'the current term')}</p></div><button class="text-button">View all →</button></section>
        <section class="course-grid">
          ${currentCourses.map(course => {const preview=dashboardGradePreview(course);return `<article class="course-card" style="--accent:${course.color}"><div class="course-top"><span class="course-code">${safe(course.code)}</span><button class="dots">•••</button></div><h3>${safe(course.name)}</h3><p>${course.credits} credits · ${preview.assessmentCount} assessments</p><div class="grade-row"><div><small>Final grade</small><strong>${preview.label} <em>${preview.detail}</em></strong></div><div class="mini-ring" style="--progress:${preview.percent * 3.6}deg"></div></div><div class="bar"><i style="width:${preview.percent}%"></i></div></article>`;}).join('') || '<div class="empty-state">No courses are assigned to the current term yet.</div>'}
          <button class="add-card" id="add-course-card"><span>＋</span><strong>Add a course</strong><small>Track another class</small></button>
        </section>
        <section class="lower-grid">
          <article class="panel recent"><div class="panel-head"><div><h2>Recent grades</h2><p>Your latest results</p></div><button class="text-button">View all →</button></div>${recent.map(item => `<div class="recent-row"><span class="grade-pill ${item.grade >= 90 ? 'great' : ''}">${item.grade}</span><div><strong>${item.title}</strong><small>${item.course} · ${item.date}</small></div><b>${item.score}</b></div>`).join('')}</article>
          <article class="panel goal"><div class="panel-head"><div><h2>Semester goal</h2><p>Target average</p></div><span class="goal-icon">◎</span></div><div class="goal-score"><strong>90%</strong><span>Current: ${average}%</span></div><div class="bar large"><i style="width:${Math.min(100, average / 90 * 100)}%"></i></div><p class="goal-copy">${average >= 90 ? 'You reached your target. Excellent work!' : `You’re ${90 - average}% away from your target. Keep going!`}</p></article>
        </section>
        `}
      </main>
      <nav class="mobile-nav">${['Overview','Courses','Grades','Terms','Settings'].map((label, i) => `<button class="${state.active === label ? 'active' : ''}" data-page="${label}">${icon(['overview','courses','grades','terms','settings'][i])}<span>${label}</span></button>`).join('')}</nav>
    </div>
    <dialog id="course-dialog"><form method="dialog" id="course-form"><input type="hidden" name="id"><div class="dialog-head"><div><h2 id="course-dialog-title">Add a course</h2><p>Keep course information and term assignment together.</p></div><button type="button" class="close" data-close-course aria-label="Close">×</button></div><div class="form-row"><label>Course code<input name="code" required placeholder="e.g. BIO 101" maxlength="12"></label><label>Course type<select name="courseType"><option>Core</option><option>Specialization</option><option>Elective</option></select></label></div><label>Course title<input name="name" required placeholder="e.g. General Biology" maxlength="80"></label><label>Instructor<input name="instructor" placeholder="Instructor name" maxlength="80"></label><div class="form-row"><label>Current grade<input name="grade" type="number" min="0" max="100" value="85" required></label><label>Units<input name="credits" type="number" min="1" max="30" value="${state.settings.defaultUnits}" required></label></div><label>Assign to term<select name="termId"><option value="">Unassigned</option>${state.terms.filter(term => term.format === state.settings.termFormat).map(term => `<option value="${term.id}">${safe(term.academicYear)} · ${safe(term.name)}</option>`).join('')}</select></label><div class="course-relation-grid"><fieldset><legend>Prerequisites</legend><p>Courses that must be taken first</p><div class="course-relation-list">${state.courses.length ? state.courses.map(course => `<label data-related-course="${course.id}"><input type="checkbox" name="prerequisiteId" value="${course.id}"><span><strong>${safe(course.code)}</strong><small>${safe(course.name)}</small></span></label>`).join('') : '<small>No existing courses yet.</small>'}</div></fieldset><fieldset><legend>Co-requisites</legend><p>Courses taken at the same time</p><div class="course-relation-list">${state.courses.length ? state.courses.map(course => `<label data-related-course="${course.id}"><input type="checkbox" name="corequisiteId" value="${course.id}"><span><strong>${safe(course.code)}</strong><small>${safe(course.name)}</small></span></label>`).join('') : '<small>No existing courses yet.</small>'}</div></fieldset></div><label class="course-dialog-check"><input name="considered" type="checkbox" checked><span>Include units in Term GWA calculation</span></label><div class="course-dialog-footer"><button type="button" class="secondary-button" data-close-course>Cancel</button><button type="submit" value="save" class="primary" id="save-course">Add course</button></div></form></dialog>`;

  bindEvents();
  normalizeIcons(document.querySelector('#app'));
}

function bindEvents() {
  if(state.active==='Courses'){const selected=state.courses.find(course=>String(course.id)===String(state.selectedCourseId))||state.courses[0],gradePanel=document.querySelector('.course-insights>div:first-child');if(selected&&gradePanel)gradePanel.innerHTML=selected.considered===false?`<span>Final grade</span><strong>${selected.gradeResult||'—'}</strong><small>${selected.gradeResult==='F'?'Fail':selected.gradeResult==='P'?'Pass':'Not graded'}</small>`:`<span>Final grade</span><strong>${selected.finalGrade==null?'—':Number(selected.finalGrade).toFixed(2)}</strong><small>${selected.finalGrade==null?'Not graded':state.profile.scale_type==='5-highest'?'5.00 is highest':'1.00 is highest'}</small>`;}
  document.querySelectorAll('[data-page]').forEach(button => button.addEventListener('click', () => { state.active = button.dataset.page; state.profileEditing = false; render(); }));
  document.querySelector('#profile-button').addEventListener('click', () => { state.active = 'Profile'; state.profileSaved = false; state.profileEditing = false; render(); });
  document.querySelector('#sidebar-toggle').addEventListener('click', () => {
    state.sidebarCollapsed = !state.sidebarCollapsed;
    localStorage.setItem('grade-tracker-sidebar', state.sidebarCollapsed ? 'collapsed' : 'expanded');
    render();
  });
  if (state.active === 'Terms') bindTermsPage(state, {
    persist: async term => { localStorage.setItem('grade-tracker-terms', JSON.stringify(state.terms)); try { if (isSupabaseConfigured) { await upsertTerm(term); state.sync='connected'; markSynced(); } } catch (error) { state.sync='error'; state.notice=error.message; } },
    remove: async id => { localStorage.setItem('grade-tracker-terms', JSON.stringify(state.terms)); try { if (isSupabaseConfigured) await deleteTerm(id); } catch (error) { state.sync='error'; state.notice=error.message; } },
    rerender: render
  });
  if(state.active==='Grades')bindGradesPage(state,{persist:async course=>{localStorage.setItem('grade-tracker-courses',JSON.stringify(state.courses));try{if(isSupabaseConfigured){await updateCourse(course);state.sync='connected';markSynced();}}catch(error){state.sync='error';state.notice=error.message;}},rerender:render});
  const courseTypeFilter = document.querySelector('#course-type-filter');
  if (courseTypeFilter) {
    const termFilter = document.createElement('select');
    termFilter.id = 'course-term-filter';
    termFilter.setAttribute('aria-label', 'Filter courses by term');
    termFilter.add(new Option('All terms', 'all'));
    termFilter.add(new Option('Unassigned', 'unassigned'));
    const yearGroups = new Map();
    getVisibleTerms(state).forEach(term => {
      if (!yearGroups.has(term.academicYear)) {
        const group = document.createElement('optgroup');
        group.label = `Year ${Number(term.yearIndex) + 1} · ${term.academicYear}`;
        yearGroups.set(term.academicYear, group);
        termFilter.append(group);
      }
      yearGroups.get(term.academicYear).append(new Option(term.name, term.id));
    });
    courseTypeFilter.after(termFilter);
    const filters = state.courseFilters || { query: '', type: 'all', term: 'all' };
    document.querySelector('#course-search').value = filters.query;
    courseTypeFilter.value = filters.type;
    termFilter.value = [...termFilter.options].some(option => option.value === filters.term) ? filters.term : 'all';
    styleTermDropdown(termFilter);
    styleTermDropdown(courseTypeFilter);
  }
  const filterCourses = () => {
    const search = document.querySelector('#course-search');
    if (!search) return;
    const type = courseTypeFilter.value, termId = document.querySelector('#course-term-filter').value;
    const query = search.value.trim().toLowerCase();
    state.courseFilters = { query: search.value, type, term: termId };
    const selectedTermIds = new Set((state.terms.find(term => term.id === termId)?.courseIds || []).map(String));
    const assignedIds = new Set(state.terms.flatMap(term => (term.courseIds || []).map(String)));
    let visible = 0;
    document.querySelectorAll('[data-course-item]').forEach(item => {
      const id = item.querySelector('[data-course-open]').dataset.courseOpen;
      const matchesTerm = termId === 'all' || (termId === 'unassigned' ? !assignedIds.has(id) : selectedTermIds.has(id));
      const show = (!query || item.dataset.search.includes(query)) && (type === 'all' || item.dataset.type === type) && matchesTerm;
      item.hidden = !show;
      if (show) visible++;
    });
    const empty = document.querySelector('#course-no-results');
    if (empty) { empty.hidden = visible !== 0; empty.textContent = 'No courses match your filters.'; }
  };
  document.querySelector('#course-search')?.addEventListener('input',filterCourses);
  document.querySelector('#course-type-filter')?.addEventListener('change',filterCourses);
  document.querySelector('#course-term-filter')?.addEventListener('change',filterCourses);
  filterCourses();
  document.querySelector('#open-privacy-policy')?.addEventListener('click', () => document.querySelector('#privacy-policy-dialog').showModal());
  document.querySelector('#close-privacy-policy')?.addEventListener('click', () => document.querySelector('#privacy-policy-dialog').close());
  const saveSetting = (key, value) => {
    state.settings[key] = value;
    localStorage.setItem('grade-tracker-settings', JSON.stringify(state.settings));
    applyPreferences();
  };
  document.querySelector('#setting-theme')?.addEventListener('change', event => { saveSetting('theme', event.target.value); render(); });
  document.querySelector('#setting-accent')?.addEventListener('input', event => { saveSetting('accent', event.target.value); event.target.nextElementSibling.textContent = event.target.value; });
  document.querySelector('#setting-density')?.addEventListener('change', event => { saveSetting('density', event.target.value); render(); });
  document.querySelector('#setting-sidebar')?.addEventListener('change', event => { saveSetting('sidebarOpen', event.target.checked); state.sidebarCollapsed = !event.target.checked; localStorage.setItem('grade-tracker-sidebar', state.sidebarCollapsed ? 'collapsed' : 'expanded'); render(); });
  document.querySelector('#setting-start')?.addEventListener('change', async event => {
    const nextStart = event.target.value;
    if (!nextStart || nextStart === state.settings.academicStartDate) return;
    adjustAcademicStart(state, nextStart);
    saveSetting('academicStartDate', nextStart);
    render();
    if (isSupabaseConfigured) {
      try {
        await Promise.all(state.terms.map(upsertTerm));
        state.sync = 'connected';
        markSynced();
      } catch (error) {
        state.sync = 'error';
        state.notice = `Dates saved locally; synchronization failed: ${error.message}`;
      }
      render();
    }
  });
  document.querySelectorAll('.settings-page select').forEach(select => {
    select.setAttribute('aria-label', select.closest('label')?.firstChild.textContent.trim() || 'Choose setting');
    styleTermDropdown(select);
  });
  const academicStartInput = document.querySelector('#setting-start');
  if (academicStartInput) styleDatePicker(academicStartInput);
  const accentInput = document.querySelector('#setting-accent');
  if (accentInput) styleColorPicker(accentInput);
  document.querySelector('#setting-required-units')?.addEventListener('change', event => { saveSetting('requiredUnits', Math.max(1, Math.min(999, Number(event.target.value) || 180))); render(); });
  document.querySelector('#setting-term')?.addEventListener('change', event => { saveSetting('termFormat', event.target.value); state.selectedTermId = null; render(); });
  document.querySelectorAll('[data-grade-min],[data-grade-max]').forEach(input=>input.addEventListener('change',event=>{const isMin=event.target.hasAttribute('data-grade-min'),index=Number(event.target.dataset.gradeMin??event.target.dataset.gradeMax),range={...state.settings.gradeConversion[index]},value=Math.max(0,Math.min(100,Number(event.target.value)||0));if(isMin){range.min=value;if(range.max<value)range.max=value;}else{range.max=value;if(range.min>value)range.min=value;}const conversion=state.settings.gradeConversion.map((item,itemIndex)=>itemIndex===index?range:item);saveSetting('gradeConversion',conversion);render();}));
  document.querySelector('#reset-grade-conversion')?.addEventListener('click',()=>{if(!window.confirm('Reset the grade conversion table to its default percentage ranges?'))return;saveSetting('gradeConversion',defaultGradeConversion.map(range=>({...range})));render();});
  document.querySelector('#export-csv')?.addEventListener('click', () => {
    const escapeCsv = value => `"${String(value).replaceAll('"', '""')}"`;
    const rows = [['Code','Course','Grade','Units','Assessments'], ...state.courses.map(course => [course.code,course.name,course.grade,course.credits,course.assessments])];
    downloadFile('gradetracker-grades.csv', rows.map(row => row.map(escapeCsv).join(',')).join('\r\n'), 'text/csv;charset=utf-8');
  });
  document.querySelector('#export-backup')?.addEventListener('click', () => downloadFile('gradetracker-backup.json', JSON.stringify({ version: 1, exportedAt: new Date().toISOString(), courses: state.courses, terms: state.terms, profile: state.profile, settings: state.settings }, null, 2), 'application/json'));
  document.querySelector('#import-backup')?.addEventListener('change', async event => {
    const file = event.target.files[0]; if (!file) return;
    try {
      const backup = JSON.parse(await file.text());
      if (!Array.isArray(backup.courses) || !backup.profile || !backup.settings) throw new Error('Invalid backup format');
      if (backup.courses.some(course => !course || course.id == null || typeof course.code !== 'string')) throw new Error('Invalid course records in backup');
      const hasData = state.courses.length > 0 || state.terms.some(term => term.courseIds?.length || term.startDate || term.endDate || term.notes) || state.profile.full_name !== defaultProfile.full_name;
      const mode = hasData ? await chooseBackupImportMode() : 'replace';
      if (mode === 'cancel') return;
      preserveLocalWorkspace(state);
      if (mode === 'add') {
        const merged = mergeBackupData(state, backup);
        state.courses = merged.courses; state.terms = merged.terms;
      } else {
        state.courses = backup.courses; state.terms = Array.isArray(backup.terms) ? backup.terms : createDefaultTerms(); state.profile = { ...defaultProfile, ...backup.profile }; state.settings = { ...defaultSettings, ...backup.settings };
        localStorage.removeItem('grade-tracker-deleted-terms');
      }
      state.selectedCourseId = null; state.selectedTermId = null;
      localStorage.setItem('grade-tracker-courses', JSON.stringify(state.courses)); localStorage.setItem('grade-tracker-terms', JSON.stringify(state.terms)); localStorage.setItem('grade-tracker-profile', JSON.stringify(state.profile)); localStorage.setItem('grade-tracker-settings', JSON.stringify(state.settings));
      state.notice = mode === 'add' ? 'New backup data added. Existing records were kept.' : 'Local data replaced with the backup.'; render();
    } catch (error) { state.notice = `Import failed: ${error.message}`; render(); }
    finally { event.target.value = ''; }
  });
  document.querySelector('#clear-cache')?.addEventListener('click', () => {
    if (!window.confirm('Clear locally cached courses, profile, and settings? Cloud data will not be deleted.')) return;
    ['grade-tracker-courses','grade-tracker-terms','grade-tracker-deleted-terms','grade-tracker-profile','grade-tracker-settings','grade-tracker-sidebar','grade-tracker-last-sync'].forEach(key => localStorage.removeItem(key));
    state.courses = [...defaultCourses]; state.terms = createDefaultTerms(); state.profile = { ...defaultProfile }; state.settings = { ...defaultSettings }; state.sidebarCollapsed = false; state.lastSync = ''; state.notice = 'Local cache cleared.'; render();
  });
  document.querySelector('#sign-in')?.addEventListener('click', async () => {
    preserveLocalWorkspace(state);
    const email = document.querySelector('#account-email').value.trim(); const password = document.querySelector('#account-password').value;
    try {
      state.account = await signInWithPassword(email, password);
      const [courses, profile] = await Promise.all([loadCourses(), loadProfile()]);
      state.courses = courses?.length ? courses : [];
      localStorage.setItem('grade-tracker-workspace-user', state.account.id);
      localStorage.setItem('grade-tracker-courses', JSON.stringify(state.courses));
      if (profile) state.profile = profile;
      state.notice = 'Signed in successfully.'; state.sync = 'connected'; markSynced(); render();
    } catch (error) { state.notice = error.message; render(); }
  });
  document.querySelector('#link-account')?.addEventListener('click', async () => {
    const email = document.querySelector('#account-email').value.trim();
    try { state.account = await linkAnonymousEmail(email); state.notice = 'Verification email sent. Verify it before setting a password.'; render(); } catch (error) { state.notice = error.message; render(); }
  });
  document.querySelector('#sign-out')?.addEventListener('click', async () => {
    if (!window.confirm('Sign out of this device? Anonymous accounts cannot be recovered after signing out.')) return;
    try { await signOutCurrentSession(); state.account = null; state.sync = 'local'; state.notice = 'Signed out.'; render(); } catch (error) { state.notice = error.message; render(); }
  });
  document.querySelector('#delete-account')?.addEventListener('click', async () => {
    if (!window.confirm('Permanently delete your account, profile, and all courses? This cannot be undone.')) return;
    try { await deleteOwnAccount(); localStorage.clear(); state.account = null; state.courses = [...defaultCourses]; state.profile = { ...defaultProfile }; state.notice = 'Account deleted.'; state.sync = 'local'; render(); } catch (error) { state.notice = error.message; render(); }
  });
  const profileForm = document.querySelector('#profile-form');
  const editProfile = document.querySelector('#edit-profile');
  if (editProfile) editProfile.addEventListener('click', () => {
    state.profileEditing = true;
    state.profileSaved = false;
    render();
    document.querySelector('#profile-form input')?.focus();
  });
  const cancelProfile = document.querySelector('#cancel-profile');
  if (cancelProfile) cancelProfile.addEventListener('click', () => {
    const data = new FormData(profileForm);
    const hasChanges =
      data.get('full_name').trim() !== state.profile.full_name ||
      data.get('curriculum') !== state.profile.curriculum ||
      data.get('year') !== state.profile.year ||
      data.get('student_number').trim() !== state.profile.student_number ||
      Number(data.get('goal_gwa')) !== Number(state.profile.goal_gwa) ||
      data.get('scale_type') !== state.profile.scale_type;

    if (hasChanges && !window.confirm('Discard your unsaved profile changes?')) return;
    state.profileEditing = false;
    state.profileSaved = false;
    render();
  });
  const resetProfile = document.querySelector('#reset-profile');
  if (resetProfile) resetProfile.addEventListener('click', async () => {
    if (!window.confirm('Reset your profile and remove all saved details?')) return;
    const cleared = { ...defaultProfile };
    state.profile = cleared;
    localStorage.setItem('grade-tracker-profile', JSON.stringify(cleared));
    try {
      const saved = await saveProfile(cleared);
      if (saved) state.profile = saved;
      state.sync = saved ? 'connected' : 'local';
    } catch (error) {
      console.error('Could not reset profile in Supabase:', error);
      state.sync = 'error';
    }
    state.profileSaved = false;
    state.profileEditing = false;
    render();
  });
  if (profileForm) profileForm.addEventListener('submit', async event => {
    event.preventDefault();
    const data = new FormData(profileForm);
    const profile = {
      full_name: data.get('full_name').trim(),
      year: data.get('year'),
      student_number: data.get('student_number').trim(),
      curriculum: data.get('curriculum'),
      goal_gwa: Number(data.get('goal_gwa')),
      scale_type: data.get('scale_type')
    };
    if(profile.scale_type!==state.profile.scale_type){state.courses.forEach(course=>{if(course.finalGrade!=null)course.finalGrade=6-Number(course.finalGrade);if(typeof course.gradebook?.override==='number')course.gradebook.override=6-course.gradebook.override;});localStorage.setItem('grade-tracker-courses',JSON.stringify(state.courses));}
    state.profile = profile;
    localStorage.setItem('grade-tracker-profile', JSON.stringify(profile));
    try {
      const saved = await saveProfile(profile);
      if (saved) state.profile = saved;
      if(saved&&isSupabaseConfigured)await Promise.all(state.courses.map(updateCourse));
      state.sync = saved ? 'connected' : 'local';
    } catch (error) {
      console.error('Could not save profile to Supabase:', error);
      state.sync = 'error';
    }
    state.profileSaved = true;
    state.profileEditing = false;
    render();
  });
  const dialog = document.querySelector('#course-dialog');
  const courseForm = document.querySelector('#course-form');
  let finalGradeTouched=false;const percentageInput=courseForm.elements.grade,finalGradeSelect=document.createElement('select'),gradeValues=state.profile.scale_type==='5-highest'?[...gwaOptions].reverse():gwaOptions;finalGradeSelect.name='finalGrade';const setFinalGradeOptions=(considered,value='')=>{finalGradeSelect.innerHTML='<option value="">Not graded</option>'+(considered?gradeValues.map(grade=>`<option value="${grade}">${grade}</option>`).join(''):'<option value="P">P — Pass</option><option value="F">F — Fail</option>');finalGradeSelect.value=value==null?'':String(value);};setFinalGradeOptions(true);percentageInput.closest('label').firstChild.textContent='Final Grade';percentageInput.replaceWith(finalGradeSelect);finalGradeSelect.addEventListener('change',()=>{finalGradeTouched=true;});courseForm.elements.considered.addEventListener('change',event=>{finalGradeTouched=true;setFinalGradeOptions(event.target.checked);});
  document.querySelectorAll('.course-relation-grid fieldset').forEach((fieldset,index)=>{const search=document.createElement('input');search.type='search';search.className='course-relation-search';search.placeholder=index===0?'Find a prerequisite…':'Find a co-requisite…';const list=fieldset.querySelector('.course-relation-list');fieldset.insertBefore(search,list);search.addEventListener('input',()=>{const query=search.value.trim().toLowerCase();list.querySelectorAll('label').forEach(label=>label.hidden=!label.textContent.toLowerCase().includes(query));});});
  const courseDeleteButton=document.createElement('button');courseDeleteButton.type='button';courseDeleteButton.id='delete-course-dialog';courseDeleteButton.className='course-dialog-delete';courseDeleteButton.title='Delete course';courseDeleteButton.setAttribute('aria-label','Delete course');courseDeleteButton.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5"/></svg>';document.querySelector('.course-dialog-footer')?.prepend(courseDeleteButton);
  document.querySelectorAll('[data-close-course]').forEach(button => button.addEventListener('click', () => dialog.close('cancel')));
  document.querySelectorAll('[data-course-open]').forEach(button => button.addEventListener('click', () => { state.selectedCourseId=button.dataset.courseOpen; render(); }));
  const openCourseDialog = course => { courseForm.reset(); courseForm.elements.id.value=course?.id || ''; courseDeleteButton.hidden=!course; document.querySelector('#course-dialog-title').textContent=course ? 'Edit course' : 'Add a course'; document.querySelector('#save-course').textContent=course ? 'Save changes' : 'Add course'; document.querySelectorAll('.course-relation-search').forEach(input=>{input.value='';});document.querySelectorAll('[data-related-course]').forEach(label=>{const isSelf=course&&String(label.dataset.relatedCourse)===String(course.id);label.hidden=Boolean(isSelf);label.querySelector('input').disabled=Boolean(isSelf);}); if(course){ Object.entries(course).forEach(([key,value])=>{if(courseForm.elements[key]&&!Array.isArray(value))courseForm.elements[key].type==='checkbox' ? courseForm.elements[key].checked=Boolean(value) : courseForm.elements[key].value=value;});setFinalGradeOptions(course.considered!==false,course.considered===false?(course.gradeResult||''):course.finalGrade); courseForm.querySelectorAll('[name="prerequisiteId"]').forEach(input=>input.checked=(course.prerequisiteIds||[]).some(id=>String(id)===input.value));courseForm.querySelectorAll('[name="corequisiteId"]').forEach(input=>input.checked=(course.corequisiteIds||[]).some(id=>String(id)===input.value)); const assigned=state.terms.find(term=>term.courseIds?.some(id=>String(id)===String(course.id))); courseForm.elements.termId.value=assigned?.id || ''; }else setFinalGradeOptions(true);finalGradeTouched=false; dialog.showModal(); };
  document.querySelectorAll('#add-course, #add-course-card').forEach(button => button.addEventListener('click', () => openCourseDialog()));
  document.querySelectorAll('[data-edit-course]').forEach(button => button.addEventListener('click', () => openCourseDialog(state.courses.find(course=>String(course.id)===button.dataset.editCourse))));
  document.querySelector('[data-considered-course]')?.addEventListener('change', async event => { const course=state.courses.find(item=>String(item.id)===event.target.dataset.consideredCourse); course.considered=event.target.checked; localStorage.setItem('grade-tracker-courses',JSON.stringify(state.courses)); try{if(isSupabaseConfigured)await updateCourse(course);}catch(error){state.sync='error';} render(); });
  courseDeleteButton.addEventListener('click',async()=>{const course=state.courses.find(item=>String(item.id)===courseForm.elements.id.value);if(!course||!window.confirm(`Delete ${course.code} — ${course.name}?`))return;dialog.close('delete');state.courses=state.courses.filter(item=>String(item.id)!==String(course.id));state.courses.forEach(item=>{item.prerequisiteIds=(item.prerequisiteIds||[]).filter(id=>String(id)!==String(course.id));item.corequisiteIds=(item.corequisiteIds||[]).filter(id=>String(id)!==String(course.id));});state.terms.forEach(term=>{term.courseIds=(term.courseIds||[]).filter(id=>String(id)!==String(course.id));});state.selectedCourseId=null;localStorage.setItem('grade-tracker-courses',JSON.stringify(state.courses));localStorage.setItem('grade-tracker-terms',JSON.stringify(state.terms));try{if(isSupabaseConfigured){await deleteCourse(course.id);await Promise.all([...state.terms.map(upsertTerm),...state.courses.map(updateCourse)]);}}catch(error){state.sync='error';}render();});
  dialog.addEventListener('close', async () => {
    if (dialog.returnValue !== 'save') return;
    const data = new FormData(courseForm);

    const existing=state.courses.find(course=>String(course.id)===data.get('id'));
    const considered=data.get('considered')==='on',selectedGrade=data.get('finalGrade');
    const draft = { ...(existing||{}), id:existing?.id||Date.now(), code: data.get('code').trim().toUpperCase(), name: data.get('name').trim(), instructor:data.get('instructor').trim(), finalGrade:selectedGrade===''?null:considered?Number(selectedGrade):selectedGrade==='P'?3:state.profile.scale_type==='5-highest'?1:5, gradeResult:considered?'':selectedGrade, credits: Number(data.get('credits')), considered, courseType:data.get('courseType'), prerequisiteIds:data.getAll('prerequisiteId'), corequisiteIds:data.getAll('corequisiteId'), assessments:existing?.assessments||0, color:courseTypeColor(data.get('courseType')) };
    const gradebook=ensureGradebook(draft);if(!existing||finalGradeTouched){gradebook.override=selectedGrade===''?null:considered?Number(selectedGrade):selectedGrade;if(gradebook.override==null){const automatic=calculateCourseGrade(draft,state.settings,state.profile).automaticResult;if(considered)draft.finalGrade=automatic==null?null:Number(automatic);else{draft.gradeResult=automatic||'';draft.finalGrade=automatic==='P'?3:automatic==='F'?(state.profile.scale_type==='5-highest'?1:5):null;}}}
    try {
      const saved = existing ? await updateCourse(draft) : await createCourse(draft);
      const finalCourse=saved||draft;
      if(existing)Object.assign(existing,finalCourse);else state.courses.push(finalCourse);
      state.terms.forEach(term=>{term.courseIds=(term.courseIds||[]).filter(id=>String(id)!==String(draft.id)&&String(id)!==String(finalCourse.id));});
      const assignedTerm=state.terms.find(term=>term.id===data.get('termId'));if(assignedTerm)assignedTerm.courseIds.push(finalCourse.id);
      if(isSupabaseConfigured)await Promise.all(state.terms.map(upsertTerm));
      state.selectedCourseId=finalCourse.id;
      state.sync = saved ? 'connected' : 'local';
      if (saved) markSynced();
    } catch (error) {
      console.error('Could not save course to Supabase:', error);
      if(existing)Object.assign(existing,draft);else state.courses.push(draft);
      state.sync = 'error';
    }
    localStorage.setItem('grade-tracker-courses', JSON.stringify(state.courses));
    localStorage.setItem('grade-tracker-terms', JSON.stringify(state.terms));
    render();
  });
}

async function initialise() {
  const hadSavedCourses = localStorage.getItem('grade-tracker-courses') !== null;
  const localOwner = localStorage.getItem('grade-tracker-workspace-user');
  if (hadSavedCourses) preserveLocalWorkspace(state);
  render();
  if (!isSupabaseConfigured) {
    try { await importCoreCourses(state, { createCourse, updateCourse, ensureGradebook }); }
    catch (error) { state.notice = error.message; }
    render();
    return;
  }

  try {
    const [courses, profile, account, terms] = await Promise.all([loadCourses(), loadProfile(), getAccount(), loadTerms()]);
    const sameWorkspace = !localOwner || localOwner === account?.id;
    if (hadSavedCourses && sameWorkspace) state.courses = mergeCourseLists(state.courses, courses);
    else if (courses?.length || !sameWorkspace) state.courses = courses || [];
    localStorage.setItem('grade-tracker-courses', JSON.stringify(state.courses));
    if (account?.id) localStorage.setItem('grade-tracker-workspace-user', account.id);
    if (profile) {
      state.profile = profile;
      localStorage.setItem('grade-tracker-profile', JSON.stringify(profile));
    }
    state.account = account;
    if (terms?.length) {
      state.terms = sameWorkspace ? mergeCourseLists(state.terms, terms) : terms;
      localStorage.setItem('grade-tracker-terms', JSON.stringify(state.terms));
    }
    await importCoreCourses(state, { createCourse, updateCourse, ensureGradebook });
    state.sync = 'connected';
    markSynced();
  } catch (error) {
    console.error('Supabase connection failed:', error);
    state.sync = 'error';
    state.notice = `Supabase connection failed: ${error.message || 'Unknown error'}`;
  }
  render();
}

initialise();
