import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import { resolveSeoState } from './metadata';

function ensureMeta(selector, attributes) {
  let node = document.head.querySelector(selector);
  if (!node) {
    node = document.createElement('meta');
    node.dataset.tripsplitSeo = 'true';
    document.head.appendChild(node);
  }
  Object.entries(attributes).forEach(([name, value]) => node.setAttribute(name, value));
  return node;
}

function setMeta(attribute, name, content) {
  const selector = `meta[${attribute}="${name}"]`;
  if (!content) {
    document.head.querySelector(selector)?.remove();
    return;
  }
  ensureMeta(selector, { [attribute]: name, content });
}

function setCanonical(url) {
  let node = document.head.querySelector('link[rel="canonical"]');
  if (!url) {
    node?.remove();
    return;
  }
  if (!node) {
    node = document.createElement('link');
    node.rel = 'canonical';
    node.dataset.tripsplitSeo = 'true';
    document.head.appendChild(node);
  }
  node.href = url;
}

function setStructuredData(data) {
  document.head.querySelector('script[data-tripsplit-seo="structured-data"]')?.remove();
  if (!data) return;
  const node = document.createElement('script');
  node.type = 'application/ld+json';
  node.dataset.tripsplitSeo = 'structured-data';
  node.textContent = JSON.stringify(data).replace(/</g, '\\u003c');
  document.head.appendChild(node);
}

export default function SeoHead() {
  const { i18n } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    const state = resolveSeoState(location.pathname, i18n.resolvedLanguage || i18n.language);
    document.title = state.title;
    setMeta('name', 'description', state.description);
    setMeta('name', 'robots', state.robots);
    setMeta('property', 'og:title', state.title);
    setMeta('property', 'og:description', state.description);
    setMeta('property', 'og:type', state.type);
    setMeta('property', 'og:site_name', 'TripSplit - قطتنا');
    setMeta('property', 'og:locale', state.locale === 'ar' ? 'ar_SA' : 'en_US');
    setMeta('property', 'og:url', state.canonical);
    setMeta('property', 'og:image', state.image);
    setMeta('name', 'twitter:card', 'summary');
    setMeta('name', 'twitter:title', state.title);
    setMeta('name', 'twitter:description', state.description);
    setMeta('name', 'twitter:image', state.image);
    setCanonical(state.canonical);
    setStructuredData(state.structuredData);
  }, [i18n.language, i18n.resolvedLanguage, location.pathname]);

  return null;
}
