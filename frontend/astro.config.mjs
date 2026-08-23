// @ts-check
import { defineConfig } from 'astro/config';

// ALLOWED_HOSTS=true allows any host; or a comma-separated list, e.g.
// ALLOWED_HOSTS=test.weihanyau.qzz.io
const rawHosts = process.env.ALLOWED_HOSTS ?? '';
const allowedHosts =
	rawHosts.trim() === 'true' ? true : rawHosts.split(',').map((h) => h.trim()).filter(Boolean);

console.log(`[debug] ALLOWED_HOSTS env = "${rawHosts}" -> resolved:`, allowedHosts);

// https://astro.build/config
export default defineConfig({
	vite: {
		server: { allowedHosts },
		preview: { allowedHosts },
	},
});
