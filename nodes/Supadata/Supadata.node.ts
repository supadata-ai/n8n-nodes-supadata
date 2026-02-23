import {
	type IExecuteFunctions,
	type IDataObject,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	type IHttpRequestMethods,
} from 'n8n-workflow';

import { supadataApiRequest, supadataApiPollExtractJob } from './GenericFunctions';

export class Supadata implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Supadata',
		name: 'supadata',
		icon: 'file:supadata.svg',
		group: ['input'],
		version: 1,
		description: 'Access Supadata API to fetch video metadata, transcripts, and web data from multiple platforms',
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
		documentationUrl: 'https://docs.supadata.ai',
		defaults: {
			name: 'Supadata',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'supadataApi',
				required: true,
			},
		],
		properties: [
			// ----------------------------------------------------------------
			//         Resource to Operate on
			// ----------------------------------------------------------------
			{
				displayName: 'Resource',
				name: 'resource',
				type: 'options',
				noDataExpression: true,
				options: [
					{ name: 'Extract', value: 'extract' },
					{ name: 'Media', value: 'media' },
					{ name: 'YouTube', value: 'youtube' },
					{ name: 'Web', value: 'webScrape' },
				],
				default: 'media',
			},

			// --------------------------------------------------------------------------------------------------------
			//         Extract Operations (AI-powered structured data extraction)
			// --------------------------------------------------------------------------------------------------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['extract'],
					},
				},
				options: [
					{
						name: 'Extract Data',
						value: 'extractData',
						description: 'Extract structured data from a video using AI',
						action: 'Extract structured data from a video',
					},
				],
				default: 'extractData',
			},

			// Extract Fields
			{
				displayName: 'URL',
				name: 'extractUrl',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['extract'],
						operation: ['extractData'],
					},
				},
				placeholder: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
				description: 'The URL of the video to extract data from',
			},
			{
				displayName: 'Input Mode',
				name: 'extractInputMode',
				type: 'options',
				options: [
					{
						name: 'Prompt',
						value: 'prompt',
						description: 'Describe what to extract in natural language',
					},
					{
						name: 'Schema',
						value: 'schema',
						description: 'Provide a JSON Schema defining the output structure',
					},
					{
						name: 'Prompt and Schema',
						value: 'both',
						description: 'Provide both a prompt and a JSON Schema',
					},
				],
				default: 'prompt',
				displayOptions: {
					show: {
						resource: ['extract'],
						operation: ['extractData'],
					},
				},
				description: 'How to specify what data to extract',
			},
			{
				displayName: 'Prompt',
				name: 'extractPrompt',
				type: 'string',
				typeOptions: {
					rows: 4,
				},
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['extract'],
						operation: ['extractData'],
						extractInputMode: ['prompt', 'both'],
					},
				},
				placeholder: 'Extract the main topics discussed, key quotes, and any statistics mentioned',
				description: 'Natural language description of what data to extract from the video',
			},
			{
				displayName: 'Schema',
				name: 'extractSchema',
				type: 'json',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['extract'],
						operation: ['extractData'],
						extractInputMode: ['schema', 'both'],
					},
				},
				description: 'JSON Schema defining the structure of the extracted data',
			},
			{
				displayName: 'Options',
				name: 'extractOptions',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				displayOptions: {
					show: {
						resource: ['extract'],
						operation: ['extractData'],
					},
				},
				options: [
					{
						displayName: 'Max Wait Time (Seconds)',
						name: 'maxWaitTime',
						type: 'number',
						default: 300,
						typeOptions: {
							minValue: 30,
							maxValue: 600,
						},
						description: 'Maximum time in seconds to wait for the extraction to complete',
					},
					{
						displayName: 'Poll Interval (Seconds)',
						name: 'pollInterval',
						type: 'number',
						default: 5,
						typeOptions: {
							minValue: 2,
							maxValue: 30,
						},
						description: 'How often to check for results (in seconds)',
					},
				],
			},

			// --------------------------------------------------------------------------------------------------------
			//         Media Operations (Universal - works across platforms)
			// --------------------------------------------------------------------------------------------------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['media'],
					},
				},
				options: [
					{
						name: 'Get Metadata',
						value: 'getMetadata',
						description: 'Get metadata of a video from multiple platforms (YouTube, TikTok, Instagram, Twitter)',
						action: 'Get metadata',
					},
					{
						name: 'Get Transcript',
						value: 'getTranscript',
						description: 'Get the transcript of a video from multiple platforms (YouTube, TikTok, etc.)',
						action: 'Get transcript',
					},
				],
				default: 'getMetadata',
			},

			// Media Fields
			{
				displayName: 'Video URL',
				name: 'videoUrl',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['media'],
						operation: ['getMetadata', 'getTranscript'],
					},
				},
				placeholder: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
				description: 'The URL of the video (supports YouTube, TikTok, Instagram, Twitter, and other platforms)',
			},
			{
				displayName: 'Return as Plain Text',
				name: 'text',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						resource: ['media'],
						operation: ['getTranscript'],
					},
				},
				description: 'Whether to return the transcript as plain text',
			},
			{
				displayName: 'Language',
				name: 'lang',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['media'],
						operation: ['getTranscript'],
					},
				},
				placeholder: 'en',
				description: 'Preferred language code (ISO 639-1). If not provided or unavailable, defaults to first available language.',
			},
			{
				displayName: 'Mode',
				name: 'mode',
				type: 'options',
				options: [
					{
						name: 'Auto',
						value: 'auto',
						description: 'Try native transcript, fallback to AI generation if unavailable',
					},
					{
						name: 'Native',
						value: 'native',
						description: 'Only fetch existing transcript from the platform',
					},
					{
						name: 'Generate',
						value: 'generate',
						description: 'Always generate transcript using AI',
					},
				],
				default: 'auto',
				displayOptions: {
					show: {
						resource: ['media'],
						operation: ['getTranscript'],
					},
				},
				description: 'The mode to use for transcript extraction',
			},

			// --------------------------------------------------------------------------------------------------------
			//         YouTube Operations
			// --------------------------------------------------------------------------------------------------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['youtube'],
					},
				},
				options: [
					{
						name: 'Get Channel',
						value: 'getChannel',
						description: 'Get details of a YouTube channel',
						action: 'Get channel details',
					},
					{
						name: 'Get Channel Videos',
						value: 'getChannelVideos',
						description: 'Get videos of a YouTube channel',
						action: 'Get channel videos',
					},
					{
						name: 'Get Playlist',
						value: 'getPlaylist',
						description: 'Get details of a YouTube playlist',
						action: 'Get playlist details',
					},
					{
						name: 'Get Playlist Videos',
						value: 'getPlaylistVideos',
						description: 'Get videos of a YouTube playlist',
						action: 'Get playlist videos',
					},
				],
				default: 'getChannel',
			},

			// YouTube Video Fields (kept for backward compatibility)
			{
				displayName: 'Video',
				name: 'videoId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['youtube'],
						operation: ['getVideo', 'getTranscript'],
					},
				},
				placeholder: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
				description: 'The ID or URL of the video (supports YouTube, TikTok, and other platforms)',
			},
			{
				displayName: 'Return as Plain Text',
				name: 'text',
				type: 'boolean',
				default: false,
				displayOptions: {
					show: {
						resource: ['youtube'],
						operation: ['getTranscript'],
					},
				},
				description: 'Whether to return the transcript as plain text',
			},
			{
				displayName: 'Language',
				name: 'lang',
				type: 'string',
				default: '',
				displayOptions: {
					show: {
						resource: ['youtube'],
						operation: ['getTranscript'],
					},
				},
				placeholder: 'en',
				description: 'Preferred language code (ISO 639-1). If not provided or unavailable, defaults to first available language.',
			},
			{
				displayName: 'Mode',
				name: 'mode',
				type: 'options',
				options: [
					{
						name: 'Auto',
						value: 'auto',
						description: 'Try native transcript, fallback to AI generation if unavailable',
					},
					{
						name: 'Native',
						value: 'native',
						description: 'Only fetch existing transcript from the platform',
					},
					{
						name: 'Generate',
						value: 'generate',
						description: 'Always generate transcript using AI',
					},
				],
				default: 'auto',
				displayOptions: {
					show: {
						resource: ['youtube'],
						operation: ['getTranscript'],
					},
				},
				description: 'The mode to use for transcript extraction',
			},

			// YouTube Channel Fields
			{
				displayName: 'Channel',
				name: 'channelId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['youtube'],
						operation: ['getChannel', 'getChannelVideos'],
					},
				},
				placeholder: 'https://www.youtube.com/channel/UC_x5XG1OV2P6uZZ5FSM9Ttw',
				description: 'The ID or URL of the YouTube channel',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				displayOptions: {
					show: {
						resource: ['youtube'],
						operation: ['getChannelVideos'],
					},
				},
				typeOptions: {
					minValue: 1,
					maxValue: 5000, // eslint-disable-line n8n-nodes-base/node-param-type-options-max-value-present
				},
				description: 'Max number of results to return',
			},
			// YouTube Playlist Fields
			{
				displayName: 'Playlist',
				name: 'playlistId',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['youtube'],
						operation: ['getPlaylist', 'getPlaylistVideos'],
					},
				},
				placeholder: 'https://www.youtube.com/playlist?list=PLlaN88a7y2_plecYoJxvRFTLHVbIVAOoc',
				description: 'The ID or URL of the YouTube playlist',
			},
			{
				displayName: 'Limit',
				name: 'limit',
				type: 'number',
				default: 50,
				displayOptions: {
					show: {
						resource: ['youtube'],
						operation: ['getPlaylistVideos'],
					},
				},
				typeOptions: {
					minValue: 1,
					maxValue: 5000, // eslint-disable-line n8n-nodes-base/node-param-type-options-max-value-present
				},
				description: 'Max number of results to return',
			},

			// --------------------------------------------------------------------------------------------------------
			//         Web Scrape Operations
			// --------------------------------------------------------------------------------------------------------
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				displayOptions: {
					show: {
						resource: ['webScrape'],
					},
				},
				options: [
					{
						name: 'Scrape URL',
						value: 'scrapeUrl',
						description: 'Scrape data from a URL',
						action: 'Scrape data from a URL',
					},
				],
				default: 'scrapeUrl',
			},
			{
				displayName: 'URL',
				name: 'url',
				type: 'string',
				default: '',
				required: true,
				displayOptions: {
					show: {
						resource: ['webScrape'],
						operation: ['scrapeUrl'],
					},
				},
				placeholder: 'https://example.com',
				description: 'The URL to scrape',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		for (let i = 0; i < items.length; i++) {
			try {
				const resource = this.getNodeParameter('resource', i) as string;
				const operation = this.getNodeParameter('operation', i) as string;
				let responseData;

				if (resource === 'extract') {
					if (operation === 'extractData') {
						const url = this.getNodeParameter('extractUrl', i) as string;
						const inputMode = this.getNodeParameter('extractInputMode', i) as string;
						const options = this.getNodeParameter('extractOptions', i) as IDataObject;

						const body: IDataObject = { url };

						if (inputMode === 'prompt' || inputMode === 'both') {
							body.prompt = this.getNodeParameter('extractPrompt', i) as string;
						}
						if (inputMode === 'schema' || inputMode === 'both') {
							const schemaValue = this.getNodeParameter('extractSchema', i);
							body.schema = typeof schemaValue === 'string'
								? JSON.parse(schemaValue)
								: schemaValue;
						}

						const createResponse = await supadataApiRequest.call(
							this,
							'POST' as IHttpRequestMethods,
							'/extract',
							body,
						);

						const jobId = createResponse.jobId as string;
						const pollInterval = (options.pollInterval as number) || 5;
						const maxWaitTime = (options.maxWaitTime as number) || 300;

						responseData = await supadataApiPollExtractJob.call(
							this,
							jobId,
							pollInterval,
							maxWaitTime,
						);
					}
				} else if (resource === 'media') {
					if (operation === 'getMetadata') {
						const videoUrl = this.getNodeParameter('videoUrl', i) as string;
						responseData = await supadataApiRequest.call(
							this,
							'GET' as IHttpRequestMethods,
							'/metadata',
							{},
							{ url: videoUrl },
						);
					} else if (operation === 'getTranscript') {
						const videoUrl = this.getNodeParameter('videoUrl', i) as string;
						const qs: IDataObject = {
							url: videoUrl,
							text: this.getNodeParameter('text', i) as boolean,
							mode: this.getNodeParameter('mode', i) as string,
						};

						// Add lang parameter if provided
						const lang = this.getNodeParameter('lang', i) as string;
						if (lang) {
							qs.lang = lang;
						}

						responseData = await supadataApiRequest.call(
							this,
							'GET' as IHttpRequestMethods,
							'/transcript',
							{},
							qs,
						);
					}
				} else if (resource === 'youtube') {
					// Backward compatibility for old YouTube operations
					if (operation === 'getVideo') {
						const videoIdentifier = this.getNodeParameter('videoId', i) as string;
						responseData = await supadataApiRequest.call(
							this,
							'GET' as IHttpRequestMethods,
							'/metadata',
							{},
							{ url: videoIdentifier },
						);
					} else if (operation === 'getTranscript') {
						const videoInput = this.getNodeParameter('videoId', i) as string;
						const qs: IDataObject = {
							url: videoInput,
							text: this.getNodeParameter('text', i) as boolean,
							mode: this.getNodeParameter('mode', i) as string,
						};

						// Add lang parameter if provided
						const lang = this.getNodeParameter('lang', i) as string;
						if (lang) {
							qs.lang = lang;
						}

						responseData = await supadataApiRequest.call(
							this,
							'GET' as IHttpRequestMethods,
							'/transcript',
							{},
							qs,
						);
					} else if (operation === 'getChannel') {
						const channelIdentifier = this.getNodeParameter('channelId', i) as string;
						responseData = await supadataApiRequest.call(
							this,
							'GET' as IHttpRequestMethods,
							'/youtube/channel',
							{},
							{ id: channelIdentifier },
						);
					} else if (operation === 'getChannelVideos') {
						const channelId = this.getNodeParameter('channelId', i) as string;
						const qs: IDataObject = {
							id: channelId,
							limit: this.getNodeParameter('limit', i) as number,
						};

						responseData = await supadataApiRequest.call(
							this,
							'GET' as IHttpRequestMethods,
							'/youtube/channel/videos',
							{},
							qs,
						);
						responseData = responseData.videoIds;
					} else if (operation === 'getPlaylist') {
						const playlistIdentifier = this.getNodeParameter('playlistId', i) as string;
						responseData = await supadataApiRequest.call(
							this,
							'GET' as IHttpRequestMethods,
							'/youtube/playlist',
							{},
							{ id: playlistIdentifier },
						);
					} else if (operation === 'getPlaylistVideos') {
						const playlistIdentifier = this.getNodeParameter('playlistId', i) as string;
						const qs: IDataObject = {
							id: playlistIdentifier,
							limit: this.getNodeParameter('limit', i) as number,
						};

						responseData = await supadataApiRequest.call(
							this,
							'GET' as IHttpRequestMethods,
							'/youtube/playlist/videos',
							{},
							qs,
						);
						responseData = responseData.videoIds;
					}
				} else if (resource === 'webScrape') {
					if (operation === 'scrapeUrl') {
						const url = this.getNodeParameter('url', i) as string;
						responseData = await supadataApiRequest.call(
							this,
							'GET' as IHttpRequestMethods,
							'/web/scrape',
							{},
							{ url },
						);
					}
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(responseData as IDataObject[]),
					{ itemData: { item: i } },
				);
				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					const executionData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray({ error: error.message }),
						{ itemData: { item: i } },
					);
					returnData.push(...executionData);
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
