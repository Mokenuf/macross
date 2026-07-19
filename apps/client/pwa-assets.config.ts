import { defineConfig } from '@vite-pwa/assets-generator/config'

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    transparent: { sizes: [64, 192, 512], padding: 0, resizeOptions: { background: '#0c0b09' } },
    maskable: { sizes: [512], padding: 0, resizeOptions: { background: '#0c0b09' } },
    apple: { sizes: [180], padding: 0, resizeOptions: { background: '#0c0b09' } },
  },
  images: ['public/icons/source.svg'],
})
