import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 🌟 검색 및 페이징을 위한 State
  const [searchTerm, setSearchTerm] = useState("");
  const [skip, setSkip] = useState(0);
  const limit = 20;

  // 🌟 영화 데이터를 백엔드에서 가져오는 함수
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
        alert(`'${selectedMovie.title}'에 {score}점을 주셨습니다! ⭐️`);
      })
      .catch((error) => console.error('별점 저장 에러:', error));
  };

  const closeModal = () => setSelectedMovie(null);

  return (
    <div className="App">
      <h1>🎬 나의 AI 영화 추천 갤러리</h1>
      
      <form onSubmit={handleSearch} className="search-bar">
        <input 
          type="text" 
          placeholder="영화 제목을 검색해보세요 (예: Toy)" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button type="submit">검색</button>
      </form>

      {/* 🚀 넷플릭스 스타일 가로 스크롤 적용 부분 */}
      <div className="movie-carousel">
        {movies.map((movie, index) => (
          /* ✅ 고유한 키 값을 위해 백틱(`)을 사용해 movie_id와 index를 조합했습니다. */
          <div 
            key={`${movie.movie_id}-${index}`} 
            className="movie-card" 
            onClick={() => handleMovieClick(movie)}
          >
            <h3>{movie.title}</h3>
            <p>🍿 {movie.genres.split('|').join(', ')}</p>
          </div>
        ))}
      </div>

      {movies.length > 0 && (
        <button className="load-more-btn" onClick={() => fetchMovies(false)}>
          영화 더 보기 🍿
        </button>
      )}

      {selectedMovie && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={closeModal}>✕</button>
            <h2 className="modal-title"><span className="highlight">'{selectedMovie.title}'</span> 맘에 드셨나요?</h2>
            
            <div className="rating-box">
              <p>이 영화, 내 평점은?</p>
              <div className="stars">
                {[1, 2, 3, 4, 5].map((num) => (
                  <button key={num} className="star-btn" onClick={() => handleRating(num)}>{num}점</button>
                ))}
              </div>
            </div>

            <p className="modal-subtitle">AI가 분석한 취향 저격 추천 영화입니다 👀</p>
            {isLoading ? (
              <div className="loading-box">
                <p>🤖 AI가 분석 중...</p>
              </div>
            ) : (
              <div className="recommendation-list">
                {recommendations.map((rec, recIndex) => (
                  /* ✅ 추천 목록에도 중복 키 방지를 위해 index를 활용했습니다. */
                  <div key={`${rec.movie_id}-${recIndex}`} className="rec-card">
                    <h4>{rec.title}</h4>
                    <p>{rec.genres.split('|').join(', ')}</p>
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