// ==UserScript==
// @name         Moocs Sharp
// @namespace    http://tampermonkey.net/
// @version      3.6
// @description  INIAD Moocsをより便利に、楽しくするためのユーザースクリプト
// @author       Yuta Takahashi
// @match        https://moocs.iniad.org/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    const ALERT_BANNER_ID = 'custom-alert-banner';
    const ALERT_DEFAULT_THEME = { background: '#007bff', color: '#ffffff' };
    const ALERT_THEME_RULES = [
        { keywords: ['保存しました', 'have been saved'], background: '#28a745', color: '#ffffff' },
        { keywords: ['失敗しました', 'Failed to'], background: '#dc3545', color: '#ffffff' },
        { keywords: ['できません', '非公開です'], background: '#ffc107', color: '#212529' }
    ];
    const BANNER_AUTO_HIDE_MS = 5000;
    const BANNER_TRANSITION_MS = 500;

    const STYLE_ELEMENT_ID = 'moocs-sharp-styles';
    const GLOBAL_STYLE_RULES = `
  /* --- デスクトップ向けスタイル (900px以上) --- */
  @media (min-width: 900px) {
    .ms-style-enabled .content {
      max-width: 98%;
      margin-left: auto;
      margin-right: auto;
    }
    .ms-layout-enabled .vertical {
      display: flex;
    }

    .ms-style-enabled div.panel.pad-form.problem-container {
      max-height: 65vh;
      overflow: auto;
      -webkit-overflow-scrolling: touch;
      box-sizing: border-box;
    }
  }

  /* --- 共通スタイル --- */
  .ms-layout-enabled div.vertical {
    border: 1px solid #ddd;
    position: relative;
    margin-left: auto;
    margin-right: auto;
    padding: 1px;
  }
  .ms-layout-enabled div.problem-contentpage {
    position: relative;
  }

  @keyframes bg-color {
    0% {
      background-color: #e74c3c;
    }
    20% {
      background-color: #f1c40f;
    }
    40% {
      background-color: #1abc9c;
    }
    60% {
      background-color: #3498db;
    }
    80% {
      background-color: #9b59b6;
    }
    100% {
      background-color: #e74c3c;
    }
  }

  .ms-rainbow-enabled button.btn-success.submit-answer {
    position: fixed;
    bottom: 70px;
    display: block;
    margin-left: auto;
    margin-bottom: 10px;
    z-index: 1000;
    animation: bg-color 20s infinite;
  }

  @keyframes rotation {
    0% {
      transform: rotate(0);
    }
    100% {
      transform: rotate(360deg);
    }
  }

  .ms-rainbow-enabled nav.navbar.navbar-static-top,
  .ms-rainbow-enabled a.logo,
  .ms-rainbow-enabled a.btn.btn-primary {
    animation: bg-color 20s infinite;
  }
  .ms-rainbow-enabled aside.main-sidebar {
    animation: bg-color 20s infinite;
  }
  .ms-rainbow-enabled footer.main-footer {
    animation: bg-color 20s infinite;
  }
  .ms-rainbow-enabled a.btn.btn-success.drive-search {
    animation: bg-color 20s infinite;
  }
  .ms-rainbow-enabled a.btn.btn-success {
    animation: bg-color 20s infinite;
  }
  .ms-rainbow-enabled span.logo-mini {
    animation: rotation 5s infinite;
  }

  .ms-style-enabled div.pad-block {
    overflow: auto;
  }


  .ms-style-enabled ul.pagination.pagination-lg {
    margin: 10px;
  }

  .ms-style-enabled h2.clearfix {
    margin: 10px;
  }

  .ms-style-enabled section.content.container-fluid {
    padding-top: 5px;
  }

  .ms-layout-enabled .flex-divider {
    flex: 0 0 10px;
    background-color: #e0e0e0;
    cursor: col-resize;
    transition: background-color 0.2s;
  }

  .ms-layout-enabled .flex-divider:hover {
    background-color: #c0c0c0;
  }

  .ms-layout-enabled .container-resize-handle {
    position: absolute;
    width: 10px;
    height: 100%;
    top: 0;
    cursor: col-resize;
    z-index: 10;
    background-color: rgba(0, 100, 255, 0.2);
    transition: background-color 0.2s;
  }

  .ms-layout-enabled .container-resize-handle:hover {
    background-color: rgba(0, 100, 255, 0.5);
  }

  .ms-layout-enabled .container-resize-handle.right {
    right: 0;
  }

  /* --- スマートフォン向けスタイル (767px以下) --- */
  @media (max-width: 767px) {
    .ms-style-enabled .content {
      max-width: 100% !important;
      padding-left: 10px !important;
      padding-right: 10px !important;
    }

    .ms-layout-enabled .vertical {
      display: block !important;
      width: 100% !important;
      border: none !important;
      padding: 0 !important;
    }

    .ms-layout-enabled .vertical > .pad-block {
      flex: none !important;
      width: 100% !important;
      margin-bottom: 15px;
    }

    .ms-layout-enabled .vertical > .pad-block:last-child {
      margin-bottom: 0;
    }

    .ms-layout-enabled .flex-divider,
    .ms-layout-enabled .container-resize-handle {
      display: none !important;
    }
  }

  /* --- Settings UI --- */
  .ms-settings-button {
      position: fixed;
      bottom: 20px;
      left: 20px;
      width: 50px;
      height: 50px;
      background-color: #007bff;
      color: white;
      border-radius: 50%;
      border: none;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 24px;
      z-index: 10000;
      box-shadow: 0 2px 10px rgba(0,0,0,0.2);
      transition: transform 0.2s;
  }
  .ms-settings-button:hover {
      transform: scale(1.1);
  }
  .ms-settings-modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0,0,0,0.5);
      z-index: 10001;
      display: none; /* Hidden by default */
      justify-content: center;
      align-items: center;
  }
  .ms-settings-modal {
      background-color: white;
      padding: 20px;
      border-radius: 8px;
      width: 90%;
      max-width: 500px;
      box-shadow: 0 5px 15px rgba(0,0,0,0.3);
      color: #333;
  }
  .ms-settings-modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #dee2e6;
      padding-bottom: 10px;
      margin-bottom: 20px;
  }
  .ms-settings-modal-title {
      font-size: 1.25rem;
      font-weight: 500;
      margin: 0;
  }
  .ms-settings-close-button {
      border: none;
      background: transparent;
      font-size: 1.5rem;
      cursor: pointer;
      padding: 0 5px;
      line-height: 1;
  }
  .ms-settings-modal-body {
      /* for future content */
  }

  /* --- Settings UI Toggle Switch --- */
  .ms-settings-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;
  }
  .ms-settings-row:last-child {
      border-bottom: none;
  }
  .ms-settings-label {
      font-size: 1rem;
  }
  .ms-toggle-switch {
      position: relative;
      display: inline-block;
      width: 50px;
      height: 28px;
      flex-shrink: 0;
  }
  .ms-toggle-switch input {
      opacity: 0;
      width: 0;
      height: 0;
  }
  .ms-toggle-slider {
      position: absolute;
      cursor: pointer;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: #ccc;
      transition: .4s;
      border-radius: 28px;
  }
  .ms-toggle-slider:before {
      position: absolute;
      content: "";
      height: 20px;
      width: 20px;
      left: 4px;
      bottom: 4px;
      background-color: white;
      transition: .4s;
      border-radius: 50%;
  }
  input:checked + .ms-toggle-slider {
      background-color: #28a745;
  }
  input:checked + .ms-toggle-slider:before {
      transform: translateX(22px);
  }
`;

    const SELECTORS = {
        content: 'section.content.container-fluid',
        padBlock: 'div.pad-block',
        pager: 'ul.pager'
    };
    const POLL_TIMEOUT_MS = 10000;
    const POLL_INTERVAL_MS = 100;
    const CONTAINER_MIN_WIDTH = 100;
    const FLEX_MIN_WIDTH = 50;
    const IFRAMES_SELECTOR = 'iframe';

    // --- 設定管理 ---
    const SETTINGS_KEY = 'moocsSharpSettings';
    const DEFAULT_SETTINGS = {
        enableRainbowAnimation: true,
        enableLayoutEnhancements: true,
        enableCustomAlerts: true,
        enableStyleImprovements: true,
    };
    let currentSettings = { ...DEFAULT_SETTINGS };

    function loadSettings() {
        try {
            const savedSettings = localStorage.getItem(SETTINGS_KEY);
            if (savedSettings) {
                const parsed = JSON.parse(savedSettings);
                currentSettings = { ...DEFAULT_SETTINGS, ...parsed };
            }
        } catch (e) {
            console.error('Moocs Sharp: 設定の読み込みに失敗しました。', e);
            currentSettings = { ...DEFAULT_SETTINGS };
        }
    }

    function saveSettings() {
        try {
            localStorage.setItem(SETTINGS_KEY, JSON.stringify(currentSettings));
        } catch (e) {
            console.error('Moocs Sharp: 設定の保存に失敗しました。', e);
        }
    }


    main().catch((error) => {
        console.error('Moocs Sharp の初期化中に問題が発生しました。', error);
    });

    async function main() {
        loadSettings();
        applyBodyClasses();
        initializeSettingsUI();

        if (currentSettings.enableCustomAlerts) {
            overrideWindowAlert();
        }

        injectGlobalStyles(GLOBAL_STYLE_RULES);

        if (currentSettings.enableStyleImprovements) {
            preventHtmlScrollOnDesktop();
        }

        if (currentSettings.enableLayoutEnhancements) {
            await initializeLayoutEnhancements();
        }
    }

    function applyBodyClasses() {
        if (!document.body) {
            document.addEventListener('DOMContentLoaded', applyBodyClasses, { once: true });
            return;
        }
        const classMap = {
            'ms-rainbow-enabled': currentSettings.enableRainbowAnimation,
            'ms-layout-enabled': currentSettings.enableLayoutEnhancements,
            'ms-style-enabled': currentSettings.enableStyleImprovements,
        };
        for (const [className, isEnabled] of Object.entries(classMap)) {
            document.body.classList.toggle(className, isEnabled);
        }
    }

    function initializeSettingsUI() {
        // Create settings button
        const settingsButton = document.createElement('button');
        settingsButton.className = 'ms-settings-button';
        settingsButton.innerHTML = '&#x2699;'; // Gear icon
        settingsButton.setAttribute('aria-label', 'Moocs Sharp 設定');
        document.body.appendChild(settingsButton);

        // Create modal overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'ms-settings-modal-overlay';
        document.body.appendChild(modalOverlay);

        // Create modal dialog
        const modal = document.createElement('div');
        modal.className = 'ms-settings-modal';
        modalOverlay.appendChild(modal);

        // Modal header
        const modalHeader = document.createElement('div');
        modalHeader.className = 'ms-settings-modal-header';
        modal.appendChild(modalHeader);

        const modalTitle = document.createElement('h5');
        modalTitle.className = 'ms-settings-modal-title';
        modalTitle.textContent = 'Moocs Sharp 設定';
        modalHeader.appendChild(modalTitle);

        const closeButton = document.createElement('button');
        closeButton.className = 'ms-settings-close-button';
        closeButton.innerHTML = '&times;';
        closeButton.setAttribute('aria-label', '閉じる');
        modalHeader.appendChild(closeButton);

        // Modal body
        const modalBody = document.createElement('div');
        modalBody.className = 'ms-settings-modal-body';
        modal.appendChild(modalBody);

        // --- Settings Rows ---
        const settingsConfig = [
            { key: 'enableRainbowAnimation', label: 'レインボーアニメーション' },
            { key: 'enableLayoutEnhancements', label: 'レイアウト調整機能' },
            { key: 'enableCustomAlerts', label: 'カスタムアラート機能' },
            { key: 'enableStyleImprovements', label: 'その他スタイル改善' }
        ];

        function createSettingRow(key, label) {
            const row = document.createElement('div');
            row.className = 'ms-settings-row';

            const labelEl = document.createElement('span');
            labelEl.className = 'ms-settings-label';
            labelEl.textContent = label;
            row.appendChild(labelEl);

            const switchEl = document.createElement('label');
            switchEl.className = 'ms-toggle-switch';

            const inputEl = document.createElement('input');
            inputEl.type = 'checkbox';
            inputEl.checked = currentSettings[key];
            inputEl.addEventListener('change', () => {
                currentSettings[key] = inputEl.checked;
                saveSettings();
                // Reload to apply changes
                window.location.reload();
            });

            const sliderEl = document.createElement('span');
            sliderEl.className = 'ms-toggle-slider';

            switchEl.appendChild(inputEl);
            switchEl.appendChild(sliderEl);
            row.appendChild(switchEl);

            return row;
        }

        settingsConfig.forEach(setting => {
            const row = createSettingRow(setting.key, setting.label);
            modalBody.appendChild(row);
        });

        // --- Event Listeners ---
        function openModal() {
            modalOverlay.style.display = 'flex';
        }

        function closeModal() {
            modalOverlay.style.display = 'none';
        }

        settingsButton.addEventListener('click', openModal);
        closeButton.addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (event) => {
            if (event.target === modalOverlay) {
                closeModal();
            }
        });
    }

    function overrideWindowAlert() {
        window.alert = (message) => {
            showAlertBanner(String(message ?? ''));
        };
    }

    function showAlertBanner(message) {
        removeExistingBanner();
        const banner = buildAlertBanner(message);
        appendBanner(banner);
    }

    function removeExistingBanner() {
        const existingBanner = document.getElementById(ALERT_BANNER_ID);
        if (existingBanner) {
            existingBanner.remove();
        }
    }

    function buildAlertBanner(message) {
        const theme = resolveAlertTheme(message);
        const banner = document.createElement('div');
        banner.id = ALERT_BANNER_ID;
        banner.setAttribute('role', 'alert');

        applyStyles(banner, {
            position: 'fixed',
            top: '100px',
            right: '-400px',
            maxWidth: '350px',
            backgroundColor: theme.background,
            color: theme.color,
            padding: '15px 25px',
            borderRadius: '8px',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            zIndex: '99999',
            display: 'flex',
            alignItems: 'center',
            gap: '20px',
            fontSize: '16px',
            fontFamily: 'sans-serif',
            opacity: '0',
            transition: 'opacity 0.5s, right 0.5s'
        });

        const messageNode = document.createElement('span');
        messageNode.innerHTML = convertMessageToHtml(message);
        applyStyles(messageNode, { lineHeight: '1.4' });

        const closeButton = document.createElement('button');
        closeButton.type = 'button';
        closeButton.innerHTML = '&times;';
        closeButton.setAttribute('aria-label', '閉じる');
        applyStyles(closeButton, {
            background: 'none',
            border: 'none',
            color: 'inherit',
            fontSize: '24px',
            cursor: 'pointer',
            opacity: '0.7',
            padding: '0 5px'
        });

        closeButton.addEventListener('mouseenter', () => {
            closeButton.style.opacity = '1';
        });
        closeButton.addEventListener('mouseleave', () => {
            closeButton.style.opacity = '0.7';
        });
        closeButton.addEventListener('click', () => {
            hideBanner(banner);
        });

        banner.addEventListener('mouseenter', () => {
            clearAutoHide(banner);
        });
        banner.addEventListener('mouseleave', () => {
            scheduleAutoHide(banner);
        });

        banner.append(messageNode, closeButton);
        return banner;
    }

    function appendBanner(banner) {
        const append = () => {
            const parent = document.body || document.documentElement;
            parent.appendChild(banner);

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    banner.style.opacity = '1';
                    banner.style.right = '20px';
                });
            });

            scheduleAutoHide(banner);
        };

        if (document.body) {
            append();
        } else {
            document.addEventListener('DOMContentLoaded', append, { once: true });
        }
    }

    function scheduleAutoHide(banner) {
        clearAutoHide(banner);
        const timeoutId = window.setTimeout(() => {
            hideBanner(banner);
        }, BANNER_AUTO_HIDE_MS);
        banner.dataset.hideTimeoutId = String(timeoutId);
    }

    function clearAutoHide(banner) {
        const timeoutId = banner.dataset.hideTimeoutId;
        if (timeoutId) {
            window.clearTimeout(Number(timeoutId));
            delete banner.dataset.hideTimeoutId;
        }
    }

    function hideBanner(banner) {
        if (!banner || !banner.isConnected) {
            return;
        }

        clearAutoHide(banner);
        banner.style.right = '-400px';
        banner.style.opacity = '0';

        window.setTimeout(() => {
            banner.remove();
        }, BANNER_TRANSITION_MS);
    }

    function resolveAlertTheme(message) {
        const matchedTheme = ALERT_THEME_RULES.find((theme) =>
            theme.keywords.some((keyword) => message.includes(keyword))
        );
        return matchedTheme ? { background: matchedTheme.background, color: matchedTheme.color } : ALERT_DEFAULT_THEME;
    }

    function convertMessageToHtml(message) {
        const sandbox = document.createElement('span');
        sandbox.textContent = message;
        return sandbox.innerHTML.replace(/\n/g, '<br>');
    }

    async function initializeLayoutEnhancements() {
        try {
            const { content, padBlocks, pager } = await waitForLayoutElements();
            if (!content || !padBlocks.length || !pager) {
                return;
            }

            if (content.querySelector('.vertical')) {
                return;
            }

            const padCount = padBlocks.length;
            const widthStorageKey = getWidthStorageKey(padCount);
            const flexStorageKey = getFlexStorageKey(padCount);

            const verticalContainer = buildVerticalContainer(padBlocks, widthStorageKey);
            content.append(verticalContainer);
            content.append(pager);

            makeFlexContainerResizable(verticalContainer, flexStorageKey);
            makeContainerResizable(verticalContainer, widthStorageKey);

            console.info(`Moocs Sharp: ${padCount} 個の pad-block を検出しました。`);
        } catch (error) {
            console.error('Moocs Sharp: レイアウトの初期化に失敗しました。', error);
        }
    }

    async function waitForLayoutElements() {
        const deadline = performance.now() + POLL_TIMEOUT_MS;

        while (performance.now() < deadline) {
            const content = document.querySelector(SELECTORS.content);
            const padBlocks = Array.from(document.querySelectorAll(SELECTORS.padBlock));
            const pager = document.querySelector(SELECTORS.pager);

            if (content && padBlocks.length && pager) {
                return { content, padBlocks, pager };
            }

            await delay(POLL_INTERVAL_MS);
        }

        throw new Error('必要な要素の待機中にタイムアウトしました。');
    }

    function buildVerticalContainer(padBlocks, widthStorageKey) {
        const container = document.createElement('div');
        container.className = 'vertical';

        const savedWidth = localStorage.getItem(widthStorageKey);
        container.style.width = savedWidth || '100%';

        padBlocks.forEach((padBlock) => {
            container.appendChild(padBlock);
        });

        return container;
    }

    function makeContainerResizable(container, storageKey) {
        if (!container) {
            return;
        }

        const handle = document.createElement('div');
        handle.className = 'container-resize-handle right';
        container.appendChild(handle);

        handle.addEventListener('mousedown', (event) => {
            if (event.button !== 0) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            const parent = container.parentElement;
            if (!parent) {
                return;
            }

            const parentRect = parent.getBoundingClientRect();
            const parentCenterX = parentRect.left + parentRect.width / 2;
            const maxWidth = parentRect.width;
            const originalUserSelect = document.body ? document.body.style.userSelect : '';

            container.style.transition = 'none';
            if (document.body) {
                document.body.style.userSelect = 'none';
            }

            const onMouseMove = (moveEvent) => {
                const distanceFromCenter = Math.abs(moveEvent.clientX - parentCenterX);
                const newWidth = clamp(distanceFromCenter * 2, CONTAINER_MIN_WIDTH, maxWidth);
                container.style.width = `${newWidth}px`;
            };

            const onFinish = () => {
                container.style.transition = '';
                if (document.body) {
                    document.body.style.userSelect = originalUserSelect;
                }

                document.documentElement.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onFinish);
                window.removeEventListener('blur', onFinish);
                document.documentElement.removeEventListener('mousedown', onOutsideMouseDown, { capture: true });

                storeWidthAsPercent(container, storageKey);
            };

            const onOutsideMouseDown = (downEvent) => {
                if (downEvent.target !== handle) {
                    onFinish();
                }
            };

            document.documentElement.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onFinish);
            window.addEventListener('blur', onFinish);
            document.documentElement.addEventListener('mousedown', onOutsideMouseDown, { capture: true });
        });
    }

    function makeFlexContainerResizable(container, storageKey) {
        if (!container) {
            return;
        }

        const padBlocks = Array.from(container.children).filter((element) => element.matches('div.pad-block'));
        if (padBlocks.length < 2) {
            padBlocks.forEach((padBlock) => {
                padBlock.style.flex = '1 1 0%';
            });
            return;
        }

        const [leftPane, rightPane] = padBlocks;
        applySavedFlexRatios(leftPane, rightPane, storageKey);

        const divider = document.createElement('div');
        divider.className = 'flex-divider';
        leftPane.after(divider);

        divider.addEventListener('mousedown', (event) => {
            event.preventDefault();

            const startX = event.clientX;
            const leftStartWidth = leftPane.getBoundingClientRect().width;
            const rightStartWidth = rightPane.getBoundingClientRect().width;

            toggleIframePointerEvents(false);

            const onMouseMove = (moveEvent) => {
                const deltaX = moveEvent.clientX - startX;
                const newLeftWidth = leftStartWidth + deltaX;
                const newRightWidth = rightStartWidth - deltaX;

                if (newLeftWidth < FLEX_MIN_WIDTH || newRightWidth < FLEX_MIN_WIDTH) {
                    return;
                }

                leftPane.style.flexGrow = newLeftWidth;
                rightPane.style.flexGrow = newRightWidth;
            };

            const onFinish = () => {
                document.documentElement.removeEventListener('mousemove', onMouseMove);
                window.removeEventListener('mouseup', onFinish);

                toggleIframePointerEvents(true);

                const finalLeftWidth = leftPane.getBoundingClientRect().width;
                const finalRightWidth = rightPane.getBoundingClientRect().width;
                const totalWidth = finalLeftWidth + finalRightWidth;

                if (!totalWidth) {
                    return;
                }

                const leftPercent = (finalLeftWidth / totalWidth) * 100;
                const rightPercent = (finalRightWidth / totalWidth) * 100;

                leftPane.style.flex = `${leftPercent} ${leftPercent} 0%`;
                rightPane.style.flex = `${rightPercent} ${rightPercent} 0%`;

                storeFlexRatios(leftPercent, rightPercent, storageKey);
            };

            document.documentElement.addEventListener('mousemove', onMouseMove);
            window.addEventListener('mouseup', onFinish);
        });
    }

    function applySavedFlexRatios(leftPane, rightPane, storageKey) {
        const saved = localStorage.getItem(storageKey);
        if (!saved) {
            leftPane.style.flex = '1 1 0%';
            rightPane.style.flex = '1 1 0%';
            return;
        }

        const [leftValue, rightValue] = saved.split(':').map((value) => Number.parseFloat(value));
        if (Number.isFinite(leftValue) && Number.isFinite(rightValue)) {
            leftPane.style.flex = `${leftValue} ${leftValue} 0%`;
            rightPane.style.flex = `${rightValue} ${rightValue} 0%`;
        } else {
            leftPane.style.flex = '1 1 0%';
            rightPane.style.flex = '1 1 0%';
        }
    }

    function storeFlexRatios(leftPercent, rightPercent, storageKey) {
        const left = leftPercent.toFixed(2);
        const right = rightPercent.toFixed(2);
        localStorage.setItem(storageKey, `${left}:${right}`);
    }

    function storeWidthAsPercent(container, storageKey) {
        const parent = container.parentElement;
        if (!parent) {
            return;
        }

        const parentWidth = parent.clientWidth;
        const widthPx = Number.parseFloat(container.style.width);
        if (!parentWidth || Number.isNaN(widthPx)) {
            return;
        }

        const percent = ((widthPx / parentWidth) * 100).toFixed(2);
        localStorage.setItem(storageKey, `${percent}%`);
    }

    function getWidthStorageKey(padCount) {
        return `verticalContainerWidth_${padCount}pads`;
    }

    function getFlexStorageKey(padCount) {
        return `verticalFlexRatios_${padCount}pads`;
    }

    function injectGlobalStyles(css) {
        if (document.getElementById(STYLE_ELEMENT_ID)) {
            return;
        }

        const style = document.createElement('style');
        style.id = STYLE_ELEMENT_ID;
        style.type = 'text/css';
        style.textContent = css;
        document.head.appendChild(style);
    }

    // Prevent the root html/body from scrolling when on desktop-sized screens.
    // This keeps scrolling inside the internal panels (pad-blocks) on wide layouts.
    function preventHtmlScrollOnDesktop() {
        try {
            const mq = window.matchMedia('(min-width: 900px)');

            const apply = (isDesktop) => {
                const html = document.documentElement;
                const body = document.body;
                if (!html) return;

                if (isDesktop) {
                    // Prevent page-level scrolling so inner containers handle scroll.
                    html.style.overflow = 'hidden';
                    html.style.height = '100%';
                    if (body) {
                        body.style.overflow = 'hidden';
                        body.style.height = '100%';
                    }
                } else {
                    // Restore defaults on smaller screens.
                    html.style.overflow = '';
                    html.style.height = '';
                    if (body) {
                        body.style.overflow = '';
                        body.style.height = '';
                    }
                }
            };

            // Initial apply and listen for changes (resize / orientation)
            apply(mq.matches);
            if (typeof mq.addEventListener === 'function') {
                mq.addEventListener('change', (ev) => apply(ev.matches));
            } else if (typeof mq.addListener === 'function') {
                // Older browsers
                mq.addListener((ev) => apply(ev.matches));
            }
        } catch (e) {
            // If anything goes wrong, don't break the rest of the script.
            console.warn('preventHtmlScrollOnDesktop: failed to apply', e);
        }
    }

    function applyStyles(element, styles) {
        Object.assign(element.style, styles);
    }

    function toggleIframePointerEvents(enabled) {
        document.querySelectorAll(IFRAMES_SELECTOR).forEach((iframe) => {
            if (enabled) {
                const previous = iframe.dataset.originalPointerEvents ?? '';
                iframe.style.pointerEvents = previous;
                delete iframe.dataset.originalPointerEvents;
            } else {
                if (!iframe.dataset.originalPointerEvents) {
                    iframe.dataset.originalPointerEvents = iframe.style.pointerEvents || '';
                }
                iframe.style.pointerEvents = 'none';
            }
        });
    }

    function delay(ms) {
        return new Promise((resolve) => {
            window.setTimeout(resolve, ms);
        });
    }

    function clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
})();
