import { defineConfig } from 'tsup'
import { sassPlugin } from 'esbuild-sass-plugin'

export default defineConfig({
  entry: ['src/index.ts', 'src/styles/normalize.scss'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  outDir: 'dist',
  splitting: true,
  treeshake: true,
  external: ['react', 'react-dom'],
  esbuildPlugins: [sassPlugin({ type: 'css' }) as any],
})