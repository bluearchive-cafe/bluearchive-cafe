import xxhash from "xxhash-wasm";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const params = url.searchParams;
    const headers = new Headers({ "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" });

    if (path.startsWith("/download/")) {
      const file = decodeURIComponent(path.split("/").pop());
      const object = await env.DOWNLOAD.get(file);
      if (object) return new Response(object.body, { headers: { "Content-Type": "application/octet-stream" } });
      return new Response("下载文件缺失", { headers, status: 404 })
    }

    if (path.startsWith("/api/")) {
      if (path === "/api/status") {
        const type = params.get("type");
        const scope = params.get("scope");
        const field = params.get("field");
        if (type === "last" && scope === "check" && field === "time") {
          const status = await env.STATUS.get("LastCheckTime");
          return new Response(status || "API：状态信息：查询状态失败", { headers, status: status ? 200 : 404 });
        } else if (type && scope) {
          const key = type.charAt(0).toUpperCase() + type.slice(1) + "." + scope.charAt(0).toUpperCase() + scope.slice(1);
          let status = await env.STATUS.get(key);
          if (status && field) status = JSON.parse(status)[field];
          return new Response(status || "API：状态信息：查询状态失败", { headers, status: status ? 200 : 404 });
        } else return new Response("API：状态信息：查询参数缺失", { headers, status: 400 });
      } else if (path === "/api/dash") {
        const uuid = params.get("uuid");
        const table = params.get("table");
        const asset = params.get("asset");
        const voice = params.get("voice");
        if (uuid && table && asset && voice) {
          try {
            await env.PREFERENCE.put(uuid, JSON.stringify({ table: table, asset: asset, voice: voice }));
            return new Response("API：偏好设置：保存设置成功", { headers });
          } catch { return new Response("API：偏好设置：保存设置失败", { headers, status: 500 }); }
        } else if (uuid) {
          const preference = await env.PREFERENCE.get(uuid);
          return new Response(preference || "API：偏好设置：查询设置失败", { headers, status: preference ? 200 : 404 });
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
      return new Response("API：调用错误：调用接口未知", { headers, status: 400 })
    }
  },

  async scheduled(controller, env, ctx) {
    try {
      const res = await fetch("https://play.google.com/store/apps/details?id=com.YostarJP.BlueArchive", { method: "GET" });
      if (!res.ok) throw new Error("拉取失败");

      const html = await res.text();
      const match = html.match(/\["(1\.\d{2}\.\d{6})"\]/);
      const version = match ? match[1] : "";
      if (!version) throw new Error("解析失败");

      const status = JSON.parse(await env.STATUS.get("Apk.Official") || '{"version":"","time":""}');
      const time = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Shanghai" });
      if (version > status.version) {
        await env.STATUS.put("Apk.Official", JSON.stringify({ version, time }));
        console.log(`安装包版本号更新成功：${version}`);
      } else console.log(`安装包版本号检查成功：${version}`);
    } catch (err) { console.error(`安装包版本号检查失败：${err}`); }
    try {
      const list = await env.SERVERINFO.list();
      if (!list.keys.length) throw new Error("读取失败");

      const keys = list.keys.map(k => k.name);
      const key = keys.reduce((max, k) => (k > max ? k : max), keys[0]);
      const upstream = await fetch("https://yostar-serverinfo.bluearchiveyostar.com/" + key);
      if (upstream.ok) {
        console.log(`游戏资源信息拉取成功：${key.replace(".json", "")}`)
      } else throw new Error("拉取失败");

      let serverinfo;
      try { serverinfo = await upstream.json(); } catch { throw new Error("解析失败"); }

      let version;
      const overrideGroup = serverinfo.ConnectionGroups[0].OverrideConnectionGroups.find(obj => obj.Name !== "1.0");
      if (overrideGroup) version = overrideGroup.AddressablesCatalogUrlRoot.split("/").pop();
      if (version !== JSON.parse(await env.STATUS.get("Localization.Official") || '{"version":"","time":""}').version) {
        for (const connectionGroup of serverinfo.ConnectionGroups || []) {
          if (connectionGroup.ManagementDataUrl) {
            connectionGroup.ManagementDataUrl = connectionGroup.ManagementDataUrl.replace(
              "prod-noticeindex.bluearchiveyostar.com",
              "prod-noticeindex.bluearchive.cafe"
            );
          }
          for (const overrideGroup of connectionGroup.OverrideConnectionGroups || []) {
            if (overrideGroup.Name !== "1.0" && overrideGroup.AddressablesCatalogUrlRoot) {
              overrideGroup.AddressablesCatalogUrlRoot = overrideGroup.AddressablesCatalogUrlRoot.replace(
                "prod-clientpatch.bluearchiveyostar.com",
                "prod-clientpatch.bluearchive.cafe"
              );
            }
          }
        }
        const value = JSON.stringify(serverinfo, null, 2);
        const time = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Shanghai" });
        await env.STATUS.put("Localization.Official", JSON.stringify({ version, time }));
        await env.SERVERINFO.put(key, value);
        console.log(`资源包版本号更新成功：${version}`)
      } else console.log(`资源包版本号检查成功：${version}`)
    } catch (err) { console.error(`资源包版本号检查失败：${err}`); }
    try {
      const { h32 } = await xxhash();
      const INDEX_KEY = "prod/index.json";
      const HASH_KEY = "prod/index.hash";
      const upstream = await fetch("https://prod-noticeindex.bluearchiveyostar.com/" + INDEX_KEY);
      if (!upstream.ok) throw new Error("拉取失败");

      let text = await upstream.text();
      const hash = h32(text).toString();;
      const time = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Shanghai" });

      if (hash !== await env.NOTICEINDEX.get(HASH_KEY)) {
        let noticeindex;
        try {
          const response = await env.AI.run('@cf/openai/gpt-oss-120b', {
            instructions: '将日语翻译为中文，语言亲切自然，保留原有JSON结构，直接返回JSON文本，不要用代码块包裹，尽量选用下列词语：蔚蓝档案、PickUp、总力战、大决战、活动、日程等与游戏《蔚蓝档案》相关的词语',
            input: text,
          });
          text = response.output[1].content[0].text;
        } catch (e) { console.error(`公告资源信息汉化失败：${e}`); }
        try { noticeindex = JSON.parse(text); } catch { console.error(text); throw new Error("解析失败"); }
        const stack = [noticeindex];
        while (stack.length) {
          const obj = stack.pop();
          if (obj && typeof obj === "object") {
            for (const key in obj) {
              const value = obj[key];
              if (key === "Url" && typeof value === "string" && value.endsWith(".html")) {
                obj[key] = value.replace(
                  "prod-notice.bluearchiveyostar.com",
                  "prod-notice.bluearchive.cafe"
                );
              } else if (value && typeof value === "object") stack.push(value);
            }
          }
        }
        const value = JSON.stringify(noticeindex, null, 2);
        await env.NOTICEINDEX.put(INDEX_KEY, value);
        await env.NOTICEINDEX.put(HASH_KEY, hash);
        console.log(`公告资源信息更新成功：${time}`);
      } else {
        const time = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Shanghai" });
        console.log(`公告资源信息检查成功：${time}`);
      }
    } catch (err) { console.error(`公告资源信息检查失败：${err}`); }
    try {
      const time = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Shanghai" })
      await env.STATUS.put("LastCheckTime", time);
      console.log(`上次检查时间更新成功：${time}`)
    } catch (err) { `上次检查时间更新失败：${err}` }
  },
};
