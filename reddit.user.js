// ==UserScript==
// @name         RedditRestorer
// @namespace    https://github.com/torikushiii/reddit-ui-restore
// @version      1.0
// @description  Because Gen 3 UI sucks balls
// @author       torikushiii
// @match        https://www.reddit.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const style = document.createElement('style');
    style.textContent = `
        #left-sidebar-container {
            display: none !important;
        }

        body.post-page .grid-container.theme-rpl.grid {
            display: block !important;
            padding: 20px 340px 0 32px !important;
            max-width: none !important;
            box-sizing: border-box !important;
        }

        body.post-page #main-content,
        body.post-page #comment-tree,
        body.post-page [id^="t3_"],
        body.post-page #main-content > shreddit-async-loader,
        body.post-page [id^="comment-tree-content-anchor-"] {
            width: 100% !important;
            max-width: none !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
            box-sizing: border-box !important;
        }

        body.post-page #right-sidebar-container {
            position: fixed !important;
            right: 0 !important;
            top: 48px !important;
            width: 320px !important;
            padding: 20px 16px !important;
            box-sizing: border-box !important;
            height: calc(100vh - 48px) !important;
            overflow-y: auto !important;
        }

        faceplate-timeago time:nth-of-type(2) {
            display: none !important;
        }
    `;
    document.head.appendChild(style);

    function adjustLayout() {
        const isPostPage = window.location.pathname.includes('/comments/');
        const leftSidebar = document.getElementById('left-sidebar-container');
        if (leftSidebar) {
            leftSidebar.remove();
        }

        if (isPostPage) {
            document.body.classList.add('post-page');

            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.style.width = '100%';
                mainContent.style.maxWidth = 'none';
                mainContent.style.marginLeft = '0';
                mainContent.style.marginRight = '0';
            }

            const postId = window.location.pathname.split('/')[4];
            const postContainer = document.getElementById(`t3_${postId}`);
            if (postContainer) {
                postContainer.style.width = '100%';
                postContainer.style.maxWidth = 'none';
                postContainer.style.marginLeft = '0';
                postContainer.style.marginRight = '0';
            }

            const asyncLoader = document.querySelector('#main-content > shreddit-async-loader');
            if (asyncLoader) {
                asyncLoader.style.width = '100%';
                asyncLoader.style.maxWidth = 'none';
                asyncLoader.style.marginLeft = '0';
                asyncLoader.style.marginRight = '0';
            }

            const commentTree = document.getElementById(`comment-tree-content-anchor-${postId}`);
            if (commentTree) {
                commentTree.style.width = '100%';
                commentTree.style.maxWidth = 'none';
                commentTree.style.marginLeft = '0';
                commentTree.style.marginRight = '0';
            }

            const gridContainer = document.querySelector('.grid-container');
            if (gridContainer) {
                gridContainer.style.display = 'block';
                gridContainer.style.maxWidth = 'none';
                gridContainer.style.padding = '20px 340px 0 32px';
            }
        } else {
            document.body.classList.remove('post-page');

            const gridContainer = document.querySelector('.grid-container');
            if (gridContainer) {
                gridContainer.style.gridTemplateColumns = '1fr';
                gridContainer.style.maxWidth = '100%';
                gridContainer.style.padding = '0';
            }

            const subgridContainer = document.querySelector('.subgrid-container');
            if (subgridContainer) {
                subgridContainer.style.marginLeft = '0';
                subgridContainer.style.maxWidth = '100%';
                subgridContainer.classList.remove('m:col-start-2');
            }

            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.style.width = '100%';
                mainContent.style.maxWidth = '100%';
            }

            const posts = document.querySelectorAll('shreddit-post:not([data-layout-modified])');
            posts.forEach(post => {
                post.setAttribute('data-layout-modified', 'true');

                post.style.padding = '4px 8px';
                post.style.margin = '0';
                post.style.borderRadius = '0';

                const titleSlot = post.querySelector('[slot="title"]');
                const creditBarSlot = post.querySelector('[slot="credit-bar"]');

                if (titleSlot && creditBarSlot) {
                    const titleContent = titleSlot.innerHTML;
                    const creditBarContent = creditBarSlot.innerHTML;

                    const creditBarElement = document.createElement('div');
                    creditBarElement.innerHTML = creditBarContent;

                    const postFlair = post.querySelector('[slot="post-flair"]');
                    if (postFlair) {
                        const creditContainer = document.createElement('div');
                        creditContainer.style.display = 'flex';
                        creditContainer.style.alignItems = 'center';
                        creditContainer.style.gap = '8px';

                        const creditContent = document.createElement('div');
                        creditContent.innerHTML = creditBarElement.innerHTML;
                        creditContainer.appendChild(creditContent);

                        const flairClone = postFlair.cloneNode(true);
                        creditContainer.appendChild(flairClone);
                        postFlair.style.display = 'none';

                        titleSlot.innerHTML = creditContainer.outerHTML;
                    } else {
                        titleSlot.innerHTML = creditBarElement.innerHTML;
                    }

                    creditBarSlot.innerHTML = titleContent;

                    const titleLink = creditBarSlot.querySelector('a');
                    if (titleLink) {
                        titleLink.style.fontSize = '16px';
                        titleLink.style.lineHeight = '1.3';
                        titleLink.style.margin = '0';
                        titleLink.style.fontWeight = '500';
                    }

                    titleSlot.style.fontSize = '12px';
                    titleSlot.style.margin = '2px 0';
                }
            });
        }
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    adjustLayout();

    const debouncedAdjustLayout = debounce(adjustLayout, 250);

    const observer = new MutationObserver((mutations) => {
        if (mutations.some(mutation => mutation.addedNodes.length > 0)) {
            debouncedAdjustLayout();
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    let lastUrl = window.location.href;
    new MutationObserver(() => {
        if (lastUrl !== window.location.href) {
            lastUrl = window.location.href;
            adjustLayout();
        }
    }).observe(document.body, { subtree: true, childList: true });
})();
