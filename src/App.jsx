import { useEffect, useState, useRef } from 'react';
import './App.css';

// 🌟 발급받은 TMDB API 키
const TMDB_API_KEY = "b9a7f747b0597b4f6431d1e55edcb6e3";
const API_BASE_URL = "https://movie-backend-ebkm.onrender.com"; // 백엔드 주소

function App() {
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [posters, setPosters] = useState({});
  const fetchedMovies = useRef(new Set());
  const fetchedRecs = useRef(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [skip, setSkip] = useState(0);
  const limit = 20;

  // 🌟 [핵심 변경] 처음 켜질 때 '비밀 수첩(localStorage)'을 확인해서 로그인 유지하기!
  const [loggedInUser, setLoggedInUser] = useState(() => {
    const savedUser = localStorage.getItem('loggedInUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ username: '', password: '' });

  const fetchMovies = (isReset = false) => {
    const currentSkip = isReset ? 0 : skip;
    fetch(`${API_BASE_URL}/movies?skip=${currentSkip}&limit=${limit}&search=${searchTerm}`)
      .then((response) => response.json())
      .then((data) => {
        if (isReset) setMovies(data);
        else setMovies((prev) => [...prev, ...data]);
        setSkip(currentSkip + limit);
      })
      .catch((error) => console.error('데이터 에러:', error));
  };

  useEffect(() => { fetchMovies(true); }, []);

  useEffect(() => {
    if (!TMDB_API_KEY) return;
    movies.forEach((movie) => {
      if (fetchedMovies.current.has(movie.movie_id)) return;
      fetchedMovies.current.add(movie.movie_id);
      const cleanTitle = movie.title.replace(/\(\d{4}\)/, '').trim();
      fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanTitle)}&language=ko-KR`)
        .then((res) => res.json())
        .then((data) => {
          if (data.results && data.results.length > 0 && data.results[0].poster_path) {
            setPosters((prev) => ({ ...prev, [movie.movie_id]: `https://image.tmdb.org/t/p/w500${data.results[0].poster_path}` }));
          }
        });
    });
  }, [movies]);

  useEffect(() => {
    if (!TMDB_API_KEY) return;
    recommendations.forEach((rec) => {
      if (fetchedRecs.current.has(rec.movie_id)) return;
      fetchedRecs.current.add(rec.movie_id);
      const cleanTitle = rec.title.replace(/\(\d{4}\)/, '').trim();
      fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanTitle)}&language=ko-KR`)
        .then((res) => res.json())
        .then((data) => {
          if (data.results && data.results.length > 0 && data.results[0].poster_path) {
            setPosters((prev) => ({ ...prev, [rec.movie_id]: `https://image.tmdb.org/t/p/w500${data.results[0].poster_path}` }));
          }
        });
    });
  }, [recommendations]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchedMovies.current.clear();
    fetchMovies(true);
  };

  const handleMovieClick = (movie) => {
    setSelectedMovie(movie);
    setRecommendations([]);
    setIsLoading(true);
    fetchedRecs.current.clear();

    fetch(`${API_BASE_URL}/recommend/${movie.movie_id}`)
      .then((response) => response.json())
      .then((data) => { setRecommendations(data); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  };

  const handleRating = (score) => {
    if (!loggedInUser) {
      alert("로그인이 필요한 기능입니다! 먼저 로그인해주세요. 🔐");
      setIsAuthModalOpen(true);
      return;
    }

    const ratingData = {
      user_id: loggedInUser.user_id,
      movie_id: selectedMovie.movie_id,
      rating: score
    };

    fetch(`${API_BASE_URL}/rate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ratingData),
    })
      .then((response) => response.json())
      .then(() => alert(`'${selectedMovie.title}'에 ${score}점을 주셨습니다! ⭐️`))
      .catch((error) => console.error('별점 저장 에러:', error));
  };

  const closeModal = () => setSelectedMovie(null);

  const getPosterImage = (movie) => {
    return posters[movie.movie_id] || `https://placehold.co/300x450/111/e50914?text=${encodeURIComponent(movie.title.substring(0, 15))}`;
  };

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    const endpoint = authMode === 'login' ? '/login' : '/signup';
    
    fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(authForm),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          alert(data.message);
          if (authMode === 'login') {
            const userObj = { user_id: data.user_id, username: authForm.username };
            setLoggedInUser(userObj);
            // 🌟 [핵심 변경] 로그인 성공 시 수첩에 정보 적어두기
            localStorage.setItem('loggedInUser', JSON.stringify(userObj));
            setIsAuthModalOpen(false); 
          } else {
            setAuthMode('login'); 
          }
        } else {
          alert(`실패: ${data.message}`);
        }
      })
      .catch((err) => alert("서버와 연결할 수 없습니다. 백엔드를 확인해주세요!"));
  };

  // 🌟 [핵심 변경] 로그아웃 시 수첩에서 정보 지우기
  const handleLogout = () => {
    setLoggedInUser(null);
    localStorage.removeItem('loggedInUser');
  };

  return (
   <div className="App">
      <header className="main-header">
        <h1>9조 영화추천 AI 사이트</h1>
        
        <div className="auth-header-section">
          {loggedInUser ? (
            <div className="user-profile">
              <span className="welcome-text">🍿 {loggedInUser.username}님</span>
              <button className="logout-btn" onClick={handleLogout}>로그아웃</button>
            </div>
          ) : (
            <button className="login-btn" onClick={() => setIsAuthModalOpen(true)}>로그인</button>
          )}
        </div>

        <div className="search-container">
          <form onSubmit={handleSearch} className="search-bar">
            <input 
              type="text" 
              placeholder="어떤 영화를 찾으시나요?" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <button type="submit">검색</button>
          </form>
        </div>
      </header>

      <main className="content-area">
        <h2 className="section-title">지금 뜨는 영화 목록</h2>
        <div className="movie-carousel">
          {movies.map((movie, index) => (
            <div key={`${movie.movie_id}-${index}`} className="movie-card" onClick={() => handleMovieClick(movie)}>
              <img src={getPosterImage(movie)} alt={movie.title} className="movie-poster" />
              <div className="card-info">
                <h3>{movie.title}</h3>
                <p>🎬 {movie.genres.split('|').join(' · ')}</p>
              </div>
            </div>
          ))}
        </div>

        {movies.length > 0 && (
          <button className="load-more-btn" onClick={() => fetchMovies(false)}>
            더 많은 영화 탐색하기 🍿
          </button>
        )}
      </main>

      {selectedMovie && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closeModal}>✕</button>
            <h2 className="modal-title"><span className="highlight">'{selectedMovie.title}'</span> 맘에 드셨나요?</h2>
            <div className="rating-box">
              <p>내 취향 별점 남기기</p>
              <div className="stars">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button key={num} className="star-btn" onClick={() => handleRating(num)}>{num}점</button>
                ))}
              </div>
            </div>
            <p className="modal-subtitle">이 영화를 좋아하신다면, 이런 영화는 어때요?</p>
            {isLoading ? (
              <div className="loading-box"><p className="pulse">🤖 AI가 당신의 취향을 분석 중...</p></div>
            ) : (
              <div className="recommendation-list">
                {recommendations.map((rec, recIndex) => (
                  <div key={`${rec.movie_id}-${recIndex}`} className="rec-card">
                    <img src={getPosterImage(rec)} alt={rec.title} className="movie-poster" />
                    <div className="rec-card-info">
                      <h4>{rec.title}</h4>
                      <p>{rec.genres.split('|').join(' · ')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {isAuthModalOpen && (
        <div className="modal-overlay auth-overlay" onClick={() => setIsAuthModalOpen(false)}>
          <div className="auth-box" onClick={(e) => e.stopPropagation()}>
            <button className="auth-close-btn" onClick={() => setIsAuthModalOpen(false)}>✕</button>
            <h2>{authMode === 'login' ? '로그인' : '회원가입'}</h2>
            <form onSubmit={handleAuthSubmit} className="auth-form">
              <input 
                type="text" 
                placeholder="아이디" 
                value={authForm.username} 
                onChange={(e) => setAuthForm({...authForm, username: e.target.value})}
                required 
              />
              <input 
                type="password" 
                placeholder="비밀번호" 
                value={authForm.password} 
                onChange={(e) => setAuthForm({...authForm, password: e.target.value})}
                required 
              />
              <button type="submit" className="auth-submit-btn">
                {authMode === 'login' ? '로그인 시작' : '가입 완료'}
              </button>
            </form>
            <p className="auth-switch-text" onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}>
              {authMode === 'login' ? '계정이 없으신가요? 지금 가입하세요.' : '이미 계정이 있으신가요? 로그인하기'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;