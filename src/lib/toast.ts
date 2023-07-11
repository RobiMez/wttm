import { toast } from '@zerodevx/svelte-toast';

export const success = (m: string) =>
	toast.push(m, {
		theme: {
			'--toastBackground': '#48BB78',
			'--toastBarBackground': '#2F855A'
		},
		duration: 1000
	});

export const warning = (m: string) =>
	toast.push(m, {
		theme: {
			'--toastBackground': '#FFC107',
			'--toastBarBackground': '#FFA000'
		}
	});

export const error = (m: string) =>
	toast.push(m, {
		theme: {
			'--toastBackground': '#F56565',
			'--toastBarBackground': '#C53030'
		}
	});
