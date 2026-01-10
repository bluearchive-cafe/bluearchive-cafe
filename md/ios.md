<link rel="stylesheet" href="../public/assets/css/button.css">
<div align="center">
<h1>iOS 端使用说明</h1>
</div>

> 由于 Apple 系统限制，本站不提供汉化版 iOS 游戏客户端，需要自行安装原版游戏客户端，然后利用代理工具的 MitM 功能实现汉化

## 一、准备

> 开始之前，需要准备以下两件工具

- `日区` Apple 账号，用于安装日服游戏客户端

  - 或者获取游戏客户端 IPA 并进行自签

- 具备 `MitM` 功能的代理工具，建议选用以下工具之一

  - **[`Shadowrocket`](https://apps.apple.com/us/app/shadowrocket/id932747118 "点击跳转")**
  - **[`Stash`](https://apps.apple.com/us/app/stash-rule-based-proxy/id1596063349 "点击跳转")**
  - **[`Loon`](https://apps.apple.com/us/app/loon/id1373567447 "点击跳转")**
  - **[`Quantumult X`](https://apps.apple.com/us/app/quantumult-x/id1443988620 "点击跳转")**
  - **[`Surge`](https://apps.apple.com/us/app/surge-5/id1442620678 "点击跳转")**

## 二、安装

> 在 App Store 中使用日区 Apple 账号登录，然后点击跳转至 App Store 安装官方游戏客户端，或者从 Decrypt IPA Store 获取游戏客户端 IPA 并通过自签进行安装

<div class="buttons">
<a href="https://apps.apple.com/jp/app/id1515877221" class="color doc" title="点击跳转" target="_blank" rel="noopener">
<img src="../public/assets/icons/appstore.png">
<span>App Store</span>
</a>
<a href="https://decrypt.day/app/id1515877221" class="color doc" title="点击跳转" target="_blank" rel="noopener">
<img src="../public/assets/icons/decryptday.png">
<span>Decrypt IPA</span>
</a>
</div>

<div class="badges" align="center">
<a href="https://apps.apple.com/jp/app/id1515877221" title="点击跳转" target="_blank" rel="noopener">
<img src="https://custom-icon-badges.demolab.com/badge/iOS-App_Store-blue.svg?logo=appstore">
</a>
<a href="https://decrypt.day/app/id1515877221" title="点击跳转" target="_blank" rel="noopener">
<img src="https://custom-icon-badges.demolab.com/badge/IPA-Decrypt_IPA-blue.svg?logo=decryptday">
</a>
</div>

## 三、配置

> 本站提供 `Shadowrocket模块` 和 `Stash覆写` 以便配置，其他代理工具需按要求自行配置

### **Shadowrocket**

#### 1. 安装证书

> 由于 Shadowrocket 用于 HTTPS 解密的 CA 证书与配置文件相关联，会随着配置文件切换，所以切换新配置时需要重新安装证书，或者自行配置 <strong><a href="https://github.com/LOWERTOP/Shadowrocket?tab=readme-ov-file#证书模块" title="点击跳转" target="_blank" rel="noopener"><code>证书模块</code></a></strong>

- 生成证书

  在 `配置` 标签页，点击正在使用的配置文件右边的 `ⓘ` 图标

  点击 `HTTPS解密`-`证书`-`生成新的CA证书`-`安装证书`-`允许`

- 安装证书

  打开 `设置`-`已下载描述文件`-`安装`

- 信任证书

  打开 `设置`-`通用`-`关于本机`-`证书信任设置`，信任证书

#### 2. 安装模块

> 本站提供 `Shadowrocket模块` 以便配置，具备资源汉化与登录加速功能，点击一键安装

<div class="buttons">
<a href="shadowrocket://install?module=https://bluearchive.cafe/config/bluearchive-cafe.sgmodule" class="color doc" title="点击安装" target="_blank" rel="noopener">
<img src="../public/assets/icons/shadowrocket.png">
<span>安装汉化模块</span>
</a>
</div>

<div class="badges" align="center">
<a href="https://bluearchive.cafe/api/install?scheme=shadowrocket" title="点击安装" target="_blank" rel="noopener">
<img src="https://custom-icon-badges.demolab.com/badge/Shadowrocket-安装汉化模块-blue.svg?logo=shadowrocket">
</a>
</div>

#### 3. 开启连接

> 由于设备关机后会断开 VPN 连接，导致汉化失效，因此推荐启用 `始终开启`

- 在 `首页` 标签页，启用 `VPN连接`，首次启动需要添加 `VPN配置`

- 在 `设置` 标签页，点击 `按需求连接`，启用 `始终开启`（可选）

### **Stash**

#### 1. 安装证书

> 由于 Stash 用于 HTTPS 解密的 CA 证书会通过 iCloud 同步，如果有多台设备安装了 Stash，请避免在任一设备上点击 `重新生成新的CA证书`，否则可能需要在多台设备上重新安装和信任证书

- 打开 `MitM`

  在 `首页` 标签页，点击 `MitM` 右上角的开关

- 生成证书

  点击 `生成新的CA证书`-`安装证书`-`允许`

- 安装证书

  打开 `设置`-`已下载描述文件`-`安装`

- 信任证书

  打开 `设置`-`通用`-`关于本机`-`证书信任设置`，信任证书

#### 2. 安装覆写

> 本站提供 `Stash覆写` 以便配置，具备资源汉化与登录加速功能，点击一键安装

<div class="buttons">
<a href="stash://install-override?url=https://bluearchive.cafe/config/bluearchive-cafe.stoverride" class="color doc" title="点击安装" target="_blank" rel="noopener">
<img src="../public/assets/icons/stash.png">
<span>安装汉化覆写</span>
</a>
</div>

<div class="badges" align="center">
<a href="https://bluearchive.cafe/api/install?scheme=stash" title="点击安装" target="_blank" rel="noopener">
<img src="https://custom-icon-badges.demolab.com/badge/Stash-安装汉化覆写-blue.svg?logo=stash">
</a>
</div>

#### 3. 开启连接

> 由于设备关机后会断开 VPN 连接，导致汉化失效，因此推荐启用 `自动启动`

- 在 `首页` 标签页，点击 `启动`，首次启动需要添加 `VPN配置`

- 在 `设置` 标签页，点击 `按需连接`，启用 `自动启动Stash`（可选）

### **其他工具**

> 其他具备 `MitM` 功能的代理工具，需要自行配置以下两条 `URL重写` 规则：

- 资源汉化重写

  实现游戏资源汉化，包括文本图像语音等

```
匹配：yostar-serverinfo.bluearchiveyostar.com
替换：yostar-serverinfo.bluearchive.cafe
方式：透明代理 或 重定向
```

- 登录加速重写

  绕过登录地区限制，如有网络条件可跳过

```
匹配：jp-sdk-api.yostarplat.com
替换：jp-sdk-api.bluearchive.cafe
方式：透明代理
```

## 四、其他

### **作弊**

#### 使用汉化会导致封号吗

> 目前没有发生过因使用汉化而导致账号封禁的先例，若担心账号被封请老师自行斟酌是否使用汉化，<strong><a href="https://github.com/bluearchive-cafe/bluearchive-cafe?tab=AGPL-3.0-1-ov-file" title="免责声明" target="_blank" rel="noopener"><code>本站不对因使用或无法使用本项目所产生的损失承担任何责任</code></a></strong>

#### Use of unauthorized apps

> `自签时修改IPA`、`使用PlayCover`、`越狱设备` 都有可能导致该问题，请老师尝试 `自签时保留应用扩展`、`用自签代替PlayCover`、`恢复越狱`

### **苹果**

#### 汉化后字体粗细不同

> 由于 Apple 系统限制，本站不提供汉化版 iOS 游戏客户端，而字体和部分文本、图片资源保存在安装包中，故 `无法解决` 字体和部分文本、图片的汉化问题

#### 汉化后部分文本缺失

> 打开 `设置`-`通用`-`字体`-`更多字体`，安装 `苹方-简` 字体

### **资源**

#### 进入战斗或活动时卡住 / 闪退 / 贴图异常

> 游戏资源损坏或需要更新，请老师尝试在登录界面左下角点击 `菜单`-`检查游戏资源完整性`，或者 `重新安装游戏`

#### 下载损坏 / 卡住 / 失败 / 没有进度条

> 可能导致该类问题的原因很多，建议尝试的措施包括但不限于 `重试下载`、`重启游戏`、`避免后台下载`、`改善网络环境`

### **反馈**

#### 文本缺失 / 异常 / 错误

> 文本变动可能没有及时同步，请老师发送邮件至 `feedback@bluearchive.cafe` 进行反馈，**[`点击编辑邮件`](mailto:feedback@bluearchive.cafe?subject=汉化文本问题反馈&body=文本位置：%0A%0A问题描述： "点击编辑")**

#### 资源缺失 / 异常 / 错误

> 版本更新可能导致资源异常，请老师发送邮件至 `feedback@bluearchive.cafe` 进行反馈，**[`点击编辑邮件`](mailto:feedback@bluearchive.cafe?subject=汉化资源问题反馈&body=资源位置：%0A%0A问题描述： "点击编辑")**