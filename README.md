# HaxHost - Servidor para Salas HaxBall Headless

Este projeto é executado em um servidor (como uma EC2 da AWS) para hospedar instâncias de salas HaxBall headless. É projetado para ser controlado por um sistema externo (como um bot do Discord) que dispara a criação de salas.

## Funcionalidades Principais

* Criação dinâmica de salas HaxBall usando a biblioteca `haxball.js`.
* Gerenciamento da inicialização da sala e passagem de argumentos (nome da sala, senha de admin, token HaxBall) através do script `createRoom.sh`.
* Retorno do link público da sala criada para o processo que chamou `createRoom.sh`.
* Salas com tempo de vida limitado (configurado em `sala.js`, por exemplo, 2 horas).
* Logs detalhados da criação e eventos da sala.

## Como Funciona

1.  O script `createRoom.sh` é o ponto de entrada principal. Ele espera três argumentos:
    * `NomeDaSala`
    * `SenhaDeAdminParaASala`
    * `TokenHaxBall` (obtido de [https://www.haxball.com/headlesstoken](https://www.haxball.com/headlesstoken))

2.  `createRoom.sh` executa `node sala.js` em background, passando os argumentos recebidos e redirecionando a saída para um arquivo de log específico no diretório `logs/`.

3.  O script `sala.js` utiliza a biblioteca `haxball.js` para se conectar à API do HaxBall e criar a sala com as configurações fornecidas.

4.  Quando a sala é criada com sucesso, `sala.js` imprime uma linha no formato `ROOM_LINK_PUBLIC:https://www.haxball.com/play?c=CODIGODASALA`.

5.  O `createRoom.sh` monitora o arquivo de log do `sala.js` esperando por essa linha (ou por uma linha de erro `ERROR_CREATING_ROOM:`).

6.  Ao encontrar o link, `createRoom.sh` o imprime no formato `SUCCESS LINK:https://... PID:XXX`. Se um erro for detectado ou se houver timeout (configurado em 25 segundos), ele imprime uma mensagem de erro.

## Configuração e Uso

### Pré-requisitos

* Node.js (versão LTS recomendada ou compatível com `haxball.js`).
* `npm` ou `yarn`.

### Instalação

1.  Clone o repositório (se estiver configurando em um novo servidor):
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
./createRoom.sh "Nome da Sala Exemplo" "senhaAdminExemplo" "thr1.TOKEN_EXEMPLO_DE_HAXBALL.xxxxxxxxxx"

O script deve retornar o link da sala se tudo ocorrer bem.

Estrutura do Projeto
sala.js: Contém a lógica principal para criar e gerenciar uma instância de sala HaxBall.
createRoom.sh: Script shell para facilitar a execução de sala.js, gerenciamento de logs e retorno de status/link.
package.json / package-lock.json: Definição do projeto Node.js e suas dependências.
logs/: Diretório onde os logs de cada sala são armazenados (ignorado pelo Git).
node_modules/: Diretório das dependências do Node.js (ignorado pelo Git).
Notas
Este projeto é destinado a ser executado em um ambiente de servidor.
A segurança dos tokens HaxBall e senhas de admin é responsabilidade do sistema que chama o createRoom.sh.
O sala.js inclui um temporizador para fechar a sala automaticamente após um período configurado.
<!-- end list -->

