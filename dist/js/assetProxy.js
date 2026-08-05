/* ============================================================
 *  assetProxy.js — 静态 HTML 中硬编码资产的 API 代理改写（双端互通）
 *
 *  将 <img src="sendbox/..."> 改为 <img src="{后端}/api/assets/sendbox/...">
 *  （资产统一从 MySQL 读取，任意端口/设备一致）；加载失败自动回退原静态路径。
 *  可回滚：删除本文件引用即恢复纯静态加载。
 *
 *  性能：IntersectionObserver 懒加载 —— 图片进入视口才替换为 API URL，
 *  避免首屏一次性并发大量 /api/assets 请求挤占浏览器到后端的连接
 *  （HTTP/1.1 同域名 6 连接限制，会阻塞搜索/发送等 API 请求）。
 * ============================================================ */
(function (global) {
  'use strict';

  function apiBaseUrl() {
    try {
      if (global.MailService && typeof global.MailService.getBaseUrl === 'function') {
        const base = String(global.MailService.getBaseUrl() || '').replace(/\/+$/, '');
        if (base) return base + '/api/assets/';
      }
    } catch (_) {}
    // 后端不可见时返回空 → 不改写，保持原路径
    return '';
  }

  function proxyImage(img) {
    const original = img.getAttribute('src');
    if (!original || img.dataset.assetProxied === '1') return;
    const base = apiBaseUrl();
    if (!base) return;
    const clean = original.replace(/^\.\//, '').replace(/^\//, '');
    const apiUrl = base + clean;
    img.dataset.assetProxied = '1';
    img.dataset.assetOriginal = original;
    img.src = apiUrl;
    img.addEventListener('error', function handler() {
      img.removeEventListener('error', handler);
      // 回退原静态路径（静态服务仍可用）
      img.src = img.dataset.assetOriginal || original || '';
    }, { once: true });
  }

  var io = null;
  if (typeof global.IntersectionObserver === 'function') {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          proxyImage(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '200px' });
  }

  function apply() {
    var imgs = document.querySelectorAll('img[src^="sendbox/"]');
    imgs.forEach(function (img) {
      if (img.dataset.assetProxied) return;
      if (io) io.observe(img);
      else proxyImage(img); // 无 IntersectionObserver 时直接替换
    });
  }

  // DOM 就绪 + 稍后（等 MailService 加载完 / 动态渲染的图片）各跑一次
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', apply);
  } else {
    apply();
  }
  setTimeout(apply, 1200);
  setTimeout(apply, 3000);
})(window);
