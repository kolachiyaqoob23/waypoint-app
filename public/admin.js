'use strict';
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const out = document.getElementById('out'), err = document.getElementById('err');
let rows = [];

function csvCell(v) { const s = String(v == null ? '' : v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; }
function toCsv() {
  const head = ['id', 'name', 'email', 'class', 'category', 'registered', 'subjects'];
  const lines = [head.join(',')].concat(rows.map(s => [s.id, s.name, s.email, s.grade, s.category, new Date(s.created_at).toISOString(),
    s.subjects.map(x => x.title + (x.readiness == null ? '' : ' (' + x.readiness + '%)')).join('; ')].map(csvCell).join(',')));
  return lines.join('\n');
}

document.getElementById('keyform').addEventListener('submit', async e => {
  e.preventDefault(); err.hidden = true; out.innerHTML = '';
  try {
    const res = await fetch('/api/admin/students', { headers: { 'x-admin-key': document.getElementById('key').value } });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Could not load students.');
    rows = data.students;
    const byCat = {}; rows.forEach(s => { byCat[s.category] = (byCat[s.category] || 0) + 1; });
    out.innerHTML = `<div class="stats"><span class="chip mark">${data.total} student${data.total === 1 ? '' : 's'}</span>` +
      Object.keys(byCat).map(k => `<span class="chip neutral">${esc(k)}: ${byCat[k]}</span>`).join('') + '</div>' +
      `<div class="row" style="margin:14px 0"><button class="btn ghost small" id="csv">Download CSV</button></div>` +
      `<div class="panel wrap"><table class="hist"><thead><tr><th>Name</th><th>Email</th><th>Class</th><th>Category</th><th>Registered</th><th>Subjects (readiness)</th></tr></thead><tbody>` +
      rows.map(s => `<tr><td>${esc(s.name)}</td><td>${esc(s.email)}</td><td>${s.grade}</td><td>${esc(s.category)}</td><td>${new Date(s.created_at).toLocaleDateString()}</td><td>${s.subjects.map(x => esc(x.title) + (x.readiness == null ? '' : ' (' + x.readiness + '%)')).join('<br>') || '<span class="muted">None yet</span>'}</td></tr>`).join('') +
      '</tbody></table></div>';
    document.getElementById('csv').addEventListener('click', () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([toCsv()], { type: 'text/csv' })); a.download = 'waypoint-students.csv';
      document.body.appendChild(a); a.click(); a.remove();
    });
  } catch (ex) { err.textContent = ex.message; err.hidden = false; }
});
