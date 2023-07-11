import mongoose from 'mongoose';
import { config } from 'dotenv';

config();

export let database: mongoose.mongo.Db ;

export const connect = async () => {
	if (mongoose.connection.readyState === 0) {
		const LOCAL_URI = 'mongodb://127.0.0.1:27017/ss';
		const remoteUri = process.env.CONN_URL;
		// Connect with env as priority then local if no env
		const uri = remoteUri ?? LOCAL_URI;

		if (remoteUri && !uri.includes('127.0.0.1')) {
			console.log('Attempting to connect to remote MongoDB URL specified in .env');
		} else {
			console.log('No remote MongoDB URL found in .env, attempting to connect to local database');
		}

		try {
			await mongoose.connect(uri);
			console.log(`Mongoose has connected to MongoDB database at ${uri}`);
			database = mongoose.connection.db;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		} catch (err: any) {
			if (err.code === 'ECONNREFUSED') {
				console.error('Connection to remote MongoDB URL refused, attempting local database');
				await mongoose.connect(LOCAL_URI);
				console.log(
					`Mongoose has connected to MongoDB database at ${LOCAL_URI} after remote refuse`
				);
			} else {
				console.error(err);
			}
		}

		mongoose.connection.on('error', (err) => {
			console.error('Mongoose connection error:', err);
		});

		return mongoose.connection;
	} else {
		return mongoose.connection;
	}
};

await connect();

// TODO: This can be refactored by using the toJSON: { virtuals: true }, option
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const pojoify = (nonpojo: any) => {
	return JSON.parse(JSON.stringify(nonpojo));
};
