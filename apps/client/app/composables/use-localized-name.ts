type LocalizedEntity = { nameEs: string; nameEn: string | null }

export function useLocalizedName() {
  const { locale } = useI18n()

  const localizedText = (es: string | null, en: string | null) =>
    locale.value === 'en' ? (en ?? es) : es

  const localizedName = (entity: LocalizedEntity) =>
    localizedText(entity.nameEs, entity.nameEn) ?? ''

  return { localizedName, localizedText }
}
