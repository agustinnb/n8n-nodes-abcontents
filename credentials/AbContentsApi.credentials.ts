import type { IAuthenticateGeneric, Icon, ICredentialTestRequest, ICredentialType, INodeProperties } from 'n8n-workflow';

export class AbContentsApi implements ICredentialType {
	name = 'abContentsApi';
	displayName = 'ABContents API';
	icon: Icon = { light: 'file:../nodes/AbContents/abcontents.svg', dark: 'file:../nodes/AbContents/abcontents.dark.svg' };
	documentationUrl = 'https://abcontents.com/api-access';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: { password: true },
			default: '',
			required: true,
			description: 'Your ABContents API key (starts with abc_). Buy one at https://abcontents.com/api-access.',
		},
	];
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: { headers: { Authorization: '=Bearer {{$credentials.apiKey}}' } },
	};
	test: ICredentialTestRequest = {
		request: { baseURL: 'https://abcontents.com', url: '/api/v1/balance' },
	};
}
