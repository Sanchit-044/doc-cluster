import {prisma} from "../config"

async function setupOTPCleanup() {
    await prisma.$executeRaw`
      CREATE OR REPLACE FUNCTION cleanup_expired_otps()
      RETURNS void AS $$
      BEGIN
        DELETE FROM "OTP" WHERE "expiresAt" < NOW();
      END;
      $$ LANGUAGE plpgsql;
    `;

    setInterval(async () => {
      try {
        await prisma.$executeRaw`SELECT cleanup_expired_otps();`;
      } catch (error) {
        console.error('OTP cleanup failed:', error);
      }
    }, 60000); 
  }

export default setupOTPCleanup;