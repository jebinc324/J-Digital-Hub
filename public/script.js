(() => {
  const root = document.documentElement;
  const themeButton = document.getElementById('theme-switch');
  const savedTheme = localStorage.getItem('jdh-theme');
  if (savedTheme === 'light') root.classList.add('light');
  function setThemeLabel() {
    if (!themeButton) return;
    themeButton.setAttribute('aria-label', root.classList.contains('light') ? 'Switch to dark theme' : 'Switch to light theme');
  }
  setThemeLabel();
  themeButton?.addEventListener('click', () => {
    root.classList.toggle('light');
    localStorage.setItem('jdh-theme', root.classList.contains('light') ? 'light' : 'dark');
    setThemeLabel();
  });

  const menuButton = document.querySelector('.mobile-menu');
  const links = document.getElementById('nav-links');
  menuButton?.addEventListener('click', () => {
    const isOpen = links.classList.toggle('open');
    menuButton.setAttribute('aria-expanded', String(isOpen));
  });
  links?.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    links.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
  }));

  document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
    const filter = button.dataset.filter;
    document.querySelectorAll('[data-filter]').forEach(chip => {
      const active = chip === button;
      chip.classList.toggle('active', active);
      chip.setAttribute('aria-pressed', String(active));
    });
    document.querySelectorAll('.app-card[data-category]').forEach(card => {
      card.hidden = filter !== 'all' && card.dataset.category !== filter;
    });
  }));
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
