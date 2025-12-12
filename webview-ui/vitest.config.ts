import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		environment: 'happy-dom',
		globals: true,
		setupFiles: ['./src/test/setup.ts'],
		coverage: {
			provider: 'v8',
			reporter: ['text', 'html', 'lcov'],
			include: ['src/**/*.ts', 'src/**/*.tsx'],
			exclude: [
				'src/test/**',
				'src/**/*.test.ts',
				'src/**/*.test.tsx',
			],
		},
	},
});
