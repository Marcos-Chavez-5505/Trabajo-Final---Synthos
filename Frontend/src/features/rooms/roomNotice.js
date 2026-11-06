// Aviso que se muestra al volver al listado de salas (salida propia, sala cerrada
// al salir). Va en `sessionStorage` porque la redirección cambia la ruta.
//
// Los eventos que ocurren *dentro* de la sala (te expulsaron, se cerró mientras
// estabas) se muestran con un modal en `RoomView` y no usan esta clave, para
// evitar que el mensaje quede pegado y aparezca en otra sala al navegar.
export const ROOM_NOTICE_KEY = "synthos_room_notice";

export function readRoomNotice() {
  try {
    return sessionStorage.getItem(ROOM_NOTICE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function writeRoomNotice(message) {
  try {
    sessionStorage.setItem(ROOM_NOTICE_KEY, message);
  } catch {
    // Si sessionStorage no está disponible, no bloqueamos la navegación.
  }
}

export function clearRoomNotice() {
  try {
    sessionStorage.removeItem(ROOM_NOTICE_KEY);
  } catch {
    // noop
  }
}
