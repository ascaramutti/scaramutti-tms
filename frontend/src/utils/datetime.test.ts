import { describe, it, expect } from 'vitest';
import { toDatetimeLocalInput, fromDatetimeLocalInput } from './datetime';

// Las aserciones se construyen con `new Date(anio, mes, dia, hora, minuto)`, que
// es hora local por definición. Así los casos valen en cualquier zona horaria y
// no dependen de dónde corra el test.

describe('fromDatetimeLocalInput', () => {
    it('interpreta el valor del input como hora local y lo manda como instante UTC', () => {
        const expected = new Date(2026, 7, 5, 19, 27).toISOString();

        expect(fromDatetimeLocalInput('2026-08-05T19:27')).toBe(expected);
    });

    it('devuelve un ISO con zona, que es lo que el modal perdía', () => {
        expect(fromDatetimeLocalInput('2026-08-05T19:27')).toMatch(/Z$/);
    });

    it('tolera el valor con segundos que emite el input en algunos navegadores', () => {
        const expected = new Date(2026, 7, 5, 19, 27).toISOString();

        expect(fromDatetimeLocalInput('2026-08-05T19:27:00')).toBe(expected);
    });

    it('devuelve vacío si el campo está vacío', () => {
        expect(fromDatetimeLocalInput('')).toBe('');
    });

    it('devuelve vacío si el valor no es una fecha', () => {
        expect(fromDatetimeLocalInput('no es una fecha')).toBe('');
    });
});

describe('toDatetimeLocalInput', () => {
    it('convierte el instante a la hora local que el input espera', () => {
        const iso = new Date(2026, 7, 5, 5, 22).toISOString();

        expect(toDatetimeLocalInput(iso)).toBe('2026-08-05T05:22');
    });

    it('descarta los milisegundos y la zona, que el input no acepta', () => {
        const iso = new Date(2026, 1, 21, 5, 24).toISOString();

        expect(toDatetimeLocalInput(iso)).toBe('2026-02-21T05:24');
    });

    it('devuelve vacío si el valor no es una fecha', () => {
        expect(toDatetimeLocalInput('')).toBe('');
    });
});

describe('ida y vuelta', () => {
    it('no altera el valor que escribió el usuario', () => {
        const typed = '2026-08-05T19:27';

        expect(toDatetimeLocalInput(fromDatetimeLocalInput(typed))).toBe(typed);
    });

    it('sostiene el cruce de medianoche, que es donde el bug cambiaba el día', () => {
        const typed = '2026-08-05T23:59';

        expect(toDatetimeLocalInput(fromDatetimeLocalInput(typed))).toBe(typed);
    });

    it('sostiene el primer minuto del día', () => {
        const typed = '2026-08-06T00:00';

        expect(toDatetimeLocalInput(fromDatetimeLocalInput(typed))).toBe(typed);
    });
});
