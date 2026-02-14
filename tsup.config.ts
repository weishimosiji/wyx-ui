import { defineConfig } from 'tsup'
import { sassPlugin } from 'esbuild-sass-plugin'

export default defineConfig({
  entry: ['src/index.ts', 'src/core.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  outDir: 'dist',
  splitting: false,
  treeshake: true,
  external: ['react', 'react-dom'],
  esbuildPlugins: [sassPlugin({ type: 'css' }) as any],
})
