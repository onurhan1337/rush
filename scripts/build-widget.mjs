// Bundles the storefront widget (src/widget) into public/rush.js.
// Usage: node scripts/build-widget.mjs [--watch] [--dev]
import { execSync } from 'node:child_process';
import * as esbuild from 'esbuild';

const watch = process.argv.includes('--watch');
const dev = process.argv.includes('--dev') || watch;

function release() {
  if (process.env.RUSH_RELEASE) return process.env.RUSH_RELEASE;
  if (process.env.VERCEL_GIT_COMMIT_SHA) return process.env.VERCEL_GIT_COMMIT_SHA.slice(0, 7);
  try {
    return execSync('git rev-parse --short HEAD', { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
  } catch {
    return '';
  }
}

const options = {
  entryPoints: ['src/widget/index.ts'],
  bundle: true,
  minify: !dev,
  format: 'iife',
  target: 'es2018',
  outfile: 'public/rush.js',
  define: {
    // Public key: only allowed to send vitals and storefront events.
    __KANCA_PUBLIC_KEY__: JSON.stringify(process.env.NEXT_PUBLIC_KANCA_PUBLIC_KEY ?? ''),
    __KANCA_ENDPOINT__: JSON.stringify(process.env.NEXT_PUBLIC_KANCA_ENDPOINT ?? ''),
    __RUSH_RELEASE__: JSON.stringify(release()),
  },
};

if (watch) {
  const context = await esbuild.context(options);
  await context.watch();
} else {
  await esbuild.build(options);
}
