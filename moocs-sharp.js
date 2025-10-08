// ==UserScript==
// @name         Moocs Sharp
// @namespace    http://tampermonkey.net/
// @version      3.1
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
    .content {
      max-width: 98%;
      margin-left: auto;
      margin-right: auto;
    }
    .vertical {
      display: flex;
    }

    div.panel.pad-form.problem-container {
      max-height: 100vh;
      overflow: auto;
      -webkit-overflow-scrolling: touch;
      box-sizing: border-box;
    }
  }

  /* --- 共通スタイル --- */
  div.vertical {
    border: 1px solid #ddd;
    position: relative;
    margin-left: auto;
    margin-right: auto;
    padding: 1px;
  }
  div.problem-contentpage {
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

  button.btn-success.submit-answer {
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

  nav.navbar.navbar-static-top,
  a.logo,
  a.btn.btn-primary {
    animation: bg-color 20s infinite;
  }
  aside.main-sidebar {
    animation: bg-color 20s infinite;
  }
  footer.main-footer {
    animation: bg-color 20s infinite;
  }
  a.btn.btn-success.drive-search {
    animation: bg-color 20s infinite;
  }
  a.btn.btn-success {
    animation: bg-color 20s infinite;
  }
  span.logo-mini {
    animation: rotation 5s infinite;
  }

  div.pad-block {
    overflow: auto;
  }


  ul.pagination.pagination-lg {
    margin: 10px;
  }

  h2.clearfix {
    margin: 10px;
  }

  section.content.container-fluid {
    padding-top: 5px;
  }

  .flex-divider {
    flex: 0 0 10px;
    background-color: #e0e0e0;
    cursor: col-resize;
    transition: background-color 0.2s;
  }

  .flex-divider:hover {
    background-color: #c0c0c0;
  }

  .container-resize-handle {
    position: absolute;
    width: 10px;
    height: 100%;
    top: 0;
    cursor: col-resize;
    z-index: 10;
    background-color: rgba(0, 100, 255, 0.2);
    transition: background-color 0.2s;
  }

  .container-resize-handle:hover {
    background-color: rgba(0, 100, 255, 0.5);
  }

  .container-resize-handle.right {
    right: 0;
  }

  /* --- スマートフォン向けスタイル (767px以下) --- */
  @media (max-width: 767px) {
    .content {
      max-width: 100% !important;
      padding-left: 10px !important;
      padding-right: 10px !important;
    }

    .vertical {
      display: block !important;
      width: 100% !important;
      border: none !important;
      padding: 0 !important;
    }

    .vertical > .pad-block {
      flex: none !important;
      width: 100% !important;
      margin-bottom: 15px;
    }

    .vertical > .pad-block:last-child {
      margin-bottom: 0;
    }

    .flex-divider,
    .container-resize-handle {
      display: none !important;
    }
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

    main().catch((error) => {
        console.error('Moocs Sharp の初期化中に問題が発生しました。', error);
    });

    async function main() {
        overrideWindowAlert();
        injectGlobalStyles(GLOBAL_STYLE_RULES);
        await initializeLayoutEnhancements();
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
