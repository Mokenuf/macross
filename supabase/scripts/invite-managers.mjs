/* eslint-disable no-await-in-loop -- secuencial a proposito: invitar en paralelo pega contra el rate limit de mails de auth */
/* eslint-disable no-console -- es la salida de un script de CLI, no logging de app */
// Alta de las cuentas manager en un entorno remoto (produccion).
//
// Por que un script y no el seed.sql: local quiere determinismo y contrasenas
// conocidas; prod quiere que cada uno se ponga la suya por mail. Son necesidades
// distintas, no duplicacion. Y por que solo managers: una vez que existe uno,
// todo lo demas (trainers, clientes) se crea desde la UI de la app, que ademas
// ejercita el flow real.
//
// Por que `fetch` pelado y no supabase-js: la libreria entra en el monorepo solo
// como dep transitiva de @nuxtjs/supabase, asi que bajo el linkeo estricto de
// pnpm un script suelto no la puede importar. La API admin de GoTrue es REST.
//
// Uso (el roster va por argumentos, un manager por argumento):
//   SUPABASE_URL=... SUPABASE_SECRET_KEY=... NUXT_TRAINER_APP_URL=...
//   node supabase/scripts/invite-managers.mjs "mail@ejemplo.com:Nombre Completo"
//
// Idempotente: si el mail ya tiene usuario, saltea el invite y solo se asegura
// de la fila en `trainers`. Re-correrlo no manda mails de mas.

// El roster llega por argumentos y no hardcodeado: son mails de personas reales y
// el repo es publico. Formato: "email:Nombre Completo" (los mails no llevan ":").
const ROSTER = process.argv.slice(2).map(arg => {
  const sep = arg.indexOf(':')
  if (sep < 1 || sep === arg.length - 1) {
    console.error(`Argumento invalido: "${arg}". Formato esperado: email:Nombre Completo`)
    process.exit(1)
  }
  return { email: arg.slice(0, sep), fullName: arg.slice(sep + 1) }
})

if (ROSTER.length === 0) {
  console.error('Uso: node supabase/scripts/invite-managers.mjs "mail@ejemplo.com:Nombre" [...]')
  process.exit(1)
}

const { SUPABASE_URL, SUPABASE_SECRET_KEY, NUXT_TRAINER_APP_URL } = process.env

for (const [name, value] of Object.entries({
  SUPABASE_URL,
  SUPABASE_SECRET_KEY,
  NUXT_TRAINER_APP_URL,
})) {
  if (!value) {
    console.error(`Falta la env ${name}`)
    process.exit(1)
  }
}

const headers = {
  'Content-Type': 'application/json',
  apikey: SUPABASE_SECRET_KEY,
  Authorization: `Bearer ${SUPABASE_SECRET_KEY}`,
}

async function findUser(email) {
  const url = `${SUPABASE_URL}/auth/v1/admin/users?filter=${encodeURIComponent(email)}`
  const res = await fetch(url, { headers })
  if (!res.ok) throw new Error(`lookup de ${email}: ${res.status} ${await res.text()}`)
  const { users } = await res.json()
  return users?.find(u => u.email === email) ?? null
}

// El redirect_to define a que app cae el link del mail, igual que el
// `redirectTo` de inviteUserByEmail en los endpoints. Tiene que estar en la
// allow-list de Redirect URLs del proyecto o GoTrue lo ignora y manda al Site URL.
async function invite(email) {
  // La barra final en la env produciria `//auth/set-password`, que no matchea la
  // allow-list y manda el link al Site URL en silencio.
  const target = `${NUXT_TRAINER_APP_URL.replace(/\/+$/, '')}/auth/set-password`
  const url = `${SUPABASE_URL}/auth/v1/invite?redirect_to=${encodeURIComponent(target)}`
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify({ email }) })
  if (!res.ok) throw new Error(`invite de ${email}: ${res.status} ${await res.text()}`)
  return res.json()
}

// Rollback: sin la fila en `trainers` el usuario de auth queda huerfano y el
// guard de login lo rebota con 403. Mismo criterio que el endpoint de invite.
async function deleteUser(id) {
  await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${id}`, { method: 'DELETE', headers })
}

async function upsertTrainer(user, fullName) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/trainers?on_conflict=id`, {
    method: 'POST',
    headers: { ...headers, Prefer: 'resolution=merge-duplicates,return=representation' },
    body: JSON.stringify({ id: user.id, email: user.email, full_name: fullName, role: 'manager' }),
  })
  if (!res.ok)
    throw new Error(`insert en trainers de ${user.email}: ${res.status} ${await res.text()}`)
  return res.json()
}

for (const { email, fullName } of ROSTER) {
  try {
    let user = await findUser(email)
    const yaEstaba = Boolean(user)
    if (!user) user = await invite(email)

    try {
      await upsertTrainer(user, fullName)
    } catch (err) {
      if (!yaEstaba) await deleteUser(user.id)
      throw err
    }

    console.log(
      `${email} -> ${yaEstaba ? 'ya tenia usuario, fila de trainer asegurada' : 'invitado + manager'}`,
    )
  } catch (err) {
    console.error(`${email} -> FALLO: ${err.message}`)
    process.exitCode = 1
  }
}
