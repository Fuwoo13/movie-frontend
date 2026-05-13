import { useEffect, useState } from 'react';
import './App.css';

// 🌟 발급받은 TMDB API 키를 아래 따옴표 안에 넣어주세요!
const TMDB_API_KEY = "b9a7f747b0597b4f6431d1e55edcb6e3";

function App() {
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 📸 포스터 이미지 URL들을 모아둘 새로운 State
  const [posters, setPosters] = useState({});

  const [searchTerm, setSearchTerm] = useState("");
  const [skip, setSkip] = useState(0);
  const limit = 20;

  const fetchMovies = (isReset = false) => {
    const currentSkip = isReset ? 0 : skip;
    
    fetch(`https://movie-backend-ebkm.onrender.com/movies?skip=${currentSkip}&limit=${limit}&search=${searchTerm}`)
      .then((response) => response.json())
      .then((data) => {
        if (isReset) {
          setMovies(data);
        } else {
          setMovies((prev) => [...prev, ...data]);
        }
        setSkip(currentSkip + limit);
      })
      .catch((error) => console.error('데이터 에러:', error));
  };

  useEffect(() => {
    fetchMovies(true);
  }, []);

  // 🌟 [핵심] 영화 목록이 업데이트될 때마다 진짜 포스터를 찾아오는 기능
  useEffect(() => {
    if (TMDB_API_KEY === "여기에_API_키를_넣어주세요") return;

    movies.forEach((movie) => {
      if (posters[movie.movie_id]) return; // 이미 찾은 포스터면 패스

      // 검색 정확도를 높이기 위해 제목에서 연도 제거 (예: Toy Story (1995) -> Toy Story)
      const cleanTitle = movie.title.replace(/\(\d{4}\)/, '').trim();

      fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanTitle)}&language=ko-KR`)
        .then((res) => res.json())
        .then((data) => {
          // 검색 결과가 있고, 포스터 이미지가 존재한다면 State에 저장!
          if (data.results && data.results.length > 0 && data.results[0].poster_path) {
            const posterUrl = `https://image.tmdb.org/t/p/w500${data.results[0].poster_path}`;
            setPosters((prev) => ({
              ...prev,
              [movie.movie_id]: posterUrl,
            }));
          }
        })
        .catch((err) => console.error("포스터 가져오기 실패:", err));
    });
  }, [movies, posters]); 

  // 🌟 팝업창의 추천 영화 목록을 위한 포스터 가져오기
  useEffect(() => {
    if (TMDB_API_KEY === "여기에_API_키를_넣어주세요") return;

    recommendations.forEach((rec) => {
      if (posters[rec.movie_id]) return; 
      const cleanTitle = rec.title.replace(/\(\d{4}\)/, '').trim();

      fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(cleanTitle)}&language=ko-KR`)
        .then((res) => res.json())
        .then((data) => {
          if (data.results && data.results.length > 0 && data.results[0].poster_path) {
            const posterUrl = `https://image.tmdb.org/t/p/w500${data.results[0].poster_path}`;
            setPosters((prev) => ({
              ...prev,
              [rec.movie_id]: posterUrl,
            }));
          }
        });
    });
  }, [recommendations, posters]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchMovies(true);
  };

  const handleMovieClick = (movie) => {
    setSelectedMovie(movie);
    setRecommendations([]);
    setIsLoading(true);

    fetch(`https://movie-backend-ebkm.onrender.com/recommend/${movie.movie_id}`)
      .then((response) => response.json())
      .then((data) => {
        setRecommendations(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('추천 에러:', error);
        setIsLoading(false);
      });
  };

  const handleRating = (score) => {
    const ratingData = {
      user_id: 1, 
      movie_id: selectedMovie.movie_id,
      rating: score
    };

    fetch('https://movie-backend-ebkm.onrender.com/rate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ratingData),
    })
      .then((response) => response.json())
      .then((data) => {
        alert(`'${selectedMovie.title}'에 ${score}점을 주셨습니다! ⭐️`);
      })
      .catch((error) => console.error('별점 저장 에러:', error));
  };

  const closeModal = () => setSelectedMovie(null);

  // 이미지를 보여주는 함수 (진짜 포스터가 없으면 임시 포스터를 보여줌)
  const getPosterImage = (movie) => {
    return posters[movie.movie_id] || `https://placehold.co/300x450/111/e50914?text=${encodeURIComponent(movie.title.substring(0, 15))}`;
  };

  return (
   <div className="App">
      <header className="main-header">
        <h1>9조 영화추천 AI 사이트</h1>
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
            <div 
              key={`${movie.movie_id}-${index}`} 
              className="movie-card" 
              onClick={() => handleMovieClick(movie)}
            >
              {/* 📸 업그레이드된 포스터 이미지 적용! */}
              <img 
                src={getPosterImage(movie)} 
                alt={movie.title} 
                className="movie-poster" 
              />
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

      {/* 팝업창(모달) */}
      {selectedMovie && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closeModal}>✕</button>
            <h2 className="modal-title">
              <span className="highlight">'{selectedMovie.title}'</span> 맘에 드셨나요?
            </h2>
            
            <div className="rating-box">
              <p>내 취향 별점 남기기</p>
              <div className="stars">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button key={num} className="star-btn" onClick={() => handleRating(num)}>
                    {num}점
                  </button>
                ))}
              </div>
            </div>

            <p className="modal-subtitle">이 영화를 좋아하신다면, 이런 영화는 어때요?</p>
            {isLoading ? (
              <div className="loading-box">
                <p className="pulse">🤖 AI가 당신의 취향을 분석 중...</p>
              </div>
            ) : (
              <div className="recommendation-list">
                {recommendations.map((rec, recIndex) => (
                  <div key={`${rec.movie_id}-${recIndex}`} className="rec-card">
                    {/* 추천 영화 목록에도 포스터 적용 */}
                    <img 
                      src={getPosterImage(rec)} 
                      alt={rec.title} 
                      className="movie-poster" 
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover', zIndex: 0, borderRadius: '8px', opacity: 0.5 }} 
                    />
                    <div style={{ position: 'relative', zIndex: 1 }}>
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
    </div>
  );
}

export default App;