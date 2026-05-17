import { jwtDecode } from 'jwt-decode'

type JwtPayload = {
  email?: string
  unique_name?: string
  sub?: string
  nameid?: string
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'?: string
}

export const getUserIdFromToken = (token: string | null): number | null => {
  if (!token) return null

  try {
    const decoded = jwtDecode<JwtPayload>(token)
    const idRaw =
      decoded.nameid ||
      decoded.sub ||
      decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier']

    if (!idRaw) return null
    const id = Number(idRaw)
    return Number.isNaN(id) ? null : id
  } catch {
    return null
  }
}
