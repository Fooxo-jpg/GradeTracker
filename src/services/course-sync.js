export function preserveLocalWorkspace(state) {
  // Keep the last five snapshots; avoid duplicate snapshots on every reload.
  const key = 'grade-tracker-recovery-snapshots';
  const workspace = { courses: state.courses, terms: state.terms, profile: state.profile, settings: state.settings };
  const snapshots = JSON.parse(localStorage.getItem(key) || '[]');
  const data = JSON.stringify(workspace);
  if (snapshots.at(-1)?.data !== data) {
    snapshots.push({ savedAt: new Date().toISOString(), data });
    localStorage.setItem(key, JSON.stringify(snapshots.slice(-5)));
  }
}

export function mergeCourseLists(local, remote) {
  const merged = new Map(local.map(course => [String(course.id), course]));
  for (const course of remote || []) merged.set(String(course.id), course);
  return [...merged.values()];
}
