export interface CompanySettings {
  company_name: string
  street: string
  zip: string
  city: string
  canton: string
  country: string
  phone: string
  email: string
  website: string
  uid_number?: string
  owner_name?: string
}

export function useCompanySettings() {
  return useFetch<CompanySettings>('/api/settings', {
    key: 'company-settings',
    default: () => ({
      company_name: 'PreSecurity',
      street: '',
      zip: '',
      city: '',
      canton: 'Zürich',
      country: 'Schweiz',
      phone: '',
      email: '',
      website: '',
    }),
  })
}
