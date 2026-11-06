// Only embedded J Arcade uses the optional J&J visual skin.
if (new URLSearchParams(location.search).get('embed') === '1') {
  document.documentElement.classList.add('jj-in-page-arcade');
}
