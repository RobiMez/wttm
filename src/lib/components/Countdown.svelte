<script lang="ts">
	import { onMount } from 'svelte';
	export let digits: string;
	export let color: string;
	let useDigits = '0000';
	let chunkedData: string[];

	const splitIntoChunks = (str: string, size: number): string[] => {
		let result: string[] = [];
		for (let i = 0; i < str.length; i += size) {
			result.push(str.slice(i, i + size));
		}
		return result;
	};

	const processDigits = (digits: string = '') => {
		if (digits) useDigits = digits;
		return useDigits.length % 2 === 0
			? splitIntoChunks(useDigits, 2)
			: [useDigits[0], ...splitIntoChunks(useDigits.substring(1), 2)];
	};

	chunkedData = processDigits();

	$: if (useDigits !== digits && useDigits !== '0000') {
		chunkedData = processDigits(digits);
	}

	onMount(() => {
		setTimeout(() => {
			chunkedData = processDigits(digits);
		}, 1000);
	});
</script>

<span class="countdown text-sm font-semibold text-secondary/70" style="color: {color}">
	{#each chunkedData as chunk}
		<span class="" style="--value:{chunk};" />
	{/each}
</span>
