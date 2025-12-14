import mongoose from "mongoose";

const wholesalerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    contact: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      default: "",
    },
    itemsSupplied: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Item",
      },
    ],
  },
  { timestamps: true }
);

const Wholesaler = mongoose.model("Wholesaler", wholesalerSchema);
export default Wholesaler;
