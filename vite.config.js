import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Static PWA. base './' keeps asset paths relative so the built app can be
// dropped into any folder (e.g. AirDropped to an iPad) and opened directly.
export default defineConfig({
  base: './',
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
})
