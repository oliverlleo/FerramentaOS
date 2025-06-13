# Sistema de Páginas Personalizadas - Planejamento

## Estrutura do Banco de Dados (Firebase)

### Coleção: `customPages`
```javascript
{
  pageId: {
    id: "unique-page-id",
    name: "Nome da Página",
    description: "Descrição da página",
    selectedTools: ["tool-id-1", "tool-id-2", "tool-id-3"],
    isActive: true,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    accessCount: 0,
    lastAccessed: "2024-01-01T00:00:00.000Z"
  }
}
```

## Funcionalidades Principais

### 1. Painel de Administração (admin.html)
- Nova aba "Páginas Personalizadas"
- Listar todas as páginas criadas
- Criar nova página personalizada
- Editar página existente
- Gerar link de acesso
- Visualizar estatísticas de acesso
- Ativar/desativar páginas

### 2. Página de Acesso Personalizada (custom.html)
- Recebe parâmetro `?page=pageId` na URL
- Exibe apenas as ferramentas selecionadas
- Design minimalista sem navegação para index/admin
- Contador de acessos automático
- Página de erro para IDs inválidos

### 3. Geração de Links
- Links únicos no formato: `custom.html?page=unique-id`
- QR Code para compartilhamento
- Cópia rápida do link

## Arquivos a Criar/Modificar

1. **admin.html** - Adicionar nova aba
2. **admin.js** - Funcionalidades de gerenciamento
3. **custom.html** - Nova página de acesso
4. **custom.js** - Lógica da página personalizada
5. **firebase.js** - Adicionar referência para customPages

## Fluxo de Uso

1. Admin acessa painel → aba "Páginas Personalizadas"
2. Clica em "Criar Nova Página"
3. Define nome, descrição e seleciona ferramentas
4. Sistema gera ID único e salva no Firebase
5. Admin recebe link para compartilhar
6. Usuário final acessa o link e vê apenas as ferramentas selecionadas

