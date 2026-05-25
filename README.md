# Leguiard Catalog

**Leguiard Catalog** é uma plataforma B2B/B2C multi-tenant de catálogo digital e vitrine virtual. O sistema permite a criação de múltiplas lojas com catálogos independentes, oferecendo tanto um painel administrativo completo para o lojista quanto uma vitrine otimizada (mobile-first) para os clientes finais.

## 🎯 Objetivo

O objetivo principal do Leguiard Catalog é simplificar a gestão de produtos, categorias e leads para múltiplos lojistas em uma única plataforma. Cada lojista recebe uma vitrine personalizada (por exemplo, `meudominio.com/minha-loja`), onde podem customizar as cores principais para refletir a identidade visual de sua marca, enquanto mantêm a base do sistema "clean e branca", garantindo alta conversão e usabilidade em dispositivos móveis.

## 🚀 Tecnologias e Arquitetura

Este projeto foi construído utilizando tecnologias modernas visando alta performance, SEO e excelente experiência de desenvolvimento:

- **Framework:** [Next.js (App Router)](https://nextjs.org/)
- **Linguagem:** TypeScript
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/) com design system customizável por loja.
- **Banco de Dados:** PostgreSQL
- **ORM:** [Prisma](https://www.prisma.io/)
- **Autenticação:** [NextAuth.js](https://next-auth.js.org/)
- **Validação de Dados:** Zod

## 🛠️ Ambiente de Desenvolvimento

Siga os passos abaixo para configurar o projeto localmente.

### 1. Pré-requisitos
- Node.js (v18+)
- PostgreSQL rodando localmente ou via container (Docker).

### 2. Instalação

Clone o repositório e instale as dependências:

```bash
npm install
```

### 3. Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto copiando o `.env.example`:

```bash
cp .env.example .env
```

Preencha com suas configurações do banco de dados e segredos da aplicação:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/leguiardcatalog"
NEXTAUTH_SECRET="sua-chave-secreta-aqui"
NEXTAUTH_URL="http://localhost:3000"

# Opcional: Credenciais do Administrador Geral para o Seed
ADMIN_EMAIL="admin@leguiard.local"
ADMIN_PASSWORD="sua-senha-segura"
ADMIN_STORE_SLUG="minha-loja"
```

### 4. Banco de Dados e Seed

Gere os artefatos do Prisma, aplique as migrações e crie o usuário administrativo inicial:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run seed:admin
```
> **Nota de Segurança:** Se a variável `ADMIN_PASSWORD` não for fornecida no arquivo `.env`, o script de seed gerará uma senha aleatória segura automaticamente e a exibirá no console.

### 5. Executando o Servidor

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Acesse o painel em `http://localhost:3000/login` utilizando as credenciais configuradas no Seed.

## 🎨 Design e Personalização

A interface foi projetada com uma base estrutural minimalista ("basic white", utilizando a fonte **Inter**). O diferencial do projeto é o sistema multi-tenant, que permite que o design dos botões, acentos e links se adapte de acordo com a paleta de cores configurada individualmente para cada loja.

## 📝 Scripts Disponíveis

- `npm run dev`: Inicia o ambiente de desenvolvimento.
- `npm run build`: Gera o build otimizado para produção.
- `npm run start`: Inicia o servidor de produção a partir do build.
- `npm run lint`: Executa a análise estática do código (ESLint).
- `npm run seed:admin`: Roda o script para gerar a loja e usuário principal.
- `npm run prisma:studio`: Abre o painel visual do Prisma para explorar os dados.
