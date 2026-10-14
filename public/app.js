'use strict';
/* ============================================================
   Waypoint client. All data lives on the server (SQLite);
   this file only renders it and calls the JSON API.
   ============================================================ */
const BANDS_UI = [
  { id: 'primary',   label: 'Primary',                         from: 1,  to: 5 },
  { id: 'middle',    label: 'Middle',                          from: 6,  to: 8 },
  { id: 'secondary', label: 'Secondary (Matric)',              from: 9,  to: 10 },
  { id: 'higher',    label: 'Higher Secondary (Intermediate)', from: 11, to: 12 }
];
const LV = {
  weak:       { label: 'Needs work',    min: 25, rank: 0 },
  developing: { label: 'Getting there', min: 15, rank: 1 },
  strong:     { label: 'Strong',        min: 5,  rank: 2 }
};
const $app = document.getElementById('app');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const safeUrl = u => (/^https?:\/\//i.test(u) ? u : '#');
const level = p => (p >= 0.8 ? 'strong' : p >= 0.5 ? 'developing' : 'weak');
const pct = p => Math.round(p * 100);

const S = {
  view: 'loading', user: null, enrolled: [], catalog: null, progress: {},
  sid: null, quiz: null, last: null, open: {}, resetArmed: false, removeArmed: false,
  showAll: false, authMode: 'login', authError: '', busy: false, error: '', draft: {}
};

/* ---------- API ---------- */
async function api(method, url, body) {
  const opt = { method, credentials: 'same-origin', headers: {} };
  if (method !== 'GET') { opt.headers['Content-Type'] = 'application/json'; opt.body = JSON.stringify(body || {}); }
  let res;
  try { res = await fetch(url, opt); } catch (e) { throw Object.assign(new Error('Cannot reach the server. Check your connection and try again.'), { status: 0 }); }
  let data = null;
  try { data = await res.json(); } catch (e) { /* empty body */ }
  if (!res.ok) {
    const err = new Error((data && data.error) || 'Something went wrong.');
    err.status = res.status;
    if (res.status === 401 && S.user) { sessionExpired(); }
    throw err;
  }
  return data;
}
function sessionExpired() {
  S.user = null; S.view = 'auth'; S.authMode = 'login'; S.authError = 'Your session expired. Please log in again.'; render();
}
function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove('show'), 3000);
}

/* ---------- data helpers ---------- */
const subj = id => S.catalog.subjects.find(s => s.id === id);
const P = sid => S.progress[sid] || { attempts: [], studied: {}, missed: {} };
function resultsFrom(attempts) {
  const r = {};
  attempts.forEach(a => Object.keys(a.topics).forEach(t => { r[t] = a.topics[t]; }));
  return r;
}
function readiness(sid) {
  const s = subj(sid), r = resultsFrom(P(sid).attempts);
  const vals = s.topics.filter(t => r[t.id]).map(t => r[t.id].correct / r[t.id].total);
  return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null;
}
function buildPlan(sid) {
  const s = subj(sid), pr = P(sid), res = resultsFrom(pr.attempts);
  const steps = s.topics.filter(t => res[t.id]).map(t => {
    const r = res[t.id], p = r.correct / r.total, lv = level(p);
    return { topic: t, r, p, lv, min: LV[lv].min, done: !!pr.studied[t.id] };
  }).sort((a, b) => LV[a.lv].rank - LV[b.lv].rank || a.p - b.p);
  let day = 1, used = 0;
  steps.forEach(x => {
    if (used > 0 && used + x.min > S.user.minutes) { day++; used = 0; }
    x.day = day; used += x.min;
  });
  return steps;
}
function planText(sid) {
  const s = subj(sid), steps = buildPlan(sid);
  let out = 'Study plan: ' + s.title + ' (' + S.user.name + ', Class ' + S.user.grade + ')\n', d = 0;
  steps.forEach((x, i) => {
    if (x.day !== d) { d = x.day; out += '\nDay ' + d + '\n'; }
    out += (i + 1) + '. ' + x.topic.name + ' [' + LV[x.lv].label + ', ' + x.r.correct + '/' + x.r.total + '] ~' + x.min + ' min' + (x.done ? ' (done)' : '') + '\n';
  });
  return out;
}
function bandRange(id) {
  const b = BANDS_UI.find(x => x.id === id);
  return b ? 'Class ' + b.from + '–' + b.to : '';
}
async function reloadProgress() { S.progress = (await api('GET', '/api/progress')).subjects; }

/* ============================================================
   VIEWS
   ============================================================ */
function classOptions(selected) {
  return BANDS_UI.map(b => `<optgroup label="${esc(b.label)}">` +
    Array.from({ length: b.to - b.from + 1 }, (_, i) => b.from + i).map(g =>
      `<option value="${g}" ${Number(selected) === g ? 'selected' : ''}>Class ${g}</option>`).join('') + '</optgroup>').join('');
}

function viewAuth() {
  const reg = S.authMode === 'register';
  return `<div class="authwrap">
    <h1>${reg ? 'Create your account' : 'Welcome back'}</h1>
    <p class="lede">${reg ? 'Tell us your class and we will show the subjects that match it.' : 'Log in to continue your study plan.'}</p>
    <div class="tabs" role="tablist" style="margin-top:22px">
      <button class="tab" role="tab" aria-selected="${!reg}" data-action="authmode" data-mode="login">Log in</button>
      <button class="tab" role="tab" aria-selected="${reg}" data-action="authmode" data-mode="register">Register</button>
    </div>
    ${S.authError ? `<div class="err" role="alert">${esc(S.authError)}</div>` : ''}
    <form data-form="${reg ? 'register' : 'login'}" novalidate>
      ${reg ? `<label class="field"><span>Full name</span><input name="name" autocomplete="name" required maxlength="60" value="${esc(S.draft.name || '')}"></label>` : ''}
      <label class="field"><span>Email</span><input name="email" type="email" autocomplete="email" required maxlength="120" value="${esc(S.draft.email || '')}"></label>
      <label class="field"><span>Password</span><input name="password" type="password" autocomplete="${reg ? 'new-password' : 'current-password'}" required minlength="${reg ? 8 : 1}" maxlength="100">${reg ? '<small>At least 8 characters.</small>' : ''}</label>
      ${reg ? `<label class="field"><span>Your class</span><select name="grade" required><option value="">Choose your class</option>${classOptions(S.draft.grade)}</select></label>` : ''}
      <button class="btn primary block" type="submit" ${S.busy ? 'disabled' : ''}>${reg ? 'Create account' : 'Log in'}</button>
    </form>
  </div>`;
}

function subjectCard(s, mode) {
  const pr = P(s.id), n = pr.attempts.length, rd = readiness(s.id);
  if (mode === 'mine') {
    const status = n ? `<span class="chip neutral">Readiness ${pct(rd)}% · ${n} attempt${n > 1 ? 's' : ''}</span>` : '<span class="chip neutral">Not started</span>';
    return `<article class="subject">
      <span class="area">${esc(s.area)}</span><h3>${esc(s.title)}</h3>
      <p class="muted grow">${esc(s.blurb)}</p><div>${status}</div>
      <button class="btn primary" data-action="open" data-s="${s.id}">${n ? 'Open my path' : 'Start diagnostic'}</button>
    </article>`;
  }
  const fits = s.bands.includes(S.user.band.id);
  return `<article class="subject">
    <span class="area">${esc(s.area)}</span><h3>${esc(s.title)}</h3>
    <p class="muted grow">${esc(s.blurb)}</p>
    <div>${fits ? '<span class="chip mark">Matches your class</span>' : `<span class="chip neutral">Made for ${esc(s.bands.map(bandRange).join(' and '))}</span>`}</div>
    <button class="btn ${fits ? 'primary' : 'ghost'}" data-action="add" data-s="${s.id}">Add and start</button>
  </article>`;
}

function viewHome() {
  const first = S.user.name.split(' ')[0];
  const mine = S.catalog.subjects.filter(s => S.enrolled.includes(s.id));
  const others = S.catalog.subjects.filter(s => !S.enrolled.includes(s.id));
  const matching = others.filter(s => s.bands.includes(S.user.band.id));
  const rest = others.filter(s => !s.bands.includes(S.user.band.id));
  return `<div class="stack">
    <div>
      <h1>Hi, ${esc(first)}.</h1>
      <div class="stats"><span class="chip mark">Class ${S.user.grade}</span><span class="chip neutral">${esc(S.user.band.label)}</span></div>
      <p class="lede">${mine.length ? 'Pick up where you left off, or add another subject.' : 'Choose a subject below. A short quiz will show what to study first.'}</p>
    </div>
    ${mine.length ? `<section class="section"><h2>My subjects</h2><div class="grid">${mine.map(s => subjectCard(s, 'mine')).join('')}</div></section>` : ''}
    <section class="section">
      <h2>Subjects for Class ${S.user.grade}</h2>
      ${matching.length ? `<div class="grid">${matching.map(s => subjectCard(s, 'add')).join('')}</div>`
        : `<p class="muted" style="margin-top:8px">${others.length ? 'You have added every subject made for your class.' : 'You have added every subject.'}</p>`}
    </section>
    ${rest.length ? `<section class="section">
      <label class="row"><input type="checkbox" data-action="showall" ${S.showAll ? 'checked' : ''}> <span>Show subjects made for other classes</span></label>
      ${S.showAll ? `<div class="grid">${rest.map(s => subjectCard(s, 'add')).join('')}</div>` : ''}
    </section>` : ''}
    ${!mine.length ? `<ol class="how">
      <li><b>1. Test</b><span>A 12-question diagnostic, about 8 minutes.</span></li>
      <li><b>2. Diagnose</b><span>Each topic is rated Needs work, Getting there or Strong.</span></li>
      <li><b>3. Study</b><span>A day-by-day plan with notes, your mistakes explained, and study links.</span></li>
      <li><b>4. Re-test</b><span>New questions check progress and re-order your plan.</span></li>
    </ol>` : ''}
  </div>`;
}

function viewIntro() {
  const s = subj(S.sid);
  return `<div class="stack">
    <button class="btn ghost small" data-action="home">Back to my subjects</button>
    <h1>${esc(s.title)}</h1>
    <p class="lede">${esc(s.blurb)} This diagnostic has ${s.topics.length * 3} questions, three per topic. There is no timer and you can go back to change answers.</p>
    <div class="panel"><h3>Topics covered</h3><ul>${s.topics.map(t => `<li>${esc(t.name)}</li>`).join('')}</ul></div>
    <button class="btn primary" data-action="start" data-scope="full" ${S.busy ? 'disabled' : ''}>Start diagnostic</button>
  </div>`;
}

function viewQuiz() {
  const qz = S.quiz, it = qz.items[qz.idx], n = qz.items.length, chosen = qz.answers[qz.idx];
  const t = subj(qz.sid).topics.find(x => x.id === it.tid);
  const letters = ['A', 'B', 'C', 'D'];
  const opts = it.options.map((o, i) =>
    `<button class="opt" role="radio" aria-checked="${chosen === i}" data-action="pick" data-i="${i}"><span class="k">${letters[i]}</span><span>${esc(o)}</span></button>`).join('');
  const last = qz.idx === n - 1;
  return `<div>
    <div class="qhead"><span class="small muted">Question ${qz.idx + 1} of ${n} · ${esc(t ? t.name : '')}</span><button class="btn ghost small" data-action="home">Exit quiz</button></div>
    <div class="progress" role="progressbar" aria-valuemin="0" aria-valuemax="${n}" aria-valuenow="${qz.idx + 1}"><i style="width:${((qz.idx + (chosen != null ? 1 : 0)) / n) * 100}%"></i></div>
    <div class="qcard">
      <p class="qtext">${esc(it.q)}</p>
      ${it.code ? `<pre><code>${esc(it.code)}</code></pre>` : ''}
      <div class="opts" role="radiogroup" aria-label="Answer choices">${opts}</div>
    </div>
    <div class="row between" style="margin-top:16px">
      <button class="btn ghost" data-action="prev" ${qz.idx === 0 ? 'disabled' : ''}>Previous</button>
      <button class="btn primary" data-action="next" ${chosen == null || S.busy ? 'disabled' : ''}>${last ? 'Finish quiz' : 'Next question'}</button>
    </div>
    <p class="small muted" style="margin-top:12px">Tip: press 1 to 4 to pick an answer.</p>
  </div>`;
}

function viewResults() {
  const L = S.last, s = subj(L.sid);
  let c = 0, tot = 0;
  Object.values(L.topics).forEach(x => { c += x.correct; tot += x.total; });
  const present = s.topics.filter(t => L.topics[t.id]);
  const rows = present.map(t => {
    const r = L.topics[t.id], p = r.correct / r.total, lv = level(p);
    let delta = '';
    if (L.previous[t.id]) {
      const pp = L.previous[t.id].correct / L.previous[t.id].total;
      delta = p > pp ? `Up from ${pct(pp)}%` : p < pp ? `Down from ${pct(pp)}%` : `Same as before (${pct(pp)}%)`;
    }
    return `<div class="trow ${lv}">
      <div><b>${esc(t.name)}</b><div class="small muted">${delta}</div></div>
      <div class="bar" aria-hidden="true"><i style="width:${Math.max(4, pct(p))}%"></i></div>
      <span class="chip ${lv}">${LV[lv].label} · ${r.correct}/${r.total}</span></div>`;
  }).join('');
  const weakNames = present.slice().sort((a, b) => L.topics[a.id].correct / L.topics[a.id].total - L.topics[b.id].correct / L.topics[b.id].total)
    .filter(t => level(L.topics[t.id].correct / L.topics[t.id].total) !== 'strong').map(t => t.name);
  const msg = weakNames.length ? `Start with ${weakNames.slice(0, 2).map(esc).join(' and ')}. Your plan puts the weakest topics first.`
    : 'Every topic in this attempt is strong. Nice work. Your plan now shows quick reviews only.';
  return `<div class="stack">
    <div><p class="muted">${L.scope === 'focus' ? 'Focused re-test' : 'Diagnostic'} complete · ${esc(s.title)}</p>
      <div class="score">${c}/${tot}</div><p class="lede">${msg}</p></div>
    <div class="panel">${rows}</div>
    <div class="row"><button class="btn primary" data-action="roadmap">See my study plan</button><button class="btn ghost" data-action="home">Back to my subjects</button></div>
  </div>`;
}

function resourceLinks(list) {
  return `<div class="links">${list.map(r => `<a class="btn ghost small" href="${esc(safeUrl(r.url))}" target="_blank" rel="noopener noreferrer">${esc(r.type)}: ${esc(r.title)}</a>`).join('')}</div>`;
}

function viewRoadmap() {
  const s = subj(S.sid), pr = P(S.sid), steps = buildPlan(S.sid);
  const counts = { weak: 0, developing: 0, strong: 0 };
  steps.forEach(x => counts[x.lv]++);
  const rd = readiness(S.sid), doneN = steps.filter(x => x.done).length, focusN = counts.weak + counts.developing;
  const dayTotals = {}; steps.forEach(x => { dayTotals[x.day] = (dayTotals[x.day] || 0) + x.min; });
  const firstOpen = steps.findIndex(x => !x.done);
  let list = '', curDay = 0;
  steps.forEach((x, i) => {
    if (x.day !== curDay) { curDay = x.day; list += `<li class="daymark">Day ${curDay} · about ${dayTotals[curDay]} min</li>`; }
    const open = S.open[x.topic.id] !== undefined ? S.open[x.topic.id] : i === firstOpen;
    const missed = (pr.missed[x.topic.id] || []).map(a => `<div class="missed">
        <div><b>${esc(a.q)}</b></div>
        ${a.code ? `<pre style="margin:8px 0"><code>${esc(a.code)}</code></pre>` : ''}
        <div class="bad">You chose: ${esc(a.chosen)}</div>
        <div class="good">Correct answer: ${esc(a.correct)}</div>
        <div class="muted" style="margin-top:4px">${esc(a.why)}</div></div>`).join('');
    list += `<li class="step ${x.lv} ${x.done ? 'done' : ''}">
      <span class="node" aria-hidden="true">${x.done ? '✓' : i + 1}</span>
      <div class="scard">
        <button class="shead" data-action="toggle" data-t="${x.topic.id}" aria-expanded="${open}">
          <span class="name">${esc(x.topic.name)}</span>
          <span class="chip ${x.lv}">${LV[x.lv].label} · ${x.r.correct}/${x.r.total}</span>
          <span class="small muted">${x.lv === 'strong' ? '5 min review' : x.min + ' min'}</span>
        </button>
        <div class="sbody" ${open ? '' : 'hidden'}>
          <h4>Quick lesson</h4><p>${esc(x.topic.lesson)}</p>
          <h4>Remember</h4><ul>${x.topic.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul>
          <h4>Questions you missed</h4>${missed || '<p class="muted">None. You answered every question on this topic correctly.</p>'}
          <h4>Study this topic</h4>${resourceLinks(x.topic.resources)}
          <div class="row noprint" style="margin-top:16px">
            <button class="btn ${x.done ? 'ghost' : 'primary'} small" data-action="studied" data-t="${x.topic.id}">${x.done ? 'Marked as studied (undo)' : 'Mark as studied'}</button>
          </div>
        </div>
      </div></li>`;
  });
  const attemptsDesc = pr.attempts.slice().reverse();
  const histRows = attemptsDesc.map(a => {
    let c = 0, t = 0; Object.values(a.topics).forEach(x => { c += x.correct; t += x.total; });
    return `<tr><td>${new Date(a.ts).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td><td>${a.scope === 'focus' ? 'Focused re-test' : 'Full diagnostic'}</td><td>${c}/${t} (${pct(c / t)}%)</td></tr>`;
  }).join('');
  const trendRows = s.topics.map(t => {
    const seq = pr.attempts.filter(a => a.topics[t.id]).map(a => pct(a.topics[t.id].correct / a.topics[t.id].total) + '%');
    return `<tr><td>${esc(t.name)}</td><td>${seq.join(' → ')}</td></tr>`;
  }).join('');
  return `<div class="stack">
    <div class="noprint"><button class="btn ghost small" data-action="home">Back to my subjects</button></div>
    <div>
      <h1>${esc(s.title)}: your study plan</h1>
      <div class="stats">
        <span class="chip mark">Class ${S.user.grade}</span>
        <span class="chip neutral">Readiness ${pct(rd)}%</span>
        <span class="chip weak">${counts.weak} need work</span><span class="chip developing">${counts.developing} getting there</span><span class="chip strong">${counts.strong} strong</span>
        <span class="chip neutral">${doneN} of ${steps.length} studied</span>
      </div>
    </div>
    <div class="panel noprint"><div class="row between">
      <div><b>${focusN ? 'Studied? Check your progress.' : 'Everything is strong.'}</b>
        <div class="small muted">${focusN ? 'A re-test uses new questions where possible and re-orders your plan.' : 'Retake the full diagnostic to keep your knowledge fresh.'}</div></div>
      <div class="row">
        <button class="btn primary" data-action="start" data-scope="focus" ${focusN && !S.busy ? '' : 'disabled'}>Re-test ${focusN} topic${focusN === 1 ? '' : 's'}</button>
        <button class="btn ghost" data-action="start" data-scope="full" ${S.busy ? 'disabled' : ''}>Full diagnostic</button>
      </div></div></div>
    <div class="row noprint">
      <label for="pace"><b>Time per day</b></label>
      <select id="pace" class="inline" data-action="pace">${[15, 30, 45, 60, 90].map(m => `<option value="${m}" ${S.user.minutes === m ? 'selected' : ''}>${m} minutes</option>`).join('')}</select>
      <button class="btn ghost small" data-action="copy">Copy plan as text</button>
      <button class="btn ghost small" data-action="print">Print plan</button>
    </div>
    <ol class="path">${list}</ol>
    <section class="panel stack">
      <h2>More resources for ${esc(s.title)}</h2>
      <ul class="reslist">${s.resources.map(r => `<li><span class="chip neutral">${esc(r.type)}</span><div><a href="${esc(safeUrl(r.url))}" target="_blank" rel="noopener noreferrer">${esc(r.title)}</a><div class="small muted">${esc(r.note)}</div></div></li>`).join('')}</ul>
    </section>
    <section class="panel stack">
      <h2>Your progress</h2>
      <div class="wrap"><table class="hist"><thead><tr><th>Topic</th><th>Score per attempt</th></tr></thead><tbody>${trendRows}</tbody></table></div>
      <div class="wrap"><table class="hist"><thead><tr><th>When</th><th>Type</th><th>Score</th></tr></thead><tbody>${histRows}</tbody></table></div>
      <div class="row noprint">
        <button class="btn ${S.resetArmed ? 'danger' : 'ghost'} small" data-action="reset">${S.resetArmed ? 'Click again to delete this subject\'s progress' : 'Reset progress for this subject'}</button>
        <button class="btn ${S.removeArmed ? 'danger' : 'ghost'} small" data-action="remove">${S.removeArmed ? 'Click again to remove this subject' : 'Remove from my subjects'}</button>
      </div>
    </section>
  </div>`;
}

function viewProfile() {
  return `<div class="authwrap stack">
    <button class="btn ghost small" data-action="home">Back to my subjects</button>
    <h1>Your profile</h1>
    ${S.authError ? `<div class="err" role="alert">${esc(S.authError)}</div>` : ''}
    <form data-form="profile" novalidate>
      <label class="field"><span>Full name</span><input name="name" value="${esc(S.user.name)}" maxlength="60" required></label>
      <label class="field"><span>Email</span><input value="${esc(S.user.email)}" disabled></label>
      <label class="field"><span>Your class</span><select name="grade">${classOptions(S.user.grade)}</select>
        <small>Currently in ${esc(S.user.band.label)}. Changing your class changes which subjects are recommended. Your progress is kept.</small></label>
      <button class="btn primary" type="submit" ${S.busy ? 'disabled' : ''}>Save changes</button>
    </form>
  </div>`;
}

/* ============================================================
   RENDER + ACTIONS
   ============================================================ */
function render(scroll) {
  const nav = document.getElementById('usernav');
  nav.hidden = !S.user;
  if (S.user) document.getElementById('who').textContent = S.user.name.split(' ')[0] + ' · Class ' + S.user.grade;
  let html = '';
  if (S.view === 'loading') html = '<p class="muted">Loading…</p>';
  else if (S.view === 'error') html = `<div class="stack"><h1>Can't load Waypoint</h1><p class="lede">${esc(S.error)}</p><button class="btn primary" data-action="retry">Try again</button></div>`;
  else if (S.view === 'auth') html = viewAuth();
  else if (S.view === 'home') html = viewHome();
  else if (S.view === 'intro') html = viewIntro();
  else if (S.view === 'quiz') html = viewQuiz();
  else if (S.view === 'results') html = viewResults();
  else if (S.view === 'roadmap') html = viewRoadmap();
  else if (S.view === 'profile') html = viewProfile();
  $app.innerHTML = html;
  if (scroll !== false) { window.scrollTo(0, 0); try { $app.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
}

async function afterAuth(data) {
  S.user = data.user; S.enrolled = data.enrolled || [];
  const [cat, prog] = await Promise.all([api('GET', '/api/catalog'), api('GET', '/api/progress')]);
  S.catalog = cat; S.progress = prog.subjects; S.authError = ''; S.view = 'home'; render();
}
async function boot() {
  try { await afterAuth(await api('GET', '/api/me')); }
  catch (e) {
    if (e.status === 401) { S.view = 'auth'; S.user = null; render(); }
    else { S.view = 'error'; S.error = e.message; render(); }
  }
}

async function openSubject(sid) {
  S.sid = sid; S.open = {}; S.resetArmed = false; S.removeArmed = false;
  S.view = P(sid).attempts.length ? 'roadmap' : 'intro'; render();
}
async function startQuiz(scope) {
  if (S.busy) return; S.busy = true; render(false);
  try {
    const r = await api('POST', '/api/quiz/start', { subjectId: S.sid, scope });
    if (!S.enrolled.includes(S.sid)) S.enrolled.push(S.sid);
    S.quiz = { sid: S.sid, scope, items: r.items, idx: 0, answers: [] }; S.view = 'quiz';
  } catch (e) { toast(e.message); }
  S.busy = false; render();
}
async function finishQuiz() {
  const qz = S.quiz; if (S.busy) return; S.busy = true; render(false);
  try {
    const answers = qz.items.map((it, i) => ({ qid: it.qid, chosen: it.options[qz.answers[i]] }));
    const r = await api('POST', '/api/quiz/submit', { subjectId: qz.sid, scope: qz.scope, answers });
    await reloadProgress();
    S.last = { sid: qz.sid, scope: qz.scope, topics: r.topics, previous: r.previous };
    S.quiz = null; S.open = {}; S.view = 'results';
  } catch (e) { toast(e.message); }
  S.busy = false; render();
}
function pick(i) {
  const qz = S.quiz; if (!qz || S.view !== 'quiz') return;
  if (i >= qz.items[qz.idx].options.length) return;
  qz.answers[qz.idx] = i; render(false);
}
function focusEl(sel) { const el = $app.querySelector(sel); if (el) el.focus({ preventScroll: true }); }

document.addEventListener('click', async e => {
  const b = e.target.closest('[data-action]');
  if (!b || b.tagName === 'SELECT' || b.type === 'checkbox') return;
  const a = b.dataset.action;
  if (a === 'authmode') { S.authMode = b.dataset.mode; S.authError = ''; render(false); }
  else if (a === 'home') { if (!S.user) return; S.view = 'home'; S.quiz = null; S.authError = ''; render(); }
  else if (a === 'profile') { S.authError = ''; S.view = 'profile'; render(); }
  else if (a === 'logout') {
    try { await api('POST', '/api/logout'); } catch (err) { /* ignore */ }
    S.user = null; S.enrolled = []; S.progress = {}; S.catalog = null; S.view = 'auth'; S.authMode = 'login'; S.authError = ''; render();
  }
  else if (a === 'retry') { S.view = 'loading'; render(false); boot(); }
  else if (a === 'open') openSubject(b.dataset.s);
  else if (a === 'add') {
    try { const r = await api('POST', '/api/enroll', { subjectId: b.dataset.s }); S.enrolled = r.enrolled; openSubject(b.dataset.s); }
    catch (err) { toast(err.message); }
  }
  else if (a === 'start') startQuiz(b.dataset.scope);
  else if (a === 'pick') pick(Number(b.dataset.i));
  else if (a === 'next') {
    const qz = S.quiz; if (!qz || qz.answers[qz.idx] == null) return;
    if (qz.idx === qz.items.length - 1) finishQuiz(); else { qz.idx++; render(false); window.scrollTo(0, 0); }
  }
  else if (a === 'prev') { if (S.quiz && S.quiz.idx > 0) { S.quiz.idx--; render(false); } }
  else if (a === 'roadmap') { S.view = 'roadmap'; S.open = {}; render(); }
  else if (a === 'toggle') {
    const t = b.dataset.t, cur = b.getAttribute('aria-expanded') === 'true';
    S.open[t] = !cur; render(false); focusEl('[data-action="toggle"][data-t="' + t + '"]');
  }
  else if (a === 'studied') {
    const t = b.dataset.t, pr = P(S.sid), now = !pr.studied[t];
    if (now) pr.studied[t] = true; else delete pr.studied[t];
    S.progress[S.sid] = pr; render(false); focusEl('[data-action="studied"][data-t="' + t + '"]');
    try { await api('POST', '/api/studied', { subjectId: S.sid, topicId: t, studied: now }); if (now) toast('Marked as studied. Re-test to update your path.'); }
    catch (err) { if (now) delete pr.studied[t]; else pr.studied[t] = true; render(false); toast(err.message); }
  }
  else if (a === 'copy') copyText(planText(S.sid));
  else if (a === 'print') { try { window.print(); } catch (err) { toast('Printing is not available. Use Copy plan instead.'); } }
  else if (a === 'reset') {
    if (!S.resetArmed) { S.resetArmed = true; S.removeArmed = false; render(false); return; }
    try { await api('DELETE', '/api/progress/' + S.sid); delete S.progress[S.sid]; S.resetArmed = false; S.view = 'intro'; render(); toast('Progress reset.'); }
    catch (err) { toast(err.message); }
  }
  else if (a === 'remove') {
    if (!S.removeArmed) { S.removeArmed = true; S.resetArmed = false; render(false); return; }
    try { const r = await api('DELETE', '/api/enroll/' + S.sid); S.enrolled = r.enrolled; S.removeArmed = false; S.view = 'home'; render(); toast('Subject removed. Your results are kept if you add it again.'); }
    catch (err) { toast(err.message); }
  }
});

document.addEventListener('change', async e => {
  const t = e.target;
  if (t.matches('[data-action="showall"]')) { S.showAll = t.checked; render(false); focusEl('[data-action="showall"]'); }
  else if (t.matches('[data-action="pace"]')) {
    const old = S.user.minutes; S.user.minutes = Number(t.value); render(false);
    try { await api('PUT', '/api/profile', { minutes: S.user.minutes }); }
    catch (err) { S.user.minutes = old; render(false); toast(err.message); }
  }
});

document.addEventListener('submit', async e => {
  e.preventDefault();
  const form = e.target, kind = form.dataset.form; if (!kind || S.busy) return;
  const fd = Object.fromEntries(new FormData(form).entries());
  S.busy = true; S.authError = '';
  if (kind !== 'profile') S.draft = { name: fd.name || S.draft.name || '', email: fd.email || '', grade: fd.grade || S.draft.grade || '' };
  try {
    if (kind === 'register' || kind === 'login') {
      if (kind === 'register' && !fd.grade) throw new Error('Please choose your class.');
      const data = await api('POST', kind === 'register' ? '/api/register' : '/api/login', fd);
      S.draft = {};
      await afterAuth(data);
      if (kind === 'register') toast('Account created. Welcome to Waypoint!');
    } else if (kind === 'profile') {
      const r = await api('PUT', '/api/profile', { name: fd.name, grade: Number(fd.grade) });
      S.user = r.user; S.catalog = await api('GET', '/api/catalog'); S.view = 'home'; render(); toast('Profile saved.');
    }
  } catch (err) {
    S.authError = err.message;
    if (S.view === 'auth' || S.view === 'profile') render(false);
    else toast(err.message);
  }
  S.busy = false;
  if (S.view === 'auth' || S.view === 'profile') render(false);
});

document.addEventListener('keydown', e => {
  if (S.view !== 'quiz' || e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key >= '1' && e.key <= '4') pick(Number(e.key) - 1);
});

function copyText(text) {
  const fallback = () => {
    const ta = document.createElement('textarea'); ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand('copy'); } catch (e) { /* ignore */ }
    document.body.removeChild(ta); toast(ok ? 'Plan copied.' : 'Could not copy. Select the text manually.');
  };
  try { navigator.clipboard.writeText(text).then(() => toast('Plan copied.'), fallback); } catch (e) { fallback(); }
}

boot();
