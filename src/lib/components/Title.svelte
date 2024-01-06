<script lang="ts">
	let hoveredOn: Boolean = false;
</script>

<h3
	class="text-4xl font-extrabold text-stone-600 py-2  transition-all duration-700 "
	class:text-stone-300={hoveredOn}
	on:mouseover={() => (hoveredOn = true)}
	on:focus={() => (hoveredOn = true)}
	on:mouseout={() => (hoveredOn = false)}
	on:blur={() => (hoveredOn = false)}
>
	<span class:text-stone-700={hoveredOn} class="transition-all duration-700">W</span>ho
	<span class:text-stone-700={hoveredOn} class="transition-all duration-700">T</span>alks
	<span class:text-stone-700={hoveredOn} class="transition-all duration-700">T</span>he
	<span class:text-stone-700={hoveredOn} class="transition-all duration-700">M</span>ost ?
</h3>
