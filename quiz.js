/* LabShift — Python quiz for students waiting for a station.
   No framework. Renders from a QUESTIONS array so more can be added later.
   Saves last score locally (not sensitive). */
(function () {
  const KEY_SCORE = 'labshift_last_quiz_score';

  const QUESTIONS = [
    {
      q: "What does this print? print(3 + 2 * 2)",
      opts: ["10", "7", "12", "Error"],
      answer: 1,
      explain: "Python performs multiplication before addition: 2*2 = 4, then 3 + 4 = 7."
    },
    {
      q: "Which keyword starts a loop that repeats a fixed number of times in Python?",
      opts: ["while", "for", "loop", "repeat"],
      answer: 1,
      explain: "`for` iterates over a sequence a set number of times. `while` loops until a condition becomes false."
    },
    {
      q: "What will len('code') return?",
      opts: ["3", "4", "5", "Error"],
      answer: 1,
      explain: "`len` counts characters. 'code' has 4 characters: c, o, d, e."
    },
    {
      q: "Which symbol starts a comment in Python?",
      opts: ["//", "#", "<!--", "*"],
      answer: 1,
      explain: "Python comments begin with #. Everything after # on that line is ignored."
    }
  ];

  function render() {
    const area = document.getElementById('quizArea');
    if (!area) return;

    area.innerHTML = QUESTIONS.map(function (item, i) {
      return '<div class="quiz-q">' +
        '<p class="q">' + (i + 1) + '. ' + escapeHTML(item.q) + '</p>' +
        '<div class="opts">' +
          item.opts.map(function (o, j) {
            return '<label><input type="radio" name="q' + i + '" value="' + j + '"> ' +
              escapeHTML(o) + '</label>';
          }).join('') +
        '</div>' +
        '<div class="quiz-explain" id="explain-' + i + '" hidden></div>' +
        '</div>';
    }).join('');

    const result = document.getElementById('quizResult');
    if (result) result.textContent = '';

    const live = document.getElementById('quizLive');
    if (live) {
      const saved = Storage.get(KEY_SCORE, null);
      if (saved && typeof saved.score === 'number' && typeof saved.total === 'number') {
        live.textContent = 'Last score: ' + saved.score + ' / ' + saved.total +
          (saved.at ? ' (' + formatDateTime(saved.at) + ')' : '');
        live.className = 'live';
      } else {
        live.textContent = '';
        live.className = 'live';
      }
    }
  }

  function encourage(score, total) {
    const ratio = total ? score / total : 0;
    if (ratio === 1) return 'Perfect score. Excellent work.';
    if (ratio >= 0.75) return 'Strong result. Keep practising.';
    if (ratio >= 0.5) return 'Good start. Review the explanations below and try again.';
    if (ratio > 0) return 'Keep going. Read each explanation, then try again.';
    return 'No correct answers yet — read the explanations and give it another go.';
  }

  function check() {
    let score = 0;
    let unanswered = 0;

    QUESTIONS.forEach(function (item, i) {
      const chosen = document.querySelector('input[name="q' + i + '"]:checked');
      const box = document.getElementById('explain-' + i);
      if (!box) return;

      box.hidden = false;
      box.classList.remove('correct', 'wrong', 'unanswered');

      if (!chosen) {
        unanswered++;
        box.classList.add('unanswered');
        box.textContent = 'Not answered. Correct answer: "' +
          item.opts[item.answer] + '". ' + item.explain;
        return;
      }

      const val = parseInt(chosen.value, 10);
      if (val === item.answer) {
        score++;
        box.classList.add('correct');
        box.textContent = 'Correct. ' + item.explain;
      } else {
        box.classList.add('wrong');
        box.textContent = 'Not quite. Correct answer: "' +
          item.opts[item.answer] + '". ' + item.explain;
      }
    });

    const total = QUESTIONS.length;
    const resultEl = document.getElementById('quizResult');
    if (resultEl) {
      resultEl.textContent = 'Score: ' + score + ' / ' + total +
        (unanswered ? ' — ' + unanswered + ' unanswered' : '') +
        '. ' + encourage(score, total);
    }

    Storage.set(KEY_SCORE, { score: score, total: total, at: new Date().toISOString() });
  }

  function retry() {
    render();
    const firstInput = document.querySelector('#quizArea input[type="radio"]');
    if (firstInput) firstInput.focus();
  }

  function init() {
    render();
    const checkBtn = document.getElementById('checkQuiz');
    const retryBtn = document.getElementById('retryQuiz');
    if (checkBtn) checkBtn.addEventListener('click', check);
    if (retryBtn) retryBtn.addEventListener('click', retry);
  }

  window.LabShiftQuiz = { init: init, QUESTIONS: QUESTIONS };
})();