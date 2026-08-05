import uuid
import logging
from collections import defaultdict
from db import get_connection

MSG_SYNC = 0
MSG_AWARENESS = 1

SYNC_STEP_1 = 0
SYNC_STEP_2 = 1
SYNC_UPDATE = 2

rooms = defaultdict(set)
doc_states = {}
logging.basicConfig(level=logging.INFO)

def _load_state_from_db(doc_name: str) -> bytes:
    parts = doc_name.split("_", 1)
    if len(parts) < 2: return None
    
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT state FROM DocumentState WHERE workspaceId = %s AND filename = %s", (parts[0], parts[1]))
            row = cur.fetchone()
            return bytes(row["state"]) if row and row["state"] else None
    finally:
        conn.close()

def _save_state_to_db(doc_name: str, state: bytes):
    parts = doc_name.split("_", 1)
    if len(parts) < 2: return
    
    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO DocumentState (id, workspaceId, filename, state, createdAt, updatedAt)
                   VALUES (%s, %s, %s, %s, NOW(), NOW())
                   ON DUPLICATE KEY UPDATE state = VALUES(state), updatedAt = NOW()""",
                (str(uuid.uuid4()), parts[0], parts[1], state)
            )
    finally:
        conn.close()

def _encode_var_uint(num: int) -> bytes:
    buf = bytearray()
    while num > 0x7F:
        buf.append(0x80 | (num & 0x7F))
        num >>= 7
    buf.append(num & 0x7F)
    return bytes(buf)

def register_websockets(sock):
    @sock.route('/<path:doc_name>')
    def ws_handler(ws, doc_name):
        rooms[doc_name].add(ws)
        
        if len(rooms[doc_name]) == 1:
            stored = _load_state_from_db(doc_name)
            if stored:
                doc_states[doc_name] = bytearray(stored)
                
        try:
            while True:
                message = ws.receive()
                if not message:
                    continue
                if isinstance(message, str):
                    continue
                if len(message) == 0:
                    continue
                    
                msg_type = message[0]
                if msg_type == MSG_SYNC:
                    if len(message) < 2: continue
                    sync_type = message[1]
                    
                    if sync_type == SYNC_STEP_1:
                        stored = doc_states.get(doc_name)
                        if stored:
                            response = bytearray([MSG_SYNC, SYNC_STEP_2])
                            response.extend(_encode_var_uint(len(stored)))
                            response.extend(stored)
                            ws.send(bytes(response))
                    elif sync_type in (SYNC_STEP_2, SYNC_UPDATE):
                        update_data = message[2:]
                        if update_data:
                            doc_states[doc_name] = bytearray(update_data)
                        for peer in rooms[doc_name]:
                            if peer != ws:
                                peer.send(message)
                elif msg_type == MSG_AWARENESS:
                    for peer in rooms[doc_name]:
                        if peer != ws:
                            peer.send(message)
                else:
                    for peer in rooms[doc_name]:
                        if peer != ws:
                            peer.send(message)
                            
        except Exception as e:
            pass
        finally:
            rooms[doc_name].discard(ws)
            if len(rooms[doc_name]) == 0:
                state = doc_states.pop(doc_name, None)
                if state:
                    _save_state_to_db(doc_name, bytes(state))
                    logging.info(f"Saved state for {doc_name}")
