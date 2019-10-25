for (let index = 1; index < 21; index++) {
  setTimeout(() => {
    const r = new XMLHttpRequest();
    r.open('GET', 'index.html');
    r.send();
  }, 100 * index);
}

