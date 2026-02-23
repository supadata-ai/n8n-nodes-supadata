import type {
	IDataObject,
	IExecuteFunctions,
	IHookFunctions,
	JsonObject,
	IHttpRequestMethods,
	IHttpRequestOptions,
} from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

/**
 * Make an API request to Supadata
 */
export async function supadataApiRequest(
	this: IHookFunctions | IExecuteFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	query: IDataObject = {},
): Promise<any> {
	const options: IHttpRequestOptions = {
		method,
		headers: {
			'user-agent': 'n8n',
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
		qs: query,
		url: `https://api.supadata.ai/v1${endpoint}`,
		json: true,
	};

	// Add body to the request if it exists
	if (Object.keys(body).length > 0) {
		options.body = body;
	}

	try {
		// Make the API request with authentication
		return await this.helpers.httpRequestWithAuthentication.call(this, 'supadataApi', options);
	} catch (error) {
		// Handle errors using NodeApiError
		throw new NodeApiError(this.getNode(), error as JsonObject);
	}
}

/**
 * Fetch all items from a paginated Supadata API endpoint
 */
export async function supadataApiRequestAllItems(
	this: IHookFunctions | IExecuteFunctions,
	propertyName: string,
	method: IHttpRequestMethods,
	endpoint: string,
	body: IDataObject = {},
	query: IDataObject = {},
): Promise<any> {
	const returnData: IDataObject[] = [];

	let responseData;

	do {
		// Make the API request
		responseData = await supadataApiRequest.call(this, method, endpoint, body, query);
		// Add the retrieved items to the returnData array
		if (responseData[propertyName]) {
			returnData.push(...responseData[propertyName]);
		}

		// Update the query for the next page (if pagination exists)
		query = {}; // Clear query parameters for subsequent requests
	} while (responseData.next); // Continue until there are no more pages

	return returnData;
}

/**
 * Poll a Supadata extract job until completion or timeout
 */
export async function supadataApiPollExtractJob(
	this: IHookFunctions | IExecuteFunctions,
	jobId: string,
	pollIntervalSeconds: number = 5,
	maxWaitTimeSeconds: number = 300,
): Promise<any> {
	const startTime = Date.now();
	const maxWaitMs = maxWaitTimeSeconds * 1000;
	const pollIntervalMs = pollIntervalSeconds * 1000;

	while (Date.now() - startTime < maxWaitMs) {
		const response = await supadataApiRequest.call(
			this,
			'GET' as IHttpRequestMethods,
			`/extract/${jobId}`,
		);

		if (response.status === 'completed') {
			return response;
		}

		if (response.status === 'failed') {
			const errorMessage = response.error?.message || 'Extract job failed';
			throw new NodeApiError(this.getNode(), {
				message: errorMessage,
				description: `Extract job ${jobId} failed`,
			} as JsonObject);
		}

		await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
	}

	throw new NodeApiError(this.getNode(), {
		message: `Extract job timed out after ${maxWaitTimeSeconds} seconds`,
		description: `Job ${jobId} did not complete within the configured wait time`,
	} as JsonObject);
}
