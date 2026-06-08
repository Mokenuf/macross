# Email templates de Supabase Auth

Copias versionadas de los templates de mail que usa **Supabase Auth**. Son la **fuente de verdad** del repo, pero Supabase los lee desde el **dashboard**, no desde acá.

## ⚠️ No hay sync automático

Estos archivos **no se despliegan ni se sincronizan solos**. El contenido real lo sirve Supabase desde su dashboard:

**Supabase → Authentication → Emails → Templates**

> Si editás un template en el dashboard, **actualizá el archivo de acá también** (y viceversa). Si no, divergen y el repo deja de ser confiable.

| Archivo       | Template en Supabase |
| ------------- | -------------------- |
| `invite.html` | Invite user          |

El template de invite lo reciben **tanto trainers como clients** (Supabase tiene un único "Invite user"), por eso el copy es genérico. Lo que cambia entre uno y otro es el `redirectTo` que cada endpoint le pasa a `inviteUserByEmail` (define a qué app cae el `{{ .ConfirmationURL }}`), no el template.

## Envío de mails: Brevo (SMTP custom)

El mailer interno de Supabase limita a ~2 mails/hora, inviable para testear. Está configurado **Brevo como SMTP custom**:

- Credenciales SMTP cargadas en **Supabase → Authentication → Emails → SMTP Settings** (Host `smtp-relay.brevo.com`, Port `587`, Username = login de Brevo, Password = SMTP key).
- **Las credenciales viven en el dashboard de Supabase, NO en el `.env` de las apps.** No agregar env vars de Brevo al proyecto Nuxt.
- Rate limit de auth subido en **Authentication → Rate Limits** (~30/h) — activar SMTP custom solo no alcanza, ese límite es aparte.
- Sender verificado: `macrosforprogress@hotmail.com`.

## Deuda técnica conocida

- **Entregabilidad degradada**: con un sender freemail (hotmail) sin dominio propio, Brevo reescribe el `From` a su subdominio (`*.brevosend.com`) y los mails suelen caer en **spam/promociones**. Aceptable para testing (Seba + Fran).
- **Antes de onboarding real**: comprar dominio propio, autenticarlo en Brevo y configurar **DKIM/SPF/DMARC**. Recién ahí el `From` queda limpio y mejora la entregabilidad.

## Notas de edición (gotchas del motor)

Supabase usa el motor `html/template` de **Go**, más estricto que un browser:

- **HTML balanceado obligatorio**: un solo tag/comilla sin cerrar tira `ends in a non-text context` al enviar (no al guardar). El `{{ }}` que queda "adentro" de un tag abierto es el síntoma típico.
- **Solo variables Go**: `{{ .ConfirmationURL }}`, `{{ .Email }}`, `{{ .SiteURL }}`, etc. **No** sirve sintaxis Handlebars (`{{#each}}`, `{{var}}`).
- **El Subject también es un template**: si le metés un `<` se rompe igual que el body.
- **Propagación con lag**: tras guardar en el dashboard, el cambio tarda unos segundos/minutos en tomar. Hacé F5 para confirmar que el textarea persistió el cambio, esperá un toque y reintentá.
