<script lang="ts">
	import FileLoader from '$lib/components/FileLoader.svelte';

	export let stagedData: any;
</script>

<FileLoader bind:stagedData />

<div class="p-12">
	<h2>stagedData</h2>
	<pre>
    {JSON.stringify(stagedData, null, 2)}
  </pre>
</div>

<style lang="postcss">
	pre {
		@apply p-4 bg-base-200 rounded-lg text-xs;
		background-color: #f4f4f4;
		padding: 10px;
		border-radius: 5px;
		height: 20vh;
		overflow: scroll;
	}
	h2 {
		margin-top: 20px;
	}
</style>
