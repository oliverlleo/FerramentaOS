// Admin Panel JavaScript
class AdminPanel {
    constructor() {
        this.tools = [];
        this.currentEditId = null;
        this.currentDeleteId = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.initTabs();
        this.loadTools();
        this.animateOnLoad();
    }

    bindEvents() {
        // Navigation
        document.getElementById('backBtn').addEventListener('click', () => {
            window.location.href = 'index.html';
        });

        document.getElementById('viewSiteBtn').addEventListener('click', () => {
            window.open('index.html', '_blank');
        });

        // Form submissions
        document.getElementById('addToolForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addTool();
        });

        document.getElementById('editToolForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateTool();
        });

        // Modal events
        this.bindModalEvents();

        // Search
        document.getElementById('searchTools').addEventListener('input', (e) => {
            this.filterTools(e.target.value);
        });

        // Refresh button
        document.getElementById('refreshBtn').addEventListener('click', () => {
            this.loadTools();
            this.showToast('Dados atualizados!', 'success');
        });

        // Toast close
        document.getElementById('closeToast').addEventListener('click', () => {
            this.hideToast();
        });
    }

    bindModalEvents() {
        // Edit modal
        document.getElementById('closeEditModal').addEventListener('click', () => {
            this.closeEditModal();
        });

        document.getElementById('cancelEdit').addEventListener('click', () => {
            this.closeEditModal();
        });

        // Delete modal
        document.getElementById('cancelDelete').addEventListener('click', () => {
            this.closeDeleteModal();
        });

        document.getElementById('confirmDelete').addEventListener('click', () => {
            this.deleteTool();
        });

        // Close modals on overlay click
        document.getElementById('editModal').addEventListener('click', (e) => {
            if (e.target.id === 'editModal') {
                this.closeEditModal();
            }
        });

        document.getElementById('deleteModal').addEventListener('click', (e) => {
            if (e.target.id === 'deleteModal') {
                this.closeDeleteModal();
            }
        });
    }

    initTabs() {
        const tabButtons = document.querySelectorAll('.tab-btn');
        const tabPanels = document.querySelectorAll('.tab-panel');

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.dataset.tab;
                
                // Remove active class from all tabs and panels
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabPanels.forEach(panel => panel.classList.remove('active'));
                
                // Add active class to clicked tab and corresponding panel
                button.classList.add('active');
                document.getElementById(targetTab + 'Tab').classList.add('active');
                
                // Load data for specific tabs
                if (targetTab === 'manage') {
                    this.renderToolsTable();
                } else if (targetTab === 'stats') {
                    this.updateStats();
                } else if (targetTab === 'pages') {
                    // Custom pages tab is handled by custom-pages.js
                    if (window.customPagesManager) {
                        window.customPagesManager.renderPagesTable();
                    }
                }
                
                // Animate tab content
                this.animateTabContent(targetTab);
            });
        });
    }

    animateOnLoad() {
        anime({
            targets: '.animate-fade-in',
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 800,
            easing: 'easeOutQuart',
            delay: anime.stagger(100)
        });

        anime({
            targets: '.animate-slide-up',
            opacity: [0, 1],
            translateY: [30, 0],
            duration: 1000,
            easing: 'easeOutQuart',
            delay: 200
        });
    }

    animateTabContent(tabName) {
        const panel = document.getElementById(tabName + 'Tab');
        
        anime({
            targets: panel,
            opacity: [0, 1],
            translateY: [20, 0],
            duration: 500,
            easing: 'easeOutQuart'
        });
    }

    async loadTools() {
        try {
            this.showTableLoading();
            
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
                
                this.hideTableLoading();
                this.renderToolsTable();
                this.updateStats();
            });
            
        } catch (error) {
            console.error('Error loading tools:', error);
            this.showToast('Erro ao carregar ferramentas', 'error');
            this.hideTableLoading();
        }
    }

    async addTool() {
        const form = document.getElementById('addToolForm');
        const formData = new FormData(form);
        
        const toolData = {
            name: formData.get('name').trim(),
            url: formData.get('url').trim(),
            description: formData.get('description').trim(),
            category: formData.get('category'),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Validation
        if (!toolData.name || !toolData.url || !toolData.category) {
            this.showToast('Preencha todos os campos obrigatórios', 'error');
            return;
        }

        if (!this.isValidUrl(toolData.url)) {
            this.showToast('URL inválida', 'error');
            return;
        }

        try {
            this.setSaveButtonLoading(true);
            
            await window.Firebase.toolsRef.push(toolData);
            
            this.showToast('Ferramenta adicionada com sucesso!', 'success');
            form.reset();
            
            // Animate success
            this.animateFormSuccess();
            
        } catch (error) {
            console.error('Error adding tool:', error);
            this.showToast('Erro ao adicionar ferramenta', 'error');
        } finally {
            this.setSaveButtonLoading(false);
        }
    }

    async updateTool() {
        const form = document.getElementById('editToolForm');
        const formData = new FormData(form);
        const toolId = document.getElementById('editToolId').value;
        
        const toolData = {
            name: formData.get('name').trim(),
            url: formData.get('url').trim(),
            description: formData.get('description').trim(),
            category: formData.get('category'),
            updatedAt: new Date().toISOString()
        };

        // Validation
        if (!toolData.name || !toolData.url || !toolData.category) {
            this.showToast('Preencha todos os campos obrigatórios', 'error');
            return;
        }

        if (!this.isValidUrl(toolData.url)) {
            this.showToast('URL inválida', 'error');
            return;
        }

        try {
            this.setUpdateButtonLoading(true);
            
            await window.Firebase.toolsRef.child(toolId).update(toolData);
            
            this.showToast('Ferramenta atualizada com sucesso!', 'success');
            this.closeEditModal();
            
        } catch (error) {
            console.error('Error updating tool:', error);
            this.showToast('Erro ao atualizar ferramenta', 'error');
        } finally {
            this.setUpdateButtonLoading(false);
        }
    }

    async deleteTool() {
        if (!this.currentDeleteId) return;

        try {
            await window.Firebase.toolsRef.child(this.currentDeleteId).remove();
            
            this.showToast('Ferramenta excluída com sucesso!', 'success');
            this.closeDeleteModal();
            
        } catch (error) {
            console.error('Error deleting tool:', error);
            this.showToast('Erro ao excluir ferramenta', 'error');
        }
    }

    renderToolsTable() {
        const tbody = document.getElementById('toolsTableBody');
        
        if (this.tools.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-12 text-center">
                        <div class="flex flex-col items-center">
                            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <i data-lucide="package" class="w-8 h-8 text-gray-400"></i>
                            </div>
                            <h3 class="text-lg font-medium text-gray-900 mb-2">Nenhuma ferramenta cadastrada</h3>
                            <p class="text-gray-500">Comece adicionando sua primeira ferramenta</p>
                        </div>
                    </td>
                </tr>
            `;
            lucide.createIcons();
            return;
        }

        tbody.innerHTML = this.tools.map(tool => this.createTableRow(tool)).join('');
        lucide.createIcons();
        
        // Animate table rows
        anime({
            targets: 'tbody tr',
            opacity: [0, 1],
            translateX: [-20, 0],
            duration: 500,
            easing: 'easeOutQuart',
            delay: anime.stagger(50)
        });
    }

    createTableRow(tool) {
        const createdDate = new Date(tool.createdAt).toLocaleDateString('pt-BR');
        const categoryInfo = this.getCategoryInfo(tool.category);
        
        return `
            <tr class="table-row-hover">
                <td class="table-cell">
                    <div class="flex items-center">
                        <div class="w-10 h-10 ${categoryInfo.bgColor} rounded-lg flex items-center justify-center mr-3">
                            <span class="text-sm font-bold text-white">${tool.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                            <div class="text-sm font-medium text-gray-900">${this.escapeHtml(tool.name)}</div>
                            ${tool.description ? `<div class="text-sm text-gray-500 line-clamp-1">${this.escapeHtml(tool.description)}</div>` : ''}
                        </div>
                    </div>
                </td>
                <td class="table-cell">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${categoryInfo.className}">
                        ${categoryInfo.emoji} ${categoryInfo.name}
                    </span>
                </td>
                <td class="table-cell">
                    <a href="${tool.url}" target="_blank" rel="noopener noreferrer" 
                       class="text-indigo-600 hover:text-indigo-900 text-sm flex items-center space-x-1 max-w-xs">
                        <span class="truncate">${this.truncateUrl(tool.url)}</span>
                        <i data-lucide="external-link" class="w-3 h-3 flex-shrink-0"></i>
                    </a>
                </td>
                <td class="table-cell">
                    <span class="text-sm text-gray-500">${createdDate}</span>
                </td>
                <td class="table-cell text-right">
                    <div class="flex items-center justify-end space-x-2">
                        <button onclick="adminPanel.openEditModal('${tool.id}')" 
                                class="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50 transition-colors duration-200">
                            <i data-lucide="edit-2" class="w-4 h-4"></i>
                        </button>
                        <button onclick="adminPanel.openDeleteModal('${tool.id}', '${this.escapeHtml(tool.name)}')" 
                                class="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors duration-200">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    filterTools(searchTerm) {
        const rows = document.querySelectorAll('#toolsTableBody tr');
        
        rows.forEach(row => {
            if (row.id === 'tableLoading') return;
            
            const text = row.textContent.toLowerCase();
            const matches = text.includes(searchTerm.toLowerCase());
            row.style.display = matches ? '' : 'none';
        });
    }

    updateStats() {
        const totalTools = this.tools.length;
        const categories = [...new Set(this.tools.map(tool => tool.category))];
        const today = new Date().toDateString();
        const thisWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        
        const todayTools = this.tools.filter(tool => 
            new Date(tool.createdAt).toDateString() === today
        ).length;
        
        const weekTools = this.tools.filter(tool => 
            new Date(tool.createdAt) >= thisWeek
        ).length;

        // Update stat cards
        document.getElementById('statTotalTools').textContent = totalTools;
        document.getElementById('statTotalCategories').textContent = categories.length;
        document.getElementById('statTodayTools').textContent = todayTools;
        document.getElementById('statWeekTools').textContent = weekTools;

        // Update category distribution
        this.updateCategoryStats();
        
        // Animate stats
        this.animateStats();
    }

    updateCategoryStats() {
        const categoryStats = {};
        const totalTools = this.tools.length;
        
        this.tools.forEach(tool => {
            categoryStats[tool.category] = (categoryStats[tool.category] || 0) + 1;
        });

        const container = document.getElementById('categoryStats');
        
        if (totalTools === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-gray-500">Nenhuma ferramenta para exibir estatísticas</p>
                </div>
            `;
            return;
        }

        container.innerHTML = Object.entries(categoryStats)
            .sort(([,a], [,b]) => b - a)
            .map(([category, count]) => {
                const percentage = Math.round((count / totalTools) * 100);
                const categoryInfo = this.getCategoryInfo(category);
                
                return `
                    <div class="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                        <div class="flex items-center space-x-3">
                            <span class="text-lg">${categoryInfo.emoji}</span>
                            <span class="font-medium text-gray-900">${categoryInfo.name}</span>
                        </div>
                        <div class="flex items-center space-x-3">
                            <div class="w-24 bg-gray-200 rounded-full h-2">
                                <div class="progress-fill" style="width: ${percentage}%"></div>
                            </div>
                            <span class="text-sm font-medium text-gray-600 w-12 text-right">${count}</span>
                        </div>
                    </div>
                `;
            }).join('');
    }

    animateStats() {
        anime({
            targets: '.stats-card',
            scale: [0.9, 1],
            opacity: [0, 1],
            duration: 600,
            easing: 'easeOutQuart',
            delay: anime.stagger(100)
        });
    }

    animateFormSuccess() {
        const form = document.getElementById('addToolForm');
        
        anime({
            targets: form,
            scale: [1, 1.02, 1],
            duration: 400,
            easing: 'easeOutQuart'
        });
    }

    openEditModal(toolId) {
        const tool = this.tools.find(t => t.id === toolId);
        if (!tool) return;

        this.currentEditId = toolId;
        
        // Populate form
        document.getElementById('editToolId').value = toolId;
        document.getElementById('editToolName').value = tool.name;
        document.getElementById('editToolUrl').value = tool.url;
        document.getElementById('editToolDescription').value = tool.description || '';
        document.getElementById('editToolCategory').value = tool.category;

        // Show modal
        const modal = document.getElementById('editModal');
        modal.classList.remove('hidden');
        
        // Animate modal
        anime({
            targets: modal.querySelector('.bg-white'),
            scale: [0.9, 1],
            opacity: [0, 1],
            duration: 300,
            easing: 'easeOutQuart'
        });
    }

    closeEditModal() {
        const modal = document.getElementById('editModal');
        
        anime({
            targets: modal.querySelector('.bg-white'),
            scale: [1, 0.9],
            opacity: [1, 0],
            duration: 200,
            easing: 'easeInQuart',
            complete: () => {
                modal.classList.add('hidden');
                document.getElementById('editToolForm').reset();
                this.currentEditId = null;
            }
        });
    }

    openDeleteModal(toolId, toolName) {
        this.currentDeleteId = toolId;
        document.getElementById('deleteToolName').textContent = toolName;
        
        const modal = document.getElementById('deleteModal');
        modal.classList.remove('hidden');
        
        // Animate modal
        anime({
            targets: modal.querySelector('.bg-white'),
            scale: [0.9, 1],
            opacity: [0, 1],
            duration: 300,
            easing: 'easeOutQuart'
        });
    }

    closeDeleteModal() {
        const modal = document.getElementById('deleteModal');
        
        anime({
            targets: modal.querySelector('.bg-white'),
            scale: [1, 0.9],
            opacity: [1, 0],
            duration: 200,
            easing: 'easeInQuart',
            complete: () => {
                modal.classList.add('hidden');
                this.currentDeleteId = null;
            }
        });
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        const toastIcon = document.getElementById('toastIcon');
        const toastMessage = document.getElementById('toastMessage');
        
        // Set icon and colors based on type
        const config = {
            success: {
                icon: 'check-circle',
                bgColor: 'bg-green-100',
                iconColor: 'text-green-600'
            },
            error: {
                icon: 'x-circle',
                bgColor: 'bg-red-100',
                iconColor: 'text-red-600'
            },
            info: {
                icon: 'info',
                bgColor: 'bg-blue-100',
                iconColor: 'text-blue-600'
            }
        };
        
        const typeConfig = config[type] || config.info;
        
        toastIcon.className = `w-8 h-8 rounded-full flex items-center justify-center ${typeConfig.bgColor}`;
        toastIcon.innerHTML = `<i data-lucide="${typeConfig.icon}" class="w-4 h-4 ${typeConfig.iconColor}"></i>`;
        toastMessage.textContent = message;
        
        // Show toast
        toast.classList.remove('translate-x-full');
        toast.classList.add('translate-x-0');
        
        // Recreate icons
        lucide.createIcons();
        
        // Auto hide after 5 seconds
        setTimeout(() => {
            this.hideToast();
        }, 5000);
    }

    hideToast() {
        const toast = document.getElementById('toast');
        toast.classList.remove('translate-x-0');
        toast.classList.add('translate-x-full');
    }

    showTableLoading() {
        const loading = document.getElementById('tableLoading');
        if (loading) {
            loading.style.display = '';
        }
    }

    hideTableLoading() {
        const loading = document.getElementById('tableLoading');
        if (loading) {
            loading.style.display = 'none';
        }
    }

    setSaveButtonLoading(loading) {
        const btn = document.getElementById('saveBtn');
        if (loading) {
            btn.innerHTML = `
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Salvando...</span>
            `;
            btn.disabled = true;
        } else {
            btn.innerHTML = `
                <i data-lucide="save" class="w-4 h-4"></i>
                <span>Salvar Ferramenta</span>
            `;
            btn.disabled = false;
            lucide.createIcons();
        }
    }

    setUpdateButtonLoading(loading) {
        const btn = document.getElementById('updateBtn');
        if (loading) {
            btn.innerHTML = `
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Salvando...</span>
            `;
            btn.disabled = true;
        } else {
            btn.innerHTML = `
                <i data-lucide="save" class="w-4 h-4"></i>
                <span>Salvar Alterações</span>
            `;
            btn.disabled = false;
            lucide.createIcons();
        }
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

    truncateUrl(url, maxLength = 30) {
        return url.length > maxLength ? url.substring(0, maxLength) + '...' : url;
    }

    isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }
}

// Initialize admin panel
let adminPanel;

document.addEventListener('DOMContentLoaded', () => {
    adminPanel = new AdminPanel();
});

