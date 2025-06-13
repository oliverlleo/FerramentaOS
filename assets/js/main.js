// Main Page JavaScript
class ToolsDisplay {
    constructor() {
        this.tools = [];
        this.filteredTools = [];
        this.currentCategory = 'all';
        this.searchTerm = '';
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadTools();
        this.animateOnLoad();
    }

    bindEvents() {
        // Search functionality
        const searchToggle = document.getElementById('searchToggle');
        const searchBar = document.getElementById('searchBar');
        const searchInput = document.getElementById('searchInput');

        searchToggle.addEventListener('click', () => {
            this.toggleSearch();
        });

        searchInput.addEventListener('input', (e) => {
            this.searchTerm = e.target.value;
            this.filterAndRenderTools();
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.filterAndRenderTools();
            }
        });

        // Admin button
        document.getElementById('adminBtn').addEventListener('click', () => {
            window.location.href = 'admin.html';
        });

        // Add first tool button
        document.getElementById('addFirstTool').addEventListener('click', () => {
            window.location.href = 'admin.html';
        });

        // Close search on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeSearch();
            }
        });
    }

    animateOnLoad() {
        // Animate hero section
        anime({
            targets: '.animate-fade-in',
            opacity: [0, 1],
            translateY: [30, 0],
            duration: 1000,
            easing: 'easeOutQuart'
        });

        anime({
            targets: '.animate-slide-up',
            opacity: [0, 1],
            translateY: [50, 0],
            duration: 1200,
            easing: 'easeOutQuart',
            delay: 300
        });

        // Animate navigation
        anime({
            targets: 'nav',
            opacity: [0, 1],
            translateY: [-20, 0],
            duration: 800,
            easing: 'easeOutQuart',
            delay: 100
        });
    }

    async loadTools() {
        try {
            this.showLoading();
            
            window.Firebase.toolsRef.on('value', (snapshot) => {
                const data = snapshot.val();
                this.tools = [];
                
                if (data) {
                    Object.keys(data).forEach(key => {
                        this.tools.push({
                            id: key,
                            ...data[key]
                        });
                    });
                }
                
                // Sort by creation date (newest first)
                this.tools.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                
                this.hideLoading();
                this.updateStats();
                this.renderCategoryFilters();
                this.filterAndRenderTools();
            });
            
        } catch (error) {
            console.error('Error loading tools:', error);
            this.showError();
        }
    }

    filterAndRenderTools() {
        // Apply filters
        this.filteredTools = this.tools.filter(tool => {
            const matchesCategory = this.currentCategory === 'all' || tool.category === this.currentCategory;
            const matchesSearch = !this.searchTerm || 
                tool.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                tool.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
                tool.category.toLowerCase().includes(this.searchTerm.toLowerCase());
            
            return matchesCategory && matchesSearch;
        });

        this.renderTools();
    }

    renderTools() {
        const toolsGrid = document.getElementById('toolsGrid');
        const emptyState = document.getElementById('emptyState');

        if (this.filteredTools.length === 0) {
            toolsGrid.classList.add('hidden');
            emptyState.classList.remove('hidden');
            
            // Animate empty state
            anime({
                targets: emptyState,
                opacity: [0, 1],
                scale: [0.9, 1],
                duration: 500,
                easing: 'easeOutQuart'
            });
            
            return;
        }

        emptyState.classList.add('hidden');
        toolsGrid.classList.remove('hidden');

        // Render tool cards
        toolsGrid.innerHTML = this.filteredTools.map(tool => this.createToolCard(tool)).join('');
        
        // Recreate icons
        lucide.createIcons();
        
        // Animate tool cards
        anime({
            targets: '.tool-card',
            opacity: [0, 1],
            translateY: [30, 0],
            scale: [0.9, 1],
            duration: 600,
            easing: 'easeOutQuart',
            delay: anime.stagger(100, {start: 200})
        });
    }

    createToolCard(tool) {
        const categoryInfo = this.getCategoryInfo(tool.category);
        const createdDate = new Date(tool.createdAt).toLocaleDateString('pt-BR');
        
        return `
            <div class="tool-card group bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gray-200" data-category="${tool.category}">
                <div class="flex items-start justify-between mb-4">
                    <div class="flex items-center space-x-3">
                        <div class="w-12 h-12 rounded-xl flex items-center justify-center text-xl" style="background: ${categoryInfo.gradient}">
                            ${categoryInfo.emoji}
                        </div>
                        <div>
                            <h3 class="font-semibold text-gray-900 text-lg leading-tight">${this.escapeHtml(tool.name)}</h3>
                            <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 mt-1">
                                ${categoryInfo.name}
                            </span>
                        </div>
                    </div>
                    <a href="${tool.url}" 
                       target="_blank" 
                       rel="noopener noreferrer" 
                       class="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-primary-50 text-primary-600 hover:bg-primary-100 transition-colors duration-200 group-hover:scale-110"
                       onclick="this.blur()">
                        <i data-lucide="external-link" class="w-4 h-4"></i>
                    </a>
                </div>
                
                <p class="text-gray-600 text-sm leading-relaxed mb-4">
                    ${this.escapeHtml(tool.description || 'Ferramenta útil para seu trabalho')}
                </p>
                
                <div class="flex items-center justify-between text-xs text-gray-400">
                    <span>Adicionado em ${createdDate}</span>
                    <div class="flex items-center space-x-1">
                        <i data-lucide="calendar" class="w-3 h-3"></i>
                        <span>Recente</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderCategoryFilters() {
        const filtersContainer = document.getElementById('categoryFilters');
        const categories = [...new Set(this.tools.map(tool => tool.category))];
        
        // Always include "all" filter
        let filtersHTML = `
            <button class="filter-btn ${this.currentCategory === 'all' ? 'active' : ''}" data-category="all">
                <i data-lucide="grid-3x3" class="w-4 h-4"></i>
                Todas
            </button>
        `;
        
        // Add category filters
        categories.forEach(category => {
            const categoryInfo = this.getCategoryInfo(category);
            const count = this.tools.filter(tool => tool.category === category).length;
            
            filtersHTML += `
                <button class="filter-btn ${this.currentCategory === category ? 'active' : ''}" data-category="${category}">
                    <span>${categoryInfo.emoji}</span>
                    <span>${categoryInfo.name}</span>
                    <span class="bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full text-xs ml-1">${count}</span>
                </button>
            `;
        });
        
        filtersContainer.innerHTML = filtersHTML;
        
        // Recreate icons
        lucide.createIcons();
        
        // Bind filter events
        filtersContainer.querySelectorAll('.filter-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.setActiveFilter(btn.dataset.category);
            });
        });
        
        // Animate filters
        anime({
            targets: '.filter-btn',
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 500,
            easing: 'easeOutQuart',
            delay: anime.stagger(50)
        });
    }

    setActiveFilter(category) {
        this.currentCategory = category;
        
        // Update active state
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.category === category);
        });
        
        // Animate filter change
        anime({
            targets: '#toolsGrid',
            opacity: [1, 0],
            duration: 200,
            easing: 'easeInQuart',
            complete: () => {
                this.filterAndRenderTools();
                anime({
                    targets: '#toolsGrid',
                    opacity: [0, 1],
                    duration: 300,
                    easing: 'easeOutQuart'
                });
            }
        });
    }

    updateStats() {
        const totalTools = this.tools.length;
        const categories = [...new Set(this.tools.map(tool => tool.category))].length;
        
        // Animate counter
        anime({
            targets: { count: 0 },
            count: totalTools,
            duration: 1500,
            easing: 'easeOutQuart',
            update: function(anim) {
                document.getElementById('totalTools').textContent = Math.round(anim.animatables[0].target.count);
            }
        });
        
        anime({
            targets: { count: 0 },
            count: categories,
            duration: 1500,
            easing: 'easeOutQuart',
            delay: 200,
            update: function(anim) {
                document.getElementById('totalCategories').textContent = Math.round(anim.animatables[0].target.count);
            }
        });
    }

    toggleSearch() {
        const searchBar = document.getElementById('searchBar');
        const isVisible = !searchBar.classList.contains('-translate-y-full');
        
        if (isVisible) {
            this.closeSearch();
        } else {
            this.openSearch();
        }
    }

    openSearch() {
        const searchBar = document.getElementById('searchBar');
        const searchInput = document.getElementById('searchInput');
        
        searchBar.classList.remove('-translate-y-full');
        searchBar.classList.add('translate-y-0');
        
        // Focus input after animation
        setTimeout(() => {
            searchInput.focus();
        }, 300);
        
        // Animate search bar
        anime({
            targets: searchBar,
            opacity: [0, 1],
            duration: 300,
            easing: 'easeOutQuart'
        });
    }

    closeSearch() {
        const searchBar = document.getElementById('searchBar');
        const searchInput = document.getElementById('searchInput');
        
        searchBar.classList.add('-translate-y-full');
        searchBar.classList.remove('translate-y-0');
        
        // Clear search
        searchInput.value = '';
        this.searchTerm = '';
        this.filterAndRenderTools();
    }

    showLoading() {
        document.getElementById('loadingState').classList.remove('hidden');
        document.getElementById('toolsGrid').classList.add('hidden');
        document.getElementById('emptyState').classList.add('hidden');
    }

    hideLoading() {
        document.getElementById('loadingState').classList.add('hidden');
    }

    showError() {
        const toolsGrid = document.getElementById('toolsGrid');
        toolsGrid.innerHTML = `
            <div class="col-span-full text-center py-16">
                <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i data-lucide="alert-circle" class="w-8 h-8 text-red-600"></i>
                </div>
                <h3 class="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar ferramentas</h3>
                <p class="text-gray-600 mb-6">Verifique sua conexão com a internet e tente novamente</p>
                <button onclick="location.reload()" class="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 inline-flex items-center space-x-2">
                    <i data-lucide="refresh-cw" class="w-4 h-4"></i>
                    <span>Tentar Novamente</span>
                </button>
            </div>
        `;
        
        toolsGrid.classList.remove('hidden');
        lucide.createIcons();
    }

    // Utility functions
    getCategoryInfo(category) {
        const categories = {
            desenvolvimento: { 
                name: 'Desenvolvimento', 
                emoji: '🚀', 
                className: 'category-desenvolvimento',
                gradient: 'linear-gradient(135deg, #E53E3E 0%, #dc2626 100%)' // primary-500 to primary-600
            },
            design: { 
                name: 'Design', 
                emoji: '🎨', 
                className: 'category-design',
                gradient: 'linear-gradient(135deg, #2D3748 0%, #1a202c 100%)' // secondary-500 to secondary-600
            },
            produtividade: { 
                name: 'Produtividade', 
                emoji: '⚡', 
                className: 'category-produtividade',
                gradient: 'linear-gradient(135deg, #4A5568 0%, #2D3748 100%)' // gray-600 to gray-700
            },
            marketing: { 
                name: 'Marketing', 
                emoji: '📈', 
                className: 'category-marketing',
                gradient: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)' // primary-600 to primary-700
            },
            analise: { 
                name: 'Análise', 
                emoji: '📊', 
                className: 'category-analise',
                gradient: 'linear-gradient(135deg, #1A202C 0%, #171923 100%)' // gray-800 to gray-900
            },
            comunicacao: { 
                name: 'Comunicação', 
                emoji: '💬', 
                className: 'category-comunicacao',
                gradient: 'linear-gradient(135deg, #1a202c 0%, #171923 100%)' // secondary-600 to secondary-700
            },
            outros: { 
                name: 'Outros', 
                emoji: '📦', 
                className: 'category-outros',
                gradient: 'linear-gradient(135deg, #718096 0%, #4A5568 100%)' // gray-500 to gray-600
            },
            catalogos: { 
                name: 'Catálogos', 
                emoji: '📚', 
                className: 'category-catalogos',
                gradient: 'linear-gradient(135deg, #E53E3E 0%, #dc2626 100%)' // primary-500 to primary-600
            },
            documentos: { 
                name: 'Documentos', 
                emoji: '📄', 
                className: 'category-documentos',
                gradient: 'linear-gradient(135deg, #2D3748 0%, #1a202c 100%)' // secondary-500 to secondary-600
            }
        };;
        return categories[category] || categories.outros;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize tools display
document.addEventListener('DOMContentLoaded', () => {
    new ToolsDisplay();
    
    // Add some interactive effects
    this.addInteractiveEffects();
});

function addInteractiveEffects() {
    // Parallax effect for hero section
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const parallax = document.querySelector('.hero-bg');
        if (parallax) {
            parallax.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    });
    
    // Add floating animation to stats
    anime({
        targets: '.animate-float',
        translateY: [-5, 5],
        duration: 2000,
        easing: 'easeInOutSine',
        direction: 'alternate',
        loop: true,
        delay: anime.stagger(200)
    });
}

