import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

/** Remove headers that block embedding in iframes. */
function stripFrameBlockingHeaders(proxy) {
  proxy.on('proxyRes', (proxyRes) => {
    for (const key of Object.keys(proxyRes.headers)) {
      const lower = key.toLowerCase();
      if (lower === 'x-frame-options' || lower === 'content-security-policy') {
        delete proxyRes.headers[key];
      }
    }
  });
}

const proxyConfig = (target) => ({
  '/ups-proxy': {
    target,
    changeOrigin: true,
    secure: false,
    rewrite: (path) => path.replace(/^\/ups-proxy/, '') || '/',
    configure: stripFrameBlockingHeaders,
  },
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const upsTarget = env.VITE_UPS_TARGET || 'http://192.168.163.160';

  return {
    plugins: [react()],
    server: {
      proxy: proxyConfig(upsTarget),
    },
    preview: {
      proxy: proxyConfig(upsTarget),
    },
  };
});
