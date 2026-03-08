// Cloudflare API v4 base client using the bearer token from .env
const CF_BASE = "https://api.cloudflare.com/client/v4";
export async function cfFetch(path, options) {
    const token = process.env.CLOUDFLARETOKEN;
    if (!token)
        throw new Error("Missing CLOUDFLARETOKEN environment variable");
    const res = await fetch(`${CF_BASE}${path}`, {
        ...options,
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            ...(options?.headers ?? {}),
        },
    });
    const body = (await res.json());
    if (!body.success) {
        throw new Error(`Cloudflare API error: ${body.errors.map((e) => e.message).join(", ")}`);
    }
    return body.result;
}
// Return all zones the token has access to
export async function listZones() {
    const result = await cfFetch("/zones?per_page=50");
    return result;
}
//# sourceMappingURL=client.js.map