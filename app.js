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

    // ====== 已有物资 ======
    var inventorySearchKey = '';

    function renderInventory() {
        var list = document.getElementById('inventoryList');
        if (!list) return;
        var data = window.INVENTORY || [];
        if (!data.length) {
            list.innerHTML = '<p class="empty-tip">暂无物资数据。请在 inventory.js 中登记。</p>';
            return;
        }
        var kw = inventorySearchKey.trim().toLowerCase();
        var filtered = data;
        if (kw) {
            filtered = data.filter(function (it) {
                return (it.name || '').toLowerCase().indexOf(kw) !== -1;
            });
        }
        if (!filtered.length) {
            list.innerHTML = '<p class="empty-tip">没有匹配「' + escapeHtml(inventorySearchKey.trim()) + '」的物资</p>';
            return;
        }
        list.innerHTML = filtered.map(function (it) {
            var note = it.note ? '<span class="inv-note">' + escapeHtml(it.note) + '</span>' : '';
            return ''
                + '<div class="inv-card">'
                + '  <div class="inv-card-head">'
                + '    <span class="inv-name">' + escapeHtml(it.name) + '</span>'
                + '    ' + note
                + '  </div>'
                + '  <div class="inv-qty">' + it.qty + '<span class="inv-unit">' + escapeHtml(it.unit || '个') + '</span></div>'
                + '</div>';
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
            var qty = sel ? sel.qty : (p.qty || 1);
            var awardTag = p.award ? '<span class="prize-award">' + escapeHtml(p.award) + '</span>' : '';
            var noteTag = p.note ? '<span class="prize-note">' + escapeHtml(p.note) + '</span>' : '';
            return ''
                + '<div class="prize-card" data-key="' + key + '" data-name="' + escapeAttr(p.name) + '" data-price="' + p.price + '">'
                + '  <label class="prize-check">'
                + '    <input type="checkbox" class="prize-cb" ' + checked + '>'
                + '    <span class="prize-name">' + escapeHtml(p.name) + '</span>'
                + '    ' + awardTag
                + '  </label>'
                + '  <span class="prize-price">¥' + p.price.toFixed(2) + '</span>'
                + '  <label class="prize-qty-label">数量'
                + '    <input type="number" class="prize-qty" min="1" step="1" value="' + qty + '" ' + (sel ? '' : 'disabled') + '>'
                + '  </label>'
                + (noteTag ? '  <div class="prize-extra">' + noteTag + '</div>' : '')
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

    // 模板定义：每个模板是一组章节 { title, key, rows, placeholder }
    var TEMPLATES = {
        // 迎新活动
        welcome: [
            { title: '一、活动背景', key: 'background', rows: 3, placeholder: '例：金秋来临，开学季即将到来。为了给新生送上祝福…' },
            { title: '三、活动对象', key: 'audience', rows: 2, placeholder: '例：暨南大学法学院/知识产权学院2024级本科新生' },
            { title: '四、活动宗旨', key: 'purpose', rows: 3, placeholder: '例：本次活动旨在迎接新生，为新生留下良好的印象并做出校园指引…' },
            { title: '五、活动准备', key: 'prepare', rows: 4, placeholder: '可分点写，例：\n1.物资：具体物资准备及预算见附件一\n2.人员安排：具体人员安排见附件二\n3.活动宣传：由宣编部完成推文' },
            { title: '六、活动内容', key: 'content', rows: 8, placeholder: '可分活动前/活动中/活动后写' },
            { title: '七、活动宣传', key: 'promo', rows: 2, placeholder: '例：由“迎新宣传组”现场拍照，活动结束后总结推送' },
            { title: '八、活动联系', key: 'contact', rows: 2, placeholder: '例：本次活动具体事宜将通过官方咨询群进行回复' }
        ],
        // 毕业晚会
        gala: [
            { title: '一、活动概述', key: 'overview', rows: 6, placeholder: '可分点写：\n1、活动名称\n2、活动目的\n3、活动时间\n4、活动地点\n5、负责单位\n6、活动对象' },
            { title: '二、活动内容和活动流程', key: 'flow', rows: 10, placeholder: '可分：\n1、前期准备\n（1）前期宣传与准备\n（2）主持人选拔及节目收集\n（3）彩排流程\n2、活动流程\n3、活动结束' },
            { title: '三、前期物资与人员准备', key: 'resources', rows: 8, placeholder: '1、物资准备\n物资类别 物品 单价 数量 购买方式\n2、人员准备\n人员 用途 数量 采用方式' },
            { title: '四、应急准备方案', key: 'emergency', rows: 8, placeholder: '1、成立应急小组\n2、现场应急实施' },
            { title: '五、创意市集（待定）', key: 'market', rows: 8, placeholder: '摊位 活动形式\n例：幸运刮刮乐 / 寄语未来 / 拼贴诗 / 拍立得留念…' }
        ],
        // 足球趣味赛
        football: [
            { title: '一、参赛对象', key: 'audience', rows: 2, placeholder: '例：法学院/知识产权学院本科内外招生、研究生' },
            { title: '二、活动目的', key: 'purpose', rows: 4, placeholder: '例：为进一步强化学院各班级、专业的团队向心力与协作效能…' },
            { title: '三、参赛要求', key: 'requirement', rows: 3, placeholder: '例：所有项目均以团队为单位参赛，每组6-8人、男女混合组队；全程采用积分制…' },
            { title: '四、比赛时间与地点', key: 'timeplace', rows: 2, placeholder: '例：比赛时间未定\n地点：操场' },
            { title: '五、比赛项目', key: 'events', rows: 4, placeholder: '例：\n1.颠球\n2.抢圈\n3.绕杆射门\n4.足球九宫格' },
            { title: '六、比赛规则及积分标准', key: 'rules', rows: 12, placeholder: '可分项目写规则，例：\n（一）颠球\n1.起球…\n2.有效颠球规范…\n3.规则机制…\n4.胜负判定与积分排名…\n（二）抢圈\n…' },
            { title: '七、活动流程', key: 'flow', rows: 8, placeholder: '例：\n14:00-14:30 签到集合，领取团队编号牌与活动物资\n14:30-15:00 核心赛A（颠球挑战）\n15:00-15:40 核心赛B（抢圈训练）\n…\n17:45-18:00 集体合影留念，活动结束' },
            { title: '八、奖品设置', key: 'prizes', rows: 6, placeholder: '例：\n（一）奖项设置\n1、团体一等奖（总积分第1名）：1组\n2、团体二等奖（总积分第2-3名）：2组\n3、团体三等奖（总积分第4-6名）：3组\n（二）奖品参考\n待定' }
        ],
        // 通用体育比赛
        sports: [
            { title: '一、活动背景', key: 'background', rows: 3, placeholder: '例：为丰富同学课余生活，增强体质，促进班级交流…' },
            { title: '二、活动对象', key: 'audience', rows: 2, placeholder: '例：法学院/知识产权学院全体本科生' },
            { title: '三、比赛项目与规则', key: 'rules', rows: 6, placeholder: '比赛项目、赛制、规则说明' },
            { title: '四、活动流程', key: 'flow', rows: 8, placeholder: '例：\n14:00 开幕式\n14:30 小组赛\n17:00 决赛\n18:00 颁奖' },
            { title: '五、人员安排', key: 'staff2', rows: 4, placeholder: '裁判、记录员、后勤等分工' },
            { title: '六、注意事项', key: 'notes', rows: 3, placeholder: '例：雨天顺延；参赛同学需自备运动鞋' }
        ],
        // 自定义（空白 6 个章节，可自由填写）
        custom: [
            { title: '一、', key: 's1', rows: 4, placeholder: '输入标题和内容' },
            { title: '二、', key: 's2', rows: 4, placeholder: '输入标题和内容' },
            { title: '三、', key: 's3', rows: 4, placeholder: '输入标题和内容' },
            { title: '四、', key: 's4', rows: 4, placeholder: '输入标题和内容' },
            { title: '五、', key: 's5', rows: 4, placeholder: '输入标题和内容' },
            { title: '六、', key: 's6', rows: 4, placeholder: '输入标题和内容' }
        ]
    };

    var currentTemplate = 'welcome';

    function renderSections() {
        var container = document.getElementById('sectionsContainer');
        if (!container) return;
        var sections = TEMPLATES[currentTemplate] || [];
        container.innerHTML = sections.map(function (s, i) {
            var label = currentTemplate === 'custom'
                ? '<input type="text" class="section-title-input" data-key="' + s.key + '" placeholder="章节标题（如：一、活动背景）" value="' + escapeAttr(s.title) + '">'
                : escapeHtml(s.title);
            return ''
                + '<div class="form-row section-row">'
                + '  <label class="form-label">' + label
                + '    <textarea name="sec_' + s.key + '" class="form-input" rows="' + s.rows + '" placeholder="' + escapeAttr(s.placeholder || '') + '"></textarea>'
                + '  </label>'
                + '</div>';
        }).join('');
    }

    function getFormData() {
        var form = document.getElementById('planForm');
        var sections = TEMPLATES[currentTemplate] || [];
        var data = {
            template: currentTemplate,
            org: form.org.value.trim(),
            orgFull: form.orgFull.value.trim(),
            name: form.name.value.trim(),
            host: form.host.value.trim(),
            organizer: form.organizer.value.trim(),
            time: form.time.value.trim(),
            place: form.place.value.trim(),
            date: form.date.value.trim(),
            budget: form.budget.value.trim(),
            staff: form.staff.value.trim(),
            sections: []
        };
        sections.forEach(function (s) {
            var title = s.title;
            if (currentTemplate === 'custom') {
                var titleInput = container = document.querySelector('.section-title-input[data-key="' + s.key + '"]');
                if (titleInput && titleInput.value.trim()) title = titleInput.value.trim();
            }
            var content = (form['sec_' + s.key] ? form['sec_' + s.key].value : '').trim();
            data.sections.push({ title: title, content: content });
        });
        return data;
    }

    // 把多行文本转成 <p> 段落（空行分段）
    function textToParagraphs(text) {
        if (!text) return '<p>—</p>';
        return text.split(/\n\s*\n/).filter(function (p) { return p.trim(); }).map(function (p) {
            return '<p>' + nl2br(escapeHtml(p.trim())) + '</p>';
        }).join('');
    }

    function buildPlanHTML(d) {
        var prizeRows = selectedPrizes.length
            ? selectedPrizes.map(function (p) {
                return '<tr><td>' + escapeHtml(p.name) + '</td><td>' + p.price.toFixed(2) + '</td><td>' + p.qty + '</td><td>' + (p.price * p.qty).toFixed(2) + '</td></tr>';
            }).join('')
            : '';
        var prizeTotal = selectedPrizes.reduce(function (s, p) { return s + p.price * p.qty; }, 0);

        var org = d.org || '法学院/知识产权学院';
        var orgFull = d.orgFull || (org + '团委、学生会');
        var host = d.host || orgFull;
        var organizer = d.organizer || orgFull;
        var dept = host; // 负责部门默认同主办单位

        // 封面底部信息：用内联样式 + <u> 标签做下划线，确保 Word 兼容
        // padVal：把值用全角空格补到固定宽度，让下划线结尾对齐
        function padVal(s) {
            var target = 20; // 固定约20个中文字符宽
            var len = 0;
            for (var i = 0; i < s.length; i++) {
                len += s.charCodeAt(i) > 127 ? 2 : 1; // 中文算2，英文算1
            }
            var need = target * 2 - len;
            if (need <= 0) return s; // 超长不补
            var pad = '';
            for (var j = 0; j < Math.floor(need / 2); j++) pad += '\u3000'; // 全角空格
            if (need % 2 === 1) pad += ' '; // 奇数补一个半角空格
            return s + pad;
        }
        // 封面底部信息：只输出有内容的行
        function infoLine(label, val) {
            if (!val) return '';
            return '<div class="cover-info-line">\u3000\u3000\u3000\u3000 ' + label + '<u>' + escapeHtml(padVal(val)) + '</u></div>';
        }
        var coverInfoHtml = infoLine('项目名称：', d.name || '')
            + infoLine('主办单位：', host)
            + infoLine('承办单位：', organizer)
            + infoLine('负责部门：', dept);
        var coverInfo = coverInfoHtml ? '<div class="cover-info">' + coverInfoHtml + '</div>' : '';

        // 封面页（独立一页：顶部学院+活动名，中部策划书竖排，底部信息）
        var coverPage = ''
            + '<div class="cover-page">'
            + '  <div class="cover-top">'
            + '    <p class="cover-org">暨南大学' + escapeHtml(org) + '</p>'
            + '    <p class="cover-activity">' + escapeHtml(d.name || '') + '</p>'
            + '  </div>'
            + '  <div class="cover-center">'
            + '    <div class="cover-title">策<br>划<br>书</div>'
            + '  </div>'
            + coverInfo
            + '</div>';

        // 正文章节（跳过内容为空的章节，重新按顺序编号 一、二、三、…）
        var cnNums = ['一','二','三','四','五','六','七','八','九','十','十一','十二','十三','十四','十五'];
        var nonEmptySections = (d.sections || []).filter(function (s) {
            return s.content && s.content.trim();
        });
        var sectionsHtml = nonEmptySections.map(function (s, i) {
            // 去掉原标题开头的"一、""二、"等编号，用重新计算的序号
            var title = (s.title || '').replace(/^[一二三四五六七八九十]+、\s*/, '');
            var num = cnNums[i] || (i + 1);
            return '<h2>' + num + '、' + escapeHtml(title) + '</h2>' + textToParagraphs(s.content);
        }).join('');

        // 附件一：物资与经费预算（没选奖品且没填预算时不输出）
        var attachment1 = '';
        if (selectedPrizes.length || d.budget) {
            attachment1 = ''
                + '<h2>附件一 物资与活动经费预算</h2>'
                + '<table class="budget-table">'
                + '  <tr><th>名称</th><th>单价/元</th><th>数量</th><th>总价/元</th></tr>'
                + prizeRows
                + (selectedPrizes.length ? '<tr><td colspan="3" style="text-align:right;font-weight:bold">合计</td><td style="font-weight:bold">' + prizeTotal.toFixed(2) + '</td></tr>' : '')
                + (d.budget ? '<tr><td colspan="3" style="text-align:right;font-weight:bold">预算总额</td><td style="font-weight:bold">' + escapeHtml(d.budget) + '</td></tr>' : '')
                + '</table>';
        }

        // 附件二：人员安排（没填时不输出）
        var attachment2 = d.staff
            ? '<h2>附件二 人员安排</h2>' + textToParagraphs(d.staff)
            : '';

        return ''
            + '<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><title>'
            + escapeHtml(d.name || '策划书') + '</title><style>'
            + 'body{font-family:"SimSun","宋体","Microsoft YaHei",serif;max-width:800px;margin:40px auto;padding:0 24px;color:#000;line-height:1.8;font-size:14px}'
            // 封面页样式
            + '.cover-page{position:relative;min-height:90vh;text-align:center;padding:60px 40px;margin-bottom:20px;page-break-after:always}'
            + '.cover-top{margin-top:40px}'
            + '.cover-org{font-family:"SimSun","宋体",serif;font-size:18px;margin:0 0 16px}'
            + '.cover-activity{font-family:"KaiTi_GB2312","楷体_GB2312","KaiTi","楷体",serif;font-size:26px;font-weight:bold;margin:0 0 60px;line-height:1.6}'
            + '.cover-center{margin:40px 0}'
            + '.cover-title{font-family:"STXinwei","华文新魏","FZXiWei-Medium","KaiTi","楷体",serif;font-size:48pt;font-weight:bold;line-height:1.4}'
            + '.cover-info{margin-top:60px;text-align:left;font-size:14px}'
            + '.cover-info-line{margin:0;padding:0;line-height:1.0;text-indent:0;text-align:left}'
            // 正文样式
            + 'h2{font-size:16px;font-weight:bold;margin:24px 0 8px}'
            + 'p{margin:6px 0;text-indent:2em}'
            + 'table{width:100%;border-collapse:collapse;margin:10px 0;font-size:13px}'
            + 'th,td{border:1px solid #000;padding:6px 8px;text-align:left}'
            + 'th{background:#f0f0f0;font-weight:bold}'
            + '.budget-table th,.budget-table td{text-align:center;border:1px solid #000}'
            + '.sign{text-align:right;margin-top:40px;line-height:2}'
            + '.sign p{text-indent:0}'
            + '@media print{body{margin:0;padding:0;max-width:none}table,th,td{page-break-inside:avoid}h2{page-break-after:avoid}.budget-table{page-break-inside:auto}.cover-page{page-break-after:always}}'
            + '</style></head><body>'
            + coverPage
            + sectionsHtml
            + (orgFull || d.date ? ''
                + '<div class="sign">'
                + (orgFull ? '  <p>' + escapeHtml(orgFull) + '</p>' : '')
                + (d.date ? '  <p>' + escapeHtml(d.date) + '</p>' : '')
                + '</div>' : '')
            + attachment1
            + attachment2
            + '</body></html>';
    }

    // 生成 Word (.doc) 格式 —— HTML 内容包在 Word XML 命名空间里，Word 可直接打开
    function buildPlanDoc(d) {
        var html = buildPlanHTML(d);
        // 用字符串查找代替正则，稳健地提取 <body>...</body> 内部内容
        var bodyOpen = html.indexOf('<body>');
        var bodyClose = html.lastIndexOf('</body>');
        var inner = (bodyOpen !== -1 && bodyClose !== -1 && bodyClose > bodyOpen)
            ? html.substring(bodyOpen + '<body>'.length, bodyClose)
            : html; // 兜底：若找不到 body 标签，直接用原文
        // 提取原 HTML 中的 <style> 内容，确保封面字体和表格边框在 Word 中生效
        var styleContent = '';
        var styleOpen = html.indexOf('<style>');
        var styleClose = html.indexOf('</style>');
        if (styleOpen !== -1 && styleClose !== -1 && styleClose > styleOpen) {
            styleContent = html.substring(styleOpen + '<style>'.length, styleClose);
        }
        return ''
            + '<html xmlns:o="urn:schemas-microsoft-com:office:office" '
            + 'xmlns:w="urn:schemas-microsoft-com:office:word" '
            + 'xmlns="http://www.w3.org/TR/REC-html40">'
            + '<head><meta charset="UTF-8">'
            + '<!--[if gte mso 9]><xml><w:WordDocument><w:View>Print</w:View><w:Zoom>100</w:Zoom></w:WordDocument></xml><![endif]-->'
            + '<style>@page{size:A4;margin:2.54cm 3.18cm 2.54cm 3.18cm} body{font-family:"SimSun","宋体",serif} ' + styleContent + '</style>'
            + '</head><body>'
            + inner
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
        window.__lastPlanData = d;

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

    function downloadDoc() {
        try {
            var d = window.__lastPlanData || getFormData();
            if (!d.name) { alert('请先填写活动名称'); return; }
            var docContent = buildPlanDoc(d);
            // 加 BOM 让 Word 正确识别 UTF-8
            var blob = new Blob(['\ufeff' + docContent], { type: 'application/msword;charset=utf-8' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = (d.name || '策划书') + '.doc';
            document.body.appendChild(a);
            a.click();
            setTimeout(function () {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        } catch (err) {
            console.error('下载 Word 失败:', err);
            alert('下载 Word 失败：' + (err && err.message ? err.message : '未知错误') + '\n可尝试使用「下载 HTML」或「打印 / 另存 PDF」。');
        }
    }

    function printPlan() {
        if (!window.__lastPlanHTML) return;
        var w = window.open('', '_blank');
        w.document.open();
        w.document.write(window.__lastPlanHTML);
        w.document.close();
        w.focus();
        // 等页面渲染完成后再触发打印，避免表格等内容未渲染就被打印导致内容缺失
        if (w.matchMedia) {
            var timer = w.setTimeout(function () { w.print(); }, 300);
            w.addEventListener('afterprint', function () { w.clearTimeout(timer); w.close(); });
        } else {
            w.onload = function () { w.print(); };
        }
    }

    // 导出已选奖品为 Excel（SpreadsheetML 2003 XML 格式，Excel/WPS 可直接打开）
    function exportPrizesExcel() {
        if (!selectedPrizes.length) {
            alert('尚未选择奖品，请先在奖品库中勾选奖品。');
            return;
        }
        // XML 转义
        function xmlEsc(s) {
            return String(s).replace(/[&<>"']/g, function (c) {
                return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c];
            });
        }
        var total = selectedPrizes.reduce(function (s, p) { return s + p.price * p.qty; }, 0);
        var rows = selectedPrizes.map(function (p, i) {
            return ''
                + '<Row>'
                + '<Cell><Data ss:Type="Number">' + (i + 1) + '</Data></Cell>'
                + '<Cell><Data ss:Type="String">' + xmlEsc(p.name) + '</Data></Cell>'
                + '<Cell><Data ss:Type="Number">' + p.price.toFixed(2) + '</Data></Cell>'
                + '<Cell><Data ss:Type="Number">' + p.qty + '</Data></Cell>'
                + '<Cell><Data ss:Type="Number">' + (p.price * p.qty).toFixed(2) + '</Data></Cell>'
                + '<Cell><Data ss:Type="String">' + xmlEsc(p.level || '') + '</Data></Cell>'
                + '</Row>';
        }).join('');
        var xml = ''
            + '<?xml version="1.0" encoding="UTF-8"?>\n'
            + '<?mso-application progid="Excel.Sheet"?>\n'
            + '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" '
            + 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" '
            + 'xmlns:o="urn:schemas-microsoft-com:office:office">'
            + '<Styles>'
            + '<Style ss:ID="head"><Font ss:Bold="1"/><Interior ss:Color="#D9E1F2" ss:Pattern="Solid"/></Style>'
            + '<Style ss:ID="total"><Font ss:Bold="1"/></Style>'
            + '</Styles>'
            + '<Worksheet ss:Name="奖品清单">'
            + '<Table>'
            + '<Column ss:Width="50"/><Column ss:Width="200"/><Column ss:Width="80"/><Column ss:Width="60"/><Column ss:Width="90"/><Column ss:Width="80"/>'
            + '<Row ss:StyleID="head">'
            + '<Cell><Data ss:Type="String">序号</Data></Cell>'
            + '<Cell><Data ss:Type="String">名称</Data></Cell>'
            + '<Cell><Data ss:Type="String">单价(元)</Data></Cell>'
            + '<Cell><Data ss:Type="String">数量</Data></Cell>'
            + '<Cell><Data ss:Type="String">总价(元)</Data></Cell>'
            + '<Cell><Data ss:Type="String">价位</Data></Cell>'
            + '</Row>'
            + rows
            + '<Row ss:StyleID="total">'
            + '<Cell><Data ss:Type="String">合计</Data></Cell>'
            + '<Cell><Data ss:Type="String"></Data></Cell>'
            + '<Cell><Data ss:Type="String"></Data></Cell>'
            + '<Cell><Data ss:Type="String"></Data></Cell>'
            + '<Cell><Data ss:Type="Number">' + total.toFixed(2) + '</Data></Cell>'
            + '<Cell><Data ss:Type="String"></Data></Cell>'
            + '</Row>'
            + '</Table>'
            + '</Worksheet>'
            + '</Workbook>';
        try {
            var blob = new Blob(['\ufeff' + xml], { type: 'application/vnd.ms-excel;charset=utf-8' });
            var url = URL.createObjectURL(blob);
            var a = document.createElement('a');
            a.href = url;
            a.download = '奖品清单.xls';
            document.body.appendChild(a);
            a.click();
            setTimeout(function () {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
        } catch (err) {
            console.error('导出奖品 Excel 失败:', err);
            alert('导出失败：' + (err && err.message ? err.message : '未知错误'));
        }
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
        renderSections();
        renderPrizePanel();
        bindPrizeTabs();
        refreshPrizeUI();
        renderInventory();

        // 模板切换
        document.getElementById('templateSelect').addEventListener('click', function (e) {
            var btn = e.target.closest('.template-btn');
            if (!btn) return;
            document.querySelectorAll('.template-btn').forEach(function (b) { b.classList.remove('active'); });
            btn.classList.add('active');
            currentTemplate = btn.getAttribute('data-template');
            renderSections();
        });

        // 搜索框实时过滤
        var searchBox = document.getElementById('fileSearch');
        if (searchBox) {
            searchBox.addEventListener('input', function () {
                fileSearchKey = searchBox.value;
                renderFiles();
            });
        }

        // 已有物资搜索框
        var invSearch = document.getElementById('inventorySearch');
        if (invSearch) {
            invSearch.addEventListener('input', function () {
                inventorySearchKey = invSearch.value;
                renderInventory();
            });
        }

        document.getElementById('previewBtn').addEventListener('click', openPreview);
        document.getElementById('closeModal').addEventListener('click', closePreview);
        document.getElementById('downloadHtml').addEventListener('click', downloadPlan);
        document.getElementById('downloadDoc').addEventListener('click', downloadDoc);
        document.getElementById('printPlan').addEventListener('click', printPlan);
        document.getElementById('goPrizes').addEventListener('click', function () {
            document.getElementById('prizes').scrollIntoView({ behavior: 'smooth' });
        });

        // 导出已选奖品为 Excel
        var exportBtn = document.getElementById('exportPrizesExcel');
        if (exportBtn) exportBtn.addEventListener('click', exportPrizesExcel);

        // 点击遮罩关闭
        document.getElementById('previewModal').addEventListener('click', function (e) {
            if (e.target.id === 'previewModal') closePreview();
        });
    });
})();
