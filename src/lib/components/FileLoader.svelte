<script lang="ts">
	import { onMount, createEventDispatcher } from 'svelte';
	import { tweened } from 'svelte/motion';

	export let stagedData: any;
	export let userA = '';
	export let userB = '';

	let dataCount: number = 0;
	let userText = '';
	let hovering = false;

	let dataCountTween = tweened(0, {
		duration: 1500,
		easing: (t: number) => t * t * t * t * t // Quintic easing
	});

	let parsedTextAreaInput: any;
	let ptaivAsTelegramExport = false;

	const d = createEventDispatcher();

	const fireLoad = (e: Event) => {
		e.preventDefault();
		e.stopPropagation();
		d('load', { stagedData });
	};

	const handleFileChange = (event: Event, dropFiles: FileList | null = null) => {
		// If the event target is not an input and there are no files dropped
		if (!event.target && !dropFiles) return;
		const input = event.target as HTMLInputElement;
		if (!input.files && !dropFiles) return;
		let files = input.files;

		if (dropFiles) files = dropFiles;
		if (!files) return;

		for (let f of files) {
			let reader: FileReader | null = new FileReader();

			reader.onload = function (e) {
				if (!e.target) return;
				if (!(e.target instanceof FileReader)) return;
				// Since im using reader.readAsText(f);
				// Its guaranteed to be a string
				// so i can ignore the case where it might be an ArrayBuffer
				let jsonText = e.target.result as unknown as string | null;
				if (!jsonText) return;

				try {
					parsedTextAreaInput = JSON.parse(jsonText);
					// If the parsed data is a DM export and has messages
					if (parsedTextAreaInput.type == 'personal_chat' && parsedTextAreaInput.messages.length) {
						// Stage it for loading
						ptaivAsTelegramExport = true;
						stagedData = parsedTextAreaInput.messages;
						dataCount = stagedData.length;
					} else {
						// If its not a valid export
						parsedTextAreaInput = 'invalidExport';
						stagedData = undefined;
						input.value = '';
					}
				} catch (error) {
					parsedTextAreaInput = 'invalid';
					stagedData = undefined;
					input.value = '';
				}
			};

			reader.onloadend = function () {
				// Cleanup after file reading is done
				reader = null; // Explicitly release the FileReader object
			};

			reader.readAsText(f);
		}
	};

	$: if (stagedData) {
		userA = stagedData[0].from;
		userB = stagedData.find((m: any) => m.from !== userA).from;
		userText = userA + ' and ' + userB;
	}

	$: dataCountTween.set(dataCount);

	onMount(() => {
		let dropArea = document.getElementById('drop-area')!;

		['dragenter', 'dragover', 'dragleave', 'drop'].forEach((eventName) => {
			if (!dropArea) return;
			dropArea.addEventListener(eventName, preventDefaults, false);
		});

		function preventDefaults(e: Event) {
			e.preventDefault();
			e.stopPropagation();
		}

		['dragenter', 'dragover'].forEach((eventName) => {
			if (!dropArea) return;
			dropArea.addEventListener(eventName, highlight, false);
		});
		['dragleave', 'drop'].forEach((eventName) => {
			if (!dropArea) return;
			dropArea.addEventListener(eventName, unhighlight, false);
		});

		function highlight(e: Event) {
			if (!dropArea) return;
			hovering = true;
			dropArea.classList.add('highlight');
		}

		function unhighlight(e: Event) {
			if (!dropArea) return;
			hovering = false;
			dropArea.classList.remove('highlight');
		}

		dropArea.addEventListener('drop', handleDrop, false);

		function handleDrop(e: DragEvent) {
			let dt = e.dataTransfer;
			if (!dt) return;
			let files = dt.files;
			handleFileChange(e, files);
		}
	});
</script>

<div
	id="drop-area"
	class="flex flex-row justify-center items-center
    transition-all
    rounded-xl
    border-stone-500
    relative border-2
    min-w-72 w-fit
    h-40
    
    {!hovering && !stagedData ? 'border-dashed' : 'border-solid '}
    
    "
	role="button"
	tabindex="0"
	on:keydown={(e) => {
		if (e.key === 'Enter') {
			const fileInput = document.getElementById('recipients_file');
			if (fileInput) {
				fileInput.click();
			}
		}
	}}
	on:click={() => {
		const fileInput = document.getElementById('recipients_file');
		if (fileInput) {
			fileInput.click();
		}
	}}
>
	<input
		type="file"
		accept=".json"
		id="recipients_file"
		on:change={(e) => handleFileChange(e)}
		multiple={false}
		class=" hidden"
	/>
	{#key userA}
		{#if dataCount > 0 && stagedData}
			<span
				role="button"
				tabindex="0"
				class="flex flex-col gap-1 justify-center items-center relative w-full h-40
      overflow-clip rounded-xl hover:bg-stone-200/20 transition-all cursor-alias
      p-4"
				on:click={fireLoad}
				on:keypress={fireLoad}
			>
				<span
					class="absolute w-full h-full bg-stone-600/10 proggy pointer-events-none"
					style="transform: translate( 0% ,{($dataCountTween / dataCount) * 200}%)"
				>
				</span>
				<span
					class="absolute w-full h-full bg-emerald-500/40 proggy pointer-events-none"
					style="transform: translate( 0% ,{($dataCountTween / dataCount) * 100}%)"
				>
				</span>
				<h2 class=" text-stone-700 z-50">Load {Math.round($dataCountTween)} Items ?</h2>
				{#if ptaivAsTelegramExport}
					<small class=" text-emerald-500 z-50">Valid Convo </small>
					<small class=" text-stone-500 z-50"> {userText} </small>

					<button
						class="border border-stone-500 bg-white rounded-xl px-4 py-1"
						on:click={() => {
							const fileInput = document.getElementById('recipients_file');
							if (fileInput) {
								fileInput.click();
							}
						}}
					>
						Change File ?
					</button>
				{/if}
			</span>
		{:else}
			<span class="flex flex-col gap-2 justify-center items-center relative w-full h-40 p-4">
				<h2 class=" text-stone-700">Drop your results.json here</h2>
				<small class="text-stone-600"> Or click to browse </small>
				{#if parsedTextAreaInput == 'invalid'}
					<small class="text-stone-600"> Invalid File </small>
				{:else if parsedTextAreaInput == 'invalidExport'}
					<small class="text-stone-600"> Export Invalid </small>
				{/if}
			</span>
		{/if}
	{/key}
</div>

<style lang="postcss">
	.proggy {
		transition: transform 2s cubic-bezier(0.33, 1, 0.68, 1);
	}
</style>
