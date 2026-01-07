import xxhash from "xxhash-wasm";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    const spaRoutes = ["/", "/ios", "/android", "/status", "/about", "/support"];
    if (spaRoutes.includes(path)) {
      const res = await fetch(new URL("/index.html", url));
      return new Response(res.body, {
        ...res,
        headers: {
          ...res.headers,
          "Cache-Control": "public, max-age=3600"
        }
      });
    }

    if (path.startsWith("/api")) {
      if (path === "/api/lastcheck") {
        const value = await env.STATUS.get("LastCheck");
        if (!value) return new Response("获取失败", { status: 404 });
        return new Response(String(value), {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store"
          }
        });
      }

      if (path.endsWith("/")) return new Response("无效路径", { status: 404 });
      const [, , type, scope, field] = path.split("/");

      const validTypes = ["apk", "localization"];
      const validScopes = ["official", "localized"];
      const validFields = ["version", "time"];

      if (!validTypes.includes(type) || !validScopes.includes(scope)) {
        return new Response("无效路径", { status: 404 });
      }

      const key =
        type.charAt(0).toUpperCase() +
        type.slice(1) +
        "." +
        scope.charAt(0).toUpperCase() +
        scope.slice(1);

      const statusRaw = await env.STATUS.get(key);
      if (!statusRaw) {
        return new Response("获取失败", { status: 404 });
      }

      if (field && validFields.includes(field)) {
        let status;
        try {
          status = JSON.parse(statusRaw);
        } catch {
          return new Response("获取失败", { status: 500 });
        }

        const value = status[field];
        if (!value) {
          return new Response("获取失败", { status: 404 });
        }

        return new Response(String(value), {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "no-store"
          }
        });
      }

      return new Response(statusRaw, {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store"
        }
      });
    }

    if (path.startsWith("/download")) {
      const file = decodeURIComponent(path.replace("/download/", ""));
      const object = await env.DOWNLOAD.get(file);
      if (!object) return new Response("Not Found", { status: 404 });
      return new Response(object.body, {
        headers: { "Content-Type": "application/octet-stream" }
      });
    }

    if (path.startsWith("/install/")) {
      const parts = path.split("/").filter(Boolean);
      if (parts.length === 3) {
        const [, client, action] = parts;

        let target = null;

        if (client === "shadowrocket" && action === "localize") {
          target = "shadowrocket://install?module=https://bluearchive.cafe/config/shadowrocket/bluearchive-cafe-localize.sgmodule";
        } else if (client === "shadowrocket" && action === "localize-cn-voice") {
          target = "shadowrocket://install?module=https://bluearchive.cafe/config/shadowrocket/bluearchive-cafe-localize-cn-voice.sgmodule";
        } else if (client === "shadowrocket" && action === "login") {
          target = "shadowrocket://install?module=https://bluearchive.cafe/config/shadowrocket/bluearchive-cafe-login.sgmodule";
        } else if (client === "stash" && action === "localize") {
          target = "stash://install-override?url=https://bluearchive.cafe/config/stash/bluearchive-cafe-localize.stoverride";
        } else if (client === "stash" && action === "localize-cn-voice") {
          target = "stash://install-override?url=https://bluearchive.cafe/config/stash/bluearchive-cafe-localize-cn-voice.stoverride";
        } else if (client === "stash" && action === "login") {
          target = "stash://install-override?url=https://bluearchive.cafe/config/stash/bluearchive-cafe-login.stoverride";
        }

        if (target) {
          return Response.redirect(target, 302);
        }
      }

      return new Response("无效路径", { status: 404 });
    }

    if (path.includes(".")) {
      const res = await fetch(request);
      if (res.ok) {
        return new Response(res.body, {
          ...res,
          headers: {
            ...res.headers,
            "Cache-Control": "public, max-age=3600"
          }
        });
      }
    }

    return Response.redirect("https://bluearchive.cafe/", 302);
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
            instructions: '将日语翻译为中文，语言亲切自然，按照原格式输出JSON，不带任何样式，尽量选用以下的词：蔚蓝档案、PickUp、总力战、大决战、活动、日程',
            input: text,
          });
          text = response.output[1].content[0].text;
        } catch (e) {
          console.error(`公告资源信息汉化错误：${e}`);
        }
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
      await env.STATUS.put("LastCheck", time);
      console.log(`上次检查时间更新成功：${time}`)
    } catch (err) { `上次检查时间更新失败：${err}` }
  },
};
