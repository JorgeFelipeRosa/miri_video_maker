# Formulário público e primeiro contato

## O que foi implementado

1. **Formulário público** (`public/formulario.html`)  
   Página para o lead preencher: nome, e-mail, WhatsApp, tipo de evento, data desejada, mensagem.  
   Envio para `POST /.netlify/functions/receber_formulario`.

2. **Backend `receber_formulario`**  
   - Valida nome e (e-mail ou WhatsApp).  
   - Verifica duplicado por e-mail/WhatsApp; se existir, retorna mensagem amigável sem criar outro cliente.  
   - Cria cliente com origem "Formulário site" (usa o id da origem em `origens_contato` se existir descrição contendo "Formulário").  
   - Se existir a tabela `formulario_entradas`, grava tipo de evento, data desejada e mensagem.

3. **Atalho "Novo cliente"** no Dashboard (card "Primeiro contato?") apontando para `clientes.html`.

4. **Verificação de duplicado** ao cadastrar cliente no app: se já existir cliente com o mesmo e-mail ou WhatsApp, exibe toast e não salva.

---

## Tabela opcional `formulario_entradas`

Para guardar tipo de evento, data desejada e mensagem dos leads, crie a tabela no Turso:

```sql
CREATE TABLE IF NOT EXISTS formulario_entradas (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  id_cliente INTEGER NOT NULL,
  tipo_evento TEXT,
  data_desejada TEXT,
  mensagem TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (id_cliente) REFERENCES clientes(id)
);
```

Se a tabela não existir, o sistema continua funcionando: apenas o cliente é criado.

---

## Origem "Formulário site"

No app, em **Listas** > **Origens de contato**, cadastre a opção **"Formulário site"**.  
Assim os clientes vindos do formulário público ficam com essa origem.  
Se não existir, a function tenta usar o primeiro id de origem disponível.

---

## URL do formulário

Em produção, use algo como:  
`https://seu-dominio.com/formulario.html`  
(e compartilhe no Instagram, site, etc.)

Em desenvolvimento:  
`http://localhost:3000/formulario.html`
