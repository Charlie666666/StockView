/* 零依赖 canvas K线图表：蜡烛图 + MA/BOLL + 成交量 + MACD + 十字光标 + 滚轮缩放/拖动平移
   用法:
     const chart = new KChart(canvasEl, { locale: 'zh-CN' });
     chart.setData(candles, period);   // candles: [[t,o,h,l,c,v], ...]
     chart.setIndicators({ ma:true, boll:false, macd:true });
*/
(function () {
  'use strict';

  const UP = '#1fbf75', DOWN = '#f0453e';
  const GRID = 'rgba(139,151,165,.12)', TEXT = '#8a97a5', CROSS = 'rgba(232,237,242,.45)';
  const MA_COLORS = { 5: '#f7b731', 10: '#4a9eff', 20: '#c678dd', 60: '#e8edf2' };
  const BOLL_COLOR = '#4a9eff', DIF_C = '#f7b731', DEA_C = '#4a9eff';
  const PAD_R = 64, PAD_B = 20;

  /* ---------- 指标计算 ---------- */
  function smaSeries(vals, n) {
    const out = new Array(vals.length).fill(null);
    let sum = 0;
    for (let i = 0; i < vals.length; i++) {
      sum += vals[i];
      if (i >= n) sum -= vals[i - n];
      if (i >= n - 1) out[i] = sum / n;
    }
    return out;
  }
  function emaSeries(vals, n) {
    const out = new Array(vals.length).fill(null);
    const k = 2 / (n + 1);
    let prev = null;
    for (let i = 0; i < vals.length; i++) {
      prev = prev === null ? vals[i] : vals[i] * k + prev * (1 - k);
      out[i] = prev;
    }
    return out;
  }
  function bollSeries(closes, n = 20, mult = 2) {
    const mid = smaSeries(closes, n);
    const up = new Array(closes.length).fill(null);
    const dn = new Array(closes.length).fill(null);
    for (let i = n - 1; i < closes.length; i++) {
      let s = 0;
      for (let j = i - n + 1; j <= i; j++) s += (closes[j] - mid[i]) ** 2;
      const sd = Math.sqrt(s / n);
      up[i] = mid[i] + mult * sd;
      dn[i] = mid[i] - mult * sd;
    }
    return { mid, up, dn };
  }
  function macdSeries(closes) {
    const e12 = emaSeries(closes, 12), e26 = emaSeries(closes, 26);
    const dif = closes.map((_, i) => e12[i] - e26[i]);
    const dea = emaSeries(dif, 9);
    const hist = dif.map((d, i) => (d - dea[i]) * 2);
    return { dif, dea, hist };
  }

  /* ---------- 时间格式 ---------- */
  function fmtTime(ts, period, tz) {
    const d = new Date(ts * 1000);
    const opt = { timeZone: tz || 'America/New_York' };
    if (period === 'm1' || period === 'm5' || period === 'm15') {
      return d.toLocaleString('en-GB', { ...opt, month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).replace(',', '');
    }
    if (period === 'mo' || period === 'y') {
      return d.toLocaleDateString('en-CA', { ...opt, year: 'numeric', month: period === 'y' ? undefined : '2-digit' });
    }
    return d.toLocaleDateString('en-CA', opt); // yyyy-mm-dd
  }

  function KChart(canvas, opts) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.opts = opts || {};
    this.candles = [];
    this.period = 'd';
    this.tz = 'America/New_York';
    this.ind = { ma: true, boll: false, macd: true };
    this.count = 120;          // 可见K线数
    this.end = 0;              // 可见区间末尾索引(不含)
    this.hover = -1;
    this._bindEvents();
  }

  KChart.prototype.setData = function (candles, period, tz, preserve) {
    const oldLen = this.candles.length;
    const atRight = this.end >= oldLen;   // 用户正跟随最新K线
    this.candles = candles || [];
    this.period = period;
    this.tz = tz || this.tz;
    if (!this.candles.length) {           // 清空（切换股票）：不动 count，避免塌缩
      this.end = 0;
      this.hover = -1;
      this._calc();
      this.render();
      return;
    }
    if (preserve && oldLen) {
      // 同一序列刷新：保留缩放与平移位置；在最右端则继续跟随最新
      this.end = atRight ? this.candles.length : Math.min(this.end, this.candles.length);
      if (this.hover >= this.candles.length) this.hover = -1;
    } else {
      // 新序列：重置为默认视图
      this.count = 120;
      this.end = this.candles.length;
      this.hover = -1;
    }
    this.count = Math.min(Math.max(this.count, 10), this.candles.length);
    this.end = Math.min(Math.max(this.end, this.count), this.candles.length);
    this._calc();
    this.render();
  };

  KChart.prototype.setIndicators = function (ind) {
    Object.assign(this.ind, ind);
    this.render();
  };

  KChart.prototype._calc = function () {
    const closes = this.candles.map(c => c[4]);
    this.ma = {};
    for (const n of [5, 10, 20, 60]) if (closes.length >= n) this.ma[n] = smaSeries(closes, n);
    this.boll = closes.length >= 20 ? bollSeries(closes) : null;
    this.macd = closes.length >= 26 ? macdSeries(closes) : null;
  };

  /* ---------- 交互 ---------- */
  KChart.prototype._bindEvents = function () {
    const cv = this.canvas;
    let dragX = null, dragEnd = 0;
    cv.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (!this.candles.length) return;
      const dir = e.deltaY > 0 ? 1.15 : 0.87;
      const newCount = Math.round(Math.min(Math.max(this.count * dir, 15), this.candles.length));
      if (newCount === this.count) return;
      // 以鼠标位置为锚点缩放：光标下的K线保持在原位
      const rect = cv.getBoundingClientRect();
      const frac = Math.min(Math.max((e.clientX - rect.left) / (rect.width - PAD_R), 0), 1);
      const anchor = (this.end - this.count) + frac * this.count;
      this.end = Math.round(Math.min(Math.max(anchor + (1 - frac) * newCount, newCount), this.candles.length));
      this.count = newCount;
      this.render();
    }, { passive: false });
    cv.addEventListener('mousedown', (e) => { dragX = e.clientX; dragEnd = this.end; });
    window.addEventListener('mouseup', () => { dragX = null; });
    cv.addEventListener('mousemove', (e) => {
      const rect = cv.getBoundingClientRect();
      if (dragX !== null) {
        const perBar = (rect.width - PAD_R) / this.count;
        const shift = Math.round((e.clientX - dragX) / perBar);
        // 向右拖动(shift>0)显示更早数据 => end 减小
        this.end = Math.min(Math.max(dragEnd - shift, this.count), this.candles.length);
      }
      const x = e.clientX - rect.left;
      const start = this.end - this.count;
      const idx = start + Math.floor(x / ((rect.width - PAD_R) / this.count));
      this.hover = (idx >= start && idx < this.end) ? idx : -1;
      this._lastY = e.clientY - rect.top;
      this.render();
    });
    cv.addEventListener('mouseleave', () => { this.hover = -1; this.render(); });
  };

  /* ---------- 渲染 ---------- */
  KChart.prototype.render = function () {
    const cv = this.canvas, ctx = this.ctx;
    const dpr = window.devicePixelRatio || 1;
    const W = cv.clientWidth, H = cv.clientHeight;
    if (W < 40 || H < 40) return;   // 布局未就绪（隐藏/0宽）时跳过，避免清空画布
    if (cv.width !== W * dpr || cv.height !== H * dpr) {
      cv.width = W * dpr;
      cv.height = H * dpr;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (!this.candles.length) return;

    const start = Math.max(this.end - this.count, 0);
    const view = this.candles.slice(start, this.end);
    if (!view.length) return;

    // 窗格布局
    const showMacd = this.ind.macd && this.macd;
    const macdH = showMacd ? Math.round(H * 0.2) : 0;
    const volH = Math.round(H * 0.13);
    const mainH = H - PAD_B - volH - macdH;
    const plotW = W - PAD_R;
    const barW = plotW / view.length;
    const cw = Math.max(Math.min(barW * 0.7, 20), 1);

    // 主图价格范围（含BOLL）
    let lo = Infinity, hi = -Infinity;
    for (let i = 0; i < view.length; i++) {
      hi = Math.max(hi, view[i][2]);
      lo = Math.min(lo, view[i][3]);
      const gi = start + i;
      if (this.ind.boll && this.boll && this.boll.up[gi] != null) {
        hi = Math.max(hi, this.boll.up[gi]);
        lo = Math.min(lo, this.boll.dn[gi]);
      }
    }
    const padP = (hi - lo) * 0.06 || hi * 0.01;
    hi += padP; lo -= padP;
    const py = (p) => mainH - ((p - lo) / (hi - lo)) * mainH;
    const bx = (i) => i * barW + barW / 2;

    // 网格 + 价格刻度
    ctx.font = '11px system-ui';
    ctx.textBaseline = 'middle';
    for (let g = 0; g <= 4; g++) {
      const p = lo + (hi - lo) * g / 4;
      const y = py(p);
      ctx.strokeStyle = GRID;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(plotW, y); ctx.stroke();
      ctx.fillStyle = TEXT;
      ctx.fillText(p >= 1000 ? p.toFixed(0) : p.toFixed(2), plotW + 6, y);
    }
    // 时间刻度
    const ticks = Math.min(6, view.length);
    ctx.textAlign = 'center';
    for (let g = 0; g < ticks; g++) {
      const i = Math.min(Math.floor(view.length * g / (ticks - 1 || 1)), view.length - 1);
      ctx.fillStyle = TEXT;
      ctx.fillText(fmtTime(view[i][0], this.period, this.tz), Math.min(Math.max(bx(i), 34), plotW - 40), H - PAD_B / 2);
    }
    ctx.textAlign = 'left';

    // 蜡烛
    for (let i = 0; i < view.length; i++) {
      const [, o, h, l, c] = view[i];
      const up = c >= o;
      ctx.strokeStyle = ctx.fillStyle = up ? UP : DOWN;
      const x = bx(i);
      ctx.beginPath(); ctx.moveTo(x, py(h)); ctx.lineTo(x, py(l)); ctx.stroke();
      const top = py(Math.max(o, c)), bot = py(Math.min(o, c));
      const bh = Math.max(bot - top, 1);
      if (up) ctx.fillRect(x - cw / 2, top, cw, bh);
      else ctx.fillRect(x - cw / 2, top, cw, bh);
    }

    // MA / BOLL 线
    const drawLine = (series, color, dash) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.setLineDash(dash || []);
      ctx.beginPath();
      let started = false;
      for (let i = 0; i < view.length; i++) {
        const v = series[start + i];
        if (v == null) continue;
        const x = bx(i), y = py(v);
        if (!started) { ctx.moveTo(x, y); started = true; } else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineWidth = 1;
    };
    if (this.ind.ma) for (const n of [5, 10, 20, 60]) if (this.ma[n]) drawLine(this.ma[n], MA_COLORS[n]);
    if (this.ind.boll && this.boll) {
      drawLine(this.boll.mid, BOLL_COLOR);
      drawLine(this.boll.up, BOLL_COLOR, [4, 3]);
      drawLine(this.boll.dn, BOLL_COLOR, [4, 3]);
    }

    // 成交量
    const volTop = mainH + 4;
    let vmax = 0;
    for (const c of view) vmax = Math.max(vmax, c[5]);
    for (let i = 0; i < view.length; i++) {
      const [, o, , , c, v] = view[i];
      ctx.fillStyle = (c >= o ? UP : DOWN) + '99';
      const vh = vmax ? (v / vmax) * (volH - 8) : 0;
      ctx.fillRect(bx(i) - cw / 2, volTop + (volH - 8) - vh, cw, vh);
    }

    // MACD
    if (showMacd) {
      const mTop = mainH + volH;
      let mhi = 0;
      for (let i = 0; i < view.length; i++) {
        const gi = start + i;
        mhi = Math.max(mhi, Math.abs(this.macd.dif[gi] || 0), Math.abs(this.macd.dea[gi] || 0), Math.abs(this.macd.hist[gi] || 0));
      }
      mhi = mhi || 1;
      const my = (v) => mTop + macdH / 2 - (v / mhi) * (macdH / 2 - 8);
      ctx.strokeStyle = GRID;
      ctx.beginPath(); ctx.moveTo(0, my(0)); ctx.lineTo(plotW, my(0)); ctx.stroke();
      for (let i = 0; i < view.length; i++) {
        const h = this.macd.hist[start + i] || 0;
        ctx.fillStyle = h >= 0 ? UP : DOWN;
        ctx.fillRect(bx(i) - Math.max(cw / 3, 0.5), my(0), Math.max(cw / 1.5, 1), my(h) - my(0));
      }
      const drawM = (series, color) => {
        ctx.strokeStyle = color;
        ctx.beginPath();
        let st = false;
        for (let i = 0; i < view.length; i++) {
          const v = series[start + i];
          if (v == null) continue;
          if (!st) { ctx.moveTo(bx(i), my(v)); st = true; } else ctx.lineTo(bx(i), my(v));
        }
        ctx.stroke();
      };
      drawM(this.macd.dif, DIF_C);
      drawM(this.macd.dea, DEA_C);
      ctx.fillStyle = TEXT;
      ctx.fillText('MACD(12,26,9)', 6, mTop + 10);
    }

    // 十字光标 + 悬浮信息
    if (this.hover >= 0) {
      const i = this.hover - start;
      const x = bx(i);
      ctx.strokeStyle = CROSS;
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H - PAD_B); ctx.stroke();
      if (this._lastY != null && this._lastY < mainH) {
        ctx.beginPath(); ctx.moveTo(0, this._lastY); ctx.lineTo(plotW, this._lastY); ctx.stroke();
        const price = lo + (1 - this._lastY / mainH) * (hi - lo);
        ctx.fillStyle = '#1a212b';
        ctx.fillRect(plotW, this._lastY - 9, PAD_R, 18);
        ctx.fillStyle = '#e8edf2';
        ctx.fillText(price >= 1000 ? price.toFixed(0) : price.toFixed(2), plotW + 6, this._lastY);
      }
      ctx.setLineDash([]);
      const c = this.candles[this.hover];
      const chg = i > 0 || start > 0
        ? ((c[4] / this.candles[this.hover - 1][4] - 1) * 100) : 0;
      const parts = [
        fmtTime(c[0], this.period, this.tz),
        'O ' + c[1], 'H ' + c[2], 'L ' + c[3], 'C ' + c[4],
        (chg >= 0 ? '+' : '') + chg.toFixed(2) + '%',
        'V ' + (c[5] >= 1e6 ? (c[5] / 1e6).toFixed(1) + 'M' : c[5] >= 1e3 ? (c[5] / 1e3).toFixed(0) + 'K' : c[5]),
      ];
      ctx.fillStyle = 'rgba(17,24,32,.88)';
      const text = parts.join('   ');
      const tw = ctx.measureText(text).width + 16;
      ctx.fillRect(6, 4, tw, 20);
      ctx.fillStyle = c[4] >= c[1] ? UP : DOWN;
      ctx.fillText(text, 14, 14);
    }

    // MA 图例
    if (this.ind.ma) {
      let lx = 8, ly = this.hover >= 0 ? 34 : 14;
      for (const n of [5, 10, 20, 60]) {
        if (!this.ma[n]) continue;
        const v = this.ma[n][(this.hover >= 0 ? this.hover : this.end - 1)];
        if (v == null) continue;
        ctx.fillStyle = MA_COLORS[n];
        const s = `MA${n} ${v >= 1000 ? v.toFixed(0) : v.toFixed(2)}`;
        ctx.fillText(s, lx, ly);
        lx += ctx.measureText(s).width + 12;
      }
    }
  };

  window.KChart = KChart;
})();
