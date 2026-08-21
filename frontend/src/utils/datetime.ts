/**
 * Conversión entre el valor de un `<input type="datetime-local">` y el ISO 8601
 * que viaja al API.
 *
 * El input siempre interpreta y emite hora local del navegador, sin zona. El API
 * y la base guardan instantes con zona (`TIMESTAMPTZ`). Pasar el string de un
 * lado al otro sin convertir corre el dato tantas horas como diga el offset
 * local: en Perú, cinco.
 */

/** Instante en ISO 8601 → `YYYY-MM-DDTHH:mm` en hora local, para el input. */
export function toDatetimeLocalInput(iso: string): string {
    const instant = new Date(iso);
    if (Number.isNaN(instant.getTime())) return '';

    const shifted = new Date(instant.getTime() - instant.getTimezoneOffset() * 60000);
    return shifted.toISOString().slice(0, 16);
}

/** `YYYY-MM-DDTHH:mm` en hora local → instante en ISO 8601 (UTC), para el API. */
export function fromDatetimeLocalInput(localValue: string): string {
    if (!localValue) return '';

    const instant = new Date(localValue);
    if (Number.isNaN(instant.getTime())) return '';

    return instant.toISOString();
}
