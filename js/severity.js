(function () {
  "use strict";

  var BASE_SEVERITY = {
    pothole: 60,
    garbage: 40,
    drainage: 70,
    streetlight: 30,
    other: 20
  };

  var LOCATION_MULTIPLIERS = {
    high_traffic: 1.2,
    residential: 1.0,
    industrial: 0.8
  };

  var CATEGORY_KEYWORDS = {
    pothole: ["pothole", "road", "crater", "asphalt", "pavement"],
    garbage: ["garbage", "trash", "waste", "dump", "litter", "debris"],
    drainage: ["drainage", "drain", "water", "logging", "flood", "sewer"],
    streetlight: ["streetlight", "street-light", "lamp", "light", "dark"]
  };

  function resolveCategoryKey(issue) {
    if (!issue) return "other";

    if (issue.categoryKey) return issue.categoryKey;
    if (issue.key) return issue.key;

    if (issue.category) {
      var catLower = String(issue.category).toLowerCase();
      if (catLower.indexOf("pothole") !== -1) return "pothole";
      if (catLower.indexOf("garbage") !== -1) return "garbage";
      if (catLower.indexOf("water") !== -1 || catLower.indexOf("drain") !== -1) return "drainage";
      if (catLower.indexOf("street") !== -1 || catLower.indexOf("light") !== -1) return "streetlight";
    }

    if (issue.cat) {
      var labelLower = String(issue.cat).toLowerCase();
      if (labelLower.indexOf("pothole") !== -1) return "pothole";
      if (labelLower.indexOf("garbage") !== -1) return "garbage";
      if (labelLower.indexOf("water") !== -1) return "drainage";
      if (labelLower.indexOf("street") !== -1) return "streetlight";
    }

    return "other";
  }

  function resolveLocationZone(issue) {
    if (issue && issue.locationZone) return issue.locationZone;

    if (issue && issue.area && window.CC_DATA && window.CC_DATA.mumbaiAreas) {
      var area = window.CC_DATA.mumbaiAreas.find(function (a) {
        return a.name === issue.area;
      });
      if (area && area.locationZone) return area.locationZone;
    }

    return "residential";
  }

  function getAgeHours(issue) {
    if (!issue || !issue.createdAt) return 0;
    var created = issue.createdAt instanceof Date ? issue.createdAt : new Date(issue.createdAt);
    if (isNaN(created.getTime())) return 0;
    return (Date.now() - created.getTime()) / (1000 * 60 * 60);
  }

  function getUpvoteCount(issue) {
    if (!issue) return 0;
    if (typeof issue.upvoteCount === "number") return issue.upvoteCount;
    if (typeof issue.votes === "number") return issue.votes;
    return 0;
  }

  function getCommentCount(issue) {
    if (!issue) return 0;
    if (typeof issue.commentCount === "number") return issue.commentCount;
    if (Array.isArray(issue.comments)) return issue.comments.length;
    return 0;
  }

  function calculateAgeDecay(ageHours) {
    if (ageHours > 720) return -20;
    if (ageHours > 168) return -10;
    if (ageHours > 24) return -5;
    return 0;
  }

  function calculateSeverity(issue) {
    var categoryKey = resolveCategoryKey(issue);
    var base = BASE_SEVERITY[categoryKey] != null ? BASE_SEVERITY[categoryKey] : BASE_SEVERITY.other;
    var upvoteBoost = Math.min(getUpvoteCount(issue) * 3, 25);
    var ageHours = getAgeHours(issue);
    var ageDecay = calculateAgeDecay(ageHours);
    var locationZone = resolveLocationZone(issue);
    var multiplier = LOCATION_MULTIPLIERS[locationZone] != null ? LOCATION_MULTIPLIERS[locationZone] : 1.0;

    var severity = (base + upvoteBoost + ageDecay) * multiplier;
    return Math.min(Math.max(Math.round(severity), 0), 100);
  }

  function severityBadge(score) {
    var value = typeof score === "number" ? score : 0;

    if (value <= 30) {
      return { label: "Low", className: "badge-severity-low" };
    }
    if (value <= 60) {
      return { label: "Medium", className: "badge-severity-medium" };
    }
    if (value <= 85) {
      return { label: "High", className: "badge-severity-high" };
    }
    return { label: "Critical", className: "badge-severity-critical" };
  }

  function topScore(issue) {
    var severity = typeof issue.severity === "number" ? issue.severity : calculateSeverity(issue);
    var ageHours = getAgeHours(issue);
    var recencyBoost = 100 * Math.exp(-ageHours / 168);
    var comments = getCommentCount(issue);

    return severity + recencyBoost * 0.3 + comments * 0.1;
  }

  function pickWeightedClass(weights) {
    var total = 0;
    var key;
    for (key in weights) {
      if (Object.prototype.hasOwnProperty.call(weights, key)) {
        total += weights[key];
      }
    }

    var roll = Math.random() * total;
    var cumulative = 0;
    for (key in weights) {
      if (Object.prototype.hasOwnProperty.call(weights, key)) {
        cumulative += weights[key];
        if (roll <= cumulative) return key;
      }
    }

    return "other";
  }

  function simulateAIClassify(fileNameOrCategoryHint) {
    var hint = String(fileNameOrCategoryHint || "").toLowerCase();
    var matchedClass = null;
    var confidence = 0;

    var classKeys = Object.keys(CATEGORY_KEYWORDS);
    for (var i = 0; i < classKeys.length; i++) {
      var className = classKeys[i];
      var keywords = CATEGORY_KEYWORDS[className];
      for (var j = 0; j < keywords.length; j++) {
        if (hint.indexOf(keywords[j]) !== -1) {
          matchedClass = className;
          confidence = 0.72 + Math.random() * 0.23;
          break;
        }
      }
      if (matchedClass) break;
    }

    if (matchedClass) {
      return {
        class: matchedClass,
        confidence: Math.round(confidence * 100) / 100,
        fallback: false
      };
    }

    var weightedPick = pickWeightedClass({
      pothole: 30,
      garbage: 25,
      drainage: 20,
      streetlight: 15,
      other: 10
    });

    if (weightedPick === "other") {
      return {
        class: "other",
        confidence: Math.round((0.35 + Math.random() * 0.2) * 100) / 100,
        fallback: true
      };
    }

    return {
      class: weightedPick,
      confidence: Math.round((0.55 + Math.random() * 0.25) * 100) / 100,
      fallback: false
    };
  }

  window.CC_Severity = {
    calculateSeverity: calculateSeverity,
    severityBadge: severityBadge,
    topScore: topScore,
    simulateAIClassify: simulateAIClassify
  };
})();
