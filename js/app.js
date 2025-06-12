// app.js
import { 
    db, 
    collection, 
    getDocs, 
    query, 
    orderBy 
} from './firebase-config.js';

// Elementos DOM
const toolsGrid = document.getElementById('toolsGrid');
const searchInput = document.getElementById('searchInput');
const filterButtons = document.querySelectorAll('.filter-btn');
const loading = document.getElementById('loading');
const noTools = document.getElementById('noTools');

// Estado da aplicação
let allTools = [];
let filteredTools = [];
let currentCategory = 'all';

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', () => {
    loadTools();
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    // Busca
    searchInput.addEventListener('input', handleSearch);
    
    // Filtros de categoria
    filterButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const category = e.currentTarget.dataset.category;
            setActiveFilter(category);
            filterTools(category);
        });
    });
}

// Carregar ferramentas do Firebase
async function loadTools() {
    try {
        showLoading(true);
        
        const q = query(collection(db, 'tools'), orderBy('name', 'asc'));
        const querySnapshot = await getDocs(q);
        
        allTools = [];
        querySnapshot.forEach((doc) => {
            allTools.push({
                id: doc.id,
                ...doc.data()
            });
        });
        
        filteredTools = [...allTools];
        renderTools();
        
    } catch (error) {
        console.error('Erro ao carregar ferramentas:', error);
        showError('Erro ao carregar ferramentas. Tente recarregar a página.');
    } finally {
        showLoading(false);
    }
}

// Mostrar/ocultar loading
function showLoading(show) {
    loading.style.display = show ? 'flex' : 'none';
    toolsGrid.style.display = show ? 'none' : 'grid';
}

// Mostrar erro
function showError(message) {
    toolsGrid.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Ops! Algo deu errado</h3>
            <p>${message}</p>
            <button onclick="location.reload()" class="btn btn-primary">
                <i class="fas fa-refresh"></i> Tentar Novamente
            </button>
        </div>
    `;
}

// Renderizar ferramentas
function renderTools() {
    if (filteredTools.length === 0) {
        toolsGrid.style.display = 'none';
        noTools.style.display = 'flex';
        return;
    }
    
    noTools.style.display = 'none';
    toolsGrid.style.display = 'grid';
    toolsGrid.innerHTML = '';
    
    filteredTools.forEach((tool, index) => {
        const toolElement = createToolElement(tool, index);
        toolsGrid.appendChild(toolElement);
    });
}

// Criar elemento de ferramenta
function createToolElement(tool, index) {
    const div = document.createElement('div');
    div.className = 'tool-card';
    div.style.animationDelay = `${index * 0.1}s`;
    
    div.innerHTML = `
        <div class="tool-icon">
            <i class="${tool.icon}"></i>
        </div>
        <div class="tool-content">
            <h3 class="tool-name">${tool.name}</h3>
            <p class="tool-description">${tool.description}</p>
            <span class="tool-category">${getCategoryName(tool.category)}</span>
        </div>
        <div class="tool-actions">
            <a href="${tool.url}" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
                <i class="fas fa-external-link-alt"></i> Acessar
            </a>
        </div>
    `;
    
    // Adicionar evento de clique no card
    div.addEventListener('click', (e) => {
        if (!e.target.closest('.tool-actions')) {
            window.open(tool.url, '_blank', 'noopener,noreferrer');
        }
    });
    
    return div;
}

// Buscar ferramentas
function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (searchTerm === '') {
        filteredTools = currentCategory === 'all' 
            ? [...allTools] 
            : allTools.filter(tool => tool.category === currentCategory);
    } else {
        const baseTools = currentCategory === 'all' 
            ? allTools 
            : allTools.filter(tool => tool.category === currentCategory);
            
        filteredTools = baseTools.filter(tool => 
            tool.name.toLowerCase().includes(searchTerm) ||
            tool.description.toLowerCase().includes(searchTerm)
        );
    }
    
    renderTools();
}

// Filtrar por categoria
function filterTools(category) {
    currentCategory = category;
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    if (category === 'all') {
        filteredTools = searchTerm === '' 
            ? [...allTools]
            : allTools.filter(tool => 
                tool.name.toLowerCase().includes(searchTerm) ||
                tool.description.toLowerCase().includes(searchTerm)
            );
    } else {
        const categoryTools = allTools.filter(tool => tool.category === category);
        filteredTools = searchTerm === ''
            ? categoryTools
            : categoryTools.filter(tool => 
                tool.name.toLowerCase().includes(searchTerm) ||
                tool.description.toLowerCase().includes(searchTerm)
            );
    }
    
    renderTools();
}

// Definir filtro ativo
function setActiveFilter(category) {
    filterButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === category) {
            btn.classList.add('active');
        }
    });
}

// Obter nome da categoria
function getCategoryName(category) {
    const categories = {
        'desenvolvimento': 'Desenvolvimento',
        'design': 'Design',
        'produtividade': 'Produtividade',
        'analise': 'Análise'
    };
    return categories[category] || category;
}

// Função para recarregar ferramentas (pode ser chamada externamente)
window.reloadTools = loadTools;

console.log('App carregado!');

