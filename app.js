// 文体部工作台 主逻辑
(function () {
    'use strict';

    // ====== 文件下载区 ======
    // ====== 文件下载区 ======
    var currentFileTag = 'all'; // 当前选中的分类，'all' 表示全部
    var fileSearchKey = '';     // 搜索关键词

    // tag → 颜色映射（按出现顺序循环分配）
    var TAG_COLORS = [
        { bg: '#2c5aa0', dark: '#1f4373' }, // 蓝
        { bg: '#e8a838', dark: '#c8861a' }, // 橙
        { bg: '#27ae60', dark: '#1e8449' }, // 绿
        { bg: '#8e44ad', dark: '#6c3483' }, // 紫
        { bg: '#c0392b', dark: '#922b21' }, // 红
        { bg: '#16a085', dark: '#0e6655' }, // 青
        { bg: '#d35400', dark: '#a04000' }, // 深橙
        { bg: '#2980b9', dark: '#1f5f8b' }, // 浅蓝
        { bg: '#f39c12', dark: '#c87f0a' }, // 黄
        { bg: '#7f8c8d', dark: '#5d6d6e' }  // 灰
    ];

    function getTagColorIndex(tag, tags) {
        var idx = tags.indexOf(tag);
        return idx >= 0 ? idx % TAG_COLORS.length : 0;
    }

    function renderFileTabs() {
        var container = document.getElementById('fileTabs');
        if (!container) return;
        var data = window.DOWNLOAD_FILES || [];
        // 收集所有 tag（按出现顺序）
        var tags = [];
        data.forEach(function (f) {
            var t = f.tag || '文件';
            if (tags.indexOf(t) === -1) tags.push(t);
        });
        if (!tags.length) { container.innerHTML = ''; return; }

        // 生成按钮：全部 + 各 tag
        var html = '<button class="file-tab' + (currentFileTag === 'all' ? ' active' : '') + '" data-tag="all" style="--tab-bg:#34495e;--tab-dark:#2c3e50">全部 <span class="file-tab-count">' + data.length + '</span></button>';
        tags.forEach(function (t) {
            var count = data.filter(function (f) { return (f.tag || '文件') === t; }).length;
            var ci = getTagColorIndex(t, tags);
            var c = TAG_COLORS[ci];
            var active = currentFileTag === t ? ' active' : '';
            html += '<button class="file-tab' + active + '" data-tag="' + escapeAttr(t) + '" style="--tab-bg:' + c.bg + ';--tab-dark:' + c.dark + '">' + escapeHtml(t) + ' <span class="file-tab-count">' + count + '</span></button>';
        });
        container.innerHTML = html;

        // 绑定点击
        container.querySelectorAll('.file-tab').forEach(function (btn) {
            btn.addEventListener('click', function () {
                currentFileTag = btn.getAttribute('data-tag');
                renderFileTabs();
                renderFiles();
            });
        });
    }

    function renderFiles() {
        var list = document.getElementById('fileList');
        if (!list) return;
        var data = window.DOWNLOAD_FILES || [];
        if (!data.length) {
            list.innerHTML = '<p class="empty-tip">暂无文件。请把文件放到仓库根目录，并在 files.js 中登记。</p>';
            return;
        }
        // 按当前 tag 筛选
        var filtered = currentFileTag === 'all'
            ? data
            : data.filter(function (f) { return (f.tag || '文件') === currentFileTag; });

        // 按搜索关键词过滤（匹配 name 或 desc，不区分大小写）
        var kw = fileSearchKey.trim().toLowerCase();
        if (kw) {
            filtered = filtered.filter(function (f) {
                return (f.name || '').toLowerCase().indexOf(kw) !== -1
                    || (f.desc || '').toLowerCase().indexOf(kw) !== -1;
            });
        }

        if (!filtered.length) {
            list.innerHTML = '<p class="empty-tip">' + (kw ? '没有匹配「' + escapeHtml(fileSearchKey.trim()) + '」的文件' : '该分类暂无文件') + '</p>';
            return;
        }

        // 收集所有 tag 用于颜色映射
        var tags = [];
        data.forEach(function (f) {
            var t = f.tag || '文件';
            if (tags.indexOf(t) === -1) tags.push(t);
        });

        list.innerHTML = filtered.map(function (f) {
            var t = f.tag || '文件';
            var ci = getTagColorIndex(t, tags);
            var c = TAG_COLORS[ci];
            return ''
                + '<a class="file-card" href="' + escapeAttr(f.file) + '" download>'
                + '  <div class="file-card-head">'
                + '    <span class="file-tag" style="background:' + c.bg + '">' + escapeHtml(t) + '</span>'
                + '    <span class="file-name">' + escapeHtml(f.name) + '</span>'
                + '  </div>'
                + '  <p class="file-desc">' + escapeHtml(f.desc || '') + '</p>'
                + '  <span class="file-btn" style="color:' + c.bg + ';border-color:' + c.bg + '">下载</span>'
                + '</a>';
        }).join('');
    }

    // ====== 奖品库 ======
    var selectedPrizes = []; // { name, price, qty, level }
    var currentLevel = 'low';

    function renderPrizePanel() {
        var panel = document.getElementById('prizePanel');
        if (!panel) return;

        if (currentLevel === 'custom') {
            panel.innerHTML = ''
                + '<div class="custom-prize-form">'
                + '  <input type="text" id="customName" class="form-input" placeholder="奖品名称">'
                + '  <input type="number" id="customPrice" class="form-input" placeholder="单价（元）" min="0" step="0.01">'
                + '  <input type="number" id="customQty" class="form-input" placeholder="数量" min="1" step="1" value="1">'
                + '  <button type="button" id="addCustomPrize" class="btn btn-primary">添加到已选</button>'
                + '</div>';
            document.getElementById('addCustomPrize').addEventListener('click', addCustomPrize);
            return;
        }

        var lib = (window.PRIZE_LIB || {})[currentLevel] || [];
        panel.innerHTML = lib.map(function (p, i) {
            var key = currentLevel + '-' + i;
            var sel = findSelected(p.name);
            var checked = sel ? 'checked' : '';
            var qty = sel ? sel.qty : 1;
            return ''
                + '<div class="prize-card" data-key="' + key + '" data-name="' + escapeAttr(p.name) + '" data-price="' + p.price + '">'
                + '  <label class="prize-check">'
                + '    <input type="checkbox" class="prize-cb" ' + checked + '>'
                + '    <span class="prize-name">' + escapeHtml(p.name) + '</span>'
                + '  </label>'
                + '  <span class="prize-price">¥' + p.price.toFixed(2) + '</span>'
                + '  <label class="prize-qty-label">数量'
                + '    <input type="number" class="prize-qty" min="1" step="1" value="' + qty + '" ' + (sel ? '' : 'disabled') + '>'
                + '  </label>'
                + '</div>';
        }).join('');

        // 绑定事件
        panel.querySelectorAll('.prize-card').forEach(function (card) {
            var cb = card.querySelector('.prize-cb');
            var qty = card.querySelector('.prize-qty');
            var name = card.getAttribute('data-name');
            var price = parseFloat(card.getAttribute('data-price'));
            cb.addEventListener('change', function () {
                if (cb.checked) {
                    qty.disabled = false;
                    addSelected({ name: name, price: price, qty: parseInt(qty.value, 10) || 1, level: currentLevel });
                } else {
                    qty.disabled = true;
                    removeSelected(name);
                }
                refreshPrizeUI();
            });
            qty.addEventListener('input', function () {
                updateQty(name, parseInt(qty.value, 10) || 1);
                refreshPrizeUI();
            });
        });
    }

    function addCustomPrize() {
        var name = document.getElementById('customName').value.trim();
        var price = parseFloat(document.getElementById('customPrice').value) || 0;
        var qty = parseInt(document.getElementById('customQty').value, 10) || 1;
        if (!name) { alert('请填写奖品名称'); return; }
        addSelected({ name: name, price: price, qty: qty, level: 'custom' });
        document.getElementById('customName').value = '';
        document.getElementById('customPrice').value = '';
        document.getElementById('customQty').value = '1';
        refreshPrizeUI();
    }

    function findSelected(name) {
        return selectedPrizes.find(function (p) { return p.name === name; });
    }
    function addSelected(p) {
        var exist = findSelected(p.name);
        if (exist) { exist.qty = p.qty; exist.price = p.price; }
        else { selectedPrizes.push(p); }
    }
    function removeSelected(name) {
        selectedPrizes = selectedPrizes.filter(function (p) { return p.name !== name; });
    }
    function updateQty(name, qty) {
        var s = findSelected(name);
        if (s) s.qty = qty;
    }

    function refreshPrizeUI() {
        // 已选奖品列表（奖品库下方）
        var sumList = document.getElementById('prizeSummaryList');
        if (sumList) {
            if (!selectedPrizes.length) {
                sumList.innerHTML = '<p class="empty-tip">尚未选择奖品</p>';
            } else {
                sumList.innerHTML = selectedPrizes.map(function (p) {
                    return ''
                        + '<div class="prize-summary-item">'
                        + '  <span class="ps-name">' + escapeHtml(p.name) + '</span>'
                        + '  <span class="ps-price">¥' + p.price.toFixed(2) + ' × ' + p.qty + '</span>'
                        + '  <span class="ps-sub">¥' + (p.price * p.qty).toFixed(2) + '</span>'
                        + '  <button type="button" class="ps-del" data-name="' + escapeAttr(p.name) + '">移除</button>'
                        + '</div>';
                }).join('');
                sumList.querySelectorAll('.ps-del').forEach(function (btn) {
                    btn.addEventListener('click', function () {
                        removeSelected(btn.getAttribute('data-name'));
                        renderPrizePanel();
                        refreshPrizeUI();
                    });
                });
            }
        }
        var total = selectedPrizes.reduce(function (s, p) { return s + p.price * p.qty; }, 0);
        var totalEl = document.getElementById('prizeTotal');
        if (totalEl) totalEl.textContent = total.toFixed(2);

        // 策划案表单内嵌的已选奖品
        var formBox = document.getElementById('selectedPrizes');
        if (formBox) {
            if (!selectedPrizes.length) {
                formBox.innerHTML = '<p class="empty-tip">尚未选择奖品，可在下方奖品库勾选，或手动添加。</p>';
            } else {
                formBox.innerHTML = selectedPrizes.map(function (p) {
                    return '<div class="selected-prize-line">' + escapeHtml(p.name) + '　¥' + p.price.toFixed(2) + ' × ' + p.qty + ' = ¥' + (p.price * p.qty).toFixed(2) + '</div>';
                }).join('');
            }
        }
    }

    function bindPrizeTabs() {
        document.querySelectorAll('.prize-tab').forEach(function (tab) {
            tab.addEventListener('click', function () {
                document.querySelectorAll('.prize-tab').forEach(function (t) { t.classList.remove('active'); });
                tab.classList.add('active');
                currentLevel = tab.getAttribute('data-level');
                renderPrizePanel();
            });
        });
    }

    // ====== 策划案生成 ======
    function getFormData() {
        var form = document.getElementById('planForm');
        return {
            name: form.name.value.trim(),
            time: form.time.value.trim(),
            place: form.place.value.trim(),
            purpose: form.purpose.value.trim(),
            flow: form.flow.value.trim(),
            budget: form.budget.value.trim(),
            owner: form.owner.value.trim(),
            notes: form.notes.value.trim()
        };
    }

    function buildPlanHTML(d) {
        var prizeRows = selectedPrizes.length
            ? selectedPrizes.map(function (p) {
                return '<tr><td>' + escapeHtml(p.name) + '</td><td>¥' + p.price.toFixed(2) + '</td><td>' + p.qty + '</td><td>¥' + (p.price * p.qty).toFixed(2) + '</td></tr>';
            }).join('')
            : '<tr><td colspan="4">无</td></tr>';
        var prizeTotal = selectedPrizes.reduce(function (s, p) { return s + p.price * p.qty; }, 0);

        var flowHtml = d.flow
            ? d.flow.split(/\r?\n/).filter(function (l) { return l.trim(); }).map(function (l) { return '<li>' + escapeHtml(l) + '</li>'; }).join('')
            : '<li>无</li>';

        var now = new Date();
        var stamp = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + ' ' + pad(now.getHours()) + ':' + pad(now.getMinutes());

        return ''
            + '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>'
            + escapeHtml(d.name || '策划案') + ' - 策划书</title><style>'
            + 'body{font-family:"Microsoft YaHei",sans-serif;max-width:800px;margin:40px auto;padding:0 24px;color:#222;line-height:1.7}'
            + 'h1{text-align:center;border-bottom:3px double #333;padding-bottom:12px}'
            + 'h2{border-left:5px solid #2c5aa0;padding-left:10px;margin-top:28px}'
            + 'table{width:100%;border-collapse:collapse;margin:8px 0}'
            + 'th,td{border:1px solid #999;padding:8px;text-align:left}'
            + 'th{background:#f0f4f8}'
            + '.meta{color:#666;text-align:center;font-size:14px;margin-bottom:24px}'
            + '.total{font-weight:bold;color:#c0392b}'
            + '@media print{body{margin:0;padding:0}}'
            + '</style></head><body>'
            + '<h1>' + escapeHtml(d.name || '（未命名活动）') + '</h1>'
            + '<p class="meta">文体部 · 生成时间：' + stamp + (d.owner ? ' · 负责人：' + escapeHtml(d.owner) : '') + '</p>'

            + '<h2>一、基本信息</h2>'
            + '<table>'
            + '<tr><th>活动名称</th><td>' + escapeHtml(d.name || '—') + '</td></tr>'
            + '<tr><th>活动时间</th><td>' + escapeHtml(d.time || '—') + '</td></tr>'
            + '<tr><th>活动地点</th><td>' + escapeHtml(d.place || '—') + '</td></tr>'
            + '<tr><th>负责人</th><td>' + escapeHtml(d.owner || '—') + '</td></tr>'
            + '</table>'

            + '<h2>二、活动目的</h2>'
            + '<p>' + nl2br(escapeHtml(d.purpose || '—')) + '</p>'

            + '<h2>三、活动流程</h2>'
            + '<ol>' + flowHtml + '</ol>'

            + '<h2>四、奖品设置</h2>'
            + '<table><tr><th>奖品名称</th><th>单价</th><th>数量</th><th>小计</th></tr>'
            + prizeRows
            + '<tr><td colspan="3" style="text-align:right">奖品合计</td><td class="total">¥' + prizeTotal.toFixed(2) + '</td></tr>'
            + '</table>'

            + '<h2>五、预算</h2>'
            + '<table>'
            + '<tr><th>预算总额</th><td>' + (d.budget ? '¥' + escapeHtml(d.budget) : '—') + '</td></tr>'
            + '<tr><th>其中奖品</th><td>¥' + prizeTotal.toFixed(2) + '</td></tr>'
            + '<tr><th>其他费用</th><td>' + (d.budget ? '¥' + (Math.max(0, parseFloat(d.budget) - prizeTotal)).toFixed(2) : '—') + '</td></tr>'
            + '</table>'

            + '<h2>六、注意事项</h2>'
            + '<p>' + nl2br(escapeHtml(d.notes || '—')) + '</p>'

            + '<p style="margin-top:48px;text-align:right;color:#888">—— 由文体部工作台生成</p>'
            + '</body></html>';
    }

    function openPreview() {
        var d = getFormData();
        if (!d.name || !d.time || !d.place) {
            alert('请至少填写活动名称、时间、地点');
            return;
        }
        var html = buildPlanHTML(d);
        var body = document.getElementById('previewBody');
        body.innerHTML = '<iframe id="previewFrame" style="width:100%;height:70vh;border:1px solid #ddd;border-radius:6px"></iframe>';
        var frame = document.getElementById('previewFrame');
        frame.contentDocument.open();
        frame.contentDocument.write(html);
        frame.contentDocument.close();

        // 暂存用于下载/打印
        window.__lastPlanHTML = html;

        document.getElementById('previewModal').classList.add('active');
    }

    function closePreview() {
        document.getElementById('previewModal').classList.remove('active');
    }

    function downloadPlan() {
        if (!window.__lastPlanHTML) return;
        var blob = new Blob([window.__lastPlanHTML], { type: 'text/html;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        var d = getFormData();
        a.href = url;
        a.download = (d.name || '策划案') + '.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function printPlan() {
        if (!window.__lastPlanHTML) return;
        var w = window.open('', '_blank');
        w.document.open();
        w.document.write(window.__lastPlanHTML);
        w.document.close();
        w.focus();
        w.print();
    }

    // ====== 工具 ======
    function escapeHtml(s) {
        return String(s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
        });
    }
    function escapeAttr(s) { return escapeHtml(s); }
    function nl2br(s) { return String(s).replace(/\r?\n/g, '<br>'); }
    function pad(n) { return n < 10 ? '0' + n : '' + n; }

    // ====== 初始化 ======
    document.addEventListener('DOMContentLoaded', function () {
        renderFileTabs();
        renderFiles();
        renderPrizePanel();
        bindPrizeTabs();
        refreshPrizeUI();

        // 搜索框实时过滤
        var searchBox = document.getElementById('fileSearch');
        if (searchBox) {
            searchBox.addEventListener('input', function () {
                fileSearchKey = searchBox.value;
                renderFiles();
            });
        }

        document.getElementById('previewBtn').addEventListener('click', openPreview);
        document.getElementById('closeModal').addEventListener('click', closePreview);
        document.getElementById('downloadHtml').addEventListener('click', downloadPlan);
        document.getElementById('printPlan').addEventListener('click', printPlan);
        document.getElementById('goPrizes').addEventListener('click', function () {
            document.getElementById('prizes').scrollIntoView({ behavior: 'smooth' });
        });

        // 点击遮罩关闭
        document.getElementById('previewModal').addEventListener('click', function (e) {
            if (e.target.id === 'previewModal') closePreview();
        });
    });
})();
