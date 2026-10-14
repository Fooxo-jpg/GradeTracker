export function chooseBackupImportMode() {
  return new Promise(resolve => {
    const dialog = document.createElement('dialog');
    dialog.className = 'backup-import-dialog';
    dialog.setAttribute('aria-labelledby', 'backup-import-title');
    dialog.innerHTML = '<form method="dialog"><h2 id="backup-import-title">Import backup</h2><p>You already have saved data. How would you like to import this backup?</p><button class="backup-import-choice" value="add"><strong>Add new data</strong><small>Keep existing courses, grades, profile, and settings. Add missing courses and term assignments.</small></button><button class="backup-import-choice replace" value="replace"><strong>Replace existing data</strong><small>Replace courses, terms, profile, and settings on this device with the backup. Cloud data is unchanged.</small></button><div class="backup-import-footer"><button class="secondary-button" value="cancel" autofocus>Cancel</button></div></form>';
    dialog.addEventListener('close', () => { const choice = dialog.returnValue; dialog.remove(); resolve(['add', 'replace'].includes(choice) ? choice : 'cancel'); }, { once: true });
    document.body.append(dialog); dialog.showModal();
  });
}

export function mergeBackupData(current, backup) {
  const courses = structuredClone(current.courses);
  const idMap = new Map();
  const added = [];
  for (const course of backup.courses) {
    const existing = courses.find(item => String(item.id) === String(course.id) || item.code.trim().toUpperCase() === course.code.trim().toUpperCase());
    if (existing) { idMap.set(String(course.id), existing.id); continue; }
    const copy = structuredClone(course);
    courses.push(copy); added.push(copy); idMap.set(String(course.id), copy.id);
  }
  const remap = ids => [...new Set((ids || []).map(id => idMap.get(String(id)) ?? id))];
  added.forEach(course => { course.prerequisiteIds = remap(course.prerequisiteIds); course.corequisiteIds = remap(course.corequisiteIds); });
  const terms = structuredClone(current.terms);
  const assigned = new Set(terms.flatMap(term => (term.courseIds || []).map(String)));
  for (const term of backup.terms || []) {
    const existing = terms.find(item => String(item.id) === String(term.id) || (item.format === term.format && item.academicYear === term.academicYear && Number(item.number) === Number(term.number)));
    const ids = remap(term.courseIds).filter(id => !assigned.has(String(id)) && courses.some(course => String(course.id) === String(id)));
    // Keep existing assignments and avoid adding courses into locked terms.
    if (existing?.gradesLocked) continue;
    if (existing) existing.courseIds = [...(existing.courseIds || []), ...ids];
    else terms.push({ ...structuredClone(term), courseIds: ids });
    ids.forEach(id => assigned.add(String(id)));
  }
  return { courses, terms };
}
