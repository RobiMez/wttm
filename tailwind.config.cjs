/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	daisyui: {
		themes: [
			{
				mytheme: {
					primary: '#101828',
					secondary: '#667085',
					accent: '#44403c',
					neutral: '#1C2630',
					info: '#354f52',
					success: '#344e41',
					warning: '#f6bd60',
					error: '#bc4749',
					'base-100': '#ffffff',
					'base-200': '#f6f6f6',
					'--rounded-box': '1.6rem',
					'--rounded-btn': '0.6rem',
					'--rounded-badge': '1.9rem',
					'--animation-btn': '0.25s',
					'--animation-input': '0.2s',
					'--btn-text-case': 'uppercase',
					'--btn-focus-scale': '1',
					'--border-btn': '1px'
				}
			}
		]
	},
	theme: {
		fontFamily: {
			sans: ['Lexend', 'sans-serif']
		},
		extend: {
			colors: {
				brand: '#DDC4FF',
				brands: '#667085'
			}
		}
	},
	plugins: [require('daisyui')]
};
