<script lang="ts">
	import DiceFive from 'phosphor-svelte/lib/DiceFive';
	export let p1c: string;
	export let p2c: string;
	export let rerollColors: () => void;
</script>

<div class="flex flex-row justify-between gap-2 items-center align-baseline">
	<span class="text-white p-2 px-4 rounded-md" style="background-color: {p1c}">
		{p1c}
	</span>
	<button on:click={rerollColors} class="btn btn-sm btn-outline text-sm">
		Randomize Colors
		<DiceFive size="24" />
	</button>
	<span class="text-white p-2 px-4 rounded-md" style="background-color: {p2c}">
		{p2c}
	</span>
</div>
