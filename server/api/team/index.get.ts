import { useDB } from '~~/server/utils/db'

export default defineEventHandler(() => {
  return useDB()
    .prepare('SELECT * FROM team_members WHERE active = 1 ORDER BY sort_order ASC, id ASC')
    .all()
})
