// eslint-disable-next-line @typescript-eslint/ban-ts-comment
//@ts-nocheck

// import * as d3 from 'd3';
// import { json } from '@sveltejs/kit';/
import { readFile } from 'fs';
import { join } from 'path';

export const load: PageServerLoad = async () => {
	const filePath1 = join(process.cwd(), 'static', 'datasets', 'outf.json');
	const filePath2 = join(process.cwd(), 'static', 'datasets', 'colors.json');

	const fileContent = readFile(filePath1, 'utf-8');
	const cfileContent = readFile(filePath2, 'utf-8');

	const jsonData = JSON.parse(fileContent)
	const colors = JSON.parse(cfileContent)
	// Preprocess jsonData to remove objects without a 'from' attribute
	const preprocessedData = jsonData.filter((obj) => 'from' in obj);

	return { jsonData: preprocessedData, colors: colors };
};
