const files = import.meta.glob('../../images/logos/*.{svg,png,jpg,jpeg,webp}', {
  eager: true,
  query: '?url',
  import: 'default',
});

const logoUrls = Object.fromEntries(Object.entries(files).map(([path, url]) => [path.split('/').pop(), url]));

export function resolveLogo(name) {
  return (name && logoUrls[name]) || null;
}
