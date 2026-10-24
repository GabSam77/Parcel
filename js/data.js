/* =========================================================================
   Location Intelligence — dummy data layer
   Everything here is fictional demo data for the concept prototype.
   Swap these arrays for API responses when you build the real product.
   ========================================================================= */

window.PF = window.PF || {};

/* ---------- Cities (reference points for distances and master plans) ---------- */
PF.cities = [
  { id: 'ncr', name: 'Delhi NCR', lat: 28.6139, lng: 77.2090, cbd: { name: 'Connaught Place', lat: 28.6315, lng: 77.2167 }, airport: { name: 'IGI Airport', lat: 28.5562, lng: 77.1000 }, plan: 'MPD 2041 / GMUC-2031' },
  { id: 'mumbai', name: 'Mumbai MMR', lat: 19.0760, lng: 72.8777, cbd: { name: 'Nariman Point', lat: 18.9256, lng: 72.8242 }, airport: { name: 'CSMI Airport', lat: 19.0896, lng: 72.8656 }, plan: 'MCGM DP 2034' },
  { id: 'pune', name: 'Pune', lat: 18.5204, lng: 73.8567, cbd: { name: 'Shivajinagar', lat: 18.5310, lng: 73.8470 }, airport: { name: 'Pune Airport', lat: 18.5822, lng: 73.9197 }, plan: 'PMRDA DP 2041' },
  { id: 'bengaluru', name: 'Bengaluru', lat: 12.9716, lng: 77.5946, cbd: { name: 'MG Road', lat: 12.9756, lng: 77.6066 }, airport: { name: 'Kempegowda Airport', lat: 13.1986, lng: 77.7066 }, plan: 'BDA RMP 2031' },
  { id: 'hyderabad', name: 'Hyderabad', lat: 17.3850, lng: 78.4867, cbd: { name: 'Abids', lat: 17.3920, lng: 78.4760 }, airport: { name: 'RGI Airport', lat: 17.2403, lng: 78.4294 }, plan: 'HMDA Master Plan 2031' },
  { id: 'chennai', name: 'Chennai', lat: 13.0827, lng: 80.2707, cbd: { name: 'Anna Salai', lat: 13.0604, lng: 80.2496 }, airport: { name: 'Chennai Airport', lat: 12.9941, lng: 80.1709 }, plan: 'CMDA Master Plan' },
  { id: 'ahmedabad', name: 'Ahmedabad', lat: 23.0225, lng: 72.5714, cbd: { name: 'Ashram Road', lat: 23.0300, lng: 72.5710 }, airport: { name: 'SVPI Airport', lat: 23.0734, lng: 72.6266 }, plan: 'AUDA DP 2031' },
  { id: 'kolkata', name: 'Kolkata', lat: 22.5726, lng: 88.3639, cbd: { name: 'Esplanade', lat: 22.5646, lng: 88.3510 }, airport: { name: 'NSCBI Airport', lat: 22.6547, lng: 88.4467 }, plan: 'KMDA LUDCP' },
];

/* ---------- Named micro-markets (search + chat entity detection) ---------- */
PF.places = [
  { id: 'gurugram-99a', city: 'ncr', name: 'Sector 99A, Gurugram', lat: 28.4870, lng: 76.9620, district: 'Gurugram, Haryana', zone: 'Residential (GMUC-2031)', blurb: 'Dwarka Expressway corridor with new group-housing launches and NH-248BB access.' },
  { id: 'jewar', city: 'ncr', name: 'Jewar', lat: 28.1700, lng: 77.6100, district: 'Gautam Buddh Nagar, Uttar Pradesh', zone: 'YEIDA Mixed Land Use', blurb: 'Yamuna Expressway node beside the Noida International Airport site.' },
  { id: 'noida-150', city: 'ncr', name: 'Sector 150, Noida', lat: 28.4170, lng: 77.4870, district: 'Gautam Buddh Nagar, Uttar Pradesh', zone: 'Residential (Noida MP 2031)', blurb: 'Low-density sector on the Noida–Greater Noida Expressway.' },
  { id: 'bkc', city: 'mumbai', name: 'Bandra Kurla Complex', lat: 19.0660, lng: 72.8650, district: 'Mumbai Suburban, Maharashtra', zone: 'Commercial (MMRDA)', blurb: 'Mumbai’s main office district, on Metro Line 3 and the future high-speed rail terminal.' },
  { id: 'panvel', city: 'mumbai', name: 'Panvel', lat: 18.9894, lng: 73.1175, district: 'Raigad, Maharashtra', zone: 'NAINA Residential', blurb: 'Navi Mumbai Airport influence area with Atal Setu access to South Mumbai.' },
  { id: 'bhiwandi', city: 'mumbai', name: 'Bhiwandi', lat: 19.2967, lng: 73.0631, district: 'Thane, Maharashtra', zone: 'Industrial / Warehousing', blurb: 'India’s largest warehousing cluster, on the Samruddhi and Mumbai–Nashik corridors.' },
  { id: 'hinjewadi', city: 'pune', name: 'Hinjewadi', lat: 18.5913, lng: 73.7389, district: 'Pune, Maharashtra', zone: 'IT / ITES (MIDC)', blurb: 'Pune’s IT hub, linked by the upcoming Metro Line 3.' },
  { id: 'chakan', city: 'pune', name: 'Chakan', lat: 18.7606, lng: 73.8636, district: 'Pune, Maharashtra', zone: 'Industrial (MIDC)', blurb: 'Automotive manufacturing belt on the Pune–Nashik highway.' },
  { id: 'devanahalli', city: 'bengaluru', name: 'Devanahalli', lat: 13.2437, lng: 77.7120, district: 'Bengaluru Rural, Karnataka', zone: 'Mixed Residential (R2)', blurb: 'Airport corridor on NH-44, north of Kempegowda International Airport.' },
  { id: 'whitefield', city: 'bengaluru', name: 'Whitefield', lat: 12.9698, lng: 77.7500, district: 'Bengaluru Urban, Karnataka', zone: 'Commercial / IT (C4)', blurb: 'Eastern IT employment cluster on the Purple Line.' },
  { id: 'hitec-city', city: 'hyderabad', name: 'HITEC City', lat: 17.4435, lng: 78.3772, district: 'Hyderabad, Telangana', zone: 'Commercial / IT', blurb: 'Western office corridor around Madhapur and the Financial District.' },
  { id: 'shamshabad', city: 'hyderabad', name: 'Shamshabad', lat: 17.2600, lng: 78.3900, district: 'Rangareddy, Telangana', zone: 'Airport Influence – Mixed', blurb: 'Land and logistics market around RGI Airport and the Outer Ring Road.' },
  { id: 'omr', city: 'chennai', name: 'OMR, Sholinganallur', lat: 12.9010, lng: 80.2279, district: 'Chennai, Tamil Nadu', zone: 'IT Corridor – Mixed', blurb: 'Old Mahabalipuram Road IT corridor, on the upcoming Metro Phase 2.' },
  { id: 'sriperumbudur', city: 'chennai', name: 'Sriperumbudur', lat: 12.9675, lng: 79.9419, district: 'Kancheepuram, Tamil Nadu', zone: 'Industrial (SIPCOT)', blurb: 'Electronics and automotive manufacturing cluster west of Chennai.' },
  { id: 'gift-city', city: 'ahmedabad', name: 'GIFT City', lat: 23.1615, lng: 72.6838, district: 'Gandhinagar, Gujarat', zone: 'IFSC / SEZ', blurb: 'India’s international financial services centre on the Sabarmati.' },
  { id: 'sanand', city: 'ahmedabad', name: 'Sanand', lat: 22.9917, lng: 72.3820, district: 'Ahmedabad, Gujarat', zone: 'Industrial (GIDC)', blurb: 'Automotive and semiconductor manufacturing hub west of Ahmedabad.' },
  { id: 'new-town', city: 'kolkata', name: 'New Town, Rajarhat', lat: 22.5806, lng: 88.4716, district: 'North 24 Parganas, West Bengal', zone: 'Mixed Use (NKDA)', blurb: 'Planned township next to Salt Lake Sector V and the airport.' },
];
PF.cityOf = p => PF.cities.find(c => c.id === p.city) || PF.cities[0];
PF.nearestCity = pt => PF.cities.slice().sort((a, b) => PF.dist(pt, a) - PF.dist(pt, b))[0];

/* ---------- Metro lines (approximate alignments, selected cities) ---------- */
PF.metro = [
  { id: 'dl-yellow', name: 'Delhi Metro Yellow Line', status: 'operational', color: '#C99A06', stations: [
    ['Samaypur Badli', 28.7448, 77.1383], ['Kashmere Gate', 28.6675, 77.2283], ['Rajiv Chowk', 28.6328, 77.2197], ['Hauz Khas', 28.5433, 77.2066], ['Qutub Minar', 28.5134, 77.1863], ['Millennium City Centre', 28.4594, 77.0726] ] },
  { id: 'ggn-metro', name: 'Gurugram Metro', status: 'upcoming', eta: '2028', color: '#1F6FB2', stations: [
    ['Millennium City Centre', 28.4594, 77.0726], ['Sector 9', 28.4720, 77.0280], ['Sector 101', 28.4890, 76.9780], ['Dwarka Expressway', 28.5050, 77.0050], ['Cyber City', 28.4950, 77.0890] ] },
  { id: 'mum-aqua', name: 'Mumbai Metro Line 3', status: 'operational', color: '#0E8C9A', stations: [
    ['Aarey JVLR', 19.1310, 72.8800], ['SEEPZ', 19.1260, 72.8740], ['Airport T2', 19.0990, 72.8740], ['BKC', 19.0660, 72.8650], ['Dadar', 19.0190, 72.8420], ['Worli', 19.0000, 72.8160], ['Cuffe Parade', 18.9150, 72.8200] ] },
  { id: 'pune-l1', name: 'Pune Metro Line 1', status: 'operational', color: '#6D3FD0', stations: [
    ['PCMC', 18.6298, 73.7997], ['Bopodi', 18.5730, 73.8320], ['Shivajinagar', 18.5310, 73.8470], ['Swargate', 18.5018, 73.8636] ] },
  { id: 'pune-l3', name: 'Pune Metro Line 3', status: 'upcoming', eta: '2026', color: '#1F6FB2', stations: [
    ['Hinjewadi Phase 3', 18.5850, 73.6880], ['Hinjewadi', 18.5913, 73.7389], ['Balewadi', 18.5770, 73.7790], ['University', 18.5530, 73.8250], ['Shivajinagar', 18.5310, 73.8470] ] },
  { id: 'blr-purple', name: 'Namma Metro Purple Line', status: 'operational', color: '#6D3FD0', stations: [
    ['Challaghatta', 12.9170, 77.4800], ['Majestic', 12.9757, 77.5728], ['MG Road', 12.9756, 77.6066], ['Indiranagar', 12.9784, 77.6408], ['KR Puram', 13.0006, 77.6752], ['Whitefield', 12.9952, 77.7580] ] },
  { id: 'blr-blue', name: 'Namma Metro Blue Line', status: 'upcoming', eta: '2027', color: '#1F6FB2', stations: [
    ['Silk Board', 12.9177, 77.6238], ['Marathahalli', 12.9569, 77.7011], ['KR Puram', 13.0006, 77.6752], ['Hebbal', 13.0358, 77.5970], ['Bagalur Cross', 13.1330, 77.6420], ['KIA Terminal', 13.1986, 77.7066] ] },
  { id: 'hyd-blue', name: 'Hyderabad Metro Blue Line', status: 'operational', color: '#1F4FB2', stations: [
    ['Raidurg', 17.4420, 78.3770], ['HITEC City', 17.4475, 78.3816], ['Jubilee Hills', 17.4300, 78.4100], ['Ameerpet', 17.4375, 78.4482], ['Tarnaka', 17.4280, 78.5370], ['Nagole', 17.3920, 78.5590] ] },
  { id: 'hyd-airport', name: 'Hyderabad Airport Metro', status: 'upcoming', eta: '2029', color: '#B48A3C', stations: [
    ['Raidurg', 17.4420, 78.3770], ['Financial District', 17.4150, 78.3400], ['Narsingi', 17.3870, 78.3570], ['Shamshabad', 17.2600, 78.3900], ['RGI Airport', 17.2403, 78.4294] ] },
  { id: 'chn-blue', name: 'Chennai Metro Blue Line', status: 'operational', color: '#1F6FB2', stations: [
    ['Wimco Nagar', 13.1800, 80.3100], ['Chennai Central', 13.0827, 80.2750], ['LIC', 13.0600, 80.2600], ['Teynampet', 13.0410, 80.2490], ['Guindy', 13.0090, 80.2130], ['Airport', 12.9941, 80.1709] ] },
  { id: 'chn-l3', name: 'Chennai Metro Phase 2 – Line 3', status: 'upcoming', eta: '2027', color: '#C2185B', stations: [
    ['Madhavaram', 13.1500, 80.2300], ['Purasawalkam', 13.0900, 80.2500], ['Mylapore', 13.0330, 80.2700], ['Adyar', 13.0060, 80.2570], ['Thoraipakkam', 12.9400, 80.2350], ['Sholinganallur', 12.9010, 80.2279], ['SIPCOT', 12.8300, 80.2200] ] },
  { id: 'amd-l1', name: 'Ahmedabad Metro Line 1', status: 'operational', color: '#0F8A4F', stations: [
    ['Vastral', 23.0000, 72.6600], ['Kalupur', 23.0260, 72.6010], ['Old High Court', 23.0400, 72.5700], ['Thaltej', 23.0500, 72.5100] ] },
  { id: 'amd-gift', name: 'Ahmedabad–Gandhinagar Metro', status: 'upcoming', eta: '2026', color: '#1F6FB2', stations: [
    ['Motera', 23.0900, 72.6000], ['Koteshwar', 23.1200, 72.6200], ['GNLU', 23.1500, 72.6500], ['GIFT City', 23.1615, 72.6838] ] },
  { id: 'kol-green', name: 'Kolkata Metro Green Line', status: 'operational', color: '#0F8A4F', stations: [
    ['Howrah', 22.5830, 88.3420], ['Esplanade', 22.5646, 88.3510], ['Sealdah', 22.5670, 88.3700], ['Salt Lake Sector V', 22.5760, 88.4330] ] },
  { id: 'kol-orange', name: 'Kolkata Metro Orange Line', status: 'upcoming', eta: '2027', color: '#C26A1E', stations: [
    ['Kavi Subhash', 22.4700, 88.4000], ['Ruby', 22.5130, 88.4010], ['Beleghata', 22.5600, 88.4000], ['New Town', 22.5806, 88.4716], ['Airport', 22.6547, 88.4467] ] },
];

/* ---------- Expressways & highways in operation ---------- */
PF._ring = (lat, lng, r, n = 14) => Array.from({ length: n + 1 }, (_, i) => { const a = i / n * Math.PI * 2; return [+(lat + Math.sin(a) * r).toFixed(4), +(lng + Math.cos(a) * r * 1.05).toFixed(4)]; });
PF.roads = [
  { name: 'Dwarka Expressway', pts: [[28.5800, 77.0600], [28.5300, 77.0300], [28.4870, 76.9700], [28.4200, 76.9500]] },
  { name: 'Yamuna Expressway', pts: [[28.4700, 77.5000], [28.1700, 77.6100], [27.8800, 77.7400], [27.1800, 78.0000]] },
  { name: 'Atal Setu (MTHL)', pts: [[18.9900, 72.8400], [18.9600, 72.9500], [18.9400, 73.0100]] },
  { name: 'Samruddhi Mahamarg', pts: [[19.3000, 73.1000], [19.9000, 74.3000], [20.2000, 75.3000], [20.7500, 77.0000], [21.1000, 79.0500]] },
  { name: 'Mumbai–Pune Expressway', pts: [[19.0300, 73.1000], [18.7500, 73.4000], [18.6600, 73.7700]] },
  { name: 'Hyderabad ORR', ring: true, pts: PF._ring(17.3850, 78.4867, 0.20) },
  { name: 'Bengaluru–Mysuru Expressway', pts: [[12.9000, 77.4900], [12.7200, 77.2800], [12.5200, 76.8900], [12.3000, 76.6400]] },
];

/* ---------- Sanctioned infrastructure (selection) ---------- */
PF.upcoming = [
  { id: 'nia', type: 'point', name: 'Noida International Airport, Jewar', eta: '2026', cost: '₹29,560 Cr', color: '#B48A3C', lat: 28.1700, lng: 77.6100 },
  { id: 'hsr', type: 'rail', name: 'Mumbai–Ahmedabad High-Speed Rail', eta: '2028', cost: '₹1.08 L Cr', color: '#C26A1E',
    pts: [[19.0660, 72.8650], [19.1900, 73.0200], [19.4500, 72.8100], [20.3700, 72.9100], [21.1700, 72.8300], [22.3100, 73.1800], [23.0800, 72.5900]] },
  { id: 'dme', type: 'road', name: 'Delhi–Mumbai Expressway (final sections)', eta: '2027', cost: '₹1 L Cr', color: '#B48A3C',
    pts: [[28.2500, 77.0700], [27.0000, 76.4000], [25.2000, 75.8500], [23.3000, 75.0500], [22.3100, 73.1800], [19.4500, 72.8100]] },
  { id: 'strr', type: 'road', name: 'Bengaluru Satellite Town Ring Road', eta: '2027', cost: '₹17,000 Cr', color: '#B48A3C', pts: PF._ring(12.9716, 77.5946, 0.30) },
  { id: 'rrr', type: 'road', name: 'Hyderabad Regional Ring Road', eta: '2029', cost: '₹24,000 Cr', color: '#B48A3C', pts: PF._ring(17.3850, 78.4867, 0.55) },
  { id: 'prr-pune', type: 'road', name: 'Pune Ring Road', eta: '2028', cost: '₹26,000 Cr', color: '#B48A3C', pts: PF._ring(18.5204, 73.8567, 0.25) },
  { id: 'chennai-prr', type: 'road', name: 'Chennai Peripheral Ring Road', eta: '2027', cost: '₹12,300 Cr', color: '#B48A3C',
    pts: [[13.2200, 80.3200], [13.1400, 79.9100], [12.9700, 79.9400], [12.7600, 80.0000], [12.6200, 80.1900]] },
  { id: 'nmia-2', type: 'point', name: 'Navi Mumbai Airport – Phase 2', eta: '2029', cost: '₹19,650 Cr', color: '#B48A3C', lat: 18.9900, lng: 73.0700 },
  { id: 'gift-2', type: 'point', name: 'GIFT City Phase 2', eta: '2028', cost: '₹8,000 Cr', color: '#B48A3C', lat: 23.1550, lng: 72.6750 },
  { id: 'kia-t3', type: 'point', name: 'Kempegowda Airport Terminal 3', eta: '2030', cost: '₹13,000 Cr', color: '#B48A3C', lat: 13.2150, lng: 77.7250 },
];

/* ---------- POIs: deterministic dummy points around hubs ---------- */
(function buildPOIs() {
  let seed = 42;
  const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const cats = {
    hospital: { label: 'Hospital', color: '#B42318', names: ['Northstar Multispecialty', 'Aster Grove Hospital', 'Cedarline Medical', 'Sanjeevani Care', 'Riverbend Hospital', 'Lifepoint Clinic'] },
    school:   { label: 'School', color: '#1F6FB2', names: ['Greenfield International', 'Banyan Public School', 'Orchid Heights Academy', 'Sunrise Vidyalaya', 'Meridian School', 'Lakeview High'] },
    office:   { label: 'Business park', color: '#6D3FD0', names: ['Arcadia Tech Park', 'Northgate Business Hub', 'Vertex SEZ', 'Skyline Offices', 'Quantum Square', 'Axis Commerce Park'] },
    retail:   { label: 'Retail', color: '#18794E', names: ['Promenade Mall', 'Market Square', 'Central Arcade', 'Galleria Walk', 'The Bazaar', 'High Street 44'] },
    industry: { label: 'Industrial', color: '#B48A3C', names: ['Industrial Plot Cluster', 'Precision Castings', 'Vega Auto Components', 'Helix Pharma Unit', 'Nimbus Aerostructures', 'Coldchain Hub'] },
  };
  PF.poiCats = cats;
  const pois = [];
  PF.places.forEach((hub, h) => {
    Object.keys(cats).forEach((c, ci) => {
      const n = 2 + Math.floor(rand() * 3);
      for (let i = 0; i < n; i++) {
        const a = rand() * Math.PI * 2, r = 0.006 + rand() * 0.045;
        pois.push({ cat: c, name: cats[c].names[(h + i + ci) % cats[c].names.length], lat: hub.lat + Math.sin(a) * r, lng: hub.lng + Math.cos(a) * r });
      }
    });
  });
  PF.pois = pois;
})();

/* ---------- Property taxonomy ---------- */
PF.taxonomy = [
  { id: 'land', name: 'Land', icon: 'land', blurb: 'Raw and converted land parcels by intended use', items: [
    ['Agricultural', 'Farm land, conversion potential & RTC records'],
    ['Residential', 'Land approved or zoned for housing'],
    ['Commercial', 'Land for office, retail or hospitality'],
    ['Industrial', 'State industrial corporation / private allotments'],
    ['Institutional', 'Land for schools, hospitals, public use'],
    ['Logistics', 'Large-format land near highways & rail'],
    ['Data Centre', 'Power-ready land for DC campuses'],
    ['Special Use', 'SEZ, defence-adjacent & other special zones'] ] },
  { id: 'residential', name: 'Residential', icon: 'home', blurb: 'Homes, plotted development and managed living', items: [
    ['Apartment', 'Units in a group housing project'],
    ['Villa', 'Gated villa communities'],
    ['Plot', 'Plotted layouts (development authority / DTCP)'],
    ['Student Housing', 'Purpose-built beds near campuses'],
    ['Co-living', 'Managed shared rental assets'],
    ['Senior Living', 'Assisted and independent living'] ] },
  { id: 'commercial', name: 'Commercial', icon: 'office', blurb: 'Income-producing office, retail and hotels', items: [
    ['Office', 'Grade A/B office towers and parks'],
    ['Retail', 'Malls, high-street and big-box'],
    ['Hospitality', 'Hotels, resorts and serviced apartments'],
    ['Mixed Use', 'Integrated retail + office + residential'] ] },
  { id: 'industrial', name: 'Industrial', icon: 'factory', blurb: 'Production and manufacturing assets', items: [
    ['Factory', 'Operating plants and built-to-suit units'],
    ['Manufacturing', 'Heavy and light manufacturing facilities'],
    ['Industrial Shed', 'Ready-built sheds and PEB structures'],
    ['Industrial Park', 'Multi-tenant industrial estates'] ] },
  { id: 'logistics', name: 'Logistics', icon: 'truck', blurb: 'Storage, distribution and supply-chain nodes', items: [
    ['Warehouse', 'Grade A/B storage facilities'],
    ['Distribution Centre', 'Regional DCs with high dock ratios'],
    ['Fulfilment Centre', 'E-commerce last-mile and FC hubs'],
    ['Cold Storage', 'Temperature-controlled facilities'],
    ['Logistics Park', 'Multi-building logistics campuses'] ] },
  { id: 'digital', name: 'Digital Infrastructure', icon: 'server', blurb: 'Compute, connectivity and power-hungry assets', items: [
    ['Data Centre', 'Single-building hyperscale or colo'],
    ['Data Centre Campus', 'Multi-hall campuses with substations'],
    ['Edge Data Centre', 'Small-format, low-latency sites'],
    ['Telecom', 'Towers, exchanges and fibre nodes'] ] },
  { id: 'institutional', name: 'Institutional', icon: 'columns', blurb: 'Social infrastructure and public assets', items: [
    ['Hospital', 'Multi-specialty and secondary care'],
    ['School', 'K-12 campuses'],
    ['University', 'Higher-education campuses'],
    ['Government', 'Civic and administrative properties'] ] },
];

/* ---------- Report sections ---------- */
PF.sections = [
  { id: 'overview', num: '01', short: 'Property Overview', title: 'Property Overview', icon: 'doc', pages: 2,
    desc: 'Who owns the parcel, its survey and khata record, and a Vaastu read of the plot\u2019s orientation and shape.',
    includes: ['Survey number / khata', 'Owner details', 'Plot orientation & shape', 'Vaastu rating'] },
  { id: 'infra', num: '02', short: 'Infrastructure', title: 'Infrastructure & Connectivity', icon: 'route', pages: 3,
    desc: 'Roads, airports, metro, RRTS, rail and social infrastructure today, what\u2019s coming next, and how the city is growing.',
    includes: ['Highways & access roads', 'Airports, metro, RRTS, rail & ports', 'Social infrastructure', 'Upcoming projects & map', 'Travel-time savings', '10-year growth imagery'] },
  { id: 'regulatory', num: '03', short: 'Regulatory & Approvals', title: 'Regulatory & Approvals', icon: 'shield', pages: 2,
    desc: 'Zoning and regulatory restrictions, the approvals you\u2019ll need, applicable schemes, and how much you can build.',
    includes: ['Regulatory restrictions', 'Government approvals', 'Applicable schemes & bylaws', 'Permissible FSI & density'] },
  { id: 'records', num: '04', short: 'Records & Litigation', title: 'Property Records, Ownership & Litigation', icon: 'columns', pages: 1,
    desc: 'Encumbrances, title chain and CERSAI checks, plus litigation and reputation screening of the borrower, group and promoters.',
    includes: ['Encumbrance verification', 'Legal & title review', 'Title chain & CERSAI', 'Borrower, group & promoter litigation', 'Adverse news & UN sanctions'] },
  { id: 'market', num: '05', short: 'Market & Catchment', title: 'Market & Catchment Intelligence', icon: 'chart', pages: 2,
    desc: 'Launches, absorption, pricing and developer land banks, plus who lives, works and spends within reach of the site.',
    includes: ['Launches, absorption & overhang', 'Micro-market price trends', 'Developer land banks', 'Built environment & commercial activity', 'Demographics & purchasing power'] },
  { id: 'site', num: '06', short: 'Site Attributes', title: 'Site Attributes & Considerations', icon: 'mountain', pages: 2,
    desc: 'The ground itself: seismic zone and terrain, groundwater and soil, flood exposure, slope, and structures on the parcel.',
    includes: ['Seismic zone & terrain', 'Groundwater & soil', 'Flood exposure', 'Slope & direction', 'Structures & built-up area'] },
];

/* Recommended sections per category (drives the "Recommended" badge) */
PF.recommend = {
  land: ['overview', 'regulatory', 'site'],
  residential: ['overview', 'infra', 'market'],
  commercial: ['infra', 'market', 'regulatory'],
  industrial: ['regulatory', 'infra', 'site'],
  logistics: ['infra', 'site', 'regulatory'],
  digital: ['infra', 'site', 'regulatory'],
  institutional: ['overview', 'market', 'infra'],
};

/* ---------- Icons (24px line icons) ---------- */
PF.icons = {
  land: '<path d="M3 17l5-3 5 3 8-5"/><path d="M3 12l5-3 5 3 8-5"/><path d="M8 9v5M13 12v5"/>',
  home: '<path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  office: '<rect x="4" y="3" width="10" height="18" rx="1"/><path d="M14 9h6v12h-6"/><path d="M7 7h1M10 7h1M7 11h1M10 11h1M7 15h1M10 15h1M17 13h0M17 17h0"/>',
  factory: '<path d="M3 21V10l6 4V10l6 4V6h6v15z"/><path d="M7 18h2M12 18h2M17 18h2"/>',
  truck: '<path d="M2 6h12v10H2z"/><path d="M14 10h4l3 3v3h-7"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  server: '<rect x="3" y="4" width="18" height="6" rx="1.5"/><rect x="3" y="14" width="18" height="6" rx="1.5"/><path d="M7 7h.01M7 17h.01M11 7h6M11 17h6"/>',
  columns: '<path d="M3 9l9-5 9 5"/><path d="M5 9v9M9.5 9v9M14.5 9v9M19 9v9"/><path d="M3 21h18"/>',
  doc: '<path d="M6 3h8l4 4v14H6z"/><path d="M14 3v4h4"/><path d="M9 12h6M9 16h6"/>',
  route: '<circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h7a3 3 0 000-6H9a3 3 0 010-6h7"/>',
  shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  mountain: '<path d="M2 20l7-12 4 6 3-4 6 10z"/><path d="M9 8l2 3"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  check: '<path d="M5 12l5 5 9-10"/>',
  pin: '<path d="M12 21s7-6.1 7-11.5A7 7 0 005 9.5C5 14.9 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  send: '<path d="M4 12l16-8-6 16-2-6z"/>',
  layers: '<path d="M12 3l9 5-9 5-9-5z"/><path d="M3 13l9 5 9-5"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  locate: '<circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M2 12h4M18 12h4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/>',
  download: '<path d="M12 4v11M7 10l5 5 5-5M4 20h16"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  link: '<path d="M10 14a4 4 0 005.66 0l3-3a4 4 0 00-5.66-5.66l-1 1"/><path d="M14 10a4 4 0 00-5.66 0l-3 3a4 4 0 005.66 5.66l1-1"/>',
  grid: '<rect x="4" y="4" width="7" height="7"/><rect x="13" y="4" width="7" height="7"/><rect x="4" y="13" width="7" height="7"/><rect x="13" y="13" width="7" height="7"/>',
};
PF.icon = (name, cls = '') => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${PF.icons[name] || ''}</svg>`;

/* ---------- Geo helpers ---------- */
PF.dist = (a, b) => {
  const R = 6371, toR = d => d * Math.PI / 180;
  const dLat = toR(b.lat - a.lat), dLng = toR(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
};
PF.fmtKm = d => d < 0.15 ? 'On site' : d < 1 ? `${Math.round(d * 1000)} m` : `${d.toFixed(1)} km`;
PF.fmtINR = n => '₹' + Math.round(n).toLocaleString('en-IN');
PF.dms = (v, pos, neg) => {
  const a = Math.abs(v), d = Math.floor(a), m = Math.floor((a - d) * 60), s = ((a - d - m / 60) * 3600).toFixed(1);
  return `${d}°${String(m).padStart(2, '0')}′${String(s).padStart(4, '0')}″${v >= 0 ? pos : neg}`;
};

/* Nearest station across all lines */
PF.nearestStations = (pt, status) => {
  const out = [];
  PF.metro.filter(l => !status || l.status === status).forEach(l => l.stations.forEach(([n, lat, lng]) => out.push({ name: n, line: l.name, status: l.status, eta: l.eta, color: l.color, d: PF.dist(pt, { lat, lng }) })));
  return out.sort((a, b) => a.d - b.d);
};

/* Distance from a point to an upcoming-infra feature */
PF.featureDist = (pt, f) => {
  if (f.type === 'point') return PF.dist(pt, f);
  let best = Infinity;
  for (let i = 0; i < f.pts.length - 1; i++) {
    const [a1, b1] = f.pts[i], [a2, b2] = f.pts[i + 1];
    for (let t = 0; t <= 1; t += 0.05) best = Math.min(best, PF.dist(pt, { lat: a1 + (a2 - a1) * t, lng: b1 + (b2 - b1) * t }));
  }
  return best;
};

/* Build a full snapshot for any point (the heart of the dummy "intelligence").
   Data only: distances, zoning, amenities and infrastructure. No valuations. */
PF.snapshot = (pt, label) => {
  const nearestPlace = PF.places.slice().sort((a, b) => PF.dist(pt, a) - PF.dist(pt, b))[0];
  const dPlace = PF.dist(pt, nearestPlace);
  const city = dPlace < 60 ? PF.cityOf(nearestPlace) : PF.nearestCity(pt);
  const dCbd = PF.dist(pt, city.cbd);
  const dAir = PF.dist(pt, city.airport);
  const jitter = (Math.sin(pt.lat * 913 + pt.lng * 377) + 1) / 2; // stable pseudo-random 0..1
  const near = r => PF.pois.filter(p => PF.dist(pt, p) <= r);
  const within5 = near(5);
  const counts = {};
  Object.keys(PF.poiCats).forEach(c => counts[c] = within5.filter(p => p.cat === c).length);
  const up = PF.upcoming.map(f => ({ ...f, d: PF.featureDist(pt, f) })).sort((a, b) => a.d - b.d);
  const station = PF.nearestStations(pt)[0];
  const opStation = PF.nearestStations(pt, 'operational')[0];
  const zone = dPlace < 4 ? nearestPlace.zone : (dCbd > 30 ? 'Agricultural – conversion eligible' : 'Residential Mixed');
  const survey = `Sy. No. ${100 + Math.floor(jitter * 180)}/${1 + Math.floor(jitter * 7)}${'ABCD'[Math.floor(jitter * 4)]}`;
  return {
    label: label || (dPlace < 3 ? `Near ${nearestPlace.name}` : dPlace < 60 ? `${PF.fmtKm(dPlace)} from ${nearestPlace.name}` : `${PF.fmtKm(PF.dist(pt, city))} from ${city.name}`),
    pt, place: nearestPlace, city, dPlace, dCbd, dAir, counts, poisNear: within5, upcoming: up, station, opStation, zone, survey,
    area: (1.5 + jitter * 6).toFixed(1), elevation: Math.round(20 + jitter * 900), flood: jitter > 0.8 ? 'Moderate' : 'Low',
    far: zone.includes('Commercial') || zone.includes('IFSC') ? '3.25' : zone.includes('Industrial') ? '2.00' : zone.includes('Agricultural') ? '0.25' : '2.50',
  };
};

/* ---------- Property-type behaviour (location & boundary) ----------
   Every type needs a location. boundaryMode controls the land-parcel step:
     'required'        user must draw the boundary (land / plot assets)
     'optional'        user is asked "Does this property occupy a defined land parcel?"
     'not_applicable'  step is skipped (e.g. a single apartment)
   Resolution order: types['category/Subtype'] → categories[category] → defaults.
   Add new property types here; no screen code needs to change. */
PF.propertyTypeConfig = {
  defaults: { requiresLocation: true, boundaryMode: 'optional' },
  categories: {
    land: { boundaryMode: 'required' },
    residential: { boundaryMode: 'optional' },
    commercial: { boundaryMode: 'optional' },
    industrial: { boundaryMode: 'optional' },
    logistics: { boundaryMode: 'optional' },
    digital: { boundaryMode: 'optional' },
    institutional: { boundaryMode: 'optional' },
  },
  types: {
    'residential/Plot': { boundaryMode: 'required' },
    'residential/Apartment': { boundaryMode: 'not_applicable' },
    'industrial/Industrial Park': { boundaryMode: 'optional' },
    'logistics/Logistics Park': { boundaryMode: 'optional' },
  },
};
PF.getTypeConfig = (category, subtype) => {
  const c = PF.propertyTypeConfig;
  return { ...c.defaults, ...(c.categories[category] || {}), ...(c.types[`${category}/${subtype}`] || {}) };
};
