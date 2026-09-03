# TaskFlow

Plataforma de gestão de projetos com autenticação JWT, CRUD de projetos e separação entre equipes.

![Stack](https://img.shields.io/badge/Stack-Full%20Stack-1976d2)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-4.1.1-green)
![Angular](https://img.shields.io/badge/Angular-22.1-red)
![MySQL](https://img.shields.io/badge/MySQL-8.0-blue)
![Docker](https://img.shields.io/badge/Docker-compose-2496ED)

---

## 🧱 Stack

| Camada    | Tecnologia                              |
|-----------|-----------------------------------------|
| Backend   | Java 21, Spring Boot 4.1.1, Spring Security, Spring Data JPA, JWT |
| Frontend  | Angular 22.1, TypeScript 6, SCSS         |
| Banco     | MySQL 8.0                                |
| Infra     | Docker Compose, Nginx                    |

---

## 🚀 Como rodar

### Com Docker (recomendado)

Na raiz do projeto:

```bash
docker compose up -d --build
```

Serviços disponíveis:

| Serviço   | URL                       |
|-----------|---------------------------|
| Frontend  | http://localhost          |
| Backend   | http://localhost:8080     |
| MySQL     | localhost:3307            |

### Sem Docker (desenvolvimento)

**Backend:**

```bash
# 1. Suba o MySQL (basta o container do banco)
docker compose up -d mysql

# 2. Rode a aplicação
cd backend
mvn spring-boot:run
```

> O backend está configurado para acessar `localhost:3306` no profile `dev`.
> Se precisar, ajuste `spring.datasource.url` em `backend/src/main/resources/application.properties`.

**Frontend:**

```bash
cd frontend
npm install
ng serve
```

Acesse `http://localhost:4200`. O proxy (`proxy.conf.json`) redireciona chamadas `/api` para `http://localhost:8080`.

---

## 🔐 Autenticação

O projeto usa **JWT** (JSON Web Token) com senhas hasheadas via **BCrypt**.

Endpoints:

| Método | Rota               | Descrição                          | Acesso        |
|--------|--------------------|------------------------------------|---------------|
| POST   | `/api/auth/register` | Cria conta e retorna token       | Público       |
| POST   | `/api/auth/login`    | Autentica e retorna token        | Público       |
| GET    | `/api/auth/me`       | Dados do usuário logado          | Autenticado   |

Configuração JWT (`application.properties`):

```properties
jwt.secret=sua-chave-secreta
jwt.expiration=86400000   # 24h em milissegundos
```

> ⚠️ Em produção, **mude** `jwt.secret` para um valor longo e aleatório.

---

## 📦 API de Projetos

| Método | Rota                     | Descrição                          |
|--------|--------------------------|------------------------------------|
| POST   | `/api/projects`          | Cria um projeto                    |
| GET    | `/api/projects`          | Lista projetos do usuário          |
| GET    | `/api/projects/{id}`     | Busca projeto por ID               |
| PUT    | `/api/projects/{id}`     | Atualiza projeto (dono)            |
| DELETE | `/api/projects/{id}`     | Exclui (soft delete)               |

Exemplo de corpo para criar/atualizar:

```json
{
  "name": "Meu Projeto",
  "description": "Descrição opcional"
}
```

---

## 🗂 Estrutura do projeto

```
taskflow/
├── backend/
│   └── src/main/java/com/taskflow/
│       ├── config/        # Security, JWT
│       ├── controller/    # REST endpoints
│       ├── dto/           # Request/Response DTOs
│       ├── entity/        # JPA entities
│       ├── exception/     # Tratamento de erros
│       ├── filter/        # Filtro de autenticação JWT
│       ├── repository/    # Data repositories
│       └── service/       # Regras de negócio
└── frontend/
    └── src/app/
        ├── core/          # Services, guards, interceptors, models
        ├── features/      # Login, register, dashboard, projects, tasks, team
        └── shared/        # Componentes e modelos reutilizáveis
```

---

## 🧪 Testes

**Backend:**

```bash
cd backend
mvn test
```

**Frontend:**

```bash
cd frontend
ng test
```

---

## 🛠 Scripts úteis

| Ação                          | Comando                          |
|-------------------------------|----------------------------------|
| Subir tudo (build + start)    | `docker compose up -d --build`   |
| Parar tudo                    | `docker compose down`            |
| Ver logs do backend           | `docker compose logs backend`    |
| Ver logs do frontend          | `docker compose logs frontend`   |
| Recriar um serviço específico | `docker compose up -d --build <serviço>` |
