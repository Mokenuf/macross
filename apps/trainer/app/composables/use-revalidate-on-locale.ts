interface RevalidatableForm {
  errors: { name?: string }[]
  validate: (opts: { name?: string[]; silent?: boolean }) => unknown
}

// UForm cachea los mensajes de error como strings al validar; al togglear idioma no se re-traducen
// solos. Re-validar los campos ya errados con silent regenera el mensaje sin tocar los intactos.
export function useRevalidateOnLocale(getForm: () => RevalidatableForm | null) {
  const { locale } = useI18n()

  watch(locale, () => {
    const form = getForm()
    const names = form?.errors.map(e => e.name).filter((name): name is string => Boolean(name))
    if (names?.length) form.validate({ name: names, silent: true })
  })
}
