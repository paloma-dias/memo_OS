# 🚀 INÍCIO RÁPIDO - 5 Minutos

## ⚡ Executar o Projeto

```bash
# 1. Instalar dependências
cd /app
npm install

# 2. Executar servidor
npm run dev

# 3. Acessar no navegador
http://localhost:8080
```

---

## 👤 Primeiro Acesso

1. **Criar conta Admin:**
   - Acesse `/auth`
   - Clique em "Cadastrar"
   - Preencha:
     - Nome: Seu Nome
     - Email: admin@teste.com
     - Senha: 123456
     - Tipo: **Administrador**
   - Clique em "Cadastrar"

2. **Fazer login:**
   - Email: admin@teste.com
   - Senha: 123456

---

## 🗄️ Configurar Banco de Dados (IMPORTANTE!)

**Antes de usar, aplicar migrations no Supabase:**

1. Acesse: https://supabase.com/dashboard/project/mcwgqlczhemysxeaoonu
2. Vá em **SQL Editor** (ícone < >)
3. Execute **na ordem** os arquivos de `/supabase/migrations/`:
   
   **a) Primeiro arquivo:**
   ```sql
   -- Copie e cole todo o conteúdo de:
   -- /app/supabase/migrations/20251102215947_29c261c3-92ba-4857-8642-18f17999e05e.sql
   ```
   Clique em **"Run"**
   
   **b) Segundo arquivo:**
   ```sql
   -- Copie e cole todo o conteúdo de:
   -- /app/supabase/migrations/20251102220022_cdca0e9b-fb09-40a0-bcec-6f8f3db7ebc2.sql
   ```
   Clique em **"Run"**
   
   **c) Terceiro arquivo (NOVO):**
   ```sql
   -- Copie e cole todo o conteúdo de:
   -- /app/supabase/migrations/20251102230000_add_mapa_id_sistemas.sql
   ```
   Clique em **"Run"**

4. ✅ Pronto! Tabelas criadas.

---

## 📋 Testar as 5 Funcionalidades Novas

### 1️⃣ Agenda e Reservas
```
Menu → Agenda → Nova Reserva
- Selecione OS, Técnico, Data/Hora
- Clique em "Criar Reserva"
✅ Aparecerá no calendário
```

### 2️⃣ Importar/Exportar
```
Menu → Importar/Exportar

IMPORTAR:
- Crie arquivo clientes.csv:
  id_dinamics,nome,email,telefone,endereco
  DYN-001,João Silva,joao@teste.com,11999999999,Rua A 123

- Arraste o arquivo para a área de upload
✅ Clientes importados

EXPORTAR:
- Aba "Exportar" → "Exportar OS para CSV"
✅ Arquivo baixado
```

### 3️⃣ Mapeamento De-Para
```
Menu → Mapeamento De-Para → Novo Mapeamento
- ID Dynamics: DYN-12345
- Entidade: Cliente
- Selecione cliente da lista
- Clique em "Criar Mapeamento"
✅ Vínculo criado
```

### 4️⃣ Aprovação de OS
```
1. Crie uma OS e avance até "Aguardando Aprovação"
2. Menu → Aprovação OS
3. Clique em "Aprovar"
4. Selecione condição de pagamento
5. Clique em "Aprovar e Avançar"
✅ OS avançou para "Aguardando Peças"
```

### 5️⃣ Gerenciar Usuários
```
Menu → Usuários → Novo Usuário
- Nome: João Operador
- Email: operador@teste.com
- Senha: 123456
- Tipo: Operador
- Clique em "Criar Usuário"
✅ Operador criado
```

---

## 🎯 Funcionalidades Principais

| Funcionalidade | Acesso | Localização Menu |
|----------------|--------|------------------|
| Dashboard | Todos | Dashboard |
| Kanban (Fluxo OS) | Todos | Kanban |
| Criar OS | Admin | Nova OS |
| Agendar Técnico | Admin | Agenda |
| Aprovar/Rejeitar | Admin | Aprovação OS |
| Gerenciar Clientes | Admin | Clientes |
| Gerenciar Produtos | Admin | Produtos |
| Gerenciar Técnicos | Admin | Técnicos |
| Gerenciar Usuários | Admin | Usuários |
| Mapeamento IDs | Admin | Mapeamento De-Para |
| Import/Export | Admin | Importar/Exportar |

---

## 🔑 Diferenças entre Admin e Operador

### 👨‍💼 Admin pode:
- ✅ Criar/editar/remover tudo
- ✅ Ver todas as OS
- ✅ Ver agenda de todos os técnicos
- ✅ Aprovar/Rejeitar OS
- ✅ Criar usuários
- ✅ Importar/Exportar dados
- ✅ Gerenciar mapeamentos

### 👷 Operador pode:
- ✅ Ver apenas suas OS designadas
- ✅ Ver apenas sua agenda
- ✅ Registrar diagnóstico/laudo
- ✅ Preencher cotação simples
- ✅ Avançar OS (seguindo fluxo sequencial)
- ❌ Não pode criar OS
- ❌ Não pode aprovar/rejeitar
- ❌ Não pode criar usuários

---

## 📊 Fluxo de Trabalho Típico

```
1. Admin cria cliente e produtos
2. Admin cria OS para o cliente
3. Admin agenda técnico na Agenda
4. Técnico (Operador) vê sua agenda
5. Técnico registra diagnóstico na OS
6. Técnico adiciona peças necessárias
7. Técnico avança OS para "Aguardando Aprovação"
8. Admin vê em "Aprovação OS"
9. Admin aprova e define condição de pagamento
10. OS avança para "Aguardando Peças"
11. Técnico recebe peças e avança para "Em Execução"
12. Técnico finaliza e avança para "Finalizada"
13. Admin exporta relatório CSV
```

---

## 🆘 Problemas Comuns

### ❌ "Failed to fetch" ao fazer login
**Solução:** Execute as migrations SQL no Supabase Dashboard

### ❌ "Permission denied"
**Solução:** Verifique se o usuário tem role em `user_roles`

### ❌ CSV não importa
**Solução:** 
- Primeira linha deve ser o cabeçalho
- Campos separados por vírgula
- Sem espaços extras

### ❌ Não consigo pular etapas no Kanban
**Solução:** É proposital! O sistema não permite pular etapas. Deve seguir ordem sequencial.

---

## 📁 Arquivos Importantes

```
/app/
├── README_EXECUCAO.md          ← Guia completo de execução
├── RESUMO_TECNICO.md           ← Detalhes técnicos para devs
├── INICIO_RAPIDO.md            ← Este arquivo
├── .env                        ← Credenciais Supabase
├── package.json                ← Dependências
└── supabase/migrations/        ← Scripts SQL do banco
```

---

## 🎉 Pronto para Usar!

Após executar os passos acima, você terá:

✅ Sistema rodando em http://localhost:8080  
✅ Banco de dados configurado  
✅ Conta Admin criada  
✅ Todas as 5 funcionalidades críticas operacionais  

**Tempo total:** ~5 minutos

---

**Dúvidas? Consulte:**
- 📖 README_EXECUCAO.md (guia completo)
- 🔧 RESUMO_TECNICO.md (detalhes técnicos)

**Bom uso! 🚀**
