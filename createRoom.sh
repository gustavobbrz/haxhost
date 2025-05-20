#!/bin/bash

# ~/haxhost/createRoom.sh

ROOM_NAME="$1"
ADMIN_PASSWORD="$2" 
HAX_TOKEN="$3"

HAXHOST_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)
LOG_FILENAME_SAFE_ROOM_NAME=$(echo "$ROOM_NAME" | sed 's/[^a-zA-Z0-9_-]/_/g') 
SALA_JS_FULL_LOG_FILE="${HAXHOST_DIR}/logs/sala_js_${LOG_FILENAME_SAFE_ROOM_NAME}_$(date +%Y%m%d_%H%M%S)_$$.log" 

mkdir -p "${HAXHOST_DIR}/logs"

log_this() {
    echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" >> "$SALA_JS_FULL_LOG_FILE"
}

if [ -z "$ROOM_NAME" ] || [ -z "$ADMIN_PASSWORD" ] || [ -z "$HAX_TOKEN" ]; then
  echo "ERROR:Argumentos_insuficientes_para_createRoom.sh (esperado: NomeDaSala SenhaAdmin TokenHaxball)"
  log_this "ERRO CRÍTICO: Argumentos insuficientes. Nome='${ROOM_NAME}', SenhaAdmin Fornecida='${ADMIN_PASSWORD:+"Sim"}', Token Fornecido='${HAX_TOKEN:+"Sim"}'"
  exit 1
fi

log_this "--- Iniciando createRoom.sh para '${ROOM_NAME}' (PID $$) ---"
log_this "Argumentos Recebidos: Nome='${ROOM_NAME}', SenhaAdmin (comprimento)=${#ADMIN_PASSWORD}, Token='${HAX_TOKEN:0:10}...'"

cd "$HAXHOST_DIR" || {
  echo "ERROR:Falha_ao_acessar_diretorio_haxhost_${HAXHOST_DIR}"
  log_this "ERRO CRÍTICO: Falha ao entrar em $HAXHOST_DIR"
  exit 1;
}

log_this "Comando para sala.js: nohup node sala.js \"${ROOM_NAME}\" \"${ADMIN_PASSWORD}\" \"${HAX_TOKEN}\" >> \"${SALA_JS_FULL_LOG_FILE}\" 2>&1 &"
nohup node sala.js "${ROOM_NAME}" "${ADMIN_PASSWORD}" "${HAX_TOKEN}" >> "$SALA_JS_FULL_LOG_FILE" 2>&1 &
SALA_PID=$!

if [ -z "$SALA_PID" ]; then
    echo "ERROR:Falha_ao_obter_PID_do_sala.js"
    log_this "ERRO CRÍTICO: Falha ao obter o PID do processo sala.js após o nohup."
    exit 1
fi

log_this "sala.js lançado em background com PID ${SALA_PID}. Aguardando output no log: ${SALA_JS_FULL_LOG_FILE}"

POLL_DURATION=0
MAX_POLL_SECONDS=25 
SUCCESS_OUTPUT=""
ERROR_OUTPUT=""
sleep 1 

while [ $POLL_DURATION -lt $MAX_POLL_SECONDS ]; do
    if [ ! -f "$SALA_JS_FULL_LOG_FILE" ]; then
        log_this "Arquivo de log $SALA_JS_FULL_LOG_FILE ainda não criado (tentativa $POLL_DURATION), esperando..."
        sleep 1
        POLL_DURATION=$((POLL_DURATION + 1))
        continue
    fi

    LINK_LINE_CONTENT=$(grep -m 1 "ROOM_LINK_PUBLIC:" "$SALA_JS_FULL_LOG_FILE")
    if [[ -n "$LINK_LINE_CONTENT" ]]; then
        ROOM_URL=$(echo "$LINK_LINE_CONTENT" | sed 's/ROOM_LINK_PUBLIC://')
        SUCCESS_OUTPUT="SUCCESS LINK:${ROOM_URL} PID:${SALA_PID}"
        log_this "SUCESSO! Link encontrado: ${ROOM_URL}, PID: ${SALA_PID}"
        break 
    fi

    SALA_JS_ERROR_LINE=$(grep -m 1 "ERROR_CREATING_ROOM:" "$SALA_JS_FULL_LOG_FILE")
    if [[ -n "$SALA_JS_ERROR_LINE" ]]; then
        ERROR_MESSAGE=$(echo "$SALA_JS_ERROR_LINE" | sed 's/ERROR_CREATING_ROOM://')
        ERROR_OUTPUT="ERROR:${ERROR_MESSAGE}"
        log_this "ERRO do sala.js detectado: ${ERROR_MESSAGE}. PID ${SALA_PID} será terminado se estiver ativo."
        kill $SALA_PID > /dev/null 2>&1
        log_this "Comando kill $SALA_PID enviado."
        break 
    fi
    sleep 1 
    POLL_DURATION=$((POLL_DURATION + 1))
    log_this "Aguardando output do sala.js (Loop: ${POLL_DURATION}/${MAX_POLL_SECONDS}s)..."
done

if [[ -n "$SUCCESS_OUTPUT" ]]; then
    echo "$SUCCESS_OUTPUT" 
    log_this "Output para bot: $SUCCESS_OUTPUT"
    exit 0
elif [[ -n "$ERROR_OUTPUT" ]]; then
    echo "$ERROR_OUTPUT" 
    log_this "Output para bot: $ERROR_OUTPUT"
    exit 1
else
    log_this "ERRO: Timeout ($MAX_POLL_SECONDS s) esperando output do sala.js (PID $SALA_PID). Verifique ${SALA_JS_FULL_LOG_FILE}."
    echo "ERROR:Timeout_no_createRoom_aguardando_sala.js_output"
    if ps -p $SALA_PID > /dev/null; then
       log_this "Processo sala.js (PID $SALA_PID) ainda está ativo. Tentando matar..."
       kill $SALA_PID > /dev/null 2>&1; sleep 1
       if ps -p $SALA_PID > /dev/null; then log_this "Ainda ativo. Tentando kill -9..."; kill -9 $SALA_PID > /dev/null 2>&1; else log_this "Terminado."; fi
    else log_this "Processo sala.js (PID $SALA_PID) não encontrado ou já terminado."; fi
    exit 1
fi