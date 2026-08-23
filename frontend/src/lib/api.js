let token = localStorage.getItem("auth_token");

export function setToken(value) {
	token = value;
	if (value) localStorage.setItem("auth_token", value);
	else localStorage.removeItem("auth_token");
}

export function getToken() {
	return token;
}

export function createApi(baseUrl) {
	const API = baseUrl ?? import.meta.env.PUBLIC_API_URLS?.split(",")[0]?.trim() ?? "http://localhost:3001";

	return async function api(path, options = {}) {
		const res = await fetch(`${API}${path}`, {
			headers: {
				"Content-Type": "application/json",
				...(token ? { Authorization: `Bearer ${token}` } : {}),
				...(options.headers ?? {}),
			},
			...options,
		});
		if (!res.ok) {
			const body = await res.json().catch(() => ({}));
			throw new Error(body.error ?? `Request failed: ${res.status}`);
		}
		return res.json();
	};
}
