<script>
	import NProgress from 'nprogress';

	import { SvelteToast } from '@zerodevx/svelte-toast';
	import { navigating } from '$app/stores';

	import '../assets/css/fontawesome.css';
	import '../assets/css/brands.css';
	import '../assets/css/solid.css';
	import '../app.css';

	import 'nprogress/nprogress.css';
	import '../lib/global.css';

	NProgress.configure({
		// Full list: https://github.com/rstacruz/nprogress#configuration
		minimum: 0.66,
		showSpinner: false
	});

	$: {
		if ($navigating) {
			NProgress.start();
		}
		if (!$navigating) {
			NProgress.done();
		}
	}
	// export let data;
</script>

<div class="app min-h-screen">
	<main>
		<slot />
		<SvelteToast />
	</main>
</div>
