import { useState, useEffect } from "react";
import { BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid, Legend, LabelList } from "recharts";

// ─── DATA HOOK ───────────────────────────────────────────────────────────────
// Fetches /public/data.json — written daily by GitHub Actions scraper.
// Falls back to FALLBACK_* hardcoded data if the file isn't available yet
// (e.g. first deploy before the scraper has run).

function mkCompare(markets) {
  return markets.map(m => ({
    name: m.name.length > 14 ? m.name.split(",")[0].split("/")[0].trim() : m.name,
    price: Math.round(m.medianPrice / 1000),
    revenue: Math.round(m.annualRevenue / 1000),
    roi: m.roiPct,
    occ: Math.round(m.occupancy * 100),
    region: m.region,
  }));
}

function useData() {
  const [markets, setMarkets]       = useState(null);
  const [listings, setListings]     = useState(null);
  const [compare, setCompare]       = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    fetch("/data.json")
      .then(r => { if (!r.ok) throw new Error("data.json not found"); return r.json(); })
      .then(({ markets: mkts, listings: lstgs, meta }) => {
        // Normalise listings shape from scraper → dashboard format
        const normListings = (lstgs || []).map((l, i) => ({
          ...l,
          id: l.id || i + 1,
          dateAdded: l.dateFetched || new Date().toISOString().slice(0, 10),
          estRevenue: l.estRevenue || 0,
          amenities: Array.isArray(l.amenities) ? l.amenities : (l.amenities || "").split(",").map(s => s.trim()).filter(Boolean),
          links: l.links || {},
        }));
        setMarkets(mkts);
        setListings(normListings);
        setCompare(mkCompare(mkts));
        setLastUpdated(meta?.fetchedAt || null);
      })
      .catch(e => {
        console.warn("data.json fetch failed — using fallback data:", e.message);
        setError(e.message);
        setMarkets(FALLBACK_MARKETS);
        setListings(FALLBACK_LISTINGS);
        setCompare(mkCompare(FALLBACK_MARKETS));
      })
      .finally(() => setLoading(false));
  }, []);

  return { markets, listings, compare, loading, error, lastUpdated };
}

// ─── DATA ────────────────────────────────────────────────────────────────────

const regionColor = { poconos: "#22d3ee", delaware: "#34d399", nj: "#a78bfa" };
const regionLabel = { poconos: "Poconos, PA", delaware: "Delaware", nj: "NJ Shore" };

const FALLBACK_MARKETS = [
  // POCONOS
  { id: "white-haven", region: "poconos", name: "White Haven", type: "Cabin / Mountain", adr: 241, occupancy: 0.67, annualRevenue: 41000, medianPrice: 208000, roiPct: 15, driveFromPhilly: "2 hrs", color: "#f59e0b", tag: "🔥 Best Cash Flow", strFriendly: "High",
    notes: "Highest occupancy in entire region (67%). Near Lehigh Gorge State Park & Jack Frost/Split Rock ski. Some listings show $100K–$165K actual 2024 revenue for premium cabins.",
    pros: ["~15% STR ROI — best in region", "Lowest prices ($150–$250K range)", "67% avg occupancy (highest regional)", "Near Lehigh Gorge hiking/rafting", "Light regulation — $350/yr STR fee"],
    cons: ["Lower ADR ($241) vs beach/lake markets", "Less name recognition than Lake Harmony", "Must notify municipality 1 wk before guest arrival", "Smaller cabin inventory than Poconos core"] },
  { id: "locust-lake", region: "poconos", name: "Locust Lake Village", type: "Lakefront + Cabin", adr: 300, occupancy: 0.45, annualRevenue: 49000, medianPrice: 295000, roiPct: 8, driveFromPhilly: "2 hrs", color: "#fb923c", tag: "🎯 Budget Fit", strFriendly: "High",
    notes: "Top-10 STR community per local experts. Golf carts & ATVs allowed. HOA rental license $700/yr. Tobyhanna Twp lifted STR cap Mar 2025.",
    pros: ["Fits budget comfortably", "Golf carts/ATVs = guest appeal", "Lake access", "HOA license structure is clear", "STR cap lifted"],
    cons: ["Lowest ADR of Poconos group", "Fewer winter bookings vs ski-adjacent", "HOA approval required", "Older home stock may need updates"] },
  { id: "arrowhead", region: "poconos", name: "Arrowhead Lake", type: "Lakefront + Cabin", adr: 310, occupancy: 0.46, annualRevenue: 52000, medianPrice: 320000, roiPct: 7, driveFromPhilly: "2 hrs", color: "#34d399", tag: "🏊 Amenity-Rich", strFriendly: "High",
    notes: "Gated community with multiple pools, beaches, tennis, trails. Tobyhanna Twp (cap lifted). HOA rental license $700/yr.",
    pros: ["Resort-like amenities included", "STR cap lifted", "Budget-friendly", "Strong repeat guest base", "Year-round draw"],
    cons: ["Strong seasonality", "HOA wristband program = management complexity", "Older home stock", "Higher HOA fees"] },
  { id: "tannersville", region: "poconos", name: "Tannersville / Camelback", type: "Ski-Area", adr: 329, occupancy: 0.48, annualRevenue: 58000, medianPrice: 340000, roiPct: 7, driveFromPhilly: "1.5 hrs", color: "#a78bfa", tag: "💰 Best Value", strFriendly: "High",
    notes: "Closest Poconos market to Philly (1.5 hrs). Near Camelback Mountain & Aquatopia waterpark. Year-round demand. Must verify HOA — some explicitly restrict STR.",
    pros: ["Closest Poconos market to Philly", "Camelback = year-round demand", "Aquatopia waterpark = off-ski boost", "In budget range"],
    cons: ["Some HOAs restrict STR (must verify before offer)", "More resort competition", "Lower ADR than Lake Harmony"] },
  { id: "jim-thorpe", region: "poconos", name: "Jim Thorpe", type: "Historic / Cabin", adr: 253, occupancy: 0.54, annualRevenue: 45000, medianPrice: 336000, roiPct: 6, driveFromPhilly: "1.75 hrs", color: "#64748b", tag: "⚠️ Zoning Risk", strFriendly: "Medium",
    notes: "Charming 'Switzerland of America' — Victorian streets, Lehigh Gorge Scenic Railway. Low competition (121–272 active STRs). 2021 ordinance restricts NEW STRs to C1/C2/C3/R4 zones only.",
    pros: ["Low competition", "Victorian charm = strong demand", "1.75 hrs from Philly", "White water rafting + hiking draw"],
    cons: ["STR restricted to select zones ONLY", "Must verify zoning before purchase", "5% local occupancy tax + 6% PA hotel tax", "Grandfathered STRs carry premium pricing"] },
  { id: "lake-harmony", region: "poconos", name: "Lake Harmony", type: "Lakefront + Ski", adr: 418, occupancy: 0.52, annualRevenue: 79000, medianPrice: 460000, roiPct: 6, driveFromPhilly: "2 hrs", color: "#22d3ee", tag: "🏆 Premium Pick", strFriendly: "Very High",
    notes: "Top Poconos market. Near Big Boulder & Jack Frost ski. STR license $500/yr. Highest demand + highest revenue, but prices have run up and cash flow is now thin.",
    pros: ["Year-round demand (ski + lake)", "I-80/I-476 access", "STR regulations very clear", "Highest ADR in region ($418)"],
    cons: ["Prices $400–$500K+ = thin cash flow", "Most competitive STR market", "May need to go smaller (2BR) to stay in budget"] },
  // DELAWARE
  { id: "milton-de", region: "delaware", name: "Milton, DE", type: "Coastal / Inland Beach", adr: 270, occupancy: 0.58, annualRevenue: 32000, medianPrice: 401000, roiPct: 8, driveFromPhilly: "2.5 hrs", color: "#34d399", tag: "🏆 DE Best Value", strFriendly: "Very High",
    notes: "15 min from Rehoboth Beach. Home of Dogfish Head Brewery. Only 40 active STRs = very low competition. No DE state sales tax keeps more revenue in your pocket.",
    pros: ["8% ROI at $401K median", "Only 40 active STRs (low competition)", "10–15 min from Rehoboth/Lewes beaches", "No DE state sales tax", "Investor-friendly light regulations"],
    cons: ["Not beachfront — inland town", "Very strong summer seasonality", "Less established STR market than Rehoboth", "Smaller rental pool for comps"] },
  { id: "ocean-view-de", region: "delaware", name: "Ocean View / Millville, DE", type: "Near-Beach Coastal", adr: 290, occupancy: 0.50, annualRevenue: 28000, medianPrice: 380000, roiPct: 7, driveFromPhilly: "2.5 hrs", color: "#06b6d4", tag: "🌊 Budget Beach", strFriendly: "High",
    notes: "5-min drive to Bethany Beach. Lighter regulation than incorporated beach towns. Rides same DC/Baltimore/Philly/NYC drive-market demand as Rehoboth/Bethany.",
    pros: ["5 min to Bethany Beach", "Lower prices than beachfront", "Lighter regulation (unincorporated)", "Same massive drive market as Rehoboth", "Room for price appreciation"],
    cons: ["Lower ADR than beachfront", "Heavy summer concentration", "Less brand recognition than Rehoboth"] },
  { id: "rehoboth", region: "delaware", name: "Rehoboth Beach, DE", type: "Beachfront (Over Budget)", adr: 374, occupancy: 0.56, annualRevenue: 78000, medianPrice: 1960000, roiPct: 2, driveFromPhilly: "2.5 hrs", color: "#475569", tag: "📋 Reference Only", strFriendly: "High",
    notes: "Top DE market — $78K avg revenue, 56% occupancy, peak $300–$1,200/night. Median hit $1.96M. Included for reference only — way over budget.",
    pros: ["$78K avg revenue — top DE", "Massive DC/Baltimore/Philly drive market", "Tax-free shopping = guest draw", "Strong brand name"],
    cons: ["Median $1.96M — 4x over budget", "~2% ROI at current prices", "Highly competitive market", "Large gap between revenue and prices"] },
  // NJ SHORE
  { id: "ocean-city-nj", region: "nj", name: "Ocean City, NJ", type: "Beachfront (Over Budget)", adr: 272, occupancy: 0.55, annualRevenue: 55000, medianPrice: 1262500, roiPct: 3, driveFromPhilly: "1.5 hrs", color: "#475569", tag: "📋 Reference Only", strFriendly: "High",
    notes: "Famous family beach town. $55K avg revenue with +5.5% YoY growth. Closest NJ Shore market to Philly. Median $1.26M — cash flow doesn't work at budget.",
    pros: ["$55K avg revenue", "Closest NJ Shore to Philly (1.5 hrs)", "+5.5% revenue growth YoY", "Alcohol-free = family-friendly bookings"],
    cons: ["Median $1.26M — 2.5x over budget", "~3% cap rate at current prices", "July–Aug driven (very seasonal)"] },
  { id: "cape-may-nj", region: "nj", name: "Cape May, NJ", type: "Beachfront (Over Budget)", adr: 378, occupancy: 0.59, annualRevenue: 75000, medianPrice: 915000, roiPct: 2, driveFromPhilly: "1.75 hrs", color: "#475569", tag: "📋 Reference Only", strFriendly: "High",
    notes: "Best STR metrics on NJ Shore — $75K avg revenue, 59% occupancy, $378 ADR. Median $915K — doesn't pencil at budget.",
    pros: ["$75K avg revenue — top NJ", "59% occupancy — highest NJ Shore", "Victorian tourism = year-round demand"],
    cons: ["Median $915K — nearly 2x budget", "~2% CoC at current prices", "Highly competitive market"] },
];

const FALLBACK_LISTINGS = [
  { id: 1, market: "Lake Harmony", region: "poconos", address: "15 Skye Dr", city: "Lake Harmony, PA 18624", price: 485000, beds: 4, baths: 2.5, sqft: 1856, dateAdded: "2026-03-05", daysOnMarket: 4, estRevenue: 79000, amenities: ["Hot Tub", "Lake Access", "Fireplace", "Furnished"], description: "4-season getaway in Lake Harmony Estates. Private hot tub, private beach access, spacious deck. Minutes from Big Boulder & Jack Frost ski resorts. Turnkey STR-ready.", links: { Zillow: "https://www.zillow.com/homes/15-Skye-Dr-Lake-Harmony-PA-18624_rb/", Redfin: "https://www.redfin.com/PA/Lake-Harmony/15-Skye-Dr-18624", Realtor: "https://www.realtor.com/realestateandhomes-search/Lake-Harmony_PA/address/15-Skye-Dr" } },
  { id: 2, market: "Lake Harmony", region: "poconos", address: "11 Maplewood Rd", city: "Lake Harmony, PA 18624", price: 489000, beds: 3, baths: 2, sqft: 1640, dateAdded: "2026-03-01", daysOnMarket: 8, estRevenue: 72000, amenities: ["Lake Access", "Fireplace", "Renovated", "Loft"], description: "Steps to lake with fresh modern reno — new roof, quartz kitchen, Pergo floors. Loft adds sleeping capacity. Outdoor firepit. STR-ready.", links: { Zillow: "https://www.zillow.com/homes/11-Maplewood-Rd-Lake-Harmony-PA-18624_rb/", Redfin: "https://www.redfin.com/PA/Lake-Harmony/11-Maplewood-Rd-18624", Realtor: "https://www.realtor.com/realestateandhomes-search/Lake-Harmony_PA/address/11-Maplewood-Rd" } },
  { id: 3, market: "Lake Harmony", region: "poconos", address: "119 Downhill Dr", city: "Lake Harmony, PA 18624", price: 222000, beds: 2, baths: 1.5, sqft: 1025, dateAdded: "2026-03-07", daysOnMarket: 2, estRevenue: 38000, amenities: ["Ski Access", "Furnished"], description: "Fully furnished 2BR in Snow Ridge Village near Jack Frost Mountain. Well under budget. Cash flow upside — add hot tub to boost revenue meaningfully.", links: { Zillow: "https://www.zillow.com/homes/119-Downhill-Lake-Harmony-PA-18624_rb/", Redfin: "https://www.redfin.com/PA/Lake-Harmony/119-Downhill-18624", Realtor: "https://www.realtor.com/realestateandhomes-search/Lake-Harmony_PA/address/119-Downhill" } },
  { id: 4, market: "White Haven", region: "poconos", address: "Lehigh Gorge Cabin Area", city: "White Haven, PA 18661", price: 210000, beds: 3, baths: 2, sqft: 1400, dateAdded: "2026-03-09", daysOnMarket: 0, estRevenue: 41000, amenities: ["Hot Tub", "Fireplace", "Near Lehigh Gorge", "Pet Friendly", "Game Room"], description: "3BR cabin near Lehigh Gorge State Park. Best cash flow story in the region — 67% avg occupancy, ~15% STR ROI at this price. Near Jack Frost/Split Rock ski. Annual STR fee just $350.", links: { Zillow: "https://www.zillow.com/white-haven-pa/", Redfin: "https://www.redfin.com/city/19440/PA/White-Haven", Realtor: "https://www.realtor.com/realestateandhomes-search/White-Haven_PA" } },
  { id: 5, market: "Milton, DE", region: "delaware", address: "Cannery Village Townhome", city: "Milton, DE 19968", price: 389000, beds: 3, baths: 2.5, sqft: 1900, dateAdded: "2026-03-08", daysOnMarket: 1, estRevenue: 32000, amenities: ["Community Pool", "No STR Restrictions", "Near Dogfish Head Brewery", "Open Floor Plan"], description: "3BR in Cannery Village — open plan, granite counters, indoor + outdoor pools. No STR restrictions. 10 min to Rehoboth. Very low competition market (only 40 active STRs in Milton).", links: { Zillow: "https://www.zillow.com/milton-de/", Redfin: "https://www.redfin.com/city/12350/DE/Milton", Homes: "https://www.homes.com/milton-de/" } },
  { id: 6, market: "Milton, DE", region: "delaware", address: "Broadkill Beach Retreat", city: "Broadkill Beach / Milton, DE 19968", price: 425000, beds: 3, baths: 2.5, sqft: 1800, dateAdded: "2026-03-08", daysOnMarket: 1, estRevenue: 42000, amenities: ["Delaware Bay Views", "Active STR ($350/night)", "Dual-Unit Layout", "Outdoor Shower", "Bay Breezes"], description: "Actively operating STR — currently renting $350/night per unit or $700/night as full home. Bay views, dual-unit flexibility. Near Prime Hook National Wildlife Refuge. Turnkey income property.", links: { Zillow: "https://www.zillow.com/milton-de/", LongFoster: "https://www.longandfoster.com/homes-for-sale/DE/Milton", Homes: "https://www.homes.com/milton-de/" } },
  { id: 7, market: "Ocean View / Millville, DE", region: "delaware", address: "Vines of Sandhill Community", city: "Millville, DE 19967", price: 368000, beds: 3, baths: 2, sqft: 1700, dateAdded: "2026-03-09", daysOnMarket: 0, estRevenue: 28000, amenities: ["Community Pool", "Pickleball Courts", "Fitness Center", "5 min to Bethany Beach", "Lawn Care Included"], description: "Move-in ready 3BR ranch in resort-style community. Lawn maintenance + irrigation included. 5-min drive to Bethany Beach. Community amenities = strong guest appeal. No STR restrictions. Budget-friendly entry into Delaware beach market.", links: { Zillow: "https://www.zillow.com/millville-de/", Redfin: "https://www.redfin.com/city/26938/DE/Millville", Homes: "https://www.homes.com/millville-de/" } },
];

const FALLBACK_COMPARE = [
  { name: "White Haven", price: 208, revenue: 41, roi: 15, occ: 67, region: "poconos" },
  { name: "Milton DE", price: 401, revenue: 32, roi: 8, occ: 58, region: "delaware" },
  { name: "Locust Lake", price: 295, revenue: 49, roi: 8, occ: 45, region: "poconos" },
  { name: "Ocean View DE", price: 380, revenue: 28, roi: 7, occ: 50, region: "delaware" },
  { name: "Arrowhead", price: 320, revenue: 52, roi: 7, occ: 46, region: "poconos" },
  { name: "Tannersville", price: 340, revenue: 58, roi: 7, occ: 48, region: "poconos" },
  { name: "Jim Thorpe", price: 336, revenue: 45, roi: 6, occ: 54, region: "poconos" },
  { name: "Lake Harmony", price: 460, revenue: 79, roi: 6, occ: 52, region: "poconos" },
  { name: "Ocean City NJ*", price: 1263, revenue: 55, roi: 3, occ: 55, region: "nj" },
  { name: "Cape May NJ*", price: 915, revenue: 75, roi: 2, occ: 59, region: "nj" },
  { name: "Rehoboth DE*", price: 1960, revenue: 78, roi: 2, occ: 56, region: "delaware" },
];

const POCONOS_S = [
  { month: "Jan", occ: 52, adm: 1.3 }, { month: "Feb", occ: 58, adm: 1.4 }, { month: "Mar", occ: 35, adm: 0.85 },
  { month: "Apr", occ: 32, adm: 0.8 }, { month: "May", occ: 42, adm: 0.95 }, { month: "Jun", occ: 58, adm: 1.15 },
  { month: "Jul", occ: 75, adm: 1.45 }, { month: "Aug", occ: 78, adm: 1.5 }, { month: "Sep", occ: 52, adm: 1.1 },
  { month: "Oct", occ: 55, adm: 1.2 }, { month: "Nov", occ: 38, adm: 0.9 }, { month: "Dec", occ: 60, adm: 1.35 },
];
const BEACH_S = [
  { month: "Jan", occ: 14, adm: 0.45 }, { month: "Feb", occ: 15, adm: 0.48 }, { month: "Mar", occ: 20, adm: 0.6 },
  { month: "Apr", occ: 28, adm: 0.75 }, { month: "May", occ: 42, adm: 0.95 }, { month: "Jun", occ: 68, adm: 1.3 },
  { month: "Jul", occ: 90, adm: 1.7 }, { month: "Aug", occ: 88, adm: 1.65 }, { month: "Sep", occ: 55, adm: 1.1 },
  { month: "Oct", occ: 35, adm: 0.85 }, { month: "Nov", occ: 18, adm: 0.55 }, { month: "Dec", occ: 15, adm: 0.5 },
];

const AMENITIES = [
  { name: "Ski-in/Ski-out", boost: "+25%", icon: "⛷️", priority: "High" },
  { name: "Beach/Lake Access", boost: "+22%", icon: "🏖️", priority: "High" },
  { name: "Hot Tub", boost: "+18%", icon: "♨️", priority: "High" },
  { name: "Game Room", boost: "+12%", icon: "🎱", priority: "High" },
  { name: "Fireplace", boost: "+10%", icon: "🔥", priority: "High" },
  { name: "Pet Friendly", boost: "+8%", icon: "🐾", priority: "Med" },
  { name: "Bunk Beds", boost: "+7%", icon: "🛏️", priority: "Med" },
  { name: "EV Charger", boost: "+5%", icon: "⚡", priority: "Med" },
];

// ─── HELPERS ─────────────────────────────────────────────────────────────────

const fmt = (n) => n >= 0 ? `$${Math.round(n).toLocaleString()}` : `-$${Math.round(Math.abs(n)).toLocaleString()}`;

function calcMortgage(price, downPct, rate) {
  const loan = price * (1 - downPct / 100);
  const mr = rate / 100 / 12;
  const n = 360;
  return loan * (mr * Math.pow(1 + mr, n)) / (Math.pow(1 + mr, n) - 1) * 12;
}

function cfColor(cf) { return cf > 8000 ? "#34d399" : cf > 0 ? "#fbbf24" : "#f87171"; }
function cfLabel(cf) { return cf > 8000 ? "Strong ✓" : cf > 0 ? "Marginal" : "Negative"; }

function listingCF(l) {
  const am = calcMortgage(l.price, 25, 7.5);
  const rev = l.estRevenue;
  const exp = rev * 0.20 + l.price * 0.012 + l.price * 0.008 + rev * 0.08 + 4800 + l.price * 0.01 + 1200 + 8000;
  return Math.round(rev - am - exp);
}
function listingCoC(l) { return ((listingCF(l) / (l.price * 0.25)) * 100).toFixed(1); }
function fmtDate(d) { return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); }

// ─── CHECK ITEM ──────────────────────────────────────────────────────────────

function CheckItem({ item, color }) {
  const [checked, setChecked] = useState(false);
  return (
    <div onClick={() => setChecked(!checked)} style={{ display: "flex", gap: "10px", padding: "7px 0", borderBottom: "1px solid rgba(255,255,255,0.04)", cursor: "pointer" }}>
      <div style={{ width: "16px", height: "16px", borderRadius: "4px", border: `1.5px solid ${checked ? color : "#334155"}`, background: checked ? color + "33" : "transparent", flexShrink: 0, marginTop: "1px", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {checked && <span style={{ fontSize: "10px", color }}>✓</span>}
      </div>
      <span style={{ fontSize: "11px", color: checked ? "#475569" : "#94a3b8", lineHeight: "1.5", textDecoration: checked ? "line-through" : "none" }}>{item}</span>
    </div>
  );
}

// ─── CASH FLOW CALCULATOR ────────────────────────────────────────────────────

function CashFlowCalc({ market }) {
  const safePx = market.medianPrice > 600000 ? 420000 : market.medianPrice;
  const [price, setPrice] = useState(safePx);
  const [downPct, setDownPct] = useState(25);
  const [rate, setRate] = useState(7.5);
  const [mgmtPct, setMgmtPct] = useState(20);
  const [rev, setRev] = useState(market.annualRevenue);

  const am = calcMortgage(price, downPct, rate);
  const down = price * downPct / 100;
  const mgmt = rev * mgmtPct / 100;
  const taxes = price * 0.012;
  const ins = price * 0.008;
  const clean = rev * 0.08;
  const util = 4800;
  const maint = price * 0.01;
  const hoa = 1200;
  const misc = 8000;
  const totalExp = am + mgmt + taxes + ins + clean + util + maint + hoa + misc;
  const noi = rev - (mgmt + taxes + ins + clean + util + maint + hoa + misc);
  const cf = rev - totalExp;
  const coc = ((cf / down) * 100).toFixed(1);
  const cap = ((noi / price) * 100).toFixed(1);
  const yield_ = ((rev / price) * 100).toFixed(1);
  const dscr = (rev / 12 / ((am + taxes + ins) / 12)).toFixed(2);
  const mc = market.color || "#22d3ee";

  return (
    <div style={{ fontFamily: "'DM Mono', monospace" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "20px" }}>
        {[
          { label: "Purchase Price", val: price, set: setPrice, min: 150000, max: 600000, step: 5000, fmt: v => `$${Number(v).toLocaleString()}` },
          { label: "Est. Annual Revenue", val: rev, set: setRev, min: 15000, max: 120000, step: 1000, fmt: v => `$${Number(v).toLocaleString()}` },
          { label: "Down Payment %", val: downPct, set: setDownPct, min: 10, max: 40, step: 5, fmt: v => `${v}%` },
          { label: "Interest Rate %", val: rate, set: setRate, min: 5, max: 11, step: 0.25, fmt: v => `${v}%` },
          { label: "Mgmt Fee %", val: mgmtPct, set: setMgmtPct, min: 0, max: 30, step: 5, fmt: v => `${v}%` },
        ].map(s => (
          <div key={s.label}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "10px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>{s.label}</span>
              <span style={{ fontSize: "13px", color: "#e2e8f0", fontWeight: "600" }}>{s.fmt(s.val)}</span>
            </div>
            <input type="range" min={s.min} max={s.max} step={s.step} value={s.val} onChange={e => s.set(Number(e.target.value))} style={{ width: "100%", accentColor: mc }} />
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "16px" }}>
        {[
          { label: "Annual Cash Flow", value: fmt(cf), color: cfColor(cf) },
          { label: "Cash-on-Cash ROI", value: `${coc}%`, color: Number(coc) >= 8 ? "#34d399" : Number(coc) >= 4 ? "#fbbf24" : "#f87171" },
          { label: "Cap Rate", value: `${cap}%`, color: "#22d3ee" },
          { label: "DSCR", value: dscr, color: Number(dscr) >= 1.25 ? "#34d399" : "#f87171" },
        ].map(m => (
          <div key={m.label} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "12px", border: "1px solid rgba(255,255,255,0.08)", textAlign: "center" }}>
            <div style={{ fontSize: "9px", color: "#64748b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "6px" }}>{m.label}</div>
            <div style={{ fontSize: "18px", fontWeight: "800", color: m.color }}>{m.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
        <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "10px", padding: "14px", fontSize: "11px" }}>
          <div style={{ color: "#64748b", marginBottom: "10px", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: "600" }}>Expense Breakdown</div>
          {[["Mortgage (P&I)", am], ["Property Mgmt", mgmt], ["Property Tax (~1.2%)", taxes], ["Insurance (~0.8%)", ins], ["Cleaning (~8% rev)", clean], ["Utilities", util], ["Maintenance (~1%)", maint], ["HOA / Licenses", hoa], ["Furnish/Mktg/Misc", misc]].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ color: "#64748b" }}>{l}</span><span style={{ color: "#e2e8f0" }}>{fmt(v)}</span>
            </div>
          ))}
        </div>
        <div style={{ background: "rgba(0,0,0,0.2)", borderRadius: "10px", padding: "14px", fontSize: "11px" }}>
          <div style={{ color: "#64748b", marginBottom: "10px", fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: "600" }}>Investment Summary</div>
          {[["Down Payment", down], ["Gross Revenue", rev], ["Total Expenses", totalExp], ["Net Oper. Income", noi], ["Annual Cash Flow", cf]].map(([l, v]) => (
            <div key={l} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
              <span style={{ color: "#64748b" }}>{l}</span>
              <span style={{ color: l === "Annual Cash Flow" ? cfColor(cf) : "#e2e8f0", fontWeight: l === "Annual Cash Flow" ? "700" : "400" }}>{fmt(v)}</span>
            </div>
          ))}
          <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <span style={{ color: "#64748b" }}>Gross Yield</span><span style={{ color: "#a78bfa" }}>{yield_}%</span>
          </div>
          <div style={{ marginTop: "12px", padding: "10px", borderRadius: "8px", background: Number(dscr) >= 1.25 ? "rgba(52,211,153,0.08)" : "rgba(248,113,113,0.08)", border: `1px solid ${Number(dscr) >= 1.25 ? "rgba(52,211,153,0.2)" : "rgba(248,113,113,0.2)"}` }}>
            <div style={{ fontSize: "9px", color: "#64748b", textTransform: "uppercase", marginBottom: "4px" }}>DSCR Loan Qualification</div>
            <div style={{ fontSize: "11px", color: Number(dscr) >= 1.25 ? "#34d399" : "#f87171", fontWeight: "600" }}>
              {Number(dscr) >= 1.25 ? `✓ Qualifies (${dscr} ≥ 1.25)` : `✗ May not qualify (${dscr} < 1.25)`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── COMPARE TAB ─────────────────────────────────────────────────────────────

function CompareTab({ setSelectedMarket, setActiveTab, compareData }) {
  const [axis, setAxis] = useState("roi");
  const [chartTab, setChartTab] = useState("bar");
  const sorted = [...compareData].sort((a, b) => b[axis] - a[axis]);

  const axisLabel = { roi: "Est. ROI %", revenue: "Annual Revenue ($K)", occ: "Occupancy %" };

  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "6px" }}>Full Regional Market Comparison</h2>
        <p style={{ fontSize: "12px", color: "#64748b" }}>All 11 markets researched across Poconos, Delaware & NJ Shore. * = over your $500K budget, shown for reference.</p>
      </div>

      {/* Chart sub-tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "16px", background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "4px", width: "fit-content" }}>
        {[["bar", "📊 Bar Chart"], ["line", "📈 Line Chart"]].map(([v, l]) => (
          <button key={v} onClick={() => setChartTab(v)} style={{ padding: "7px 18px", borderRadius: "7px", border: "none", background: chartTab === v ? "rgba(34,211,238,0.15)" : "transparent", color: chartTab === v ? "#22d3ee" : "#64748b", fontSize: "12px", fontWeight: "600", cursor: "pointer", transition: "all 0.15s" }}>{l}</button>
        ))}
      </div>

      {chartTab === "bar" && (
        <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.06)", padding: "20px", marginBottom: "20px" }}>
          <div style={{ display: "flex", gap: "8px", marginBottom: "14px", alignItems: "center", flexWrap: "wrap" }}>
            {[["roi", "ROI %"], ["revenue", "Revenue"], ["occ", "Occupancy"]].map(([v, l]) => (
              <button key={v} onClick={() => setAxis(v)} style={{ padding: "5px 12px", borderRadius: "7px", border: `1px solid ${axis === v ? "#22d3ee" : "rgba(255,255,255,0.1)"}`, background: axis === v ? "rgba(34,211,238,0.12)" : "transparent", color: axis === v ? "#22d3ee" : "#64748b", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>{l}</button>
            ))}
            <div style={{ marginLeft: "10px", display: "flex", gap: "12px" }}>
              {Object.entries(regionColor).map(([k, c]) => (
                <span key={k} style={{ fontSize: "11px", color: c, display: "flex", alignItems: "center", gap: "5px" }}>
                  <span style={{ width: "10px", height: "10px", borderRadius: "2px", background: c, display: "inline-block" }} />{regionLabel[k]}
                </span>
              ))}
            </div>
          </div>
          <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "12px" }}>{axisLabel[axis]} — sorted highest to lowest · Faded bars = over budget</div>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={sorted} margin={{ top: 4, right: 10, left: 0, bottom: 44 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} angle={-38} textAnchor="end" interval={0} />
              <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "#0d1b2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#e2e8f0" }}
                formatter={(v) => [`${v}${axis === "occ" || axis === "roi" ? "%" : "K"}`, axisLabel[axis]]} labelStyle={{ color: "#94a3b8" }} />
              <Bar dataKey={axis} radius={[4, 4, 0, 0]}>
                {sorted.map((entry, i) => {
                  const over = entry.name.includes("*");
                  const c = regionColor[entry.region] || "#64748b";
                  return <Cell key={i} fill={over ? c + "55" : c} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {chartTab === "line" && (
        <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.06)", padding: "20px", marginBottom: "20px" }}>
          <div style={{ marginBottom: "14px" }}>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "#f8fafc", marginBottom: "4px" }}>ROI · Revenue · Occupancy — All Markets at a Glance</div>
            <div style={{ fontSize: "11px", color: "#64748b" }}>Normalized view across all 3 metrics (sorted by ROI). Revenue in $K, ROI and Occupancy in %. * = over $500K budget.</div>
          </div>
          <ResponsiveContainer width="100%" height={340}>
            <LineChart data={[...compareData].sort((a, b) => b.roi - a.roi)} margin={{ top: 24, right: 20, left: 0, bottom: 48 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} angle={-38} textAnchor="end" interval={0} />
              <YAxis yAxisId="pct" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} width={38} />
              <YAxis yAxisId="rev" orientation="right" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `$${v}K`} width={42} />
              <Tooltip
                contentStyle={{ background: "#0d1b2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#e2e8f0", fontSize: "11px" }}
                formatter={(v, name) => name === "Revenue ($K)" ? [`$${v}K`, name] : [`${v}%`, name]}
                labelStyle={{ color: "#94a3b8", marginBottom: "4px" }}
              />
              <Legend wrapperStyle={{ paddingTop: "8px", fontSize: "11px" }} formatter={(value) => <span style={{ color: "#94a3b8", fontSize: "11px" }}>{value}</span>} />
              <Line yAxisId="pct" type="monotone" dataKey="roi" name="ROI %" stroke="#34d399" strokeWidth={2.5} dot={{ fill: "#34d399", r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }}>
                <LabelList dataKey="roi" position="top" formatter={v => `${v}%`} style={{ fill: "#34d399", fontSize: "9px", fontWeight: "600" }} />
              </Line>
              <Line yAxisId="rev" type="monotone" dataKey="revenue" name="Revenue ($K)" stroke="#22d3ee" strokeWidth={2.5} dot={{ fill: "#22d3ee", r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }} strokeDasharray="6 3">
                <LabelList dataKey="revenue" position="top" formatter={v => `$${v}K`} style={{ fill: "#22d3ee", fontSize: "9px", fontWeight: "600" }} />
              </Line>
              <Line yAxisId="pct" type="monotone" dataKey="occ" name="Occupancy %" stroke="#a78bfa" strokeWidth={2.5} dot={{ fill: "#a78bfa", r: 4, strokeWidth: 0 }} activeDot={{ r: 6 }}>
                <LabelList dataKey="occ" position="top" formatter={v => `${v}%`} style={{ fill: "#a78bfa", fontSize: "9px", fontWeight: "600" }} />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Table */}
      <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden", marginBottom: "20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1.1fr 0.9fr 1fr 1fr 0.9fr 0.9fr", padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,0.08)", fontSize: "9px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em" }}>
          <span>Market</span><span>Region</span><span>Med. Price</span><span>Revenue/yr</span><span>Occupancy</span><span>ROI</span><span>In Budget?</span>
        </div>
        {[...compareData].sort((a, b) => b.roi - a.roi).map((m, i) => {
          const inB = m.price <= 500;
          const rc = regionColor[m.region];
          return (
            <div key={m.name} style={{ display: "grid", gridTemplateColumns: "2fr 1.1fr 0.9fr 1fr 1fr 0.9fr 0.9fr", padding: "11px 16px", borderBottom: "1px solid rgba(255,255,255,0.04)", background: i % 2 ? "rgba(255,255,255,0.01)" : "transparent", opacity: inB ? 1 : 0.5 }}>
              <span style={{ fontSize: "12px", fontWeight: "600", color: inB ? "#e2e8f0" : "#64748b" }}>{m.name}</span>
              <span style={{ fontSize: "11px", color: rc }}>{regionLabel[m.region]}</span>
              <span style={{ fontSize: "11px", color: inB ? "#94a3b8" : "#f87171" }}>${m.price}K</span>
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>${m.revenue}K</span>
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>{m.occ}%</span>
              <span style={{ fontSize: "12px", fontWeight: "700", color: m.roi >= 10 ? "#34d399" : m.roi >= 7 ? "#fbbf24" : "#f87171" }}>{m.roi}%</span>
              <span style={{ fontSize: "11px", fontWeight: "600", color: inB ? "#34d399" : "#f87171" }}>{inB ? "✓ Yes" : "✗ Over"}</span>
            </div>
          );
        })}
      </div>

      {/* Takeaway cards */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px" }}>
        {[
          { title: "🔥 Best Cash Flow — Any Region", body: "White Haven, PA: 15% ROI, 67% occupancy, $208K median. Strongest CoC in the entire Philly-area STR landscape.", color: "#f59e0b" },
          { title: "🏖️ Best Beach Market In Budget", body: "Milton, DE: 8% ROI, $401K median, only 40 active STRs. 10–15 min from Rehoboth. Under-discovered with room to grow.", color: "#34d399" },
          { title: "⚠️ NJ + Premium DE = Skip for CoC", body: "Ocean City NJ ($1.26M) and Rehoboth DE ($1.96M) generate great revenue but pencil at 2–3% ROI. Appreciation play only.", color: "#f87171" },
        ].map(t => (
          <div key={t.title} style={{ background: "rgba(255,255,255,0.02)", borderRadius: "12px", border: `1px solid ${t.color}22`, padding: "14px 16px" }}>
            <div style={{ fontSize: "12px", fontWeight: "700", color: t.color, marginBottom: "6px" }}>{t.title}</div>
            <div style={{ fontSize: "11px", color: "#94a3b8", lineHeight: "1.6" }}>{t.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── LISTINGS TAB ────────────────────────────────────────────────────────────

function ListingsTab({ setSelectedMkt, setTab, allListings, markets }) {
  const [fReg, setFReg] = useState("all");
  const [fBeds, setFBeds] = useState("all");
  const [sort, setSort] = useState("cashflow");

  const filtered = allListings
    .filter(l => fReg === "all" || l.region === fReg)
    .filter(l => fBeds === "all" || l.beds >= Number(fBeds))
    .sort((a, b) => sort === "price" ? a.price - b.price : sort === "revenue" ? b.estRevenue - a.estRevenue : sort === "newest" ? new Date(b.dateAdded) - new Date(a.dateAdded) : listingCF(b) - listingCF(a));

  return (
    <div>
      <div style={{ display: "flex", gap: "8px", marginBottom: "20px", flexWrap: "wrap", alignItems: "center" }}>
        <span style={{ fontSize: "11px", color: "#64748b" }}>Region:</span>
        {[["all", "All"], ["poconos", "🏔️ Poconos"], ["delaware", "🏖️ Delaware"]].map(([v, l]) => (
          <button key={v} onClick={() => setFReg(v)} style={{ padding: "5px 12px", borderRadius: "20px", border: `1px solid ${fReg === v ? "#22d3ee" : "rgba(255,255,255,0.1)"}`, background: fReg === v ? "rgba(34,211,238,0.12)" : "transparent", color: fReg === v ? "#22d3ee" : "#64748b", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>{l}</button>
        ))}
        <span style={{ fontSize: "11px", color: "#64748b", marginLeft: "8px" }}>Min Beds:</span>
        {["all", "2", "3"].map(b => (
          <button key={b} onClick={() => setFBeds(b)} style={{ padding: "5px 10px", borderRadius: "20px", border: `1px solid ${fBeds === b ? "#a78bfa" : "rgba(255,255,255,0.1)"}`, background: fBeds === b ? "rgba(167,139,250,0.12)" : "transparent", color: fBeds === b ? "#a78bfa" : "#64748b", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>{b === "all" ? "Any" : `${b}+`}</button>
        ))}
        <div style={{ marginLeft: "auto", display: "flex", gap: "8px", alignItems: "center" }}>
          <span style={{ fontSize: "11px", color: "#64748b" }}>Sort:</span>
          <select value={sort} onChange={e => setSort(e.target.value)} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "#e2e8f0", padding: "5px 10px", borderRadius: "8px", fontSize: "11px", cursor: "pointer" }}>
            <option value="cashflow">Best Cash Flow</option>
            <option value="price">Lowest Price</option>
            <option value="revenue">Highest Revenue</option>
            <option value="newest">Newest Listed</option>
          </select>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
        {filtered.map(l => {
          const cf = listingCF(l);
          const coc = listingCoC(l);
          const rc = regionColor[l.region] || "#64748b";
          return (
            <div key={l.id} style={{ background: "rgba(255,255,255,0.03)", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.08)", padding: "20px", display: "grid", gridTemplateColumns: "1fr auto", gap: "16px" }}>
              <div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "6px", flexWrap: "wrap" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#f8fafc" }}>{l.address}</h3>
                  <span style={{ fontSize: "10px", background: rc + "22", color: rc, padding: "2px 8px", borderRadius: "20px", fontWeight: "600" }}>{l.market}</span>
                  <span style={{ fontSize: "10px", background: "rgba(255,255,255,0.04)", color: "#64748b", padding: "2px 8px", borderRadius: "20px" }}>{l.daysOnMarket === 0 ? "Listed today" : `${l.daysOnMarket}d on market`}</span>
                </div>
                <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "10px" }}>{l.city} · 📅 Added {fmtDate(l.dateAdded)}</div>
                <div style={{ display: "flex", gap: "16px", marginBottom: "12px", flexWrap: "wrap" }}>
                  {[{ label: "Price", value: `$${l.price.toLocaleString()}` }, { label: "Beds", value: `${l.beds} BR` }, { label: "Baths", value: `${l.baths} BA` }, { label: "Sqft", value: l.sqft.toLocaleString() }, { label: "Est. Revenue", value: `$${(l.estRevenue / 1000).toFixed(0)}K/yr` }].map(s => (
                    <div key={s.label}>
                      <div style={{ fontSize: "9px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</div>
                      <div style={{ fontSize: "13px", fontWeight: "700", color: "#e2e8f0" }}>{s.value}</div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: "11px", color: "#64748b", lineHeight: "1.6", marginBottom: "12px" }}>{l.description}</p>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "14px" }}>
                  {l.amenities.map(a => <span key={a} style={{ fontSize: "10px", padding: "3px 8px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#94a3b8" }}>{a}</span>)}
                </div>
                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "10px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em" }}>View on:</span>
                  {Object.entries(l.links).map(([site, url]) => (
                    <a key={site} href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: "11px", fontWeight: "600", color: rc, textDecoration: "none", padding: "4px 10px", borderRadius: "6px", border: `1px solid ${rc}44`, background: rc + "11" }}>{site} ↗</a>
                  ))}
                  <button onClick={() => { const m = markets.find(mk => mk.name === l.market); if (m) { setSelectedMkt({ ...m, medianPrice: l.price, annualRevenue: l.estRevenue }); setTab("calculator"); } }}
                    style={{ fontSize: "11px", fontWeight: "600", color: "#0a0f1e", background: rc, border: "none", borderRadius: "6px", padding: "4px 10px", cursor: "pointer" }}>Run Calculator →</button>
                </div>
              </div>
              <div style={{ textAlign: "center", background: "rgba(0,0,0,0.2)", borderRadius: "12px", padding: "16px 18px", minWidth: "110px", border: `1px solid ${cfColor(cf)}22` }}>
                <div style={{ fontSize: "9px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>Cash Flow</div>
                <div style={{ fontSize: "18px", fontWeight: "800", color: cfColor(cf), marginBottom: "2px" }}>{fmt(cf)}</div>
                <div style={{ fontSize: "10px", color: cfColor(cf), marginBottom: "10px" }}>{cfLabel(cf)}</div>
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "10px" }}>
                  <div style={{ fontSize: "9px", color: "#475569", textTransform: "uppercase", marginBottom: "4px" }}>CoC Return</div>
                  <div style={{ fontSize: "16px", fontWeight: "700", color: Number(coc) >= 5 ? "#34d399" : Number(coc) >= 0 ? "#fbbf24" : "#f87171" }}>{coc}%</div>
                </div>
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "10px", marginTop: "8px" }}>
                  <div style={{ fontSize: "9px", color: "#475569", marginBottom: "2px" }}>25% down</div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>${(l.price * 0.25 / 1000).toFixed(0)}K needed</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ marginTop: "16px", background: "rgba(34,211,238,0.04)", borderRadius: "10px", border: "1px solid rgba(34,211,238,0.1)", padding: "12px 16px", fontSize: "11px", color: "#64748b", lineHeight: "1.6" }}>
        💡 Cash flow uses 25% down, 7.5% rate, 20% mgmt, standard expenses. Click "Run Calculator →" to model your own numbers. Verify listing availability before contacting agents.
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────

export default function App() {
  const { markets, listings, compare, loading, error, lastUpdated } = useData();

  const [tab, setTab] = useState("compare");
  const [selectedMkt, setSelectedMkt] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [regionFilter, setRegionFilter] = useState("all");

  // Set default selected market once data loads
  useEffect(() => {
    if (markets && !selectedMkt) {
      setSelectedMkt(markets.find(m => m.id === "white-haven") || markets[0]);
    }
  }, [markets]);

  if (loading || !markets || !selectedMkt) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0f1e 0%, #0d1b2e 100%)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "DM Sans, sans-serif" }}>
        <div style={{ textAlign: "center", color: "#94a3b8" }}>
          <div style={{ fontSize: "32px", marginBottom: "16px" }}>🏡</div>
          <div style={{ fontSize: "16px", fontWeight: "600", color: "#e2e8f0", marginBottom: "8px" }}>Loading STR Dashboard…</div>
          <div style={{ fontSize: "12px", color: "#64748b" }}>Fetching live data from Google Sheets</div>
        </div>
      </div>
    );
  }

  // Use live data (or fallback if sheet not yet configured)
  const MARKETS    = markets;
  const ALL_LISTINGS = listings || FALLBACK_LISTINGS;
  const COMPARE_DATA = compare  || FALLBACK_COMPARE;

  const tabs = [
    { id: "compare", label: "🗺️ Compare All" },
    { id: "markets", label: "📍 Markets" },
    { id: "listings", label: "🏠 Listings" },
    { id: "seasonality", label: "📈 Seasonality" },
    { id: "calculator", label: "💰 Calculator" },
    { id: "checklist", label: "✅ Checklist" },
  ];

  const visibleMkts = regionFilter === "all" ? MARKETS : MARKETS.filter(m => m.region === regionFilter);

  // Seasonality
  const isBeach = selectedMkt.region === "delaware" || selectedMkt.region === "nj";
  const rawS = isBeach ? BEACH_S : POCONOS_S;
  const seasonData = rawS.map(m => ({
    ...m,
    revenue: Math.round((selectedMkt.adr * m.adm) * (selectedMkt.occupancy * (m.occ / 50)) * 30),
  }));

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0f1e 0%, #0d1b2e 50%, #0a1628 100%)", fontFamily: "'DM Sans', -apple-system, sans-serif", color: "#e2e8f0" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; } ::-webkit-scrollbar-thumb { background: #22d3ee44; border-radius: 2px; }
        .tab-btn { border: none; cursor: pointer; transition: all 0.2s; } .tab-btn:hover { opacity: 0.85; }
        .mcard { transition: all 0.2s; cursor: pointer; } .mcard:hover { transform: translateY(-2px); }
        a:hover { opacity: 0.8; }
      `}</style>

      {/* ── HEADER ── */}
      <div style={{ background: "rgba(0,0,0,0.45)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "16px 24px" }}>
        <div style={{ maxWidth: "1160px", margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                <span style={{ fontSize: "20px" }}>🏡</span>
                <h1 style={{ fontSize: "19px", fontWeight: "700", color: "#f8fafc", letterSpacing: "-0.02em" }}>STR Investment Dashboard — Philly Region <span style={{ fontSize: "11px", background: "rgba(34,211,238,0.15)", color: "#22d3ee", padding: "2px 8px", borderRadius: "20px", fontWeight: "600", marginLeft: "8px", verticalAlign: "middle" }}>v1.1</span></h1>
              </div>
              <p style={{ fontSize: "11px", color: "#64748b" }}>Budget: $300K–$500K · Poconos PA · Delaware Beaches · NJ Shore · Goal: Max Cash Flow</p>
            </div>
            <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
              {error && <span style={{ fontSize: "10px", color: "#f87171", background: "rgba(248,113,113,0.1)", padding: "4px 8px", borderRadius: "6px" }}>⚠️ Using cached data</span>}
              {lastUpdated && <span style={{ fontSize: "10px", color: "#64748b" }}>Updated: {new Date(lastUpdated).toLocaleDateString()}</span>}
              {[{ l: "Markets", v: `${MARKETS.length}` }, { l: "Listings", v: `${ALL_LISTINGS.length}` }, { l: "Best ROI", v: "15%" }].map(s => (
                <div key={s.l} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "8px 14px", textAlign: "center", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div style={{ fontSize: "16px", fontWeight: "800", color: "#22d3ee" }}>{s.v}</div>
                  <div style={{ fontSize: "9px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {tabs.map(t => (
              <button key={t.id} className="tab-btn" onClick={() => setTab(t.id)}
                style={{ padding: "7px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: "600", background: tab === t.id ? "#22d3ee" : "rgba(255,255,255,0.06)", color: tab === t.id ? "#0a0f1e" : "#94a3b8", border: `1px solid ${tab === t.id ? "#22d3ee" : "rgba(255,255,255,0.08)"}` }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "1160px", margin: "0 auto", padding: "24px" }}>

        {/* ── COMPARE ── */}
        {tab === "compare" && <CompareTab setSelectedMarket={setSelectedMkt} setActiveTab={setTab} compareData={COMPARE_DATA} />}

        {/* ── MARKETS ── */}
        {tab === "markets" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "4px" }}>All 11 Researched Markets</h2>
                <p style={{ fontSize: "12px", color: "#64748b" }}>Click any card to expand pros/cons. Faded = over $500K budget (shown for reference).</p>
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {[["all", "All"], ["poconos", "🏔️ Poconos"], ["delaware", "🏖️ Delaware"], ["nj", "🌊 NJ Shore"]].map(([v, l]) => (
                  <button key={v} onClick={() => setRegionFilter(v)} style={{ padding: "5px 12px", borderRadius: "20px", border: `1px solid ${regionFilter === v ? "#22d3ee" : "rgba(255,255,255,0.1)"}`, background: regionFilter === v ? "rgba(34,211,238,0.12)" : "transparent", color: regionFilter === v ? "#22d3ee" : "#64748b", fontSize: "11px", fontWeight: "600", cursor: "pointer" }}>{l}</button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "24px" }}>
              {visibleMkts.map(m => {
                const over = m.medianPrice > 500000;
                return (
                  <div key={m.id} className="mcard" onClick={() => setExpanded(expanded === m.id ? null : m.id)}
                    style={{ background: "rgba(255,255,255,0.03)", borderRadius: "14px", border: `1px solid ${expanded === m.id ? m.color : "rgba(255,255,255,0.08)"}`, padding: "18px", position: "relative", overflow: "hidden", opacity: over ? 0.55 : 1 }}>
                    <div style={{ position: "absolute", top: 0, right: 0, background: m.color + "22", padding: "5px 10px", borderRadius: "0 14px 0 10px", fontSize: "10px", fontWeight: "700", color: m.color }}>{m.tag}</div>
                    <div style={{ position: "absolute", top: 0, left: 0, background: regionColor[m.region] + "18", padding: "3px 8px", borderRadius: "14px 0 8px 0", fontSize: "9px", color: regionColor[m.region], fontWeight: "600" }}>{regionLabel[m.region]}</div>
                    <div style={{ marginTop: "18px", marginBottom: "10px" }}>
                      <h3 style={{ fontSize: "15px", fontWeight: "700", color: "#f8fafc", marginBottom: "3px" }}>{m.name}</h3>
                      <span style={{ fontSize: "10px", color: "#64748b", background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: "20px" }}>{m.type}</span>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "8px", marginBottom: "12px" }}>
                      {[{ l: "Revenue", v: `$${(m.annualRevenue / 1000).toFixed(0)}K/yr`, h: false }, { l: "ADR", v: `$${m.adr}`, h: false }, { l: "Occupancy", v: `${Math.round(m.occupancy * 100)}%`, h: false }, { l: "ROI", v: `${m.roiPct}%`, h: true }].map(s => (
                        <div key={s.l} style={{ textAlign: "center" }}>
                          <div style={{ fontSize: "13px", fontWeight: "700", color: s.h ? (m.roiPct >= 10 ? "#34d399" : m.roiPct >= 7 ? "#fbbf24" : "#f87171") : m.color }}>{s.v}</div>
                          <div style={{ fontSize: "9px", color: "#64748b", textTransform: "uppercase" }}>{s.l}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "8px" }}>
                      <span style={{ color: "#94a3b8" }}>Median: <strong style={{ color: over ? "#f87171" : "#e2e8f0" }}>${(m.medianPrice / 1000).toFixed(0)}K {over ? "⚠️" : "✓"}</strong></span>
                      <span style={{ color: "#94a3b8" }}>Drive from Philly: <strong style={{ color: "#e2e8f0" }}>{m.driveFromPhilly}</strong></span>
                    </div>
                    <p style={{ fontSize: "10px", color: "#64748b", lineHeight: "1.5" }}>{m.notes}</p>
                    {expanded === m.id && (
                      <div style={{ marginTop: "14px", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "14px" }}>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                          <div>
                            <div style={{ fontSize: "10px", color: "#34d399", fontWeight: "700", textTransform: "uppercase", marginBottom: "8px" }}>✅ Pros</div>
                            {m.pros.map(p => <div key={p} style={{ fontSize: "10px", color: "#94a3b8", marginBottom: "4px" }}>• {p}</div>)}
                          </div>
                          <div>
                            <div style={{ fontSize: "10px", color: "#f87171", fontWeight: "700", textTransform: "uppercase", marginBottom: "8px" }}>⚠️ Cons</div>
                            {m.cons.map(c => <div key={c} style={{ fontSize: "10px", color: "#94a3b8", marginBottom: "4px" }}>• {c}</div>)}
                          </div>
                        </div>
                        <button onClick={e => { e.stopPropagation(); setSelectedMkt(m); setTab("calculator"); }}
                          style={{ marginTop: "12px", background: m.color, color: "#0a0f1e", border: "none", borderRadius: "8px", padding: "8px 16px", fontSize: "11px", fontWeight: "700", cursor: "pointer", width: "100%" }}>
                          Model Cash Flow for {m.name} →
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Amenity Boosts */}
            <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.06)", padding: "20px" }}>
              <h3 style={{ fontSize: "13px", fontWeight: "700", marginBottom: "4px" }}>🚀 Revenue-Boosting Amenities</h3>
              <p style={{ fontSize: "11px", color: "#64748b", marginBottom: "14px" }}>Estimated revenue uplift — applies across all markets</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px" }}>
                {AMENITIES.map(a => (
                  <div key={a.name} style={{ background: "rgba(255,255,255,0.04)", borderRadius: "10px", padding: "12px", textAlign: "center", border: `1px solid ${a.priority === "High" ? "rgba(34,211,238,0.2)" : "rgba(255,255,255,0.06)"}` }}>
                    <div style={{ fontSize: "22px", marginBottom: "6px" }}>{a.icon}</div>
                    <div style={{ fontSize: "11px", fontWeight: "600", color: "#e2e8f0", marginBottom: "4px" }}>{a.name}</div>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: "#34d399" }}>{a.boost}</div>
                    <div style={{ fontSize: "9px", color: a.priority === "High" ? "#22d3ee" : "#64748b", marginTop: "2px" }}>{a.priority} Priority</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── LISTINGS ── */}
        {tab === "listings" && <ListingsTab setSelectedMkt={setSelectedMkt} setTab={setTab} allListings={ALL_LISTINGS} markets={MARKETS} />}

        {/* ── SEASONALITY ── */}
        {tab === "seasonality" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "4px" }}>Seasonality & Revenue Forecast</h2>
                <p style={{ fontSize: "12px", color: "#64748b" }}>Viewing: <strong style={{ color: selectedMkt.color }}>{selectedMkt.name}</strong> · {isBeach ? "Beach seasonality pattern" : "Mountain/Lake seasonality pattern"}</p>
              </div>
              <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                {MARKETS.filter(m => !["rehoboth", "ocean-city-nj", "cape-may-nj"].includes(m.id)).map(m => (
                  <button key={m.id} onClick={() => setSelectedMkt(m)}
                    style={{ padding: "4px 10px", borderRadius: "8px", border: `1px solid ${selectedMkt.id === m.id ? m.color : "rgba(255,255,255,0.1)"}`, background: selectedMkt.id === m.id ? m.color + "22" : "transparent", color: selectedMkt.id === m.id ? m.color : "#64748b", fontSize: "10px", fontWeight: "600", cursor: "pointer" }}>
                    {m.name.split(" /")[0].split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.06)", padding: "20px", marginBottom: "16px" }}>
              <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "12px" }}>Estimated Monthly Revenue ($)</div>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={seasonData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                  <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
                  <Tooltip contentStyle={{ background: "#0d1b2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#e2e8f0" }} formatter={v => [`$${v.toLocaleString()}`, "Revenue"]} />
                  <Bar dataKey="revenue" fill={selectedMkt.color} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.06)", padding: "20px" }}>
                <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "12px" }}>Monthly Occupancy (%)</div>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={seasonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                    <XAxis dataKey="month" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} domain={[10, 100]} tickFormatter={v => `${v}%`} />
                    <Tooltip contentStyle={{ background: "#0d1b2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#e2e8f0" }} formatter={v => [`${v}%`, "Occupancy"]} />
                    <Line type="monotone" dataKey="occ" stroke={selectedMkt.color} strokeWidth={2} dot={{ fill: selectedMkt.color, r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.06)", padding: "20px" }}>
                <h3 style={{ fontSize: "13px", fontWeight: "700", marginBottom: "12px" }}>📅 Seasonal Strategy</h3>
                {(isBeach ? [
                  { season: "Summer (Jul–Aug)", tip: "90%+ occupancy. 7-night minimums. Price at 170% of base. This window makes the year.", color: "#fbbf24" },
                  { season: "Memorial Day – Jun", tip: "Ramp pricing early. Weekend-only minimums. Strong DC/Philly drive market begins.", color: "#34d399" },
                  { season: "Fall (Sep–Oct)", tip: "Drop minimums, flex pricing. Target couples, remote workers, fall getaway seekers.", color: "#f97316" },
                  { season: "Off-Season (Nov–Apr)", tip: "Aggressive discounts. Target long-stay remote workers. Consider 3–5 night minimums.", color: "#94a3b8" },
                ] : [
                  { season: "Summer (Jul–Aug)", tip: "Price at 140–150% of baseline. Min 3-night stays. Prioritize lake/outdoor marketing.", color: "#fbbf24" },
                  { season: "Winter (Dec–Feb)", tip: "Lean into ski proximity. Hot tub photos front & center. Fireplace = ADR booster.", color: "#60a5fa" },
                  { season: "Fall (Sep–Oct)", tip: "Foliage is a massive draw. Push 'leaf-peeping' in titles. Oct often rivals summer.", color: "#f97316" },
                  { season: "Shoulder (Mar–May)", tip: "Offer discounts, flexible cancellations. Target remote workers & couples.", color: "#94a3b8" },
                ]).map(s => (
                  <div key={s.season} style={{ marginBottom: "10px", paddingBottom: "10px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ fontSize: "11px", fontWeight: "700", color: s.color, marginBottom: "3px" }}>{s.season}</div>
                    <div style={{ fontSize: "11px", color: "#94a3b8", lineHeight: "1.5" }}>{s.tip}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── CALCULATOR ── */}
        {tab === "calculator" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
              <div>
                <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "4px" }}>Cash Flow Calculator</h2>
                <p style={{ fontSize: "12px", color: "#64748b" }}>Modeling: <strong style={{ color: selectedMkt.color }}>{selectedMkt.name}</strong></p>
              </div>
              <div style={{ display: "flex", gap: "5px", flexWrap: "wrap" }}>
                {MARKETS.map(m => (
                  <button key={m.id} onClick={() => setSelectedMkt(m)}
                    style={{ padding: "4px 10px", borderRadius: "8px", border: `1px solid ${selectedMkt.id === m.id ? m.color : "rgba(255,255,255,0.1)"}`, background: selectedMkt.id === m.id ? m.color + "22" : "transparent", color: selectedMkt.id === m.id ? m.color : "#64748b", fontSize: "10px", fontWeight: "600", cursor: "pointer" }}>
                    {m.name.split(" /")[0].split(" ")[0]}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.06)", padding: "24px" }}>
              <CashFlowCalc market={selectedMkt} key={selectedMkt.id} />
            </div>
            <div style={{ marginTop: "14px", background: "rgba(251,191,36,0.05)", borderRadius: "12px", border: "1px solid rgba(251,191,36,0.15)", padding: "12px 16px", fontSize: "11px", color: "#94a3b8", lineHeight: "1.6" }}>
              ⚠️ <strong style={{ color: "#fbbf24" }}>Disclaimer:</strong> Revenue estimates are market averages. Actual results depend on property, amenities, management quality, and seasonality. Not financial advice. DSCR threshold of 1.25 is common — verify with your lender.
            </div>
          </div>
        )}

        {/* ── CHECKLIST ── */}
        {tab === "checklist" && (
          <div>
            <h2 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "6px" }}>Buyer's Due Diligence Checklist</h2>
            <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "20px" }}>Covers all markets — Poconos, Delaware Beaches, NJ Shore. Click items to check off.</p>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              {[
                { title: "🏛️ Legal & Regulatory", color: "#22d3ee", items: ["Confirm municipality allows STR (permit/license available)", "Verify HOA bylaws explicitly permit short-term rental", "Check if STR license cap exists or is pending", "Jim Thorpe: verify property is in C1/C2/C3/R4 zone only", "NJ Shore: confirm municipal registration + occupancy tax rules", "DE: note new statewide 4.5% lodging tax (eff. Jan 1, 2025)", "PA: confirm local occupancy tax + 6% PA hotel tax compliance", "Review occupancy limits, parking rules, and noise ordinances"] },
                { title: "💰 Financial Analysis", color: "#34d399", items: ["Get actual rental history from seller if property is active STR", "Run AirDNA / Rabbu comps for specific zip code", "Model 3 scenarios: conservative (70% avg), base, optimistic", "Confirm investment property mortgage rate (typically +0.5–1%)", "Calculate DSCR ≥ 1.25 if using DSCR loan product", "Budget $15K–$25K for initial furnishing + setup costs", "Model break-even occupancy at your purchase price + rate", "Account for PA/NJ/DE property tax — verify county rate"] },
                { title: "🏠 Property Due Diligence", color: "#a78bfa", items: ["Full inspection: HVAC, septic/sewer, roof, windows, foundation", "Flood zone check — critical for all DE and NJ beach properties", "Get flood insurance estimate (can be $1,200–$3,500+/yr)", "Verify well water quality if applicable (many Poconos properties)", "Check age of major systems — budget replacements into offer", "Review seller's STR platform reviews if listing already exists", "Estimate cost of adding hot tub, game room, other amenities", "Confirm internet speed — critical for remote worker guests"] },
                { title: "✅ STR Optimization", color: "#f59e0b", items: ["Identify local co-host / PM before closing (8–12% vs 20–30%)", "Set up Airbnb + VRBO dual-listing from day one", "Enable dynamic pricing (PriceLabs or Wheelhouse)", "Budget $800–$1,500 for professional photography", "Plan peak-season minimum stays (3+ nights Jul–Aug for beach, ski weekends for Poconos)", "Identify nearest maintenance vendor: plumber, handyman, cleaner", "Review top 5 competitor listings in zip code for pricing benchmarks", "Consider STR-specific insurance (Proper or Steadily) — standard homeowners won't cover STR"] },
              ].map(section => (
                <div key={section.title} style={{ background: "rgba(255,255,255,0.02)", borderRadius: "14px", border: `1px solid ${section.color}22`, padding: "18px" }}>
                  <h3 style={{ fontSize: "13px", fontWeight: "700", color: section.color, marginBottom: "14px" }}>{section.title}</h3>
                  {section.items.map(item => <CheckItem key={item} item={item} color={section.color} />)}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
