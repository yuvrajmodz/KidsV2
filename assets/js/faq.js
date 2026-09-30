/* ============================================================
   CODING KIDS — TIMS Institute | faq.js
   FAQ Accordion functionality
   ============================================================ */

(function () {
  'use strict';

  function initFAQ() {
    const items = document.querySelectorAll('.faq-item');
    if (!items.length) return;

    items.forEach((item, index) => {
      const question = item.querySelector('.faq-question');
      const answer   = item.querySelector('.faq-answer');
      if (!question || !answer) return;

      // ARIA setup
      const answerId   = `faq-answer-${index}`;
      const questionId = `faq-question-${index}`;
      question.setAttribute('id', questionId);
      question.setAttribute('aria-expanded', 'false');
      question.setAttribute('aria-controls', answerId);
      answer.setAttribute('id', answerId);
      answer.setAttribute('role', 'region');
      answer.setAttribute('aria-labelledby', questionId);

      question.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');

        // Close all others
        items.forEach(other => {
          if (other !== item) {
            other.classList.remove('open');
            other.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
            other.querySelector('.faq-answer').classList.remove('open');
          }
        });

        // Toggle current
        item.classList.toggle('open', !isOpen);
        question.setAttribute('aria-expanded', String(!isOpen));
        answer.classList.toggle('open', !isOpen);
      });

      // Keyboard navigation
      question.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          const next = items[index + 1];
          if (next) next.querySelector('.faq-question').focus();
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          const prev = items[index - 1];
          if (prev) prev.querySelector('.faq-question').focus();
        } else if (e.key === 'Home') {
          e.preventDefault();
          items[0].querySelector('.faq-question').focus();
        } else if (e.key === 'End') {
          e.preventDefault();
          items[items.length - 1].querySelector('.faq-question').focus();
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', initFAQ);
})();
