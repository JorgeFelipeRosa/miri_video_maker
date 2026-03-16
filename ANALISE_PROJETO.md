# Análise do projeto Miri Video Maker (Miriã Storymaker)

Objetivo do projeto: atender videomakers com **cadastro de clientes**, **envio de propostas e contratos**, **consulta em calendário**, **lembretes**, **envio de formulários**, entre outras funcionalidades.

---

## O que já existe

### Front-end (public/)
| Área | Situação |
|------|----------|
| **Login** | Tela pronta; redireciona para dashboard sem validação real (sem API de auth). |
| **Dashboard** | Layout com 3 KPIs (Faturamento, Em edição, Orçamentos abertos), mas **valores estáticos**; serviço e lógica já existem, porém **comentados** e sem IDs nos elementos. |
| **Clientes** | Página + controller + `ClienteService` (listar, buscar, salvar, deletar). |
| **Orçamentos** | Página + controller + `OrcamentoService` + editor de orçamento. |
| **Pedidos** | Página + controller + `PedidoService`. |
| **Agenda** | Calendário mensal + painel do dia; usa **apenas pedidos** (`get_pedidos`); não mostra orçamentos. |
| **Financeiro** | Página + controller + serviço (parcelas, pagamentos). |
| **Listas** | Cadastros auxiliares (listas/categorias). |
| **Serviços** | CRUD de serviços. |
| **Sidebar** | Navegação carregada dinamicamente. |

### Back-end (netlify/functions/)
- **Clientes:** `manage_clients.js` (GET lista todos; POST create/update/delete). **GET com `?id=` não está implementado** (buscar um cliente por ID).
- **Orçamentos:** `get_orcamentos`, `get_orcamento_detalhes`, `save_orcamento`, `delete_orcamento`, `approve_orcamento`, `update_orcamento_status`, `load_editor_data`. Pastas `orcamentos/index.js` e `orcamentos/actions.js` existem (conteúdo a verificar).
- **Pedidos:** `get_pedidos`, `get_pedido_detalhes`, `manage_pedido_actions`. Pasta `pedidos/index.js` está **vazia**.
- **Financeiro:** `get_financeiro_geral`, `manage_financeiro`.
- **Cadastros:** `manage_lists`, `manage_services`.

**Problema de consistência:** Nenhuma function usa `_shared/_db.js`; todas criam o cliente Turso nelas mesmas e **não carregam dotenv** de forma centralizada. O arquivo `_shared/_db.js` existe e está correto, mas não é usado. Em ambiente local, sem `.env` carregado antes, as functions podem falhar.

### O que falta em relação ao intuito do projeto
| Necessidade | Situação |
|-------------|----------|
| **Calendário unificado** | Não existe endpoint que devolva **eventos por período** (orçamentos + pedidos). A agenda hoje só lista pedidos. |
| **Lembretes** | Nenhuma tabela, API ou job (ex.: cron) para lembretes. |
| **Formulários** | Nenhum fluxo de formulário público (ex.: captação de lead no site). |
| **Autenticação** | Login não valida com backend; `auth.service.js` está vazio. APIs sem proteção. |

---

## Pontos de atenção

1. **agenda.html** carrega `sidebar.js` e `agenda.js` duas vezes (duplicado no final do body).
2. **package.json** ainda tem `"name": "jorge"`; faz sentido alterar para `miri-video-maker` ou `miria-storymaker`.
3. **netlify.toml** está com `port = 8888`; no outro projeto você preferiu porta 3000 para dev.
4. **Cliente por ID:** o front chama `manage_clients?id=123`, mas o backend ignora o parâmetro e devolve sempre a lista completa.

---

## O que dá para fazer agora (prioridade)

1. **Unificar o uso do banco**  
   Todas as functions usarem `require("./_shared/_db")` (ou o path correto a partir de cada function) em vez de criar o cliente Turso nelas mesmas. Garante `dotenv` e URL Turso consistentes.

2. **Implementar GET com `?id=` em `manage_clients`**  
   Para o `ClienteService.buscarPorId(id)` funcionar (ex.: edição de cliente).

3. **Dashboard com dados reais**  
   Adicionar IDs nos 3 KPIs do `dashboard.html` e ativar a lógica no `dashboard.js` (já escrita, só está comentada).

4. **Criar function `calendario`**  
   GET `/.netlify/functions/calendario?inicio=YYYY-MM-DD&fim=YYYY-MM-DD` retornando eventos do período a partir de orçamentos e pedidos (`data_evento`). Opcional: a agenda usar esse endpoint para mostrar orçamentos + pedidos no calendário.

5. **Remover scripts duplicados em `agenda.html`**  
   Deixar uma única carga de `sidebar.js` e de `agenda.js`.

6. **Ajustes de configuração**  
   Nome do projeto no `package.json`; porta 3000 no `netlify.toml` (se quiser igual ao outro projeto).

Depois (próximas etapas): **lembretes** (tabela + API + ideia de cron), **formulários** (página pública + function para receber e gravar lead/cliente), **autenticação** (proteger login e APIs).

---

## Feito nesta sessão

- **Unificação do banco:** Todas as functions passaram a usar `require("./_shared/_db.js")`.
- **GET com `?id=` em `manage_clients`:** `ClienteService.buscarPorId(id)` passa a funcionar.
- **Dashboard com dados reais:** IDs nos KPIs e lógica ativada no controller (faturamento, em edição, orçamentos abertos).
- **Function `calendario`:** GET `/.netlify/functions/calendario?inicio=YYYY-MM-DD&fim=YYYY-MM-DD` retornando orçamentos + pedidos do período.
- **Agenda:** Passa a usar o endpoint `calendario` e exibe orçamentos e pedidos; clique no evento leva ao editor (orçamento) ou pedidos (pedido).
- **Scripts duplicados removidos** em `agenda.html`.
- **package.json:** nome alterado para `miri-video-maker`.
- **netlify.toml:** porta de dev alterada para 3000.
