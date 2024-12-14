// ==UserScript==
// @name         Reddit Gen 2 UI
// @namespace    https://github.com/torikushiii/reddit-ui-restore
// @version      0.3
// @description  Because Gen 3 UI sucks balls
// @author       torikushiii
// @match        https://www.reddit.com/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    function waitForHeader() {
        return new Promise((resolve) => {
            const headerDiv = document.querySelector("body > shreddit-app > reddit-header-large > reddit-header-action-items > header > nav > div.h-\\[40px\\].flex-1.py-xs.flex.justify-stretch");

            if (headerDiv) {
                resolve(headerDiv);
                return;
            }

            const observer = new MutationObserver((mutations, obs) => {
                const headerDiv = document.querySelector("body > shreddit-app > reddit-header-large > reddit-header-action-items > header > nav > div.h-\\[40px\\].flex-1.py-xs.flex.justify-stretch");

                if (headerDiv) {
                    obs.disconnect();
                    resolve(headerDiv);
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });

            setTimeout(() => {
                observer.disconnect();
                resolve(null);
            }, 10000);
        });
    }

    function initializeCommunities(retryCount = 0) {
        const maxRetries = 3;
        const retryDelay = 1000;

        waitForHeader().then(headerDiv => {
            if (headerDiv && !headerDiv.querySelector('.communities-dropdown')) {
                fetchCommunities();
            } else if (!headerDiv && retryCount < maxRetries) {
                setTimeout(() => {
                    initializeCommunities(retryCount + 1);
                }, retryDelay);
            }
        });
    }

    function createCommunitiesDropdown(communities) {
        const dropdownContainer = document.createElement('div');
        dropdownContainer.className = 'communities-dropdown flex items-center justify-center';

        const button = document.createElement('button');
        button.className = 'communities-button flex items-center justify-center';
        button.innerHTML = `
            <span class="flex items-center justify-center">
                <span class="button-text">Communities</span>
                <span class="flex ml-1">
                    <svg rpl="" fill="currentColor" height="16" icon-name="caret-down-outline" viewBox="0 0 20 20" width="16" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 13.125a.624.624 0 0 1-.442-.183l-5-5 .884-.884L10 11.616l4.558-4.558.884.884-5 5a.624.624 0 0 1-.442.183Z"></path>
                    </svg>
                </span>
            </span>
        `;

        const dropdownContent = document.createElement('div');
        dropdownContent.className = 'communities-dropdown-content hidden absolute bg-neutral-background-strong mt-1 shadow-lg z-50';
        dropdownContent.style.minWidth = '200px';
        dropdownContent.style.maxHeight = '400px';
        dropdownContent.style.overflowY = 'auto';

        if (!communities || communities.length === 0) {
            const noCommunitiesMsg = document.createElement('div');
            noCommunitiesMsg.className = 'px-4 py-3 text-secondary text-center';
            noCommunitiesMsg.textContent = 'Nothing Here';
            dropdownContent.appendChild(noCommunitiesMsg);
        } else {
            communities.forEach(community => {
                const item = document.createElement('a');
                item.href = `https://www.reddit.com/${community.prefixedName}`;
                item.className = 'flex items-center px-4 py-2 text-secondary hover:bg-neutral-background-hover';

                if (community.styles?.icon) {
                    item.innerHTML = `
                        <img src="${community.styles.icon}" class="community-icon mr-3" alt="${community.prefixedName}">
                        <span>${community.prefixedName}</span>
                    `;
                } else {
                    item.innerHTML = `<span>${community.prefixedName}</span>`;
                }

                dropdownContent.appendChild(item);
            });
        }

        button.addEventListener('click', () => {
            dropdownContent.classList.toggle('hidden');
        });

        document.addEventListener('click', (e) => {
            if (!dropdownContainer.contains(e.target)) {
                dropdownContent.classList.add('hidden');
            }
        });

        dropdownContainer.appendChild(button);
        dropdownContainer.appendChild(dropdownContent);

        return dropdownContainer;
    }

    function insertCommunitiesDropdown(communities) {
        const headerDiv = document.querySelector("body > shreddit-app > reddit-header-large > reddit-header-action-items > header > nav > div.h-\\[40px\\].flex-1.py-xs.flex.justify-stretch");

        if (headerDiv) {
            cleanupOldDropdowns();

            const dropdown = createCommunitiesDropdown(communities);
            dropdown.style.marginLeft = '12px';
            headerDiv.appendChild(dropdown);
        } else {
            console.warn('Header container not found for communities dropdown');
        }
    }

    function setCachedCommunities(communities) {
        const cache = {
            timestamp: Date.now(),
            data: communities
        };
        localStorage.setItem('redditCommunities', JSON.stringify(cache));
    }

    function getCachedCommunities() {
        const cache = localStorage.getItem('redditCommunities');
        if (!cache) return null;

        const { timestamp, data } = JSON.parse(cache);
        const fiveMinutes = 5 * 60 * 1000;

        if (Date.now() - timestamp > fiveMinutes) {
            localStorage.removeItem('redditCommunities');
            return null;
        }

        return data;
    }

    async function fetchCommunities() {
        try {
            const cachedData = getCachedCommunities();
            if (cachedData) {
                insertCommunitiesDropdown(cachedData);
                return;
            }

            const response = await fetch('https://www.reddit.com/svc/shreddit/left-nav-communities-section', {
                headers: {
                    'Accept': 'text/html',
                    'Cookie': document.cookie
                }
            });

            if (!response.ok) {
                insertCommunitiesDropdown([]);
                return;
            }

            const html = await response.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            const communitiesController = doc.querySelector('left-nav-communities-controller');
            if (communitiesController) {
                const jsonData = communitiesController.getAttribute('initialStateJSON');
                const communities = JSON.parse(jsonData);

                if (communities && communities.length > 0) {
                    setCachedCommunities(communities);
                    insertCommunitiesDropdown(communities);

                    console.group('Communities Data');
                    communities.forEach(community => {
                        console.log({
                            name: community.prefixedName,
                            id: community.id,
                            icon: community.styles?.icon || null,
                            primaryColor: community.styles?.primaryColor || null
                        });
                    });
                    console.groupEnd();
                } else {
                    insertCommunitiesDropdown([]);
                }
            } else {
                insertCommunitiesDropdown([]);
            }
        } catch (error) {
            console.error('Error fetching communities:', error);
            const cachedData = getCachedCommunities();
            insertCommunitiesDropdown(cachedData || []);
        }
    }

    document.addEventListener('DOMContentLoaded', () => {
        applyStyles();
        initializeCommunities();
    });

    window.addEventListener('load', () => {
        const headerDiv = document.querySelector("body > shreddit-app > reddit-header-large > reddit-header-action-items > header > nav > div.h-\\[40px\\].flex-1.py-xs.flex.justify-stretch");
        if (!headerDiv || !headerDiv.querySelector('.communities-dropdown')) {
            initializeCommunities();
        }
    });

    function isPostPage() {
        return /\/comments\//.test(window.location.pathname);
    }

    function isHomePage() {
        return window.location.pathname === '/';
    }

    const baseCSS = `
        /* Common layout rules */
        #left-sidebar-container {
            display: none !important;
        }

        .subgrid-container.m\\:col-start-2.box-border.flex.flex-col.order-2.w-full {
            width: calc(100% - 340px) !important;
            max-width: none !important;
            margin-right: 320px !important;
            margin-left: 0 !important;
        }

        .grid-container.theme-rpl.grid {
            display: block !important;
            padding-left: 32px !important;
        }

        #right-sidebar-container {
            position: fixed !important;
            right: 0 !important;
            width: 320px !important;
        }

        /* Theme variables */
        :root.theme-dark .sidebar-grid,
        :root.theme-dark .grid-container.grid,
        :root.theme-dark .sidebar-grid .theme-beta:not(.stickied):not(#left-sidebar-container):not(.left-sidebar-container),
        :root.theme-dark .sidebar-grid .theme-rpl:not(.stickied):not(#left-sidebar-container):not(.left-sidebar-container),
        :root.theme-dark .grid-container.grid .theme-beta:not(.stickied):not(#left-sidebar-container):not(.left-sidebar-container),
        :root.theme-dark .grid-container.grid .theme-rpl:not(.stickied):not(#left-sidebar-container):not(.left-sidebar-container) {
            --color-neutral-content: #FFFFFF !important;
            --color-neutral-content-disabled: #666666 !important;
            --color-neutral-content-weak: #AAAAAA !important;
            --color-neutral-content-strong: #FFFFFF !important;
            --color-neutral-background: #000000 !important;
            --color-neutral-background-selected: #000000 !important;
            --color-neutral-background-weak: #000000 !important;
            --color-neutral-background-medium: #000000 !important;
            --color-neutral-background-strong: #000000 !important;
            --color-neutral-background-hover: #333333 !important;
            --color-neutral-border-strong: #333333 !important;
            --color-tone-1: #FFFFFF !important;
            --color-tone-2: #CCCCCC !important;
            --color-tone-3: #999999 !important;
            --color-tone-4: #666666 !important;
            --color-tone-5: #333333 !important;
            --color-tone-6: #000000 !important;
            --color-tone-7: #000000 !important;
            --color-ui-canvas: #000000 !important;
            --shreddit-content-background: #000000 !important;
            background-color: #000000 !important;
        }

        /* Light theme variables */
        :root.theme-light .sidebar-grid,
        :root.theme-light .grid-container.grid,
        :root.theme-light .sidebar-grid .theme-beta:not(.stickied):not(#left-sidebar-container):not(.left-sidebar-container),
        :root.theme-light .sidebar-grid .theme-rpl:not(.stickied):not(#left-sidebar-container):not(.left-sidebar-container),
        :root.theme-light .grid-container.grid .theme-beta:not(.stickied):not(#left-sidebar-container):not(.left-sidebar-container),
        :root.theme-light .grid-container.grid .theme-rpl:not(.stickied):not(#left-sidebar-container):not(.left-sidebar-container) {
            --color-neutral-content: #1A1A1B !important;
            --color-neutral-content-disabled: #A5A5A5 !important;
            --color-neutral-content-weak: #7C7C7C !important;
            --color-neutral-content-strong: #1A1A1B !important;
            --color-neutral-background: #FFFFFF !important;
            --color-neutral-background-selected: #FFFFFF !important;
            --color-neutral-background-weak: #FFFFFF !important;
            --color-neutral-background-medium: #FFFFFF !important;
            --color-neutral-background-strong: #FFFFFF !important;
            --color-neutral-background-hover: #F6F7F8 !important;
            --color-neutral-border-strong: #EDEFF1 !important;
            --color-tone-1: #1A1A1B !important;
            --color-tone-2: #444444 !important;
            --color-tone-3: #7C7C7C !important;
            --color-tone-4: #A5A5A5 !important;
            --color-tone-5: #EDEFF1 !important;
            --color-tone-6: #FFFFFF !important;
            --color-tone-7: #FFFFFF !important;
            --color-ui-canvas: #FFFFFF !important;
            --shreddit-content-background: #FFFFFF !important;
            background-color: #FFFFFF !important;
        }

        /* Update background colors to use theme variables */
        body,
        .grid-container,
        #AppRouter-main-content,
        shreddit-app,
        [class*="theme-"],
        [class*="background-"],
        #main-content > shreddit-async-loader,
        #comment-tree-content-anchor-1hdc779,
        [id^="comment-tree-content-anchor-"],
        #main-content > shreddit-async-loader > comment-body-header,
        #comment-tree-content-anchor-1hdc779,
        #comment-tree,
        shreddit-post,
        .post-container,
        .post,
        .modal-content,
        .popup,
        .dropdown-menu {
            background-color: var(--color-neutral-background) !important;
        }

        /* Update text colors */
        .post-title-text {
            color: var(--color-neutral-content) !important;
        }

        .post-meta-line {
            color: var(--color-neutral-content-weak) !important;
        }

        /* Communities dropdown styles */
        .communities-dropdown {
            position: relative;
            margin-left: 16px;
        }

        .communities-dropdown-content {
            border: 1px solid var(--color-neutral-border-strong);
            padding: 4px 0;
            max-height: 70vh;
            width: 240px;
            border-radius: 4px;
        }

        .communities-dropdown-content a {
            text-decoration: none;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            padding: 8px 12px;    /* Increased vertical padding slightly */
            font-size: 14px;    /* Smaller font size */
            line-height: 1.2;   /* Tighter line height */
        }

        .communities-dropdown-content a img {
            width: 16px;       /* Smaller icons */
            height: 16px;
            margin-right: 8px;
        }

        .communities-dropdown-content a:hover {
            text-decoration: none;
            background-color: var(--color-neutral-background-hover);
        }

        /* Add smooth scrollbar for the dropdown */
        .communities-dropdown-content::-webkit-scrollbar {
            width: 6px;
        }

        .communities-dropdown-content::-webkit-scrollbar-track {
            background: transparent;
        }

        .communities-dropdown-content::-webkit-scrollbar-thumb {
            background: #666;
            border-radius: 3px;
        }

        .communities-dropdown-content::-webkit-scrollbar-thumb:hover {
            background: #888;
        }

        /* Updated header height */
        body > shreddit-app > reddit-header-large > reddit-header-action-items > header > nav > div.h-\\[40px\\].flex-1.py-xs.flex.justify-stretch {
            height: 48px !important;
            padding: 0 16px !important;
        }

        /* Updated Communities button styles */
        .communities-button {
            height: 32px;
            padding: 0 12px;
            border-radius: 4px;
            background-color: var(--color-neutral-background-strong);
            border: 1px solid var(--color-neutral-border-strong);
            color: var(--color-neutral-content);
            font-size: 14px;
            font-weight: 500;
            transition: background-color 0.2s;
        }

        .communities-button:hover {
            background-color: var(--color-neutral-background-hover);
        }

        .communities-button .button-text {
            margin-right: 4px;
        }

        /* Adjust dropdown positioning */
        .communities-dropdown {
            position: relative;
            height: 100%;
            display: flex;
            align-items: center;
        }

        .communities-dropdown-content {
            top: 40px;
            left: 0;
        }

        .communities-dropdown-content .community-icon {
            width: 24px;          /* Increased from 20px to 24px */
            height: 24px;         /* Increased from 20px to 24px */
            border-radius: 4px;
            object-fit: cover;
        }
    `;

    const mainPageSpecificCSS = `
        /* Main content specific adjustments */
        #main-content {
            width: calc(100% - 40px) !important;
            max-width: none !important;
        }

        /* Additional fixes for Compact layout */
        .main.w-full.flex-grid--main-container-card,
        .main.w-full.flex-grid--main-container-compact {
            width: 100% !important;
            max-width: none !important;
        }

        /* Post flair and title styling */
        shreddit-post > div:nth-child(6) > shreddit-post-flair {
            display: none !important;
        }

        shreddit-post > div:nth-child(3) > div {
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
        }

        shreddit-post > div:nth-child(3) > div::after {
            content: "" !important;
            display: contents !important;
        }

        shreddit-post > div:nth-child(3) > div shreddit-post-flair {
            display: inline-flex !important;
        }

        shreddit-post {
            margin-top: 2px !important;
            margin-bottom: 2px !important;
        }

        /* Post title styling */
        [id^="post-title-"] {
            display: none !important;
        }

        .custom-post-header {
            display: flex !important;
            flex-direction: column !important;
            gap: 4px !important;
        }

        .post-title-line {
            display: flex !important;
            align-items: center !important;
            gap: 8px !important;
            font-size: 18px !important;
            font-weight: 500 !important;
        }

        .post-title-text {
            font-size: 18px !important;
            font-weight: 500 !important;
            color: var(--color-neutral-content) !important;
        }

        .post-meta-line {
            font-size: 12px !important;
            color: var(--color-neutral-content-weak) !important;
        }

        /* Hide original elements */
        shreddit-post > div:nth-child(3) > div > span.relative,
        shreddit-post > div:nth-child(3) > div > author-flair-event-handler,
        shreddit-post > div:nth-child(3) > div > faceplate-timeago {
            display: none !important;
        }

        /* Thumbnail and vote button layout */
        shreddit-post > div:nth-child(3) {
            display: flex !important;
            flex-direction: row !important;
            align-items: flex-start !important;
            gap: 8px !important;
        }

        /* Move vote buttons */
        [data-post-click-location="vote"] {
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important;
            gap: 4px !important;
            margin-right: 8px !important;
        }

        /* Vote button styling */
        [data-post-click-location="vote"] button {
            color: #666 !important;
            transition: color 0.2s !important;
        }

        [data-post-click-location="vote"] button:hover {
            color: #FF4500 !important;  /* Upvote orange */
        }

        [data-post-click-location="vote"] button[downvote]:hover {
            color: #7193FF !important;  /* Downvote blue */
        }

        [data-post-click-location="vote"] span {
            color: #D7DADC !important;
            font-size: 12px !important;
        }

        /* Thumbnail container adjustments */
        .flex.flex-col.items-end.gap-2xs {
            display: flex !important;
            flex-direction: row !important;
            align-items: flex-start !important;
            gap: 8px !important;
        }

        /* Ensure thumbnail maintains its size */
        .relative.rounded-\\[8px\\].overflow-hidden.box-border.border.border-solid.border-neutral-border-weak {
            flex-shrink: 0 !important;
        }
    `;

    const postPageSpecificCSS = `
        /* Post page specific adjustments */
        #main-content,
        #comment-tree {
            width: 100% !important;
            max-width: none !important;
            margin-left: 0 !important;
        }
    `;

    function applyStyles() {
        const existingStyle = document.getElementById('reddit-custom-style');
        if (existingStyle) {
            existingStyle.remove();
        }

        const style = document.createElement('style');
        style.id = 'reddit-custom-style';

        let cssContent = baseCSS;

        if (isPostPage()) {
            cssContent += postPageSpecificCSS;
        } else if (!isHomePage()) {
            cssContent += mainPageSpecificCSS;
        }

        style.textContent = cssContent;
        document.head.appendChild(style);
    }

    applyStyles();

    let lastUrl = window.location.href;
    new MutationObserver(() => {
        if (lastUrl !== window.location.href) {
            lastUrl = window.location.href;
            applyStyles();
            initializeCommunities();
        }
    }).observe(document.body, { subtree: true, childList: true });

    function movePostFlairs() {
        if (!isPostPage() && !isHomePage()) {
            document.querySelectorAll('shreddit-post').forEach(post => {
                const flair = post.querySelector('div:nth-child(6) > shreddit-post-flair');
                const titleDiv = post.querySelector('div:nth-child(3) > div');

                if (flair && titleDiv && !titleDiv.querySelector('shreddit-post-flair')) {
                    const clonedFlair = flair.cloneNode(true);
                    titleDiv.appendChild(clonedFlair);
                }
            });
        }
    }

    function rearrangePostElements() {
        if (!isPostPage() && !isHomePage()) {
            document.querySelectorAll('shreddit-post').forEach(post => {
                const postContainer = post.querySelector('div:nth-child(3) > div');
                if (!postContainer || postContainer.querySelector('.custom-post-header')) return;

                const username = post.querySelector('span.relative span');
                const timeago = post.querySelector('faceplate-timeago');
                const postTitle = post.querySelector('[id^="post-title-"]');
                const postFlair = post.querySelector('shreddit-post-flair');

                const customHeader = document.createElement('div');
                customHeader.className = 'custom-post-header';

                const titleLine = document.createElement('div');
                titleLine.className = 'post-title-line';

                const metaLine = document.createElement('div');
                metaLine.className = 'post-meta-line';

                if (postTitle) {
                    const titleSpan = document.createElement('span');
                    titleSpan.className = 'post-title-text';
                    titleSpan.textContent = postTitle.textContent;
                    titleLine.appendChild(titleSpan);
                }

                metaLine.innerHTML = `Posted by ${username?.textContent || 'unknown'} ${timeago?.textContent || ''} `;
                if (postFlair) metaLine.appendChild(postFlair.cloneNode(true));

                customHeader.appendChild(titleLine);
                customHeader.appendChild(metaLine);

                while (postContainer.firstChild) {
                    postContainer.removeChild(postContainer.firstChild);
                }
                postContainer.appendChild(customHeader);
            });
        }
    }

    movePostFlairs();
    rearrangePostElements();

    const observer = new MutationObserver(() => {
        movePostFlairs();
        rearrangePostElements();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    function cleanupOldDropdowns() {
        const oldDropdowns = document.querySelectorAll('.communities-dropdown');
        oldDropdowns.forEach(dropdown => dropdown.remove());
    }
})();