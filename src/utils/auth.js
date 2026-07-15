function decodeJwtPayload(token) {
  try {
    const encodedPayload = token.split('.')[1];

    if (!encodedPayload) {
      return null;
    }

    const base64 = encodedPayload
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(Math.ceil(encodedPayload.length / 4) * 4, '=');
    const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));

    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

export function getTokenRole(token) {
  const role = decodeJwtPayload(token)?.role;

  return typeof role === 'string' ? role.replace(/^ROLE_/, '').toUpperCase() : '';
}

export function isAdminToken(token) {
  return getTokenRole(token) === 'ADMIN';
}
