import type { CommunicationChannel, CommunicationStatus } from "@prisma/client";
import { buildWhatsAppUrl, toWhatsAppNumber } from "@/modules/communications/lib/whatsapp";

export type PreparedOutbound = {
  channel: CommunicationChannel;
  status: Extract<CommunicationStatus, "PREPARED">;
  recipient: string;
  body: string;
  externalId: string;
  claimedSent: false;
};

export interface CommunicationProvider {
  readonly channel: CommunicationChannel;
  prepare(input: { recipient: string; body: string }): PreparedOutbound;
}

class ManualWhatsAppProvider implements CommunicationProvider {
  readonly channel = "WHATSAPP" as const;

  prepare(input: { recipient: string; body: string }): PreparedOutbound {
    const phone = toWhatsAppNumber(input.recipient);
    if (!phone) {
      throw new Error("Número de WhatsApp inválido");
    }
    return {
      channel: "WHATSAPP",
      status: "PREPARED",
      recipient: phone,
      body: input.body,
      externalId: buildWhatsAppUrl(phone, input.body),
      claimedSent: false,
    };
  }
}

export function getCommunicationProvider(
  channel: CommunicationChannel,
): CommunicationProvider {
  if (channel === "WHATSAPP") {
    return new ManualWhatsAppProvider();
  }
  throw new Error("Canal ainda não suportado nesta fase");
}
