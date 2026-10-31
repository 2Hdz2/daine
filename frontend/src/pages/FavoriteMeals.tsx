import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../api/client';
import toast from 'react-hot-toast';
import { Loader, Trash2, Eye } from 'lucide-react';

export const FavoriteMeals: React.FC = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [sortBy, setSortBy] = useState<'rating' | 'date' | 'frequency'>('rating');

  React.useEffect(() => {
    loadFavorites();
    loadStats();
  }, []);

  const loadFavorites = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.getFavorites();
      setFavorites(res.data);
    } catch (error: any) {
      toast.error('Failed to load favorites');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await apiClient.getUserStats();
      setStats(res.data);
    } catch (error) {
      // Stats optional
    }
  };

  const handleDeleteFavorite = async (favoriteId: number) => {
    if (!confirm('Remove from favorites?')) return;
    try {
      await apiClient.deleteFavorite(favoriteId);
      setFavorites(favorites.filter(f => f.id !== favoriteId));
      toast.success('Removed from favorites');
    } catch (error: any) {
      toast.error('Failed to remove');
    }
  };

  const handleUpdateRating = async (favoriteId: number, newRating: number) => {
    try {
      await apiClient.updateFavorite(favoriteId, { user_rating: newRating });
      setFavorites(favorites.map(f => 
        f.id === favoriteId ? { ...f, user_rating: newRating } : f
      ));
      toast.success('Rating updated');
    } catch (error: any) {
      toast.error('Failed to update rating');
    }
  };

  const getSortedFavorites = () => {
    switch (sortBy) {
      case 'rating':
        return [...favorites].sort((a, b) => (b.user_rating || 0) - (a.user_rating || 0));
      case 'date':
        return [...favorites].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case 'frequency':
        return [...favorites].sort((a, b) => (b.times_recommended || 0) - (a.times_recommended || 0));
      default:
        return favorites;
    }
  };

  const sortedFavorites = getSortedFavorites();

  return (
    <div className="min-h-screen bg-mist p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-forest">Favorite Meals</h1>
          <p className="text-forest/80 mt-2">Your saved favorite meal recommendations</p>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-sage rounded-lg border border-sage p-4">
              <div className="text-2xl font-bold text-forest/80">{stats.total_favorite_meals}</div>
              <div className="text-sm text-forest/80">Favorite Meals</div>
            </div>
            <div className="bg-sage rounded-lg border border-sage p-4">
              <div className="text-2xl font-bold text-forest/80">{stats.total_recommendations_generated}</div>
              <div className="text-sm text-forest/80">Recommendations</div>
            </div>
            <div className="bg-sage rounded-lg border border-sage p-4">
              <div className="text-2xl font-bold text-forest/80">
                {Math.round((stats.total_favorite_meals / (stats.total_recommendations_generated || 1)) * 100)}%
              </div>
              <div className="text-sm text-forest/80">Saved Rate</div>
            </div>
          </div>
        )}

        {/* Sort Controls */}
        <div className="mb-6 flex gap-2">
          <span className="text-sm font-semibold text-forest self-center">Sort by:</span>
          {(['rating', 'date', 'frequency'] as const).map(option => (
            <button
              key={option}
              onClick={() => setSortBy(option)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors capitalize ${
                sortBy === option
                  ? 'bg-lime text-forest'
                  : 'bg-sage text-forest hover:bg-sage/80'
              }`}
            >
              {option}
            </button>
          ))}
        </div>

        {/* Favorites List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="animate-spin text-forest/70" size={32} />
          </div>
        ) : favorites.length === 0 ? (
          <div className="bg-sage rounded-lg border border-sage p-12 text-center">
            <p className="text-forest/80 text-lg mb-4">No favorite meals yet</p>
            <p className="text-forest/70 mb-6">Start generating recommendations and save your favorites!</p>
            <button
              onClick={() => navigate('/generate-meal-prep')}
              className="bg-lime hover:bg-lime/90 text-forest font-semibold py-2 px-6 rounded-lg transition-colors"
            >
              Generate Recommendations
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedFavorites.map(favorite => (
              <div key={favorite.id} className="bg-sage rounded-lg border border-sage overflow-hidden hover:shadow-lg transition-shadow">
                {/* Card Content */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-forest">{favorite.food_name}</h3>
                      <p className="text-xs text-forest/70">
                        Added {new Date(favorite.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDeleteFavorite(favorite.id)}
                      className="text-forest/50 hover:text-forest/70 transition-colors"
                      title="Remove from favorites"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>

                  {/* Rating */}
                  <div className="mb-3">
                    <label className="text-sm font-semibold text-forest mb-2 block">Your Rating</label>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(star => (
                        <button
                          key={star}
                          onClick={() => handleUpdateRating(favorite.id, star)}
                          className={`text-xl transition-colors ${
                            star <= (favorite.user_rating || 0)
                              ? 'text-forest/50'
                              : 'text-forest/50 hover:text-forest/50'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="bg-mist p-3 rounded-lg mb-3 text-sm text-forest/80 space-y-1">
                    <div className="flex justify-between">
                      <span>Recommended:</span>
                      <span className="font-semibold">{favorite.times_recommended || 0}x</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last score:</span>
                      <span className="font-semibold">
                        {favorite.last_score ? Math.round(favorite.last_score) : 'N/A'}
                      </span>
                    </div>
                  </div>

                  {/* Notes */}
                  {favorite.personal_notes && (
                    <div className="mb-3 p-2 bg-mist rounded text-sm text-forest">
                      {favorite.personal_notes}
                    </div>
                  )}

                  {/* Action Button */}
                  <button
                    onClick={() => navigate(`/meal/${favorite.id}`)}
                    className="w-full bg-lime hover:bg-lime/90 text-forest font-semibold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye size={16} />
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FavoriteMeals;
