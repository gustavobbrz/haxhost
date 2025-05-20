---

## README para o Projeto `haxhost` (Servidor de Salas HaxBall)

**Nome do Arquivo na EC2 Haxhost:** `/home/ubuntu/haxhost/README.md`
**Repositório GitHub:** `git@github.com:gustavobbrz/haxhost.git`

**Conteúdo para `README.md`:**

```markdown
# HaxHost - Servidor para Salas HaxBall Headless

Este projeto é executado em um servidor (como uma EC2 da AWS) para hospedar instâncias de salas HaxBall headless. Ele é projetado para ser controlado por um sistema externo (como um bot do Discord) que dispara a criação de salas.

## Funcionalidades Principais

* Criação dinâmica de salas HaxBall usando a biblioteca `haxball.js`.
* Gerenciamento da inicialização da sala e passagem de argumentos (nome da sala, senha de admin, token HaxBall) através do script `createRoom.sh`.
* Retorno do link público da sala criada para o processo que chamou `createRoom.sh`.
* Salas com tempo de vida limitado (configurado em `sala.js`, atualmente em ~2 horas).
* Logs detalhados da criação e eventos da sala.

## Como Funciona

1.  O script `createRoom.sh` é o ponto de entrada principal. Ele espera três argumentos:
    * `NomeDaSala`
    * `SenhaDeAdminParaASala`
    * `TokenHaxBall` (obtido de [https://www.haxball.com/headlesstoken](https://www.haxball.com/headlesstoken))

2.  `createRoom.sh` executa `node sala.js` em background, passando os argumentos recebidos e redirecionando a saída para um arquivo de log específico em `logs/`.

3.  O script `sala.js` utiliza a biblioteca `haxball.js` para se conectar à API do HaxBall e criar a sala com as configurações fornecidas.

4.  Quando a sala é criada com sucesso, `sala.js` imprime uma linha no formato `ROOM_LINK_PUBLIC:https://www.haxball.com/play?c=CODIGODASALA`.

5.  O `createRoom.sh` monitora o arquivo de log do `sala.js` esperando por essa linha (ou por uma linha de erro `ERROR_CREATING_ROOM:`).

6.  Ao encontrar o link, `createRoom.sh` o imprime no formato `SUCCESS LINK:https://... PID:XXX`. Se um erro for detectado ou se houver timeout (25 segundos), ele imprime uma mensagem de erro.

## Configuração e Uso

### Pré-requisitos

* Node.js (versão 18.x.x ou compatível com `haxball.js`)
* `npm` ou `yarn`

### Instalação

1.  Clone este repositório (se estiver configurando em um novo servidor):
    ```bash
    git clone git@github.com:gustavobbrz/haxhost.git
    cd haxhost
    ```
2.  Instale as dependências (principalmente `haxball.js`):
    ```bash
    npm install
    ```
    *(Ou `yarn install`)*

### Para Criar uma Sala (Manualmente ou via Script)

Execute o script `createRoom.sh` com os argumentos necessários:

```bash
./createRoom.sh "Nome da Sala Teste" "senhaSuperAdmin" "tokenHaxBallValidoAqui"
