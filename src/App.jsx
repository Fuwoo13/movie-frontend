import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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

  return (
   <div className="App">
      <header className="main-header">
        <h1>9조 영화추천 AI 사이트</h1>
        <div className="search-container"> {/* 👈 컨테이너 하나 더 추가 */}
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

      {/* 팝업창(모달) 디자인도 일관성 있게 유지 */}
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
                    <h4>{rec.title}</h4>
                    <p>{rec.genres.split('|').join(' · ')}</p>
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