const TRANSLATABLE_FIELDS = [
  "name",
  "shortName",
  "category",
  "description",
  "story",
  "storyTitle",
  "badge",
  "ingredients",
  "usage",
  "shelfLife",
  "storage",
  "note",
  "saleLabel",
  "saleNote",
];

// Overlays "<field>_en" onto "<field>" for display when locale is "en" and a
// translation exists. Falls back to the original (Vietnamese) value otherwise,
// so untranslated products never render blank. Does not touch id/slug or any
// field used for matching/filtering logic.
export function localizeProduct(product, locale) {
  if (!product || locale !== "en") return product;

  const localized = { ...product };
  for (const field of TRANSLATABLE_FIELDS) {
    const enValue = product[`${field}_en`];
    if (enValue) {
      localized[field] = enValue;
    }
  }

  if (Array.isArray(product.variants) && product.variants.length > 0) {
    localized.variants = product.variants.map((variant) =>
      variant?.label_en ? { ...variant, label: variant.label_en } : variant
    );
  }

  return localized;
}

export function localizeProducts(productList, locale) {
  return (productList || []).map((product) => localizeProduct(product, locale));
}
