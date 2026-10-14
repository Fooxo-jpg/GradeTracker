const colors = { Core: '#4d79df', Specialization: '#9163db', Elective: '#2fa8a0' };

export const courseTypeColor = type => colors[type] || colors.Core;
