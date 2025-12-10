import { useEffect, useState } from "react";
import AuthForm from "./components/AuthForm";
import "./styles.css";

function App() {
  const [favorites, setFavorites] = useState([]);
  const [showFavorites, setShowFavorites] = useState(false);
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [minDiscount, setMinDiscount] = useState(0);
  const [sortBy, setSortBy] = useState("discount"); // "discount" o "price"
  const [currentPage, setCurrentPage] = useState(0);
  const [notification, setNotification] = useState(null);
  const itemsPerPage = 16;
  const API_BASE = "https://steamdealsbackend.onrender.com";
  const [isLogged, setIsLogged] = useState(
  Boolean(localStorage.getItem("token"))
);
const [token, setToken] = useState(localStorage.getItem("token"));

async function handleLoginSuccess() {
  setToken(localStorage.getItem("token"))
  setIsLogged(true);
  await loadFavorites();
}

function logout() {
  localStorage.removeItem("token");
  setIsLogged(false);
  setToken(null);
  setFavorites([]); // opcional
  showNotification("👋 Sesión cerrada");
}

async function loadFavorites() {
  const token = localStorage.getItem("token");
  if (!token) return;

  const res = await fetch(`${API_BASE}/favorites`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  const data = await res.json();
  setFavorites(data);
}

  function fetchDeals(page) {
    setLoading(true);

    fetch(`${API_BASE}/deals?page=${page}&pageSize=${itemsPerPage}`)
      .then(res => res.json())
      .then(data => {
        setDeals(data.deals);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }

  function showNotification(message) {
    setNotification(message);
    setTimeout(() => setNotification(null), 2000); // desaparece en 2 segundos
  }

  useEffect(() => {
    const saved = localStorage.getItem("favorites");
    if (saved) setFavorites(JSON.parse(saved));
  }, []);

  // cargar primera página
  useEffect(() => {
    fetchDeals(currentPage);
  }, [currentPage]);

  const filteredDeals = deals.filter(game => {

    const numericDiscount = parseInt(game.discount.replace("%", ""));
    const matchesDiscount = numericDiscount >= minDiscount;

    return matchesDiscount;
  });

  const sortedDeals = [...filteredDeals].sort((a, b) => {
    if (sortBy === "discount") {
      // Convertimos string "75%" -> número 75
      const discA = parseInt(a.discount.replace("%", ""));
      const discB = parseInt(b.discount.replace("%", ""));
      return discB - discA; // mayor descuento primero
    } else if (sortBy === "price") {
      return parseFloat(a.salePrice) - parseFloat(b.salePrice); // menor precio primero
    }
    return 0;
  });

  const displayDeals = showFavorites ? favorites : sortedDeals;

  async function toggleFavorite(game) {
  const token = localStorage.getItem("token");
  if (!token) {
    showNotification("🔒 Debes iniciar sesión");
    return;
  }

  const exists = favorites.find(f => f.dealURL === game.dealURL);

  if (exists) {
    // DELETE
    await fetch(`${API_BASE}/favorites/${exists._id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` }
    });

    setFavorites(prev => prev.filter(f => f._id !== exists._id));
    showNotification(`❌ Quitado de favoritos: ${game.title}`);
  } else {
    // POST
    const res = await fetch(`${API_BASE}/favorites`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(game)
    });

    const saved = await res.json();
    setFavorites(prev => [...prev, saved]);
    showNotification(`⭐ Añadido a favoritos: ${game.title}`);
  }
}


    if (!isLogged) {
  return (
    <div className="app-container">
      <AuthForm API_BASE={API_BASE} onLogin={handleLoginSuccess} />
    </div>
  );
}
  return (
    <div className="app-container">
      {token && (
  <button className="logout-button" onClick={logout}>
    🚪 Logout
  </button>
)}
      {notification && (
        <div className="toast">
          {notification}
        </div>
      )}
      <h1 className="app-title">🎮 Ofertas en Steam</h1>

      <div className="filters">
        <button
          onClick={() => setShowFavorites(!showFavorites)}
          className="fav-toggle"
        >
          {showFavorites ? "Ver ofertas" : "Ver favoritos ⭐"}
        </button>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="filter-select"
        >
          <option value="discount">Ordenar por descuento</option>
          <option value="price">Ordenar por precio</option>
        </select>


        <select
          value={minDiscount}
          onChange={(e) => setMinDiscount(Number(e.target.value))}
          className="filter-select"
        >
          <option value="0">Sin filtro</option>
          <option value="50">50% o más</option>
          <option value="75">75% o más</option>
          <option value="90">90% o más</option>
        </select>
      </div>

      {loading && (
        <h2 style={{ textAlign: "center" }}>Cargando...</h2>
      )}

      <div className="deals-grid">
        {!loading &&
          displayDeals.map(game => (
            <div key={game.steamAppID} className="deal-card">
              <button
                className={`fav-button ${favorites.find(f => f.dealURL === game.dealURL) ? "fav-active" : ""
                  }`}
                onClick={() => toggleFavorite(game)}
              >
                ⭐
              </button>
              <img src={game.thumbnail} alt={game.title} />
              <h3 className="deal-title">{game.title}</h3>

              <div className="price-box">
                <span className="old-price">{game.normalPrice}€</span>
                <span className="new-price">{game.salePrice}€</span>
                <span className="discount">{game.discount}</span>
              </div>

              <a
                href={game.dealURL}
                target="_blank"
                rel="noopener noreferrer"
                className="deal-btn"
              >
                Ver oferta
              </a>
            </div>
          ))}
      </div>

      {/* Pagination */}
      {!showFavorites && (
      <div className="pagination">
        <button
          disabled={currentPage === 0}
          onClick={() => setCurrentPage(p => p - 1)}
          className="page-btn"
        >
          ⬅️ Anterior
        </button>

        <span className="page-number">Página {currentPage + 1}</span>

        <button
          onClick={() => setCurrentPage(p => p + 1)}
          className="page-btn"
        >
          Siguiente ➡️
        </button>
      </div>
      )}
    </div>
  );
}

export default App;
