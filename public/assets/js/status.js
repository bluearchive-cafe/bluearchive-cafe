function fillStatus() {
	if (location.pathname !== '/status') return;

	const statusCache = {
		Apk: { Official: null, Localized: null },
		Localization: { Official: null, Localized: null }
	};

	const groups = Object.keys(statusCache);

	groups.forEach(group => {
		const officialKey = `${group}.Official`;
		const localizedKey = `${group}.Localized`;

		const officialFetch = fetch(`/api/status?type=${group.toLowerCase()}&scope=official`, { cache: "no-store" })
			.then(async res => {
				if (!res.ok) throw new Error("fetch failed");
				const json = await res.json();
				statusCache[group].Official = json.version || null;
				["version", "time"].forEach(field => {
					document
						.querySelectorAll(`[data-key="${officialKey}.${field}"]`)
						.forEach(el => el.textContent = json[field] || "获取失败");
				});
			})
			.catch(() => {
				statusCache[group].Official = null;
				document
					.querySelectorAll(`[data-key^="${officialKey}."]`)
					.forEach(el => el.textContent = "获取失败");
			});

		const localizedFetch = fetch(`/api/status?type=${group.toLowerCase()}&scope=localized`, { cache: "no-store" })
			.then(async res => {
				if (!res.ok) throw new Error("fetch failed");
				const json = await res.json();
				statusCache[group].Localized = json.version || null;
				["version", "time"].forEach(field => {
					document
						.querySelectorAll(`[data-key="${localizedKey}.${field}"]`)
						.forEach(el => el.textContent = json[field] || "获取失败");
				});
			})
			.catch(() => {
				statusCache[group].Localized = null;
				document
					.querySelectorAll(`[data-key^="${localizedKey}."]`)
					.forEach(el => el.textContent = "获取失败");
			});

		Promise.all([officialFetch, localizedFetch]).then(() => {
			updateStatus(group, statusCache[group]);
		});
	});

	fetch("/api/status?type=last&scope=check&field=time", { cache: "no-store" })
		.then(r => r.text())
		.then(v => {
			document
				.querySelectorAll('[data-key="LastCheck"]')
				.forEach(el => el.textContent = v);
		})
		.catch(() => {
			document
				.querySelectorAll('[data-key="LastCheck"]')
				.forEach(el => el.textContent = "获取失败");
		});
}

function updateStatus(group, data) {
	const el = document.querySelector(`[data-key="${group}.Status"]`);
	if (!el) return;

	el.style.color = "";
	el.style.fontWeight = "";

	const { Official, Localized } = data;

	if (!Official || !Localized) {
		el.textContent = "未获取";
		el.style.color = "rgb(245, 180, 0)";
		el.style.fontWeight = "600";
		return;
	}

	if (Official === Localized) {
		el.textContent = "已同步";
		el.style.color = "rgb(46, 204, 113)";
		el.style.fontWeight = "600";
		return;
	}

	el.textContent = "未同步";
	el.style.color = "rgb(231, 76, 60)";
	el.style.fontWeight = "600";
}