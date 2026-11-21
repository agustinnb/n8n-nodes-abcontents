import type { IExecuteFunctions, ILoadOptionsFunctions, IPollFunctions, IDataObject, IHttpRequestMethods, JsonObject } from 'n8n-workflow';
import { NodeApiError } from 'n8n-workflow';

export const BASE = 'https://abcontents.com';
type Ctx = IExecuteFunctions | ILoadOptionsFunctions | IPollFunctions;

// One place for every call: authentication from the credential, and errors that say what happened and what to do.
export async function api(ctx: Ctx, method: IHttpRequestMethods, url: string, opts: { qs?: IDataObject; body?: unknown } = {}): Promise<IDataObject> {
	let body = opts.body as IDataObject | Buffer | undefined;
	const headers: IDataObject = {};
	if (opts.body instanceof FormData) {
		// n8n's request helper only understands the form-data package, so the multipart body is serialized here
		const r = new Response(opts.body);
		body = Buffer.from(await r.arrayBuffer());
		headers['Content-Type'] = r.headers.get('content-type');
	}
	try {
		return (await ctx.helpers.httpRequestWithAuthentication.call(ctx, 'abContentsApi', {
			method, url: BASE + url, qs: opts.qs, body, headers, json: true,
		})) as IDataObject;
	} catch (error) {
		const e = error as JsonObject & { httpCode?: string; description?: string };
		const code = String(e.httpCode ?? '');
		const hint =
			code === '401' ? 'The API key was refused. Check the ABContents API credential (it starts with abc_).'
			: code === '402' ? 'Not enough tokens on this key. Top it up at https://abcontents.com/api-access.'
			: code === '413' ? 'The files are too large. Keep each file under 20 MB and the whole order under 100 MB.'
			: code === '429' ? 'Too many requests. Wait a minute and run the node again.'
			: undefined;
		throw new NodeApiError(ctx.getNode(), e, hint ? { message: hint } : undefined);
	}
}
