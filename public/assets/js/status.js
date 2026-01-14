async function fillStatus() {
	if (location.pathname !== '/status') return;

	const res = await fetch('/api/status');
	if (!res.ok) throw new Error(`状态获取失败：${res.status}`);
	const statusData = await res.json();

	const elements = document.querySelectorAll('[data-key]');

	elements.forEach(el => {
		const keyPath = el.dataset.key; // e.g. "package/official/version" 或 "package/status"

		// 特殊处理 status 字段
		if (keyPath.endsWith('/status')) {
			// 取出路径前缀，例如 package 或 resource
			const type = keyPath.split('/')[0];
			const official = statusData[type]?.official?.version;
			const localized = statusData[type]?.localized?.version;

			if (!official || !localized) {
				el.textContent = "获取中";
				el.style.color = "orange"; // 黄色
			} else if (official === localized) {
				el.textContent = "已同步";
				el.style.color = "green";  // 绿色
			} else {
				el.textContent = "未同步";
				el.style.color = "red";    // 红色
			}
			return;
		}

		// 普通字段直接填充
		const value = keyPath.split('/').reduce((obj, k) => obj?.[k], statusData);
		if (value !== undefined) el.textContent = value;
	});
}