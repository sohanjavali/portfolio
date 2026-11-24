// Plays the fake "agent runs". Everything here is decoration: the content is
// already in the HTML, so the page works the same with JavaScript turned off.

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Reveal each line of a log at its data-at time (ms), and mark it finished at
// its data-done time. Lines with the same data-at start together, which is how
// the "parallel" agents work. Returns when the whole log will be finished.
function play(list) {
  let end = 0;
  for (const li of list.querySelectorAll('li')) {
    const at = Number(li.dataset.at || 0);
    const done = li.dataset.done ? Number(li.dataset.done) : null;
    li.classList.remove('on', 'done');
    setTimeout(() => li.classList.add('on'), at);
    if (done !== null) setTimeout(() => li.classList.add('done'), done);
    end = Math.max(end, at, done ?? 0);
  }
  return end;
}

// Show a log instantly, all lines finished (for reduced motion).
function showAll(list) {
  for (const li of list.querySelectorAll('li')) li.classList.add('on', 'done');
}

// Hero terminal runs once on load.
const lanes = document.querySelector('.lanes');
if (lanes) reduceMotion ? showAll(lanes) : play(lanes);

// Project rows: the first time one opens, run its log, then reveal the write-up.
// After that it opens instantly, so nobody has to sit through it twice.
for (const row of document.querySelectorAll('details.run')) {
  row.addEventListener('toggle', () => {
    if (!row.open || row.classList.contains('played')) return;

    if (reduceMotion) {
      row.classList.add('played');
      return;
    }

    row.classList.add('running');
    const total = play(row.querySelector('.log'));
    setTimeout(() => {
      row.classList.remove('running');
      row.classList.add('played');
    }, total + 350);
  });
}
