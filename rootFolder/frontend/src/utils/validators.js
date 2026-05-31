// Svaki validator vraća string s greškom ili undefined ako je OK

export const required = (msg = 'Ovo polje je obavezno.') =>
  (val) => (!val || !String(val).trim()) ? msg : undefined

export const minLength = (n, msg) =>
  (val) => val && val.length < n ? (msg || `Minimum ${n} karaktera.`) : undefined

export const maxLength = (n, msg) =>
  (val) => val && val.length > n ? (msg || `Maksimum ${n} karaktera.`) : undefined

export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
export const validEmail = (msg = 'Unesite ispravnu email adresu.') =>
  (val) => val && !emailRegex.test(val) ? msg : undefined

export const matchField = (fieldName, label, msg) =>
  (val, allValues) =>
    val !== allValues[fieldName]
      ? (msg || `Mora odgovarati polju "${label}".`)
      : undefined

export const minValue = (n, msg) =>
  (val) => val !== '' && Number(val) < n ? (msg || `Minimum je ${n}.`) : undefined

export const maxValue = (n, msg) =>
  (val) => val !== '' && Number(val) > n ? (msg || `Maksimum je ${n}.`) : undefined

export const isNumber = (msg = 'Unesite broj.') =>
  (val) => val !== '' && isNaN(Number(val)) ? msg : undefined

export const noSpaces = (msg = 'Ne smije sadržavati razmake.') =>
  (val) => val && /\s/.test(val) ? msg : undefined