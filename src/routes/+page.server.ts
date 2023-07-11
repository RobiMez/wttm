// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck

// import * as d3 from 'd3';
// import { json } from '@sveltejs/kit';/
import { readFile } from 'fs/promises';
import type { PageServerLoad } from './(app)/matter/$types';

export const load: PageServerLoad = async () => {
	const fileContent = await readFile("./static/datasets/outf.json", 'utf-8');
	const cfileContent = await readFile("./static/datasets/colors.json", 'utf-8');
	const jsonData = JSON.parse(fileContent)
	const colors = JSON.parse(cfileContent)
	// Preprocess jsonData to remove objects without a 'from' attribute
	const preprocessedData = jsonData.filter((obj) => 'from' in obj);

	return { jsonData: preprocessedData , colors : colors};
};
