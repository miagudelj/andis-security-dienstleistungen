import { isAuthenticated } from '~~/server/utils/auth'

export default defineEventHandler((event) => {
  return { authenticated: isAuthenticated(event) }
})
