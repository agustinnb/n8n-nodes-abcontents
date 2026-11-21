import type { IDataObject, INodeExecutionData, INodeType, INodeTypeDescription, IPollFunctions } from 'n8n-workflow';
import { NodeConnectionTypes } from 'n8n-workflow';
import { api } from './shared';

export class AbContentsTrigger implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'ABContents Trigger',
		name: 'abContentsTrigger',
		icon: { light: 'file:abcontents.svg', dark: 'file:abcontents.dark.svg' },
		group: ['trigger'],
		version: 1,
		description: 'Turn documents into narrated videos with ABContents: starts the workflow when a video ordered with your API key is ready',
		subtitle: 'Video Ready',
		defaults: { name: 'ABContents Trigger' },
		polling: true,
		inputs: [],
		outputs: [NodeConnectionTypes.Main],
		credentials: [{ name: 'abContentsApi', required: true }],
		properties: [{ displayName: 'Event', name: 'event', type: 'options', default: 'videoReady', options: [{ name: 'Video Ready', value: 'videoReady', description: 'A video finished and can be downloaded' }] }],
	};

	async poll(this: IPollFunctions): Promise<INodeExecutionData[][] | null> {
		const state = this.getWorkflowStaticData('node') as { since?: string; seen?: string[] };
		const manual = this.getMode() === 'manual';
		const since = state.since ?? new Date(Date.now() - 7 * 864e5).toISOString(); // first run: the last week
		const r = await api(this, 'GET', '/api/v1/videos', { qs: { status: 'done', since, limit: manual ? 1 : 50 } });
		const seen = new Set(state.seen ?? []);
		const fresh = ((r.videos as IDataObject[]) || []).filter((v) => manual || !seen.has(v.id as string));
		if (!manual) {
			state.seen = [...seen, ...fresh.map((v) => v.id as string)].slice(-500); // a video is reported once
			if (!state.since) state.since = since;
		}
		return fresh.length ? [this.helpers.returnJsonArray(fresh)] : null;
	}
}
