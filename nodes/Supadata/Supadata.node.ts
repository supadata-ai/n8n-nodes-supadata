import {
	type IExecuteFunctions,
	type IDataObject,
	type INodeExecutionData,
	type INodeType,
	type INodeTypeDescription,
	type IHttpRequestMethods,
} from 'n8n-workflow';

import { supadataApiRequest } from './GenericFunctions';

export class Supadata implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Supadata',
		name: 'supadata',
		icon: 'file:Supadata.svg',
		group: ['input'],
		version: 1,
		description: 'Access Supadata API to fetch YouTube and web data',
		subtitle: '={{$parameter["operation"] + ": " + $parameter["resource"]}}',
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
					{ name: 'YouTube', value: 'youtube' },
					{ name: 'Web', value: 'webScrape' },
				],
				default: 'youtube',
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
					{
						name: 'Get Transcript',
						value: 'getTranscript',
						description: 'Get the transcript of a YouTube video',
						action: 'Get video transcript',
					},
					{
						name: 'Get Video',
						value: 'getVideo',
						description: 'Get details of a YouTube video',
						action: 'Get video details',
					},
				],
				default: 'getVideo',
			},

			// YouTube Video Fields
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
				description: 'The ID or URL of the YouTube video',
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

				if (resource === 'youtube') {
					if (operation === 'getVideo') {
						const videoIdentifier = this.getNodeParameter('videoId', i) as string;
						responseData = await supadataApiRequest.call(
							this,
							'GET' as IHttpRequestMethods,
							'/youtube/video',
							{},
							{ id: videoIdentifier },
						);
					} else if (operation === 'getTranscript') {
						const videoInput = this.getNodeParameter('videoId', i) as string;
						const qs: IDataObject = {
							text: this.getNodeParameter('text', i) as boolean,
						};

						// Check if input is a URL  or ID
						if (videoInput.includes('youtube.com/') || videoInput.includes('youtu.be/')) {
							qs.url = videoInput;
						} else {
							qs.videoId = videoInput;
						}

						responseData = await supadataApiRequest.call(
							this,
							'GET' as IHttpRequestMethods,
							'/youtube/transcript',
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
