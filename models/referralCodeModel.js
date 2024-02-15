const mongoose = require("mongoose");

const referralSchema = mongoose.Schema(
  {  
    referralBonus: {
      type: Number,
      required: true,
    },
    signUpBonus: {
      type: Number,
      required: true,
    },
  },
  {
    capped: { size: 1024, max: 1 },
  }
);

module.exports = mongoose.model("Referral", referralSchema);
