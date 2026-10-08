import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env") });

export const config = {
  port: parseInt(process.env.PORT || "3001", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "file:./dev.db",
  corsOrigin: process.env.CORS_ORIGIN || "http://localhost:5173",
  algorand: {
    network: process.env.ALGORAND_NETWORK || "Algorand Testnet",
    algodServer: process.env.ALGORAND_ALGOD_SERVER || "https://testnet-api.algonode.cloud",
    algodPort: parseInt(process.env.ALGORAND_ALGOD_PORT || "443", 10),
    algodToken: process.env.ALGORAND_ALGOD_TOKEN || "",
    receiverAddress: process.env.ALGORAND_RECEIVER_ADDRESS || "N6XXQ7W4KG7ANHYNIFQLRYOPAHIMZ2ZTYITCXUMHL7YFB2646NPCGB2U6Q",
    usdcAssetId: parseInt(process.env.ALGORAND_USDC_ASSET_ID || "10458941", 10),
  },
} as const;
