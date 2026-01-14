import xxhash from "xxhash-wasm";

function patchStatus(obj, path, value) {
    path.split("/").reduce((o, k, i, arr) => {
        if (i === arr.length - 1) o[k] = value;
        else o[k] ??= {};
        return o[k];
    }, obj);
}

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;
        const params = url.searchParams;
        const headers = new Headers({ "Content-Type": "text/plain; charset=utf-8" });

        if (path.startsWith("/download/")) {
            const file = decodeURIComponent(path.split("/").pop());
            const object = await env.DOWNLOAD.get(file);
            if (object) return new Response(object.body, { headers: { "Content-Type": "application/octet-stream" } });
            return new Response("下载文件缺失", { headers, status: 404 });
        }

        if (path.startsWith("/api/")) {
            if (path === "/api/status") {
                let value;
                const type = params.get("type");
                const scope = params.get("scope");
                const field = params.get("field");
                if (type && scope && field) value = await env.RESOURCESTATUS.get([type, scope, field].join("/"));
                else value = await env.RESOURCESTATUS.get("status.json");
                return new Response(value || "API：资源状态：状态查询失败", { headers: { "Content-Type": "application/json" }, status: value ? 200 : 404 });
            } else if (path === "/api/dash") {
                const uuid = params.get("uuid");
                const table = params.get("table");
                const asset = params.get("asset");
                const media = params.get("media");
                if (uuid) {
                    if (table && asset && media) {
                        try {
                            await env.PREFERENCE.put(uuid, JSON.stringify({ table, asset, media }));
                            return new Response("API：偏好设置：设置保存成功", { headers });
                        } catch { return new Response("API：偏好设置：设置保存失败", { headers, status: 500 }); }
                    } else if (table || asset || media) {
                        return new Response("API：偏好设置：设置参数缺失", { headers, status: 400 });
                    } else {
                        const preference = await env.PREFERENCE.get(uuid);
                        return new Response(preference || "API：偏好设置：设置查询失败", { headers: { "Content-Type": "application/json" }, status: preference ? 200 : 404 });
                    }
                } else return new Response("API：偏好设置：查询参数缺失", { headers, status: 400 });
            } else if (path === "/api/install") {
                const scheme = params.get("scheme");
                const map = {
                    shadowrocket: "shadowrocket://install?module=https://bluearchive.cafe/config/bluearchive-cafe.sgmodule",
                    stash: "stash://install-override?url=https://bluearchive.cafe/config/bluearchive-cafe.stoverride"
                };
                if (scheme in map) return Response.redirect(map[scheme], 302);
                return new Response("API：安装配置：配置参数缺失", { headers, status: 400 });
            }
            return new Response("API：调用错误：接口调用未知", { headers, status: 400 });
        }
    },

    async scheduled(controller, env, ctx) {
        const { h32 } = await xxhash();
        const status = JSON.parse(await env.RESOURCESTATUS.get("status.json"));

        try {
            const response = await fetch("https://play.google.com/store/apps/details?id=com.YostarJP.BlueArchive", { method: "GET" });
            if (!response.ok) throw new Error("拉取失败");

            const html = await response.text();
            const match = html.match(/\["(1\.\d{2}\.\d{6})"\]/);
            const version = match ? match[1] : null;
            if (!version) throw new Error("解析失败");

            const existing = await env.RESOURCESTATUS.get("package/official/version");
            if (version > existing) {
                const time = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Shanghai" });
                await env.RESOURCESTATUS.put("package/official/version", version);
                await env.RESOURCESTATUS.put("package/official/time", time);
                patchStatus(status, "package/official/version", version);
                patchStatus(status, "package/official/time", time);
                console.log(`安装包版本号更新成功：${version}`);
            } else console.log(`安装包版本号检查成功：${version}`);
        } catch (err) { console.error(`安装包版本号检查失败：${err}`); }

        try {
            const list = await env.SERVERINFO.list();
            const key = list.keys.map(k => k.name).sort().at(-1);
            const upstream = "https://yostar-serverinfo.bluearchiveyostar.com/" + key;
            const response = await fetch(upstream);
            if (!response.ok) throw new Error(`拉取失败：${key}`);

            const text = await response.text();
            const serverinfo = JSON.parse(text);
            const hash = h32(text).toString();
            if (hash !== await env.SERVERINFO.get("info.hash")) {
                const value = JSON.stringify(serverinfo, null, 2);
                await env.SERVERINFO.put(key, value);
                await env.SERVERINFO.put("info.hash", hash)
                console.log(`游戏资源信息更新成功：${key}`);
            }

            const version = new URL(serverinfo.ConnectionGroups[0].OverrideConnectionGroups[1].AddressablesCatalogUrlRoot).pathname.slice(1);
            if (version !== await env.RESOURCESTATUS.get("table/official/version")) {
                const types = ["table", "asset", "media"];
                const time = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Shanghai" });
                for (const type of types) {
                    patchStatus(status, `${type}/official/version`, version);
                    patchStatus(status, `${type}/official/time`, time);
                }
                await Promise.all(
                    types.flatMap(type => [
                        env.RESOURCESTATUS.put(`${type}/official/version`, version),
                        env.RESOURCESTATUS.put(`${type}/official/time`, time),
                    ])
                );
                console.log(`资源包版本号更新成功：${version}`)
            } else console.log(`资源包版本号检查成功：${key}`)
        } catch (err) { console.error(`资源包版本号检查失败：${err}`); }

        try {
            const key = "prod/index.json";
            const upstream = "https://prod-noticeindex.bluearchiveyostar.com/" + key;
            const response = await fetch(upstream);
            if (!response.ok) throw new Error("拉取失败");

            let text = await response.text();
            let noticeindex = JSON.parse(text);
            const hash = h32(text).toString();
            const version = noticeindex.LatestClientVersion;
            if (hash !== await env.NOTICEINDEX.get("prod/index.hash")) {
                try {
                    const response = await env.AI.run('@cf/openai/gpt-oss-120b', {
                        instructions: '将日语翻译为中文，语言亲切自然，保留原有JSON结构，不用代码块包裹，直接返回JSON文本，尽量选用下列词语：蔚蓝档案、PickUp、总力战、大决战、活动、招募等与游戏《蔚蓝档案》相关的词语',
                        input: text,
                    });
                    text = response.output[1].content[0].text;
                    noticeindex = JSON.parse(text);
                } catch (e) { console.error(`公告资源索引汉化失败：${e}`); }
                const stack = [noticeindex];
                while (stack.length) {
                    const obj = stack.pop();
                    if (obj && typeof obj === "object") {
                        for (const key in obj) {
                            const value = obj[key];
                            if (key === "Url" && typeof value === "string" && value.endsWith(".html")) {
                                obj[key] = value.replace(
                                    "bluearchiveyostar.com",
                                    "bluearchive.cafe"
                                );
                            } else if (value && typeof value === "object") stack.push(value);
                        }
                    }
                }

                const value = JSON.stringify(noticeindex, null, 2);
                const time = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Shanghai" });
                await env.NOTICEINDEX.put(key, value);
                await env.NOTICEINDEX.put("prod/index.hash", hash);
                await env.RESOURCESTATUS.put("notice/official/version", version);
                await env.RESOURCESTATUS.put("notice/official/time", time);
                patchStatus(status, "notice/official/version", version);
                patchStatus(status, "notice/official/time", time);
                console.log(`公告资源索引更新成功：${version}`);
            } else console.log(`公告资源索引检查成功：${version}`);
        } catch (err) { console.error(`公告资源索引检查失败：${err}`); }

        try {
            const time = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Shanghai" });
            const types = ["package", "table", "asset", "media", "notice"];
            for (const type of types) {
                const [version, time] = await Promise.all([
                    env.RESOURCESTATUS.get(`${type}/official/version`),
                    env.RESOURCESTATUS.get(`${type}/official/time`),
                ]);

                patchStatus(status, `${type}/official/version`, version);
                patchStatus(status, `${type}/official/time`, time);
            }
            patchStatus(status, "time", time);
            await env.RESOURCESTATUS.put("status.json", JSON.stringify(status, null, 2));
            console.log(`资源状态信息更新成功：${time}`);
        } catch (err) { console.error(`资源状态信息更新失败：${err}`); }
    },
};
