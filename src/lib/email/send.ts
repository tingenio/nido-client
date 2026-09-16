import "server-only";

import { SendEmailCommand } from "@aws-sdk/client-sesv2";

import { getSesClient, getSesFromAddress } from "./ses";

/**
 * Envía un correo vía SES. Nunca lanza: los envíos son un efecto secundario
 * de acciones de negocio (crear tarea, verificar tarea, etc.) y un fallo de
 * SES no debe romper esa acción. En caso de error, solo se loguea.
 */
export async function sendEmail(input: { to: string | string[]; subject: string; html: string }) {
  const toAddresses = Array.isArray(input.to) ? input.to : [input.to];
  if (toAddresses.length === 0) return;

  try {
    await getSesClient().send(
      new SendEmailCommand({
        FromEmailAddress: getSesFromAddress(),
        Destination: { ToAddresses: toAddresses },
        Content: {
          Simple: {
            Subject: { Data: input.subject, Charset: "UTF-8" },
            Body: { Html: { Data: input.html, Charset: "UTF-8" } },
          },
        },
      }),
    );
  } catch (error) {
    console.error("[email] No se pudo enviar el correo:", error);
  }
}
