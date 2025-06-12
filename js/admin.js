// admin.js
import { 
    db, 
    auth, 
    collection, 
    addDoc, 
    getDocs, 
    doc, 
    updateDoc, 
    deleteDoc, 
    query, 
    orderBy,
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from './firebase-config.js';

// Elementos DOM
const loginSection = document.getElementById('loginSection');
const adminPanel = document.getElementById('adminPanel');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const logoutBtn = document.getElementById('logoutBtn');
const userEmail = document.getElementById('userEmail');
const toolForm = document.getElementById('toolForm');
const adminToolsList = document.getElementById('adminToolsList');
const toolIcon = document.getElementById('toolIcon');
const iconPreview = document.getElementById('iconPreview');
const formTitle = document.getElementById('formTitle');
const submitText = document.getElementById('submitText');
const cancelEdit = document.getElementById('cancelEdit');
const editingId = document.getElementById('editingId');

// Estado da aplicação
let isEditing = false;

// Verificar estado de autenticação
onAuthStateChanged(auth, (user) => {
    if (user) {
        showAdminPanel(user);
    } else {
        showLoginSection();
    }
});

// Mostrar seção de login
function showLoginSection() {
    loginSection.style.display = 'block';
    adminPanel.style.display = 'none';
}

// Mostrar painel administrativo
function showAdminPanel(user) {
    loginSection.style.display = 'none';
    adminPanel.style.display = 'block';
    userEmail.textContent = user.email;
    loadTools();
}

// Login
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        await signInWithEmailAndPassword(auth, email, password);
        loginError.style.display = 'none';
    } catch (error) {
        loginError.textContent = 'Email ou senha incorretos';
        loginError.style.display = 'block';
    }
});

// Logout
logoutBtn.addEventListener('click', async () => {
    try {
        await signOut(auth);
    } catch (error) {
        console.error('Erro ao fazer logout:', error);
    }
});

// Preview do ícone
toolIcon.addEventListener('input', (e) => {
    const iconClass = e.target.value.trim();
    if (iconClass) {
        iconPreview.className = iconClass;
    } else {
        iconPreview.className = 'fas fa-question';
    }
});

// Formulário de ferramenta
toolForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const toolData = {
        name: document.getElementById('toolName').value.trim(),
        url: document.getElementById('toolUrl').value.trim(),
        category: document.getElementById('toolCategory').value,
        description: document.getElementById('toolDescription').value.trim(),
        icon: document.getElementById('toolIcon').value.trim(),
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

