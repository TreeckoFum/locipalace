import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [], // Añadir dominios externos si se usan fotos de Unsplash/S3
  },
};

export default withNextIntl(nextConfig);
