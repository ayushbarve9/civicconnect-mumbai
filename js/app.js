(function () {
  "use strict";

  var areas = window.CC_DATA.mumbaiAreas;
  var categories = window.CC_DATA.categories;
  var statuses = window.CC_DATA.statuses;
  var users = window.CC_DATA.demoUsers.slice();
  var Sev = window.CC_Severity;

  var state = {
    currentUser: null,
    authMode: "login",
    map: null,
    markersGroup: null,
    activeTab: "Mumbai",
    allIssues: [],
    selectedIssueId: null,
    pendingPhoto: null,
    aiHint: null
  };

  function $(id) {
    return document.getElementById(id);
  }

  function toast(msg) {
    var el = $("toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toast._t);
    toast._t = setTimeout(function () {
      el.classList.remove("show");
    }, 2800);
  }

  function canModify(issue) {
    var u = state.currentUser;
    if (!u) return false;
    if (u.role === "Admin") return true;
    return u.role === "Ward Officer" && u.ward === issue.area;
  }

  function statusClass(status) {
    if (status === "Resolved") return "status-resolved";
    if (status === "In Progress") return "status-progress";
    if (status === "Assigned") return "status-assigned";
    return "status-reported";
  }

  function enrich(issue) {
    issue.severity = Sev.calculateSeverity(issue);
    issue.score = Sev.topScore(issue);
    return issue;
  }

  function generateIssues() {
    var id = 1;
    var now = Date.now();
    state.allIssues = [];

    areas.forEach(function (area) {
      for (var i = 0; i < 5; i++) {
        var cat = categories[(area.name.charCodeAt(0) + i) % categories.length];
        var status = statuses[(area.name.charCodeAt(1) + i * 3) % statuses.length];
        var votes = Math.floor(((area.name.charCodeAt(0) + i * 17) % 300) + 20);
        var ageHours = ((area.name.charCodeAt(0) + i * 11) % 200) + 1;
        var comments = [];
        var cCount = (area.name.charCodeAt(2) + i) % 4;
        for (var c = 0; c < cCount; c++) {
          comments.push({
            author: c % 2 ? "Local resident" : "Neighbour",
            text: c % 2 ? "Seen this daily — please prioritize." : "Kids walk past this every morning.",
            at: new Date(now - (ageHours + c) * 3600000).toISOString()
          });
        }

        var issue = {
          id: id++,
          title: cat.text + " near " + area.name + " Station",
          area: area.name,
          lat: area.lat + Math.sin(area.name.charCodeAt(0) + i) * 0.007,
          lng: area.lng + Math.cos(area.name.charCodeAt(1) + i) * 0.007,
          cat: cat.cat,
          categoryKey: cat.key,
          emoji: cat.emoji,
          votes: votes,
          status: status,
          createdAt: new Date(now - ageHours * 3600000).toISOString(),
          locationZone: area.locationZone,
          comments: comments,
          photoDataUrl: null,
          ai: null,
          upvotedBy: {}
        };
        state.allIssues.push(enrich(issue));
      }
    });
  }

  function populateDropdowns() {
    var areaOpts = '<option value="All Mumbai" selected>All Mumbai</option>';
    var formOpts = "";
    var wardOpts = "";
    areas.forEach(function (a) {
      areaOpts += '<option value="' + a.name + '">' + a.name + "</option>";
      formOpts += '<option value="' + a.name + '">' + a.name + "</option>";
      wardOpts += '<option value="' + a.name + '">' + a.name + "</option>";
    });
    $("areaDropdown").innerHTML = areaOpts;
    $("formArea").innerHTML = formOpts;
    $("authWardSelection").innerHTML = wardOpts;

    var catHtml = "";
    categories.forEach(function (c) {
      catHtml +=
        '<option value="' +
        c.cat +
        '" data-key="' +
        c.key +
        '" data-emoji="' +
        c.emoji +
        '">' +
        c.cat +
        "</option>";
    });
    $("formCategory").innerHTML = catHtml;
  }

  function initMap() {
    state.map = L.map("map", { zoomControl: true }).setView([19.11, 72.875], 11);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "&copy; OpenStreetMap"
    }).addTo(state.map);
    state.markersGroup = L.layerGroup().addTo(state.map);
    plotMarkers("All Mumbai");
    state.map.on("click", function (e) {
      openReportModal(e.latlng.lat, e.latlng.lng);
    });
  }

  function markerColor(status) {
    if (status === "Resolved") return "#22A06B";
    if (status === "In Progress") return "#0D7377";
    if (status === "Assigned") return "#E8A838";
    return "#C23B3B";
  }

  function plotMarkers(targetArea) {
    state.markersGroup.clearLayers();
    var count = 0;

    state.allIssues.forEach(function (issue) {
      if (targetArea !== "All Mumbai" && issue.area !== targetArea) return;
      count++;

      var icon = L.divIcon({
        html:
          '<div style="background:' +
          markerColor(issue.status) +
          ';width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);"></div>',
        className: "custom-pin",
        iconSize: [14, 14],
        iconAnchor: [7, 7]
      });

      var badge = Sev.severityBadge(issue.severity);
      var action = canModify(issue)
        ? '<select class="status-dropdown" onchange="window.CC.mutateStatus(' +
          issue.id +
          ', this.value)">' +
          statuses
            .map(function (st) {
              return (
                '<option value="' +
                st +
                '"' +
                (issue.status === st ? " selected" : "") +
                ">" +
                st +
                "</option>"
              );
            })
            .join("") +
          "</select>"
        : '<span class="status-pill ' + statusClass(issue.status) + '">' + issue.status + "</span>";

      var popup =
        '<div class="popup-card">' +
        "<strong>" +
        issue.emoji +
        " " +
        issue.title +
        "</strong>" +
        "<p>" +
        issue.area +
        ' · <span class="sev-badge ' +
        badge.className.replace("badge-severity-", "sev-") +
        '">' +
        badge.label +
        " " +
        issue.severity +
        "</span></p>" +
        '<div class="popup-footer">' +
        action +
        " · ▲ " +
        issue.votes +
        "</div>" +
        '<button type="button" class="btn-ghost" style="margin-top:.5rem;width:100%" onclick="window.CC.openIssue(' +
        issue.id +
        ')">Open details</button>' +
        "</div>";

      L.marker([issue.lat, issue.lng], { icon: icon }).bindPopup(popup).addTo(state.markersGroup);
    });

    $("markerCountText").textContent = count + " pins";
  }

  function getSelectedArea() {
    return $("areaDropdown").value;
  }

  function rankedIssues() {
    var selected = getSelectedArea();
    var list =
      state.activeTab === "Mumbai"
        ? state.allIssues.slice()
        : state.allIssues.filter(function (i) {
            return selected === "All Mumbai" || i.area === selected;
          });

    list.forEach(enrich);
    list.sort(function (a, b) {
      return b.score - a.score;
    });
    return list.slice(0, 10);
  }

  function renderDashboard() {
    var display = rankedIssues();
    var resolved = display.filter(function (i) {
      return i.status === "Resolved";
    }).length;

    $("resolvedMetric").textContent = resolved + " / " + display.length + " resolved";
    $("progressBar").style.width =
      display.length > 0 ? (resolved / display.length) * 100 + "%" : "0%";
    $("panelTitle").textContent =
      state.activeTab === "Mumbai" ? "Top 10 across Mumbai" : "Top issues in this area";

    var html = "";
    if (!display.length) {
      html = '<p class="empty-feed">No open reports in this view.</p>';
    } else {
      display.forEach(function (issue, index) {
        var badge = Sev.severityBadge(issue.severity);
        var sevClass = badge.className.replace("badge-severity-", "sev-");
        var controller = canModify(issue)
          ? '<select class="status-dropdown" onclick="event.stopPropagation()" onchange="window.CC.mutateStatus(' +
            issue.id +
            ', this.value)">' +
            statuses
              .map(function (st) {
                return (
                  '<option value="' +
                  st +
                  '"' +
                  (issue.status === st ? " selected" : "") +
                  ">" +
                  st +
                  "</option>"
                );
              })
              .join("") +
            "</select>"
          : '<span class="status-pill ' + statusClass(issue.status) + '">' + issue.status + "</span>";

        html +=
          '<article class="feed-item" onclick="window.CC.openIssue(' +
          issue.id +
          ')">' +
          '<span class="rank">#' +
          (index + 1) +
          "</span>" +
          '<div class="feed-body">' +
          '<div class="feed-title">' +
          issue.emoji +
          " " +
          issue.title +
          "</div>" +
          '<div class="feed-meta">' +
          "<strong>" +
          issue.area +
          "</strong> · " +
          controller +
          ' · <span class="sev-badge ' +
          sevClass +
          '">' +
          badge.label +
          " " +
          issue.severity +
          "</span></div></div>" +
          '<button type="button" class="vote-chip" onclick="event.stopPropagation(); window.CC.upvote(' +
          issue.id +
          ')">▲ ' +
          issue.votes +
          "</button></article>";
      });
    }
    $("topIssuesList").innerHTML = html;
  }

  function updateBulletin(areaName) {
    if (areaName === "All Mumbai") {
      $("bannerWardTitle").textContent = "Mumbai unified civic feed";
      $("bannerOfficer").textContent = "Public stream";
      $("bannerAqi").textContent = "135 · Fair";
      $("bannerAlertLevel").textContent = "Nominal";
      $("bannerAlertText").textContent = "Live cross-area incident streams with severity ranking.";
      return;
    }
    var area = areas.find(function (a) {
      return a.name === areaName;
    });
    if (!area) return;
    $("bannerWardTitle").textContent = area.zone + " · " + area.name;
    $("bannerOfficer").textContent = area.officer;
    $("bannerAqi").textContent = area.aqi + " AQI";
    $("bannerAlertLevel").textContent = area.alert;
    $("bannerAlertText").textContent =
      "Zone profile · " + area.locationZone.replace("_", " ") + " priority weighting.";
  }

  function syncAuthUi() {
    var u = state.currentUser;
    if (u) {
      $("navUserText").textContent =
        u.username + " · " + (u.role === "Ward Officer" ? u.ward : u.role);
      $("authActionButton").textContent = "Log out";
    } else {
      $("navUserText").textContent = "Guest";
      $("authActionButton").textContent = "Sign in";
    }
  }

  function refreshViews() {
    var area = getSelectedArea();
    plotMarkers(area);
    renderDashboard();
  }

  function openAuthModal() {
    if (state.currentUser) {
      state.currentUser = null;
      syncAuthUi();
      refreshViews();
      toast("Signed out");
      return;
    }
    $("authModal").classList.add("open");
  }

  function closeAuthModal() {
    $("authModal").classList.remove("open");
    $("authForm").reset();
    setAuthMode("login");
  }

  function setAuthMode(mode) {
    state.authMode = mode;
    $("tabLoginMode").classList.toggle("active", mode === "login");
    $("tabRegisterMode").classList.toggle("active", mode === "register");
    $("registrationFields").hidden = mode !== "register";
    $("authSubmitBtn").textContent = mode === "login" ? "Sign in" : "Create account";
  }

  function toggleRegWardView() {
    $("regWardContainer").hidden = $("authRole").value !== "Ward Officer";
  }

  function handleAuthSubmit(e) {
    e.preventDefault();
    var user = $("authUsername").value.trim();
    var pass = $("authPassword").value;

    if (state.authMode === "login") {
      var found = users.find(function (u) {
        return u.username === user && u.password === pass;
      });
      if (!found) {
        toast("Invalid credentials — try admin / 123");
        return;
      }
      state.currentUser = found;
      toast("Signed in as " + found.role);
    } else {
      if (users.some(function (u) {
        return u.username === user;
      })) {
        toast("Username already taken");
        return;
      }
      var role = $("authRole").value;
      var ward = role === "Ward Officer" ? $("authWardSelection").value : role === "Admin" ? "All Mumbai" : null;
      var neu = { username: user, password: pass, role: role, ward: ward };
      users.push(neu);
      state.currentUser = neu;
      toast("Account created");
    }

    syncAuthUi();
    refreshViews();
    closeAuthModal();
  }

  function openReportModal(lat, lng) {
    $("reportModal").classList.add("open");
    $("formLat").value = Number(lat != null ? lat : 19.11).toFixed(6);
    $("formLng").value = Number(lng != null ? lng : 72.875).toFixed(6);
    state.pendingPhoto = null;
    state.aiHint = null;
    $("photoPreview").hidden = true;
    $("photoPreview").removeAttribute("src");
    $("aiResult").hidden = true;
    $("aiResult").textContent = "";
    $("formPhoto").value = "";
  }

  function closeReportModal() {
    $("reportModal").classList.remove("open");
  }

  function onPhotoSelected(e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function () {
      state.pendingPhoto = reader.result;
      $("photoPreview").src = reader.result;
      $("photoPreview").hidden = false;

      var ai = Sev.simulateAIClassify(file.name);
      state.aiHint = ai;
      var label = ai.class;
      var conf = Math.round(ai.confidence * 100);
      $("aiResult").hidden = false;
      $("aiResult").textContent = ai.fallback
        ? "AI unsure (" + conf + "%). Please confirm category manually."
        : "YOLOv8 suggest: " + label + " · " + conf + "% confidence";

      if (!ai.fallback && ai.class !== "other") {
        var match = categories.find(function (c) {
          return c.key === ai.class;
        });
        if (match) $("formCategory").value = match.cat;
      }
    };
    reader.readAsDataURL(file);
  }

  function handleFormSubmission(e) {
    e.preventDefault();
    var catSelect = $("formCategory");
    var key = catSelect.options[catSelect.selectedIndex].getAttribute("data-key");
    var emoji = catSelect.options[catSelect.selectedIndex].getAttribute("data-emoji");
    var areaName = $("formArea").value;
    var areaMeta = areas.find(function (a) {
      return a.name === areaName;
    });

    var issue = {
      id: state.allIssues.reduce(function (m, i) {
        return Math.max(m, i.id);
      }, 0) + 1,
      title: $("formTitle").value.trim(),
      area: areaName,
      lat: parseFloat($("formLat").value),
      lng: parseFloat($("formLng").value),
      cat: catSelect.value,
      categoryKey: key,
      emoji: emoji,
      votes: 1,
      status: "Reported",
      createdAt: new Date().toISOString(),
      locationZone: areaMeta ? areaMeta.locationZone : "residential",
      comments: [],
      photoDataUrl: state.pendingPhoto,
      ai: state.aiHint,
      upvotedBy: {}
    };

    enrich(issue);
    state.allIssues.unshift(issue);
    $("areaDropdown").value = areaName;
    onAreaChange();
    closeReportModal();
    state.map.setView([issue.lat, issue.lng], 14);
    toast("Report broadcast · severity " + issue.severity);
    openIssue(issue.id);
  }

  function mutateStatus(id, newStatus) {
    var issue = state.allIssues.find(function (i) {
      return i.id === id;
    });
    if (!issue || !canModify(issue)) return;
    issue.status = newStatus;
    enrich(issue);
    refreshViews();
    if (state.selectedIssueId === id) renderDrawer(issue);
    toast("Status → " + newStatus);
  }

  function upvote(id) {
    var issue = state.allIssues.find(function (i) {
      return i.id === id;
    });
    if (!issue) return;
    var key = state.currentUser ? state.currentUser.username : "guest";
    if (issue.upvotedBy[key]) {
      toast("Already upvoted");
      return;
    }
    issue.upvotedBy[key] = true;
    issue.votes += 1;
    enrich(issue);
    refreshViews();
    if (state.selectedIssueId === id) renderDrawer(issue);
  }

  function openIssue(id) {
    var issue = state.allIssues.find(function (i) {
      return i.id === id;
    });
    if (!issue) return;
    state.selectedIssueId = id;
    enrich(issue);
    renderDrawer(issue);
    $("issueDrawer").classList.add("open");
    state.map.setView([issue.lat, issue.lng], 15);
  }

  function closeDrawer() {
    $("issueDrawer").classList.remove("open");
    state.selectedIssueId = null;
  }

  function renderDrawer(issue) {
    var badge = Sev.severityBadge(issue.severity);
    var sevClass = badge.className.replace("badge-severity-", "sev-");
    var ageH = Math.round((Date.now() - new Date(issue.createdAt).getTime()) / 3600000);

    var statusCtrl = canModify(issue)
      ? '<select class="status-dropdown" onchange="window.CC.mutateStatus(' +
        issue.id +
        ', this.value)">' +
        statuses
          .map(function (st) {
            return (
              '<option value="' +
              st +
              '"' +
              (issue.status === st ? " selected" : "") +
              ">" +
              st +
              "</option>"
            );
          })
          .join("") +
        "</select>"
      : '<span class="status-pill ' + statusClass(issue.status) + '">' + issue.status + "</span>";

    var photo = issue.photoDataUrl
      ? '<img class="drawer-photo" src="' + issue.photoDataUrl + '" alt="Report photo" />'
      : "";

    var aiLine = issue.ai
      ? '<p class="drawer-ai">AI: ' +
        issue.ai.class +
        " · " +
        Math.round(issue.ai.confidence * 100) +
        "%</p>"
      : "";

    var comments = (issue.comments || [])
      .map(function (c) {
        return (
          '<div class="comment"><strong>' +
          c.author +
          "</strong><p>" +
          c.text +
          "</p></div>"
        );
      })
      .join("");

    $("drawerBody").innerHTML =
      "<h3>" +
      issue.emoji +
      " " +
      issue.title +
      "</h3>" +
      '<div class="drawer-meta">' +
      "<span>" +
      issue.area +
      "</span>" +
      '<span class="sev-badge ' +
      sevClass +
      '">' +
      badge.label +
      " " +
      issue.severity +
      "</span>" +
      statusCtrl +
      "</div>" +
      photo +
      aiLine +
      "<p class=\"muted\">Reported ~" +
      ageH +
      "h ago · score " +
      issue.score.toFixed(1) +
      "</p>" +
      '<div class="drawer-actions">' +
      '<button type="button" class="btn-primary" onclick="window.CC.upvote(' +
      issue.id +
      ')">Upvote · ' +
      issue.votes +
      "</button>" +
      '<button type="button" class="btn-ghost" onclick="window.CC.focusIssue(' +
      issue.lat +
      "," +
      issue.lng +
      ')">Zoom map</button></div>' +
      "<h4>Comments</h4>" +
      '<div class="comment-list">' +
      (comments || '<p class="muted">No comments yet.</p>') +
      "</div>" +
      '<form class="comment-form" onsubmit="window.CC.addComment(event,' +
      issue.id +
      ')">' +
      '<input type="text" id="commentInput" placeholder="Add a note…" required />' +
      '<button type="submit" class="btn-primary">Post</button></form>';
  }

  function addComment(e, id) {
    e.preventDefault();
    var input = $("commentInput");
    var text = input.value.trim();
    if (!text) return;
    var issue = state.allIssues.find(function (i) {
      return i.id === id;
    });
    if (!issue) return;
    issue.comments = issue.comments || [];
    issue.comments.push({
      author: state.currentUser ? state.currentUser.username : "Guest",
      text: text,
      at: new Date().toISOString()
    });
    enrich(issue);
    renderDrawer(issue);
    renderDashboard();
    input.value = "";
  }

  function switchDashboardTab(type) {
    state.activeTab = type;
    $("tabMumbai").classList.toggle("active", type === "Mumbai");
    $("tabArea").classList.toggle("active", type === "Area");
    renderDashboard();
  }

  function onAreaChange() {
    var val = getSelectedArea();
    plotMarkers(val);
    updateBulletin(val);
    renderDashboard();
  }

  function focusOnSelectedArea() {
    var val = getSelectedArea();
    if (val === "All Mumbai") {
      state.map.setView([19.11, 72.875], 11);
      return;
    }
    var data = areas.find(function (a) {
      return a.name === val;
    });
    if (data) state.map.setView([data.lat, data.lng], 14);
  }

  function focusIssue(lat, lng) {
    state.map.setView([lat, lng], 15);
  }

  function detectLocation() {
    if (!navigator.geolocation) {
      toast("Geolocation unavailable");
      return;
    }
    toast("Detecting your area…");
    navigator.geolocation.getCurrentPosition(
      function (pos) {
        var lat = pos.coords.latitude;
        var lng = pos.coords.longitude;
        var best = null;
        var bestD = Infinity;
        areas.forEach(function (a) {
          var d = Math.pow(a.lat - lat, 2) + Math.pow(a.lng - lng, 2);
          if (d < bestD) {
            bestD = d;
            best = a;
          }
        });
        if (best) {
          $("areaDropdown").value = best.name;
          onAreaChange();
          state.map.setView([best.lat, best.lng], 13);
          toast("You're near " + best.name);
        }
      },
      function () {
        toast("Could not read location");
      },
      { timeout: 8000 }
    );
  }

  function bindUi() {
    $("authActionButton").addEventListener("click", openAuthModal);
    $("btnFileReport").addEventListener("click", function () {
      openReportModal();
    });
    $("btnDetect").addEventListener("click", detectLocation);
    $("areaDropdown").addEventListener("change", onAreaChange);
    $("btnZoomArea").addEventListener("click", focusOnSelectedArea);
    $("tabMumbai").addEventListener("click", function () {
      switchDashboardTab("Mumbai");
    });
    $("tabArea").addEventListener("click", function () {
      switchDashboardTab("Area");
    });
    $("tabLoginMode").addEventListener("click", function () {
      setAuthMode("login");
    });
    $("tabRegisterMode").addEventListener("click", function () {
      setAuthMode("register");
    });
    $("authRole").addEventListener("change", toggleRegWardView);
    $("authForm").addEventListener("submit", handleAuthSubmit);
    $("reportForm").addEventListener("submit", handleFormSubmission);
    $("formPhoto").addEventListener("change", onPhotoSelected);
    $("closeAuth").addEventListener("click", closeAuthModal);
    $("closeReport").addEventListener("click", closeReportModal);
    $("closeDrawer").addEventListener("click", closeDrawer);

    document.querySelectorAll(".modal").forEach(function (m) {
      m.addEventListener("click", function (e) {
        if (e.target === m) m.classList.remove("open");
      });
    });
  }

  window.CC = {
    mutateStatus: mutateStatus,
    upvote: upvote,
    openIssue: openIssue,
    addComment: addComment,
    focusIssue: focusIssue
  };

  window.addEventListener("load", function () {
    populateDropdowns();
    generateIssues();
    bindUi();
    initMap();
    renderDashboard();
    updateBulletin("All Mumbai");
    syncAuthUi();
    detectLocation();
  });
})();
