import { useState, useCallback } from 'react'

export function useForm(initialValues, validationRules = {}) {
  const [values, setValues]   = useState(initialValues)
  const [errors, setErrors]   = useState({})
  const [touched, setTouched] = useState({})

  const validate = useCallback((fieldValues = values) => {
    const newErrors = {}
    Object.entries(validationRules).forEach(([field, rules]) => {
      const value = fieldValues[field]
      for (const rule of rules) {
        const error = rule(value, fieldValues)
        if (error) { newErrors[field] = error; break }
      }
    })
    return newErrors
  }, [values, validationRules])

  const handleChange = useCallback((e) => {
    const { name, value } = e.target
    setValues(prev => ({ ...prev, [name]: value }))
    // Validacija inline dok korisnik piše (samo za touched polja)
    if (touched[name]) {
      setErrors(prev => {
        const updated = { ...prev }
        const newVals = { ...values, [name]: value }
        const fieldErrors = validate(newVals)
        if (fieldErrors[name]) updated[name] = fieldErrors[name]
        else delete updated[name]
        return updated
      })
    }
  }, [touched, values, validate])

  const handleBlur = useCallback((e) => {
    const { name } = e.target
    setTouched(prev => ({ ...prev, [name]: true }))
    const fieldErrors = validate()
    setErrors(prev => {
      const updated = { ...prev }
      if (fieldErrors[name]) updated[name] = fieldErrors[name]
      else delete updated[name]
      return updated
    })
  }, [validate])

  const handleSubmit = useCallback((onSubmit) => (e) => {
    e.preventDefault()
    const allTouched = Object.keys(values).reduce((acc, k) => ({ ...acc, [k]: true }), {})
    setTouched(allTouched)
    const newErrors = validate()
    setErrors(newErrors)
    if (Object.keys(newErrors).length === 0) onSubmit(values)
  }, [values, validate])

  const reset = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  const setFieldValue = useCallback((name, value) => {
    setValues(prev => ({ ...prev, [name]: value }))
  }, [])

  return {
    values, errors, touched,
    handleChange, handleBlur, handleSubmit,
    reset, setFieldValue,
    isValid: Object.keys(validate()).length === 0,
  }
}