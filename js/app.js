const STORAGE_KEYS = {
  users: "campusTradeUsers",
  goods: "campusTradeGoods",
  favorites: "campusTradeFavorites",
  session: "campusTradeSession",
  version: "campusTradeDataVersion",
};

const DATA_VERSION = "1.0";

const CATEGORY_IMAGES = {
  教材书籍: "assets/product-book.svg",
  电子数码: "assets/product-headphones.svg",
  生活用品: "assets/product-lamp.svg",
  运动户外: "assets/product-basketball.svg",
  交通工具: "assets/product-bike.svg",
  其他闲置: "assets/product-keyboard.svg",
};

const state = {
  route: "home",
  search: "",
  category: "全部",
  sort: "new",
  editingId: null,
  uploadImage: "",
  pendingConfirmAction: null,
};

const elements = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  seedData();
  bindEvents();
  ensureHashRoute();
  render();
});

function cacheElements() {
  elements.headerActions = document.querySelector("#headerActions");
  elements.headerSearchForm = document.querySelector("#headerSearchForm");
  elements.headerSearchInput = document.querySelector("#headerSearchInput");
  elements.heroSearchForm = document.querySelector("#heroSearchForm");
  elements.heroSearchInput = document.querySelector("#heroSearchInput");
  elements.homeMetrics = document.querySelector("#homeMetrics");
  elements.homeCategories = document.querySelector("#homeCategories");
  elements.homeGoodsGrid = document.querySelector("#homeGoodsGrid");
  elements.marketSummary = document.querySelector("#marketSummary");
  elements.marketCategories = document.querySelector("#marketCategories");
  elements.marketSortOptions = document.querySelector("#marketSortOptions");
  elements.marketGoodsGrid = document.querySelector("#marketGoodsGrid");
  elements.publishTitle = document.querySelector("#publishTitle");
  elements.goodsForm = document.querySelector("#goodsForm");
  elements.goodsCategory = document.querySelector("#goodsCategory");
  elements.goodsImage = document.querySelector("#goodsImage");
  elements.goodsImagePreview = document.querySelector("#goodsImagePreview");
  elements.goodsSubmitLabel = document.querySelector("#goodsSubmitLabel");
  elements.cancelEditButton = document.querySelector("#cancelEditButton");
  elements.favoritesGrid = document.querySelector("#favoritesGrid");
  elements.myGoodsList = document.querySelector("#myGoodsList");
  elements.profileContent = document.querySelector("#profileContent");
  elements.adminMetrics = document.querySelector("#adminMetrics");
  elements.pendingCount = document.querySelector("#pendingCount");
  elements.pendingGoodsList = document.querySelector("#pendingGoodsList");
  elements.adminGoodsTable = document.querySelector("#adminGoodsTable");
  elements.authDialog = document.querySelector("#authDialog");
  elements.goodsDialog = document.querySelector("#goodsDialog");
  elements.goodsDetailContent = document.querySelector("#goodsDetailContent");
  elements.confirmDialog = document.querySelector("#confirmDialog");
  elements.confirmTitle = document.querySelector("#confirmTitle");
  elements.confirmMessage = document.querySelector("#confirmMessage");
  elements.confirmActionButton = document.querySelector("#confirmActionButton");
  elements.toast = document.querySelector("#toast");
}

function bindEvents() {
  document.addEventListener("click", handleDocumentClick);
  elements.headerSearchForm.addEventListener("submit", handleSearchSubmit);
  elements.heroSearchForm.addEventListener("submit", handleSearchSubmit);
  elements.goodsForm.addEventListener("submit", handleGoodsSubmit);
  elements.goodsImage.addEventListener("change", handleImageChange);
  elements.cancelEditButton.addEventListener("click", cancelEdit);
  elements.confirmActionButton.addEventListener("click", runConfirmedAction);
  document.querySelector("#confirmCancelButton").addEventListener("click", () => {
    state.pendingConfirmAction = null;
    elements.confirmDialog.close();
  });
  window.addEventListener("hashchange", () => {
    ensureHashRoute();
    render();
  });
}

function handleDocumentClick(event) {
  const routeButton = event.target.closest("[data-route]");
  if (routeButton) {
    navigate(routeButton.dataset.route);
    return;
  }

  const closeButton = event.target.closest("[data-close-dialog]");
  if (closeButton) {
    document.querySelector(`#${closeButton.dataset.closeDialog}`)?.close();
    return;
  }

  const authTab = event.target.closest("[data-auth-tab]");
  if (authTab) {
    switchAuthTab(authTab.dataset.authTab);
    return;
  }

  const categoryButton = event.target.closest("[data-category]");
  if (categoryButton) {
    state.category = categoryButton.dataset.category;
    navigate("market");
    return;
  }

  const sortButton = event.target.closest("[data-sort]");
  if (sortButton) {
    state.sort = sortButton.dataset.sort;
    renderMarket();
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (actionButton) {
    handleAction(actionButton);
    return;
  }

  if (event.target === elements.authDialog) {
    elements.authDialog.close();
  }
  if (event.target === elements.goodsDialog) {
    elements.goodsDialog.close();
  }
}

function handleAction(button) {
  const { action, id } = button.dataset;

  if (action === "login") {
    openAuth("login");
    return;
  }
  if (action === "logout") {
    logout();
    return;
  }
  if (action === "favorite") {
    toggleFavorite(id);
    return;
  }
  if (action === "details") {
    openGoodsDetail(id);
    return;
  }
  if (action === "edit") {
    startEdit(id);
    return;
  }
  if (action === "mark-sold") {
    markGoodsSold(id);
    return;
  }
  if (action === "approve") {
    updateGoodsStatus(id, "active");
    toast("商品已审核通过");
    render();
    return;
  }
  if (action === "reject") {
    updateGoodsStatus(id, "rejected");
    toast("商品已标记为审核不通过");
    render();
    return;
  }
  if (action === "down") {
    updateGoodsStatus(id, "rejected");
    toast("商品已下架");
    render();
    return;
  }
  if (action === "up") {
    updateGoodsStatus(id, "active");
    toast("商品已重新上架");
    render();
  }
}

function handleSearchSubmit(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const input = form.querySelector('input[type="search"]');
  state.search = input.value.trim();
  if (input !== elements.headerSearchInput) {
    elements.headerSearchInput.value = state.search;
  }
  if (input !== elements.heroSearchInput) {
    elements.heroSearchInput.value = state.search;
  }
  navigate("market");
}

function ensureHashRoute() {
  if (!location.hash || !location.hash.startsWith("#/")) {
    location.hash = "#/home";
  }
}

function navigate(route) {
  location.hash = `#/${route}`;
}

function getRouteFromHash() {
  const value = location.hash.replace(/^#\//, "").trim();
  return value || "home";
}

function render() {
  state.route = getRouteFromHash();
  const protectedRoutes = ["publish", "favorites", "my-goods", "profile", "admin"];
  const currentUser = getCurrentUser();

  if (protectedRoutes.includes(state.route) && !currentUser) {
    navigate("home");
    openAuth("login");
    toast("请先登录后再继续操作");
    return;
  }

  if (state.route === "admin" && currentUser.role !== "admin") {
    navigate("home");
    toast("该页面仅管理员可以访问");
    return;
  }

  document.querySelectorAll(".view").forEach((view) => view.classList.remove("active"));
  document.querySelector(`#view-${state.route}`)?.classList.add("active");

  document.querySelectorAll("[data-route]").forEach((button) => {
    button.classList.toggle("active", button.dataset.route === state.route);
  });

  renderHeader();

  if (state.route === "home") renderHome();
  if (state.route === "market") renderMarket();
  if (state.route === "publish") renderPublish();
  if (state.route === "favorites") renderFavorites();
  if (state.route === "my-goods") renderMyGoods();
  if (state.route === "profile") renderProfile();
  if (state.route === "admin") renderAdmin();

  updateIcons();
}

function renderHeader() {
  const user = getCurrentUser();
  const adminNav = document.querySelector(".admin-nav");
  adminNav.hidden = !user || user.role !== "admin";
  if (!user) {
    elements.headerActions.innerHTML = `
      <button type="button" class="secondary-button" data-action="login">
        <i data-lucide="log-in"></i>登录 / 注册
      </button>
    `;
    return;
  }

  elements.headerActions.innerHTML = `
    <button type="button" class="user-chip" data-route="profile" title="进入个人中心">
      <span class="avatar">${escapeHtml(initials(user.name))}</span>
      <span>${escapeHtml(user.name)}</span>
    </button>
    <button type="button" class="secondary-button" data-action="logout" title="退出登录">
      <i data-lucide="log-out"></i><span class="logout-label">退出</span>
    </button>
  `;
}

function renderHome() {
  const goods = getGoods().filter((item) => item.status === "active");
  const users = getUsers();
  const favorites = getFavorites();
  elements.homeMetrics.innerHTML = [
    ["在售商品", goods.length, "上架中的闲置物品"],
    ["校园用户", users.length, "已注册账号"],
    ["累计发布", getGoods().length, "包含待审核和已售商品"],
    ["收藏记录", favorites.length, "用户收藏的商品"],
  ]
    .map(
      ([label, value, note]) => `
        <div class="metric-item">
          <strong>${value}</strong>
          <span>${label}</span>
          <span>${note}</span>
        </div>
      `,
    )
    .join("");

  renderCategoryButtons(elements.homeCategories, false);
  renderGoodsGrid(elements.homeGoodsGrid, sortGoods(goods).slice(0, 8), "暂时没有在售商品");
}

function renderMarket() {
  let goods = getGoods().filter((item) => item.status === "active");

  if (state.category !== "全部") {
    goods = goods.filter((item) => item.category === state.category);
  }

  if (state.search) {
    const keyword = state.search.toLowerCase();
    goods = goods.filter((item) =>
      [item.title, item.category, item.description, item.location, item.sellerName]
        .join(" ")
        .toLowerCase()
        .includes(keyword),
    );
  }

  goods = sortGoods(goods);
  elements.marketSummary.textContent = state.search
    ? `关键词“${state.search}”，找到 ${goods.length} 件商品`
    : `共 ${goods.length} 件在售商品`;
  renderCategoryButtons(elements.marketCategories, true);

  elements.marketSortOptions.querySelectorAll("button").forEach((button) => {
    button.classList.toggle("active", button.dataset.sort === state.sort);
  });

  renderGoodsGrid(elements.marketGoodsGrid, goods, "没有符合条件的商品");
}

function renderPublish() {
  const editing = state.editingId ? getGoods().find((item) => item.id === state.editingId) : null;
  const user = getCurrentUser();
  elements.publishTitle.textContent = editing ? "编辑商品" : "发布闲置物品";
  elements.goodsSubmitLabel.textContent = editing ? "保存修改" : "提交审核";
  elements.cancelEditButton.hidden = !editing;

  elements.goodsCategory.innerHTML = Object.keys(CATEGORY_IMAGES)
    .map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`)
    .join("");

  if (editing) {
    elements.goodsForm.goodsName.value = editing.title;
    elements.goodsForm.goodsCategory.value = editing.category;
    elements.goodsForm.goodsPrice.value = editing.price;
    elements.goodsForm.goodsCondition.value = editing.condition;
    elements.goodsForm.goodsLocation.value = editing.location;
    elements.goodsForm.goodsDescription.value = editing.description;
    elements.goodsForm.goodsContact.value = editing.contact;
    elements.goodsImagePreview.src = editing.image || defaultImage(editing.category);
  } else {
    elements.goodsForm.reset();
    elements.goodsImagePreview.src = CATEGORY_IMAGES["教材书籍"];
    elements.goodsForm.goodsContact.value = user?.contact || "";
  }
  state.uploadImage = "";
}

function renderFavorites() {
  const user = getCurrentUser();
  const favoriteIds = new Set(
    getFavorites()
      .filter((item) => item.userId === user.id)
      .map((item) => item.goodsId),
  );
  const goods = getGoods().filter((item) => favoriteIds.has(item.id));
  renderGoodsGrid(elements.favoritesGrid, goods, "还没有收藏商品");
}

function renderMyGoods() {
  const user = getCurrentUser();
  const goods = getGoods()
    .filter((item) => item.sellerId === user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (!goods.length) {
    elements.myGoodsList.innerHTML = emptyState("还没有发布商品", "发布后会在这里查看审核状态");
    updateIcons();
    return;
  }

  elements.myGoodsList.innerHTML = goods
    .map(
      (item) => `
        <article class="record-item">
          <img src="${escapeHtml(item.image || defaultImage(item.category))}" alt="${escapeHtml(item.title)}" />
          <div class="record-info">
            <strong>${escapeHtml(item.title)}</strong>
            <p>${escapeHtml(item.category)} · ¥${formatPrice(item.price)} · ${formatDate(item.createdAt)}</p>
            <p>${statusBadge(item.status)}</p>
          </div>
          <div class="record-actions">
            <button type="button" class="secondary-button" data-action="details" data-id="${item.id}">
              <i data-lucide="eye"></i>详情
            </button>
            ${
              item.status !== "sold"
                ? `<button type="button" class="secondary-button" data-action="edit" data-id="${item.id}">
                    <i data-lucide="pencil"></i>编辑
                  </button>
                  <button type="button" class="primary-button" data-action="mark-sold" data-id="${item.id}">
                    <i data-lucide="badge-check"></i>标记售出
                  </button>`
                : ""
            }
          </div>
        </article>
      `,
    )
    .join("");
}

function renderProfile() {
  const user = getCurrentUser();
  const ownGoods = getGoods().filter((item) => item.sellerId === user.id);
  const favoriteCount = getFavorites().filter((item) => item.userId === user.id).length;
  elements.profileContent.innerHTML = `
    <section class="profile-card profile-summary">
      <div class="profile-avatar">${escapeHtml(initials(user.name))}</div>
      <h2>${escapeHtml(user.name)}</h2>
      <p>@${escapeHtml(user.username)}</p>
      <div class="profile-stats">
        <div><strong>${ownGoods.length}</strong><span>发布商品</span></div>
        <div><strong>${ownGoods.filter((item) => item.status === "active").length}</strong><span>正在出售</span></div>
        <div><strong>${favoriteCount}</strong><span>收藏商品</span></div>
      </div>
      <button type="button" class="secondary-button full-width" data-action="logout" style="margin-top: 18px">
        <i data-lucide="log-out"></i>退出登录
      </button>
    </section>
    <section class="profile-card">
      <div class="admin-section-title"><h2>账号资料</h2></div>
      <div class="info-list">
        <div class="info-row"><span>姓名</span><span>${escapeHtml(user.name)}</span></div>
        <div class="info-row"><span>用户名</span><span>${escapeHtml(user.username)}</span></div>
        <div class="info-row"><span>角色</span><span>${user.role === "admin" ? "管理员" : "普通用户"}</span></div>
        <div class="info-row"><span>联系方式</span><span>${escapeHtml(user.contact || "暂未填写")}</span></div>
        <div class="info-row"><span>注册时间</span><span>${formatDate(user.createdAt)}</span></div>
      </div>
    </section>
  `;
}

function renderAdmin() {
  const goods = getGoods();
  elements.adminMetrics.innerHTML = [
    ["待审核", goods.filter((item) => item.status === "pending").length],
    ["在售商品", goods.filter((item) => item.status === "active").length],
    ["已售商品", goods.filter((item) => item.status === "sold").length],
    ["全部记录", goods.length],
  ]
    .map(([label, value]) => `<div class="metric-item"><strong>${value}</strong><span>${label}</span></div>`)
    .join("");

  const pending = goods
    .filter((item) => item.status === "pending")
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  elements.pendingCount.textContent = `${pending.length} 条`;

  if (!pending.length) {
    elements.pendingGoodsList.innerHTML = emptyState("没有待审核商品", "新发布的商品会出现在这里");
  } else {
    elements.pendingGoodsList.innerHTML = pending
      .map(
        (item) => `
          <article class="record-item">
            <img src="${escapeHtml(item.image || defaultImage(item.category))}" alt="${escapeHtml(item.title)}" />
            <div class="record-info">
              <strong>${escapeHtml(item.title)}</strong>
              <p>${escapeHtml(item.category)} · ¥${formatPrice(item.price)} · ${escapeHtml(item.sellerName)}</p>
              <p>${escapeHtml(item.description)}</p>
            </div>
            <div class="record-actions">
              <button type="button" class="primary-button" data-action="approve" data-id="${item.id}">
                <i data-lucide="check"></i>通过
              </button>
              <button type="button" class="danger-button" data-action="reject" data-id="${item.id}">
                <i data-lucide="x"></i>不通过
              </button>
            </div>
          </article>
        `,
      )
      .join("");
  }

  elements.adminGoodsTable.innerHTML = goods
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .map(
      (item) => `
        <tr>
          <td>
            <div class="table-goods">
              <img src="${escapeHtml(item.image || defaultImage(item.category))}" alt="" />
              <span>${escapeHtml(item.title)}</span>
            </div>
          </td>
          <td>${escapeHtml(item.category)}</td>
          <td>¥${formatPrice(item.price)}</td>
          <td>${escapeHtml(item.sellerName)}</td>
          <td>${statusBadge(item.status)}</td>
          <td>
            ${
              item.status === "pending"
                ? `<button type="button" class="secondary-button" data-action="approve" data-id="${item.id}">审核通过</button>`
                : item.status === "active"
                  ? `<button type="button" class="secondary-button" data-action="down" data-id="${item.id}">下架</button>`
                  : `<button type="button" class="secondary-button" data-action="up" data-id="${item.id}">上架</button>`
            }
          </td>
        </tr>
      `,
    )
    .join("");
}

function renderCategoryButtons(container, includeAll) {
  const categories = includeAll ? ["全部", ...Object.keys(CATEGORY_IMAGES)] : Object.keys(CATEGORY_IMAGES);
  container.innerHTML = categories
    .map(
      (category) => `
        <button type="button" data-category="${escapeHtml(category)}" class="${state.category === category ? "active" : ""}">
          ${escapeHtml(category)}
        </button>
      `,
    )
    .join("");
}

function renderGoodsGrid(container, goods, emptyMessage) {
  if (!goods.length) {
    container.innerHTML = emptyState(emptyMessage, "换个分类或关键词试试");
    return;
  }
  container.innerHTML = goods.map(goodsCard).join("");
}

function goodsCard(item) {
  const favoriteIds = new Set(getFavorites().map((favorite) => favorite.goodsId));
  const isFavorite = favoriteIds.has(item.id);
  return `
    <article class="goods-card">
      <div class="goods-image">
        <img src="${escapeHtml(item.image || defaultImage(item.category))}" alt="${escapeHtml(item.title)}" />
        <button
          type="button"
          class="favorite-button ${isFavorite ? "active" : ""}"
          data-action="favorite"
          data-id="${item.id}"
          title="${isFavorite ? "取消收藏" : "收藏商品"}"
        >
          <i data-lucide="heart"></i>
        </button>
      </div>
      <div class="goods-body">
        <span class="goods-category">${escapeHtml(item.category)}</span>
        <button type="button" class="goods-title text-button" data-action="details" data-id="${item.id}">
          ${escapeHtml(item.title)}
        </button>
        <div class="goods-price">¥${formatPrice(item.price)}</div>
        <div class="goods-meta">
          <span>${escapeHtml(item.condition)} · ${escapeHtml(item.location)}</span>
          <span>${escapeHtml(item.sellerName)}</span>
        </div>
      </div>
    </article>
  `;
}

function openGoodsDetail(id) {
  const item = getGoods().find((goods) => goods.id === id);
  if (!item) {
    toast("商品不存在或已经删除");
    return;
  }

  const user = getCurrentUser();
  const favorite = user ? getFavorites().some((entry) => entry.userId === user.id && entry.goodsId === id) : false;
  const canManage = user && (user.role === "admin" || user.id === item.sellerId);
  elements.goodsDetailContent.innerHTML = `
    <div class="goods-detail">
      <img src="${escapeHtml(item.image || defaultImage(item.category))}" alt="${escapeHtml(item.title)}" />
      <div>
        <span class="goods-category">${escapeHtml(item.category)}</span>
        <h2>${escapeHtml(item.title)}</h2>
        <div class="detail-price">¥${formatPrice(item.price)}</div>
        <p class="detail-description">${escapeHtml(item.description)}</p>
        <div class="detail-list">
          <div><span>新旧程度</span><span>${escapeHtml(item.condition)}</span></div>
          <div><span>交易地点</span><span>${escapeHtml(item.location)}</span></div>
          <div><span>发布人</span><span>${escapeHtml(item.sellerName)}</span></div>
          <div><span>联系方式</span><span>${escapeHtml(item.contact)}</span></div>
          <div><span>发布时间</span><span>${formatDate(item.createdAt)}</span></div>
          <div><span>当前状态</span><span>${statusText(item.status)}</span></div>
        </div>
        <div class="detail-actions">
          <button type="button" class="${favorite ? "primary-button" : "secondary-button"}" data-action="favorite" data-id="${item.id}">
            <i data-lucide="heart"></i>${favorite ? "取消收藏" : "加入收藏"}
          </button>
          ${canManage && item.status !== "sold" ? `<button type="button" class="secondary-button" data-action="edit" data-id="${item.id}"><i data-lucide="pencil"></i>编辑商品</button>` : ""}
        </div>
      </div>
    </div>
  `;
  if (!elements.goodsDialog.open) {
    elements.goodsDialog.showModal();
  }
  updateIcons();
}

function switchAuthTab(tab) {
  document.querySelectorAll("[data-auth-tab]").forEach((button) => {
    button.classList.toggle("active", button.dataset.authTab === tab);
  });
  document.querySelector("#loginForm").hidden = tab !== "login";
  document.querySelector("#registerForm").hidden = tab !== "register";
}

function openAuth(tab = "login") {
  switchAuthTab(tab);
  if (!elements.authDialog.open) elements.authDialog.showModal();
  updateIcons();
}

function login(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const username = form.username.value.trim();
  const password = form.password.value;
  const user = getUsers().find((item) => item.username === username && item.password === password);
  if (!user) {
    toast("用户名或密码错误");
    return;
  }
  setSession(user.id);
  elements.authDialog.close();
  form.reset();
  toast(`欢迎回来，${user.name}`);
  render();
}

function register(event) {
  event.preventDefault();
  const form = event.currentTarget;
  const users = getUsers();
  const username = form.username.value.trim();
  if (users.some((item) => item.username === username)) {
    toast("用户名已经存在");
    return;
  }
  if (form.password.value !== form.confirmPassword.value) {
    toast("两次输入的密码不一致");
    return;
  }

  const user = {
    id: `u${Date.now()}`,
    name: form.name.value.trim(),
    username,
    password: form.password.value,
    role: "user",
    contact: "",
    createdAt: new Date().toISOString(),
  };
  users.push(user);
  saveJSON(STORAGE_KEYS.users, users);
  setSession(user.id);
  elements.authDialog.close();
  form.reset();
  toast("注册成功");
  render();
}

function logout() {
  localStorage.removeItem(STORAGE_KEYS.session);
  state.editingId = null;
  navigate("home");
  toast("已退出登录");
  render();
}

async function handleImageChange(event) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 650 * 1024) {
    toast("图片不能超过 650KB");
    event.target.value = "";
    return;
  }
  try {
    state.uploadImage = await fileToDataUrl(file);
    elements.goodsImagePreview.src = state.uploadImage;
  } catch {
    toast("图片读取失败，请重新选择");
  }
}

async function handleGoodsSubmit(event) {
  event.preventDefault();
  const user = getCurrentUser();
  if (!user) {
    openAuth("login");
    return;
  }

  const form = event.currentTarget;
  const goods = getGoods();
  const category = form.goodsCategory.value;
  const title = form.goodsName.value.trim();
  const price = Number(form.goodsPrice.value);
  const description = form.goodsDescription.value.trim();

  if (!title || !description || !Number.isFinite(price) || price <= 0) {
    toast("请完整填写商品信息");
    return;
  }

  const payload = {
    title,
    category,
    price,
    condition: form.goodsCondition.value,
    location: form.goodsLocation.value.trim(),
    description,
    contact: form.goodsContact.value.trim(),
    image: state.uploadImage || "",
  };

  if (state.editingId) {
    const index = goods.findIndex((item) => item.id === state.editingId && item.sellerId === user.id);
    if (index === -1) {
      toast("无法编辑该商品");
      return;
    }
    goods[index] = {
      ...goods[index],
      ...payload,
      image: payload.image || goods[index].image || defaultImage(category),
      status: "pending",
      updatedAt: new Date().toISOString(),
    };
    saveJSON(STORAGE_KEYS.goods, goods);
    toast("修改已提交审核");
    state.editingId = null;
  } else {
    goods.push({
      id: `g${Date.now()}`,
      ...payload,
      image: payload.image || defaultImage(category),
      sellerId: user.id,
      sellerName: user.name,
      status: "pending",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    saveJSON(STORAGE_KEYS.goods, goods);
    toast("商品已提交审核");
  }

  state.uploadImage = "";
  form.reset();
  elements.goodsImagePreview.src = CATEGORY_IMAGES["教材书籍"];
  navigate("my-goods");
  render();
}

function startEdit(id) {
  const user = getCurrentUser();
  const item = getGoods().find((goods) => goods.id === id);
  if (!item || !user) return;
  if (item.sellerId !== user.id && user.role !== "admin") {
    toast("不能编辑其他用户发布的商品");
    return;
  }
  state.editingId = id;
  elements.goodsDialog.close();
  navigate("publish");
  render();
}

function cancelEdit() {
  state.editingId = null;
  state.uploadImage = "";
  elements.goodsForm.reset();
  elements.goodsImagePreview.src = CATEGORY_IMAGES["教材书籍"];
  navigate("my-goods");
}

function markGoodsSold(id) {
  const user = getCurrentUser();
  const goods = getGoods();
  const item = goods.find((entry) => entry.id === id);
  if (!item || !user || item.sellerId !== user.id) return;
  openConfirm("标记为已售出", `确认将“${item.title}”标记为已售出吗？`, () => {
    item.status = "sold";
    item.updatedAt = new Date().toISOString();
    saveJSON(STORAGE_KEYS.goods, goods);
    toast("商品已标记为售出");
    render();
  });
}

function toggleFavorite(goodsId) {
  const user = getCurrentUser();
  if (!user) {
    openAuth("login");
    toast("请先登录后再收藏");
    return;
  }
  const favorites = getFavorites();
  const index = favorites.findIndex((item) => item.userId === user.id && item.goodsId === goodsId);
  if (index === -1) {
    favorites.push({ userId: user.id, goodsId, createdAt: new Date().toISOString() });
    toast("已加入收藏");
  } else {
    favorites.splice(index, 1);
    toast("已取消收藏");
  }
  saveJSON(STORAGE_KEYS.favorites, favorites);
  render();
  if (elements.goodsDialog.open) openGoodsDetail(goodsId);
}

function updateGoodsStatus(id, status) {
  const goods = getGoods();
  const item = goods.find((entry) => entry.id === id);
  if (!item) return;
  item.status = status;
  item.updatedAt = new Date().toISOString();
  saveJSON(STORAGE_KEYS.goods, goods);
}

function openConfirm(title, message, action) {
  state.pendingConfirmAction = action;
  elements.confirmTitle.textContent = title;
  elements.confirmMessage.textContent = message;
  elements.confirmDialog.showModal();
}

function runConfirmedAction() {
  if (typeof state.pendingConfirmAction === "function") {
    state.pendingConfirmAction();
  }
  state.pendingConfirmAction = null;
  elements.confirmDialog.close();
}

function getUsers() {
  return loadJSON(STORAGE_KEYS.users, []);
}

function getGoods() {
  return loadJSON(STORAGE_KEYS.goods, []);
}

function getFavorites() {
  return loadJSON(STORAGE_KEYS.favorites, []);
}

function getCurrentUser() {
  const userId = localStorage.getItem(STORAGE_KEYS.session);
  return getUsers().find((item) => item.id === userId) || null;
}

function setSession(userId) {
  localStorage.setItem(STORAGE_KEYS.session, userId);
}

function seedData() {
  const currentVersion = localStorage.getItem(STORAGE_KEYS.version);
  if (currentVersion === DATA_VERSION && getUsers().length && getGoods().length) {
    return;
  }

  const now = Date.now();
  const users = [
    {
      id: "u-admin",
      name: "系统管理员",
      username: "admin",
      password: "123456",
      role: "admin",
      contact: "校内后台",
      createdAt: new Date(now - 86400000 * 60).toISOString(),
    },
    {
      id: "u-student",
      name: "王佳佳",
      username: "student",
      password: "123456",
      role: "user",
      contact: "13800000000",
      createdAt: new Date(now - 86400000 * 45).toISOString(),
    },
    {
      id: "u-liming",
      name: "李明",
      username: "liming",
      password: "123456",
      role: "user",
      contact: "微信 liming2024",
      createdAt: new Date(now - 86400000 * 31).toISOString(),
    },
    {
      id: "u-zhaomin",
      name: "赵敏",
      username: "zhaomin",
      password: "123456",
      role: "user",
      contact: "QQ 12345678",
      createdAt: new Date(now - 86400000 * 20).toISOString(),
    },
  ];

  const goods = [
    seedGoods("g1", "高等数学教材上下册", "教材书籍", 18, "九成新", "图书馆北门", "教材有少量笔记，没有缺页，适合下学期继续使用。", "u-liming", 1),
    seedGoods("g2", "宿舍护眼台灯", "生活用品", 25, "八成新", "2号宿舍楼下", "三档亮度，白光和暖光可调，插电使用，功能正常。", "u-zhaomin", 2),
    seedGoods("g3", "头戴式蓝牙耳机", "电子数码", 78, "九成新", "教学楼B区", "续航正常，耳罩干净，带充电线，适合自习使用。", "u-liming", 3),
    seedGoods("g4", "九成新山地自行车", "交通工具", 260, "九成新", "学校南门", "变速正常，车锁和打气筒一起给，可在校内试骑。", "u-student", 4),
    seedGoods("g5", "科学计算器", "电子数码", 35, "八成新", "信息楼一楼", "按键正常，屏幕清晰，适合计算机和工程类课程。", "u-zhaomin", 5),
    seedGoods("g6", "小型电热水壶", "生活用品", 32, "七成新", "3号宿舍楼下", "容量1.5升，自动断电，外壳有轻微使用痕迹。", "u-student", 6),
    seedGoods("g7", "篮球和打气筒", "运动户外", 45, "八成新", "操场东侧", "球体弹性正常，打气筒可以一起带走。", "u-liming", 7),
    seedGoods("g8", "有线机械键盘", "电子数码", 86, "九成新", "信息楼三楼", "青轴，按键正常，适合宿舍或实验室使用。", "u-zhaomin", 8),
    {
      ...seedGoods("g9", "计算机网络教材", "教材书籍", 22, "九成新", "图书馆门口", "课程结束后不再使用，书角有轻微磨损。", "u-student", 9),
      status: "pending",
    },
    {
      ...seedGoods("g10", "折叠收纳箱", "其他闲置", 20, "八成新", "4号宿舍楼下", "可折叠，容量较大，适合收纳衣物和书本。", "u-liming", 10),
      status: "pending",
    },
  ];

  const favorites = [
    { userId: "u-student", goodsId: "g2", createdAt: new Date(now - 86400000 * 2).toISOString() },
    { userId: "u-student", goodsId: "g3", createdAt: new Date(now - 86400000).toISOString() },
  ];

  saveJSON(STORAGE_KEYS.users, users);
  saveJSON(STORAGE_KEYS.goods, goods);
  saveJSON(STORAGE_KEYS.favorites, favorites);
  localStorage.setItem(STORAGE_KEYS.version, DATA_VERSION);
}

function seedGoods(id, title, category, price, condition, location, description, sellerId, dayOffset, status = "active") {
  const users = {
    "u-student": "王佳佳",
    "u-liming": "李明",
    "u-zhaomin": "赵敏",
  };
  const contacts = {
    "u-student": "13800000000",
    "u-liming": "微信 liming2024",
    "u-zhaomin": "QQ 12345678",
  };
  return {
    id,
    title,
    category,
    price,
    condition,
    location,
    description,
    contact: contacts[sellerId],
    image: defaultImage(category),
    sellerId,
    sellerName: users[sellerId],
    status,
    createdAt: new Date(Date.now() - dayOffset * 86400000).toISOString(),
    updatedAt: new Date(Date.now() - dayOffset * 86400000).toISOString(),
  };
}

function defaultImage(category) {
  return CATEGORY_IMAGES[category] || CATEGORY_IMAGES["其他闲置"];
}

function sortGoods(goods) {
  const copy = [...goods];
  if (state.sort === "price-asc") return copy.sort((a, b) => a.price - b.price);
  if (state.sort === "price-desc") return copy.sort((a, b) => b.price - a.price);
  return copy.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function statusBadge(status) {
  const labels = {
    pending: "待审核",
    active: "在售",
    sold: "已售出",
    rejected: "已下架",
  };
  return `<span class="status-badge status-${status}">${labels[status] || "未知状态"}</span>`;
}

function statusText(status) {
  return {
    pending: "待审核",
    active: "在售",
    sold: "已售出",
    rejected: "已下架",
  }[status] || "未知状态";
}

function emptyState(title, note) {
  return `
    <div class="empty-state">
      <i data-lucide="package-search"></i>
      <strong>${escapeHtml(title)}</strong>
      <p>${escapeHtml(note)}</p>
    </div>
  `;
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function loadJSON(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function formatPrice(value) {
  return Number(value).toFixed(2).replace(/\.00$/, "");
}

function formatDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function initials(name) {
  return (name || "用户").slice(-2);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function toast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  window.clearTimeout(toast.timer);
  toast.timer = window.setTimeout(() => elements.toast.classList.remove("show"), 2200);
}

function updateIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

document.querySelector("#loginForm").addEventListener("submit", login);
document.querySelector("#registerForm").addEventListener("submit", register);
