<script lang="ts ">
  // WARNING: Editing this file causes an HMR hiccup and the page to lag indefinitely
	export let d;
</script>

<circle
	role="button"
	tabindex="0"
	on:mouseover
	on:mouseleave
	on:focus
	on:blur
	class=" hover:opacity-100 hover:z-50 "
	cx={d.cx}
	cy={d.cy}
	r={d.r }
	opacity={d.o}
	fill={d.f}
/>

{#if d.reply_to_message_id}
	<path d={d.m} fill="none" opacity={d.o} stroke-linecap="round" stroke-width={2} stroke={d.s} />
{/if}

<style>
	circle {
		transition-property: all;
		transition-duration: 0.3s;
		transition-timing-function: ease;
		transition-property: color none;
	}
</style>
