import type { IDataObject, JsonObject, IExecuteFunctions, ILoadOptionsFunctions, INodeExecutionData, INodePropertyOptions, INodeType, INodeTypeDescription } from 'n8n-workflow';
import { NodeApiError, NodeConnectionTypes, NodeOperationError } from 'n8n-workflow';
import { api } from './shared';

const PURPOSES = [
	['ad', 'Promote a Product or Service', 'marketing'], ['brand', 'Present a Business', 'marketing'], ['announce', 'Announce Something', 'marketing'], ['realestate', 'Show a Property', 'marketing'],
	['lesson', 'Explain a Topic or a Lesson', 'topic'], ['summary', 'Summarize a Document', 'topic'], ['social', 'Tips or Social Media Content', 'topic'], ['training', 'Training or Onboarding', 'topic'],
] as const;
const VOICES = ['f', 'f2', 'f3', 'f4', 'f5', 'm', 'm2', 'm3', 'm4', 'm5'];
const show = (operation: string[]) => ({ show: { operation } });

export class AbContents implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'ABContents',
		name: 'abContents',
		icon: { light: 'file:abcontents.svg', dark: 'file:abcontents.dark.svg' },
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Turn documents, websites or a short brief into narrated videos with captions and music, paid per video from a prepaid API key',
		defaults: { name: 'ABContents' },
		inputs: [NodeConnectionTypes.Main],
		outputs: [NodeConnectionTypes.Main],
		usableAsTool: true,
		credentials: [{ name: 'abContentsApi', required: true }],
		properties: [
			{
				displayName: 'Operation', name: 'operation', type: 'options', noDataExpression: true, default: 'create',
				options: [
					{ name: 'Create Video', value: 'create', action: 'Create a video', description: 'Order a video from files, a website or a brief' },
					{ name: 'Get Balance', value: 'balance', action: 'Get the token balance', description: 'Tokens left on the API key' },
					{ name: 'Get Quote', value: 'quote', action: 'Get a price quote', description: 'Price and wait time for a style and length, before ordering' },
					{ name: 'Get Video', value: 'get', action: 'Get a video', description: 'Status of a video and, when done, its download link' },
					{ name: 'List Styles', value: 'styles', action: 'List the video styles', description: 'All styles with their 2D/3D dimension and price for 60 seconds' },
				],
			},
			{ displayName: 'Brief', name: 'brief', type: 'string', typeOptions: { rows: 3 }, default: '', displayOptions: show(['create']), description: 'What the video is about, up to 600 characters. Optional when you send files or a website.' },
			{ displayName: 'Style Name or ID', name: 'style', type: 'options', typeOptions: { loadOptionsMethod: 'getStyles' }, default: 'kinetic-type', displayOptions: show(['create', 'quote']), description: 'Choose from the list, or specify an ID using an <a href="https://docs.n8n.io/code/expressions/">expression</a>' },
			{ displayName: 'Length (Seconds)', name: 'durationS', type: 'number', typeOptions: { minValue: 30, maxValue: 300 }, default: 60, displayOptions: show(['create', 'quote']), description: 'From 30 to 300 seconds' },
			{ displayName: 'Video Type', name: 'purpose', type: 'options', default: 'ad', displayOptions: show(['create']), options: PURPOSES.map(([value, name]) => ({ name, value })), description: 'Guides the script and decides if it sells (marketing) or explains (topic)' },
			{ displayName: 'Language', name: 'lang', type: 'options', default: 'en', displayOptions: show(['create']), options: [{ name: 'English', value: 'en' }, { name: 'French', value: 'fr' }, { name: 'Portuguese', value: 'pt' }, { name: 'Spanish', value: 'es' }], description: 'Language of the narration, script and captions' },
			{ displayName: 'Size', name: 'format', type: 'options', default: '9:16', displayOptions: show(['create']), options: [{ name: 'Vertical 9:16', value: '9:16' }, { name: 'Portrait 4:5', value: '4:5' }, { name: 'Square 1:1', value: '1:1' }, { name: 'Horizontal 16:9', value: '16:9' }] },
			{ displayName: 'Input Binary Fields', name: 'binaryFields', type: 'string', default: '', displayOptions: show(['create']), placeholder: 'data, data2', description: 'Comma-separated binary fields of the input item to send as source files (PDF, Word, Excel, PowerPoint, text or images, up to 9)' },
			{
				displayName: 'Additional Fields', name: 'extra', type: 'collection', placeholder: 'Add Field', default: {}, displayOptions: show(['create']),
				options: [
					{ displayName: 'Brand Name', name: 'brandName', type: 'string', default: '' },
					{ displayName: 'Email', name: 'email', type: 'string', placeholder: 'name@email.com', default: '', description: 'Where to send the link when the video is ready' },
					{ displayName: 'Music', name: 'music', type: 'options', default: 'auto', options: ['auto', 'none', 'ambient', 'chip', 'cine', 'funk', 'lofi', 'lux', 'pop', 'quirky', 'synth', 'tension'].map((m) => ({ name: m === 'auto' ? 'Chosen for You' : m === 'none' ? 'No Music' : m[0].toUpperCase() + m.slice(1), value: m })) },
					{ displayName: 'Voice', name: 'voice', type: 'options', default: 'f', options: VOICES.map((v) => ({ name: `${v.startsWith('f') ? 'Female' : 'Male'} ${v.length > 1 ? v.slice(1) : 1}`, value: v })) },
					{ displayName: 'Website URL', name: 'siteUrl', type: 'string', default: '', placeholder: 'https://example.com', description: 'A public page to make the video from' },
				],
			},
			{ displayName: 'Video ID', name: 'videoId', type: 'string', required: true, default: '', displayOptions: show(['get']), description: 'The ID returned by Create Video' },
		],
	};

	methods = {
		loadOptions: {
			async getStyles(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const r = await api(this, 'GET', '/api/v1/styles');
				return ((r.styles as IDataObject[]) || []).map((s) => ({ name: `${s.name} (${String(s.dimension).toUpperCase()})`, value: s.id as string, description: s.description as string }));
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const out: INodeExecutionData[] = [];
		for (let i = 0; i < items.length; i++) {
			try {
				const op = this.getNodeParameter('operation', i) as string;
				let json: IDataObject;
				if (op === 'balance') json = await api(this, 'GET', '/api/v1/balance');
				else if (op === 'styles') json = await api(this, 'GET', '/api/v1/styles');
				else if (op === 'quote') json = await api(this, 'GET', '/api/v1/quote', { qs: { style: this.getNodeParameter('style', i), duration: this.getNodeParameter('durationS', i) } });
				else if (op === 'get') json = await api(this, 'GET', `/api/v1/videos/${encodeURIComponent(this.getNodeParameter('videoId', i) as string)}`);
				else {
					const purpose = this.getNodeParameter('purpose', i) as string;
					const extra = this.getNodeParameter('extra', i, {}) as IDataObject;
					const fd = new FormData();
					const fields: IDataObject = { kind: PURPOSES.find((p) => p[0] === purpose)?.[2] ?? 'marketing', purpose, lang: this.getNodeParameter('lang', i), style: this.getNodeParameter('style', i), durationS: this.getNodeParameter('durationS', i), format: this.getNodeParameter('format', i), brief: this.getNodeParameter('brief', i), ...extra };
					for (const [k, v] of Object.entries(fields)) if (v !== '' && v !== undefined) fd.append(k, String(v));
					const names = (this.getNodeParameter('binaryFields', i) as string).split(',').map((s) => s.trim()).filter(Boolean);
					for (const name of names) {
						const bin = this.helpers.assertBinaryData(i, name);
						const buf = await this.helpers.getBinaryDataBuffer(i, name);
						fd.append('files', new Blob([new Uint8Array(buf)], { type: bin.mimeType }), bin.fileName ?? name);
					}
					if (!names.length && !fields.brief && !extra.siteUrl) throw new NodeOperationError(this.getNode(), 'Nothing to make the video from', { itemIndex: i, description: 'Fill Brief, set Website URL in Additional Fields, or name the input binary fields that hold your files.' });
					json = await api(this, 'POST', '/api/v1/videos', { body: fd });
				}
				out.push({ json, pairedItem: { item: i } });
			} catch (error) {
				if (this.continueOnFail()) { out.push({ json: { error: (error as Error).message }, pairedItem: { item: i } }); continue; }
				if (error instanceof NodeApiError) throw new NodeApiError(this.getNode(), error as unknown as JsonObject, { message: error.message, description: error.description ?? undefined, itemIndex: i });
				throw new NodeOperationError(this.getNode(), error as Error, { itemIndex: i });
			}
		}
		return [out];
	}
}
