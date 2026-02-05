# lucaspedrosodobomdespacho045467
Candidato: Lucas Pedroso do Bomdespacho
Contrução do Projeto Front End Angular para o processo Seletivo: Engenheiro da Computação

================================================================================
                            PET MANAGER
================================================================================

Sistema de gerenciamento de Pets e Tutores desenvolvido em Angular 21.
Para facilitar o acesso, o site está disponivel em: 
   https://processoseletivoec-b7786.web.app

E o projeto no Github em:
   https://github.com/lcs1reclock/lucaspedrosodobomdespacho045467.git

================================================================================
DESCRIÇÃO DO PROJETO
================================================================================

Pet Manager é uma aplicação web completa para gerenciar pets e seus tutores,
permitindo cadastro, edição, vinculação entre pets e tutores, upload de fotos
e busca.

Principais Funcionalidades:
- Autenticação JWT com refresh token
- Cadastro e gerenciamento de Pets
- Cadastro e gerenciamento de Tutores
- Vinculação/desvinculação entre Pets e Tutores
- Upload de fotos para Pets e Tutores
- Sistema de busca com paginação
- Interface responsiva com Tailwind CSS
- Proteção de rotas com Guards

================================================================================
TECNOLOGIAS UTILIZADAS
================================================================================

Frontend:
- Angular 21.1.2
- Angular Signals (gerenciamento de estado reativo)
- RxJS (programação reativa)
- Tailwind CSS 3.4.19 (estilização)
- TypeScript 5.7
- Standalone Components

Backend (API):
- API REST: https://pet-manager-api.geia.vip
- Autenticação JWT

================================================================================
PRÉ-REQUISITOS
================================================================================

Antes de executar o projeto, certifique-se de ter instalado:

1. Node.js (versão 18 ou superior)
   Download: https://nodejs.org/

2. npm (geralmente vem com o Node.js)
   Versão recomendada: 10.9.4

3. Angular CLI (opcional, mas recomendado)
   Para instalar globalmente:
   npm install -g @angular/cli

================================================================================
INSTALAÇÃO
================================================================================

1. Clone ou baixe o projeto
    $ git clone https://github.com/lcs1reclock/lucaspedrosodobomdespacho045467.git

2. Abra o terminal na pasta do projeto

3. Instale as dependências:
   $ npm install

   Aguarde a instalação completa de todos os pacotes (pode levar alguns minutos)

================================================================================
EXECUTANDO O PROJETO
================================================================================

1. No terminal, execute:
   $ ng serve --open

2. Aguarde a compilação (aproximadamente 10-30 segundos)

3. Após a compilação o site será aberto no seu navegador em:
   http://localhost:4200

4. Para parar o servidor:
   Pressione Ctrl+C no terminal

================================================================================
CREDENCIAIS DE ACESSO
================================================================================
Para fazer login no sistema, use as credenciais fornecidas pela API:
(Consulte a documentação da API ou administrador do sistema)

Exemplo de login:
Usuário: admin
Senha: admin

================================================================================
ESTRUTURA DO PROJETO
================================================================================

src/
├── app/
│   ├── core/                    # Módulos principais
│   │   ├── guards/              # Proteção de rotas (authGuard)
│   │   ├── interceptors/        # HTTP Interceptor (JWT)
│   │   └── services/            # Serviços principais (auth)
│   │
│   ├── features/                # Módulos de funcionalidades
│   │   ├── auth/                # Autenticação (login)
│   │   ├── pets/                # Gerenciamento de pets
│   │   └── tutores/             # Gerenciamento de tutores
│   │
│   ├── shared/                  # Componentes compartilhados
│   │   ├── components/          # Header, Notificações
│   │   ├── directives/          # Máscaras (phone, integer)
│   │   ├── models/              # Interfaces TypeScript
│   │   ├── pipes/               # Pipes (phone format)
│   │   └── services/            # NotificationService
│   │
│   └── environments/            # Configurações de ambiente
│
├── public/                      # Arquivos estáticos (favicon)
└── styles.css                   # Estilos globais

================================================================================
FUNCIONALIDADES DETALHADAS
================================================================================

1. AUTENTICAÇÃO / LOGIN
   - Login com JWT
   - Refresh token automático
   - Logout com limpeza de sessão
   - Redirecionamento automático para a tela de login quando sessão expirar
   - Ao fechar o navegador a sessão também expira (sessionStorage)

2. GERENCIAMENTO DE PETS
   - Lista paginada de 10 em 10 Pets exibidos na tela
   - Cadastro de novo pet (nome, raça, idade, foto)
   - Edição de um pet existente
   - Upload de foto do pet (máximo 5MB)
   - Busca de pets por nome
   - Visualização do tutor vinculado ao pet selecionado
   - Validação de idade (apenas números inteiros)

3. GERENCIAMENTO DE TUTORES
   - Lista paginada de 10 em 10 tutores exibidos na tela
   - Cadastro de novo tutor (nome, telefone, endereço e foto)
   - Edição de um tutor existente
   - Upload de foto do tutor (máximo 5MB)
   - Busca de tutores por nome
   - Visualização dos pets vinculados ao tutor

4. VINCULAÇÃO PET-TUTOR
   - Vincula um Tutor com N pets
   - Desvincula pets de um tutores
   - Modal de busca para selecionar pets disponíveis
   - Validação: pet só pode ter um tutor: como o tutor só é acessado na opção de Ver detalhes do Pet, todos os Pets são exibidos como "disponíveis" e a validação é feita ao tentar selecionar o Pet, para evitar que seja feita 1 requisição para cada Pet no momento de carregar a lista.
   - Confirmação antes de desvincular (modal customizado)

5. SISTEMA DE NOTIFICAÇÕES
   - Notificações de sucesso (verde)
   - Notificações de erro (vermelho)
   - Notificações de aviso (amarelo)
   - Notificações de informação (azul)
   - Auto-dismiss após 5 segundos
   - Animações suaves

6. INTERFACE DO USUÁRIO
   - Design moderno.
   - Responsivo (mobile, tablet, desktop).
   - Animações e transições suaves.
   - Feedback visual em todas as ações.
   - Loading states durante requisições.
   - Drag & drop para upload de imagens.
   - Preview de imagens antes de salvar.

================================================================================
COMANDOS ÚTEIS
================================================================================
Executar em modo desenvolvimento:
$ npm start ou ng serve

Executar em modo watch (recompila automaticamente):
$ npm run watch

Compilar para produção:
$ npm run build

Executar testes:
$ npm test

Limpar cache e reinstalar dependências:
$ rm -rf node_modules package-lock.json
$ npm install


================================================================================
OBSERVAÇÕES IMPORTANTES
================================================================================

1. O projeto usa sessionStorage para armazenar tokens, mais seguro que
   localStorage pois expira ao fechar o navegador.

2. Todos os console.log foram comentados para produção. Para debug,
   descomente conforme necessário.

3. O projeto usa Angular Signals para gerenciamento de estado, uma
   abordagem mais moderna que RxJS BehaviorSubject.

4. As rotas são protegidas por Guards:
   - authGuard: requer autenticação
   - noAuthGuard: redireciona usuários autenticados

5. O interceptor HTTP adiciona automaticamente o token Bearer em todas
   as requisições e tenta fazer refresh quando recebe 401 (não autorizado).

6. Máscaras de input são aplicadas automaticamente:
   - Telefone: (11) 99999-9999
   - Idade: apenas números inteiros

================================================================================
ESTRUTURA DE ROTAS
================================================================================

/auth/login          = Tela de login (pública)
/pets                = Lista de pets (protegida)
/tutores             = Lista de tutores (protegida)

Redirecionamentos automáticos:
- Usuário não autenticado                   = /auth/login
- Usuário autenticado acessando /auth/login = /pets

================================================================================
API ENDPOINTS UTILIZADOS
================================================================================

Base URL: https://pet-manager-api.geia.vip

Autenticação:
POST   /v1/autenticacao/login                - Login
PUT    /v1/autenticacao/refresh              - Refresh token

Pets:
GET    /v1/pets                              - Listar pets (paginado)
GET    /v1/pets/{id}                         - Buscar pet por ID
POST   /v1/pets                              - Criar pet
PUT    /v1/pets/{id}                         - Atualizar pet
POST   /v1/pets/{id}/foto                    - Upload foto do pet

Tutores:
GET    /v1/tutores                           - Listar tutores (paginado)
GET    /v1/tutores/{id}                      - Buscar tutor por ID
POST   /v1/tutores                           - Criar tutor
PUT    /v1/tutores/{id}                      - Atualizar tutor
POST   /v1/tutores/{id}/foto                 - Upload foto do tutor
POST   /v1/tutores/{tutorId}/pets/{petId}    - Vincular pet
DELETE /v1/tutores/{tutorId}/pets/{petId}    - Desvincular pet

================================================================================
================================================================================

Desenvolvido com Angular 21.1.2
Data: Fevereiro de 2026
Lucas Pedroso do Bomdespacho

================================================================================


