const User = require("../models/User");
const { Member, Domain } = require("../models/Member");

const seedAdmin = async () => {
  try {
    const adminEmail = process.env.DEFAULT_ADMIN_EMAIL?.trim();
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD?.trim();
    const adminName = process.env.DEFAULT_ADMIN_NAME?.trim() || "Main Admin";

    // If env vars not set, silently skip seeding
    if (!adminEmail || !adminPassword) return;

    /* -----------------------------
       1. Ensure CORE Domain
    ------------------------------ */
    let coreDomain = await Domain.findOne({ code: "CORE" });

    if (!coreDomain) {
      coreDomain = await Domain.create({
        name: "Core",
        code: "CORE",
        color: "#00FF00",
        description: "Core administrative and leadership domain",
      });
    }

    /* -----------------------------
       2. Ensure Admin User
       (DO NOT DELETE EXISTING USER)
    ------------------------------ */
    let adminUser = await User.findOne({ email: adminEmail });

    if (!adminUser) {
      adminUser = await User.create({
        name: adminName,
        email: adminEmail,
        password: adminPassword, // raw password (hashed by model hook)
        role: "admin",
      });
    }

    /* -----------------------------
   3. Ensure Member Profile (ATOMIC)
    ------------------------------ */
    await Member.updateOne(
      { user: adminUser._id }, // unique index field
      {
        $setOnInsert: {
          user: adminUser._id,
          displayName: adminUser.name,
          primaryRole: {
            position: "president",
            domain: coreDomain._id,
          },
          roles: [
            {
              position: "president",
              domain: coreDomain._id,
              isActive: true,
              startDate: new Date(),
            },
          ],
        },
      },
      { upsert: true },
    );

    console.log("✅ Admin seeding complete (idempotent).");
  } catch (error) {
    console.error("❌ Seeder Error:", error);
  }
};

module.exports = seedAdmin;
