// 调试探针：往 dist/index.html 注入错误捕获与执行阶段标记
// 用法：npm run build && node scripts/inject-probe.mjs
import { readFileSync, writeFileSync } from 'node:fs'

let html = readFileSync('dist/index.html', 'utf8')

const probe = `<script>
  window.__probeAlive = true;
  window.addEventListener('error', function (e) {
    var d = document.getElementById('initial-loading');
    if (d) {
      d.innerHTML = '<pre style="color:red;white-space:pre-wrap;padding:20px">'
        + (e.message || '') + '\\n' + (e.filename || '') + ':' + (e.lineno || '')
        + '\\n' + ((e.error && e.error.stack) || '') + '</pre>';
    }
  }, true);
  window.addEventListener('unhandledrejection', function (e) {
    var d = document.getElementById('initial-loading');
    if (d) {
      var r = e.reason;
      d.innerHTML = '<pre style="color:red;white-space:pre-wrap;padding:20px">'
        + ((r && (r.stack || r.message)) || String(r)) + '</pre>';
    }
  }, true);
</script>`

const stage = `<script type="module">
  var d = document.getElementById('initial-loading');
  if (d && d.querySelector('.loader-logo')) {
    d.innerHTML += '<pre id="dbg" style="padding:20px">模块已执行但 React 未渲染 | 探针存活: '
      + window.__probeAlive + '</pre>';
  }
</script>`

html = html.replace('</head>', probe + '</head>')
html = html.replace('</body>', stage + '</body>')

writeFileSync('dist/index.html', html)
console.log('探针注入完成')
