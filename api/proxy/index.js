// api/proxy/index.js
import crypto from "crypto";

export default async function handler(req, res) {
  try {
    const { slug } = req.query;
    const pathSeg = Array.isArray(slug) ? slug.join("/") : slug;

    // 健康检查
    if (pathSeg === "health") {
      return res.status(200).json({ ok: true, service: "tencent-proxy" });
    }

    // 只支持 suggest
    let upstreamPath;
    if (pathSeg === "suggest") {
      upstreamPath = "/ws/place/v1/suggestion";
    } else {
      return res.status(404).json({ error: "unknown route", pathSeg });
    }

    // 原始 query
    const queryString = req.url.split("?")[1] || "";

    const KEY = process.env.TENCENT_KEY;
    const SK = process.env.TENCENT_SK;
    if (!KEY || !SK) {
      return res.status(500).json({ error: "Missing KEY/SK" });
    }

    const sigStr = `${upstreamPath}?${queryString}${SK}`;
    const sig = crypto.createHash("md5").update(sigStr).digest("hex");

    const url = `https://apis.map.qq.com${upstreamPath}?${queryString}&key=${KEY}&sig=${sig}`;
    const r = await fetch(url);
    const data = await r.json();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
