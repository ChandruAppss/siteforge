/* Tiny script for the legal pages: fills in the contact address from
   js/content.js and stamps the copyright year. */
(function () {
  'use strict';

  const C = window.SITEFORGE_CONTENT || {};
  const contact = C.contact || {};

  document.querySelectorAll('[data-mailto]').forEach((el) => {
    const addr = contact[el.dataset.mailto];
    if (!addr) return;
    el.href = `mailto:${addr}`;
    if (el.dataset.mailtoText !== 'keep') el.textContent = addr;
  });

  const year = document.querySelector('#year');
  if (year) year.textContent = new Date().getFullYear();
})();
