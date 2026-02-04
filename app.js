// Podcast Dashboard App - Dark Theme Version
class PodcastDashboard {
    constructor() {
        this.baseURL = '/api';  // Use relative URL for Vercel
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

        // Filter chips
        document.getElementById('filterAll').addEventListener('click', () => this.setFilterChip('all'));
        document.getElementById('filterUnplayed').addEventListener('click', () => this.setFilterChip('unplayed'));

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

    setFilterChip(type) {
        // Update chip styles
        document.getElementById('filterAll').className = 
            type === 'all' 
                ? "px-4 py-1.5 rounded-full text-sm font-medium bg-white text-zinc-950 shadow-md hover:bg-zinc-200 transition-colors whitespace-nowrap"
                : "px-4 py-1.5 rounded-full text-sm font-medium border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white bg-transparent transition-all whitespace-nowrap";
        
        document.getElementById('filterUnplayed').className = 
            type === 'unplayed' 
                ? "px-4 py-1.5 rounded-full text-sm font-medium bg-white text-zinc-950 shadow-md hover:bg-zinc-200 transition-colors whitespace-nowrap"
                : "px-4 py-1.5 rounded-full text-sm font-medium border border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white bg-transparent transition-all whitespace-nowrap";
        
        this.applyFilters();
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
        this.setFilterChip('all');
        this.applyFilters();
    }

    renderFeeds() {
        const container = document.getElementById('feedsList');
        
        if (this.feeds.length === 0) {
            container.innerHTML = '<p class="text-zinc-500 text-center py-4 text-xs">No feeds added yet</p>';
            return;
        }

        container.innerHTML = this.feeds.map(feed => `
            <div class="flex items-center justify-between p-2 bg-zinc-800/40 rounded-lg border border-zinc-800/60 hover:bg-zinc-800 transition-colors">
                <div class="flex-1 min-w-0">
                    <h4 class="font-medium text-sm text-white truncate">${this.escapeHtml(feed.title)}</h4>
                    <p class="text-xs text-zinc-400">${feed.episodeCount} episodes</p>
                </div>
                <button 
                    onclick="app.deleteFeed('${feed.id}')" 
                    class="ml-2 p-1 text-zinc-400 hover:text-red-400 transition-colors"
                    title="Delete feed"
                >
                    <i class="ph ph-trash text-sm"></i>
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
        const artwork = episode.episodeImage || episode.podcastImage || 'https://via.placeholder.com/400x400?text=🎧';
        const duration = this.formatDuration(episode.duration);
        const pubDate = this.formatDate(episode.pubDate);
        const description = this.stripHtml(episode.description);
        const isNew = this.isRecentEpisode(episode.pubDate);
        
        return `
            <div class="group relative bg-zinc-900/40 border border-zinc-800/60 rounded-xl overflow-hidden hover:bg-zinc-800 hover:border-zinc-700 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-violet-900/5">
                ${isNew ? '<div class="absolute top-3 left-3 z-10"><span class="px-2 py-1 rounded bg-violet-600 text-white text-[10px] font-bold shadow-lg shadow-violet-600/20">NEW</span></div>' : ''}
                
                <!-- Artwork -->
                <div class="aspect-square w-full overflow-hidden relative">
                    <img 
                        src="${artwork}" 
                        alt="${this.escapeHtml(episode.episodeTitle)}"
                        class="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500"
                        onerror="this.src='https://via.placeholder.com/400x400?text=🎧'"
                    >
                    <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        ${episode.audioUrl ? `
                            <a 
                                href="${episode.audioUrl}" 
                                target="_blank"
                                class="w-14 h-14 bg-violet-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-violet-600/30 transform scale-75 group-hover:scale-100 transition-all duration-300 hover:bg-violet-500"
                            >
                                <i class="ph-fill ph-play text-2xl pl-1"></i>
                            </a>
                        ` : ''}
                    </div>
                    <div class="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity delay-75">
                        <button class="w-8 h-8 rounded-full bg-black/60 text-zinc-300 hover:text-pink-500 flex items-center justify-center backdrop-blur-md">
                            <i class="ph ph-heart text-lg"></i>
                        </button>
                    </div>
                </div>
                
                <!-- Content -->
                <div class="p-4">
                    <h3 class="font-bold text-white text-lg leading-tight mb-1 truncate group-hover:text-violet-300 transition-colors">
                        ${this.escapeHtml(episode.episodeTitle)}
                    </h3>
                    <p class="text-xs text-zinc-400 uppercase tracking-wide font-medium mb-3">
                        ${this.escapeHtml(episode.podcastTitle)}
                    </p>
                    
                    <p class="text-sm text-zinc-400 line-clamp-2 mb-4 h-10 leading-snug" id="desc-${episode.episodeId}">
                        ${description.length > 120 ? description.substring(0, 120) + '...' : description}
                    </p>

                    <div class="flex items-center justify-between pt-3 border-t border-zinc-800/50">
                        <div class="flex items-center gap-2 text-xs text-zinc-500">
                            <span class="flex items-center gap-1">
                                <i class="ph ph-calendar"></i> ${pubDate}
                            </span>
                            ${duration ? `<span>•</span><span class="flex items-center gap-1"><i class="ph ph-clock"></i> ${duration}</span>` : ''}
                        </div>
                        <!-- Action buttons -->
                        <div class="flex gap-1">
                            <button 
                                onclick="app.openTagEditor('${episode.episodeId}')"
                                class="p-1.5 text-xs bg-zinc-800/60 text-zinc-400 rounded hover:bg-zinc-700 hover:text-white transition-all"
                                title="Edit tags"
                            >
                                <i class="ph ph-tag"></i>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Tags -->
                    ${episode.tags.length > 0 ? `
                        <div class="flex flex-wrap gap-1 mt-3">
                            ${episode.tags.slice(0, 3).map(tag => {
                                const colors = this.getTagColor(tag);
                                return `<span class="px-2 py-0.5 rounded text-[10px] font-medium ${colors.bg} ${colors.text} ${colors.border}">${this.escapeHtml(tag)}</span>`;
                            }).join('')}
                            ${episode.tags.length > 3 ? `<span class="px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-800/40 text-zinc-500 border border-zinc-700/30">+${episode.tags.length - 3}</span>` : ''}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    getTagColor(tag) {
        const colors = [
            { bg: 'bg-cyan-900/20', text: 'text-cyan-400', border: 'border-cyan-800/30' },
            { bg: 'bg-violet-900/20', text: 'text-violet-400', border: 'border-violet-800/30' },
            { bg: 'bg-pink-900/20', text: 'text-pink-400', border: 'border-pink-800/30' },
            { bg: 'bg-blue-900/20', text: 'text-blue-400', border: 'border-blue-800/30' },
            { bg: 'bg-green-900/20', text: 'text-green-400', border: 'border-green-800/30' },
            { bg: 'bg-orange-900/20', text: 'text-orange-400', border: 'border-orange-800/30' },
        ];
        
        const index = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
        return colors[index];
    }

    isRecentEpisode(pubDate) {
        try {
            const episodeDate = new Date(pubDate);
            const now = new Date();
            const daysDiff = (now - episodeDate) / (1000 * 60 * 60 * 24);
            return daysDiff <= 7; // New if less than 7 days old
        } catch {
            return false;
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
        container.innerHTML = tags.map(tag => {
            const colors = this.getTagColor(tag);
            return `
                <span class="inline-flex items-center gap-1 px-3 py-1 ${colors.bg} ${colors.text} text-sm rounded-full mr-2 mb-2">
                    ${this.escapeHtml(tag)}
                    <button onclick="app.removeTag('${tag}')" class="hover:text-red-400 transition-colors">
                        <i class="ph ph-x text-xs"></i>
                    </button>
                </span>
            `;
        }).join('');
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
        
        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    formatDate(dateString) {
        try {
            const date = new Date(dateString);
            const now = new Date();
            const diffTime = Math.abs(now - date);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            if (diffDays === 1) return 'Yesterday';
            if (diffDays <= 7) return `${diffDays}d ago`;
            if (diffDays <= 30) return `${Math.ceil(diffDays / 7)}w ago`;
            
            return date.toLocaleDateString('en-US', {
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