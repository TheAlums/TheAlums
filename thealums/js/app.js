(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

  function initials(name) {
    return name.split(" ").map((p) => p[0]).join("").slice(0, 2);
  }

  function playerById(id) {
    return FLOCK.players.find((p) => p.id === id);
  }

  function renderTicker() {
    const el = $("#ticker-track");
    if (!el) return;
    const bits = FLOCK.players
      .filter((p) => p.featured || p.week1.ppr)
      .map((p) => {
        const pts = p.week1.ppr ? `${p.week1.ppr} PPR` : p.status;
        return `<span class="ticker-item"><strong>${p.name}</strong> · ${p.pos} ${p.team} · ${p.week1.result} · ${pts}</span>`;
      });
    el.innerHTML = bits.concat(bits).join("");
  }

  function playerCard(p) {
    return `
      <a class="player-card" href="player.html?id=${p.id}">
        <div class="pc-top">
          <div class="avatar">${initials(p.name)}</div>
          <div style="flex:1">
            <div class="pc-name">${p.name}</div>
            <div class="pc-meta">${p.pos} · ${p.teamName} · ${p.years} yr${p.years === 1 ? "" : "s"}</div>
          </div>
          ${p.fantasyRelevant ? `<div class="ppr">${p.week1.ppr || "—"}</div>` : ""}
        </div>
        <div class="chips">
          <span class="chip gold">${p.league === "CFL" ? "CFL" : p.status}</span>
          <span class="chip">${p.draft}</span>
          <span class="chip">Oregon ${p.yearsAtOregon}</span>
        </div>
        <div class="pc-week"><b>Week ${FLOCK.meta.week}:</b> ${p.week1.note}</div>
      </a>`;
  }

  function renderFeatured() {
    const el = $("#featured-players");
    if (!el) return;
    el.innerHTML = FLOCK.players.filter((p) => p.featured).slice(0, 8).map(playerCard).join("");
  }

  function renderHomePerformers() {
    const el = $("#home-performers");
    if (!el) return;
    const rows = [...FLOCK.players]
      .filter((p) => (p.week1.ppr || 0) > 0)
      .sort((a, b) => (b.week1.ppr || 0) - (a.week1.ppr || 0))
      .slice(0, 6);
    el.innerHTML = rows.map((p, i) => `
      <tr>
        <td class="num">${i + 1}</td>
        <td><a href="player.html?id=${p.id}">${p.name}</a></td>
        <td>${p.pos}</td>
        <td>${p.team}</td>
        <td class="num">${p.week1.ppr}</td>
        <td>${p.week1.pass !== "—" ? p.week1.pass : p.week1.note}</td>
      </tr>`).join("");
  }

  function renderHomeShop() {
    const el = $("#home-shop");
    if (!el || !FLOCK.shopItems) return;
    el.innerHTML = FLOCK.shopItems.slice(0, 4).map((s) => `
      <article class="product">
        <div class="product-art">${s.art}</div>
        <span class="chip gold">${s.team}</span>
        <h3>${s.name}</h3>
        <div class="price">${s.price}</div>
        <a class="buy" href="${s.href}" rel="nofollow sponsored" target="_blank">Shop</a>
      </article>`).join("");
  }

  function statsView() {
    return $("#stats-filters .filter.active")?.dataset.view || "nfl";
  }

  function renderStatsBoard() {
    const el = $("#stats-body");
    if (!el) return;
    const view = statsView();
    const off = ["QB", "RB", "WR", "TE"];
    const idp = ["DL", "LB", "DB", "CB", "S", "OLB"];
    let rows = FLOCK.players.filter((p) => {
      const lg = p.league || "NFL";
      if (view === "cfl") return lg === "CFL";
      if (lg === "CFL") return false;
      if (view === "off") return off.includes(p.pos);
      if (view === "idp") return idp.includes(p.pos);
      return true;
    });
    rows = [...rows].sort((a, b) => (b.week1.ppr || 0) - (a.week1.ppr || 0));
    el.innerHTML = rows.map((p) => {
      const line = p.week1.pass && p.week1.pass !== "—" ? p.week1.pass : (p.week1.rush || p.week1.note);
      return `
      <tr>
        <td><a href="player.html?id=${p.id}">${p.name}</a></td>
        <td>${p.pos}</td>
        <td>${p.league || "NFL"}</td>
        <td>${p.team}</td>
        <td>${p.week1.result}</td>
        <td>${line}</td>
        <td class="num">${p.week1.ppr || "—"}</td>
        <td class="num">${p.fantasy?.proj ?? "—"}</td>
        <td><span class="grade ${p.fantasy?.grade || ""}">${p.fantasy?.grade || "—"}</span></td>
      </tr>`;
    }).join("");
  }

  function renderStatsFilters() {
    const el = $("#stats-filters");
    if (!el) return;
    const views = [
      ["nfl", "NFL"],
      ["off", "Offense"],
      ["idp", "IDP"],
      ["cfl", "CFL"]
    ];
    el.innerHTML = views.map((v, i) =>
      `<button class="filter${i === 0 ? " active" : ""}" data-view="${v[0]}">${v[1]}</button>`
    ).join("");
    el.addEventListener("click", (e) => {
      const btn = e.target.closest(".filter");
      if (!btn) return;
      el.querySelectorAll(".filter").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderStatsBoard();
    });
  }

  function renderDraft() {
    const tbody = $("#draft-prospects");
    if (tbody && FLOCK.prospects) {
      tbody.innerHTML = FLOCK.prospects.map((d) => `
        <tr>
          <td>${d.name}</td>
          <td>${d.pos}</td>
          <td>${d.class}</td>
          <td>${d.ht}</td>
          <td>${d.wt}</td>
          <td>${d.forty}</td>
          <td>${d.vert}</td>
          <td>${d.broad}</td>
          <td>${d.note}</td>
        </tr>`).join("");
    }
    const grid = $("#draft-class");
    if (grid) {
      const rookies = FLOCK.players.filter((p) => String(p.draft).includes("2026"));
      grid.innerHTML = rookies.map(playerCard).join("");
    }
  }

  function renderNews() {
    const feature = $("#featured-story");
    const list = $("#news-list");
    if (feature) {
      const n = FLOCK.news.find((x) => x.featured) || FLOCK.news[0];
      feature.innerHTML = `
        <span class="tag">${n.tag}</span>
        <h3>${n.title}</h3>
        <p>${n.dek}</p>
        <p style="margin-top:16px;font-size:12px;letter-spacing:.1em;text-transform:uppercase;color:#8a9a91">${n.time} · ${n.author}</p>`;
    }
    if (list) {
      const rest = FLOCK.news.filter((x) => !x.featured).slice(0, 4);
      list.innerHTML = rest.map((n) => `
        <a class="news-item" href="news.html#${n.id}">
          <small>${n.tag} · ${n.time}</small>
          <h4>${n.title}</h4>
        </a>`).join("");
    }
  }

  function renderNewsPage() {
    const el = $("#news-feed");
    if (!el) return;
    el.innerHTML = FLOCK.news.map((n) => {
      const names = n.playerIds.map((id) => playerById(id)?.name).filter(Boolean);
      return `
        <article class="card pad" id="${n.id}" style="margin-bottom:16px">
          <span class="tag">${n.tag}</span>
          <h3 style="font-size:28px;text-transform:uppercase;margin:8px 0">${n.title}</h3>
          <p style="color:#c5d1ca">${n.dek}</p>
          <p style="margin-top:12px;font-size:12px;color:#8a9a91;letter-spacing:.08em;text-transform:uppercase">${n.time} · ${n.author}${names.length ? " · " + names.join(", ") : ""}</p>
        </article>`;
    }).join("");
  }

  function applyRosterFilters() {
    const q = ($("#search")?.value || "").toLowerCase();
    const pos = $("#filters .filter.active")?.dataset.pos || "All";
    const el = $("#roster-grid");
    if (!el) return;
    const rows = FLOCK.players.filter((p) => {
      const lg = p.league || "NFL";
      const hitQ = !q || `${p.name} ${p.team} ${p.teamName} ${p.pos} ${lg}`.toLowerCase().includes(q);
      if (pos === "CFL") return lg === "CFL" && hitQ;
      if (lg === "CFL") return false;
      const hitP = pos === "All" || p.pos === pos || (pos === "OL" && ["OL", "OT"].includes(p.pos)) || (pos === "DB" && ["DB", "CB", "S"].includes(p.pos));
      return hitQ && hitP;
    });
    el.innerHTML = rows.length ? rows.map(playerCard).join("") : `<p class="empty">No Ducks match that filter.</p>`;
    const count = $("#roster-count");
    if (count) count.textContent = `${rows.length} players`;
  }

  function renderRoster() {
    const filters = $("#filters");
    if (filters) {
      const groups = ["All", "QB", "RB", "WR", "TE", "OL", "DL", "LB", "DB", "CFL"];
      filters.innerHTML = groups.map((g, i) =>
        `<button class="filter${i === 0 ? " active" : ""}" data-pos="${g}">${g}</button>`
      ).join("");
      filters.addEventListener("click", (e) => {
        const btn = e.target.closest(".filter");
        if (!btn) return;
        $$(".filter").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        applyRosterFilters();
      });
    }
    $("#search")?.addEventListener("input", applyRosterFilters);
    applyRosterFilters();
  }

  function renderFantasy() {
    const tbody = $("#fantasy-body");
    if (!tbody) return;
    const rows = FLOCK.players
      .filter((p) => p.fantasyRelevant)
      .sort((a, b) => (b.week1.ppr || 0) - (a.week1.ppr || 0));
    tbody.innerHTML = rows.map((p, i) => `
      <tr>
        <td class="num">${i + 1}</td>
        <td><a href="player.html?id=${p.id}">${p.name}</a></td>
        <td>${p.pos}</td>
        <td>${p.team}</td>
        <td class="num">${p.fantasy.week1PPR}</td>
        <td class="num">${p.fantasy.proj}</td>
        <td>${p.fantasy.adp}</td>
        <td><span class="grade ${p.fantasy.grade}">${p.fantasy.grade}</span></td>
      </tr>`).join("");
  }

  function renderPlayer() {
    const root = $("#player-root");
    if (!root) return;
    const id = new URLSearchParams(location.search).get("id") || "herbert";
    const p = playerById(id) || FLOCK.players[0];
    document.title = `${p.name} · FLOCK`;
    const related = FLOCK.news.filter((n) => n.playerIds.includes(p.id));
    root.innerHTML = `
      <div class="profile-hero">
        <div class="avatar lg">${initials(p.name)}</div>
        <div>
          <div class="kicker">${p.teamName} · #${p.jersey}</div>
          <h1>${p.name}</h1>
          <div class="chips" style="margin-top:12px">
            <span class="chip gold">${p.pos}</span>
            <span class="chip">${p.status}</span>
            <span class="chip">${p.draft}</span>
            <span class="chip">Oregon ${p.yearsAtOregon}</span>
            <span class="chip">${p.years} NFL seasons</span>
          </div>
        </div>
        <div style="text-align:right">
          <div class="stat"><b>${p.week1.ppr || "—"}</b><span>Week ${FLOCK.meta.week} PPR</span></div>
        </div>
      </div>
      <p style="margin:22px 0;max-width:70ch;color:#c5d1ca">${p.bio}</p>
      <div class="stat-grid">
        <div class="stat-box"><b>${p.season.passYds}</b><span>Pass yds</span></div>
        <div class="stat-box"><b>${p.season.passTD}</b><span>Pass TD</span></div>
        <div class="stat-box"><b>${p.season.rushYds}</b><span>Rush yds</span></div>
        <div class="stat-box"><b>${p.season.rushTD}</b><span>Rush TD</span></div>
        <div class="stat-box"><b>${p.season.rec}</b><span>Receptions</span></div>
        <div class="stat-box"><b>${p.season.recYds}</b><span>Rec yds</span></div>
        <div class="stat-box"><b>${p.season.tackles}</b><span>Tackles</span></div>
        <div class="stat-box"><b>${p.season.sacks}</b><span>Sacks</span></div>
      </div>
      <div class="grid-2" style="margin-top:22px">
        <div class="card pad">
          <h3 style="margin-bottom:10px;text-transform:uppercase">Week ${FLOCK.meta.week} line</h3>
          <p><b>Result:</b> ${p.week1.result}</p>
          <p><b>Passing:</b> ${p.week1.pass}</p>
          <p><b>Rushing:</b> ${p.week1.rush}</p>
          <p style="margin-top:10px;color:#c5d1ca">${p.week1.note}</p>
        </div>
        <div class="card pad">
          <h3 style="margin-bottom:10px;text-transform:uppercase">Fantasy</h3>
          <p><b>Week PPR:</b> ${p.fantasy.week1PPR}</p>
          <p><b>Projection going in:</b> ${p.fantasy.proj}</p>
          <p><b>ADP / role:</b> ${p.fantasy.adp}</p>
          <p><b>Grade:</b> <span class="grade ${p.fantasy.grade}">${p.fantasy.grade}</span></p>
        </div>
      </div>
      <div class="section" style="padding-left:0;padding-right:0">
        <div class="section-head"><h2>Related</h2></div>
        ${related.length ? related.map((n) => `
          <a class="news-item card" href="news.html#${n.id}" style="margin-bottom:8px">
            <small>${n.tag} · ${n.time}</small>
            <h4>${n.title}</h4>
          </a>`).join("") : `<p class="empty">No tagged stories yet.</p>`}
      </div>
    `;
  }

  function setActiveNav() {
    const file = location.pathname.split("/").pop() || "index.html";
    $$(".nav-links a").forEach((a) => {
      const href = a.getAttribute("href");
      if (href === file || (file === "" && href === "index.html")) a.classList.add("active");
    });
  }

  document.addEventListener("DOMContentLoaded", () => {
    setActiveNav();
    renderTicker();
    renderFeatured();
    renderHomePerformers();
    renderHomeShop();
    renderNews();
    renderNewsPage();
    renderRoster();
    renderFantasy();
    renderStatsFilters();
    renderStatsBoard();
    renderDraft();
    renderPlayer();
  });
})();
