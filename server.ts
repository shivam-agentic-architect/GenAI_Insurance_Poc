import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Mock Insurance Data for the POC
  const insuranceData = {
    banks: [
      { id: "b1", name: "HDFC Bank", regions: ["Karnataka", "Maharashtra", "Delhi"] },
      { id: "b2", name: "ICICI Bank", regions: ["Karnataka", "Tamil Nadu", "Gujarat"] },
      { id: "b3", name: "SBI", regions: ["All India"] },
      { id: "b4", name: "Axis Bank", regions: ["Karnataka", "West Bengal"] }
    ],
    products: [
      { id: "p1", bankId: "b1", category: "Health", name: "HDFC Ergo Health", coverage: "Hospitalization, Daycare, AYUSH" },
      { id: "p2", bankId: "b2", category: "Health", name: "ICICI Lombard Health Shield", coverage: "OPD, Wellness, Critical Illness" },
      { id: "p3", bankId: "b3", category: "Health", name: "SBI Arogya Premier", coverage: "Comprehensive Health, Maternity" },
      { id: "p4", bankId: "b1", category: "Car", name: "HDFC Motor Insurance", coverage: "Own Damage, Third Party, Zero Dep" },
      { id: "p5", bankId: "b2", category: "Car", name: "ICICI Car Insurance", coverage: "Accidental Damage, Theft, Natural Calamities" },
      { id: "p6", bankId: "b4", category: "Car", name: "Axis Drive Safe", coverage: "Roadside Assistance, Engine Protect" },
      { id: "p7", bankId: "b1", category: "Life", name: "HDFC Life Click 2 Protect", coverage: "Term Life, Terminal Illness" },
      { id: "p8", bankId: "b3", category: "Life", name: "SBI Life eShield", coverage: "Pure Term, Accidental Death Benefit" }
    ],
    policies: [
      { category: "Life", details: "Life insurance provides financial protection to beneficiaries in case of the policyholder's death. It often includes term plans, whole life plans, and endowment plans." },
      { category: "Health", details: "Health insurance covers medical expenses arising from illnesses or injuries. It includes hospitalization, pre and post-hospitalization, and sometimes OPD." },
      { category: "Car", details: "Car insurance protects against financial loss in the event of an accident or theft. It typically includes Third Party Liability and Own Damage coverage." }
    ],
    documents: [
      { id: "doc1", title: "Health Insurance Policy Terms", content: "Our health insurance covers pre-existing diseases after a waiting period of 24 months. It includes cashless hospitalization at over 5000+ network hospitals. OPD coverage is limited to Rs. 5000 per year in the basic plan." },
      { id: "doc2", title: "Car Insurance Add-ons", content: "Zero Depreciation add-on ensures that you get the full claim amount without any deduction for depreciation on replaced parts. Engine Protect covers damage to the engine due to water ingression or oil leakage." },
      { id: "doc3", title: "Life Insurance Claim Process", content: "To file a life insurance claim, the nominee must submit the death certificate, original policy document, and identity proof of the claimant. Claims are usually settled within 15 working days of document submission." }
    ],
    faqs: [
      { question: "How can I renew my policy?", answer: "You can renew your policy through our mobile app or website by entering your policy number and paying the premium online." },
      { question: "What is a No Claim Bonus (NCB)?", answer: "NCB is a discount in premium offered to the policyholder for not making any claims during the previous policy year. It can go up to 50%." }
    ]
  };

  app.get("/api/insurance-data", (req, res) => {
    res.json(insuranceData);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
