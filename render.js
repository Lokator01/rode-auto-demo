import { privacyPage, consentPage } from './legal.js?v=897f95dd6966';

export const escapeHtml = (value) =>
  String(value ?? '').replace(
    /[&<>"']/g,
    (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]
  );
export const money = (value) => new Intl.NumberFormat('ru-RU').format(value) + ' ₽';
const e = escapeHtml;
const external = 'target="_blank" rel="noopener noreferrer"';
const chevron = (direction) =>
  '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="' +
  (direction === 'left' ? 'M14 6l-6 6 6 6' : 'M10 6l6 6-6 6') +
  '" stroke="currentColor" stroke-width="1.4"/rode-auto-demo/></svg>';
export function filterCars(cars, brand = '', budget = '') {
  return cars.filter((car) => (!brand || car.brand === brand) && (!budget || car.priceRub <= Number(budget)));
}
export function header(company, pathname) {
  const links = [
    ['/rode-auto-demo/cars', 'Каталог'],
    ['/rode-auto-demo/services', 'Сервис'],
    ['/rode-auto-demo/about', 'О компании'],
    ['/rode-auto-demo/contacts', 'Контакты']
  ];
  return `<a class="skip-link" href="#main">К содержимому</a><header class="site-header wrap">
    <a class="brand" href="/rode-auto-demo/" aria-label="RODE AUTO — главная"><img src="${company.logo}" alt="" width="58" height="58"><span>RODE AUTO<small>Автомобили. Сервис. Забота.</small></span></a>
    <nav class="desktop-nav" aria-label="Основная навигация">${links.map(([url, label]) => `<a href="${url}" ${pathname.startsWith(url) ? 'aria-current="page"' : ''}>${label}</a>`).join('')}</nav>
    <a class="header-phone" href="${company.phoneHref}">${e(company.phone)}<span>${e(company.hours)}</span></a>
    <button class="menu-toggle" aria-expanded="false" aria-controls="mobile-nav" aria-label="Открыть меню"><span></span><span></span></button></header>
    <nav class="mobile-nav" id="mobile-nav" aria-label="Мобильная навигация" hidden>${links.map(([url, label]) => `<a href="${url}">${label}</a>`).join('')}<a href="${company.phoneHref}">${e(company.phone)}</a></nav>`;
}
export function heroCopy(data, index = 0, expanded = false) {
  const car = data.cars[index];
  const [brand, ...rest] = car.name.split(' ');
  return `<p class="eyebrow">Выбор, который чувствуешь.</p><h1><span class="car-make ${brand.length > 8 ? 'long-make' : ''}">${e(brand)}</span><span class="car-model ${rest.join(' ').length > 12 ? 'long-model' : ''}">${e(rest.join(' '))}</span></h1>
    ${
      expanded
        ? `${car.presentation ? `<p class="hero-intro">${e(car.presentation.intro)}</p>` : ''}<ul class="hero-features">${car.features.map((feature) => `<li>${e(feature)}</li>`).join('')}</ul>${car.presentation ? `<details class="hero-description"><summary>Подробнее об автомобиле<span aria-hidden="true">+</span></summary><p>${e(car.presentation.description)}</p><p class="specification-note">${e(car.presentation.specificationNote)}</p></details>` : ''}`
        : '<p class="hero-tagline">Ваш автомобиль.<br>Наше имя.</p>'
    }
    <p class="hero-price">${money(car.priceRub)}</p><p class="availability">${e(car.status)}</p>
    <div class="hero-actions"><button class="button button-gold" data-enquire="${car.id}">Заказать звонок</button>
    <a class="button button-outline hero-gallery" href="/rode-auto-demo/cars/${car.slug}"><span>Фотографии и описание</span><span class="photo-count">${car.photos.length} фото</span></a></div>
    ${index === 0 ? '' : `<button class="hero-details text-button" data-hero-expand aria-expanded="${expanded}">${expanded ? (index === 0 ? 'Накрыть и вернуться' : 'Скрыть комплектацию') : index === 0 ? 'Открыть автомобиль' : 'Комплектация'}</button>`}`;
}
export function heroContent(data, selected = 0, expanded = false) {
  const car = data.cars[selected];
  const is3d = selected === 0;
  return `<div class="hero-topline"><span>Омск, Енисейская, 18</span><a href="/rode-auto-demo/services"><i></i> Собственный сервис</a><span class="hero-edition">RODE COLLECTION / ${String(selected + 1).padStart(2, '0')}</span></div>
    <div class="hero-stage ${expanded ? 'is-expanded' : ''}"><div class="hero-visual">
      ${is3d ? `<div class="scene-shell"><div id="car-scene" class="car-scene" role="region" aria-label="3D-презентация BMW X1. После открытия вращайте автомобиль мышью, пальцем или стрелками." tabindex="0"><div class="scene-loading" role="status">Готовим свет и автомобиль…</div></div><div class="scene-toolbar"><span id="scene-status" role="status">Знакомство с BMW X1</span></div><p class="scene-disclaimer">3D-презентация · Реальный экземпляр — на фотографиях.</p></div>` : `<div class="photo-frame"><img class="hero-photo" src="${car.photos[0]}" alt="${e(car.name)} — автомобиль из каталога" width="1100" height="825" fetchpriority="high"></div><p class="photo-caption">Реальная фотография · ${e(car.name)}</p>`}
    </div><div class="hero-copy" aria-live="polite" aria-atomic="true">${heroCopy(data, selected, expanded)}</div></div>
    <div class="car-selector"><div class="selector-heading"><span>Выберите<br>свой автомобиль</span><div class="selector-arrows"><button data-hero-step="-1" aria-label="Предыдущий автомобиль">${chevron('left')}</button><button data-hero-step="1" aria-label="Следующий автомобиль">${chevron('right')}</button></div></div>
      <div class="selector-track" role="group" aria-label="Выбор автомобиля">${data.cars.map((item, index) => `<button class="selector-item ${index === selected ? 'is-active' : ''}" data-hero-index="${index}" aria-pressed="${index === selected}" aria-label="Показать ${e(item.name)}"><img src="${item.photos[0]}" alt="" width="96" height="72" loading="lazy"><span>${e(item.name)}<small>${money(item.priceRub)}</small></span><span class="selector-index">${String(index + 1).padStart(2, '0')}</span></button>`).join('')}</div></div>`;
}
export function carCard(car) {
  return `<article class="car-card"><div class="card-gallery" data-card-id="${car.id}" tabindex="0" role="group" aria-label="Фотографии ${e(car.name)}">
    <img data-mini-image src="${car.photos[0]}" alt="${e(car.name)} — фото 1 из 5" width="1100" height="825" loading="lazy">
    <button class="mini-arrow mini-prev" data-mini-step="-1" aria-label="Предыдущее фото ${e(car.name)}">${chevron('left')}</button><button class="mini-arrow mini-next" data-mini-step="1" aria-label="Следующее фото ${e(car.name)}">${chevron('right')}</button>
    <span class="mini-counter" aria-live="polite">01 / 05</span><div class="mini-dots">${car.photos.map((photo, index) => `<button data-mini-index="${index}" aria-label="${e(car.name)}: фото ${index + 1}" aria-pressed="${index === 0}"></button>`).join('')}</div></div>
    <div class="card-body"><p class="card-category">RODE COLLECTION</p><h3><a href="/rode-auto-demo/cars/${car.slug}">${e(car.name)}</a></h3><p class="card-status">${e(car.status)}</p><div class="card-bottom"><span class="card-price">${car.oldPriceRub ? `<del>${money(car.oldPriceRub)}</del>` : ''}${money(car.priceRub)}</span><a class="card-link" href="/rode-auto-demo/cars/${car.slug}">Подробнее</a></div><button class="card-enquire" data-enquire="${car.id}">Заказать звонок</button></div></article>`;
}
export function leadForm(data, interestId = '', location = 'footer') {
  const prefix = 'lead-' + location;
  const selected = [...data.cars, ...data.services].find((item) => item.id === interestId);
  return `<form class="lead-form" data-lead-form data-form-location="${location}"><p class="preview-note">Демоверсия для просмотра. Заявки не принимаются и не отправляются.</p><fieldset disabled style="display:contents">
    <div class="form-grid"><label for="${prefix}-name">Ваше имя<input id="${prefix}-name" name="name" autocomplete="given-name" placeholder="Как к вам обращаться" required minlength="2" maxlength="80"></label>
    <label for="${prefix}-phone">Телефон<input id="${prefix}-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="+7 (___) ___-__-__" required maxlength="25"></label>
    <label for="${prefix}-interest">Что вас интересует<select id="${prefix}-interest" name="interest"><option value="">Подбор автомобиля / консультация</option><optgroup label="Автомобили">${data.cars.map((car) => `<option value="${car.id}" ${car.id === interestId ? 'selected' : ''}>${e(car.name)}</option>`).join('')}</optgroup><optgroup label="Сервис">${data.services.map((service) => `<option value="${service.id}" ${service.id === interestId ? 'selected' : ''}>${e(service.name)}</option>`).join('')}</optgroup></select></label>
    <label for="${prefix}-budget">Ваш бюджет <span>необязательно</span><select id="${prefix}-budget" name="budget"><option value="">Выберите диапазон</option>${['До 1,8 млн ₽', '1,8–2,3 млн ₽', '2,3–3 млн ₽', 'Более 3 млн ₽', 'Нужна помощь с бюджетом'].map((value) => `<option>${value}</option>`).join('')}</select></label>
    <label class="form-wide" for="${prefix}-comment">Комментарий <span>необязательно</span><textarea id="${prefix}-comment" name="comment" maxlength="1000" rows="2" placeholder="Пожелания к автомобилю или удобное время для звонка"></textarea></label></div>
    <p class="selected-interest" data-interest-summary>${selected ? e(selected.name) + ' · ' + money(selected.priceRub) : 'Поможем определиться с выбором.'}</p>
    <div class="form-honey" aria-hidden="true"><label>Ваш сайт<input name="website" tabindex="-1" autocomplete="off"></label></div>
    <label class="consent-label"><input type="checkbox" name="consent" required><span>Даю <a href="/rode-auto-demo/consent" target="_blank" rel="noopener">отдельное согласие на обработку данных заявки</a>.</span></label><p class="preview-note"><a href="/rode-auto-demo/privacy" target="_blank" rel="noopener">Информация о конфиденциальности</a>. Локальную форму проверяйте только на вымышленных контактах.</p>
    <div class="form-submit-row"><button type="submit" class="button button-gold">Заказать звонок</button><span>Мы свяжемся с вами<br>по указанному номеру</span></div>
    <p class="form-status" role="status" aria-live="polite"></p><p class="preview-note">Демоверсия для просмотра. Заявки не принимаются и не отправляются.</p></fieldset></form>`;
}
function leadSection(data, context) {
  return `<section class="lead-section" id="request"><div class="wrap lead-layout"><div><p class="eyebrow">Следующий шаг — ваш.</p><h2>НАЙДЁМ<br><span>ВАШ АВТОМОБИЛЬ.</span></h2><p>Оставьте заявку. Обсудим ваш выбор,<br>бюджет и пожелания.</p><a class="lead-phone" href="${data.company.phoneHref}">${e(data.company.phone)}</a><p class="phone-caption">Если удобнее — позвоните сами</p></div>${leadForm(data, context)}</div></section>`;
}
export function servicesSection(data, full = false) {
  return `<section class="services-section"><div class="wrap"><div class="section-heading"><div><p class="eyebrow">Свой сервис в Омске</p><h2>ЗАБОТА В КАЖДОЙ ДЕТАЛИ.</h2></div><p>Продолжаем ваш автомобильный путь<br>на Енисейской, 18.</p></div><div class="services-grid">${data.services.map((service, index) => `<article class="service-card" id="${service.slug}"><div class="service-photo"><img src="${service.photo}" alt="${e(service.name)} — иллюстрация услуги" width="1100" height="730" loading="lazy"><span>0${index + 1}</span></div><div class="service-body"><p class="service-price">от ${money(service.priceRub)}</p><h3>${e(service.name)}</h3><p>${e(service.presentation?.description || service.summary)}</p>${full && service.presentation ? `<ul class="service-items">${service.presentation.items.map((item) => `<li>${e(item)}</li>`).join('')}</ul>` : ''}<button class="text-button" data-enquire="${service.id}">Записаться в сервис</button>${full ? `<a class="service-source" href="${service.sourceUrl}" ${external}>Карточка VK</a>` : ''}</div></article>`).join('')}</div>${full ? '<p class="service-note">Итоговую стоимость согласуем после уточнения объёма работ.</p>' : '<a class="underlined-link" href="/rode-auto-demo/services">Подробнее о сервисе</a>'}</div></section>`;
}
function contacts(data, full = false) {
  const company = data.company;
  const tag = full ? 'h1' : 'h2';
  return `<section class="contact-section ${full ? 'contact-full' : ''}"><div class="wrap contact-grid"><div><p class="eyebrow">RODE AUTO / Контакты</p><${tag}>ВСТРЕТИМСЯ<br>В ОМСКЕ.</${tag}><p>Выбор автомобиля, сервис и забота —<br>по одному адресу.</p></div><div class="contact-address"><h3>Енисейская, 18</h3><p>${e(company.hours)}</p><a class="contact-phone" href="${company.phoneHref}">${e(company.phone)}</a><a href="mailto:${company.email}">${e(company.email)}</a><div class="contact-links"><a class="underlined-link" href="https://yandex.ru/maps/?text=${encodeURIComponent(company.address)}" ${external}>Открыть на карте</a><a class="underlined-link" href="${company.vkUrl}" ${external}>ВКонтакте</a></div></div></div></section>`;
}
function home(data) {
  return `<section class="hero wrap" id="hero" aria-label="Автомобиль первого экрана">${heroContent(data)}</section><div class="directions-strip"><div class="wrap"><span>Подбор и привоз</span><span>Собственный сервис</span><span>Детейлинг и уход</span><span>Запчасти и аксессуары</span></div></div>
    <section class="catalog-section"><div class="wrap"><div class="section-heading"><div><p class="eyebrow">Ваш выбор начинается здесь</p><h2>АВТОМОБИЛИ С ХАРАКТЕРОМ.</h2></div><a class="underlined-link" href="/rode-auto-demo/cars">Весь каталог / 10</a></div><div class="cars-grid">${[data.cars[0], data.cars[6], data.cars[8]].map(carCard).join('')}</div></div></section>
    <section class="about-preview"><div class="wrap about-layout"><div><p class="eyebrow">Философия RODE AUTO</p><h2>ВАШ АВТОМОБИЛЬ.<br><span>НАШЕ ИМЯ.</span></h2></div><div><p class="large-copy">От первого выбора до привычного маршрута — рядом.</p><p>Подбираем и привозим автомобили из Китая, Японии, Кореи, ОАЭ и других стран. Помогаем с обслуживанием и дальнейшим уходом.</p><a class="underlined-link" href="/rode-auto-demo/about">Знакомство с компанией</a></div></div></section>${servicesSection(data)}`;
}
function catalog(data) {
  return `<section class="page-title wrap"><p class="eyebrow">RODE COLLECTION / 10 автомобилей</p><h1>КАТАЛОГ АВТОМОБИЛЕЙ.</h1><p>Ваш автомобиль начинается с выбора. Собственный сервис — рядом.</p></section><section class="catalog-section catalog-page"><div class="wrap"><form class="catalog-filters" id="catalog-filters"><label for="filter-brand">Марка<select id="filter-brand" name="brand"><option value="">Все марки</option>${[
    ...new Set(data.cars.map((car) => car.brand))
  ]
    .sort()
    .map((brand) => `<option value="${brand}">${brand}</option>`)
    .join(
      ''
    )}</select></label><label for="filter-budget">Бюджет<select id="filter-budget" name="budget"><option value="">Любая цена</option><option value="1800000">До 1 800 000 ₽</option><option value="2200000">До 2 200 000 ₽</option><option value="3000000">До 3 000 000 ₽</option></select></label><button type="reset" class="reset-filters">Сбросить</button><p id="result-count" role="status">Автомобилей: 10</p></fieldset></form><div class="cars-grid" id="catalog-results">${data.cars.map(carCard).join('')}</div><p class="catalog-disclaimer">Актуальную цену, наличие и условия приобретения уточняйте при обращении.</p></div></section>`;
}
function carPage(car) {
  return `<section class="car-page"><div class="wrap"><a class="breadcrumb" href="/rode-auto-demo/cars">Каталог / ${e(car.name)}</a><div class="car-detail-grid"><div class="gallery"><button class="main-photo-button" data-zoom aria-label="Увеличить фото ${e(car.name)}"><img id="gallery-main" src="${car.photos[0]}" alt="${e(car.name)} — фото 1 из 5" width="1100" height="825"><span>Увеличить</span></button><div class="gallery-thumbs" role="group" aria-label="Фотографии ${e(car.name)}">${car.photos.map((photo, index) => `<button data-gallery-index="${index}" aria-pressed="${index === 0}" aria-label="Фото ${index + 1} из 5"><img src="${photo}" alt="" width="110" height="83" loading="lazy"></button>`).join('')}</div></div><div class="car-detail-copy"><p class="eyebrow">RODE COLLECTION / ${e(car.brand)}</p><h1>${e(car.name)}</h1><p class="detail-status">${e(car.status)}</p><div class="detail-price">${car.oldPriceRub ? `<del>${money(car.oldPriceRub)}</del>` : ''}${money(car.priceRub)}</div><p class="price-note">Актуальную стоимость и условия уточняйте при обращении.</p><button class="button button-gold" data-enquire="${car.id}">Заказать звонок</button>${car.presentation ? `<div class="car-description"><h2>Об автомобиле</h2><p>${e(car.presentation.description)}</p><p class="specification-note">${e(car.presentation.specificationNote)}</p></div>` : ''}<div class="equipment"><h2>Комплектация</h2>${car.mileageKm ? `<p>Пробег из карточки: ${new Intl.NumberFormat('ru-RU').format(car.mileageKm)} км</p>` : ''}<ul>${car.features.map((feature) => `<li>${e(feature)}</li>`).join('')}</ul></div><a class="underlined-link source-link" href="${car.sourceUrl}" ${external}>Исходная карточка во ВКонтакте</a></div></div><details class="source-description"><summary>Исходное описание автомобиля <span>+</span></summary><p class="source-note">Архивный текст предоставленной карточки. Условия, сроки и контакты требуют подтверждения перед покупкой.</p><p class="source-text">${e(car.descriptionSource)}</p></details></div></section>`;
}
function about(data) {
  const company = data.company;
  const copy = company.presentation;
  return `<section class="page-title wrap"><p class="eyebrow">О компании / Омск</p><h1>ВАШ АВТОМОБИЛЬ.<br><span>НАШЕ ИМЯ.</span></h1><p>От первого выбора до заботы о каждой детали.</p></section>
    <section class="about-page"><div class="wrap about-layout"><div class="about-identity"><div class="brand-portrait"><img src="${company.logo}" alt="Фирменный знак RODE AUTO" width="888" height="877"></div><div class="about-location"><span>Ждём вас в Омске</span><strong>Енисейская, 18</strong><span>${e(company.hours)}</span></div></div><div><p class="eyebrow">Знакомство с RODE AUTO</p><h2>РЯДОМ НА ВАШЕМ ПУТИ.</h2><p class="large-copy">Автомобиль выбирают надолго.<br>Забота о нём тоже продолжается.</p><p>${e(copy.intro)}</p><p>${e(copy.sourcing)}</p><a class="button button-outline" href="/rode-auto-demo/contacts">Приехать познакомиться</a></div></div></section>
    <section class="company-directions"><div class="wrap"><p class="eyebrow">Что мы делаем</p><h2>ОДНО МЕСТО. БОЛЬШЕ ВОЗМОЖНОСТЕЙ.</h2><div class="company-card-grid">${copy.directions.map((item, index) => `<article><span class="company-number">0${index + 1}</span><h3>${e(item.title)}</h3><p>${e(item.text)}</p><a class="underlined-link" href="${index === 0 ? '/rode-auto-demo/cars' : index === 1 ? '/rode-auto-demo/services' : '/rode-auto-demo/contacts'}">${index === 0 ? 'Выбрать автомобиль' : index === 1 ? 'Посмотреть услуги' : 'Уточнить детали'}</a></article>`).join('')}</div></div></section>
    <section class="company-process wrap"><p class="eyebrow">Как начать</p><h2>С ПРОСТОГО РАЗГОВОРА.</h2><div class="company-card-grid">${copy.steps.map((item, index) => `<article><span class="company-number">0${index + 1}</span><h3>${e(item.title)}</h3><p>${e(item.text)}</p></article>`).join('')}</div><div class="company-contact"><p>Обсудим ваш автомобиль или запись в сервис.</p><a href="${company.phoneHref}">${e(company.phone)}</a></div></section>`;
}
export function footer(company) {
  return `<footer class="site-footer"><div class="wrap"><div class="footer-top"><a class="footer-wordmark" href="/rode-auto-demo/">RODE AUTO</a><nav aria-label="Навигация в подвале"><a href="/rode-auto-demo/cars">Каталог</a><a href="/rode-auto-demo/services">Сервис</a><a href="/rode-auto-demo/about">О компании</a><a href="/rode-auto-demo/contacts">Контакты</a></nav><a href="${company.vkUrl}" ${external}>ВКонтакте</a></div><div class="footer-bottom"><span>© 2026 RODE AUTO</span><span>${e(company.legalName)} · ИНН ${e(company.inn)}</span><a href="/rode-auto-demo/privacy">Обработка данных</a><a href="/rode-auto-demo/credits">Материалы сайта</a><span>Омск, Енисейская, 18</span></div></div></footer>`;
}
export function renderRoute(pathname, data) {
  if (pathname === '/rode-auto-demo/') pathname = '/rode-auto-demo';
  pathname = pathname.replace(/\/+$/, "") || "/rode-auto-demo/";
  let body;
  let title;
  const car = data.cars.find((item) => pathname === '/rode-auto-demo/cars/' + item.slug);
  if (pathname === '/rode-auto-demo') {
    body = home(data);
    title = 'RODE AUTO — Ваш автомобиль. Наше имя. | Омск';
  } else if (pathname === '/rode-auto-demo/cars') {
    body = catalog(data);
    title = 'Каталог автомобилей — RODE AUTO';
  } else if (car) {
    body = carPage(car);
    title = car.name + ' — ' + money(car.priceRub) + ' | RODE AUTO';
  } else if (pathname === '/rode-auto-demo/services') {
    body = `<section class="page-title wrap"><p class="eyebrow">Собственный сервис / Омск</p><h1>СЕРВИС, КОТОРЫЙ РЯДОМ.</h1><p>Техническое обслуживание, ремонт и забота о вашем автомобиле.</p></section>${servicesSection(data, true)}`;
    title = 'Услуги сервиса — RODE AUTO';
  } else if (pathname === '/rode-auto-demo/about') {
    body = about(data);
    title = 'О компании — RODE AUTO';
  } else if (pathname === '/rode-auto-demo/contacts') {
    body = contacts(data, true);
    title = 'Контакты — RODE AUTO | Омск, Енисейская, 18';
  } else if (pathname === '/rode-auto-demo/credits') {
    body =
      '<section class="legal-page wrap"><p class="eyebrow">RODE AUTO</p><h1>Материалы сайта</h1><h2>3D-презентация BMW X1</h2><p>Использована модель «<a href="https://sketchfab.com/3d-models/bmw-x1-4fe53c88cd9442b4ac0496b6926b0fe2" target="_blank" rel="noopener noreferrer">BMW X1</a>», автор <a href="https://sketchfab.com/SLBofficial" target="_blank" rel="noopener noreferrer">Sloftm_Carz</a>, по лицензии <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a>. Изменения: белый кузов, оптимизация геометрии для сайта и студийная постановка. Полотно и анимация подготовлены для RODE AUTO.</p><p>3D служит презентацией. Реальный автомобиль и его состояние показаны на фотографиях каталога.</p><a class="underlined-link" href="/rode-auto-demo/">Вернуться на сайт</a></section>';
    title = 'Материалы сайта — RODE AUTO';
  } else if (pathname === '/rode-auto-demo/privacy') {
    body = privacyPage(data.company, e);
    title = 'Персональные данные — RODE AUTO';
  } else if (pathname === '/rode-auto-demo/consent') {
    body = consentPage(data.company, e);
    title = 'Отдельное согласие — RODE AUTO';
  } else {
    body =
      '<section class="page-title wrap not-found"><p class="eyebrow">404</p><h1>ЗДЕСЬ ПОКА НЕТ ДОРОГИ.</h1><a class="button button-gold" href="/rode-auto-demo/cars">Вернуться в каталог</a></section>';
    title = 'Страница не найдена — RODE AUTO';
  }
  return {
    html:
      header(data.company, pathname) +
      `<main id="main" tabindex="-1">${body}${!['/rode-auto-demo/privacy', '/rode-auto-demo/consent', '/rode-auto-demo/credits'].includes(pathname) ? leadSection(data, car?.id) : ''}</main>` +
      footer(data.company),
    title,
    light: false
  };
}
export function introLoader(company) {
  return `<div class="intro-loader" id="intro-loader" aria-label="Подготовка сайта"><div class="intro-loader-brand"><img src="${company.logo}" alt="RODE AUTO" width="190" height="190"></div><p>Автомобили. Сервис. Забота.</p><div class="intro-progress" role="progressbar" aria-label="Загрузка презентации" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span></span></div><span class="intro-loader-status" role="status">Готовим вашу презентацию</span><a href="/rode-auto-demo/cars">Перейти в каталог</a></div>`;
}
export function renderDocument(pathname, data) {
  const route = renderRoute(pathname, data);
  return `<!doctype html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="dark"><meta name="robots" content="noindex, nofollow"><meta name="description" content="RODE AUTO в Омске: автомобили, подбор и собственный сервис. Енисейская, 18."><meta name="theme-color" content="#071711"><title>${e(route.title)}</title><link rel="icon" href="/rode-auto-demo/assets/rode-auto-logo.png"><link rel="stylesheet" href="/rode-auto-demo/style.css?v=897f95dd6966">${pathname === '/rode-auto-demo/' ? '<link rel="modulepreload" href="/rode-auto-demo/scene.js?v=897f95dd6966">' : ''}<script type="importmap">{"imports":{"three":"/rode-auto-demo/vendor/three/build/three.module.js","three/addons/":"/rode-auto-demo/vendor/three/examples/jsm/"}}</script><script type="module" src="/rode-auto-demo/app.js?v=897f95dd6966"></script></head><body>${pathname === '/rode-auto-demo/' ? introLoader(data.company) : ''}<div id="app">${route.html}</div><dialog id="contact-dialog" class="contact-dialog" aria-labelledby="dialog-title"></dialog><dialog id="photo-dialog" class="photo-dialog" aria-label="Увеличенное фото автомобиля"></dialog><noscript><style>.intro-loader{display:none!important}</style><p class="noscript-note">Каталог, цены и контакты доступны без JavaScript. Для работы 3D, галерей и формы включите JavaScript.</p></noscript></body></html>`;
}
