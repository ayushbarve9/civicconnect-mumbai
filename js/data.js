(function () {
  "use strict";

  var mumbaiAreas = [
    { name: "Colaba", zone: "Zone 1 (Ward A)", lat: 18.9067, lng: 72.8147, officer: "Mr. S. K. Patil", aqi: 75, alert: "Clear Status", locationZone: "high_traffic" },
    { name: "Cuffe Parade", zone: "Zone 1 (Ward A)", lat: 18.9150, lng: 72.8100, officer: "Mr. S. K. Patil", aqi: 68, alert: "Clear Status", locationZone: "residential" },
    { name: "Fort / CST", zone: "Zone 1 (Ward A)", lat: 18.9400, lng: 72.8350, officer: "Mr. S. K. Patil", aqi: 115, alert: "Traffic Diversions", locationZone: "high_traffic" },
    { name: "Marine Drive", zone: "Zone 1 (Ward C)", lat: 18.9430, lng: 72.8230, officer: "Mrs. Alpa Vyas", aqi: 82, alert: "High Tide Watch", locationZone: "residential" },
    { name: "Byculla", zone: "Zone 1 (Ward E)", lat: 18.9750, lng: 72.8330, officer: "Mr. Vijay Nandre", aqi: 145, alert: "Market Congestion", locationZone: "high_traffic" },
    { name: "Malabar Hill", zone: "Zone 1 (Ward D)", lat: 18.9550, lng: 72.8050, officer: "Mr. Rohit Shinde", aqi: 62, alert: "Clear Status", locationZone: "residential" },
    { name: "Worli", zone: "Zone 2 (Ward G-South)", lat: 19.0160, lng: 72.8170, officer: "Mrs. Radhika Nair", aqi: 95, alert: "High Winds Advisory", locationZone: "residential" },
    { name: "Prabhadevi", zone: "Zone 2 (Ward G-South)", lat: 19.0180, lng: 72.8280, officer: "Mrs. Radhika Nair", aqi: 110, alert: "Normal", locationZone: "high_traffic" },
    { name: "Dadar West", zone: "Zone 2 (Ward G-North)", lat: 19.0190, lng: 72.8430, officer: "Mr. Kiran Dighavkar", aqi: 130, alert: "Market High Flow", locationZone: "high_traffic" },
    { name: "Dadar East", zone: "Zone 2 (Ward F-South)", lat: 19.0150, lng: 72.8550, officer: "Mr. Harshad Kale", aqi: 140, alert: "Railway Corridor Block", locationZone: "high_traffic" },
    { name: "Matunga", zone: "Zone 2 (Ward F-North)", lat: 19.0268, lng: 72.8500, officer: "Mr. Gajanan Bellale", aqi: 105, alert: "Normal", locationZone: "residential" },
    { name: "Sion", zone: "Zone 2 (Ward F-North)", lat: 19.0375, lng: 72.8634, officer: "Mr. Gajanan Bellale", aqi: 155, alert: "Flyover Construction", locationZone: "high_traffic" },
    { name: "Dharavi", zone: "Zone 2 (Ward G-North)", lat: 19.0380, lng: 72.8538, officer: "Mr. Kiran Dighavkar", aqi: 185, alert: "Drainage Silt Alert", locationZone: "industrial" },
    { name: "Bandra West", zone: "Zone 3 (Ward H-West)", lat: 19.0600, lng: 72.8250, officer: "Mr. Vinayak Vispute", aqi: 88, alert: "Coastal Tide Watch", locationZone: "residential" },
    { name: "Bandra East", zone: "Zone 3 (Ward H-East)", lat: 19.0610, lng: 72.8450, officer: "Mr. Ashok Khairnar", aqi: 135, alert: "Heavy Traffic near BKC", locationZone: "high_traffic" },
    { name: "Khar", zone: "Zone 3 (Ward H-West)", lat: 19.0700, lng: 72.8350, officer: "Mr. Vinayak Vispute", aqi: 92, alert: "Road Excavations", locationZone: "residential" },
    { name: "Santacruz West", zone: "Zone 3 (Ward H-West)", lat: 19.0800, lng: 72.8400, officer: "Mr. Vinayak Vispute", aqi: 102, alert: "Normal", locationZone: "residential" },
    { name: "Vile Parle West", zone: "Zone 3 (Ward K-West)", lat: 19.0968, lng: 72.8400, officer: "Mr. Prashant Gaikwad", aqi: 110, alert: "Normal", locationZone: "residential" },
    { name: "Vile Parle East", zone: "Zone 3 (Ward K-East)", lat: 19.0980, lng: 72.8550, officer: "Mr. Amit Mehta", aqi: 150, alert: "Airport Corridor Congestion", locationZone: "high_traffic" },
    { name: "Andheri West", zone: "Zone 4 (Ward K-West)", lat: 19.1360, lng: 72.8300, officer: "Mr. Prashant Gaikwad", aqi: 115, alert: "Water accumulation warning", locationZone: "residential" },
    { name: "Andheri East", zone: "Zone 4 (Ward K-East)", lat: 19.1150, lng: 72.8750, officer: "Mr. Amit Mehta", aqi: 195, alert: "MIDC Silt Clearance Active", locationZone: "high_traffic" },
    { name: "Jogeshwari", zone: "Zone 4 (Ward K-East)", lat: 19.1350, lng: 72.8550, officer: "Mr. Amit Mehta", aqi: 170, alert: "JVLR Bottlenecks", locationZone: "high_traffic" },
    { name: "Goregaon West", zone: "Zone 4 (Ward P-South)", lat: 19.1630, lng: 72.8450, officer: "Mr. Santosh Dhonde", aqi: 125, alert: "Link Road Diversions", locationZone: "high_traffic" },
    { name: "Goregaon East", zone: "Zone 4 (Ward P-South)", lat: 19.1680, lng: 72.8600, officer: "Mr. Santosh Dhonde", aqi: 140, alert: "Aarey Forest Wild Animal Notice", locationZone: "residential" },
    { name: "Malad West", zone: "Zone 4 (Ward P-North)", lat: 19.1860, lng: 72.8480, officer: "Mr. Sanjog Kabre", aqi: 118, alert: "Creek Protection Watch", locationZone: "residential" },
    { name: "Kandivali West", zone: "Zone 7 (Ward R-South)", lat: 19.2050, lng: 72.8300, officer: "Mrs. Sandhya Nandedkar", aqi: 122, alert: "Underground Sewer Upgrades", locationZone: "residential" },
    { name: "Kandivali East", zone: "Zone 7 (Ward R-South)", lat: 19.2100, lng: 72.8550, officer: "Mrs. Sandhya Nandedkar", aqi: 145, alert: "Normal", locationZone: "residential" },
    { name: "Borivali West", zone: "Zone 7 (Ward R-Central)", lat: 19.2310, lng: 72.8400, officer: "Mr. Bhagyashree Kapse", aqi: 90, alert: "Gorai Creek Clean drive active", locationZone: "residential" },
    { name: "Borivali East", zone: "Zone 7 (Ward R-Central)", lat: 19.2280, lng: 72.8620, officer: "Mr. Bhagyashree Kapse", aqi: 132, alert: "SGNP Boundary Watch", locationZone: "residential" },
    { name: "Dahisar", zone: "Zone 7 (Ward R-North)", lat: 19.2500, lng: 72.8580, officer: "Mr. Ramakant Biradar", aqi: 105, alert: "Normal", locationZone: "residential" },
    { name: "Kurla", zone: "Zone 5 (Ward L)", lat: 19.0650, lng: 72.8790, officer: "Mr. Manish Valanju", aqi: 210, alert: "Mithi River High Water Warning", locationZone: "high_traffic" },
    { name: "Ghatkopar", zone: "Zone 6 (Ward N)", lat: 19.0860, lng: 72.9080, officer: "Mrs. Vibha Jadhav", aqi: 160, alert: "Metro Line-4 construction", locationZone: "high_traffic" },
    { name: "Vikhroli", zone: "Zone 6 (Ward S)", lat: 19.1110, lng: 72.9280, officer: "Mr. Ajitkumar Ambi", aqi: 140, alert: "Mangrove Line Inspection", locationZone: "industrial" },
    { name: "Bhandup", zone: "Zone 6 (Ward S)", lat: 19.1440, lng: 72.9370, officer: "Mr. Ajitkumar Ambi", aqi: 155, alert: "Water Pipeline repair ongoing", locationZone: "industrial" },
    { name: "Mulund", zone: "Zone 6 (Ward T)", lat: 19.1720, lng: 72.9560, officer: "Mr. Kishor Gandhi", aqi: 98, alert: "Hill Slopes Landslip Watch", locationZone: "residential" },
    { name: "Chembur", zone: "Zone 5 (Ward M-West)", lat: 19.0620, lng: 72.8980, officer: "Mr. Pruthviraj Chavan", aqi: 230, alert: "Factory Exhaust Warnings", locationZone: "industrial" },
    { name: "Powai", zone: "Zone 6 (Ward S)", lat: 19.1250, lng: 72.9000, officer: "Mr. Ajitkumar Ambi", aqi: 90, alert: "Water Hyacinth Removal Drive", locationZone: "residential" }
  ];

  var categories = [
    {
      cat: "Pothole",
      key: "pothole",
      emoji: "🛣️",
      text: "Deep pothole craters disrupting traffic",
      baseSeverity: 60
    },
    {
      cat: "Garbage Pile",
      key: "garbage",
      emoji: "🗑️",
      text: "Overflowing garbage disposal block near primary junctions",
      baseSeverity: 40
    },
    {
      cat: "Water Logging",
      key: "drainage",
      emoji: "💧",
      text: "Heavy rain water accumulation and drain backlog",
      baseSeverity: 70
    },
    {
      cat: "Streetlights",
      key: "streetlight",
      emoji: "💡",
      text: "Power short circuit leaving complete streets dark",
      baseSeverity: 30
    }
  ];

  var statuses = ["Reported", "Assigned", "In Progress", "Resolved"];

  var demoUsers = [
    { username: "admin", password: "123", role: "Admin", ward: "All Mumbai" },
    { username: "officer1", password: "123", role: "Ward Officer", ward: "Colaba" },
    { username: "citizen1", password: "123", role: "Citizen", ward: null }
  ];

  window.CC_DATA = {
    mumbaiAreas: mumbaiAreas,
    categories: categories,
    statuses: statuses,
    demoUsers: demoUsers
  };
})();
