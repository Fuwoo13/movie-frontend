import { useEffect, useState } from 'react';
import './App.css';

function App() {
  const [movies, setMovies] = useState([]);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // 🌟 검색 및 페이징을 위한 State 추가
  const [searchTerm, setSearchTerm] = useState("");
  const [skip, setSkip] = useState(0);
  const limit = 20; // 한 번에 가져올 영화 개수

  // 🌟 영화 데이터를 백엔드에서 가져오는 함수
  const fetchMovies = (isReset = false) => {
    // 새로 검색하는 거라면 0부터, 더 보기라면 기존 skip부터 시작
    const currentSkip = isReset ? 0 : skip;
    
    fetch(`https://movie-backend-ebkm.onrender.com/movies?skip=${currentSkip}&limit=${limit}&search=${searchTerm}`)
      .then((response) => response.json())
      .then((data) => {
        if (isReset) {
          setMovies(data); // 새로 검색 시 기존 목록을 덮어씀
        } else {
          setMovies((prev) => [...prev, ...data]); // 더 보기 시 기존 목록 아래에 이어 붙임
        }
        setSkip(currentSkip + limit); // 다음에 가져올 시작점 업데이트
      })
      .catch((error) => console.error('데이터 에러:', error));
  };

  // 1. 처음 화면이 켜질 때 영화 목록 1페이지 가져오기
  useEffect(() => {
    fetchMovies(true);
  }, []);

  // 🌟 2. 검색 버튼을 눌렀을 때 실행되는 함수
  const handleSearch = (e) => {
    e.preventDefault(); // 새로고침 방지
    fetchMovies(true);
  };

  // 3. 영화 카드를 클릭했을 때 실행되는 함수 (이전과 동일)
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

  // 4. 별점 버튼 기능 (이전과 동일)
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
      <h1>🎬 나의 AI 영화 추천 갤러리</h1>
      
      {/* 🌟 새로 추가되는 검색창 UI */}
      <form onSubmit={handleSearch} className="search-bar">
        <input 
          type="text" 
          placeholder="영화 제목을 검색해보세요 (예: Toy)" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <button type="submit">검색</button>
      </form>

      <div className="movie-grid">
        {movies.map((movie) => (
          <div key={movie.movie_id} className="movie-card" onClick={() => handleMovieClick(movie)}>
            <h3>{movie.title}</h3>
            <p>🍿 {movie.genres.split('|').join(', ')}</p>
          </div>
        ))}
      </div>

      {/* 🌟 더 보기 버튼 UI */}
      {movies.length > 0 && (
        <button className="load-more-btn" onClick={() => fetchMovies(false)}>
          영화 더 보기 🍿
        </button>
      )}

      {/* 팝업창 (모달) 코드는 이전과 동일하게 유지 */}
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
                {recommendations.map((rec) => (
                  <div key={rec.movie_id} className="rec-card">
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