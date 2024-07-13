/* eslint-disable @typescript-eslint/ban-ts-comment */
//@ts-nocheck

export const doAPIPost = async (route, body, logResp = false) => {
	const response = await fetch(route, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(body)
	});
	const responseJson = await response.json();

	if (logResp) {
		console.log('POST RESP -> ', responseJson);
	}
	return responseJson;
};


export const chunkArray = (array: Array<any>, size: number) => {
	if (!array) return [];
	return Array.from({ length: Math.ceil(array.length / size) }, (v, i) =>
		array.slice(i * size, i * size + size)
	);
};