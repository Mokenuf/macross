interface RevalidatableForm {
  errors: { name?: string }[]
  validate: (opts: { name?: string[]; silent?: boolean }) => unknown
}

// UForm cachea los mensajes de error como strings al validar; al togglear idioma no se re-traducen
// solos. Re-validar los campos ya errados con silent regenera el mensaje sin tocar los intactos.
// getForm es `unknown` y casteamos adentro: el validate genérico de UForm (name = keys del schema)
// no es asignable a una interfaz con name: string[]. Tipar el param fuerte rompe el typecheck.
export function useRevalidateOnLocale(getForm: () => unknown) {
  const { locale } = useI18n()

  watch(locale, () => {
    const form = getForm() as RevalidatableForm | null
    if (!form) return
    const names = form.errors.map(e => e.name).filter((name): name is string => Boolean(name))
    if (names.length) form.validate({ name: names, silent: true })
  })
}
