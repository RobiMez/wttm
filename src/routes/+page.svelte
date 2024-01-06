<script lang="ts">
	//@ts-nocheck
	import * as d3 from 'd3';

	import { onMount } from 'svelte';
	import { slide } from 'svelte/transition';

	import Scrolly from '$lib/components/Scrolly.svelte';
	import Title from '$lib/components/Title.svelte';
	import Countdown from '$lib/components/Countdown.svelte';

	import random from 'canvas-sketch-util/random';
	import Color from 'canvas-sketch-util/color';

	import Crown from 'phosphor-svelte/lib/Crown';
	import OpacitySlider from '$lib/components/RightSideControls/OpacitySlider.svelte';
	import ColorRandomizer from '$lib/components/RightSideControls/ColorRandomizer.svelte';

	import { debounce } from 'lodash-es';
	import NoMobileTabPage from '$lib/components/NoMobileTabPage.svelte';

	random.setSeed('robi');
	let debug = false;
	export let data;

	let datas;
	let currentStep;
	let xScale, yScale, rScale, xTicks, yTicks;
	let lineGenerator, formatTick, textAreaInput, parsedTextAreaInput;
	let ptaivAsTelegramExport = false;
	let p1n = 'Mom';
	let p1c, p2c;
	let tally;

	if (datas) {
		p1n = datas[0].from;
	}

	let clw = 1080;
	let clh = 1080;

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

	const findReplyDataPoint = (replyToMessageId) => {
		let de = datas.find((d) => d.id === replyToMessageId) ?? [];
		return de;
	};

	function randomChoice(array) {
		const randomIndex = Math.floor(Math.random() * array.length);
		return array[randomIndex];
	}
	let palette;
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
	};
	let opa = 30;

	const renderCanvas = (ndata) => {
		if (!ndata) {
			datas = data['jsonData'];
		}

		// Preprocess //

		// Parse the date strings into JavaScript Date objects
		datas = datas.filter((obj) => 'from' in obj);

		datas.forEach((d) => {
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

	let debounced = debounce(renderCanvas, 500);
	$: if (winW || winH) debounced();

	const formatTimedelta = (td) => {
		td = Math.floor(td / 1000); // Convert milliseconds to seconds
		const hours = Math.floor(td / 3600);
		const minutes = Math.floor((td % 3600) / 60);
		const seconds = Math.floor(td % 60);

		return `${hours} hr, ${minutes} m, ${seconds} s`;
	};
	let wttm: Boolean;

	let calculateTallies = () => {
		tally = {};

		for (let i = 0; i < datas.length; i++) {
			const from = datas[i].from;
			const timedelta = parseInt(datas[i].timeDelta);
			const meme = datas[i].text == '';
			const isSticker = !!datas[i].sticker_emoji;

			if (tally.hasOwnProperty(from)) {
				tally[from].count++;
				tally[from].sum += timedelta;
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

	let loadStagedData = () => {
		datas = stagedData;
		stagedData = undefined;
		textAreaInput = '';
		parsedTextAreaInput = null;
		ptaivAsTelegramExport = false;
		rerollColors();
		renderCanvas(datas);
		rerollColors();
	};

	let xAccessor = (d) => new Date(d.date).getTime();
	let yAccessor = (d) => d.from;
	let rAccessor = (d) => d.timeDelta;

	let xAccessorScaled = (d) => xScale(xAccessor(d)) + random.value();
	let yAccessorScaled = (d) =>
		yScale(yAccessor(d)) + yScale.bandwidth() / 2 - random.value() * 200 + 100;
	let rAccessorScaled = (d) => rScale(rAccessor(d));

	let keyAccessor = (_, i) => i;
	let stagedData;

	const handleFileChange = (event) => {
		let files = event.target.files;

		for (let f of files) {
			let reader = new FileReader();

			reader.onload = function (e) {
				let jsonText = e.target.result;
				try {
					parsedTextAreaInput = JSON.parse(jsonText);
					if (parsedTextAreaInput.type == 'personal_chat' && parsedTextAreaInput.messages.length) {
						ptaivAsTelegramExport = true;
						stagedData = parsedTextAreaInput.messages;
					} else {
						parsedTextAreaInput = 'invalidExport';
						stagedData = undefined;
						event.target.value = null;
					}
				} catch (error) {
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
		try {
			fetch('https://loglib.io/api/v1/visitor', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json'
				},
				body: JSON.stringify({
					apiKey: 'site_kqelualctk',
					orderBy: {
						createdAt: 'desc'
					},
					where: {},
					include: {
						pageview: true,
						event: true,
						session: true
					}
				})
			})
				.then((response) => {
					return response.json();
				})
				.then((data) => {
					// Process the response data here
					console.log(data);
				})
				.catch((error) => {
					// Handle any errors that occur during the request
					console.error(error);
				});
		} catch (error) {
			console.log('error', error);
		}
	});
	let winH;
	let winW;
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
			<small class="text-xs"
				>textarea : {textAreaInput ? parsedTextAreaInput.length : 'empty'}</small
			>
			<small class="text-xs"
				>parsedTextAreaInputValidAsTelegramExport : {ptaivAsTelegramExport}</small
			>
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
						<span class="bg-base-300 p-3 rounded-md mt-2">
							<span class="font-semibold block"> Want to load your own data ? </span>
							Export any telegram direct message as a json and select the results.json file.

							<div class="flex flex-row justify-around items-center align-baseline mt-2 gap-2">
								<input
									type="file"
									accept=".json"
									id="recipients_file"
									on:change={handleFileChange}
									style="input"
									class="text-stone-800 bg-stone-200 file-input file-input-sm rounded-md input-primary {stagedData
										? 'file-input-success'
										: ''} file-input-bordered"
								/>
								<button
									on:click={loadStagedData}
									class="
								btn btn-sm text-sm
							{stagedData == undefined ? 'btn-disabled btn-outline' : 'btn-success'}
							{ptaivAsTelegramExport ? 'btn-success' : 'btn-disabled btn-outline'}
							"
								>
									Load {stagedData ? stagedData.length + ' items' : 'Data'}
								</button>
							</div>
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
			<div class="h-[100vh] p-10 flex place-items-center justify-center mt-24">
				<div class=" text-stone-800 rounded-xl">
					<!-- svelte-ignore a11y-click-events-have-key-events -->
					<button on:click={() => (debug = !debug)} class="text-2xl font-black text-stone-800 mb-8">
						New site , Who this ?
					</button>
					<hr />
					<div class="join join-vertical w-full">
						<div class="collapse collapse-arrow join-item border border-base-300">
							<input type="radio" name="my-accordion-4" checked="checked" />
							<div class="collapse-title text-xl font-medium">
								Who are you & why did you do this ?
							</div>
							<div class="collapse-content">
								Hi im robi , you can find my other works at <a class="link" href="https://robi.work"
									>robi.work</a
								>
								<small class="mb-4 block">as for why : </small>

								<img
									src="https://i.imgur.com/z435fsM.png"
									class="aspect-auto mx-auto"
									width="200"
									alt=""
								/>
							</div>
						</div>
						<div class="collapse collapse-arrow join-item border border-base-300">
							<input type="radio" name="my-accordion-4" />
							<div class="collapse-title text-xl font-medium">I wanna throw some 💵 at you.</div>
							<div class="collapse-content">
								<div class="flex flex-col justify-center items-center">
									<img
										src="https://i.imgur.com/iXmEPQb.png"
										width="300"
										height="300"
										alt="telebirr"
									/>
									<a href="https://ko-fi.com/K3K74LSLU" target="_blank"
										><img
											height="36"
											style="border:0px;height:36px;"
											src="https://storage.ko-fi.com/cdn/kofi2.png?v=3"
											border="0"
											alt="Buy Me a Coffee at ko-fi.com"
										/></a
									>
									<p class="text-center my-3">Thanks , yeet it to telebirr / ko-fi.</p>
								</div>
							</div>
						</div>
						<div class="collapse collapse-arrow join-item border border-base-300">
							<input type="radio" name="my-accordion-4" />
							<div class="collapse-title text-xl font-medium">But what about my data and stuff</div>
							<div class="collapse-content">
								Idk 🤷‍♂️ use it offline or sth , you can contact me to check out the code.
							</div>
						</div>
						<div class="collapse collapse-arrow join-item border border-base-300">
							<input type="radio" name="my-accordion-4" />
							<div class="collapse-title text-xl font-medium">How do i load data ?</div>
							<div class="collapse-content">
								<div class="flex flex-row justify-center">
									<img width="300" src="https://i.imgur.com/mqKl1X8.png" alt="" />
									<img width="200" src="https://i.imgur.com/9fglCwd.png" class="inline" alt="" />
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</Scrolly>
	</div>
{/if}

<style>
	circle {
		transition-property: all;
		transition-duration: 0.9s;
		transition-timing-function: ease;
		transition-property: color none;
	}
</style>
