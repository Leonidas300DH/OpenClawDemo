// Podcast Dashboard App
class PodcastDashboard {
    constructor() {
        this.baseURL = 'http://localhost:3001/api';
        this.feeds = [];
        this.episodes = [];
        this.filteredEpisodes = [];
        this.tags = [];
        this.currentEditingEpisode = null;
        
        this.init();
    }

    async init() {
        this.setupEventListeners();
        await this.loadData();
    }

    setupEventListeners() {
        // Add feed
        document.getElementById('addFeedBtn').addEventListener('click', () => this.addFeed());
        document.getElementById('feedUrl').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addFeed();
        });

        // Filters
        document.getElementById('podcastFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('searchInput').addEventListener('input', () => this.applyFilters());
        document.getElementById('tagFilter').addEventListener('change', () => this.applyFilters());
        document.getElementById('clearFiltersBtn').addEventListener('click', () => this.clearFilters());

        // Tag modal
        document.getElementById('cancelTagsBtn').addEventListener('click', () => this.closeTagModal());
        document.getElementById('saveTagsBtn').addEventListener('click', () => this.saveTags());
        document.getElementById('tagInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTag();
        });
    }

    async loadData() {
        await Promise.all([
            this.loadFeeds(),
            this.loadEpisodes(),
            this.loadTags()
        ]);
        this.updateStats();
        this.populateFilters();
        this.applyFilters();
    }

    async loadFeeds() {
        try {
            const response = await fetch(`${this.baseURL}/feeds`);
            const data = await response.json();
            this.feeds = data.feeds;
            this.renderFeeds();
        } catch (error) {
            console.error('Error loading feeds:', error);
            this.showFeedError('Failed to load feeds');
        }
    }

    async loadEpisodes() {
        try {
            document.getElementById('loadingEpisodes').classList.remove('hidden');
            const response = await fetch(`${this.baseURL}/episodes`);
            const data = await response.json();
            this.episodes = data.episodes;
            this.filteredEpisodes = [...this.episodes];
        } catch (error) {
            console.error('Error loading episodes:', error);
        } finally {
            document.getElementById('loadingEpisodes').classList.add('hidden');
        }
    }

    async loadTags() {
        try {
            const response = await fetch(`${this.baseURL}/tags`);
            const data = await response.json();
            this.tags = data.tags;
        } catch (error) {
            console.error('Error loading tags:', error);
        }
    }

    async addFeed() {
        const urlInput = document.getElementById('feedUrl');
        const url = urlInput.value.trim();
        
        if (!url) {
            this.showFeedError('Please enter a RSS feed URL');
            return;
        }

        const btn = document.getElementById('addFeedBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<div class="loading"></div> Adding...';
        btn.disabled = true;

        this.hideFeedMessages();

        try {
            const response = await fetch(`${this.baseURL}/feeds`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ url })
            });

            const data = await response.json();
            
            if (response.ok) {
                this.showFeedSuccess(`Feed "${data.feed.title}" added successfully!`);
                urlInput.value = '';
                await this.loadData();
            } else {
                this.showFeedError(data.message || 'Failed to add feed');
            }
        } catch (error) {
            this.showFeedError('Network error. Please try again.');
        } finally {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }
    }

    async deleteFeed(feedId) {
        if (!confirm('Are you sure you want to delete this feed and all its episodes?')) {
            return;
        }

        try {
            const response = await fetch(`${this.baseURL}/feeds/${feedId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                await this.loadData();
            } else {
                const data = await response.json();
                alert('Failed to delete feed: ' + data.message);
            }
        } catch (error) {
            alert('Network error. Please try again.');
        }
    }

    applyFilters() {
        const podcastFilter = document.getElementById('podcastFilter').value;
        const searchQuery = document.getElementById('searchInput').value.toLowerCase();
        const tagFilter = document.getElementById('tagFilter').value;

        this.filteredEpisodes = this.episodes.filter(episode => {
            // Podcast filter
            if (podcastFilter && episode.podcastId !== podcastFilter) {
                return false;
            }

            // Search filter
            if (searchQuery) {
                const searchText = `${episode.episodeTitle} ${episode.podcastTitle} ${episode.description}`.toLowerCase();
                if (!searchText.includes(searchQuery)) {
                    return false;
                }
            }

            // Tag filter
            if (tagFilter && !episode.tags.includes(tagFilter)) {
                return false;
            }

            return true;
        });

        this.renderEpisodes();
        this.updateFilteredCount();
    }

    clearFilters() {
        document.getElementById('podcastFilter').value = '';
        document.getElementById('searchInput').value = '';
        document.getElementById('tagFilter').value = '';
        this.applyFilters();
    }

    renderFeeds() {
        const container = document.getElementById('feedsList');
        
        if (this.feeds.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-4">No feeds added yet</p>';
            return;
        }

        container.innerHTML = this.feeds.map(feed => `
            <div class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div class="flex-1">
                    <h4 class="font-medium">${this.escapeHtml(feed.title)}</h4>
                    <p class="text-sm text-gray-600">${feed.episodeCount} episodes</p>
                    <p class="text-xs text-gray-500">${feed.url}</p>
                </div>
                <button 
                    onclick="app.deleteFeed('${feed.id}')" 
                    class="ml-4 px-3 py-1 text-red-600 hover:bg-red-50 rounded"
                >
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `).join('');
    }

    renderEpisodes() {
        const container = document.getElementById('episodesList');
        const noEpisodesMsg = document.getElementById('noEpisodes');
        
        if (this.filteredEpisodes.length === 0) {
            container.innerHTML = '';
            noEpisodesMsg.classList.remove('hidden');
            return;
        }

        noEpisodesMsg.classList.add('hidden');
        container.innerHTML = this.filteredEpisodes.map(episode => this.renderEpisodeCard(episode)).join('');
    }

    renderEpisodeCard(episode) {
        const artwork = episode.episodeImage || episode.podcastImage || 'https://via.placeholder.com/96x96?text=🎧';
        const duration = this.formatDuration(episode.duration);
        const pubDate = this.formatDate(episode.pubDate);
        const description = this.stripHtml(episode.description);
        
        return `
            <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div class="flex gap-4">
                    <div class="flex-shrink-0">
                        <img 
                            src="${artwork}" 
                            alt="${this.escapeHtml(episode.episodeTitle)}"
                            class="w-24 h-24 rounded-lg object-cover bg-gray-100"
                            onerror="this.src='https://via.placeholder.com/96x96?text=🎧'"
                        >
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-start justify-between mb-2">
                            <div class="flex-1">
                                <h3 class="text-lg font-semibold text-gray-900 mb-1">
                                    ${this.escapeHtml(episode.episodeTitle)}
                                </h3>
                                <p class="text-sm text-gray-600 mb-2">
                                    ${this.escapeHtml(episode.podcastTitle)}
                                </p>
                                <div class="flex items-center gap-4 text-sm text-gray-500 mb-3">
                                    <span><i class="far fa-calendar"></i> ${pubDate}</span>
                                    ${duration ? `<span><i class="far fa-clock"></i> ${duration}</span>` : ''}
                                </div>
                            </div>
                        </div>
                        
                        <div class="episode-description mb-3" id="desc-${episode.episodeId}">
                            ${description}
                        </div>
                        
                        <div class="flex items-center justify-between">
                            <div class="flex flex-wrap gap-2">
                                ${episode.tags.map(tag => `
                                    <span class="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                        ${this.escapeHtml(tag)}
                                    </span>
                                `).join('')}
                            </div>
                            <div class="flex gap-2">
                                <button 
                                    onclick="app.toggleDescription('${episode.episodeId}')"
                                    class="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                                >
                                    <i class="fas fa-chevron-down" id="chevron-${episode.episodeId}"></i>
                                    Expand
                                </button>
                                <button 
                                    onclick="app.openTagEditor('${episode.episodeId}')"
                                    class="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                >
                                    <i class="fas fa-tags"></i> Tags
                                </button>
                                ${episode.audioUrl ? `
                                    <a 
                                        href="${episode.audioUrl}" 
                                        target="_blank"
                                        class="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                    >
                                        <i class="fas fa-play"></i> Play
                                    </a>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    toggleDescription(episodeId) {
        const desc = document.getElementById(`desc-${episodeId}`);
        const chevron = document.getElementById(`chevron-${episodeId}`);
        
        if (desc.classList.contains('expanded')) {
            desc.classList.remove('expanded');
            chevron.classList.remove('fa-chevron-up');
            chevron.classList.add('fa-chevron-down');
        } else {
            desc.classList.add('expanded');
            chevron.classList.remove('fa-chevron-down');
            chevron.classList.add('fa-chevron-up');
        }
    }

    openTagEditor(episodeId) {
        this.currentEditingEpisode = this.episodes.find(ep => ep.episodeId === episodeId);
        if (!this.currentEditingEpisode) return;

        document.getElementById('tagModal').classList.remove('hidden');
        this.renderCurrentTags();
        document.getElementById('tagInput').focus();
    }

    closeTagModal() {
        document.getElementById('tagModal').classList.add('hidden');
        this.currentEditingEpisode = null;
        document.getElementById('tagInput').value = '';
    }

    renderCurrentTags() {
        const container = document.getElementById('currentTags');
        if (!this.currentEditingEpisode) return;

        const tags = this.currentEditingEpisode.tags || [];
        container.innerHTML = tags.map(tag => `
            <span class="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full mr-2 mb-2">
                ${this.escapeHtml(tag)}
                <button onclick="app.removeTag('${tag}')" class="hover:text-blue-900">
                    <i class="fas fa-times text-xs"></i>
                </button>
            </span>
        `).join('');
    }

    addTag() {
        const input = document.getElementById('tagInput');
        const tag = input.value.trim().toLowerCase();
        
        if (!tag) return;
        if (!this.currentEditingEpisode) return;
        if (this.currentEditingEpisode.tags.includes(tag)) {
            input.value = '';
            return;
        }

        this.currentEditingEpisode.tags.push(tag);
        this.renderCurrentTags();
        input.value = '';
    }

    removeTag(tag) {
        if (!this.currentEditingEpisode) return;
        
        this.currentEditingEpisode.tags = this.currentEditingEpisode.tags.filter(t => t !== tag);
        this.renderCurrentTags();
    }

    async saveTags() {
        if (!this.currentEditingEpisode) return;

        try {
            const response = await fetch(`${this.baseURL}/episodes/${this.currentEditingEpisode.episodeId}/tags`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ tags: this.currentEditingEpisode.tags })
            });

            if (response.ok) {
                await this.loadTags();
                this.populateTagFilter();
                this.renderEpisodes();
                this.closeTagModal();
            } else {
                const data = await response.json();
                alert('Failed to save tags: ' + data.message);
            }
        } catch (error) {
            alert('Network error. Please try again.');
        }
    }

    populateFilters() {
        this.populatePodcastFilter();
        this.populateTagFilter();
    }

    populatePodcastFilter() {
        const select = document.getElementById('podcastFilter');
        const currentValue = select.value;
        
        select.innerHTML = '<option value="">All Podcasts</option>';
        
        const uniqueFeeds = [...new Map(this.episodes.map(ep => [ep.podcastId, ep])).values()];
        uniqueFeeds.forEach(episode => {
            select.innerHTML += `<option value="${episode.podcastId}">${this.escapeHtml(episode.podcastTitle)}</option>`;
        });
        
        select.value = currentValue;
    }

    populateTagFilter() {
        const select = document.getElementById('tagFilter');
        const currentValue = select.value;
        
        select.innerHTML = '<option value="">All Tags</option>';
        
        this.tags.forEach(tag => {
            select.innerHTML += `<option value="${this.escapeHtml(tag)}">${this.escapeHtml(tag)}</option>`;
        });
        
        select.value = currentValue;
    }

    updateStats() {
        document.getElementById('totalEpisodes').textContent = `${this.episodes.length} episodes`;
        document.getElementById('totalFeeds').textContent = `${this.feeds.length} feeds`;
    }

    updateFilteredCount() {
        document.getElementById('filteredCount').textContent = 
            `Showing ${this.filteredEpisodes.length} of ${this.episodes.length} episodes`;
    }

    formatDuration(seconds) {
        if (!seconds) return '';
        
        const num = parseInt(seconds);
        const hours = Math.floor(num / 3600);
        const minutes = Math.floor((num % 3600) / 60);
        const secs = num % 60;
        
        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes}:${secs.toString().padStart(2, '0')}`;
        }
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch {
            return dateString;
        }
    }

    stripHtml(html) {
        const div = document.createElement('div');
        div.innerHTML = html;
        return div.textContent || div.innerText || '';
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showFeedError(message) {
        const errorEl = document.getElementById('feedError');
        errorEl.textContent = message;
        errorEl.classList.remove('hidden');
    }

    showFeedSuccess(message) {
        const successEl = document.getElementById('feedSuccess');
        successEl.textContent = message;
        successEl.classList.remove('hidden');
        setTimeout(() => {
            successEl.classList.add('hidden');
        }, 5000);
    }

    hideFeedMessages() {
        document.getElementById('feedError').classList.add('hidden');
        document.getElementById('feedSuccess').classList.add('hidden');
    }
}

// Initialize the app
const app = new PodcastDashboard();