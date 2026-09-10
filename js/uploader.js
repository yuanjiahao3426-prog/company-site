// ============================================
// 通用图片上传组件（拖拽 / 点击 / 多图 / 预览 / 删除 / 排序）
// 依赖：config.js 中的 uploadImageFile（Supabase Storage）
// 用法：
//   const up = new ImageUploader(containerEl, {
//     multiple: true,        // 是否多图
//     max: 20,               // 最多多少张
//     folder: 'projects',    // Storage 子目录
//     value: ['url'],        // 初始图片
//     onChange: (urls)=>{}
//   });
//   up.getValue()  -> 返回图片 URL 数组
//   up.setValue([])
// ============================================

class ImageUploader {
  constructor(container, options) {
    this.container = container;
    this.opts = Object.assign({
      multiple: false,
      max: 20,
      folder: 'misc',
      value: [],
      onChange: null
    }, options || {});
    // 单图模式最多 1 张
    if (!this.opts.multiple) this.opts.max = 1;
    this.urls = Array.isArray(this.opts.value) ? this.opts.value.slice() : (this.opts.value ? [this.opts.value] : []);
    this.uploading = 0;
    this.render();
  }

  render() {
    const single = !this.opts.multiple;
    const tip = single
      ? '点击或拖拽图片到此处（支持 JPG / PNG / GIF，建议宽度 1600px 以上）'
      : '点击或拖拽图片到此处，可一次选多张（支持 JPG / PNG / GIF，最多 ' + this.opts.max + ' 张）';

    this.container.classList.add('img-uploader');
    this.container.innerHTML = `
      <div class="iu-dropzone" tabindex="0">
        <div class="iu-drop-icon">＋</div>
        <div class="iu-drop-text">${tip}</div>
        <input type="file" accept="image/jpeg,image/png,image/gif,image/webp" ${single ? '' : 'multiple'} hidden>
      </div>
      <div class="iu-preview"></div>
    `;

    this.dropzone = this.container.querySelector('.iu-dropzone');
    this.input = this.container.querySelector('input[type=file]');
    this.preview = this.container.querySelector('.iu-preview');

    // 点击选择
    this.dropzone.addEventListener('click', () => this.input.click());
    this.input.addEventListener('change', (e) => {
      this.handleFiles(e.target.files);
      this.input.value = '';
    });

    // 拖拽
    ['dragenter', 'dragover'].forEach(ev => {
      this.dropzone.addEventListener(ev, (e) => {
        e.preventDefault(); e.stopPropagation();
        this.dropzone.classList.add('dragover');
      });
    });
    ['dragleave', 'drop'].forEach(ev => {
      this.dropzone.addEventListener(ev, (e) => {
        e.preventDefault(); e.stopPropagation();
        this.dropzone.classList.remove('dragover');
      });
    });
    this.dropzone.addEventListener('drop', (e) => {
      const files = e.dataTransfer && e.dataTransfer.files;
      if (files && files.length) this.handleFiles(files);
    });

    this.renderPreview();
  }

  async handleFiles(fileList) {
    let files = Array.from(fileList || []);
    if (!files.length) return;

    const remain = this.opts.max - this.urls.length - this.uploading;
    if (remain <= 0) {
      alert('最多只能上传 ' + this.opts.max + ' 张图片');
      return;
    }
    if (files.length > remain) {
      alert('最多还能上传 ' + remain + ' 张，已自动截取');
      files = files.slice(0, remain);
    }

    for (const file of files) {
      await this.uploadOne(file);
    }
  }

  async uploadOne(file) {
    this.uploading++;
    // 先插入一个 loading 占位
    const tempId = 't' + Date.now() + Math.random().toString(36).slice(2, 6);
    this.urls.push(tempId);
    this.renderPreview();
    this.setDropzoneLoading(true);

    try {
      const url = await uploadImageFile(file, this.opts.folder);
      const idx = this.urls.indexOf(tempId);
      if (idx > -1) this.urls[idx] = url;
    } catch (err) {
      const idx = this.urls.indexOf(tempId);
      if (idx > -1) this.urls.splice(idx, 1);
      alert('图片上传失败：' + (err.message || err));
    } finally {
      this.uploading--;
      this.setDropzoneLoading(this.uploading > 0);
      this.renderPreview();
      this.emitChange();
    }
  }

  setDropzoneLoading(loading) {
    if (loading) {
      this.dropzone.classList.add('uploading');
      this.dropzone.querySelector('.iu-drop-text').textContent = '图片上传中，请稍候…';
    } else {
      this.dropzone.classList.remove('uploading');
      const single = !this.opts.multiple;
      this.dropzone.querySelector('.iu-drop-text').textContent = single
        ? '点击或拖拽图片到此处（支持 JPG / PNG / GIF）'
        : '点击或拖拽图片到此处，可一次选多张（支持 JPG / PNG / GIF，最多 ' + this.opts.max + ' 张）';
    }
  }

  renderPreview() {
    const multi = this.opts.multiple;
    this.preview.innerHTML = this.urls.map((url, i) => {
      const isLoading = url.indexOf('t') === 0 && url.length < 16 && !/^https?:/.test(url);
      const moveBtns = multi ? `
        <button type="button" class="iu-move iu-left" data-i="${i}" title="左移">‹</button>
        <button type="button" class="iu-move iu-right" data-i="${i}" title="右移">›</button>
      ` : '';
      return `
        <div class="iu-item ${isLoading ? 'is-loading' : ''}" data-i="${i}">
          ${isLoading ? '<div class="iu-spin"></div>' : `<img src="${url}" alt="">`}
          <div class="iu-item-mask">
            ${moveBtns}
            <button type="button" class="iu-remove" data-i="${i}" title="删除">×</button>
          </div>
        </div>
      `;
    }).join('');

    // 单图模式：已有图时隐藏上传区
    if (!multi && this.urls.length >= 1) {
      this.dropzone.style.display = 'none';
    } else {
      this.dropzone.style.display = '';
    }

    // 绑定事件（事件委托）
    this.preview.querySelectorAll('.iu-remove').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const i = parseInt(btn.getAttribute('data-i'));
        this.urls.splice(i, 1);
        this.renderPreview();
        this.emitChange();
      };
    });
    this.preview.querySelectorAll('.iu-left').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const i = parseInt(btn.getAttribute('data-i'));
        if (i > 0) { [this.urls[i - 1], this.urls[i]] = [this.urls[i], this.urls[i - 1]]; this.renderPreview(); this.emitChange(); }
      };
    });
    this.preview.querySelectorAll('.iu-right').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const i = parseInt(btn.getAttribute('data-i'));
        if (i < this.urls.length - 1) { [this.urls[i + 1], this.urls[i]] = [this.urls[i], this.urls[i + 1]]; this.renderPreview(); this.emitChange(); }
      };
    });
  }

  emitChange() {
    if (typeof this.opts.onChange === 'function') this.opts.onChange(this.getValue());
  }

  getValue() {
    // 过滤掉还在上传中的临时占位
    return this.urls.filter(u => /^https?:/.test(u));
  }

  isBusy() {
    return this.uploading > 0;
  }

  setValue(urls) {
    this.urls = Array.isArray(urls) ? urls.slice() : (urls ? [urls] : []);
    this.renderPreview();
  }

  clear() {
    this.urls = [];
    this.renderPreview();
  }
}

// 全局上传器注册表：通过 id 存取，方便后台保存时统一读取
window.ImageUploader = ImageUploader;
const __uploaderRegistry = {};
function registerUploader(id, uploader) { __uploaderRegistry[id] = uploader; }
function getUploader(id) { return __uploaderRegistry[id] || null; }
window.registerUploader = registerUploader;
window.getUploader = getUploader;
