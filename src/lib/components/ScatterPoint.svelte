<script lang="ts">
	import { onMount } from 'svelte';

	export let data: any[] = [];
	export let keyAccessor = () => {};
	export let xAccessor = () => {};
	export let rAccessor = () => {};
	export let yAccessor = () => {};

	const findReplyDataPoint = (replyToMessageId: string) => {
		let de = data.find((d) => d.id === replyToMessageId) ?? [];
		return de;
	};


</script>

{#each data as d, i (keyAccessor(d) || i)}
	<circle
		cx={d.from == 'Robi' ? xAccessor(d, i) : xAccessor(d, i)}
		cy={yAccessor(d, i)}
		r={!d.text ? 2 : rAccessor(d, i)}
		opacity={!d.text ? 0.5 : 0.2}
		fill={!d.text ? '#5e548e' : d.from == 'Robi' ? 'salmon' : '#5e503f'}
	/>
	{#if d.reply_to_message_id}
		{#each [findReplyDataPoint(d.reply_to_message_id)] as replyData}
			<path
				d={`M ${xAccessor(d, i)},${yAccessor(d, i)} L ${xAccessor(replyData)},${yAccessor(
					replyData
				)}`}
				fill="none"
				opacity={0.07}
				stroke-linecap="round"
				stroke-width={2}
				stroke={d.from == 'Robi' ? 'salmon' : '#5e503f'}
			/>
		{/each}
	{/if}
{/each}

<style>
	circle {
		transition: all 1s ease;
	}
</style>
