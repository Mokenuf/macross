import { format } from 'date-fns'
import { enUS, es } from 'date-fns/locale'

const dateFnsLocales = { es, en: enUS }

export function useFormatDate() {
  const { locale } = useI18n()

  // 'P' = fecha corta localizada: el orden se adapta al idioma (es → dd/MM/yyyy, en → MM/dd/yyyy).
  function formatDate(date: string | Date, pattern = 'P') {
    const dateFnsLocale = dateFnsLocales[locale.value as keyof typeof dateFnsLocales] ?? es
    return format(new Date(date), pattern, { locale: dateFnsLocale })
  }

  return { formatDate }
}
