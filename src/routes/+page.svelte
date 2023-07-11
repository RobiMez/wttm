<script>
	//@ts-nocheck
	import * as d3 from 'd3';
	import { onMount } from 'svelte';
	import Scrolly from '$lib/components/Scrolly.svelte';
	import random from 'canvas-sketch-util/random';
	import Color from 'canvas-sketch-util/color';

	random.setSeed('robi');
	let debug = false;
	export let data;
	console.log('colors', data['colors']);

	let datas;
	let currentStep;
	let xScale, yScale, rScale, xTicks, yTicks;
	let lineGenerator, formatTick, textAreaInput, parsedTextAreaInput;
	let parsedTextAreaInputValidAsTelegramExport = false;
	let p1n = 'Mom';
	let p1c, p2c;
	let tally;

	if (datas) {
		p1n = datas[0].from;
	}

	let clw = 1080;
	let clh = 1080;

	p1c = 'salmon';
	p2c = '#5e503f';

	const margins = {
		top: 20,
		right: 30,
		bottom: 30,
		left: 90
	};

	const findReplyDataPoint = (replyToMessageId) => {
		let de = datas.find((d) => d.id === replyToMessageId) ?? [];
		return de;
	};

	function randomChoice(array) {
		const randomIndex = Math.floor(Math.random() * array.length);
		return array[randomIndex];
	}
	const rerollColors = () => {
		let palette = randomChoice(data.colors);
		if (datas) {
			p1n = yScale.domain()[0];
			console.log('dommy', yScale.domain()[1]);
		}

		p1c = randomChoice(palette);
		p2c = randomChoice(palette);

		let tries = 0;
		const maxTries = 10; // Combination formula for the win

		while (
			Color.contrastRatio(p1c, p2c) < 4.5 ||
			Color.contrastRatio(p1c, '#FFFFFF') < 3.5 ||
			Color.contrastRatio(p2c, '#FFFFFF') < 3.5
		) {
			p1c = randomChoice(palette);
			p2c = randomChoice(palette);

			tries++;

			if (tries >= maxTries) {
				palette = randomChoice(data.colors);
				tries = 0;
			}
		}
	};
	let opa = 30;

	// let parseforJSON = (e) => {
	// 	let toparse = e.explicitOriginalTarget.value;
	// 	console.log('reparsing', toparse, e);
	// 	try {
	// 		parsedTextAreaInput = JSON.parse(toparse);
	// 		console.log('valid');
	// 		console.log(parsedTextAreaInput.type == 'personal_chat');
	// 		if (parsedTextAreaInput.type == 'personal_chat' && parsedTextAreaInput.messages.length) {
	// 			parsedTextAreaInputValidAsTelegramExport = true;
	// 			stagedData = parsedTextAreaInput.messages;
	// 		} else {
	// 			console.log('invalid');
	// 			parsedTextAreaInput = 'invalidExport';
	// 			stagedData = undefined;
	// 		}
	// 	} catch (error) {
	// 		console.log('invalid');
	// 		parsedTextAreaInput = 'invalid';
	// 		stagedData = undefined;
	// 	}
	// };

	const renderCanvas = (ndata) => {
		if (!ndata) {
			datas = data['jsonData'];
		}
		// Preprocess //
		// Parse the date strings into JavaScript Date objects
		datas = datas.filter((obj) => 'from' in obj);
		datas.forEach(function (d) {
			d.date = new Date(d.date);
		});

		// Sort the data by the 'date' field in ascending order
		datas.sort(function (a, b) {
			return a.date - b.date;
		});

		// Compute the time delta for each document in milliseconds
		datas.forEach(function (d, i) {
			if (i === 0) {
				d.timeDelta = 0; // Set the first document's time delta to 0
			} else {
				d.timeDelta = d.date.getTime() - datas[i - 1].date.getTime();
			}
		});

		// Adjust zero or negative time deltas to a minimum value
		datas.forEach(function (d) {
			if (d.timeDelta <= 0) {
				d.timeDelta = 1;
			}
			if (d.timeDelta > 100000000) {
				d.timeDelta = 100000000;
			}
		});

		// SCALES //
		// Create a logarithmic scale that ranges from the left margin
		// to the client width - margin right that
		// depends on the date value of the datapoints
		xScale = d3
			.scaleLinear()
			.domain(d3.extent(datas, (d) => new Date(d.date).getTime()))
			.nice()
			.range([margins.left, clw - margins.right]);
		// Create a bandscale ( category ) that takes all the .froms and ranges from
		// the client height - margin bottom to the margin top
		yScale = d3
			.scaleBand()
			.domain(datas.map((d) => d.from).reverse())
			.range([clh - margins.bottom, margins.top]);
		// Create a radius scale that ranges from 10 to 1 that
		// depends on the highest and lowest time deltas
		rScale = d3
			.scaleLog()
			.domain(d3.extent(datas.map((d) => d.timeDelta)).filter((d) => d > 0))
			.range([10, 1]);

		lineGenerator = d3
			.line()
			.curve(d3.curveCardinal.tension(0.5))
			.x(function (d) {
				return d.x;
			})
			.y(function (d) {
				return d.y;
			});

		// Format ticks
		formatTick = d3.tickFormat(xScale);

		// Compute x and y axis ticks
		if (xScale && yScale) {
			xTicks = xScale.ticks();
			yTicks = yScale.domain();
		}
		calculateTallies();
	};
	$: {
		// Format ticks
		formatTick = d3.tickFormat(xScale);

		// Compute x and y axis ticks
		if (xScale && yScale) {
			xTicks = xScale.ticks();
			yTicks = yScale.domain();
		}
	}

	const formatTimedelta = (td) => {
		td = Math.floor(td / 1000); // Convert milliseconds to seconds
		const hours = Math.floor(td / 3600);
		const minutes = Math.floor((td % 3600) / 60);
		const seconds = Math.floor(td % 60);

		return `${hours} hours, ${minutes} minutes, ${seconds} seconds`;
	};

	let calculateTallies = () => {
		tally = {};

		for (let i = 0; i < datas.length; i++) {
			const from = datas[i].from;
			const meme = datas[i].text == '';
			const timedelta = parseInt(datas[i].timeDelta);
			if (tally.hasOwnProperty(from)) {
				tally[from].count++;
				tally[from].sum += timedelta;

				console.log('ree', tally[from]);
				if (meme) {
					tally[from].memecount += 1;
				}
			} else {
				tally[from] = {
					count: 1,
					sum: timedelta,
					memecount: 1
				};
			}
		}

		// Calculate the mean for each 'from' value
		for (const key in tally) {
			if (tally.hasOwnProperty(key)) {
				const mean = tally[key].sum / tally[key].count;
				tally[key].mean = mean;
			}
		}

		for (const key in tally) {
			if (tally.hasOwnProperty(key)) {
				const meanTimedelta = Math.floor(tally[key].mean);
				tally[key].mean = meanTimedelta;
				console.log(tally[key]);
				const formattedTimedelta = formatTimedelta(meanTimedelta);
				tally[key].meanText = formattedTimedelta;
			}
		}
		for (const key in tally) {
			if (tally.hasOwnProperty(key)) {
				const meanTimedelta = Math.floor(tally[key].mostThirstyReplyTime);
				tally[key].mostThirstyReplyTime = meanTimedelta;
				console.log(tally[key]);
				const formattedTimedelta = formatTimedelta(meanTimedelta);
				tally[key].thirstText = formattedTimedelta;
			}
		}

		console.log('tally', tally);
		return tally;
	};

	let loadStagedData = () => {
		datas = stagedData;
		stagedData = undefined;
		textAreaInput = '';
		parsedTextAreaInput = null;
		parsedTextAreaInputValidAsTelegramExport = false;
		rerollColors();
		renderCanvas(datas);
		rerollColors();

		console.log('tally', calculateTallies());
	};

	let xAccessor = (d) => new Date(d.date).getTime();
	let yAccessor = (d) => d.from;
	let rAccessor = (d) => d.timeDelta;

	let xAccessorScaled = (d) => xScale(xAccessor(d)) + random.value();
	let yAccessorScaled = (d) =>
		yScale(yAccessor(d)) + yScale.bandwidth() / 2 - random.value() * 200 + 100;
	let rAccessorScaled = (d) => rScale(rAccessor(d));

	let keyAccessor = (d, i) => i;
	let stagedData;

	const handleFileChange = (event) => {
		let files = event.target.files;

		for (let f of files) {
			let reader = new FileReader();

			reader.onload = function (e) {
				let jsonText = e.target.result;
				console.log('Fileread return', jsonText);
				try {
					parsedTextAreaInput = JSON.parse(jsonText);
					console.log('valid');
					console.log(parsedTextAreaInput.type == 'personal_chat');
					if (parsedTextAreaInput.type == 'personal_chat' && parsedTextAreaInput.messages.length) {
						parsedTextAreaInputValidAsTelegramExport = true;
						stagedData = parsedTextAreaInput.messages;
					} else {
						console.log('invalid');
						parsedTextAreaInput = 'invalidExport';
						stagedData = undefined;
						event.target.value = null;
					}
				} catch (error) {
					console.log('invalid');
					parsedTextAreaInput = 'invalid';
					event.target.value = null;
					stagedData = undefined;
				}
			};

			reader.readAsText(f);
		}
	};

	onMount(() => {
		renderCanvas();
	});
</script>

<div
	bind:clientWidth={clw}
	bind:clientHeight={clh}
	class="sticky top-0 left-0 h-[100vh] bg-white w-[60%] justify-center items-center flex flex-wrap"
>
	<svg
		width={clw}
		height={clh}
		viewBox={[0, 0, clw, clh]}
		style="width: 100%; height: auto; font: 10px sans-serif;"
	>
		<!-- X-axis -->
		{#if xScale}
			<g>
				{#each xScale.ticks() as tick}
					<line
						x1={xScale(tick)}
						x2={xScale(tick)}
						y1={clh - margins.bottom}
						y2={clh - margins.bottom + 5}
						stroke="#cecece"
					/>
					<text
						x={xScale(tick)}
						y={clh - margins.bottom + 15}
						text-anchor="middle"
						font-size="8"
						fill="#cecece"
					>
						{new Date(tick).toLocaleString('default', {
							day: '2-digit',
							month: 'short',
							year: '2-digit'
						})}
					</text>
				{/each}
			</g>
		{/if}

		<!-- Y-axis -->
		<!-- {#if yScale}
			<g>
				{#each yScale.domain() as tick}
					<line
						x1={margins.left}
						x2={margins.left - 5}
						y1={yScale(tick) + margins.top}
						y2={yScale(tick) + margins.top}
						stroke="#cecece"
					/>
					<text
						x={margins.left - 38}
						y={yScale(tick) + margins.top + 4}
						text-anchor="middle"
						font-size="16"
						font-weight={900}
						fill="#cecece"
					>
						{tick}
					</text>
				{/each}
			</g>
		{/if} -->

		{#if xScale && yScale}
			<!-- Data points -->
			{#each datas as d, i (keyAccessor(d) || i)}
				<circle
					cx={d.from == p1n ? xAccessorScaled(d, i) : xAccessorScaled(d, i)}
					cy={yAccessorScaled(d, i)}
					r={!d.text ? 2 : rAccessorScaled(d, i)}
					opacity={!d.text ? opa / 50 : opa / 100}
					fill={!d.text ? '#5e548e' : d.from == p1n ? p1c : p2c}
				/>
				{#if d.reply_to_message_id}
					{#each [findReplyDataPoint(d.reply_to_message_id)] as replyData}
						<path
							d={`M ${xAccessorScaled(d, i)},${yAccessorScaled(d, i)} L ${xAccessorScaled(
								replyData
							)},${yAccessorScaled(replyData)}`}
							fill="none"
							opacity={opa / 100}
							stroke-linecap="round"
							stroke-width={2}
							stroke={d.from == p1n ? p1c : p2c}
						/>
					{/each}
				{/if}
			{/each}
		{/if}
	</svg>
</div>

<div class="flex flex-col justify-end -m-[100vh] ml-[60%] w-[40%] h-full bg-stone-100">
	<div class="sticky top-0 right-0 text-right px-8 py-4 {debug ? 'flex' : 'hidden'} flex-col">
		<small class="text-xs">Current Story Step : {currentStep ?? 'loading'}</small>
		<small class="text-xs">Dataset size : {datas ? datas.length : 'loading'}</small>
		<small class="text-xs">textarea : {textAreaInput ? parsedTextAreaInput.length : 'empty'}</small>
		<small class="text-xs"
			>parsedTextAreaInputValidAsTelegramExport : {parsedTextAreaInputValidAsTelegramExport}</small
		>
		<small class="text-xs">Staged Data : {stagedData ? stagedData.length : 'empty'}</small>
	</div>
	<Scrolly bind:value={currentStep}>
		<div class="h-[80vh] p-10 mt-12 flex place-items-center justify-center">
			<div class=" text-white rounded-xl">
				<h3 class="text-5xl font-black text-stone-800 py-6">Who talks the most ?</h3>
				{#if yScale}
					<h6 class="text-lg font-black text-stone-800">
						In the Conversation between <span style="color: {p2c}">{yScale.domain()[1]}</span> &
						<span style="color: {p1c}">{yScale.domain()[0]}</span> <br /><small class="text-xs"
							>{datas.length} dots of which
							<span style="color: {p1c}"
								>{tally[yScale.domain()[0]]['count']} sent by {yScale.domain()[0]}</span
							>
							and
							<span style="color: {p2c}"
								>{tally[yScale.domain()[1]]['count']} sent by {yScale.domain()[1]}</span
							>
						</small>
						<br />
					</h6>
					<p class="text-xs font-normal text-stone-800 my-2">
						<b>Average response times : </b><br />
						<span style="color: {p1c}"
							>{yScale.domain()[0]}: <b>{tally[yScale.domain()[0]]['meanText']}</b>
						</span><br />
						<span style="color: {p2c}"
							>{yScale.domain()[1]}: <b>{tally[yScale.domain()[1]]['meanText']}</b></span
						>
					</p>
					<div class="flex flex-row justify-start gap-12 my-2">
						<p class="text-xs font-normal text-stone-800">
							<b>Non text messages ( voice , pics , etc) : </b><br />
							<span style="color: {p1c}"
								>{yScale.domain()[0]} : <b>{tally[yScale.domain()[0]]['memecount']}</b>
							</span><br />
							<span style="color: {p2c}"
								>{yScale.domain()[1]}: <b>{tally[yScale.domain()[1]]['memecount']}</b></span
							>
						</p>
						<p class="text-xs font-normal text-stone-800">
							<b>Text messages: </b><br />
							<span style="color: {p1c}"
								>{yScale.domain()[0]} :
								<b>{tally[yScale.domain()[0]]['count'] - tally[yScale.domain()[0]]['memecount']}</b
								></span
							> <br />
							<span style="color: {p2c}"
								>{yScale.domain()[1]}:
								<b>{tally[yScale.domain()[1]]['count'] - tally[yScale.domain()[1]]['memecount']}</b
								></span
							>
						</p>
					</div>
				{/if}

				<hr />
				<p class="text-stone-500 text-xs">
					Messages are arranged in <b>increasing time</b> & separated by <b>who they are from</b>
					<br />The lines in between are replies ( bolder = more back and forth happening ) <br />
					and non text messages are modelled as <b>small purple dots.</b>
					<br />
					The Size of the circle corresponds to <b>how fast you answered.</b> ( with delays larger
					than 3 days considered in the same light )
					<br />
				</p>
				<div class="flex flex-row justify-around items-center align-baseline mt-4">
					<input
						type="file"
						accept=".json"
						id="recipients_file"
						on:change={handleFileChange}
						style="input"
						class="text-stone-800 file-input file-input-sm rounded-md {stagedData
							? 'file-input-success'
							: ''} file-input-bordered"
					/>
					<button
						on:click={loadStagedData}
						class="btn btn-sm text-sm
			{stagedData == undefined ? 'btn-disabled btn-outline' : 'btn-success'}
			{parsedTextAreaInputValidAsTelegramExport ? 'btn-success' : 'btn-disabled btn-outline'}
			"
					>
						Load {stagedData ? stagedData.length + ' items' : 'Data'}
					</button>
				</div>

				<!-- <textarea
					class="textarea textarea-xs mt-4 text-stone-800
					
						{textAreaInput
						? parsedTextAreaInputValidAsTelegramExport
							? 'textarea-success'
							: 'textarea-error'
						: 'textarea-primary'}
					"
					placeholder="Paste your export json here or browse"
					name="datum"
					id="datum"
					cols="38"
					rows="1"
					on:input={(e) => parseforJSON(e)}
					bind:value={textAreaInput}
				/> -->

				<div class="flex flex-row justify-center items-center gap-4 p-4">
					<button
						on:click={rerollColors}
						class="btn btn-sm btn-outline text-sm '}
				"
					>
						<i class="fa-solid fa-brush" />
					</button>
					<span class=" p-4 text-xs text-stone-800">Opacity</span>
					<input bind:value={opa} type="range" min="0" max="100" class="range range-xs" />
				</div>
			</div>
		</div>
		<div class="h-[100vh] p-10 flex place-items-center justify-center">
			<div class=" text-white rounded-xl">
				<!-- svelte-ignore a11y-click-events-have-key-events -->
				<h3 on:click={() => (debug = !debug)} class="text-6xl font-black text-stone-800">🤔</h3>
				<hr />
				<small class="text-stone-800" />
			</div>
		</div>
	</Scrolly>
</div>

<style>
	circle {
		transition-property: all;
		transition-duration: 0.9s;
		transition-timing-function: ease;
		transition-property: color none;
	}
</style>
