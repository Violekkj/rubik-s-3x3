import { FormattedTime, PenaltyType, TimerPrecision } from './types';

export class TimeFormatter {
  /**
   * Formata milissegundos segundo as regras oficiais da WCA (Artigo 9f1 - truncamento)
   */
  public static format(
    timeMs: number,
    penalty: PenaltyType = 'none',
    precision: TimerPrecision = 'hundredths'
  ): FormattedTime {
    if (penalty === 'dnf') {
      return {
        display: 'DNF',
        seconds: 0,
        fraction: 0,
        penalty: 'dnf',
        isEffectiveDnf: true,
      };
    }

    const effectiveMs = penalty === 'plus2' ? timeMs + 2000 : timeMs;
    const isThousandths = precision === 'thousandths';

    const totalSeconds = Math.floor(effectiveMs / 1000);
    const msRemainder = effectiveMs % 1000;

    // Regra WCA: centésimos são truncados (Math.floor(ms / 10)), não arredondados
    const fraction = isThousandths
      ? Math.floor(msRemainder)
      : Math.floor(msRemainder / 10);

    const fractionStr = isThousandths
      ? fraction.toString().padStart(3, '0')
      : fraction.toString().padStart(2, '0');

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let display = '';
    if (hours > 0) {
      const minStr = minutes.toString().padStart(2, '0');
      const secStr = seconds.toString().padStart(2, '0');
      display = `${hours}:${minStr}:${secStr}.${fractionStr}`;
    } else if (minutes > 0) {
      const secStr = seconds.toString().padStart(2, '0');
      display = `${minutes}:${secStr}.${fractionStr}`;
    } else {
      display = `${seconds}.${fractionStr}`;
    }

    if (penalty === 'plus2') {
      display += '+';
    }

    return {
      display,
      hours: hours > 0 ? hours : undefined,
      minutes: minutes > 0 ? minutes : undefined,
      seconds,
      fraction,
      penalty,
      isEffectiveDnf: false,
    };
  }

  /**
   * Converte strings de tempo manual para milissegundos
   * Exemplos suportados:
   * - "12.34" -> 12340 ms
   * - "1234" -> 12340 ms (estilo Stackmat)
   * - "1:02.34" -> 62340 ms
   * - "1:02:03.45" -> 3723450 ms
   * - "12,34" -> 12340 ms (vírgula decimal)
   */
  public static parseManualTime(input: string): { timeMs: number; error?: string } {
    if (!input || input.trim().length === 0) {
      return { timeMs: 0, error: 'Tempo não pode ser vazio' };
    }

    const cleaned = input.trim().replace(',', '.');

    // Caso 1: Digitação numérica contínua (ex: "1234" -> 12.34s)
    if (/^\d+$/.test(cleaned)) {
      const num = parseInt(cleaned, 10);
      if (num < 100) {
        // Ex: "9" -> 9000 ms, "42" -> 42000 ms
        return { timeMs: num * 1000 };
      }
      // Últimos 2 dígitos são centésimos
      const seconds = Math.floor(num / 100);
      const hundredths = num % 100;
      return { timeMs: seconds * 1000 + hundredths * 10 };
    }

    // Caso 2: Formato com pontos e dois pontos (ex: 12.34, 1:23.45, 1:02:03.45)
    const colonParts = cleaned.split(':');

    if (colonParts.length === 1) {
      // Formato "ss.cc" ou "ss.ccc"
      const val = parseFloat(colonParts[0]);
      if (isNaN(val) || val < 0) return { timeMs: 0, error: 'Formato inválido' };
      return { timeMs: Math.round(val * 1000) };
    } else if (colonParts.length === 2) {
      // Formato "m:ss.cc"
      const mins = parseInt(colonParts[0], 10);
      const secs = parseFloat(colonParts[1]);
      if (isNaN(mins) || isNaN(secs) || mins < 0 || secs < 0 || secs >= 60) {
        return { timeMs: 0, error: 'Minutos ou segundos inválidos' };
      }
      return { timeMs: Math.round(mins * 60000 + secs * 1000) };
    } else if (colonParts.length === 3) {
      // Formato "h:mm:ss.cc"
      const hours = parseInt(colonParts[0], 10);
      const mins = parseInt(colonParts[1], 10);
      const secs = parseFloat(colonParts[2]);
      if (
        isNaN(hours) ||
        isNaN(mins) ||
        isNaN(secs) ||
        hours < 0 ||
        mins < 0 ||
        mins >= 60 ||
        secs < 0 ||
        secs >= 60
      ) {
        return { timeMs: 0, error: 'Horas, minutos ou segundos inválidos' };
      }
      return { timeMs: Math.round(hours * 3600000 + mins * 60000 + secs * 1000) };
    }

    return { timeMs: 0, error: 'Formato de tempo inválido' };
  }
}
