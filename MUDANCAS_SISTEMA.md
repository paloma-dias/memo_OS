# 🔄 MUDANÇA COMPLETA NA LÓGICA DO SISTEMA

## ❗ ATENÇÃO: NOVA ARQUITETURA IMPLEMENTADA

O sistema foi **completamente reestruturado** para seguir uma lógica de negócio diferente.

---

## 📋 FLUXO ANTIGO vs NOVO

### ❌ FLUXO ANTIGO (DESCONTINUADO):
```
Cliente → Criar OS Diretamente → Agendar Técnico → Kanban
```

### ✅ FLUXO NOVO (IMPLEMENTADO):
```
Cliente → Registrar OCORRÊNCIA → Admin Converte em OS → Agendar Técnico → Kanban
```

---

## 🆕 NOVA ENTIDADE: OCORRÊNCIAS

### O que é uma Ocorrência?

Uma **ocorrência** é o primeiro registro quando um cliente reporta um problema. É a etapa inicial antes de criar uma Ordem de Serviço.

### Campos da Ocorrência:

```typescript
{
  numero: "OC-2025-0001",              // Gerado automaticamente
  id_cliente: UUID,                     // Cliente vinculado
  titulo: "Máquina com defeito",        // Título do problema
  descricao: "Motor não liga...",       // Descrição detalhada
  prioridade: "baixa|media|alta",       // Prioridade
  origem: "oficina|campo",              // Onde será atendido
  situacao_garantia: "garantia|fora",   // Status de garantia
  contato_cliente: "João Silva",        // Nome do contato
  telefone_contato: "(11) 99999-9999",  // Telefone
  endereco_atendimento: "Rua X, 123",   // Onde atender
  observacoes: "...",                   // Obs adicionais
  status_ocorrencia: "aberta|em_analise|convertida_em_os|cancelada",
  convertida_em_os: false,              // Flag
  id_os_gerada: UUID                    // OS criada (se convertida)
}
```

---

## 🔄 NOVO FLUXO COMPLETO PASSO A PASSO

### 1️⃣ CLIENTE RELATA PROBLEMA
**Quem:** Qualquer usuário (Admin ou Operador)  
**Onde:** Menu → **Ocorrências** → Nova Ocorrência  
**O que acontece:**
- Seleciona cliente
- Preenche título e descrição do problema
- Define prioridade, origem, garantia
- Informa dados de contato
- Sistema gera número automático (ex: OC-2025-0001)
- Status inicial: "aberta"

---

### 2️⃣ ANÁLISE DA OCORRÊNCIA
**Quem:** Admin ou Operador  
**Onde:** Menu → Ocorrências  
**O que fazer:**
- Visualizar detalhes da ocorrência
- Analisar gravidade do problema
- Decidir se precisa criar OS ou não
- Status pode ser alterado para "em_analise"

---

### 3️⃣ CONVERTER OCORRÊNCIA EM OS
**Quem:** Apenas Admin  
**Onde:** Menu → Ocorrências → Botão "Converter em OS"  
**O que acontece:**
- Sistema cria automaticamente uma OS baseada na ocorrência
- OS herda dados: cliente, origem, garantia, prioridade
- Número da OS gerado (ex: 2025-001)
- Ocorrência recebe flag `convertida_em_os = true`
- Status da ocorrência muda para "convertida_em_os"
- OS criada com status inicial "aberta"
- Ocorrência fica vinculada à OS (rastreabilidade)

---

### 4️⃣ AGENDAR TÉCNICO
**Quem:** Admin  
**Onde:** Menu → Agenda → Nova Reserva  
**O que fazer:**
- Selecionar a OS criada
- Escolher técnico responsável
- Definir data e horário
- Sistema cria reserva na agenda do técnico

---

### 5️⃣ KANBAN - FLUXO DA OS
**Quem:** Admin e Operador (suas OS)  
**Onde:** Menu → Kanban - OS  
**Sequência obrigatória:**

```
1. Aberta (OS recém-criada da ocorrência)
   ↓
2. Designada (após agendar técnico)
   ↓
3. Em Diagnóstico (técnico avalia)
   ↓
4. Aguardando Aprovação (aguarda admin)
   ↓
5. Aguardando Peças (após aprovação)
   ↓
6. Em Execução (técnico executa)
   ↓
7. Finalizada (serviço concluído)
```

---

### 6️⃣ DIAGNÓSTICO E COTAÇÃO
**Quem:** Operador (técnico) ou Admin  
**Onde:** Menu → Diagnóstico e Cotação  
**O que fazer:**
- Selecionar OS da lista
- Registrar LAUDO (diagnóstico do problema)
- Adicionar PEÇAS necessárias (cotação simples)
- Salvar informações
- Avançar OS no Kanban para "Aguardando Aprovação"

---

### 7️⃣ APROVAÇÃO
**Quem:** Apenas Admin  
**Onde:** Menu → Aprovação OS  
**O que decidir:**
- **APROVAR:** Seleciona condição de pagamento → OS vai para "Aguardando Peças"
- **REJEITAR:** Informa motivo → OS não avança

---

### 8️⃣ FINALIZAÇÃO
**Quem:** Operador  
**Onde:** Kanban  
**O que fazer:**
- Após receber peças: mover de "Aguardando Peças" → "Em Execução"
- Executar serviço
- Mover para "Finalizada"

---

## 📊 NOVA ESTRUTURA DE CLIENTES

Baseado no Excel fornecido, os clientes agora têm campos completos:

### Campos Novos:
```typescript
{
  id_dinamics: "fe0eac35-...",                    // ID do Dynamics (ERP)
  razao_social: "INDUSTRIA E COMERCIO...",        // Razão social oficial
  nome: "Campo legado",                            // Mantido para compatibilidade
  empresa: "E001",                                 // Código da empresa
  numero_conta: "C022427",                         // Número da conta
  telefone_principal: "1639699797",                // Telefone
  cidade: "Ribeirão Preto",                        // Cidade
  contato_primario: "LUCAS CAVALIN",               // Nome do contato
  email_contato: "lucas@memo.ind.br",              // Email do contato
  status: "Ativa|Inativa",                         // Status da conta
  endereco: "Rua X, 123",                          // Endereço (campo antigo)
  email: "email@cliente.com"                       // Email (campo antigo)
}
```

### Importação de Clientes:
O CSV agora deve ter o formato:

```csv
id_dinamics,razao_social,empresa,numero_conta,telefone_principal,cidade,contato_primario,email_contato,status
fe0eac35-...,INDUSTRIA E COMERCIO,E001,C022427,1639699797,Ribeirão Preto,LUCAS CAVALIN,lucas@memo.ind.br,Ativa
```

---

## 👨‍🔧 NOVA ESTRUTURA DE TÉCNICOS

Baseado no Excel de "Recursos Reserváveis":

### Campos:
```typescript
{
  id_dinamics: "304a8168-...",            // ID do Dynamics
  nome: "MEMO - ANDERSON",                 // Nome do técnico
  tipo_recurso: "Conta",                   // Tipo do recurso
  email: "email@tecnico.com",              // Email
  telefone: "(11) 99999-9999"              // Telefone
}
```

### Importação de Técnicos:
Formato CSV:

```csv
id_dinamics,nome,tipo_recurso,email,telefone
304a8168-...,MEMO - ANDERSON,Conta,anderson@memo.com,11999999999
```

---

## 🗄️ BANCO DE DADOS - TABELAS ATUALIZADAS

### 1. **Nova Tabela: `ocorrencias`**
```sql
CREATE TABLE ocorrencias (
  id UUID PRIMARY KEY,
  numero TEXT UNIQUE,                     -- OC-2025-0001
  id_cliente UUID,
  titulo TEXT,
  descricao TEXT,
  prioridade TEXT,
  origem TEXT,
  situacao_garantia TEXT,
  contato_cliente TEXT,
  telefone_contato TEXT,
  endereco_atendimento TEXT,
  observacoes TEXT,
  status_ocorrencia TEXT,                 -- aberta, em_analise, convertida_em_os, cancelada
  convertida_em_os BOOLEAN,
  id_os_gerada UUID,
  created_at TIMESTAMPTZ,
  created_by UUID
);
```

### 2. **Tabela `clientes` - Campos Adicionados**
```sql
ALTER TABLE clientes ADD COLUMN razao_social TEXT;
ALTER TABLE clientes ADD COLUMN empresa TEXT;
ALTER TABLE clientes ADD COLUMN numero_conta TEXT;
ALTER TABLE clientes ADD COLUMN telefone_principal TEXT;
ALTER TABLE clientes ADD COLUMN cidade TEXT;
ALTER TABLE clientes ADD COLUMN contato_primario TEXT;
ALTER TABLE clientes ADD COLUMN email_contato TEXT;
ALTER TABLE clientes ADD COLUMN status TEXT DEFAULT 'Ativa';
```

### 3. **Tabela `ordens_servico` - Campo Adicionado**
```sql
ALTER TABLE ordens_servico ADD COLUMN id_ocorrencia UUID REFERENCES ocorrencias(id);
```

### 4. **Função: Gerar Número de Ocorrência**
```sql
CREATE FUNCTION gerar_numero_ocorrencia() RETURNS TEXT;
-- Retorna: OC-2025-0001, OC-2025-0002, etc.
```

---

## 🎯 TELAS DO SISTEMA - ATUALIZADO

### Menu Principal:

```
📊 Dashboard                   (todos)
⚠️  Ocorrências                (todos) ← NOVO
📋 Kanban - OS                 (todos)
📝 Diagnóstico e Cotação       (todos)
📅 Agenda                      (todos)
✅ Aprovação OS                (admin)
👥 Clientes                    (todos)
👤 Técnicos                    (admin)
👥 Usuários                    (admin)
🔧 Produtos                    (admin)
🔗 Mapeamento De-Para          (admin)
📁 Importar/Exportar           (admin)
```

---

## 📁 ARQUIVOS MODIFICADOS/CRIADOS

### ✅ NOVOS:
1. `/app/src/pages/Ocorrencias.tsx` - Tela completa de ocorrências
2. `/app/supabase/migrations/20251105000000_add_ocorrencias.sql` - Migration
3. `/app/MUDANCAS_SISTEMA.md` - Este arquivo

### ✏️ MODIFICADOS:
1. `/app/src/pages/Index.tsx` - Adicionada rota de ocorrências
2. `/app/src/components/Layout/Sidebar.tsx` - Menu atualizado
3. `/app/src/pages/Clientes.tsx` - (Precisa atualizar para novos campos)
4. `/app/src/pages/ImportExport.tsx` - (Precisa atualizar imports)

---

## ⚠️ IMPORTANTE: MIGRAÇÕES PENDENTES

### Você DEVE executar as migrations no Supabase:

**Ordem de execução:**

```sql
1. 20251102215947_*.sql  (schema base)
2. 20251102220022_*.sql  (security)
3. 20251102230000_*.sql  (mapeamento)
4. 20251105000000_*.sql  (ocorrências) ← NOVO
```

### Como aplicar:

1. Acesse Supabase Dashboard
2. Vá em SQL Editor
3. Execute cada arquivo na ordem acima
4. Verifique se as tabelas foram criadas

---

## 🔄 COMPATIBILIDADE COM DADOS ANTIGOS

### OS Criadas Antes da Mudança:

- ✅ Continuam funcionando normalmente
- ⚠️ Campo `id_ocorrencia` será NULL (não tem ocorrência vinculada)
- ✅ Podem ser visualizadas no Kanban
- ✅ Podem avançar no fluxo normalmente

### Clientes Antigos:

- ✅ Continuam visíveis
- ⚠️ Campos novos estarão vazios
- ✅ Podem ser editados para preencher novos campos
- ✅ Ou reimportar via CSV com dados completos

---

## 📈 BENEFÍCIOS DA NOVA LÓGICA

### 1. **Rastreabilidade Completa**
- Cada OS tem origem em uma ocorrência
- Histórico completo desde o primeiro contato

### 2. **Melhor Triagem**
- Admin pode analisar ocorrências antes de criar OS
- Evita criar OS desnecessárias
- Prioriza ocorrências críticas

### 3. **Dados Mais Completos**
- Clientes com informações detalhadas do ERP
- Técnicos identificados corretamente
- Mapeamento De-Para funcionará melhor

### 4. **Fluxo Mais Realista**
- Reflete o processo real: problema → análise → atendimento
- Admin tem controle sobre o que vira OS
- Operador registra ocorrências facilmente

---

## 🧪 COMO TESTAR O NOVO FLUXO

### Teste Completo (15 minutos):

```bash
# 1. Aplicar migrations (Supabase Dashboard)

# 2. Executar projeto
cd /app
npm run dev

# 3. Fazer login como Admin

# 4. Criar um cliente
Menu → Clientes → Novo Cliente
Preencher: Razão Social, Número Conta, etc.

# 5. Registrar ocorrência
Menu → Ocorrências → Nova Ocorrência
Selecionar cliente criado
Título: "Teste de ocorrência"
Salvar

# 6. Converter em OS
Menu → Ocorrências
Clicar em "Converter em OS" na ocorrência
Verificar que OS foi criada

# 7. Verificar no Kanban
Menu → Kanban - OS
Ver OS na coluna "Aberta"

# 8. Agendar técnico
Menu → Agenda → Nova Reserva
Vincular OS criada
Selecionar técnico e data

# 9. Diagnóstico
Menu → Diagnóstico e Cotação
Selecionar OS
Registrar laudo
Adicionar peças
Salvar

# 10. Aprovar
Menu → Aprovação OS
Aprovar OS
Definir condição de pagamento

# 11. Finalizar
Menu → Kanban
Mover OS até "Finalizada"
```

---

## 💡 PRÓXIMOS PASSOS RECOMENDADOS

### 1. **Atualizar Tela de Clientes**
- Adicionar campos novos no formulário
- Mostrar razão_social, numero_conta, etc.

### 2. **Atualizar ImportExport**
- Ajustar formato CSV de clientes
- Adicionar importação de técnicos

### 3. **Integrar Mapeamento De-Para**
- Usar na importação para match automático
- Criar mapeamentos ao importar

### 4. **Dashboard**
- Adicionar card de "Ocorrências Abertas"
- Mostrar conversão rate (ocorrências → OS)

### 5. **Notificações**
- Admin notificado de nova ocorrência
- Técnico notificado de OS agendada

---

## ❓ DÚVIDAS FREQUENTES

### Q: Ainda posso criar OS diretamente?
**A:** A tela "Nova OS" foi removida do menu. Agora TODAS as OS devem vir de ocorrências.

### Q: E as OS antigas que já existem?
**A:** Continuam funcionando. Campo `id_ocorrencia` será NULL.

### Q: Operador pode converter ocorrência em OS?
**A:** Não, apenas Admin pode converter.

### Q: Ocorrência pode ser cancelada?
**A:** Sim, pode-se mudar status para "cancelada" (funcionalidade a implementar).

### Q: Posso ver a ocorrência origem de uma OS?
**A:** Sim, a OS tem campo `id_ocorrencia` que aponta para a ocorrência.

---

## 🎉 RESUMO EXECUTIVO

**O QUE MUDOU:**
- ❌ Não se cria mais OS diretamente
- ✅ Agora: Ocorrência → Admin converte → OS

**NOVO FLUXO:**
1. Registrar Ocorrência (todos)
2. Converter em OS (admin)
3. Agendar Técnico (admin)
4. Diagnóstico e Cotação (operador)
5. Aprovação (admin)
6. Execução e Finalização (operador)

**BENEFÍCIOS:**
- ✅ Rastreabilidade total
- ✅ Melhor triagem
- ✅ Dados completos dos clientes
- ✅ Fluxo mais realista

**STATUS:**
- ✅ Migração SQL criada
- ✅ Tela de Ocorrências implementada
- ✅ Menu atualizado
- ⚠️ Migrations NÃO aplicadas ainda (você deve aplicar)
- ⚠️ Imports precisam ser atualizados
- ⚠️ Tela de Clientes precisa mostrar novos campos

---

**Versão:** 2.0  
**Data:** 05/11/2025  
**Status:** Implementado mas não testado  
