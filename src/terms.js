const esc = value => String(value ?? '').replace(/[&<>"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[char]);

export const createDefaultTerms = () => [
  { id: 'term-2025-q4', name: '4th Quarter', academicYear: '2025–2026', format: 'quarter', number: 4, startDate: '2026-03-09', endDate: '2026-05-23', targetGwa: 1.75, notes: 'Previous academic term', courseIds: [4], completed: true, gradesLocked: true },
  { id: 'term-2026-q1', name: '1st Quarter', academicYear: '2026–2027', format: 'quarter', number: 1, startDate: '2026-08-10', endDate: '2026-10-24', targetGwa: 1.50, notes: 'Current academic term', courseIds: [1, 2, 3], completed: false, gradesLocked: false },
  { id: 'term-2026-q2', name: '2nd Quarter', academicYear: '2026–2027', format: 'quarter', number: 2, startDate: '2026-11-03', endDate: '2027-01-23', targetGwa: 1.50, notes: '', courseIds: [], completed: false, gradesLocked: false }
];

const dateOnly = value => new Date(`${value}T00:00:00`);
const statusFor = term => {
  if (term.completed) return 'completed';
  if (!term.startDate || !term.endDate) return 'setup';
  const today = new Date(); today.setHours(0, 0, 0, 0);
  if (today < dateOnly(term.startDate)) return 'upcoming';
  if (today > dateOnly(term.endDate)) return 'completed';
  return 'current';
};
const progressFor = term => {
  if (!term.startDate || !term.endDate) return 0;
  const start = dateOnly(term.startDate).getTime(), end = dateOnly(term.endDate).getTime(), now = Date.now();
  return Math.round(Math.max(0, Math.min(1, (now - start) / Math.max(1, end - start))) * 100);
};
const ordinal = number => `${number}${number === 1 ? 'st' : number === 2 ? 'nd' : number === 3 ? 'rd' : 'th'}`;
const titleCase = value => value.charAt(0).toUpperCase() + value.slice(1);
const formatCounts = { quarter: 4, semester: 2, trimester: 3 };
const formatUnitCaps = { quarter: 18, trimester: 21, semester: 24 };
const yearLabel = index => `${ordinal(index + 1)} Year`;
const academicYearFor = (startYear, index) => `${startYear + index}–${startYear + index + 1}`;
const termOrder = term => Number(term.yearIndex || 0) * 10 + Number(term.number || 0);
const termDeletionKey = term => `${term.format}|${term.academicYear}|${term.number}`;
let activeGradeConversion = [];

export function ensureAutomaticTerms(state) {
  const format = state.settings.termFormat || 'quarter';
  const startYear = Number(state.settings.academicStartDate?.slice(0, 4)) || new Date().getFullYear();
  const count = formatCounts[format];
  const deletedTermIds = new Set(JSON.parse(localStorage.getItem('grade-tracker-deleted-terms') || '[]'));
  for (let yearIndex = 0; yearIndex < 4; yearIndex += 1) {
    for (let number = 1; number <= count; number += 1) {
      const academicYear = academicYearFor(startYear, yearIndex);
      const generatedId = `auto-${format}-${startYear}-${yearIndex + 1}-${number}`;
      if (deletedTermIds.has(`${format}|${academicYear}|${number}`)) continue;
      const existing = state.terms.find(term => term.format === format && term.number === number && term.academicYear === academicYear);
      if (existing) {
        existing.yearIndex = yearIndex;
        continue;
      }
      state.terms.push({ id: generatedId, name: `${ordinal(number)} ${titleCase(format)}`, academicYear, yearIndex, format, number, startDate: '', endDate: '', targetGwa: Number(state.profile.goal_gwa) || 1.5, notes: '', courseIds: [], completed: false, gradesLocked: false });
    }
  }
  localStorage.setItem('grade-tracker-terms', JSON.stringify(state.terms));
}

const dateRange = term => term.startDate && term.endDate
  ? `${new Date(`${term.startDate}T00:00:00`).toLocaleDateString()} — ${new Date(`${term.endDate}T00:00:00`).toLocaleDateString()}`
  : 'Set term start and end dates';
const gradeToGwa = (grade, scaleType, conversion=activeGradeConversion) => {
  if (grade == null) return null;
  const custom=conversion.find(range=>grade>=Number(range.min)&&grade<=Number(range.max));
  if(scaleType==='1-highest'&&custom)return Number(custom.gwa);
  const base = grade >= 97 ? 1 : grade >= 94 ? 1.25 : grade >= 91 ? 1.5 : grade >= 88 ? 1.75 : grade >= 85 ? 2 : grade >= 82 ? 2.25 : grade >= 79 ? 2.5 : grade >= 76 ? 2.75 : grade >= 75 ? 3 : 5;
  return scaleType === '5-highest' ? 6 - base : base;
};
const statsFor = (term, courses, scaleType, conversion=[]) => {
  const assigned = term.courseIds.map(id => courses.find(course => String(course.id) === String(id))).filter(Boolean);
  const graded = assigned.filter(course => course.finalGrade != null && course.considered !== false);
  const totalUnits = assigned.reduce((sum, course) => sum + Number(course.credits || 0), 0);
  const weighted = graded.reduce((sum, course) => sum + Number(course.finalGrade) * Number(course.credits || 0), 0);
  const gradedUnits = graded.reduce((sum, course) => sum + Number(course.credits || 0), 0);
  const passed=course=>course.considered===false?course.gradeResult==='P':scaleType==='5-highest'?Number(course.finalGrade)>=3:Number(course.finalGrade)<=3;
  const hasResult=course=>course.considered===false?['P','F'].includes(course.gradeResult):course.finalGrade!=null;
  return { assigned, totalUnits, gwa: gradedUnits ? weighted / gradedUnits : null, passed: assigned.filter(course => hasResult(course) && passed(course)).length, failed: assigned.filter(course => hasResult(course) && !passed(course)).length, incomplete: assigned.filter(course => !hasResult(course)).length };
};

export function renderTermsPage(state) {
  activeGradeConversion = state.settings.gradeConversion || [];
  ensureAutomaticTerms(state);
  const startYear = Number(state.settings.academicStartDate?.slice(0, 4)) || new Date().getFullYear();
  const activeAcademicYears = new Set(Array.from({ length: 4 }, (_, index) => academicYearFor(startYear, index)));
  const visible = state.terms.filter(term => term.format === state.settings.termFormat && activeAcademicYears.has(term.academicYear)).sort((a, b) => termOrder(a) - termOrder(b));
  const current = visible.find(term => statusFor(term) === 'current') || visible.find(term => statusFor(term) === 'upcoming') || visible.find(term => statusFor(term) === 'setup') || visible.at(-1);
  const selected = visible.find(term => term.id === state.selectedTermId) || current;
  if (selected && !state.selectedTermId) state.selectedTermId = selected.id;
  const selectedStats = selected ? statsFor(selected, state.courses, state.profile.scale_type, state.settings.gradeConversion) : null;
  const history = visible.filter(term => statusFor(term) === 'completed').sort((a, b) => termOrder(a) - termOrder(b));
  const historyStats = history.map(term => ({ term, ...statsFor(term, state.courses, state.profile.scale_type, state.settings.gradeConversion) }));
  const validGwas = historyStats.filter(item => item.gwa != null);
  const best = validGwas.sort((a, b) => state.profile.scale_type === '5-highest' ? b.gwa - a.gwa : a.gwa - b.gwa)[0];
  const previous = visible.filter(term => selected && termOrder(term) < termOrder(selected)).at(-1);
  const previousStats = previous ? statsFor(previous, state.courses, state.profile.scale_type, state.settings.gradeConversion) : null;
  const groupedTerms = Array.from({ length: 4 }, (_, index) => ({ index, terms: visible.filter(term => Number(term.yearIndex) === index) }));
  const unitCap = formatUnitCaps[state.settings.termFormat] || 18;
  const assignmentOptions = selected ? state.courses.map(course => {
    const checked = selected.courseIds.some(id => String(id) === String(course.id));
    const otherTerm = visible.find(term => term.id !== selected.id && term.courseIds.some(id => String(id) === String(course.id)));
    if (otherTerm && !checked) return '';
    const unmetPrerequisites = (course.prerequisiteIds || []).map(id => state.courses.find(item => String(item.id) === String(id))).filter(Boolean).filter(prerequisite => !visible.some(term => termOrder(term) < termOrder(selected) && term.completed && term.courseIds.some(id => String(id) === String(prerequisite.id)) && (prerequisite.considered===false?prerequisite.gradeResult==='P':state.profile.scale_type==='5-highest'?Number(prerequisite.finalGrade)>=3:Number(prerequisite.finalGrade)<=3)));
    const blockedReason = unmetPrerequisites.length ? `Complete first: ${unmetPrerequisites.map(item => item.code).join(', ')}` : '';
    return `<label class="${blockedReason && !checked ? 'course-blocked' : ''}"><input type="checkbox" name="course" value="${course.id}" data-units="${Number(course.credits || 0)}" data-corequisites="${esc(JSON.stringify(course.corequisiteIds || []))}" ${checked ? 'checked' : ''} ${blockedReason && !checked ? 'disabled' : ''}><span><strong>${esc(course.code)}</strong><small>${esc(course.name)} · ${course.credits} units</small>${blockedReason && !checked ? `<em>${esc(blockedReason)}</em>` : ''}</span></label>`;
  }).join('') : '';

  return `<section class="terms-page">
    ${current ? `<article class="current-term-card"><div><span class="term-status ${statusFor(current)}">${statusFor(current) === 'setup' ? 'needs dates' : statusFor(current)}</span><p>${yearLabel(Number(current.yearIndex || 0))}</p><h2>${esc(current.name)}</h2><small>${esc(current.academicYear)} · ${titleCase(current.format)}</small></div><div class="term-dates ${statusFor(current) === 'setup' ? 'needs-dates' : ''}"><span>${dateRange(current)}</span>${statusFor(current) === 'setup' ? `<button class="secondary-button" data-edit-term="${current.id}">Set dates</button>` : `<strong>${progressFor(current)}%</strong><div><i style="width:${progressFor(current)}%"></i></div>`}</div></article>` : ''}
    <div class="terms-layout"><section><div class="section-head"><div><h2>Term list</h2><p>Previous, current, and upcoming terms</p></div></div><div class="term-list">
      ${groupedTerms.map(group => `<section class="term-year-group"><div class="term-year-label"><strong>${yearLabel(group.index)}</strong><span>${esc(academicYearFor(Number(state.settings.academicStartDate?.slice(0, 4)) || new Date().getFullYear(), group.index))}</span></div>${group.terms.map(term => { const stat = statsFor(term, state.courses, state.profile.scale_type); const status = statusFor(term); return `<article class="term-row ${selected?.id === term.id ? 'selected' : ''}"><button class="term-open" data-term-open="${term.id}"><span class="term-status ${status}">${status === 'setup' ? 'needs dates' : status}</span><strong>${esc(term.name)}</strong><small>${status === 'setup' ? 'Set term start and end dates' : dateRange(term)}</small></button><div class="term-metrics"><span><b>${stat.assigned.length}</b> courses</span><span><b>${stat.totalUnits}</b> units</span><span><b>${stat.gwa?.toFixed(2) || '—'}</b> GWA</span></div><div class="term-actions"><button title="Set dates and details" data-edit-term="${term.id}" aria-label="Edit ${esc(term.name)}">✎</button></div></article>`; }).join('')}</section>`).join('')}
    </div></section>
    ${selected ? `<aside class="term-detail"><div class="detail-head"><div><span>SELECTED TERM</span><h2>${esc(selected.name)}</h2><p>${esc(selected.academicYear)}</p></div><button class="secondary-button" data-edit-term="${selected.id}">Edit</button></div><div class="stat-grid"><div><span>Current GWA</span><strong>${selectedStats.gwa?.toFixed(2) || '—'}</strong></div><div><span>Goal GWA</span><strong>${Number(state.profile.goal_gwa).toFixed(2)}</strong></div><div><span>Units</span><strong>${selectedStats.totalUnits}</strong></div><div><span>Courses</span><strong>${selectedStats.assigned.length}</strong></div></div><div class="result-counts"><span class="pass">${selectedStats.passed} Passed</span><span class="incomplete">${selectedStats.incomplete} Incomplete</span><span class="fail">${selectedStats.failed} Failed</span></div><div class="assigned-head"><h3>Assigned courses</h3><button class="text-button" id="assign-courses">Manage</button></div><div class="assigned-list">${selectedStats.assigned.length ? selectedStats.assigned.map(course => `<div><span><strong>${esc(course.code)}</strong><small>${esc(course.name)}</small></span><select data-move-course="${course.id}"><option value="">Move to…</option>${visible.filter(term => term.id !== selected.id).map(term => `<option value="${term.id}">${esc(term.name)}</option>`).join('')}</select></div>`).join('') : '<p>No courses assigned.</p>'}</div><div class="detail-actions"><button class="secondary-button" id="copy-previous" ${!previous ? 'disabled' : ''}>Copy previous courses</button><button class="primary" id="complete-term" ${selected.completed ? 'disabled' : ''}>${selected.completed ? 'Grades locked' : 'Complete & lock'}</button><button class="secondary-button" id="carry-incomplete" ${selectedStats.incomplete ? '' : 'disabled'}>Carry incomplete forward</button></div>${selected.notes ? `<p class="term-notes">${esc(selected.notes)}</p>` : ''}</aside>` : ''}</div>
    <section class="history-card"><div class="section-head"><div><h2>History and comparison</h2><p>Performance across completed terms</p></div>${best ? `<span class="best-term">Best: ${esc(best.term.name)} · ${best.gwa.toFixed(2)}</span>` : ''}</div><div class="history-grid"><div class="trend-chart">${historyStats.length ? historyStats.map(item => `<div><span style="height:${item.gwa == null ? 6 : Math.max(12, (6 - item.gwa) / 5 * 100)}%"></span><small>${esc(item.term.name.replace(' Quarter','Q'))}</small></div>`).join('') : '<p>Complete a term to see trends.</p>'}</div><div class="comparison"><span>Compared with previous term</span><strong>${selectedStats?.gwa != null && previousStats?.gwa != null ? `${selectedStats.gwa <= previousStats.gwa ? '↑' : '↓'} ${Math.abs(selectedStats.gwa - previousStats.gwa).toFixed(2)} GWA` : 'Not enough data'}</strong><small>${historyStats.reduce((sum,item) => sum + item.totalUnits, 0)} units completed over time</small></div></div></section>
    <dialog id="term-dialog"><form method="dialog" id="term-form"><input type="hidden" name="id"><div class="dialog-head"><span class="term-dialog-icon">▦</span><div><span class="dialog-eyebrow">ACADEMIC PERIOD</span><h2>Term details</h2><p id="term-dialog-context">Set the dates and notes for this term.</p></div><button type="button" data-close-term class="close" aria-label="Close term dialog">×</button></div><fieldset><legend><span>01</span> Schedule</legend><div class="form-row"><label>Start date<input name="startDate" type="date" required></label><label>End date<input name="endDate" type="date" required></label></div></fieldset><fieldset><legend><span>02</span> Notes</legend><label>Notes<textarea name="notes" rows="3" placeholder="Add reminders or notes for this term…"></textarea></label></fieldset><div class="term-dialog-footer"><button type="button" id="delete-term-dialog" class="delete-term-dialog" title="Delete term"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5"/></svg><span>Delete term</span></button><span class="term-dialog-footer-spacer"></span><button type="button" data-close-term class="secondary-button">Cancel</button><button type="submit" value="save" class="primary">Save term <span>→</span></button></div></form></dialog>
    <dialog id="assignment-dialog"><form method="dialog" id="assignment-form"><div class="dialog-head"><div><h2>Manage courses</h2><p>Prerequisites must be passed in an earlier completed term. Co-requisites must be selected together.</p></div><button type="button" data-close-assignment class="close" aria-label="Close course manager">×</button></div><div class="assignment-unit-limit"><span>Selected units</span><strong id="assignment-unit-count">0 / ${unitCap}</strong></div><div class="course-checks">${assignmentOptions}</div><p class="assignment-error" id="assignment-error" hidden></p><div class="assignment-footer"><button type="button" data-close-assignment class="secondary-button">Cancel</button><button type="submit" value="save" class="primary" id="save-assignments">Save assignments</button></div></form></dialog>
  </section>`;
}

export function bindTermsPage(state, { persist, remove, rerender }) {
  const termDialog = document.querySelector('#term-dialog');
  const termForm = document.querySelector('#term-form');
  document.querySelectorAll('[data-close-term]').forEach(button => button.addEventListener('click', () => termDialog.close('cancel')));
  document.querySelectorAll('[data-edit-term]').forEach(button => button.addEventListener('click', () => { const term = state.terms.find(item => item.id === button.dataset.editTerm); termForm.reset(); Object.entries(term).forEach(([key,value]) => { if (termForm.elements[key] && !Array.isArray(value)) termForm.elements[key].value = value; }); document.querySelector('#term-dialog-context').textContent = `${yearLabel(Number(term.yearIndex || 0))} · ${term.name} · ${term.academicYear}`; termDialog.showModal(); }));
  termDialog?.addEventListener('close', async () => { if (termDialog.returnValue !== 'save') return; const data = new FormData(termForm); const existing = state.terms.find(term => term.id === data.get('id')); if (!existing) return; const startDate=data.get('startDate'), endDate=data.get('endDate'); if (endDate < startDate) return window.alert('End date must be after the start date.'); Object.assign(existing, { startDate, endDate, targetGwa:Number(state.profile.goal_gwa), notes:data.get('notes').trim() }); state.selectedTermId = existing.id; await persist(existing); rerender(); });
  document.querySelectorAll('[data-term-open]').forEach(button => button.addEventListener('click', () => { state.selectedTermId = button.dataset.termOpen; rerender(); }));
  document.querySelector('#delete-term-dialog')?.addEventListener('click', async () => { const term=state.terms.find(item=>item.id===termForm.elements.id.value); if(!term || !window.confirm(`Delete ${term.name} from ${yearLabel(Number(term.yearIndex || 0))}? Courses will not be deleted.`))return; termDialog.close('delete'); state.terms=state.terms.filter(item=>item.id!==term.id); const deletedIds=new Set(JSON.parse(localStorage.getItem('grade-tracker-deleted-terms')||'[]')); deletedIds.add(termDeletionKey(term)); localStorage.setItem('grade-tracker-deleted-terms',JSON.stringify([...deletedIds])); if(state.selectedTermId===term.id)state.selectedTermId=null; await remove(term.id); rerender(); });
  document.querySelector('#copy-previous')?.remove();
  const assignmentDialog=document.querySelector('#assignment-dialog'),assignmentForm=document.querySelector('#assignment-form'),unitCap=formatUnitCaps[state.settings.termFormat]||18,assignmentError=document.querySelector('#assignment-error');
  document.querySelectorAll('[data-close-assignment]').forEach(button=>button.addEventListener('click',()=>assignmentDialog.close('cancel')));
  const updateAssignmentUnits=()=>{const checked=[...assignmentForm.querySelectorAll('[name="course"]:checked')],total=checked.reduce((sum,input)=>sum+Number(input.dataset.units||0),0);document.querySelector('#assignment-unit-count').textContent=`${total} / ${unitCap}`;document.querySelector('.assignment-unit-limit')?.classList.toggle('over-limit',total>unitCap);if(total<=unitCap){assignmentError.hidden=true;}return {checked,total};};
  document.querySelector('#assign-courses')?.addEventListener('click',()=>{updateAssignmentUnits();assignmentDialog.showModal();});assignmentForm?.querySelectorAll('[name="course"]').forEach(input=>input.addEventListener('change',updateAssignmentUnits));
  assignmentForm?.addEventListener('submit',event=>{event.preventDefault();const {checked,total}=updateAssignmentUnits();if(total>unitCap&&!window.confirm(`This ${state.settings.termFormat} normally allows ${unitCap} units. You selected ${total} units. Do you want to overload this term?`))return;const selectedIds=new Set(checked.map(input=>input.value));const missing=[];checked.forEach(input=>{JSON.parse(input.dataset.corequisites||'[]').forEach(id=>{if(!selectedIds.has(String(id))){const course=state.courses.find(item=>String(item.id)===String(id));if(course)missing.push(course.code);}});});if(missing.length){assignmentError.textContent=`Select the required co-requisite${missing.length>1?'s':''}: ${[...new Set(missing)].join(', ')}.`;assignmentError.hidden=false;return;}assignmentDialog.close('save');});
  assignmentDialog?.addEventListener('close',async()=>{if(assignmentDialog.returnValue!=='save')return; const term=state.terms.find(item=>item.id===state.selectedTermId); term.courseIds=[...new FormData(assignmentForm).getAll('course')]; await persist(term);rerender();});
  document.querySelectorAll('[data-move-course]').forEach(select=>{const course=state.courses.find(item=>String(item.id)===select.dataset.moveCourse),grade=course?.considered===false?(course.gradeResult||'Not graded'):course?.finalGrade==null?'Not graded':Number(course.finalGrade).toFixed(2),label=document.createElement('span');label.className=`assigned-course-grade ${grade==='Not graded'?'ungraded':''}`;label.innerHTML=`<small>Final grade</small><strong>${esc(grade)}</strong>`;select.replaceWith(label);});
  document.querySelector('#complete-term')?.addEventListener('click',async()=>{if(!window.confirm('Complete this term and lock its grades?'))return;const term=state.terms.find(item=>item.id===state.selectedTermId);term.completed=true;term.gradesLocked=true;await persist(term);rerender();});
  document.querySelector('#carry-incomplete')?.addEventListener('click',async()=>{const source=state.terms.find(item=>item.id===state.selectedTermId),incomplete=source.courseIds.filter(id=>state.courses.find(course=>String(course.id)===String(id))?.grade==null);let target=state.terms.filter(item=>item.format===source.format&&termOrder(item)>termOrder(source)).sort((a,b)=>termOrder(a)-termOrder(b))[0];if(!target)return window.alert('There is no later term available.');target.courseIds=[...new Set([...target.courseIds,...incomplete])];await persist(target);state.selectedTermId=target.id;rerender();});
}
