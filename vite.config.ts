import devServer from '@hono/vite-dev-server';
import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite-plus';

export default defineConfig(({ mode }) => {
  // API (src/server/app.ts) は process.env から設定を読む
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''));

  return {
    lint: {
      ignorePatterns: ['dist/**', 'src/client/routeTree.gen.ts'],
      plugins: ['typescript', 'react', 'unicorn', 'oxc', 'import'],
      options: {
        typeAware: true,
        typeCheck: true,
      },
    },
    fmt: {
      singleQuote: true,
      printWidth: 120,
      ignorePatterns: ['src/client/routeTree.gen.ts', 'drizzle/**', 'pnpm-lock.yaml'],
    },
    resolve: {
      tsconfigPaths: true,
    },
    plugins: [
      tanstackRouter({
        target: 'react',
        autoCodeSplitting: true,
        routesDirectory: './src/client/routes',
        generatedRouteTree: './src/client/routeTree.gen.ts',
      }),
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      tailwindcss(),
      devServer({
        entry: 'src/server/app.ts',
        // /api だけを Hono で処理し、それ以外は Vite に任せる
        exclude: [/^(?!\/api(\/|$))/],
      }),
    ],
  };
});
