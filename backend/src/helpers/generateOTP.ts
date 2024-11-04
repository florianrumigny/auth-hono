import crypto from "crypto";

// Generate the code to send with Resend ?
export const generateCode = (): string => {
  const buffer = crypto.randomBytes(4);

  const value = buffer.readUInt32BE(0) % 1000000;

  // padStart permet d'ajouter des 0 si value ne fait pas 6 chiffres
  return value.toString().padStart(6, "0");
};
