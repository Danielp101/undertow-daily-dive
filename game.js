(() => {
  'use strict';

  const BEST_KEY = 'undertow.solo.best.v1';
  const PREVIEW_SECONDS = 3;
  const ANSWER_SECONDS = 25;
  const tiers = [
    {name:'Plankton', points:10, color:'#a5b7be'},
    {name:'Too Clever', points:15, color:'#e6cc92'},
    {name:'Schooler', points:30, color:'#8cdbbe'},
    {name:'Rare', points:60, color:'#77c6f2'},
    {name:'Deep Cut', points:85, color:'#c4a5f0'},
    {name:'One in a Krillion', points:100, color:'#ffa48d'}
  ];
  window.diveTiers = tiers;
  const formatDate = value => new Date(value + 'T12:00:00Z').toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC'
  });
  let run = null;
  let cancelDescent = () => {};
  function depthScene(from, to, points) {
    const canvas = game().querySelector('.dive-ocean canvas');
    const counter = game().querySelector('.ocean-counter');
    const scoreText = game().querySelector('.score-count');
    const colour = tiers.find(t => t.points === points)?.color || '#abbfc8';
    if (!canvas) return;
    cancelDescent = window.renderDescent(canvas, from, to, points, colour, (depth, progress) => {
      counter.textContent = depth.toLocaleString() + ' m';
      if (scoreText) scoreText.textContent = '+' + Math.round(points * progress);
    });
  }
  const ocean = '<div class="dive-ocean" aria-hidden="true"><canvas></canvas><span class="ocean-counter"></span></div>';
  let clock;
  let deadline;
  let previousSecond;

  const game = () => document.getElementById('game');
  const esc = text => String(text).replace(/[&<>"']/g, ch => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[ch]));
  const normalized = value => String(value).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
    .replace(/&/g, ' and ').trim().replace(/^(the|a|an)\s+/, '').replace(/[^\p{L}\p{N}]/gu, '');

  function shuffled(items, random) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function dayRandom(date) {
    let seed = date.getFullYear() * 10000 + (date.getMonth() + 1) * 100 + date.getDate();
    return () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 4294967296;
    };
  }

  function getBest() {
    try {
      const raw = localStorage.getItem(BEST_KEY);
      const score = Number(raw);
      return raw !== null && Number.isInteger(score) && score >= 0 && score <= 700 ? score : null;
    } catch { return null; }
  }

  function stop() {
    clearInterval(clock);
    cancelDescent();
    run = null;
  }

  function home() {
    stop();
    window.showHome();
  }

  function round() { return run.questions[run.results.length]; }
  function total() { return run.results.reduce((sum, answer) => sum + answer.score, 0); }
  function tier(points) { return tiers.find(row => points === row.points)?.name || 'Miss'; }

  function frame(contents, position) {
    cancelDescent();
    const parts = run.questions.map((_, i) => {
      const state = i < run.results.length ? 'done' : i === position ? 'active' : '';
      return '<span class="' + state + '"></span>';
    }).join('');
    game().innerHTML = '<div class="dive-wrap"><div class="dive-top"><span>' +
      esc(run.title) + '</span><button type="button" class="dive-leave">Back to menu</button></div>' +
      '<div class="dive-marks" aria-hidden="true">' + parts + '</div>' + contents + '</div>';
    game().querySelector('.dive-leave').onclick = home;
  }

  function focusHeading() { game().querySelector('[tabindex="-1"]')?.focus({preventScroll:true}); }

  function everySecond(seconds, update, finish) {
    clearInterval(clock);
    deadline = Date.now() + seconds * 1000;
    previousSecond = seconds;
    update(seconds);
    clock = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      if (remaining === previousSecond) return;
      previousSecond = remaining;
      if (remaining === 0) {
        clearInterval(clock);
        finish();
      } else update(remaining);
    }, 100);
  }

  function question() {
    run.phase = 'preview';
    const index = run.results.length;
    const q = round();
    frame('<div class="dive-card"><div class="dive-meta"><span>Question ' + (index + 1) + ' / ' + run.questions.length +
      '</span><span>' + total() + ' pts</span></div>' + ocean + '<div class="dive-category">' + esc([q.category, formatDate(q.date)].filter(Boolean).join(' · ')) +
      '</div><h2 class="dive-title" tabindex="-1">' + esc(q.prompt) + '</h2>' +
      '<div class="dive-actions"><p class="dive-ready">Get ready <strong id="dive-seconds"></strong></p></div></div>', index);
    focusHeading();
    depthScene(total()*10,total()*10,0);
    everySecond(PREVIEW_SECONDS, seconds => { game().querySelector('#dive-seconds').textContent = seconds; }, openInput);
  }

  function openInput() {
    run.phase = 'answer';
    const area = game().querySelector('.dive-actions');
    area.innerHTML = '<form class="dive-form"><div class="dive-input-head"><label for="dive-input">Your answer</label>' +
      '<span role="timer" id="dive-timer"></span></div><div class="dive-input-row"><input id="dive-input" maxlength="120" autocomplete="off" autocapitalize="off" spellcheck="false" required placeholder="Type an answer…">' +
      '<button class="dive-primary" type="submit">Lock in <span aria-hidden="true">↵</span></button></div></form>' +
      '<div class="dive-under"><small>Your entry locks in when time runs out.</small><button class="dive-skip" type="button">Skip</button></div>';
    const input = area.querySelector('input');
    const timer = area.querySelector('#dive-timer');
    area.querySelector('form').onsubmit = event => {
      event.preventDefault();
      if (input.value.trim()) grade(input.value.trim(), 'answer');
    };
    area.querySelector('.dive-skip').onclick = () => grade('', 'skip');
    input.focus({preventScroll:true});
    everySecond(ANSWER_SECONDS, seconds => {
      timer.textContent = seconds + 's';
      timer.classList.toggle('urgent', seconds <= 5);
    }, () => grade(input.value.trim(), 'timeout'));
  }

  function grade(input, how) {
    if (!run || run.phase !== 'answer') return;
    clearInterval(clock);
    run.phase = 'review';
    const q = round();
    const key = normalized(input);
    const hit = key && q.answers.find(([name, , aliases = []]) =>
      [name, ...aliases].some(alias => normalized(alias) === key));
    const score = hit ? hit[1] : 0;
    const answer = hit ? hit[0] : input;
    run.results.push({prompt:q.prompt, answer, score});
    const example = [...q.answers].filter(row => row !== hit).sort((a,b) => b[1]-a[1])[0];
    const reason = hit ? tier(score) + ' answer' : !input ? (how === 'skip' ? 'Question skipped' : 'Time ran out') : 'Outside the answer list';
    const sub = example ? '<p class="dive-example"><strong>' + (hit ? 'Another answer' : 'One possible answer') + '</strong> ' +
      esc(example[0]) + ' <span>· ' + example[1] + ' pts</span></p>' : '';
    const source = q.source && /^https:\/\//.test(q.source) ? '<p class="archive-source"><a target="_blank" rel="noopener noreferrer" href="' + esc(q.source) + '">Archived answer sheet</a></p>' : '';
    const last = run.results.length === run.questions.length;
    frame('<div class="dive-card"><div class="dive-meta"><span>Question ' + run.results.length + ' / ' + run.questions.length +
      '</span><span>' + total() + ' pts · ' + (total() * 10).toLocaleString() + ' m</span></div>' + ocean + '<div class="dive-category rarity-reveal">' + reason +
      '</div><h2 class="dive-title" tabindex="-1">' + esc(answer || 'No answer') + '</h2><div class="dive-score"><span class="score-count">+' + score + '</span>' +
      ' <small>pts</small></div>' + sub + '<button class="dive-primary dive-next" type="button">' +
      (last ? 'See dive results' : 'Next question') + '</button>' + source + '</div>', -1);
    focusHeading();
    depthScene((total()-score)*10,total()*10,score);
    game().querySelector('.dive-next').onclick = last ? summary : question;
  }

  function summary() {
    const score = total();
    const previous = getBest();
    const best = Math.max(previous ?? 0, score);
    try { localStorage.setItem(BEST_KEY, String(best)); } catch {}
    run.phase = 'complete';
    window.logDive?.({score, mode: run.mode, date: new Date().toISOString()});
    const rows = run.results.map(({prompt, answer, score}) =>
      '<li><div><strong>' + esc(answer || 'No answer') + '</strong><small>' + esc(prompt) + '</small></div><b>+' + score + '</b></li>').join('');
    frame('<div class="dive-card"><div class="dive-category">Dive complete</div><h2 tabindex="-1" class="dive-title">Back on deck.</h2>' +
      '<div class="dive-score">' + score + ' <small>/ ' + (run.questions.length * 100) + ' pts</small></div>' +
      '<p class="dive-best">Depth · ' + (score * 10).toLocaleString() + ' m<br>Personal best · ' + best + ' pts</p><button class="dive-primary dive-again" type="button">Play a new dive</button>' +
      '<details class="dive-review"><summary>Review your answers</summary><ol>' + rows + '</ol></details></div>', -1);
    focusHeading();
    game().querySelector('.dive-again').onclick = () => start('free');
  }

  function start(mode, selectedDate) {
    stop();
    const pool = window.BANK.filter(q => /^2026-\d{2}-\d{2}$/.test(q.date) && q.date < '2026-11-01');
    const days = new Map();
    for (const q of pool) {
      if (!days.has(q.date)) days.set(q.date, []);
      days.get(q.date).push(q);
    }
    const complete = [...days.values()].filter(group => group.length === 7);
    const day = new Date();
    const dayNumber = Math.floor(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate()) / 86400000);
    let questions;
    let title;
    if (mode === 'daily' && complete.length) {
      questions = complete.find(group => group[0].date === selectedDate) || complete[dayNumber % complete.length];
      title = 'Archive dive · ' + formatDate(questions[0].date);
    } else {
      const unique = [...new Map(pool.map(q => [q.prompt, q])).values()];
      questions = shuffled(unique, mode === 'daily' ? dayRandom(day) : Math.random).slice(0, 7);
      title = mode === 'daily' ? 'Daily archive mix' : 'Shuffled archive';
    }
    if (questions.length < 7) {
      window.alert('This archive needs seven questions to start a dive.');
      return;
    }
    run = {mode, questions, title, results:[], phase:'preview'};
    document.getElementById('home').hidden = true;
    game().hidden = false;
    question();
    game().scrollIntoView({block:'start', behavior:'instant'});
  }

  window.startDive = start;
  window.stopDive = stop;
  window.getDiveBest = getBest;
})();
