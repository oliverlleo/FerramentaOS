// Custom Page Manager - Loads and displays selected tools
class CustomPageManager {
    constructor() {
        this.pageId = null;
        this.pageData = null;
        this.tools = [];
        this.selectedTools = [];
        this.init();
    }

    init() {
        // Get page ID from URL parameters
        this.pageId = this.getPageIdFromUrl();
        
        if (!this.pageId) {
            this.showError('ID da página não encontrado na URL');
            return;
        }

        // Load page data and tools
        this.loadPageData();
        this.loadAllTools();
    }

    getPageIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('page');
    }

    async loadPageData() {
        try {
            window.Firebase.customPagesRef.child(this.pageId).once('value', (snapshot) => {
                const data = snapshot.val();
                
                if (!data) {
                    this.showError('Página não encontrada');
                    return;
                }

                if (data.isActive === false) {
                    this.showInactive();
                    return;
                }

                this.pageData = data;
                this.updatePageInfo();
                
                // Increment access count
                this.incrementAccessCount();
                
                // Check if tools are loaded to render
                if (this.tools.length > 0) {
                    this.renderSelectedTools();
                }
            });
            
        } catch (error) {
            console.error('Error loading page data:', error);
            this.showError('Erro ao carregar dados da página');
        }
    }

    async loadAllTools() {
        try {
            window.Firebase.toolsRef.once('value', (snapshot) => {
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
                
                // Check if page data is loaded to render
                if (this.pageData) {
                    this.renderSelectedTools();
                }
            });
            
        } catch (error) {
            console.error('Error loading tools:', error);
            this.showError('Erro ao carregar ferramentas');
        }
    }

    updatePageInfo() {
        if (!this.pageData) return;

        // Update page title and description
        document.getElementById('pageTitle').textContent = this.pageData.name;
        document.getElementById('pageDescription').textContent = this.pageData.description || 'Ferramentas Perfecta';
        
        // Update hero section
        document.getElementById('heroTitle').innerHTML = `
            Suas <span class="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-primary-600">Ferramentas</span>
        `;
        document.getElementById('heroDescription').textContent = this.pageData.description || 'Acesse suas ferramentas selecionadas';
        
        // Update document title
        document.title = `${this.pageData.name} | Ferramentas Perfecta`;
    }

    renderSelectedTools() {
        if (!this.pageData || !this.pageData.selectedTools || this.tools.length === 0) {
            return;
        }

        // Filter selected tools
        this.selectedTools = this.tools.filter(tool => 
            this.pageData.selectedTools.includes(tool.id)
        );

        if (this.selectedTools.length === 0) {
            this.showError('Nenhuma ferramenta encontrada para esta página');
            return;
        }

        // Update tools count
        const toolsCount = this.selectedTools.length;
        document.getElementById('toolsCount').innerHTML = `
            <i data-lucide="package" class="w-4 h-4 inline mr-1"></i>
            <span>${toolsCount} ferramenta${toolsCount !== 1 ? 's' : ''}</span>
        `;

        // Render tools grid
        const toolsGrid = document.getElementById('toolsGrid');
        toolsGrid.innerHTML = this.selectedTools.map(tool => this.createToolCard(tool)).join('');

        // Show tools container and hide loading
        this.hideLoading();
        this.showToolsContainer();

        // Initialize icons and animations
        lucide.createIcons();
        this.animateToolCards();
    }

    createToolCard(tool) {
        const categoryInfo = this.getCategoryInfo(tool.category);
        
        return `
            <div class="tool-card bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group cursor-pointer overflow-hidden"
                 onclick="window.open('${tool.url}', '_blank')"
                 data-tool-id="${tool.id}">
                
                <!-- Tool Header -->
                <div class="p-6 pb-4">
                    <div class="flex items-center justify-between mb-4">
                        <div class="w-12 h-12 ${categoryInfo.bgColor} rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                            <span class="text-white text-xl">${categoryInfo.emoji}</span>
                        </div>
                        <div class="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            <i data-lucide="external-link" class="w-5 h-5 text-gray-400"></i>
                        </div>
                    </div>
                    
                    <h3 class="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors duration-300">
                        ${this.escapeHtml(tool.name)}
                    </h3>
                    
                    ${tool.description ? `
                        <p class="text-gray-600 text-sm line-clamp-2 mb-4">
                            ${this.escapeHtml(tool.description)}
                        </p>
                    ` : ''}
                </div>

                <!-- Tool Footer -->
                <div class="px-6 pb-6">
                    <div class="flex items-center justify-end">
                        <div class="flex items-center text-sm text-gray-500">
                            <i data-lucide="arrow-up-right" class="w-4 h-4 ml-1 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform duration-300"></i>
                        </div>
                    </div>
                </div>

                <!-- Hover Effect Overlay -->
                <div class="absolute inset-0 bg-gradient-to-r from-primary-500/5 to-primary-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
        `;
    }

    animateToolCards() {
        if (typeof anime !== 'undefined') {
            anime({
                targets: '.tool-card',
                opacity: [0, 1],
                translateY: [30, 0],
                scale: [0.9, 1],
                duration: 600,
                easing: 'easeOutQuart',
                delay: anime.stagger(100)
            });
        }
    }

    async incrementAccessCount() {
        try {
            const currentCount = this.pageData.accessCount || 0;
            await window.Firebase.customPagesRef.child(this.pageId).update({
                accessCount: currentCount + 1,
                lastAccessed: new Date().toISOString()
            });
        } catch (error) {
            console.error('Error incrementing access count:', error);
        }
    }

    showError(message) {
        this.hideLoading();
        document.getElementById('errorState').classList.remove('hidden');
        
        // Update error message if needed
        const errorElement = document.querySelector('#errorState h3');
        if (errorElement && message !== 'Página não encontrada') {
            errorElement.textContent = 'Erro ao carregar página';
            const errorDesc = document.querySelector('#errorState p');
            if (errorDesc) {
                errorDesc.textContent = message;
            }
        }
    }

    showInactive() {
        this.hideLoading();
        document.getElementById('inactiveState').classList.remove('hidden');
    }

    hideLoading() {
        document.getElementById('loadingState').classList.add('hidden');
    }

    showToolsContainer() {
        document.getElementById('toolsContainer').classList.remove('hidden');
    }

    // Utility functions
    getCategoryInfo(category) {
        const categories = {
            desenvolvimento: { name: 'Desenvolvimento', emoji: '🚀', className: 'category-desenvolvimento', bgColor: 'bg-primary-500' },
            design: { name: 'Design', emoji: '🎨', className: 'category-design', bgColor: 'bg-secondary-500' },
            produtividade: { name: 'Produtividade', emoji: '⚡', className: 'category-produtividade', bgColor: 'bg-primary-700' },
            marketing: { name: 'Marketing', emoji: '📈', className: 'category-marketing', bgColor: 'bg-primary-600' },
            analise: { name: 'Análise', emoji: '📊', className: 'category-analise', bgColor: 'bg-gray-500' },
            comunicacao: { name: 'Comunicação', emoji: '💬', className: 'category-comunicacao', bgColor: 'bg-secondary-600' },
            outros: { name: 'Outros', emoji: '📦', className: 'category-outros', bgColor: 'bg-gray-500' },
            catalogos: { name: 'Catálogos', emoji: '📚', className: 'category-catalogos', bgColor: 'bg-gray-700' },
            documentos: { name: 'Documentos', emoji: '📄', className: 'category-documentos', bgColor: 'bg-gray-900' }
        };
        return categories[category] || categories.outros;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize custom page manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for Firebase to be initialized
    const initCustomPage = () => {
        if (window.Firebase && window.Firebase.customPagesRef) {
            window.customPageManager = new CustomPageManager();
        } else {
            setTimeout(initCustomPage, 100);
        }
    };
    
    initCustomPage();
});

// Add some additional CSS for better tool cards
const additionalStyles = `
<style>
.tool-card {
    position: relative;
    overflow: hidden;
}

.tool-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
    transition: left 0.5s;
}

.tool-card:hover::before {
    left: 100%;
}

.line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
}

@keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
}

.tool-card:hover {
    animation: float 2s ease-in-out infinite;
}
</style>
`;

// Inject additional styles
document.head.insertAdjacentHTML('beforeend', additionalStyles);

