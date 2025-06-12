// admin.js
import {
    db,
    collection,
    addDoc,
    getDocs,
    doc,
    updateDoc,
    deleteDoc,
    query,
    orderBy
} from './firebase-config.js';

// Elementos DOM
const adminPanel = document.getElementById('adminPanel');
// Login elements removed
const toolForm = document.getElementById('toolForm');
const adminToolsList = document.getElementById('adminToolsList');
const toolIcon = document.getElementById('toolIcon');
const chooseIconBtn = document.getElementById('chooseIconBtn');
const iconPicker = document.getElementById('iconPicker');
const iconPreview = document.getElementById('iconPreview');
const formTitle = document.getElementById('formTitle');
const submitText = document.getElementById('submitText');
const cancelEdit = document.getElementById('cancelEdit');
const editingId = document.getElementById('editingId');

// Ícones disponíveis para seleção
const availableIcons = [
    'fas fa-code',
    'fas fa-palette',
    'fas fa-chart-bar',
    'fas fa-tools',
    'fas fa-bolt',
    'fas fa-bug',
    'fas fa-brain',
    'fas fa-rocket',
    'fas fa-database',
    'fas fa-project-diagram',
    'fas fa-mobile-alt',
    'fas fa-puzzle-piece',
    'fas fa-cloud'
];

// Estado da aplicação
let isEditing = false;

// Mostrar painel administrativo diretamente
function showAdminPanel() {
    adminPanel.style.display = 'block';
    loadTools();
}

// Exibir painel logo ao carregar a página
showAdminPanel();


});

// Formulário de ferramenta
toolForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const toolData = {
        name: document.getElementById('toolName').value.trim(),
        url: document.getElementById('toolUrl').value.trim(),
        category: document.getElementById('toolCategory').value,
        description: document.getElementById('toolDescription').value.trim(),
        icon: toolIcon.value.trim(),
        createdAt: new Date().toISOString()
    };
    
    try {
        if (isEditing) {
            // Atualizar ferramenta existente
            const toolRef = doc(db, 'tools', editingId.value);
            await updateDoc(toolRef, {
                ...toolData,
                updatedAt: new Date().toISOString()
            });
            showMessage('Ferramenta atualizada com sucesso!', 'success');
            resetForm();
        } else {
            // Adicionar nova ferramenta
            await addDoc(collection(db, 'tools'), toolData);
            showMessage('Ferramenta adicionada com sucesso!', 'success');
        }
        
        toolForm.reset();
        iconPreview.className = 'fas fa-question';

        loadTools();
        
    } catch (error) {
        console.error('Erro ao salvar ferramenta:', error);
        showMessage('Erro ao salvar ferramenta. Tente novamente.', 'error');
    }
});

// Cancelar edição
cancelEdit.addEventListener('click', () => {
    resetForm();
});

// Resetar formulário
function resetForm() {
    isEditing = false;
    editingId.value = '';
    formTitle.textContent = 'Adicionar Nova Ferramenta';
    submitText.textContent = 'Salvar Ferramenta';
    cancelEdit.style.display = 'none';
    toolForm.reset();
    iconPreview.className = 'fas fa-question';

}

// Carregar ferramentas
async function loadTools() {
    try {
        const q = query(collection(db, 'tools'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        adminToolsList.innerHTML = '';
        
        if (querySnapshot.empty) {
            adminToolsList.innerHTML = `
                <div class="no-tools-admin">
                    <i class="fas fa-tools"></i>
                    <p>Nenhuma ferramenta cadastrada ainda.</p>
                </div>
            `;
            return;
        }
        
        querySnapshot.forEach((doc) => {
            const tool = doc.data();
            const toolElement = createToolAdminElement(doc.id, tool);
            adminToolsList.appendChild(toolElement);
        });
        
    } catch (error) {
        console.error('Erro ao carregar ferramentas:', error);
        showMessage('Erro ao carregar ferramentas.', 'error');
    }
}

// Criar elemento de ferramenta para admin
function createToolAdminElement(id, tool) {
    const div = document.createElement('div');
    div.className = 'admin-tool-item';
    
    div.innerHTML = `
        <div class="tool-info">
            <div class="tool-header">
                <i class="${tool.icon}"></i>
                <h3>${tool.name}</h3>
                <span class="tool-category">${getCategoryName(tool.category)}</span>
            </div>
            <p class="tool-description">${tool.description}</p>
            <a href="${tool.url}" target="_blank" class="tool-url">
                <i class="fas fa-external-link-alt"></i> ${tool.url}
            </a>
        </div>
        <div class="tool-actions">
            <button class="btn btn-edit" onclick="editTool('${id}', ${JSON.stringify(tool).replace(/"/g, '&quot;')})">
                <i class="fas fa-edit"></i> Editar
            </button>
            <button class="btn btn-delete" onclick="deleteTool('${id}', '${tool.name}')">
                <i class="fas fa-trash"></i> Excluir
            </button>
        </div>
    `;
    
    return div;
}

// Editar ferramenta
window.editTool = function(id, tool) {
    isEditing = true;
    editingId.value = id;
    
    document.getElementById('toolName').value = tool.name;
    document.getElementById('toolUrl').value = tool.url;
    document.getElementById('toolCategory').value = tool.category;
    document.getElementById('toolDescription').value = tool.description;
    document.getElementById('toolIcon').value = tool.icon;

    iconPreview.className = tool.icon;

    formTitle.textContent = 'Editar Ferramenta';
    submitText.textContent = 'Atualizar Ferramenta';
    cancelEdit.style.display = 'inline-block';
    
    // Scroll para o formulário
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
};

// Excluir ferramenta
window.deleteTool = async function(id, name) {
    if (confirm(`Tem certeza que deseja excluir a ferramenta "${name}"?`)) {
        try {
            await deleteDoc(doc(db, 'tools', id));
            showMessage('Ferramenta excluída com sucesso!', 'success');
            loadTools();
        } catch (error) {
            console.error('Erro ao excluir ferramenta:', error);
            showMessage('Erro ao excluir ferramenta.', 'error');
        }
    }
};

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

// Mostrar mensagem
function showMessage(text, type = 'info') {
    // Remove mensagem anterior se existir
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }
    
    const message = document.createElement('div');
    message.className = `message ${type}`;
    message.innerHTML = `
        <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
        ${text}
    `;
    
    // Inserir após o header
    const header = document.querySelector('.header');
    header.insertAdjacentElement('afterend', message);
    
    // Remove a mensagem após 5 segundos
    setTimeout(() => {
        if (message.parentNode) {
            message.remove();
        }
    }, 5000);
}

console.log('Admin panel carregado!');

