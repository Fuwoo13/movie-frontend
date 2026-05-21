import { useEffect, useState, useRef } from 'react';
import './App.css';

const TMDB_API_KEY = "b9a7f747b0597b4f6431d1e55edcb6e3";
const API_BASE_URL = "https://movie-backend-ebkm.onrender.com"; 

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

  const [loggedInUser, setLoggedInUser] = useState(() => {
    const savedUser = localStorage.getItem('loggedInUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [authForm, setAuthForm] = useState({ username: '', password: '' });

  const [currentView, setCurrentView] = useState('main'); 
  const [myRatings, setMyRatings] = useState([]); 

  // 🌟 [신규] 사진 추천을 위한 상태 변수들
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageRecs, setImageRecs] = useState([]);
  const [detectedMood, setDetectedMood] = useState("");
  const [isImageAnalyzing, setIsImageAnalyzing] = useState(false);

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

  // 🌟 [수정] imageRecs(사진 추천 영화)도 포스터를 가져오도록 배열에 추가!
  useEffect(() => {
    if (!TMDB_API_KEY) return;
    // imageRecs가 진짜 배열(리스트)일 때만 합치고, 아니면 빈 배열로 처리해 기절을 방지합니다.
const allMovies = [
  ...movies, 
  ...recommendations, 
  ...myRatings, 
  ...(Array.isArray(imageRecs) ? imageRecs : [])
];
    allMovies.forEach((movie) => {
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
  }, [movies, recommendations, myRatings, imageRecs]);

  const fetchMyRatings = () => {
    if (!loggedInUser) return;
    fetch(`${API_BASE_URL}/users/${loggedInUser.user_id}/ratings`)
      .then((res) => {
        if (!res.ok) throw new Error("서버 에러 발생");
        return res.json();
      })
      .then((data) => {
        setMyRatings(Array.isArray(data) ? data : []);
        setCurrentView('mypage');
      })
      .catch((err) => {
        console.error("마이페이지 로딩 에러:", err);
        setMyRatings([]); 
        setCurrentView('mypage');
      });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentView('main'); 
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
      .then(() => {
        alert(`'${selectedMovie.title}'에 ${score}점을 주셨습니다! ⭐️`);
        if (currentView === 'mypage') fetchMyRatings(); 
      })
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
            localStorage.setItem('loggedInUser', JSON.stringify(userObj));
            setIsAuthModalOpen(false); 
          } else {
            setAuthMode('login'); 
          }
        } else {
          alert(`실패: ${data.message}`);
        }
      })
      .catch(() => alert("서버 연결 실패. 백엔드가 켜져 있는지 확인하세요!"));
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    localStorage.removeItem('loggedInUser');
    setCurrentView('main'); 
  };

  // 🌟 [신규] 사진 선택 시 미리보기 처리 함수
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setImageRecs([]); // 이전 결과 초기화
      setDetectedMood("");
    }
  };

  // 🌟 [신규] 백엔드에 사진 보내서 결과 받아오는 함수
  const handleImageSubmit = () => {
    if (!imageFile) return alert("먼저 사진을 올려주세요!");
    setIsImageAnalyzing(true);

    const formData = new FormData();
    formData.append("file", imageFile);

    fetch(`${API_BASE_URL}/recommend-by-image`, {
      method: "POST",
      body: formData,
    })
.then((res) => {
        if (!res.ok) throw new Error("백엔드에 아직 사진 API가 배포되지 않았습니다.");
        return res.json();
      })
      .then((data) => {
        setDetectedMood(data.mood_detected || "분석 실패 😢");
        // 데이터가 배열로 정상 수신되었을 때만 넣고, 아니면 빈 리스트를 넣습니다.
        setImageRecs(Array.isArray(data.recommendations) ? data.recommendations : []);
        setIsImageAnalyzing(false);
      })
      .catch((err) => {
        console.error("사진 분석 에러:", err);
        setImageRecs([]); // 에러 시 빈 리스트로 초기화하여 팅김 방지
        setIsImageAnalyzing(false);
        alert("서버가 아직 준비 중이거나 에러가 발생했습니다. 잠시 후 다시 시도해 주세요!");
      });
  };

  return (
    <div className="App">
      <header className="main-header">
        <div className="header-center-group">
          <h1 onClick={() => setCurrentView('main')} style={{ cursor: 'pointer' }}>9조 영화추천 AI 사이트</h1>
          
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
        </div>

        <div className="auth-header-section">
          {loggedInUser ? (
            <div className="user-profile">
              <span className="welcome-text mypage-trigger" onClick={fetchMyRatings}>
                🍿 {loggedInUser.username}님의 보관함
              </span>
              {currentView === 'mypage' && (
                <button key="btn-home" className="home-btn" onClick={() => setCurrentView('main')}>홈으로</button>
              )}
              <button key="btn-logout" className="logout-btn" onClick={handleLogout}>로그아웃</button>
            </div>
          ) : (
            <button className="login-btn" onClick={() => setIsAuthModalOpen(true)}>로그인</button>
          )}
        </div>
      </header>

      {currentView === 'main' ? (
        <main key="view-main" className="content-area">
          <h2 className="section-title">지금 뜨는 영화 목록</h2>
          <div className="movie-carousel">
            {movies.map((movie, index) => (
              <div key={`main-${movie.movie_id}-${index}`} className="movie-card" onClick={() => handleMovieClick(movie)}>
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

          {/* ======================================================== */}
          {/* 📸 [신규] 사진으로 찾는 AI 영화 추천 섹션 */}
          {/* ======================================================== */}
          <hr className="divider" />
          <div className="image-ai-section">
            <h2 className="section-title" style={{ textAlign: 'center' }}>📸 사진으로 찾는 내 취향 영화</h2>
            <p className="image-ai-desc">지금 당신의 기분이나 분위기가 담긴 사진을 올려주세요. AI가 어울리는 영화를 찾아드립니다!</p>
            
            <div className="image-upload-box">
              <input type="file" accept="image/*" onChange={handleImageChange} id="file-upload" className="file-input" />
              <label htmlFor="file-upload" className="file-upload-label">
                {imagePreview ? "다른 사진 고르기" : "📷 사진 업로드하기"}
              </label>
              
              {imagePreview && (
                <div className="image-preview-container">
                  <img src={imagePreview} alt="미리보기" className="image-preview" />
                  <button className="analyze-btn" onClick={handleImageSubmit} disabled={isImageAnalyzing}>
                    {isImageAnalyzing ? "🤖 AI가 사진 분석 중..." : "✨ 이 사진으로 영화 추천받기"}
                  </button>
                </div>
              )}
            </div>

            {/* AI 분석 결과 출력 */}
            {detectedMood && (
              <div className="image-result-box">
                <h3 className="mood-text">분석된 분위기: <span className="highlight">{detectedMood}</span></h3>
                <div className="recommendation-list">
                  {imageRecs.map((rec, recIndex) => (
                    <div key={`img-rec-${rec.movie_id}-${recIndex}`} className="rec-card" onClick={() => handleMovieClick(rec)}>
                      <img src={getPosterImage(rec)} alt={rec.title} className="movie-poster" />
                      <div className="rec-card-info">
                        <h4>{rec.title}</h4>
                        <p>{rec.genres.split('|').join(' · ')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      ) : (
        <main key="view-mypage" className="content-area">
          <h2 className="section-title">내가 별점 준 영화들 ({myRatings.length}개)</h2>
          {myRatings.length === 0 ? (
            <div className="empty-mypage">
              <p>아직 별점을 남긴 영화가 없습니다. 🎬</p>
              <button className="auth-submit-btn" onClick={() => setCurrentView('main')}>영화 보러가기</button>
            </div>
          ) : (
            <div className="mypage-grid">
              {myRatings.map((movie, index) => (
                <div key={`mypage-${movie.movie_id}-${index}`} className="movie-card mypage-card" onClick={() => handleMovieClick(movie)}>
                  <img src={getPosterImage(movie)} alt={movie.title} className="movie-poster" />
                  <div className="user-rating-badge">⭐ {movie.rating}점</div>
                  <div className="card-info">
                    <h3>{movie.title}</h3>
                    <p>🎬 {movie.genres.split('|').join(' · ')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      )}

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
                  <div key={`rec-${rec.movie_id}-${recIndex}`} className="rec-card">
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
              <input type="text" placeholder="아이디" value={authForm.username} onChange={(e) => setAuthForm({...authForm, username: e.target.value})} required />
              <input type="password" placeholder="비밀번호" value={authForm.password} onChange={(e) => setAuthForm({...authForm, password: e.target.value})} required />
              <button type="submit" className="auth-submit-btn">{authMode === 'login' ? '로그인 시작' : '가입 완료'}</button>
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