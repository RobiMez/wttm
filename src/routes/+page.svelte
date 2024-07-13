<script lang="ts">
	import * as d3 from 'd3';

	import { onMount } from 'svelte';
	import { fade, scale, slide } from 'svelte/transition';

	import Scrolly from '$lib/components/Scrolly.svelte';
	import Title from '$lib/components/Title.svelte';
	import Countdown from '$lib/components/Countdown.svelte';

	import random from 'canvas-sketch-util/random';
	import Color from 'canvas-sketch-util/color';

	import Crown from 'phosphor-svelte/lib/Crown';
	import OpacitySlider from '$lib/components/RightSideControls/OpacitySlider.svelte';
	import ColorRandomizer from '$lib/components/RightSideControls/ColorRandomizer.svelte';

	import { debounce } from 'lodash-es';
	import prettyMilliseconds from 'pretty-ms';
	import NoMobileTabPage from '$lib/components/NoMobileTabPage.svelte';

	import { formatTimedelta } from '$lib/utils/time';
	import FileLoader from '$lib/components/FileLoader.svelte';
	import { chunkArray } from '$lib/utils.js';
	import DataPoint from './DataPoint.svelte';

	random.setSeed('robi');

	let debug = false;
	export let data;

	let ghostDuration = 100000000; // ms = 1 day

	let datas: any;
	let stagedData: Array<any>;

	let currentStep: number;

	let xScale: any, yScale: any, rScale: any;
	let xTicks, yTicks;

	let lineGenerator, formatTick;
	let p1n = 'Mom';

	let p1c: string;
	let p2c: string;

	let tally: any;

	let winH: number;
	let winW: number;
	let palette: string[];

	if (datas) {
		p1n = datas[0].from;
	}

	let clw: number = 1080;
	let clh: number = 1080;
	let displayedData: any[] = [];

	let isTabletSizeOrSmaller = false;
	$: isTabletSizeOrSmaller = winW < 1225 ? true : false;

	p1c = 'salmon';
	p2c = '#5e503f';

	const margins = {
		top: 20,
		right: 30,
		bottom: 30,
		left: 90
	};
	let opa = 30;

	const findReplyDataPoint = (replyToMessageId: string) => {
		let de = datas.find((d: any) => d.id === replyToMessageId) ?? [];
		return de;
	};

	function randomChoice(array: Array<any>) {
		const randomIndex = Math.floor(Math.random() * array.length);
		return array[randomIndex];
	}

	const rerollColors = () => {
		palette = randomChoice(data.colors);
		if (datas) {
			p1n = yScale.domain()[0];
		}

		p1c = randomChoice(palette);
		p2c = randomChoice(palette);

		let tries = 0;
		const maxTries = 10;
		// Combination formula for the win

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
		preprocessRenderProperties(datas);
		displayedData = updateRenderProperties(displayedData);
	};

	let hoveredDatapoint: any;
	let hoveredDatapointIndex: number;

	/** PreProcess tool  */
	const preprocessData = (data: any) => {
		console.time('Preprocessing');
		console.log('To Process', data[0]);

		// Filter out any data points that don't have a 'from' field
		data = data.filter((obj: any) => 'from' in obj);

		// Parse the date strings into JavaScript Date objects
		data.forEach((d: any) => (d.date = new Date(d.date)));
		// Sort the data by the 'date' field in ascending order
		data.sort((a: any, b: any) => a.date - b.date);
		// Compute time delta from each document to the previous one
		// Compute the time delta for each document in milliseconds
		data.forEach(function (d: any, i: any) {
			if (i === 0) {
				d.timeDelta = 0; // Set the first document's time delta to 0
			} else {
				d.timeDelta = d.date.getTime() - data[i - 1].date.getTime();
			}
		});
		// Normalize the time delta values
		data.forEach(function (d: any, i: any) {
			if (d.timeDelta <= 0) {
				d.timeDelta = 1000;
			}
			if (d.timeDelta > ghostDuration) {
				d.timeDelta = ghostDuration;
				d.ghost = true;
			}
		});

		console.log('Processed', data[0]);

		console.timeEnd('Preprocessing');
		return data;
	};

	/** RenderProperties tool  */
	const preprocessRenderProperties = (data: any) => {
		console.time('preprocessRenderProperties');
		console.log('To Process Render of ', data[0]);

		// Precalculates the positions of the data points
		datas.forEach((d: any, i: number) => {
			d.cx = d.from == p1n ? xAccessorScaled(d, i) : xAccessorScaled(d, i);
			d.cy = yAccessorScaled(d, i);
			d.f = !d.text ? '#5e548e' : d.from == p1n ? p1c : p2c;
			d.r = !d.text ? 2 : rAccessorScaled(d, i);
			// If the data point is a reply, calculate the line path
			if (d.reply_to_message_id) {
				const replyData = findReplyDataPoint(d.reply_to_message_id);
				d.m = `M ${xAccessorScaled(d, i)},${yAccessorScaled(d, i)} L ${xAccessorScaled(
					replyData
				)},${yAccessorScaled(replyData)}`;
				d.s = d.from == p1n ? p1c : p2c;
			}
			d.o = !d.text ? opa / 50 : opa / 100;
		});

		console.log('Added render properties ', data[0]);
		console.timeEnd('preprocessRenderProperties');
		return data;
	};

	const updateRenderProperties = (data: any) => {
		// TODO: make this only update the ones that are relevant
		console.time('updateRenderProperties');
		console.log('To Process Render of ', data.length + ' data points');

		// Precalculates the positions of the data points
		data.forEach((d: any, i: number) => {
			d.cx = d.from == p1n ? xAccessorScaled(d, i) : xAccessorScaled(d, i);
			d.cy = yAccessorScaled(d, i);
			d.f = !d.text ? '#5e548e' : d.from == p1n ? p1c : p2c;
			d.r = !d.text ? 2 : rAccessorScaled(d, i);
			// If the data point is a reply, calculate the line path
			if (d.reply_to_message_id) {
				const replyData = findReplyDataPoint(d.reply_to_message_id);
				d.m = `M ${xAccessorScaled(d, i)},${yAccessorScaled(d, i)} L ${xAccessorScaled(
					replyData
				)},${yAccessorScaled(replyData)}`;
				d.s = d.from == p1n ? p1c : p2c;
			}
			d.o = !d.text ? opa / 50 : opa / 100;
		});

		console.timeEnd('updateRenderProperties');
		return data;
	};

	let xAccessor = (d: { date: string }) => {
		return new Date(d.date).getTime();
	};
	let yAccessor = (d: any) => d.from;
	let rAccessor = (d: any) => d.timeDelta;

	let xAccessorScaled = (d: any, i: number = 0) => xScale(xAccessor(d));
	let yAccessorScaled = (d: any, i: number = 0) =>
		yScale(yAccessor(d)) + yScale.bandwidth() / 2 - random.value() * 200 + 100;

	let rAccessorScaled = (d: any, i: any) => rScale(rAccessor(d));

	const renderCanvas = (newData: any[] | null = null) => {
		// Use default data if no data is provided
		if (!newData) {
			datas = data['jsonData'];
			console.log('Rendering Default Canvas', datas[0]);
		} else {
			console.log('Rendering Canvas', newData[0]);
			datas = newData;
		}

		// Preprocess //
		datas = preprocessData(datas);

		// Domains  //

		const Xdomain = d3.extent(datas, (d: any) => new Date(d.date).getTime()) as [number, number];

		const Ydomain = datas.map((d: any) => d.from);

		const Rdomain = d3
			.extent(datas, (d: any) => d.timeDelta)
			.filter((d: any) => d > 0) as unknown as [number, number];

		console.log('Domains', Xdomain, Ydomain, Rdomain);

		// SCALES //

		// Create a logarithmic scale that ranges from the left margin
		// to the client width - margin right that
		// depends on the date value of the datapoints
		xScale = d3
			.scaleLinear()
			.domain(Xdomain)
			.nice()
			.range([margins.left, clw - margins.right]);

		// Create a bandscale ( category ) that takes all the .froms and ranges from
		// the client height - margin bottom to the margin top
		yScale = d3
			.scaleBand()
			.domain(Ydomain)
			.range([clh - margins.bottom, margins.top]);

		// Create a radius scale that ranges from 10 to 1 that
		// depends on the highest and lowest time deltas
		rScale = d3.scaleLog().domain(Rdomain).range([10, 1]);

		lineGenerator = d3
			.line()
			.curve(d3.curveCardinal.tension(0.5))
			.x(function (d) {
				return d[0];
			})
			.y(function (d) {
				return d[1];
			});

		// Format ticks
		formatTick = d3.tickFormat(xScale);

		// Compute x and y axis ticks
		if (xScale && yScale) {
			xTicks = xScale.ticks();
			yTicks = yScale.domain();
		}
		calculateTallies();

		// Preprocess Render Properties
		datas = preprocessRenderProperties(datas);

		chunkedUpdater();
	};

	// FIXME: Causes double svg rendering
	// let debounced = debounce(renderCanvas, 500);
	// $: if (winW || winH) debounced();

	let wttm: Boolean;

	let calculateTallies = () => {
		tally = {};

		for (let i = 0; i < datas.length; i++) {
			const from = datas[i].from;
			const timedelta = parseInt(datas[i].timeDelta);
			const meme = datas[i].text == '';
			const isSticker = !!datas[i].sticker_emoji;
			const reply = !!datas[i].reply_to_message_id;
			const replyToSelf = datas[i].from === findReplyDataPoint(datas[i].reply_to_message_id).from;
			if (tally.hasOwnProperty(from)) {
				tally[from].count++;
				if (reply && !replyToSelf) {
					// Replying to ones own message shouldnt be counted as a reply
					tally[from].sum += timedelta;
				}
				if (meme) {
					tally[from].memecount += 1;
				}
				if (isSticker) {
					tally[from].stickercount += 1;
				}
			} else {
				tally[from] = {
					count: 1,
					sum: timedelta,
					memecount: 1,
					stickercount: 1
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
				const formattedTimedelta = formatTimedelta(meanTimedelta);
				tally[key].meanText = formattedTimedelta;
			}
		}

		for (const key in tally) {
			if (tally.hasOwnProperty(key)) {
				const meanTimedelta = Math.floor(tally[key].mostThirstyReplyTime);
				tally[key].mostThirstyReplyTime = meanTimedelta;
				const formattedTimedelta = formatTimedelta(meanTimedelta);
				tally[key].thirstText = formattedTimedelta;
			}
		}
		wttm = tally[yScale.domain()[0]]['count'] > tally[yScale.domain()[1]]['count'];
		return tally;
	};

	const chunkedUpdater = () => {
		displayedData = [];
		let currentIndex = 0;
		const chunkSize = 200;

		// Chunk the data
		let chunks = chunkArray(datas, chunkSize);

		renderNextChunk();
		// Function to render the next chunk
		function renderNextChunk() {
			if (currentIndex < chunks.length) {
				displayedData = [...displayedData, ...chunks[currentIndex]];
				// Remove duplicates
				// FIXME: inefficient
				// displayedData = displayedData.filter((v, i, a) => a.findIndex((t) => t.id === v.id) === i);

				currentIndex++;
				return requestAnimationFrame(renderNextChunk);
			}
		}
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

	onMount(() => {
		renderCanvas();
	});
</script>

<svelte:window bind:innerWidth={winW} bind:innerHeight={winH} />

{#if isTabletSizeOrSmaller}
	<NoMobileTabPage
		palette={palette ? palette : ['#edafb8', '#f7e1d7', '#dedbd2', '#b0c4b1', '#4a5759']}
	/>
{:else}
	<div
		bind:clientWidth={clw}
		bind:clientHeight={clh}
		class="sticky top-0 left-0 h-[100vh] bg-white w-[60%] justify-center items-center flex flex-wrap"
	>
		<div class="absolute transition-all duration-700 max-w-screen-lg">
			<div
				in:scale|global={{ duration: 300, opacity: 0.9, start: 0.9 }}
				class="bg-stone-100 p-4 rounded-xl flex flex-col gap-3"
				style="border-top: 2px solid {p1c}; border-right: 2px solid  {p2c}; border-bottom: 2px solid  {p1c}; border-left: 2px solid  {p2c};"
			>
				{#key hoveredDatapoint}
					{#if hoveredDatapoint}
						<h6 class="capitalize">
							{hoveredDatapoint.type} , #{hoveredDatapointIndex}
						</h6>
						<p class="text-xs font-semibold">
							<span>{hoveredDatapoint.from}</span>
							<span class=" font-light">
								{hoveredDatapoint.text}
							</span>
						</p>
						<span>
							<p class="text-xs font-light">
								{new Date(hoveredDatapoint.date).toLocaleString('default', {
									day: '2-digit',
									month: 'short',
									year: '2-digit'
								})}
							</p>
							<p class=" text-xs font-light">
								Replied in
								{prettyMilliseconds(hoveredDatapoint.timeDelta)}
							</p>
						</span>
					{/if}
				{/key}
			</div>
		</div>

		<svg
			width={clw}
			height={clh}
			viewBox={`${[0, 0, clw, clh]}`}
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

			{#if xScale && yScale && xTicks && yTicks}
				<!-- Data points -->

				{#each displayedData as d, i (d.id)}
					<DataPoint
						bind:d
						on:mouseover={() => {
							hoveredDatapoint = d;
							hoveredDatapointIndex = i;
						}}
					/>
				{/each}
			{/if}
		</svg>
	</div>

	<div class="justify-end -m-[100vh] ml-[60%] w-[40%] h-full bg-stone-100 flex flex-col">
		<div class="sticky top-0 right-0 text-right px-8 py-4 {debug ? 'flex' : 'hidden'} flex-col">
			<small class="text-xs">Current Story Step : {currentStep ?? 'loading'}</small>
			<small class="text-xs">Dataset size : {datas ? datas.length : 'loading'}</small>
			<small class="text-xs">Staged Data : {stagedData ? stagedData.length : 'empty'}</small>
		</div>
		<Scrolly bind:value={currentStep}>
			<div class="h-[80vh] p-10 mt-24 flex place-items-center justify-center">
				<div class="rounded-md">
					<Title />

					{#if yScale}
						<div class="text-md font-semibold text-stone-500 flex flex-col">
							<div class="flex flex-row gap-2 items-baseline justify-start">
								<span> Between </span>
								<span class="kbd kbd-md relative" style="color: {p2c}">
									{#if !wttm}
										<span
											transition:slide|global={{ delay: 300, duration: 700 }}
											class="absolute -top-3 backdrop-blur-sm p-1 rounded-full"
										>
											<Crown weight="duotone" size={16} />
										</span>
									{/if}
									{yScale.domain()[1]}
								</span>
								&
								<span class="kbd kbd-md relative" style="color: {p1c}">
									{#if wttm}
										<span
											transition:slide|global={{ delay: 300, duration: 700 }}
											class="absolute -top-3 backdrop-blur-sm p-1 rounded-full"
										>
											<Crown weight="duotone" size={16} />
										</span>
									{/if}
									{yScale.domain()[0]}
								</span>
							</div>

							<small class="text-xs py-2">
								We have
								<Countdown digits={`${datas.length}`} />
								total messages of which <br />
								<span style="color: {p1c}">
									<Countdown digits={`${tally[yScale.domain()[0]]['count']}`} color={p1c} />
									were sent by {yScale.domain()[0]}
								</span>
								and
								<span style="color: {p2c}">
									<Countdown digits={`${tally[yScale.domain()[1]]['count']}`} color={p2c} />
									were sent by {yScale.domain()[1]}
								</span>
							</small>
						</div>
						<div class="flex flex-col gap-1">
							<p class="text-xs font-normal text-stone-800">
								<b class="text-stone-600 pb-1">Average response time </b>
								<span class="flex flex-row gap-2">
									<span style="color: {p1c}">
										{yScale.domain()[0]}: <b>{tally[yScale.domain()[0]]['meanText']}</b>
									</span>
									<span style="color: {p2c}">
										{yScale.domain()[1]}: <b>{tally[yScale.domain()[1]]['meanText']}</b>
									</span>
								</span>
							</p>
							<p class="text-xs font-normal text-stone-800">
								<b class="text-stone-600 pb-1"> Voice messages , Pictures , etc : </b>
								<span class="flex flex-row gap-2">
									<span style="color: {p1c}">
										{yScale.domain()[0]} :
										<b>
											{tally[yScale.domain()[0]]['memecount']}
										</b>
									</span>
									<span style="color: {p2c}">
										{yScale.domain()[1]}:
										<b>
											{tally[yScale.domain()[1]]['memecount']}
										</b>
									</span>
								</span>
							</p>
							<p class="text-xs font-normal text-stone-800">
								<b class="text-stone-600 pb-1"> Stickers </b>
								<span class="flex flex-row gap-2">
									<span style="color: {p1c}">
										{yScale.domain()[0]} :
										<b>
											{tally[yScale.domain()[0]]['stickercount']}
										</b>
									</span>
									<span style="color: {p2c}">
										{yScale.domain()[1]}:
										<b>
											{tally[yScale.domain()[1]]['stickercount']}
										</b>
									</span>
								</span>
							</p>
							<p class="text-xs font-normal text-stone-800">
								<b class="text-stone-600 pb-1">Text messages: </b>
								<span class="flex flex-row gap-2">
									<span style="color: {p1c}">
										{yScale.domain()[0]} :
										<b>
											{tally[yScale.domain()[0]]['count'] - tally[yScale.domain()[0]]['memecount']}
										</b>
									</span>
									<span style="color: {p2c}">
										{yScale.domain()[1]}:
										<b>
											{tally[yScale.domain()[1]]['count'] - tally[yScale.domain()[1]]['memecount']}
										</b>
									</span>
								</span>
							</p>
						</div>
					{/if}

					<h5 class="text-stone-400 pt-5">How to read the graph</h5>
					<p class="text-stone-500 text-xs font-light flex flex-col">
						<span>
							The Graph on the left is a Scatter Plot of your messages ( Dots ) , going from
							leftmost (Past) to rightmost (Present)
						</span>
						<span>
							Each of your messages are separated by color, with lines in between each dot
							representing replies to that message ( The bolder the line , The more back and forth
							happening )</span
						>
						<span>
							and non text messages are modelled as <b>small purple dots.</b>
						</span>
						<span
							>The Size of the circle corresponds to <b>speed of reply.</b> ( with delays larger than
							3 days considered in the same light )
						</span>

						<span class="py-3">
							<FileLoader
								bind:stagedData
								on:load={() => {
									if (stagedData) {
										renderCanvas([...stagedData]);
									}
								}}
							/>
						</span>

						<span class="bg-base-300 p-3 rounded-md mt-2">
							<span class="font-semibold block"> Customize the chart </span>
							<div class="flex flex-col justify-center items-center gap-4 p-4">
								<ColorRandomizer {p1c} {p2c} {rerollColors} />
								<OpacitySlider bind:opa />
							</div>
						</span>
					</p>
				</div>
			</div>
			<div class="h-[100vh] p-10 flex place-items-center justify-center mt-24"></div>
		</Scrolly>
	</div>
{/if}
