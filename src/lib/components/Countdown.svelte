<script lang="ts">
	import { onMount } from 'svelte';
	export let digits: string;
	export let color: string ;
	let useDigits = '0000';

	const splitIntoChunks = (str: string, size: number): string[] => {
		let result: string[] = [];
		for (let i = 0; i < str.length; i += size) {
			result.push(str.substr(i, size));
		}
		return result;
	};

	let chunkedData: string[];

	$: if (digits) {
		useDigits = digits;
		chunkedData =
			useDigits.length % 2 === 0
				? splitIntoChunks(useDigits, 2)
				: [useDigits[0], ...splitIntoChunks(useDigits.substring(1), 2)];
	}

	onMount(() => {
		setTimeout(() => {
			console.log('Setting digits', digits, useDigits);
			useDigits = digits;

			chunkedData =
				useDigits.length % 2 === 0
					? splitIntoChunks(useDigits, 2)
					: [useDigits[0], ...splitIntoChunks(useDigits.substring(1), 2)];
		}, 1000);
	});
</script>

<span class="countdown text-sm font-semibold text-secondary/70" style="color: {color}">
	{#each chunkedData as chunk}
		<span class="" style="--value:{chunk};" />
	{/each}
</span>
