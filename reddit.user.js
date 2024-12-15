// ==UserScript==
// @name         RedditRestorer
// @namespace    https://github.com/torikushiii/reddit-ui-restore
// @version      1.1
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

        .communities-dropdown {
            position: relative;
            margin-left: 12px;
            height: 100%;
            display: flex;
            align-items: center;
        }

        .communities-button {
            height: 32px;
            padding: 0 12px;
            border-radius: 4px;
            background-color: transparent;
            border: 1px solid #edeff1;
            color: inherit;
            font-size: 14px;
            font-weight: 500;
            display: flex;
            align-items: center;
            cursor: pointer;
            margin-top: 2px;
        }

        .communities-dropdown-content {
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            background-color: var(--color-neutral-background, #fff);
            border: 1px solid var(--color-neutral-border-strong, #edeff1);
            border-radius: 4px;
            min-width: 240px;
            max-height: 400px;
            overflow-y: auto;
            z-index: 1000;
            margin-top: 4px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .communities-dropdown-content.show {
            display: block;
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

        // Initialize communities dropdown
        initializeCommunities();
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

    document.addEventListener('DOMContentLoaded', () => {
        adjustLayout();
        initializeCommunities();
    });

    window.addEventListener('load', () => {
        const headerDiv = document.querySelector("body > shreddit-app > reddit-header-large > reddit-header-action-items > header > nav > div.h-\\[40px\\].flex-1.py-xs.flex.justify-stretch");
        if (!headerDiv || !headerDiv.querySelector('.communities-dropdown')) {
            initializeCommunities();
        }
    });

    function insertCommunitiesDropdown(communities) {
        const headerDiv = document.querySelector("body > shreddit-app > reddit-header-large > reddit-header-action-items > header > nav > div.h-\\[40px\\].flex-1.py-xs.flex.justify-stretch");

        if (!headerDiv) return;

        // Remove any existing dropdown
        const existingDropdown = headerDiv.querySelector('.communities-dropdown');
        if (existingDropdown) {
            existingDropdown.remove();
        }

        // Create dropdown container
        const dropdownContainer = document.createElement('div');
        dropdownContainer.className = 'communities-dropdown';

        // Create button
        const button = document.createElement('button');
        button.className = 'communities-button';
        button.innerHTML = `
            <span style="display: flex; align-items: center;">
                <span>Communities</span>
                <span style="margin-left: 4px; display: flex; align-items: center;">
                    <svg fill="currentColor" height="16" icon-name="caret-down-outline" viewBox="0 0 20 20" width="16" xmlns="http://www.w3.org/2000/svg" style="display: block;">
                        <path d="M10 13.125a.624.624 0 0 1-.442-.183l-5-5 .884-.884L10 11.616l4.558-4.558.884.884-5 5a.624.624 0 0 1-.442.183Z"></path>
                    </svg>
                </span>
            </span>
        `;

        // Create dropdown content
        const dropdownContent = document.createElement('div');
        dropdownContent.className = 'communities-dropdown-content';

        // Add communities to dropdown
        if (!communities || communities.length === 0) {
            const noCommunitiesMsg = document.createElement('div');
            noCommunitiesMsg.style.padding = '12px';
            noCommunitiesMsg.style.textAlign = 'center';
            noCommunitiesMsg.style.color = 'var(--color-neutral-content-weak)';
            noCommunitiesMsg.textContent = 'No communities found';
            dropdownContent.appendChild(noCommunitiesMsg);
        } else {
            communities.forEach(community => {
                const item = document.createElement('a');
                item.href = `https://www.reddit.com/${community.prefixedName}`;
                item.style.cssText = `
                    display: flex;
                    align-items: center;
                    padding: 8px 16px;
                    text-decoration: none;
                    color: var(--color-neutral-content);
                    gap: 12px;
                `;

                // Create icon container
                const iconContainer = document.createElement('div');
                iconContainer.style.cssText = `
                    width: 24px;
                    height: 24px;
                    flex-shrink: 0;
                    border-radius: 4px;
                    overflow: hidden;
                `;

                // Add community icon or fallback
                if (community.styles?.icon) {
                    const icon = document.createElement('img');
                    icon.src = community.styles.icon;
                    icon.alt = community.prefixedName;
                    icon.style.width = '100%';
                    icon.style.height = '100%';
                    icon.style.objectFit = 'cover';
                    iconContainer.appendChild(icon);
                } else {
                    iconContainer.style.backgroundColor = '#e9e9e9';
                    iconContainer.innerHTML = `
                        <svg style="width: 100%; height: 100%; padding: 4px;" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                            <path fill="#818384" d="M16.5,2.924,11.264,15.551H9.91L15.461,2.139h.074a9.721,9.721,0,1,0,.967.785ZM8.475,8.435a1.635,1.635,0,0,0-.233.868v4.2H6.629V6.2H8.174v.93h.041a2.927,2.927,0,0,1,1.008-.745,3.384,3.384,0,0,1,1.453-.294,3.244,3.244,0,0,1,.7.068,1.931,1.931,0,0,1,.458.151l-.656,1.558a2.174,2.174,0,0,0-1.067-.246,2.159,2.159,0,0,0-.981.215A1.59,1.59,0,0,0,8.475,8.435Z"/>
                        </svg>
                    `;
                }

                // Add community name
                const name = document.createElement('span');
                name.textContent = community.prefixedName.replace('r/', '');
                name.style.fontWeight = '500';

                item.appendChild(iconContainer);
                item.appendChild(name);
                dropdownContent.appendChild(item);

                // Add hover effect
                item.addEventListener('mouseenter', () => {
                    item.style.backgroundColor = 'var(--color-neutral-background-hover)';
                });
                item.addEventListener('mouseleave', () => {
                    item.style.backgroundColor = '';
                });
            });
        }

        // Add click handlers
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownContent.classList.toggle('show');
        });

        document.addEventListener('click', (e) => {
            if (!dropdownContainer.contains(e.target)) {
                dropdownContent.classList.remove('show');
            }
        });

        // Assemble and insert dropdown
        dropdownContainer.appendChild(button);
        dropdownContainer.appendChild(dropdownContent);
        headerDiv.appendChild(dropdownContainer);
    }
})();
