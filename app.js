import {
  renderRoute,
  heroContent,
  heroCopy,
  carCard,
  leadForm,
  filterCars,
  escapeHtml,
  money,
  introLoader
} from './render.js?v=1ac9d06219ac';
let loaderDismissTimer;
history.scrollRestoration = 'manual';
const data = await fetch('/rode-auto-demo/content/catalog.json')
  .then((response) => {
    if (!response.ok) throw new Error('Каталог недоступен');
    return response.json();
  })
  .catch((error) => {
    dismissLoader();
    throw error;
  });
const contactDialog = document.querySelector('#contact-dialog');
const photoDialog = document.querySelector('#photo-dialog');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let heroIndex = 0;
let heroExpanded = false;
let galleryIndex = 0;
let sceneController;
let sceneGeneration = 0;
let pointerStart;
// In-memory visit state: switching cars/routes keeps the reveal consumed; a new page load resets it.
let introStarted = false;
let bmwVisual;
let sceneElement;
let cancelFeatureTyping = () => {};
let cancelReadingScroll = () => {};
let visitorControlsScroll = false;
function takeScrollControl() {
  visitorControlsScroll = true;
  cancelReadingScroll();
}
window.addEventListener('touchstart', takeScrollControl, { passive: true });
window.addEventListener('wheel', takeScrollControl, { passive: true });
window.addEventListener('pointerdown', takeScrollControl, { passive: true });
window.addEventListener('keydown', (event) => {
  if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(event.key)) takeScrollControl();
});
function dismissLoader() {
  clearTimeout(loaderDismissTimer);
  document.documentElement.classList.remove('intro-loading');
  const app = document.querySelector('#app');
  if (app) app.inert = false;
  const loader = document.querySelector('#intro-loader');
  if (!loader) return;
  loader.classList.add('is-complete');
  loaderDismissTimer = setTimeout(
    () => loader.remove(),
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 450
  );
}
function showLoader() {
  clearTimeout(loaderDismissTimer);
  if (!document.querySelector('#intro-loader'))
    document.body.insertAdjacentHTML('beforeend', introLoader(data.company));
  document.querySelector('#intro-loader').classList.remove('is-complete');
  document.documentElement.classList.add('intro-loading');
  document.querySelector('#app').inert = true;
}
function loadingProgress(fraction) {
  const loader = document.querySelector('#intro-loader');
  if (!loader) return;
  const percent = Math.min(100, Math.round(fraction * 100));
  loader.style.setProperty('--progress', fraction);
  loader.querySelector('[role="progressbar"]').setAttribute('aria-valuenow', percent);
  loader.querySelector('.intro-loader-status').textContent =
    percent >= 92 ? 'Готовим свет и материалы' : 'Загружаем автомобиль · ' + percent + '%';
}

async function mountScene() {
  const generation = ++sceneGeneration;
  const element = document.querySelector('#car-scene');
  if (!element) {
    sceneController?.setActive(false);
    dismissLoader();
    return;
  }
  if (sceneController && element === sceneElement) {
    dismissLoader();
    sceneController.setActive(true);
    sceneController.openImmediately();
    return;
  }
  const playIntro = !introStarted;
  if (playIntro) showLoader();
  else dismissLoader();
  sceneController?.dispose();
  sceneController = null;
  try {
    const { createCarScene } = await import('./scene.js?v=1ac9d06219ac');
    if (generation !== sceneGeneration || !element.isConnected) return;
    const controller = await createCarScene(element, {
      opened: !playIntro,
      onProgress: loadingProgress,
      onRevealComplete: () => {
        if (generation !== sceneGeneration || !element.isConnected) return;
        if (!heroExpanded) expandHero(true, false, playIntro);
      }
    });
    if (generation !== sceneGeneration || !element.isConnected) controller.dispose();
    else {
      sceneController = controller;
      sceneElement = element;
      bmwVisual = element.closest('.hero-visual');
      introStarted = true;
      dismissLoader();
      setTimeout(
        () => {
          if (generation === sceneGeneration && element.isConnected) controller.startIntro();
        },
        reducedMotion.matches || !playIntro ? 0 : 450
      );
    }
  } catch (error) {
    if (element.isConnected) {
      element.innerHTML =
        '<img class="scene-error-photo" src="' +
        data.cars[0].photos[0] +
        '" alt="BMW X1 — фотография реального автомобиля">';
      const status = document.querySelector('#scene-status');
      if (status) status.textContent = '3D недоступно в этом браузере — показано фото';
      dismissLoader();
      console.warn('3D fallback:', error.message);
    }
  }
}
function navigate(url, push = true) {
  cancelReadingScroll();
  cancelFeatureTyping();
  dismissLoader();
  sceneGeneration++;
  sceneController?.setActive(false);
  const route = renderRoute(url.pathname, data);
  if (push) history.pushState({}, '', url.pathname);
  document.querySelector('#app').innerHTML = route.html;
  document.title = route.title;
  heroIndex = 0;
  heroExpanded = introStarted;
  const hero = document.querySelector('#hero');
  if (hero && introStarted) {
    hero.innerHTML = heroContent(data, 0, true);
    if (bmwVisual) hero.querySelector('.hero-visual').replaceWith(bmwVisual);
  }
  galleryIndex = 0;
  contactDialog.close();
  photoDialog.close();
  window.scrollTo({ top: 0, behavior: 'instant' });
  document.querySelector('#main').focus({ preventScroll: true });
  mountScene();
}
function selectCar(index) {
  cancelReadingScroll();
  cancelFeatureTyping();
  heroIndex = (index + data.cars.length) % data.cars.length;
  if (heroIndex === 0) heroExpanded = introStarted;
  const hero = document.querySelector('#hero');
  const scroll = hero.querySelector('.selector-track').scrollLeft;
  hero.innerHTML = heroContent(data, heroIndex, heroExpanded);
  if (heroIndex === 0 && bmwVisual) hero.querySelector('.hero-visual').replaceWith(bmwVisual);
  const track = hero.querySelector('.selector-track');
  track.scrollLeft = scroll;
  const active = track.querySelector('.is-active');
  const left = active.offsetLeft - track.offsetLeft;
  if (left < track.scrollLeft || left + active.offsetWidth > track.scrollLeft + track.clientWidth)
    track.scrollTo({ left, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  mountScene();
}
function expandHero(expanded = !heroExpanded, focus = true, typeFeatures = false) {
  cancelFeatureTyping();
  const stage = document.querySelector('.hero-stage');
  if (!stage) return;
  const panels = [stage.querySelector('.hero-visual'), stage.querySelector('.hero-copy')];
  for (const panel of panels) panel.getAnimations().forEach((animation) => animation.finish());
  const before = panels.map((panel) => panel.getBoundingClientRect());
  heroExpanded = expanded;
  stage.classList.toggle('is-expanded', heroExpanded);
  panels[1].innerHTML = heroCopy(data, heroIndex, heroExpanded);
  if (expanded && typeFeatures && !reducedMotion.matches) {
    const assisted = assistMobileReading(panels[1]);
    cancelFeatureTyping = typeHeroCopy(panels[1], assisted ? 1150 : 250);
  }
  if (expanded && typeFeatures && !reducedMotion.matches) {
    for (const block of panels[1].querySelectorAll('.hero-description'))
      block.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 900, easing: 'ease-out' });
  }
  if (!reducedMotion.matches)
    panels.forEach((panel, index) => {
      const after = panel.getBoundingClientRect();
      panel.animate(
        [
          {
            transform:
              'translate(' + (before[index].left - after.left) + 'px,' + (before[index].top - after.top) + 'px)'
          },
          { transform: 'translate(0,0)' }
        ],
        { duration: 1000, easing: 'cubic-bezier(.22,.75,.2,1)' }
      );
    });

  if (focus) stage.querySelector('[data-hero-expand]')?.focus({ preventScroll: true });
}

function assistMobileReading(copy) {
  if (!window.matchMedia('(max-width: 767px)').matches || visitorControlsScroll || reducedMotion.matches) return false;
  const heading = copy.querySelector('h1');
  const target = Math.max(0, window.scrollY + heading.getBoundingClientRect().top - 105);
  const from = window.scrollY;
  if (target <= from + 60) return false;
  let frame;
  let start;
  let cancelled = false;
  cancelReadingScroll = () => {
    cancelled = true;
    cancelAnimationFrame(frame);
  };
  function move(time) {
    if (cancelled || !copy.isConnected || reducedMotion.matches) return;
    start ??= time;
    const t = Math.min(1, (time - start) / 950);
    window.scrollTo({ top: from + (target - from) * (t * t * (3 - 2 * t)), behavior: 'instant' });
    if (t < 1) frame = requestAnimationFrame(move);
  }
  frame = requestAnimationFrame(move);
  return true;
}

function typeHeroCopy(copy, initialDelay = 250) {
  const items = [...copy.querySelectorAll('.hero-intro, .hero-features li')];
  if (!items.length) return () => {};
  const texts = items.map((item) => item.textContent);
  const callButton = copy.querySelector('.hero-actions [data-enquire]');
  let pulse;
  const stopPulse = () => {
    pulse?.cancel();
    callButton?.classList.remove('is-attention');
  };
  const spans = items.map((item, index) => {
    if (item.matches('li')) item.setAttribute('aria-label', texts[index]);
    item.classList.add('is-typing-pending', 'is-typewriter');
    const span = document.createElement('span');
    span.setAttribute('aria-hidden', 'true');
    // Hidden final text reserves each row's width and height throughout typing.
    const space = document.createElement('span');
    space.className = 'feature-typing-space';
    space.setAttribute('aria-hidden', 'true');
    space.textContent = texts[index];
    item.replaceChildren(space, span);
    if (item.matches('.hero-intro')) {
      const readable = document.createElement('span');
      readable.className = 'typewriter-readable';
      readable.textContent = texts[index];
      item.append(readable);
    }
    return span;
  });
  let frame;
  let start;
  function tick(time) {
    start ??= time;
    let elapsed = time - start - initialDelay;
    let complete = true;
    items.forEach((item, index) => {
      const speed = items[index].matches('.hero-intro') ? 25 : 38;
      const duration = texts[index].length * speed;
      const count = Math.max(0, Math.min(texts[index].length, Math.floor(elapsed / speed)));
      spans[index].textContent = texts[index].slice(0, count);
      item.classList.toggle('is-typing-pending', count === 0);
      item.classList.toggle('is-typing-active', count > 0 && count < texts[index].length);
      if (count < texts[index].length) complete = false;
      elapsed -= duration + 160;
    });
    if (!complete && copy.isConnected && !reducedMotion.matches) frame = requestAnimationFrame(tick);
    else finish(complete);
  }
  function finish(completed = false) {
    cancelAnimationFrame(frame);
    stopPulse();
    callButton?.removeEventListener('click', stopPulse);
    callButton?.removeEventListener('focus', stopPulse);
    callButton?.removeEventListener('pointerenter', stopPulse);
    items.forEach((item, index) => {
      item.classList.remove('is-typing-pending', 'is-typing-active', 'is-typewriter');
      item.textContent = texts[index];
    });
    if (completed && callButton && copy.isConnected && !reducedMotion.matches) {
      pulse = callButton.animate(
        [
          { backgroundColor: '#bfa174', boxShadow: '0 0 0 rgba(232,193,110,0)' },
          {
            backgroundColor: '#edc979',
            boxShadow: '0 0 20px rgba(232,193,110,.35)',
            offset: 0.5
          },
          { backgroundColor: '#bfa174', boxShadow: '0 0 0 rgba(232,193,110,0)' }
        ],
        { duration: 900, iterations: 2, easing: 'ease-in-out' }
      );
      callButton.classList.add('is-attention');
      pulse.onfinish = () => callButton.classList.remove('is-attention');
      callButton.addEventListener('click', stopPulse);
      callButton.addEventListener('focus', stopPulse);
      callButton.addEventListener('pointerenter', stopPulse);
    }
  }
  frame = requestAnimationFrame(tick);
  return () => finish(false);
}
reducedMotion.addEventListener('change', () => {
  if (reducedMotion.matches) cancelFeatureTyping();
});
function enquire(id, trigger) {
  const item = [...data.cars, ...data.services].find((entry) => entry.id === id);
  contactDialog.innerHTML =
    '<button class="dialog-close" data-close aria-label="Закрыть форму">×</button><p class="eyebrow">Обратный звонок</p><h2 id="dialog-title">' +
    escapeHtml(item?.name || 'Начнём с вашего выбора.') +
    '</h2><p class="dialog-intro">Оставьте номер — мы свяжемся с вами и ответим на вопросы.</p>' +
    leadForm(data, item?.id, 'modal');
  contactDialog.showModal();
  contactDialog.addEventListener('close', () => trigger?.focus(), { once: true });
}
function updateMini(gallery, index) {
  const car = data.cars.find((item) => item.id === gallery.dataset.cardId);
  const current = (index + car.photos.length) % car.photos.length;
  gallery.dataset.index = current;
  const image = gallery.querySelector('[data-mini-image]');
  image.src = car.photos[current];
  image.alt = car.name + ' — фото ' + (current + 1) + ' из 5';
  gallery.querySelector('.mini-counter').textContent = String(current + 1).padStart(2, '0') + ' / 05';
  gallery
    .querySelectorAll('[data-mini-index]')
    .forEach((button) => button.setAttribute('aria-pressed', String(Number(button.dataset.miniIndex) === current)));
}
function setGallery(index, focus = false) {
  const car = data.cars.find((item) => location.pathname === '/rode-auto-demo/cars/' + item.slug);
  if (!car) return;
  galleryIndex = (index + car.photos.length) % car.photos.length;
  const image = document.querySelector('#gallery-main');
  image.src = car.photos[galleryIndex];
  image.alt = car.name + ' — фото ' + (galleryIndex + 1) + ' из 5';
  document.querySelectorAll('[data-gallery-index]').forEach((button) => {
    const selected = Number(button.dataset.galleryIndex) === galleryIndex;
    button.setAttribute('aria-pressed', String(selected));
    if (selected && focus) button.focus();
  });
  if (photoDialog.open) openPhoto(false);
}
function openPhoto(show = true) {
  const image = document.querySelector('#gallery-main');
  photoDialog.innerHTML =
    '<button class="dialog-close" data-close aria-label="Закрыть фото">×</button><img src="' +
    image.src +
    '" alt="' +
    escapeHtml(image.alt) +
    '"><div class="zoom-controls"><button data-photo-step="-1" aria-label="Предыдущее фото">‹</button><span>' +
    (galleryIndex + 1) +
    ' / 5</span><button data-photo-step="1" aria-label="Следующее фото">›</button></div>';
  if (show) photoDialog.showModal();
}
function updateFilters() {
  const form = document.querySelector('#catalog-filters');
  if (!form) return;
  const values = new FormData(form);
  const cars = filterCars(data.cars, values.get('brand'), values.get('budget'));
  document.querySelector('#catalog-results').innerHTML = cars.length
    ? cars.map(carCard).join('')
    : '<div class="empty-state"><h2>ПОКА НЕТ СОВПАДЕНИЙ.</h2><p>Измените марку или бюджет, чтобы посмотреть другие автомобили.</p></div>';
  document.querySelector('#result-count').textContent = 'Автомобилей: ' + cars.length;
}
document.addEventListener('click', (event) => {
  const target = event.target.closest('button,a');
  if (!target) return;
  if (target.matches('[data-close]')) target.closest('dialog').close();
  else if (target.matches('[data-back-to-top]')) {
    takeScrollControl();
    window.scrollTo({ top: 0, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    document.querySelector('.brand')?.focus({ preventScroll: true });
  } else if (target.matches('.menu-toggle')) {
    const expanded = target.getAttribute('aria-expanded') !== 'true';
    target.setAttribute('aria-expanded', String(expanded));
    target.setAttribute('aria-label', expanded ? 'Закрыть меню' : 'Открыть меню');
    document.querySelector('#mobile-nav').hidden = !expanded;
  } else if (target.matches('[data-hero-expand]')) expandHero();
  else if (target.matches('[data-hero-index]')) {
    selectCar(Number(target.dataset.heroIndex));
    document.querySelector('[data-hero-index="' + heroIndex + '"]').focus({ preventScroll: true });
  } else if (target.matches('[data-hero-step]')) {
    const step = target.dataset.heroStep;
    selectCar(heroIndex + Number(step));
    document.querySelector('[data-hero-step="' + step + '"]').focus({ preventScroll: true });
  } else if (target.matches('[data-mini-step]')) {
    const gallery = target.closest('[data-card-id]');
    updateMini(gallery, Number(gallery.dataset.index || 0) + Number(target.dataset.miniStep));
  } else if (target.matches('[data-mini-index]'))
    updateMini(target.closest('[data-card-id]'), Number(target.dataset.miniIndex));
  else if (target.matches('[data-enquire]')) enquire(target.dataset.enquire, target);
  else if (target.matches('[data-gallery-index]')) setGallery(Number(target.dataset.galleryIndex));
  else if (target.matches('[data-zoom]')) openPhoto();
  else if (target.matches('[data-photo-step]')) {
    const step = target.dataset.photoStep;
    setGallery(galleryIndex + Number(step));
    photoDialog.querySelector('[data-photo-step="' + step + '"]').focus();
  } else if (
    target.matches('a') &&
    !event.ctrlKey &&
    !event.metaKey &&
    !event.shiftKey &&
    !event.altKey &&
    event.button === 0 &&
    !target.target &&
    !target.download
  ) {
    const url = new URL(target.href);
    if (url.origin === location.origin && !url.hash) {
      event.preventDefault();
      navigate(url);
    }
  }
});
document.addEventListener('keydown', (event) => {
  const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
  const mini = event.target.closest('[data-card-id]');
  if (step && mini) {
    event.preventDefault();
    updateMini(mini, Number(mini.dataset.index || 0) + step);
  } else if (step && event.target.closest('.selector-track')) {
    event.preventDefault();
    selectCar(heroIndex + step);
    document.querySelector('[data-hero-index="' + heroIndex + '"]').focus({ preventScroll: true });
  } else if (step && (event.target.closest('.gallery-thumbs') || photoDialog.open)) {
    event.preventDefault();
    setGallery(galleryIndex + step, !photoDialog.open);
  }
  if (event.key === 'Escape' && document.querySelector('#mobile-nav:not([hidden])')) {
    document.querySelector('#mobile-nav').hidden = true;
    const toggle = document.querySelector('.menu-toggle');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Открыть меню');
    toggle.focus();
  }
});
document.addEventListener('pointerdown', (event) => {
  const gallery = event.target.closest('[data-card-id]');
  if (gallery && event.pointerType === 'touch') pointerStart = { gallery, x: event.clientX, y: event.clientY };
});
document.addEventListener('pointerup', (event) => {
  if (!pointerStart) return;
  const dx = event.clientX - pointerStart.x;
  const dy = event.clientY - pointerStart.y;
  if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy) * 1.2)
    updateMini(pointerStart.gallery, Number(pointerStart.gallery.dataset.index || 0) + (dx < 0 ? 1 : -1));
  pointerStart = null;
});
document.addEventListener('pointercancel', () => {
  pointerStart = null;
});
document.addEventListener('change', (event) => {
  if (event.target.closest('#catalog-filters')) updateFilters();
  if (event.target.matches('[data-lead-form] select[name="interest"]')) {
    const item = [...data.cars, ...data.services].find((item) => item.id === event.target.value);
    event.target.closest('form').querySelector('[data-interest-summary]').textContent = item
      ? item.name + ' · ' + money(item.priceRub)
      : 'Поможем определиться с выбором.';
  }
});
document.addEventListener('reset', (event) => {
  if (event.target.id === 'catalog-filters') setTimeout(updateFilters, 0);
});
document.addEventListener('submit', async (event) => {
  if (event.target.id === 'catalog-filters') {
    event.preventDefault();
    return;
  }
  const form = event.target.closest('[data-lead-form]');
  if (!form) return;
  event.preventDefault();
  if (!form.reportValidity()) return;
  form.querySelector('.form-status').textContent = "Отправка заявки пока не подключена. Для связи позвоните по номеру в шапке сайта.";
});

for (const dialog of [contactDialog, photoDialog])
  dialog.addEventListener('click', (event) => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      dialog.close();
  });
window.addEventListener('popstate', () => navigate(new URL(location.href), false));
window.addEventListener('pageshow', (event) => {
  if (event.persisted && location.pathname === '/rode-auto-demo/') navigate(new URL(location.href), false);
});
if (document.querySelector('#car-scene') && !location.hash) window.scrollTo({ top: 0, behavior: 'instant' });
mountScene();
