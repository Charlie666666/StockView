# 股票分析网站

零依赖的股票实时行情网站，仅使用 Python 标准库，无需安装任何第三方包。

## 运行

```
python server.py
```

浏览器打开 http://localhost:8000 ，三个市场独立页面：

| 页面 | 地址 | 默认自选 |
|------|------|----------|
| A股  | `/a`（首页默认） | 贵州茅台、平安银行、中国平安、宁德时代、招商银行 |
| 港股 | `/hk` | 腾讯、阿里、美团、小米、中国移动 |
| 美股 | `/us` | 苹果、英伟达、微软、特斯拉、谷歌 |

环境变量：`PORT`（默认 8000）、`HOST`（默认 0.0.0.0，云平台部署所需）。

## 功能

- 实时价格（每 5 秒自动刷新），红涨绿跌，价格变动闪烁提示
- 每个市场独立自选列表（localStorage 按市场分开保存）
- 添加时校验市场归属：在港股页输入美股代码会提示去对应页面
- 展示涨跌幅、涨跌额、今开、最高、最低、昨收、成交量、成交额、换手率

## 目录结构

```
server.py          后端：静态页面托管 + /api/quote 行情代理
public/
  a.html hk.html us.html   三个市场页面（仅含市场配置和页面骨架）
  app.js           共享行情逻辑
  style.css        共享样式
```

## 公网部署

代码已适配云平台（监听 0.0.0.0、读取 PORT 环境变量），无构建步骤。
以 Render 为例：新建 Web Service → 连接仓库 → Start Command 填
`python server.py` 即可。Railway、Fly.io、Hugging Face Spaces 同理。

临时公网访问也可用 Cloudflare 快速隧道（无需注册）：
`cloudflared tunnel --url http://localhost:8000`

## 数据来源

腾讯财经行情接口（qt.gtimg.cn），由 `server.py` 中的 `/api/quote?codes=sh600519,usAAPL`
代理并解析为 JSON（接口返回 GBK 编码、`~` 分隔的字段）。

## 后续可扩展

- K线图 / 分时图（腾讯有历史数据接口 web.ifzq.gtimg.cn）
- 技术指标（MA、MACD、RSI 等）
- 涨跌提醒、多分组自选
