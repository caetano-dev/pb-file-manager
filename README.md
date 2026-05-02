# Gerenciador de Arquivos

Gerenciador de arquivos seguro onde usuários autenticados podem realizar upload, listagem, download e exclusão de seus próprios arquivos, com isolamento de dados entre contas.

## Stack

A aplicação foi construída utilizando as seguintes tecnologias:

*   **Frontend:** React com TypeScript, Vite, Tailwind CSS e React Query
*   **Backend:** Python 3.11, FastAPI, SQLAlchemy (Async) e Pytest
*   **Banco de Dados:** PostgreSQL (via asyncpg)
*   **Armazenamento (Storage):** MinIO (Serviço compatível com Amazon S3)
*   **Cache:** Redis
*   **Infraestrutura:** Docker e Docker Compose

## Arquitetura

O projeto adota padrões arquiteturais modernos para garantir a separação de responsabilidades, escalabilidade e clareza do código:

*   **Backend (Domain-Driven Design - DDD):** A API foi dividida em domínios isolados (`auth` e `files`), além de um módulo `core` para configurações de infraestrutura (banco de dados, cache, storage e segurança). Cada domínio possui separação estrita entre rotas (`router.py`), regras de negócio (`service.py`), modelos de banco de dados (`models.py`) e validação de dados (`schemas.py`).
*   **Frontend (Feature-Sliced Design - FSD):** O código cliente está organizado por funcionalidades (`src/features/auth`, `src/features/files`), encapsulando componentes, hooks, contextos e chamadas de API específicos de cada domínio, mantendo a camada de páginas (`src/pages`) limpa e focada apenas no roteamento estrutural.

## Funcionalidades

Todas as funcionalidades obrigatórias e requisitos bônus propostos no teste foram implementados.

**Obrigatórias:**
*   Cadastro e autenticação de usuários via JWT (JSON Web Tokens).
*   Restrição de acesso: usuários interagem estritamente com seus próprios arquivos.
*   Upload de arquivos com validação de tamanho (máximo 10MB) e tipos MIME restritos (.png, .jpg, .pdf, .txt).
*   Listagem de arquivos exibindo metadados essenciais (nome original, tamanho, data de upload).
*   Download seguro de arquivos.
*   Exclusão física de arquivos (remoção simultânea do banco de dados e do storage S3).

**Pontos Extras (Bônus) Implementados:**
*   **Armazenamento S3:** Integração com MinIO para persistência de arquivos.
*   **Streaming:** Upload e download realizados via streaming direto para o MinIO.
*   **Cache:** Implementação de Redis para armazenar a listagem de arquivos do usuário, invalidando o cache automaticamente após operações de escrita.
*   **Links Compartilháveis:** Geração de URLs pré-assinadas do S3 com tempo de expiração configurável.
*   **Preview de Imagens:** Visualização de imagens diretamente na interface do frontend sem necessidade de download.
*   **Versionamento:** Controle de versão automático para arquivos enviados com o mesmo nome.
*   **Dockerização:** Ambiente de desenvolvimento totalmente orquestrado com um único comando.

## Instruções de Instalação e Execução

1. **Configuração de Variáveis de Ambiente:**
   Copie o arquivo de exemplo para criar o seu arquivo `.env` local na raiz do projeto.
   ```bash
   cp example.env .env
   ```

2. **Inicialização da Aplicação:**
   Execute o Docker Compose para construir as imagens e subir os serviços (Banco de dados, MinIO, Redis, Backend e Frontend).
   ```bash
   docker compose up --build
   ```

A aplicação estará disponível em `http://localhost:5173`.

## Documentação da API (Swagger)

O FastAPI gera automaticamente a documentação interativa da API. Com os containers em execução, acesse:

*   **Swagger UI:** `http://localhost:8000/docs`
*   **ReDoc:** `http://localhost:8000/redoc`

## Execução dos Testes Automatizados

O backend possui testes de integração e testes unitários isolados na pasta `backend/tests/`. O banco de dados de teste (SQLite em memória) e os mocks dos serviços externos (S3 e Redis) são configurados automaticamente via Pytest.

Para rodar a suíte de testes, execute o comando abaixo em um terminal separado enquanto os containers estiverem rodando:
```bash
docker compose exec backend pytest -v
```