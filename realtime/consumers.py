import uuid
import logging
from collections import defaultdict
from channels.generic.websocket import WebsocketConsumer
from coflux.db import get_connection

MSG_SYNC = 0
MSG_AWARENESS = 1

SYNC_STEP_1 = 0
SYNC_STEP_2 = 1
SYNC_UPDATE = 2

rooms = defaultdict(set)
doc_states = {}
logging.basicConfig(level=logging.INFO)


def _load_state_from_db(doc_name: str):
    parts = doc_name.split("_", 1)
    if len(parts) < 2:
        return None

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT state FROM DocumentState WHERE workspaceId = %s AND filename = %s",
                (parts[0], parts[1]),
            )
            row = cur.fetchone()
            return bytes(row["state"]) if row and row["state"] else None
    finally:
        conn.close()


def _save_state_to_db(doc_name: str, state: bytes):
    parts = doc_name.split("_", 1)
    if len(parts) < 2:
        return

    conn = get_connection()
    try:
        with conn.cursor() as cur:
            cur.execute(
                """INSERT INTO DocumentState (id, workspaceId, filename, state, createdAt, updatedAt)
                   VALUES (%s, %s, %s, %s, NOW(), NOW())
                   ON DUPLICATE KEY UPDATE state = VALUES(state), updatedAt = NOW()""",
                (str(uuid.uuid4()), parts[0], parts[1], state),
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


class YjsConsumer(WebsocketConsumer):
    """WebSocket consumer that handles Yjs sync and awareness protocol."""

    def connect(self):
        self.doc_name = self.scope["url_route"]["kwargs"]["doc_name"]
        rooms[self.doc_name].add(self)

        # Load state from DB when first client connects
        if len(rooms[self.doc_name]) == 1:
            stored = _load_state_from_db(self.doc_name)
            if stored:
                doc_states[self.doc_name] = bytearray(stored)

        self.accept()

    def disconnect(self, close_code):
        rooms[self.doc_name].discard(self)
        if len(rooms[self.doc_name]) == 0:
            state = doc_states.pop(self.doc_name, None)
            if state:
                _save_state_to_db(self.doc_name, bytes(state))
                logging.info(f"Saved state for {self.doc_name}")

    def receive(self, text_data=None, bytes_data=None):
        if not bytes_data or len(bytes_data) == 0:
            return

        msg_type = bytes_data[0]

        if msg_type == MSG_SYNC:
            if len(bytes_data) < 2:
                return
            sync_type = bytes_data[1]

            if sync_type == SYNC_STEP_1:
                stored = doc_states.get(self.doc_name)
                if stored:
                    response = bytearray([MSG_SYNC, SYNC_STEP_2])
                    response.extend(_encode_var_uint(len(stored)))
                    response.extend(stored)
                    self.send(bytes_data=bytes(response))

            elif sync_type in (SYNC_STEP_2, SYNC_UPDATE):
                update_data = bytes_data[2:]
                if update_data:
                    doc_states[self.doc_name] = bytearray(update_data)
                for peer in rooms[self.doc_name]:
                    if peer != self:
                        peer.send(bytes_data=bytes_data)

        elif msg_type == MSG_AWARENESS:
            for peer in rooms[self.doc_name]:
                if peer != self:
                    peer.send(bytes_data=bytes_data)
        else:
            for peer in rooms[self.doc_name]:
                if peer != self:
                    peer.send(bytes_data=bytes_data)
