import { courseTypeColor } from './course-colors.js';

export const coreCourseBatch = [
  ['CSS133-1', 'Algorithms and Complexity', 3, ['CSS131-1']],
  ['CSS134-1', 'Automata Theory and Formal Language', 3, ['CSS132-1']],
  ['GEE120', 'GE Elective', 3],
  ['IE103-2', 'Technopreneurship 101', 3],
  ['PHY10-8', 'College Physics 1', 2],
  ['PHY10-8L', 'College Physics 1 Laboratory', 1],
  ['CSS141-1', 'Numerical Methods', 3, ['CSS132-1']],
  ['CSS142P', 'Modeling and Simulation Theory', 3, ['CSS133-1']],
  ['GED108', 'Art Appreciation', 3],
  ['PHY11-8', 'College Physics 2', 2, ['PHY10-8', 'PHY10-8L']],
  ['PHY11-8L', 'College Physics 2 Laboratory', 1, ['PHY10-8', 'PHY10-8L'], ['PHY11-8']],
  ['CSS109-1', 'Research Methods in Computer Science', 3, ['CSS142P', 'CSS152P']],
  ['CSS154-1', 'Parallel and Distributed Computing', 3, ['ITS131P', 'ITS150P', 'ITS163-1L']],
  ['ENV121', 'Environmental Science and Sustainability', 3, [], [], '3rd year standing'],
  ['ITS141-1', 'Human-Computer Interaction 1', 3, ['CSS123P']],
  ['ITS165-1', 'Information Security and Assurance 1', 3, ['ITS131P', 'ITS161-1L']],
  ['CSS200-01', 'Thesis 1', 1, ['CSS109-1']],
  ['GED110', "People and Earth's Ecosystem", 3],
  ['GEE130', 'GE Elective', 3],
  ['ITS105-1', 'Social and Professional Issues', 3, ['CSS123P', 'GED107']],
  ['ITS120P', 'Application Development and Emerging Technologies', 3, ['CSS123P']]
];

export const electiveCourseBatch = [
  ['CSS171-1', 'Graphics and Visual Computing', 3, ['CSS123P']],
  ['CSS172-1', 'Pattern Recognition', 3, ['CSS123P']],
  ['ECS176-1', 'Introduction to Game Programming', 3, ['CSS123P']],
  ['ISS171-1', 'Supply Chain Management', 3, ['ITS122P']],
  ['ISS172-1', 'Customer Relations Management', 3, ['ITS131P']],
  ['ISS173-1', 'Essential of GIS', 3, ['CSS123P']],
  ['ISS174-1', 'IT Audit and Control', 3, ['ITS131P']],
  ['ITS170-1', 'IT Infrastructure Library Foundation Course', 3, ['ITS131P']],
  ['ITS171-1', 'Fundamentals of SAP', 3, ['ITS131P']],
  ['ITS172-1', 'Mobile Application Development', 3, ['CSS123P']],
  ['ITS173-1', 'Embedded Systems', 3, ['CSS123P']],
  ['ITS174-1', 'Internet of Things', 3, ['CSS123P']],
  ['ITS175-1', 'Cloud Computing', 3, ['CSS123P']],
  ['ITS176', 'Blockchain Technology', 3, ['CSS123P']]
];

export async function importCoreCourses(state, { createCourse, updateCourse, ensureGradebook }) {
  const api = { createCourse, updateCourse, ensureGradebook };
  await importBatch(state, api, coreCourseBatch, 'grade-tracker-core-reimport-2026-10-14-1');
  await importBatch(state, api, [
    ['CSS199-8R', 'CS Practicum', 3],
    ['CSS200-02', 'Thesis 2', 1],
    ['ITS198F', 'Career Development and Seminar in IT', 1],
    ['SGE100X', 'Student Global Experience', 0]
  ], 'grade-tracker-core-reimport-2026-10-14-2');
  await importBatch(state, api, electiveCourseBatch, 'grade-tracker-elective-import-2026-10-14', 'Elective');
}

async function importBatch(state, { createCourse, updateCourse, ensureGradebook }, batch, key, courseType = 'Core') {
  if (localStorage.getItem(key)) return;
  const find = code => state.courses.find(course => course.code.trim().toUpperCase() === code);
  const codes = new Set([...state.courses.map(course => course.code.trim().toUpperCase()), ...batch.map(([code]) => code)]);
  const missing = [...new Set(batch.flatMap(([, , , prerequisites = [], corequisites = []]) => [...prerequisites, ...corequisites]).filter(code => !codes.has(code)))];
  if (missing.length) throw new Error(`Course import needs existing prerequisites: ${missing.join(', ')}. Restore these courses and reload to retry.`);
  const saveLocal = () => localStorage.setItem('grade-tracker-courses', JSON.stringify(state.courses));
  let added = 0;
  for (const [code, name, credits] of batch) {
    if (find(code)) continue;
    const draft = { id: crypto.randomUUID(), code, name, credits, instructor: '', grade: null, finalGrade: null, gradeResult: '', courseType, considered: true, color: courseTypeColor(courseType), assessments: 0, prerequisiteIds: [], corequisiteIds: [] };
    const saved = await createCourse(draft);
    state.courses.push(saved || draft); saveLocal(); added++;
  }
  for (const [code, , , prerequisites = [], corequisites = [], standing] of batch) {
    const course = find(code);
    course.courseType = courseType; course.color = courseTypeColor(courseType);
    course.prerequisiteIds = [...new Set([...(course.prerequisiteIds || []), ...prerequisites.map(code => find(code).id)])];
    course.corequisiteIds = [...new Set([...(course.corequisiteIds || []), ...corequisites.map(code => find(code).id)])];
    if (standing) ensureGradebook(course).enrollmentRequirement = standing;
    saveLocal(); await updateCourse(course);
  }
  localStorage.setItem(key, 'done');
  if (added) state.notice = `Imported ${added} ${courseType} courses with prerequisites and co-requisites. Grades and term assignments remain unset.`;
}
