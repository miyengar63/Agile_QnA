// ═══════════════════════════════════════════
// GLOBAL STATE
// ═══════════════════════════════════════════
let searchTimer = null;
let matchList   = []; // { card, el }
let matchIndex  = -1;

// ═══════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  reNumber();

  document.querySelectorAll('.qc').forEach(card => {
    const qt = card.querySelector('.qt');
    const qb = card.querySelector('.qb');
    if (qt) qt.dataset.original = qt.innerHTML;
    if (qb) qb.dataset.original = qb.innerHTML;
  });
});

// ═══════════════════════════════════════════
// AUTO NUMBERING
// ═══════════════════════════════════════════
function reNumber() {
  const cards = document.querySelectorAll('.qc');

  cards.forEach((c, i) => {
    const badge = c.querySelector('.qn');
    if (badge) badge.textContent = 'Q' + (i + 1);
  });

  const total = cards.length;
  const top    = document.getElementById('totalCount');
  const bottom = document.getElementById('footerCount');
  if (top)    top.textContent    = total;
  if (bottom) bottom.textContent = total;
}

// ═══════════════════════════════════════════
// CARD TOGGLE
// ═══════════════════════════════════════════
function tog(el) {
  el.closest('.qc')?.classList.toggle('open');
}

// ═══════════════════════════════════════════
// SECTION TOGGLE
// ═══════════════════════════════════════════
function toggleSection(header) {
  const isCollapsed = header.classList.contains('collapsed');

  document.querySelectorAll('.sd').forEach(h => {
    h.classList.add('collapsed');
    h.nextElementSibling?.classList.add('collapsed');
  });

  if (isCollapsed) {
    header.classList.remove('collapsed');
    header.nextElementSibling?.classList.remove('collapsed');
  }
}

// ═══════════════════════════════════════════
// EXPAND / COLLAPSE ALL
// ═══════════════════════════════════════════
function toggleAll() {
  const btn    = document.getElementById('toggleAll');
  const expand = btn.dataset.state !== 'expanded';

  document.querySelectorAll('.sd').forEach(h => {
    h.classList.toggle('collapsed', !expand);
    h.nextElementSibling?.classList.toggle('collapsed', !expand);
  });

  document.querySelectorAll('.qc').forEach(c => {
    c.classList.toggle('open', expand);
  });

  btn.dataset.state = expand ? 'expanded' : 'collapsed';
  btn.textContent   = expand ? 'Collapse All' : 'Expand All';

  if (expand) {
    setTimeout(() => {
      const first = document.querySelector('.sd');
      if (first) {
        const y = first.getBoundingClientRect().top + window.pageYOffset - 80;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    }, 100);
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// ═══════════════════════════════════════════
// SEARCH — DEBOUNCE
// ═══════════════════════════════════════════
function filterQ(val) {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => doFilter(val), 200);
}

// ═══════════════════════════════════════════
// RESET CARD
// ═══════════════════════════════════════════
function resetCard(card) {
  const qt = card.querySelector('.qt');
  const qb = card.querySelector('.qb');
  if (qt && qt.dataset.original) qt.innerHTML = qt.dataset.original;
  if (qb && qb.dataset.original) qb.innerHTML = qb.dataset.original;
}

// ═══════════════════════════════════════════
// HIGHLIGHT (TRACK EACH MATCH)
// ═══════════════════════════════════════════
function highlight(container, query, card) {
  if (!container || !query) return;

  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');

  function walk(node) {
    if (node.nodeType === 3) {
      if (!regex.test(node.nodeValue)) return;
      regex.lastIndex = 0;

      const span = document.createElement('span');
      span.innerHTML = node.nodeValue.replace(regex, '<mark class="hl">$1</mark>');

      const nodes = Array.from(span.childNodes);

      nodes.forEach(n => {
  if (n.nodeType === 1 && n.tagName === 'MARK') {

    // 🔥 prevent duplicate push
    if (!n.dataset.added) {
      matchList.push({ card, el: n });
      n.dataset.added = '1';
    }

  }
});

      node.replaceWith(...nodes);

    } else if (
      node.nodeType === 1 &&
      node.childNodes &&
      !['SCRIPT', 'STYLE', 'MARK'].includes(node.tagName)
    ) {
      Array.from(node.childNodes).forEach(walk);
    }
  }

  walk(container);
}

// ═══════════════════════════════════════════
// SEARCH CORE
// ═══════════════════════════════════════════
function doFilter(val) {
  const query   = val.trim().toLowerCase();
  const counter = document.getElementById('searchCount');
  const sw      = document.querySelector('.sw');

  sw?.classList.toggle('has-value', query.length > 0);

  matchList  = [];
  matchIndex = -1;

  document.querySelectorAll('.qc').forEach(card => {
    card.classList.remove('hidden', 'open', 'active-match');
    resetCard(card);
  });

  if (!query) {
    if (counter) counter.textContent = '';

    document.querySelectorAll('.sd').forEach(h => {
      h.classList.add('collapsed');
      h.nextElementSibling?.classList.add('collapsed');
    });

    setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 50);
    return;
  }

  document.querySelectorAll('.qc').forEach(card => {
    const qtText = card.querySelector('.qt')?.textContent.toLowerCase() || '';
    const qbText = card.querySelector('.qb')?.textContent.toLowerCase() || '';
    const match  = qtText.includes(query) || qbText.includes(query);

    card.classList.toggle('hidden', !match);

    if (match) {
      card.classList.add('open');

      highlight(card.querySelector('.qt'), query, card);
      highlight(card.querySelector('.qb'), query, card);
    }
  });

  document.querySelectorAll('.sd').forEach(header => {
    const body = header.nextElementSibling;
    if (!body) return;

    const hasMatch = Array.from(body.querySelectorAll('.qc'))
      .some(c => !c.classList.contains('hidden'));

    header.classList.toggle('collapsed', !hasMatch);
    body.classList.toggle('collapsed', !hasMatch);
  });

  if (matchList.length) {
    matchIndex = 0;
    navigateTo(matchIndex);
  }

  if (counter) {
    counter.textContent = matchList.length
      ? `${matchIndex + 1} / ${matchList.length}`
      : 'No results';
  }
}

// ═══════════════════════════════════════════
// NAVIGATE (SCROLL TO QUESTION)
// ═══════════════════════════════════════════
function navigateTo(index) {
  // remove active card highlight
  document.querySelectorAll('.qc').forEach(c => c.classList.remove('active-match'));

  // 🔥 remove previous current highlight
  document.querySelectorAll('mark.hl.current').forEach(m => m.classList.remove('current'));

  const match = matchList[index];
  if (!match) return;

  const card = match.card;
  card.classList.add('active-match', 'open');

  // 🔥 highlight ONLY current match
  if (match.el) {
    match.el.classList.add('current');
  }

  const header = card.querySelector('.qh') || card;

  const y = header.getBoundingClientRect().top + window.pageYOffset - 80;
  window.scrollTo({ top: y, behavior: 'smooth' });

  const counter = document.getElementById('searchCount');
  if (counter) counter.textContent = `${index + 1} / ${matchList.length}`;
}

// ═══════════════════════════════════════════
// NEXT / PREV
// ═══════════════════════════════════════════
function nextMatch() {
  if (!matchList.length) return;
  matchIndex = (matchIndex + 1) % matchList.length;
  navigateTo(matchIndex);
}

function prevMatch() {
  if (!matchList.length) return;
  matchIndex = (matchIndex - 1 + matchList.length) % matchList.length;
  navigateTo(matchIndex);
}

// ═══════════════════════════════════════════
// CLEAR SEARCH
// ═══════════════════════════════════════════
function clearSearch() {
  const input = document.getElementById('searchBox');
  if (input) input.value = '';
  doFilter('');

  setTimeout(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 50);
}

// ═══════════════════════════════════════════
// KEYBOARD CONTROL
// ═══════════════════════════════════════════
document.addEventListener('keydown', e => {
  const active = document.activeElement;

  if (active && active.id === 'searchBox') {

    // 🔥 DOWN
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      nextMatch();
    }

    // 🔥 UP
    else if (e.key === 'ArrowUp') {
      e.preventDefault();
      prevMatch();
    }

    // 🔥 ESC
    else if (e.key === 'Escape') {
      e.preventDefault();
      clearSearch();
    }
  }
});

// ═══════════════════════════════════════════
// MODAL
// ═══════════════════════════════════════════
function openModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.style.display = 'block';
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) {
    el.style.display = 'none';
    document.body.style.overflow = '';
  }
}

window.addEventListener('click', e => {
  document.querySelectorAll('.agile-modal').forEach(modal => {
    if (e.target === modal) {
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  });
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.agile-modal').forEach(modal => {
      modal.style.display = 'none';
    });
    document.body.style.overflow = '';
  }
});

// ═══════════════════════════════════════════
// SCROLL BUTTONS
// ═══════════════════════════════════════════
window.addEventListener('scroll', () => {
  const show   = window.scrollY > 100;
  const topBtn = document.getElementById('backToTop');
  const botBtn = document.getElementById('backToBottom');

  if (topBtn) topBtn.style.display = show ? 'block' : 'none';
  if (botBtn) botBtn.style.display = show ? 'block' : 'none';
});

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function scrollToBottom() {
  window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
}

// ═══════════════════════════════════════════
// SCROLL RESTORE OFF
// ═══════════════════════════════════════════
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

// ═══════════════════════════════════════════
// AUTO FOCUS SEARCH BOX
// ═══════════════════════════════════════════
function focusSearch() {
  const input = document.getElementById('searchBox');
  if (input) {
    input.focus();
  }
}

// Focus on page load
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(focusSearch, 100);
});

// Focus after clearing search
function clearSearch() {
  const input = document.getElementById('searchBox');
  if (input) input.value = '';
  doFilter('');

  setTimeout(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    focusSearch(); // 🔥 keep cursor back
  }, 50);
}

/*// OPTIONAL: keep focus always (like Ctrl+F feel)
document.addEventListener('click', (e) => {
  const input = document.getElementById('searchBox');

  // don't steal focus if user clicks inside input
  if (input && e.target !== input) {
    setTimeout(() => input.focus(), 0);
  }
});*/