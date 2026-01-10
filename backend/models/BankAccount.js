import mongoose from "mongoose";
import crypto from "crypto";

const bankAccountSchema = new mongoose.Schema(
  {
    bankName: {
      type: String,
      required: [true, "Please enter bank name"],
    },
    accountNumber: {
      type: String,
      required: [true, "Please enter account number"],
    },
    accountType: {
      type: String,
      enum: ["Savings", "Current", "Overdraft", "Loan"],
      default: "Savings",
    },
    branch: {
      type: String,
      default: "",
    },
    ifsc: {
      type: String,
      required: [true, "Please enter IFSC code"],
    },
    openingBalance: {
      type: Number,
      default: 0,
    },
    currentBalance: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    transactions: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "CashbankTransaction",
    }],
  },
  { timestamps: true }
);

// Encrypt account number before save
bankAccountSchema.pre("save", function (next) {
  if (!this.isModified("accountNumber")) return next();

  // Use a proper 32-byte key derived from secret
  const algorithm = "aes-256-cbc";
  // Ensure the key is 32 bytes (256 bits)
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || "defaultkey_must_be_long_enough", "salt", 32);
  const iv = crypto.randomBytes(16);

  // Use createCipheriv instead of createCipher
  const cipher = crypto.createCipheriv(algorithm, key, iv);
  let encrypted = cipher.update(this.accountNumber, "utf8", "hex");
  encrypted += cipher.final("hex");

  // Store IV : EncryptedData
  this.accountNumber = iv.toString("hex") + ":" + encrypted;
  next();
});

/**
 * Decrypts the account number using AES-256-CBC.
 * Requires ENCRYPTION_KEY environment variable.
 */
// Decrypt account number
bankAccountSchema.methods.getDecryptedAccountNumber = function () {
  const parts = this.accountNumber.split(":");
  // Check if we have both IV and data (legacy support check could go here if needed)
  if (parts.length < 2) return this.accountNumber;

  const iv = Buffer.from(parts[0], "hex");
  const encrypted = parts[1];
  const algorithm = "aes-256-cbc";
  const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || "defaultkey_must_be_long_enough", "salt", 32);

  // Use createDecipheriv instead of createDecipher
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
};

const BankAccount = mongoose.model("BankAccount", bankAccountSchema);
export default BankAccount;