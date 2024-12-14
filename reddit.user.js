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
        faceplate-timeago time:nth-of-type(2) {
            display: none !important;
        }
    `;
    document.head.appendChild(style);

    function adjustLayout() {
        const leftSidebar = document.getElementById('left-sidebar-container');
        if (leftSidebar) {
            leftSidebar.remove();
        }

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
})();
