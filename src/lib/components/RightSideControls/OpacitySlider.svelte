<script lang="ts">
	export let opa: number = 30;
</script>

<div class="w-full flex gap-2 flex-col">
	<span class="mb-1 px-1 text-xs text-stone-800">Opacity {opa}%</span>
	<input bind:value={opa} type="range" min="0" max="100" class="range range-xs" />
	<span class="flex flex-row justify-between">
		<span>Fully transparent</span>
		<span>Opaque</span>
	</span>
</div>
