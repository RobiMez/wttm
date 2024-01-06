<script lang="ts">
	import { debounce } from 'lodash-es';
	import DiceFive from 'phosphor-svelte/lib/DiceFive';
	import { fade, scale, slide } from 'svelte/transition';

	export let palette: string[];
	function randomChoice(array: string[]) {
		const randomIndex = Math.floor(Math.random() * array.length);
		return array[randomIndex];
	}
	console.log('palette', palette);
	let maxWidth: number = 2000;
	let maxHeight: number = 2000;

	let circles: { x: number; y: number; size: number }[] = Array.from({ length: 100 }, () => ({
		x: Math.random() * maxWidth,
		y: Math.random() * maxHeight,
		size: Math.random() * 8 + 3
	}));

	const randomizeCirclePositions = () => {
		circles = Array.from({ length: maxWidth / 8 }, () => ({
			x: Math.random() * maxWidth,
			y: Math.random() * maxHeight,
			size: Math.random() * 9 + 3
		}));
		circles = circles;
	};

	let clicks: number = 0;

	let quirkyMessageLookup: { [key: number]: string } = {
		1: 'Ayy good job, you are smarter than a chimp.',
		2: 'Maybe it changes the second time huh.',
		3: "Third time's the charm.",
		10: "You're a 10/10.",
		50: '50 times ? .',
		69: 'Nice.',
		100: '100%.',
		420: '🍃💨',
		500: 'Daum , bet those fingers do wonders huh.',
		539: 'But I tell you, do not resist an evil person. If anyone slaps you on the right cheek, turn to them the other cheek also.- Matthew 5:39', // by YohannesTz
		1000: 'You need a hobby.',
		1337: 'leet',
		8100: 'This used to be a thing.',
		5000: 'You REALLY need a hobby.',
		10000: 'You need to stop using autoclickers.',
		69420: 'When two worlds collide.',
		13000:
			'I guess if a 13 year old beats tetris then there ought to be a someone who clicks on a random button 13,000 times',
		942589049: "Beka's phone number."
	};

	const debouncedGenerateCircles = debounce(randomizeCirclePositions, 100, { trailing: true });

	$: if (maxWidth || maxHeight) {
		debouncedGenerateCircles();
	}
</script>

<div class="relative" bind:clientHeight={maxHeight} bind:clientWidth={maxWidth}>
	<svg width={maxWidth} height={maxHeight} fill="transparent" class="absolute -z-40 transition-all">
		{#each circles as circle}
			<circle
				transition:fade|local
				cx={circle.x}
				cy={circle.y}
				r={circle.size}
				opacity={Math.random() + 0.6 * 0.98}
				fill={`${randomChoice(palette)}`}
			/>
		{/each}
	</svg>

	<div class="flex flex-col justify-center items-center h-screen container mx-auto gap-2">
		<div class="bg-base-200/80 rounded-md backdrop-blur-sm gap-2 flex flex-col p-12 mx-8">
			<p class="text-md md:text-xl font-semibold text-stone-600 text-center transition-all">
				This site is not designed for mobile and tablet.
			</p>
			<small class="text-stone-500 text-center text-xs md:text-sm font-light px-2 transition-all">
				Generating Telegram exports and loading them is done from the PC client.
				<br />So this site is,
				<b class="text-stone-700">by design, not usable for sizes below 1225 px wide.</b>
			</small>
			<div class="flex flex-row justify-center gap-2">
				<a href="https://robi.work" class="btn btn-sm btn-primary mt-3 w-fit">Back to Portfolio</a>
				<button
					on:click={() => {
						debouncedGenerateCircles();
						clicks += 1;
					}}
					class="btn btn-sm btn-accent mt-3 w-fit flex flex-row align-baseline"
				>
					<span> Randomize </span>
					<small class="my-auto">
						{clicks}
					</small>
					<DiceFive />
				</button>
			</div>
			<small class="text-center min-h-6 mt-2">
				{#if clicks > 0}
					{#key clicks}
						<span
							in:fade
							class="text-sm text-stone-400 p-1 rounded-md"
							class:bg-stone-200={quirkyMessageLookup[clicks]}
							class:text-stone-700={quirkyMessageLookup[clicks]}
						>
							{#if quirkyMessageLookup[clicks]}
								{quirkyMessageLookup[clicks]}
							{:else}
								You have clicked the button {clicks} times.
							{/if}
						</span>
					{/key}
				{/if}
			</small>
		</div>
	</div>
</div>

<style>
	circle {
		transition-property: all;
		transition-duration: 1s;
		transition-timing-function: cubic-bezier(0.5, 0.02, 0, 1.01);
		transition-property: color none;
	}
</style>
