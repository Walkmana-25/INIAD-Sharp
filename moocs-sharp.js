// ==UserScript==
// @name         Moocs Sharp
// @namespace    http://tampermonkey.net/
// @version      3.0
// @description  INIAD MOOCS をより快適にするための総合改善スクリプト。alertのバナー化とUIレイアウト拡張をまとめています。
// @author       You
// @match        https://moocs.iniad.org/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function () {
    'use strict';

    setupCustomAlert();
    setupUiModifiers();

    function setupCustomAlert() {
        window.alert = function (message) {
            const existingBanner = document.getElementById('custom-alert-banner');
            if (existingBanner) {
                existingBanner.remove();
            }

            let bannerColor = '#007bff';
            let textColor = 'white';

            if (message.includes('保存しました') || message.includes('have been saved')) {
                bannerColor = '#28a745';
            } else if (message.includes('失敗しました') || message.includes('Failed to')) {
                bannerColor = '#dc3545';
            } else if (message.includes('できません') || message.includes('非公開です')) {
                bannerColor = '#ffc107';
                textColor = '#212529';
            }

            const banner = document.createElement('div');
            banner.id = 'custom-alert-banner';

            const messageNode = document.createElement('span');
            messageNode.innerHTML = message.replace(/\n/g, '<br>');

            const closeButton = document.createElement('button');
            closeButton.innerHTML = '&times;';

            banner.appendChild(messageNode);
            banner.appendChild(closeButton);

            Object.assign(banner.style, {
                position: 'fixed',
                top: '100px',
                right: '-400px',
                maxWidth: '350px',
                backgroundColor: bannerColor,
                color: textColor,
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

            Object.assign(messageNode.style, {
                lineHeight: '1.4'
            });

            Object.assign(closeButton.style, {
                background: 'none',
                border: 'none',
                color: 'inherit',
                fontSize: '24px',
                cursor: 'pointer',
                opacity: '0.7',
                padding: '0 5px'
            });

            closeButton.onmouseover = () => {
                closeButton.style.opacity = '1';
            };
            closeButton.onmouseout = () => {
                closeButton.style.opacity = '0.7';
            };

            closeButton.onclick = function () {
                banner.style.right = '-400px';
                banner.style.opacity = '0';
                setTimeout(() => {
                    if (banner.parentNode) {
                        banner.parentNode.removeChild(banner);
                    }
                }, 500);
            };

            document.body.appendChild(banner);

            setTimeout(() => {
                banner.style.opacity = '1';
                banner.style.right = '20px';
            }, 10);

            setTimeout(function () {
                if (banner.parentNode) {
                    closeButton.click();
                }
            }, 5000);
        };
    }

    function setupUiModifiers() {
        const customStyles = `
      /* --- デスクトップ向けスタイル (900px以上) --- */
      @media (min-width: 900px) {
        .content {
          max-width: 98%;
          margin-left: auto;
          margin-right: auto;
        }
        .vertical {
          display: flex; /* 横並びにする */
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
          position: relative
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
  position: fixed; /* スクロールに追従させる */
  bottom: 70px;        
  
  /* ボタンを右上に配置するための追加スタイル */
  display: block;
  margin-left: auto;
  margin-bottom: 10px; /* ボタンとコンテンツの間に余白 */
  z-index: 1000;
    animation: bg-color 10s infinite;
  
  
}
@keyframes rotation{
  0%{ transform:rotate(0);}
  100%{ transform:rotate(360deg); }
}

nav.navbar.navbar-static-top {
animation: bg-color 10s infinite;
}
span.logo-mini {

animation: rotation 5s infinite;
}
a.logo {
animation: bg-color 10s infinite;
}
a.btn.btn-primary {
animation: bg-color 10s infinite;
}


      div.pad-block {
        overflow: auto; /* コンテンツがはみ出たらスクロール */
      }
      ul.pagination.pagination-lg {
          margin: 10px;
      }

      h2.clearfix {
          margin: 10px
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
          display: block !important; /* flexを解除して縦並びに */
          width: 100% !important;   /* JavaScriptで設定された幅を上書き */
          border: none !important;
          padding: 0 !important;
        }

        .vertical > .pad-block {
          flex: none !important; /* flex設定をリセット */
          width: 100% !important;
          margin-bottom: 15px; /* ブロック間の余白 */
        }

        .vertical > .pad-block:last-child {
            margin-bottom: 0;
        }

        .flex-divider,
        .container-resize-handle {
          display: none !important; /* リサイズ関連のUIを非表示に */
        }
      }
    `;

        addGlobalStyle(customStyles);
        initialize();

        function addGlobalStyle(css) {
            const style = document.createElement('style');
            style.type = 'text/css';
            style.innerHTML = css;
            document.head.appendChild(style);
        }

        function makeContainerResizable(container, storageKey) {
            const handleRight = document.createElement('div');
            handleRight.className = 'container-resize-handle right';
            container.appendChild(handleRight);

            handleRight.addEventListener('mousedown', (e) => {
                if (e.button !== 0) return;
                e.preventDefault();
                e.stopPropagation();

                const parentRect = container.parentElement.getBoundingClientRect();
                const parentCenterX = parentRect.left + parentRect.width / 2;
                const maxWidth = parentRect.width;

                container.style.transition = 'none';
                document.body.style.userSelect = 'none';

                const doDrag = (e) => {
                    const distanceFromCenter = Math.abs(e.clientX - parentCenterX);
                    let newWidth = distanceFromCenter * 2;
                    newWidth = Math.max(100, Math.min(newWidth, maxWidth));
                    container.style.width = newWidth + 'px';
                };

                const stopDrag = () => {
                    container.style.transition = '';
                    document.body.style.userSelect = '';
                    document.documentElement.removeEventListener('mousemove', doDrag);
                    window.removeEventListener('mouseup', stopDrag);
                    window.removeEventListener('blur', stopDrag);
                    document.documentElement.removeEventListener('mousedown', handleDocumentMousedown, { capture: true });

                    const finalWidthPx = parseFloat(container.style.width);
                    const parentWidthPx = container.parentElement.clientWidth;
                    const widthPercent = (finalWidthPx / parentWidthPx) * 100;
                    localStorage.setItem(storageKey, `${widthPercent}%`);
                };

                const handleDocumentMousedown = (event) => {
                    if (event.target !== handleRight) {
                        stopDrag();
                    }
                };

                document.documentElement.addEventListener('mousemove', doDrag);
                window.addEventListener('mouseup', stopDrag);
                window.addEventListener('blur', stopDrag);
                document.documentElement.addEventListener('mousedown', handleDocumentMousedown, { capture: true });
            });
        }

        function makeFlexContainerResizable(container, storageKey) {
            if (!container) return;
            const children = Array.from(container.children).filter(el => el.matches('div.pad-block'));
            if (children.length < 2) {
                children.forEach(child => {
                    child.style.flex = '1 1 0%';
                });
                return;
            }

            const [leftEl, rightEl] = children;

            const savedFlexRatios = localStorage.getItem(storageKey);
            if (savedFlexRatios) {
                const [leftFlex, rightFlex] = savedFlexRatios.split(':');
                leftEl.style.flex = `${leftFlex} ${leftFlex} 0%`;
                rightEl.style.flex = `${rightFlex} ${rightFlex} 0%`;
            } else {
                leftEl.style.flex = '1 1 0%';
                rightEl.style.flex = '1 1 0%';
            }

            const divider = document.createElement('div');
            divider.className = 'flex-divider';
            leftEl.after(divider);

            divider.addEventListener('mousedown', (e) => {
                e.preventDefault();

                const startX = e.clientX;
                const leftStartWidth = leftEl.getBoundingClientRect().width;
                const rightStartWidth = rightEl.getBoundingClientRect().width;
                const allIframes = document.querySelectorAll('iframe');
                allIframes.forEach(iframe => iframe.style.pointerEvents = 'none');

                const doDrag = (e) => {
                    const deltaX = e.clientX - startX;
                    const newLeftWidth = leftStartWidth + deltaX;
                    const newRightWidth = rightStartWidth - deltaX;
                    if (newLeftWidth < 50 || newRightWidth < 50) return;
                    leftEl.style.flexGrow = newLeftWidth;
                    rightEl.style.flexGrow = newRightWidth;
                };

                const stopDrag = () => {
                    allIframes.forEach(iframe => iframe.style.pointerEvents = '');
                    document.documentElement.removeEventListener('mousemove', doDrag);
                    window.removeEventListener('mouseup', stopDrag);

                    const finalLeftWidth = leftEl.getBoundingClientRect().width;
                    const finalRightWidth = rightEl.getBoundingClientRect().width;
                    const totalFlexWidth = finalLeftWidth + finalRightWidth;
                    const leftFlexPercent = (finalLeftWidth / totalFlexWidth) * 100;
                    const rightFlexPercent = (finalRightWidth / totalFlexWidth) * 100;

                    leftEl.style.flex = `${leftFlexPercent} ${leftFlexPercent} 0%`;
                    rightEl.style.flex = `${rightFlexPercent} ${rightFlexPercent} 0%`;

                    localStorage.setItem(storageKey, `${leftFlexPercent}:${rightFlexPercent}`);
                };

                document.documentElement.addEventListener('mousemove', doDrag);
                window.addEventListener('mouseup', stopDrag);
            });
        }

        function initialize() {
            const maxWaitTime = 10000;
            const checkInterval = 100;
            let elapsedTime = 0;

            const timer = setInterval(() => {
                const contentContainer = document.querySelector('section.content.container-fluid');
                const padBlocks = document.querySelectorAll('div.pad-block');
                const pager = document.querySelector('ul.pager');

                if (contentContainer && padBlocks.length > 0 && pager) {
                    clearInterval(timer);
                    moveAndPrepareElements(contentContainer, padBlocks, pager);
                }

                elapsedTime += checkInterval;
                if (elapsedTime >= maxWaitTime) {
                    clearInterval(timer);
                    console.error('ユーザースクリプトの初期化がタイムアウトしました。');
                }
            }, checkInterval);
        }

        function moveAndPrepareElements(contentContainer, padBlocks, pager) {
            const verticalDiv = document.createElement('div');
            verticalDiv.className = 'vertical';

            const padCount = padBlocks.length;
            const widthStorageKey = `verticalContainerWidth_${padCount}pads`;
            const flexStorageKey = `verticalFlexRatios_${padCount}pads`;

            const savedWidth = localStorage.getItem(widthStorageKey);
            verticalDiv.style.width = savedWidth ? savedWidth : '100%';

            padBlocks.forEach(padBlock => {
                verticalDiv.appendChild(padBlock);
            });
            contentContainer.appendChild(verticalDiv);
            contentContainer.appendChild(pager);

            makeFlexContainerResizable(verticalDiv, flexStorageKey);
            makeContainerResizable(verticalDiv, widthStorageKey);

            console.log(`ユーザースクリプト実行: pad-blockが${padCount}個のレイアウトで起動しました。`);
        }
    }
})();
