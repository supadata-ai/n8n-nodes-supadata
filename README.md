# n8n-nodes-supadata

This is an n8n community node that allows you to integrate Supadata into your n8n workflows.

Supadata is a service that provides tools for extracting and analyzing data from YouTube videos, channels, and web pages. With this node, you can easily retrieve video details, transcripts, channel information, and scrape web content directly within your n8n workflows.

Supadata Website: [https://supadata.ai](https://supadata.ai)

[n8n](https://n8n.io/) is a [fair-code licensed](https://docs.n8n.io/reference/license/) workflow automation platform.

[Installation](#installation)  
[Operations](#operations)  
[Credentials](#credentials)  <!-- delete if no auth needed -->  
[Compatibility](#compatibility)  
[Usage](#usage)  <!-- delete if not using this section -->  
[Resources](#resources)  

## Installation

Community Node Installation

- Go to Settings > Community Nodes
- Select Install
- Enter n8n-nodes-supadata in the input field
- Click Install

Manual Installation

- To install this node manually

```bash
npm install n8n-nodes-supadata
```

## Operations

- Get Video Metadata: Retrieve details about a YouTube video.
- Get Transcript: Fetch the transcript of a YouTube video.
- Get Channel Metadata: Retrieve information about a YouTube channel.
- Get Channel Videos: Fetch a list of videos from a specific YouTube channel.
- Get URL Content: Extract data from a web page.

## Credentials

To use this node, you need to authenticate with Supadata AI using an API key. Follow these steps:

- Sign up for an account with Supadata AI and obtain your API key.
- Store your API key securely using environment variables. Never share it or commit it to version control.
- Include the API key in the request headers when making API calls:

```bash
curl -H "x-api-key: YOUR_API_KEY" https://api.supadata.ai/v1/...
```

## Compatibility

_State the minimum n8n version, as well as which versions you test against. You can also include any known version incompatibility issues._

## Usage

1. Create a new workflow in n8n.
2. Add a Supadata node to your workflow.
3. Authenticate using your Supadata API key via n8n’s credentials interface.
4. Select the action you want to perform, and enter the required fields.
5. Execute the node.

## Resources

- [n8n community nodes documentation](https://docs.n8n.io/integrations/community-nodes/)
- [Supadata API Documentation](https://supadata.ai/documentation/getting-started)

## License

[MIT](https://github.com/n8n-io/n8n-nodes-starter/blob/master/LICENSE.md)
