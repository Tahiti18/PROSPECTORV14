
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    plugins: [react()],
    define: {
      // This allows process.env.API_KEY to work in the browser.
      // We prioritize the loaded env var, then fallback to system process.env, then the provided key.
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY || '2f30b2e5cdf012a40e82f10d7c30cb7f'),
    },
    server: {
      host: '0.0.0.0',
      port: process.env.PORT ? parseInt(process.env.PORT) : 5173,
      strictPort: true,
    },
    preview: {
      host: '0.0.0.0',
      port: process.env.PORT ? parseInt(process.env.PORT) : 4173,
      strictPort: true,
      allowedHosts: true, // Allows any host, fixing the Railway "Blocked request" error
    }
  };
});
