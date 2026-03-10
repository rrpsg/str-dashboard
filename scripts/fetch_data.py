"""
STR Data Fetcher
================
Scrapes Zillow & Redfin for STR listings in target markets,
then writes results to public/data.json in the repo.

GitHub Actions commits that file automatically — no Google Cloud,
no service accounts, no external APIs needed.

Run locally:
  pip install -r scripts/requirements.txt
  python scripts/fetch_data.py

The script will write/overwrite public/data.json.
"""

import json
import time
import random
import logging
import os
from datetime import date, datetime
from pathlib import Path

import requests
from bs4 import BeautifulSoup

# ─── LOGGING ─────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s"
)
log = logging.getLogger(__name__)

# ─── OUTPUT PATH ─────────────────────────────────────────────────────────────

OUTPUT_FILE = Path(__file__).parent.parent / "public" / "data.json"

# ─── STATIC MARKET DATA ──────────────────────────────────────────────────────
# These are research-based estimates. Update manually when market conditions
# change, or replace with an AirDNA/Mashvisor API call if you subscribe.

MARKETS = [
    {
        "id": "white-haven",
        "name": "White Haven",
        "region": "poconos",
        "type": "Cabin / Mountain",
        "adr": 241,
        "occupancy": 0.67,
        "annualRevenue": 41000,
        "medianPrice": 208000,
        "roiPct": 15,
        "driveFromPhilly": "2 hrs",
        "color": "#f59e0b",
        "tag": "🔥 Best Cash Flow",
        "notes": "Highest occupancy in region (67%). Near Lehigh Gorge State Park & Jack Frost/Split Rock ski.",
        "pros": ["~15% STR ROI — best in region", "Lowest prices ($150–$250K range)", "67% avg occupancy (highest regional)", "Light regulation — $350/yr STR fee"],
        "cons": ["Lower ADR ($241) vs beach/lake", "Must notify municipality 1 wk before guest arrival", "Less name recognition than Lake Harmony"],
    },
    {
        "id": "locust-lake",
        "name": "Locust Lake Village",
        "region": "poconos",
        "type": "Lakefront + Cabin",
        "adr": 300,
        "occupancy": 0.45,
        "annualRevenue": 49000,
        "medianPrice": 295000,
        "roiPct": 8,
        "driveFromPhilly": "2 hrs",
        "color": "#fb923c",
        "tag": "🎯 Budget Fit",
        "notes": "Golf carts & ATVs allowed. HOA rental license $700/yr. Tobyhanna Twp lifted STR cap Mar 2025.",
        "pros": ["Fits budget comfortably", "Golf carts/ATVs = guest appeal", "Lake access", "STR cap lifted"],
        "cons": ["Lowest ADR of Poconos group", "HOA approval required", "Older home stock may need updates"],
    },
    {
        "id": "arrowhead",
        "name": "Arrowhead Lake",
        "region": "poconos",
        "type": "Lakefront + Cabin",
        "adr": 310,
        "occupancy": 0.46,
        "annualRevenue": 52000,
        "medianPrice": 320000,
        "roiPct": 7,
        "driveFromPhilly": "2 hrs",
        "color": "#34d399",
        "tag": "🏊 Amenity-Rich",
        "notes": "Gated community with pools, beaches, tennis, trails. Tobyhanna Twp (cap lifted). HOA $700/yr.",
        "pros": ["Resort-like amenities", "STR cap lifted", "Budget-friendly", "Year-round draw"],
        "cons": ["Strong seasonality", "HOA wristband program complexity", "Higher HOA fees"],
    },
    {
        "id": "tannersville",
        "name": "Tannersville / Camelback",
        "region": "poconos",
        "type": "Ski-Area",
        "adr": 329,
        "occupancy": 0.48,
        "annualRevenue": 58000,
        "medianPrice": 340000,
        "roiPct": 7,
        "driveFromPhilly": "1.5 hrs",
        "color": "#a78bfa",
        "tag": "💰 Best Value",
        "notes": "Closest Poconos market to Philly (1.5 hrs). Near Camelback Mountain. Must verify HOA.",
        "pros": ["Closest Poconos market to Philly", "Camelback = year-round demand", "In budget range"],
        "cons": ["Some HOAs restrict STR", "More resort competition", "Lower ADR than Lake Harmony"],
    },
    {
        "id": "jim-thorpe",
        "name": "Jim Thorpe",
        "region": "poconos",
        "type": "Historic / Cabin",
        "adr": 253,
        "occupancy": 0.54,
        "annualRevenue": 45000,
        "medianPrice": 336000,
        "roiPct": 6,
        "driveFromPhilly": "1.75 hrs",
        "color": "#64748b",
        "tag": "⚠️ Zoning Risk",
        "notes": "2021 ordinance restricts NEW STRs to C1/C2/C3/R4 zones only. Must verify zoning before purchase.",
        "pros": ["Low competition", "Victorian charm", "1.75 hrs from Philly"],
        "cons": ["STR restricted to select zones ONLY", "Must verify zoning before purchase", "5% local occ tax + 6% PA hotel tax"],
    },
    {
        "id": "lake-harmony",
        "name": "Lake Harmony",
        "region": "poconos",
        "type": "Lakefront + Ski",
        "adr": 418,
        "occupancy": 0.52,
        "annualRevenue": 79000,
        "medianPrice": 460000,
        "roiPct": 6,
        "driveFromPhilly": "2 hrs",
        "color": "#22d3ee",
        "tag": "🏆 Premium Pick",
        "notes": "Top Poconos market. Highest ADR ($418). STR license $500/yr. Thin cash flow at current prices.",
        "pros": ["Year-round demand (ski + lake)", "Highest ADR in region ($418)", "STR regulations very clear"],
        "cons": ["Prices $400–$500K+ = thin cash flow", "Most competitive STR market"],
    },
    {
        "id": "milton-de",
        "name": "Milton, DE",
        "region": "delaware",
        "type": "Coastal / Inland Beach",
        "adr": 270,
        "occupancy": 0.58,
        "annualRevenue": 32000,
        "medianPrice": 401000,
        "roiPct": 8,
        "driveFromPhilly": "2.5 hrs",
        "color": "#34d399",
        "tag": "🏆 DE Best Value",
        "notes": "15 min from Rehoboth Beach. Only 40 active STRs = very low competition. No DE state sales tax.",
        "pros": ["8% ROI at $401K median", "Only 40 active STRs", "No DE state sales tax"],
        "cons": ["Not beachfront", "Very strong summer seasonality", "Less established STR market"],
    },
    {
        "id": "ocean-view-de",
        "name": "Ocean View / Millville, DE",
        "region": "delaware",
        "type": "Near-Beach Coastal",
        "adr": 290,
        "occupancy": 0.50,
        "annualRevenue": 28000,
        "medianPrice": 380000,
        "roiPct": 7,
        "driveFromPhilly": "2.5 hrs",
        "color": "#06b6d4",
        "tag": "🌊 Budget Beach",
        "notes": "5-min drive to Bethany Beach. Lighter regulation than incorporated beach towns.",
        "pros": ["5 min to Bethany Beach", "Lighter regulation", "Same drive market as Rehoboth"],
        "cons": ["Lower ADR than beachfront", "Heavy summer concentration"],
    },
    {
        "id": "rehoboth",
        "name": "Rehoboth Beach, DE",
        "region": "delaware",
        "type": "Beachfront (Over Budget)",
        "adr": 374,
        "occupancy": 0.56,
        "annualRevenue": 78000,
        "medianPrice": 1960000,
        "roiPct": 2,
        "driveFromPhilly": "2.5 hrs",
        "color": "#475569",
        "tag": "📋 Reference Only",
        "notes": "Over budget at $1.96M median. 2% ROI. Reference benchmark only.",
        "pros": ["$78K avg revenue", "Massive drive market"],
        "cons": ["Median $1.96M — 4x over budget", "~2% ROI"],
    },
    {
        "id": "ocean-city-nj",
        "name": "Ocean City, NJ",
        "region": "nj",
        "type": "Beachfront (Over Budget)",
        "adr": 272,
        "occupancy": 0.55,
        "annualRevenue": 55000,
        "medianPrice": 1262500,
        "roiPct": 3,
        "driveFromPhilly": "1.5 hrs",
        "color": "#475569",
        "tag": "📋 Reference Only",
        "notes": "Over budget. $1.26M median. Appreciation play only.",
        "pros": ["$55K revenue", "Closest NJ Shore to Philly"],
        "cons": ["$1.26M median", "~3% ROI"],
    },
    {
        "id": "cape-may-nj",
        "name": "Cape May, NJ",
        "region": "nj",
        "type": "Beachfront (Over Budget)",
        "adr": 378,
        "occupancy": 0.59,
        "annualRevenue": 75000,
        "medianPrice": 915000,
        "roiPct": 2,
        "driveFromPhilly": "1.75 hrs",
        "color": "#475569",
        "tag": "📋 Reference Only",
        "notes": "Best STR metrics on NJ Shore but $915K median. Doesn't pencil at budget.",
        "pros": ["$75K revenue", "59% occupancy"],
        "cons": ["$915K median", "~2% ROI"],
    },
]

# ─── SEARCH TARGETS ───────────────────────────────────────────────────────────

LISTING_SEARCHES = [
    {
        "market_id": "white-haven",
        "market_name": "White Haven",
        "region": "poconos",
        "zillow_url": "https://www.zillow.com/white-haven-pa/",
        "redfin_url": "https://www.redfin.com/city/19440/PA/White-Haven",
        "min_price": 130000,
        "max_price": 520000,
    },
    {
        "market_id": "lake-harmony",
        "market_name": "Lake Harmony",
        "region": "poconos",
        "zillow_url": "https://www.zillow.com/lake-harmony-pa/",
        "redfin_url": "https://www.redfin.com/PA/Lake-Harmony",
        "min_price": 150000,
        "max_price": 520000,
    },
    {
        "market_id": "tannersville",
        "market_name": "Tannersville / Camelback",
        "region": "poconos",
        "zillow_url": "https://www.zillow.com/tannersville-pa/",
        "redfin_url": "https://www.redfin.com/city/18000/PA/Tannersville",
        "min_price": 150000,
        "max_price": 520000,
    },
    {
        "market_id": "milton-de",
        "market_name": "Milton, DE",
        "region": "delaware",
        "zillow_url": "https://www.zillow.com/milton-de/",
        "redfin_url": "https://www.redfin.com/city/12350/DE/Milton",
        "min_price": 250000,
        "max_price": 520000,
    },
    {
        "market_id": "ocean-view-de",
        "market_name": "Ocean View / Millville, DE",
        "region": "delaware",
        "zillow_url": "https://www.zillow.com/millville-de/",
        "redfin_url": "https://www.redfin.com/city/26938/DE/Millville",
        "min_price": 250000,
        "max_price": 520000,
    },
]

# ─── HELPERS ─────────────────────────────────────────────────────────────────

USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
]

def get_headers():
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://www.google.com/",
    }

def sleep():
    t = random.uniform(2.5, 5.5)
    log.info(f"  Sleeping {t:.1f}s...")
    time.sleep(t)

def estimate_revenue(price, region):
    """Rough STR revenue estimate based on price and region benchmarks."""
    rates = {"poconos": 0.18, "delaware": 0.09, "nj": 0.06}
    return round(price * rates.get(region, 0.12))

# ─── ZILLOW SCRAPER ──────────────────────────────────────────────────────────

def scrape_zillow(search):
    listings = []
    log.info(f"Zillow → {search['market_name']}")
    try:
        resp = requests.get(search["zillow_url"], headers=get_headers(), timeout=15)
        if resp.status_code != 200:
            log.warning(f"  Zillow HTTP {resp.status_code}")
            return listings

        soup = BeautifulSoup(resp.text, "lxml")
        script = soup.find("script", {"id": "__NEXT_DATA__"})
        if not script:
            log.warning("  No __NEXT_DATA__ — likely blocked by Zillow")
            return listings

        data = json.loads(script.string)
        results = (
            data.get("props", {})
                .get("pageProps", {})
                .get("searchPageState", {})
                .get("cat1", {})
                .get("searchResults", {})
                .get("listResults", [])
        )

        for r in results:
            price = r.get("price", 0)
            if not price or not (search["min_price"] <= price <= search["max_price"]):
                continue
            zpid = r.get("zpid", "")
            listings.append({
                "id": f"z-{zpid}",
                "source": "Zillow",
                "market_id": search["market_id"],
                "market": search["market_name"],
                "region": search["region"],
                "address": r.get("address", ""),
                "city": search["market_name"],
                "price": price,
                "beds": int(r.get("beds") or 0),
                "baths": float(r.get("baths") or 0),
                "sqft": int(r.get("area") or 0),
                "estRevenue": estimate_revenue(price, search["region"]),
                "daysOnMarket": r.get("daysOnZillow", 0),
                "amenities": [],
                "description": r.get("statusText", ""),
                "links": {
                    "Zillow": f"https://www.zillow.com/homedetails/{zpid}_zpid/" if zpid else search["zillow_url"]
                },
                "dateFetched": date.today().isoformat(),
            })

    except Exception as e:
        log.error(f"  Zillow error: {e}")

    log.info(f"  → {len(listings)} listings")
    return listings

# ─── REDFIN SCRAPER ──────────────────────────────────────────────────────────

def scrape_redfin(search):
    listings = []
    log.info(f"Redfin → {search['market_name']}")
    try:
        resp = requests.get(search["redfin_url"], headers=get_headers(), timeout=15)
        if resp.status_code != 200:
            log.warning(f"  Redfin HTTP {resp.status_code}")
            return listings

        soup = BeautifulSoup(resp.text, "lxml")

        # Redfin embeds listing data in JSON script tags
        for script in soup.find_all("script", type="application/json"):
            try:
                data = json.loads(script.string or "")
                homes = (
                    data.get("homes") or
                    data.get("payload", {}).get("homes") or []
                )
                if not homes:
                    continue
                for h in homes:
                    price = h.get("price", {}).get("value", 0) if isinstance(h.get("price"), dict) else h.get("price", 0)
                    if not price or not (search["min_price"] <= price <= search["max_price"]):
                        continue
                    mls = h.get("mlsId", {}).get("value", "") if isinstance(h.get("mlsId"), dict) else ""
                    url = h.get("url", "")
                    listings.append({
                        "id": f"r-{mls or url}",
                        "source": "Redfin",
                        "market_id": search["market_id"],
                        "market": search["market_name"],
                        "region": search["region"],
                        "address": h.get("streetLine", {}).get("value", "") if isinstance(h.get("streetLine"), dict) else h.get("streetLine", ""),
                        "city": h.get("city", search["market_name"]),
                        "price": price,
                        "beds": h.get("beds", 0) or 0,
                        "baths": h.get("baths", 0) or 0,
                        "sqft": h.get("sqFt", {}).get("value", 0) if isinstance(h.get("sqFt"), dict) else 0,
                        "estRevenue": estimate_revenue(price, search["region"]),
                        "daysOnMarket": h.get("dom", {}).get("value", 0) if isinstance(h.get("dom"), dict) else 0,
                        "amenities": [],
                        "description": "",
                        "links": {
                            "Redfin": f"https://www.redfin.com{url}" if url else search["redfin_url"]
                        },
                        "dateFetched": date.today().isoformat(),
                    })
                break
            except Exception:
                continue

    except Exception as e:
        log.error(f"  Redfin error: {e}")

    log.info(f"  → {len(listings)} listings")
    return listings

# ─── DEDUPLICATION ───────────────────────────────────────────────────────────

def deduplicate(listings):
    seen, unique = set(), []
    for l in listings:
        key = l["address"].lower().strip()
        if key and key not in seen:
            seen.add(key)
            unique.append(l)
        elif not key:
            unique.append(l)  # keep listings without address
    return unique

# ─── MAIN ────────────────────────────────────────────────────────────────────

def main():
    log.info("=== STR Fetch Starting ===")

    all_listings = []
    for search in LISTING_SEARCHES:
        zillow = scrape_zillow(search)
        sleep()
        redfin = scrape_redfin(search)
        sleep()
        all_listings.extend(zillow + redfin)

    listings = deduplicate(all_listings)
    log.info(f"Total unique listings: {len(listings)}")

    payload = {
        "meta": {
            "fetchedAt": datetime.utcnow().isoformat() + "Z",
            "listingCount": len(listings),
            "marketCount": len(MARKETS),
        },
        "markets": MARKETS,
        "listings": listings,
    }

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(json.dumps(payload, indent=2))
    log.info(f"Written → {OUTPUT_FILE}")
    log.info("=== Done ===")

if __name__ == "__main__":
    main()
