// Custom Pages Management for Admin Panel
class CustomPagesManager {
    constructor() {
        this.customPages = [];
        this.tools = [];
        this.currentEditPageId = null;
        this.currentDeletePageId = null;
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadCustomPages();
        this.loadToolsForSelection();
    }

    bindEvents() {
        // Create page modal events
        document.getElementById('createPageBtn').addEventListener('click', () => {
            this.openCreatePageModal();
        });

        document.getElementById('closeCreatePageModal').addEventListener('click', () => {
            this.closeCreatePageModal();
        });

        document.getElementById('cancelCreatePage').addEventListener('click', () => {
            this.closeCreatePageModal();
        });

        document.getElementById('createPageForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.createCustomPage();
        });

        // Edit page modal events
        document.getElementById('closeEditPageModal').addEventListener('click', () => {
            this.closeEditPageModal();
        });

        document.getElementById('cancelEditPage').addEventListener('click', () => {
            this.closeEditPageModal();
        });

        document.getElementById('editPageForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateCustomPage();
        });

        // Share page modal events
        document.getElementById('closeSharePageModal').addEventListener('click', () => {
            this.closeSharePageModal();
        });

        document.getElementById('copyPageUrl').addEventListener('click', () => {
            this.copyPageUrl();
        });

        document.getElementById('openPageUrl').addEventListener('click', () => {
            this.openPageUrl();
        });

        // Delete page modal events
        document.getElementById('closeDeletePageModal').addEventListener('click', () => {
            this.closeDeletePageModal();
        });

        document.getElementById('cancelDeletePage').addEventListener('click', () => {
            this.closeDeletePageModal();
        });

        document.getElementById('confirmDeletePage').addEventListener('click', () => {
            this.deleteCustomPage();
        });

        // Search pages
        document.getElementById('searchPages').addEventListener('input', (e) => {
            this.filterPages(e.target.value);
        });

        // Close modals on overlay click
        document.getElementById('createPageModal').addEventListener('click', (e) => {
            if (e.target.id === 'createPageModal') {
                this.closeCreatePageModal();
            }
        });

        document.getElementById('editPageModal').addEventListener('click', (e) => {
            if (e.target.id === 'editPageModal') {
                this.closeEditPageModal();
            }
        });

        document.getElementById('sharePageModal').addEventListener('click', (e) => {
            if (e.target.id === 'sharePageModal') {
                this.closeSharePageModal();
            }
        });

        document.getElementById('deletePageModal').addEventListener('click', (e) => {
            if (e.target.id === 'deletePageModal') {
                this.closeDeletePageModal();
            }
        });
    }

    async loadCustomPages() {
        try {
            this.showPagesLoading();
            
            window.Firebase.customPagesRef.on('value', (snapshot) => {
                const data = snapshot.val();
                this.customPages = [];
                
                if (data) {
                    Object.keys(data).forEach(key => {
                        this.customPages.push({
                            id: key,
                            ...data[key]
                        });
                    });
                }
                
                // Sort by creation date (newest first)
                this.customPages.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
                
                this.hidePagesLoading();
                this.renderPagesTable();
            });
            
        } catch (error) {
            console.error('Error loading custom pages:', error);
            this.showToast('Erro ao carregar páginas personalizadas', 'error');
            this.hidePagesLoading();
        }
    }

    async loadToolsForSelection() {
        try {
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
                
                // Sort by name
                this.tools.sort((a, b) => a.name.localeCompare(b.name));
            });
            
        } catch (error) {
            console.error('Error loading tools:', error);
        }
    }

    renderPagesTable() {
        const tbody = document.getElementById('pagesTableBody');
        if (!tbody) {
            console.warn('pagesTableBody element not found');
            return;
        }
        
        if (this.customPages.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="6" class="px-6 py-12 text-center">
                        <div class="flex flex-col items-center">
                            <div class="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                <i data-lucide="link" class="w-8 h-8 text-gray-400"></i>
                            </div>
                            <h3 class="text-lg font-medium text-gray-900 mb-2">Nenhuma página personalizada</h3>
                            <p class="text-gray-500 mb-4">Comece criando sua primeira página personalizada</p>
                            <button onclick="customPagesManager.openCreatePageModal()" class="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2">
                                <i data-lucide="plus" class="w-4 h-4"></i>
                                <span>Criar Página</span>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            lucide.createIcons();
            return;
        }

        tbody.innerHTML = this.customPages.map(page => this.createPageTableRow(page)).join('');
        lucide.createIcons();
        
        // Animate table rows
        if (typeof anime !== 'undefined') {
            anime({
                targets: '#pagesTableBody tr',
                opacity: [0, 1],
                translateX: [-20, 0],
                duration: 500,
                easing: 'easeOutQuart',
                delay: anime.stagger(50)
            });
        }
    }

    createPageTableRow(page) {
        const createdDate = new Date(page.createdAt).toLocaleDateString('pt-BR');
        const toolsCount = page.selectedTools ? page.selectedTools.length : 0;
        const accessCount = page.accessCount || 0;
        const isActive = page.isActive !== false;
        
        return `
            <tr class="table-row-hover">
                <td class="table-cell">
                    <div class="flex items-center">
                        <div class="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center mr-3">
                            <i data-lucide="link" class="w-5 h-5 text-primary-600"></i>
                        </div>
                        <div>
                            <div class="text-sm font-medium text-gray-900">${this.escapeHtml(page.name)}</div>
                            ${page.description ? `<div class="text-sm text-gray-500 line-clamp-1">${this.escapeHtml(page.description)}</div>` : ''}
                        </div>
                    </div>
                </td>
                <td class="table-cell">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        ${toolsCount} ferramenta${toolsCount !== 1 ? 's' : ''}
                    </span>
                </td>
                <td class="table-cell">
                    <span class="text-sm text-gray-900 font-medium">${accessCount}</span>
                </td>
                <td class="table-cell">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${isActive ? 'Ativa' : 'Inativa'}
                    </span>
                </td>
                <td class="table-cell">
                    <span class="text-sm text-gray-500">${createdDate}</span>
                </td>
                <td class="table-cell text-right">
                    <div class="flex items-center justify-end space-x-2">
                        <button onclick="customPagesManager.openSharePageModal('${page.id}')" 
                                class="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors duration-200"
                                title="Compartilhar">
                            <i data-lucide="share-2" class="w-4 h-4"></i>
                        </button>
                        <button onclick="customPagesManager.openEditPageModal('${page.id}')" 
                                class="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50 transition-colors duration-200"
                                title="Editar">
                            <i data-lucide="edit-2" class="w-4 h-4"></i>
                        </button>
                        <button onclick="customPagesManager.togglePageStatus('${page.id}')" 
                                class="text-${isActive ? 'orange' : 'green'}-600 hover:text-${isActive ? 'orange' : 'green'}-900 p-1 rounded hover:bg-${isActive ? 'orange' : 'green'}-50 transition-colors duration-200"
                                title="${isActive ? 'Desativar' : 'Ativar'}">
                            <i data-lucide="${isActive ? 'pause' : 'play'}" class="w-4 h-4"></i>
                        </button>
                        <button onclick="customPagesManager.openDeletePageModal('${page.id}', '${this.escapeHtml(page.name)}')" 
                                class="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors duration-200"
                                title="Excluir">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }

    filterPages(searchTerm) {
        const rows = document.querySelectorAll('#pagesTableBody tr');
        
        rows.forEach(row => {
            if (row.id === 'pagesLoading') return;
            
            const text = row.textContent.toLowerCase();
            const matches = text.includes(searchTerm.toLowerCase());
            row.style.display = matches ? '' : 'none';
        });
    }

    openCreatePageModal() {
        document.getElementById('createPageModal').classList.remove('hidden');
        this.renderToolsSelection('toolsSelection');
        
        // Animate modal
        anime({
            targets: '#createPageModal .bg-white',
            scale: [0.9, 1],
            opacity: [0, 1],
            duration: 300,
            easing: 'easeOutQuart'
        });
    }

    closeCreatePageModal() {
        document.getElementById('createPageModal').classList.add('hidden');
        document.getElementById('createPageForm').reset();
    }

    openEditPageModal(pageId) {
        const page = this.customPages.find(p => p.id === pageId);
        if (!page) return;

        this.currentEditPageId = pageId;
        
        // Fill form with page data
        document.getElementById('editPageId').value = pageId;
        document.getElementById('editPageName').value = page.name;
        document.getElementById('editPageDescription').value = page.description || '';
        
        // Render tools selection with current selections
        this.renderToolsSelection('editToolsSelection', page.selectedTools || []);
        
        document.getElementById('editPageModal').classList.remove('hidden');
        
        // Animate modal
        anime({
            targets: '#editPageModal .bg-white',
            scale: [0.9, 1],
            opacity: [0, 1],
            duration: 300,
            easing: 'easeOutQuart'
        });
    }

    closeEditPageModal() {
        document.getElementById('editPageModal').classList.add('hidden');
        document.getElementById('editPageForm').reset();
        this.currentEditPageId = null;
    }

    openSharePageModal(pageId) {
        const page = this.customPages.find(p => p.id === pageId);
        if (!page) return;

        const baseUrl = window.location.origin + window.location.pathname.replace('admin.html', '');
        const pageUrl = `${baseUrl}custom.html?page=${pageId}`;
        
        document.getElementById('sharePageName').textContent = page.name;
        document.getElementById('sharePageDescription').textContent = page.description || 'Página personalizada';
        document.getElementById('sharePageUrl').value = pageUrl;
        
        document.getElementById('sharePageModal').classList.remove('hidden');
        
        // Animate modal
        anime({
            targets: '#sharePageModal .bg-white',
            scale: [0.9, 1],
            opacity: [0, 1],
            duration: 300,
            easing: 'easeOutQuart'
        });
    }

    closeSharePageModal() {
        document.getElementById('sharePageModal').classList.add('hidden');
    }

    openDeletePageModal(pageId, pageName) {
        this.currentDeletePageId = pageId;
        document.getElementById('deletePageName').textContent = pageName;
        document.getElementById('deletePageModal').classList.remove('hidden');
        
        // Animate modal
        anime({
            targets: '#deletePageModal .bg-white',
            scale: [0.9, 1],
            opacity: [0, 1],
            duration: 300,
            easing: 'easeOutQuart'
        });
    }

    closeDeletePageModal() {
        document.getElementById('deletePageModal').classList.add('hidden');
        this.currentDeletePageId = null;
    }

    renderToolsSelection(containerId, selectedTools = []) {
        const container = document.getElementById(containerId);
        
        if (this.tools.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8">
                    <p class="text-gray-500">Nenhuma ferramenta disponível</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.tools.map(tool => {
            const categoryInfo = this.getCategoryInfo(tool.category);
            const isSelected = selectedTools.includes(tool.id);
            
            return `
                <label class="flex items-center p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors duration-200">
                    <input 
                        type="checkbox" 
                        name="selectedTools" 
                        value="${tool.id}"
                        ${isSelected ? 'checked' : ''}
                        class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    >
                    <div class="flex items-center ml-3 flex-1">
                        <div class="w-8 h-8 ${categoryInfo.bgColor} rounded-lg flex items-center justify-center mr-3">
                            <span class="text-xs font-bold text-white">${tool.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <div class="flex-1">
                            <div class="text-sm font-medium text-gray-900">${this.escapeHtml(tool.name)}</div>
                            <div class="text-xs text-gray-500">${categoryInfo.name}</div>
                        </div>
                    </div>
                </label>
            `;
        }).join('');
    }

    async createCustomPage() {
        const form = document.getElementById('createPageForm');
        const formData = new FormData(form);
        
        const selectedTools = Array.from(form.querySelectorAll('input[name="selectedTools"]:checked'))
            .map(input => input.value);
        
        if (selectedTools.length === 0) {
            this.showToast('Selecione pelo menos uma ferramenta', 'error');
            return;
        }

        const pageData = {
            name: formData.get('name').trim(),
            description: formData.get('description').trim(),
            selectedTools: selectedTools,
            isActive: true,
            accessCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        // Validation
        if (!pageData.name) {
            this.showToast('Nome da página é obrigatório', 'error');
            return;
        }

        try {
            this.setSavePageButtonLoading(true);
            
            await window.Firebase.customPagesRef.push(pageData);
            
            this.showToast('Página criada com sucesso!', 'success');
            this.closeCreatePageModal();
            
        } catch (error) {
            console.error('Error creating custom page:', error);
            this.showToast('Erro ao criar página', 'error');
        } finally {
            this.setSavePageButtonLoading(false);
        }
    }

    async updateCustomPage() {
        const form = document.getElementById('editPageForm');
        const formData = new FormData(form);
        const pageId = document.getElementById('editPageId').value;
        
        const selectedTools = Array.from(form.querySelectorAll('input[name="selectedTools"]:checked'))
            .map(input => input.value);
        
        if (selectedTools.length === 0) {
            this.showToast('Selecione pelo menos uma ferramenta', 'error');
            return;
        }

        const pageData = {
            name: formData.get('name').trim(),
            description: formData.get('description').trim(),
            selectedTools: selectedTools,
            updatedAt: new Date().toISOString()
        };

        // Validation
        if (!pageData.name) {
            this.showToast('Nome da página é obrigatório', 'error');
            return;
        }

        try {
            this.setUpdatePageButtonLoading(true);
            
            await window.Firebase.customPagesRef.child(pageId).update(pageData);
            
            this.showToast('Página atualizada com sucesso!', 'success');
            this.closeEditPageModal();
            
        } catch (error) {
            console.error('Error updating custom page:', error);
            this.showToast('Erro ao atualizar página', 'error');
        } finally {
            this.setUpdatePageButtonLoading(false);
        }
    }

    async deleteCustomPage() {
        if (!this.currentDeletePageId) return;

        try {
            await window.Firebase.customPagesRef.child(this.currentDeletePageId).remove();
            
            this.showToast('Página excluída com sucesso!', 'success');
            this.closeDeletePageModal();
            
        } catch (error) {
            console.error('Error deleting custom page:', error);
            this.showToast('Erro ao excluir página', 'error');
        }
    }

    async togglePageStatus(pageId) {
        const page = this.customPages.find(p => p.id === pageId);
        if (!page) return;

        try {
            const newStatus = !page.isActive;
            await window.Firebase.customPagesRef.child(pageId).update({
                isActive: newStatus,
                updatedAt: new Date().toISOString()
            });
            
            this.showToast(`Página ${newStatus ? 'ativada' : 'desativada'} com sucesso!`, 'success');
            
        } catch (error) {
            console.error('Error toggling page status:', error);
            this.showToast('Erro ao alterar status da página', 'error');
        }
    }

    copyPageUrl() {
        const urlInput = document.getElementById('sharePageUrl');
        urlInput.select();
        urlInput.setSelectionRange(0, 99999); // For mobile devices
        
        try {
            document.execCommand('copy');
            this.showToast('Link copiado para a área de transferência!', 'success');
        } catch (err) {
            console.error('Error copying URL:', err);
            this.showToast('Erro ao copiar link', 'error');
        }
    }

    openPageUrl() {
        const url = document.getElementById('sharePageUrl').value;
        window.open(url, '_blank');
    }

    showPagesLoading() {
        const loadingElement = document.getElementById('pagesLoading');
        if (loadingElement) {
            loadingElement.style.display = '';
        }
    }

    hidePagesLoading() {
        const loadingElement = document.getElementById('pagesLoading');
        if (loadingElement) {
            loadingElement.style.display = 'none';
        }
    }

    setSavePageButtonLoading(loading) {
        const btn = document.getElementById('savePageBtn');
        if (!btn) return;
        
        const icon = btn.querySelector('i');
        const text = btn.querySelector('span');
        
        if (loading) {
            btn.disabled = true;
            if (icon) {
                icon.setAttribute('data-lucide', 'loader-2');
                icon.classList.add('animate-spin');
            }
            if (text) {
                text.textContent = 'Criando...';
            }
        } else {
            btn.disabled = false;
            if (icon) {
                icon.setAttribute('data-lucide', 'save');
                icon.classList.remove('animate-spin');
            }
            if (text) {
                text.textContent = 'Criar Página';
            }
        }
        
        lucide.createIcons();
    }

    setUpdatePageButtonLoading(loading) {
        const btn = document.getElementById('updatePageBtn');
        if (!btn) return;
        
        const icon = btn.querySelector('i');
        const text = btn.querySelector('span');
        
        if (loading) {
            btn.disabled = true;
            if (icon) {
                icon.setAttribute('data-lucide', 'loader-2');
                icon.classList.add('animate-spin');
            }
            if (text) {
                text.textContent = 'Atualizando...';
            }
        } else {
            btn.disabled = false;
            if (icon) {
                icon.setAttribute('data-lucide', 'save');
                icon.classList.remove('animate-spin');
            }
            if (text) {
                text.textContent = 'Atualizar Página';
            }
        }
        
        lucide.createIcons();
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

    showToast(message, type = 'info') {
        // Use the existing toast system from admin.js
        if (window.adminPanel && window.adminPanel.showToast) {
            window.adminPanel.showToast(message, type);
        } else {
            // Fallback toast implementation
            console.log(`Toast [${type}]: ${message}`);
            alert(message);
        }
    }
}

// Initialize custom pages manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.customPagesManager = new CustomPagesManager();
});

