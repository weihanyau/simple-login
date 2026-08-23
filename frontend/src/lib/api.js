const API = import.meta.env.PUBLIC_API_URL ?? "http://localhost:3001";

export async function api(path, options = {}) {
	const res = await fetch(`${API}${path}`, {
		credentials: "include",
		headers: {
			"Content-Type": "application/json",
			...(options.headers ?? {}),
		},
		...options,
	});
	if (!res.ok) {
		const body = await res.json().catch(() => ({}));
		throw new Error(body.error ?? `Request failed: ${res.status}`);
	}
	return res.json();
}
