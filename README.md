# Quake Log Parser API

API desenvolvida em NestJS para realizar o parsing de arquivos de log de partidas de Quake, processar os dados e expor estatísticas e rankings através de endpoints RESTful.

---

## Funcionalidades Implementadas

- [x] **Upload e Parsing de Logs**: Endpoint para upload de arquivos `.log`.
- [x] **Sanitização de Dados**: Lógica para tratar e limpar logs malformatados (linhas concatenadas).
- [x] **Processamento de Partidas**: Identificação de início e fim de partidas, mesmo em um único arquivo de log com múltiplos jogos.
- [x] **Cálculo de Estatísticas**: Contabilização de kills e deaths por jogador.
- [x] **Ranking por Partida**: Endpoint para visualizar o ranking de uma partida específica.
- [x] **Ranking Global**: Endpoint que agrega dados de todas as partidas para criar um ranking global.
- [x] **Sistema de Awards**: Concede prêmios a jogadores por feitos especiais (`PERFECT_MATCH`, `KILLING_SPREE`).
- [x] **Estatísticas de Bônus**: Cálculo do maior **streak** de kills e da **arma preferida** de cada jogador por partida.
- [x] **Limite de Jogadores**: Validação da regra de negócio que limita as partidas a 20 jogadores.
- [x] **Documentação de API**: Geração de documentação interativa com Swagger (OpenAPI).

## Tecnologias Utilizadas

- **Backend**: [NestJS](https://nestjs.com/)
- **Linguagem**: [TypeScript](https://www.typescriptlang.org/)
- **ORM**: [Prisma](https://www.prisma.io/)
- **Banco de Dados**: Suporte para PostgreSQL, MySQL, SQLite (configurado para SQLite por padrão).
- **Testes**: [Jest](https://jestjs.io/)

## Como Executar o Projeto

### Pré-requisitos

- [Node.js](https://nodejs.org/en/) (versão 20.x ou superior)
- [npm](https://www.npmjs.com/)
- [Docker](https://www.docker.com/) (Opcional, caso queira usar um banco de dados como PostgreSQL)

### Passos para Instalação

1.  **Clone o repositório**

    ```bash
    git clone https://github.com/LeonanCarvalho/quake-log-parser-nest
    cd quake-log-parser-nest
    ```

2.  **Crie o arquivo de ambiente**
    Copie o arquivo de exemplo `.env.example` para um novo arquivo chamado `.env`.

    ```bash
    cp .env.example .env
    ```

    _O projeto está configurado para usar um banco de dados SQLite (`dev.db`) por padrão, que será criado automaticamente._

3.  **Instale as dependências**

    ```bash
    npm install
    ```

4.  **Execute as migrações do banco de dados**
    Este comando irá criar o banco de dados SQLite (se não existir) e aplicar o schema.

    ```bash
    npx prisma migrate dev
    ```

5.  **Inicie a aplicação em modo de desenvolvimento**
    ```bash
    npm run start:dev
    ```
    A aplicação estará disponível em `http://localhost:3000`.

## Uso da API

Após iniciar a aplicação, a documentação completa e interativa da API estará disponível em:

**`http://localhost:3000/api-docs`**

Você pode usar a interface do Swagger para testar todos os endpoints.

### Endpoints Principais

- **`POST /matches/upload`**

  - Recebe um arquivo de log para processamento.
  - **Body**: `multipart/form-data`
  - **Campo**: `logFile`

- **`GET /matches/{id}/report`**

  - Retorna o relatório e o ranking de uma partida específica.

- **`GET /ranking/global`**
  - Retorna o ranking global agregado de todos os jogadores.

## Testes

Para executar a suíte completa de testes unitários:

```bash
npm run test
```

Para gerar um relatório de cobertura de testes:

```bash
npm run test:cov
```
